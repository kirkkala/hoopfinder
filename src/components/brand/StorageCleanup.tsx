"use client";

import { useEffect } from "react";
import { clearObsoleteStorage } from "@/lib/visit";

/** Drops storage keys from earlier versions. Mounted once from the root layout. */
export function StorageCleanup() {
  useEffect(() => {
    clearObsoleteStorage();
  }, []);
  return null;
}
