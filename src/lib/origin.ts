"use client";

import { useSyncExternalStore } from "react";
import type { Coordinates } from "@/lib/geo";

export type LocationStatus =
  | "idle"
  | "pending"
  | "granted"
  | "denied"
  | "unavailable";

const ORIGIN_KEY = "hoopfinder-origin";
const listeners = new Set<() => void>();
let snapshot: { raw: string | null; value: Coordinates | null } | undefined;

function emit() {
  for (const listener of listeners) listener();
}

export function readOrigin(): Coordinates | null {
  try {
    const raw = sessionStorage.getItem(ORIGIN_KEY);
    if (snapshot && snapshot.raw === raw) {
      return snapshot.value;
    }
    let value: Coordinates | null = null;
    if (raw) {
      const saved = JSON.parse(raw) as { lat?: unknown; lon?: unknown };
      if (Number.isFinite(saved.lat) && Number.isFinite(saved.lon)) {
        value = { lat: saved.lat as number, lon: saved.lon as number };
      }
    }
    snapshot = { raw, value };
    return value;
  } catch {
    return null;
  }
}

export function writeOrigin(coords: Coordinates) {
  try {
    const raw = JSON.stringify(coords);
    sessionStorage.setItem(ORIGIN_KEY, raw);
    snapshot = { raw, value: coords };
    emit();
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function subscribeOrigin(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function useOrigin(): Coordinates | null {
  return useSyncExternalStore(subscribeOrigin, readOrigin, () => null);
}

export function requestOrigin(
  onStatus: (status: Exclude<LocationStatus, "idle">) => void,
) {
  if (!navigator.geolocation) {
    onStatus("unavailable");
    return;
  }

  onStatus("pending");
  navigator.geolocation.getCurrentPosition(
    (position) => {
      writeOrigin({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      });
      onStatus("granted");
    },
    () => onStatus("denied"),
    { enableHighAccuracy: true, timeout: 10_000 },
  );
}
