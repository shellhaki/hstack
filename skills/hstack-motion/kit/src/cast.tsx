import { random, useCurrentFrame } from "remotion";
import { rise } from "./motion";

// The cast (optional): soft blob characters with pill eyes, drawn as SVG so they can blink, bounce and react.
// Each shape and color has a role in the video.

export type Shape = "circle" | "squircle" | "triangle" | "cloud" | "drop" | "pill";
export type Mood = "calm" | "happy" | "worried" | "focused";

export const BOT = {
  small: { shape: "circle" as Shape, color: "#f2662b" },     // the small model
  frontier: { shape: "squircle" as Shape, color: "#2f80ed" }, // the frontier model
  teal: { shape: "squircle" as Shape, color: "#12b5a6" },
  purple: { shape: "squircle" as Shape, color: "#8b5cf6" },
  pink: { shape: "triangle" as Shape, color: "#ec3d8f" },
  yellow: { shape: "cloud" as Shape, color: "#f59e0b" },
  brown: { shape: "circle" as Shape, color: "#8a5a3c" },
  grey: { shape: "drop" as Shape, color: "#6b7280" },
  ink: { shape: "circle" as Shape, color: "#111111" },
};

function Body({ shape, color }: { shape: Shape; color: string }) {
  switch (shape) {
    case "squircle":
      return <rect x={8} y={8} width={84} height={84} rx={26} fill={color} transform="rotate(-8 50 50)" />;
    case "triangle":
      return <path d="M50 8 C55 8 59 11 62 16 L93 76 C98 86 92 94 81 94 L19 94 C8 94 2 86 7 76 L38 16 C41 11 45 8 50 8Z" fill={color} />;
    case "cloud":
      return <g fill={color}><circle cx={34} cy={58} r={28} /><circle cx={66} cy={58} r={28} /><circle cx={50} cy={38} r={28} /><rect x={20} y={58} width={60} height={30} rx={14} /></g>;
    case "drop":
      return <path d="M50 6 C50 6 88 44 88 64 A38 38 0 0 1 12 64 C12 44 50 6 50 6Z" fill={color} />;
    case "pill":
      return <rect x={10} y={20} width={80} height={70} rx={30} fill={color} />;
    default:
      return <circle cx={50} cy={52} r={44} fill={color} />;
  }
}

function Eyes({ mood, blink, look }: { mood: Mood; blink: boolean; look: number }) {
  const y = 50, dx = 12 + look * 6;
  if (mood === "happy") {
    // closed, smiling eyes
    return <g fill="none" stroke="white" strokeWidth={6} strokeLinecap="round">
      <path d={`M${50 - dx - 7} ${y + 2} q7 -9 14 0`} />
      <path d={`M${50 + dx - 7} ${y + 2} q7 -9 14 0`} />
    </g>;
  }
  const h = blink ? 2 : mood === "worried" ? 13 : 18;
  const w = mood === "focused" ? 9 : 8;
  const tilt = mood === "worried" ? 14 : 8;
  return <g fill="white">
    <rect x={50 - dx - w / 2 + look * 4} y={y - h / 2} width={w} height={h} rx={w / 2} transform={`rotate(${tilt} ${50 - dx} ${y})`} />
    <rect x={50 + dx - w / 2 + look * 4} y={y - h / 2} width={w} height={h} rx={w / 2} transform={`rotate(${mood === "worried" ? -tilt : tilt} ${50 + dx} ${y})`} />
  </g>;
}

// Bot is one character. It lands with a squash at `at`, idles with a gentle bob, and blinks now and then.
export function Bot({ kind = "small", shape, color, size = 160, at = 0, mood = "calm", look = 0, seed = 0, hop = 0, style }: {
  kind?: keyof typeof BOT; shape?: Shape; color?: string; size?: number; at?: number; mood?: Mood; look?: number;
  seed?: number; hop?: number; style?: React.CSSProperties;
}) {
  const f = useCurrentFrame();
  const b = BOT[kind];
  const land = rise(f, at, true);
  const t = f - at;
  const bob = Math.sin((t + seed * 17) / 14) * 0.025;
  const blinkPeriod = 80 + Math.floor(random(`blink${seed}`) * 50);
  const blink = t > 0 && (t + seed * 13) % blinkPeriod < 5;
  const jump = hop ? Math.max(0, Math.sin(((f - hop) / 18) * Math.PI)) * (f >= hop && f < hop + 18 ? 1 : 0) : 0;
  const sx = 1 + (1 - land) * 0.25 - bob, sy = land * (1 + bob);
  return <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible", transform: `translateY(${-jump * size * 0.35}px) scale(${sx}, ${Math.max(0, sy)})`, transformOrigin: "50% 100%", opacity: Math.min(1, land * 3), ...style }}>
    <Body shape={shape ?? b.shape} color={color ?? b.color} />
    <Eyes mood={mood} blink={blink && mood !== "happy"} look={look} />
  </svg>;
}
