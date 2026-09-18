import { ImageResponse } from "next/og";
import { APP_NAME } from "@/lib/constants";
import { getCopy } from "@/lib/copy";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const ASPHALT = "#07070a";
const PANEL = "#14141a";
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

function MapCard() {
  const dots = [
    { left: 72, top: 88, size: 18 },
    { left: 168, top: 64, size: 22 },
    { left: 236, top: 128, size: 16 },
    { left: 118, top: 176, size: 20 },
    { left: 210, top: 210, size: 16 },
    { left: 48, top: 230, size: 14 },
    { left: 280, top: 96, size: 14 },
    { left: 156, top: 268, size: 18 },
  ];

  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: 360,
        height: 360,
        borderRadius: 36,
        background: PANEL,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0, 0, 0, 0.55)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 220,
          height: 220,
          borderRadius: 999,
          border: "18px solid rgba(255, 67, 57, 0.12)",
          left: 86,
          top: 78,
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
      <div
        style={{
          position: "absolute",
          left: 148,
          top: 132,
          width: 36,
          height: 36,
          borderRadius: 999,
          background: GOLD,
          border: "3px solid #ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#111111",
          fontSize: 16,
          fontFamily: "Outfit",
          fontWeight: 500,
        }}
      >
        12
      </div>
    </div>
  );
}

export async function generateHomeOgImage() {
  const copy = getCopy("fi");
  const fonts = await loadOgFonts();

  return new ImageResponse(
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
      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          justifyContent: "space-between",
          padding: "72px 80px",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 620 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <BasketballMark size={72} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: 999,
                background: "rgba(255, 212, 130, 0.16)",
                color: GOLD,
                fontSize: 22,
                fontFamily: "Outfit",
                letterSpacing: "0.16em",
                padding: "8px 16px",
              }}
            >
              BETA
            </div>
          </div>
          <div
            style={{
              marginTop: 28,
              fontFamily: "Bebas Neue",
              fontSize: 108,
              lineHeight: 0.9,
              letterSpacing: "0.04em",
              color: "#ffffff",
            }}
          >
            {APP_NAME}
          </div>
          <div
            style={{
              marginTop: 12,
              fontFamily: "Outfit",
              fontSize: 32,
              color: MUTED,
            }}
          >
            {copy.tagline}
          </div>
          <div
            style={{
              marginTop: 28,
              fontFamily: "Outfit",
              fontSize: 28,
              lineHeight: 1.35,
              color: INK,
              maxWidth: 580,
            }}
          >
            {copy.metaDescription}
          </div>
        </div>
        <MapCard />
      </div>
    </div>,
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          position: "relative",
          width: "100%",
          height: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <BasketballMark size={56} />
          <div
            style={{
              fontFamily: "Bebas Neue",
              fontSize: 42,
              letterSpacing: "0.08em",
              color: "#ffffff",
            }}
          >
            {APP_NAME}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: 980 }}>
          <div
            style={{
              fontFamily: "Bebas Neue",
              fontSize: 84,
              lineHeight: 0.95,
              letterSpacing: "0.03em",
              color: "#ffffff",
            }}
          >
            {name}
          </div>
          <div
            style={{
              marginTop: 18,
              fontFamily: "Outfit",
              fontSize: 32,
              color: MUTED,
            }}
          >
            {place}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontFamily: "Outfit",
              fontSize: 26,
              color: GOLD,
            }}
          >
            {copy.tagline}
          </div>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 999,
              background: MARKER,
              border: "3px solid #ffffff",
            }}
          />
        </div>
      </div>
    </div>,
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
