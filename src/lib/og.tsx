import { ImageResponse } from "next/og";
import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/constants";
import { getCopy } from "@/lib/copy";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/**
 * Facebook mobile (and Messenger) center-crops 1.91:1 images toward 1:1.
 * Keep titles, logos, and other essential copy inside this square; the
 * 285px gutters on each side are decorative and may be clipped.
 */
const OG_SAFE_SIDE = 630;
const OG_SAFE_PAD = 48;
const OG_SAFE_LEFT = (OG_SIZE.width - OG_SAFE_SIDE) / 2;
const OG_SAFE_CONTENT = OG_SAFE_SIDE - OG_SAFE_PAD * 2;

const ASPHALT = "#07070a";
const GOLD = "#ffd482";
const INK = "#f5f2ed";
const MUTED = "#b8b2a8";
const ORANGE = "#f97316";
const MARKER = "#ff4339";

/** Lucide Lab `basketball` — same mark as the site logo. */
function basketballSvg(size: number, color: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2.1 13.4A10.1 10.1 0 0 0 13.4 2.1"/><path d="m5 4.9 14 14.2"/><path d="M21.9 10.6a10.1 10.1 0 0 0-11.3 11.3"/></svg>`;
}

export function BasketballMark({
  size,
  color = ORANGE,
}: {
  size: number;
  color?: string;
}) {
  return (
    <img
      alt=""
      width={size}
      height={size}
      src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(basketballSvg(size, color))}`}
    />
  );
}

export async function loadOgFonts() {
  const [display, sans] = await Promise.all([
    loadGoogleFont("Bebas Neue", 400),
    loadGoogleFont("Outfit", 500),
  ]);
  return [
    { name: "Bebas Neue", data: display, style: "normal" as const, weight: 400 as const },
    { name: "Outfit", data: sans, style: "normal" as const, weight: 500 as const },
  ];
}

async function loadGoogleFont(family: string, weight: number) {
  const familyParam =
    weight === 400 ? family : `${family}:wght@${weight}`;
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(familyParam)}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
      },
    },
  ).then((response) => {
    if (!response.ok) throw new Error(`Font CSS ${response.status}`);
    return response.text();
  });
  const file = css.match(/src: url\(([^)]+)\)/)?.[1];
  if (!file) throw new Error(`No font file for ${family}`);
  const font = await fetch(file);
  if (!font.ok) throw new Error(`Font file ${font.status}`);
  return font.arrayBuffer();
}

function CourtArc() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        backgroundImage:
          "radial-gradient(circle at 78% 118%, transparent 32%, rgba(255, 212, 130, 0.14) 33%, transparent 34%)",
      }}
    >
      {Array.from({ length: 10 }, (_, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 36 + index * 64,
            height: 1,
            background: "rgba(255, 212, 130, 0.08)",
          }}
        />
      ))}
    </div>
  );
}

function MapField() {
  const ring = 460;
  const dots = [
    { left: 72, top: 118, size: 16 },
    { left: 168, top: 64, size: 20 },
    { left: 214, top: 268, size: 14 },
    { left: 96, top: 430, size: 18 },
    { left: 188, top: 540, size: 14 },
    { left: 980, top: 88, size: 18 },
    { left: 1088, top: 196, size: 16 },
    { left: 1024, top: 360, size: 22 },
    { left: 1110, top: 488, size: 14 },
    { left: 330, top: 56, size: 14 },
    { left: 848, top: 72, size: 16 },
    { left: 318, top: 548, size: 16 },
    { left: 836, top: 532, size: 14 },
  ];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: ring,
          height: ring,
          borderRadius: 999,
          border: "18px solid rgba(255, 67, 57, 0.12)",
          left: (OG_SIZE.width - ring) / 2,
          top: (OG_SIZE.height - ring) / 2,
        }}
      />
      {dots.map((dot) => (
        <div
          key={`${dot.left}-${dot.top}`}
          style={{
            position: "absolute",
            left: dot.left,
            top: dot.top,
            width: dot.size,
            height: dot.size,
            borderRadius: 999,
            background: MARKER,
            border: "3px solid #ffffff",
          }}
        />
      ))}
    </div>
  );
}

function OgSafeFrame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        left: OG_SAFE_LEFT,
        top: 0,
        width: OG_SAFE_SIDE,
        height: OG_SAFE_SIDE,
        padding: OG_SAFE_PAD,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: OG_SAFE_CONTENT,
          textAlign: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function OgCanvas({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: ASPHALT,
        color: INK,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <CourtArc />
      <MapField />
      {children}
    </div>
  );
}

function OgWordmark({
  nameSize,
  regionSize,
  direction = "row",
}: {
  nameSize: number;
  regionSize: number;
  direction?: "row" | "column";
}) {
  const region = getCopy("fi").region;
  const stacked = direction === "column";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: direction,
        alignItems: stacked ? "center" : "baseline",
        gap: Math.round(nameSize * (stacked ? 0.04 : 0.12)),
      }}
    >
      <div
        style={{
          fontFamily: "Bebas Neue",
          fontSize: nameSize,
          lineHeight: 0.9,
          letterSpacing: "0.04em",
          color: "#ffffff",
          textAlign: stacked ? "center" : "left",
        }}
      >
        {APP_NAME}
      </div>
      <div
        style={{
          fontFamily: "Bebas Neue",
          fontSize: regionSize,
          lineHeight: 0.9,
          letterSpacing: "0.04em",
          color: "rgba(255, 255, 255, 0.4)",
          textAlign: stacked ? "center" : "left",
        }}
      >
        {region}
      </div>
    </div>
  );
}

export async function generateHomeOgImage() {
  const copy = getCopy("fi");
  const fonts = await loadOgFonts();

  return new ImageResponse(
    <OgCanvas>
      <OgSafeFrame>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <BasketballMark size={56} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              borderRadius: 999,
              background: "rgba(255, 212, 130, 0.16)",
              color: GOLD,
              fontSize: 20,
              fontFamily: "Outfit",
              letterSpacing: "0.16em",
              padding: "8px 16px",
            }}
          >
            BETA
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 22 }}>
          <OgWordmark nameSize={88} regionSize={40} direction="column" />
        </div>
        <div
          style={{
            marginTop: 16,
            fontFamily: "Outfit",
            fontSize: 26,
            color: MUTED,
            textAlign: "center",
          }}
        >
          {copy.tagline}
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: "Outfit",
            fontSize: 22,
            lineHeight: 1.35,
            color: INK,
            textAlign: "center",
            width: OG_SAFE_CONTENT,
          }}
        >
          {copy.metaDescription}
        </div>
      </OgSafeFrame>
    </OgCanvas>,
    { ...OG_SIZE, fonts },
  );
}

export async function generateCourtOgImage({
  name,
  place,
}: {
  name: string;
  place: string;
}) {
  const copy = getCopy("fi");
  const fonts = await loadOgFonts();

  return new ImageResponse(
    <OgCanvas>
      <OgSafeFrame>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <BasketballMark size={40} />
          <OgWordmark nameSize={34} regionSize={22} />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 28,
            width: OG_SAFE_CONTENT,
          }}
        >
          <div
            style={{
              fontFamily: "Bebas Neue",
              fontSize: 64,
              lineHeight: 0.95,
              letterSpacing: "0.03em",
              color: "#ffffff",
              textAlign: "center",
              width: OG_SAFE_CONTENT,
            }}
          >
            {name}
          </div>
          <div
            style={{
              marginTop: 16,
              fontFamily: "Outfit",
              fontSize: 26,
              color: MUTED,
              textAlign: "center",
              width: OG_SAFE_CONTENT,
            }}
          >
            {place}
          </div>
        </div>
        <div
          style={{
            marginTop: 28,
            fontFamily: "Outfit",
            fontSize: 22,
            color: GOLD,
            textAlign: "center",
          }}
        >
          {copy.tagline}
        </div>
      </OgSafeFrame>
    </OgCanvas>,
    { ...OG_SIZE, fonts },
  );
}

export function iconImage(size: number) {
  const inset = Math.round(size * 0.18);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: ASPHALT,
      }}
    >
      <BasketballMark size={size - inset * 2} />
    </div>,
    { width: size, height: size },
  );
}
