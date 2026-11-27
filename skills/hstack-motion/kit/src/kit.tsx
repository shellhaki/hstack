import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Audio, random, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { between, rise } from "./motion";
import { FPS, s } from "./script";
import { brand, mono, sans, stage } from "./theme";
import type { SfxName } from "./sfx-list";
import made from "./sfx.json";

// The kit's pieces. Scenes are built from these and from motion.ts; see guides/motion/SKILL.md.

// Stage is a scene's background, as set in theme.ts `stage` (or `dark` for the dark stage). Pass
// `background` to override it for one scene.
const PATTERNS = {
  dots: (c: string) => ({ backgroundImage: `radial-gradient(${c} 1.4px, transparent 1.6px)`, backgroundSize: "36px 36px" }),
  grid: (c: string) => ({ backgroundImage: `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`, backgroundSize: "60px 60px" }),
  lines: (c: string) => ({ backgroundImage: `linear-gradient(${c} 1px, transparent 1px)`, backgroundSize: "100% 48px" }),
};
export function Stage({ children, dark = false, background }: { children: ReactNode; dark?: boolean; background?: string }) {
  const frame = useCurrentFrame();
  const bg = background ?? (dark ? brand.night : stage.background);
  const ink = dark ? "rgba(255,255,255,.08)" : "rgba(9,9,11,.09)";
  return <AbsoluteFill style={{ background: bg, color: dark ? "#fafafa" : stage.text, fontFamily: sans, overflow: "hidden" }}>
    {stage.pattern !== "none" && <AbsoluteFill style={{ ...PATTERNS[stage.pattern](ink), backgroundPosition: `0 ${-frame * 0.3}px`, maskImage: "radial-gradient(ellipse 75% 70% at 50% 50%, black 30%, transparent 80%)" }} />}
    {stage.glow && <AbsoluteFill style={{ background: `radial-gradient(1000px 420px at 50% 100%, ${brand.accent}38, transparent 70%)` }} />}
    {children}
    {stage.grain > 0 && <AbsoluteFill style={{ opacity: stage.grain, mixBlendMode: dark ? "screen" : "multiply", pointerEvents: "none" }}>
      <svg width="100%" height="100%"><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 10} /></filter><rect width="100%" height="100%" filter="url(#grain)" /></svg>
    </AbsoluteFill>}
  </AbsoluteFill>;
}

// typed is how much of `text` shows at `frame`, typing `cps` characters a second from `at`.
export const typed = (text: string, frame: number, at: number, cps = 22) =>
  text.slice(0, Math.max(0, Math.floor(((frame - at) / FPS) * cps)));

// TypeLine types a sentence; each word gets a brand-color marker as it lands, which then fades.
export function TypeLine({ text, at, cps = 24, size = 44, cursor = true, color = brand.ink, style }: {
  text: string; at: number; cps?: number; size?: number; cursor?: boolean; color?: string; style?: CSSProperties;
}) {
  const frame = useCurrentFrame();
  const shown = typed(text, frame, at, cps);
  let index = 0;
  const words = shown.split(/(\s+)/).map((w, i) => {
    const start = index;
    index += w.length;
    if (/^\s+$/.test(w)) return <span key={i}>{w}</span>;
    const finishedAt = at + ((start + w.length) / cps) * FPS;
    const fresh = frame < finishedAt + s(0.35);
    return <span key={i} style={{ color, background: fresh ? brand.accent : undefined, borderRadius: 6, padding: "0 .08em", margin: "0 -.08em" }}>{w}</span>;
  });
  const blink = shown.length < text.length || Math.floor(frame / s(0.45)) % 2 === 0;
  return <div style={{ fontSize: size, fontWeight: 600, letterSpacing: "-0.02em", whiteSpace: "pre", color, ...style }}>
    {words}
    {cursor && blink && <span style={{ display: "inline-block", width: Math.max(3, size * 0.06), height: size * 0.95, marginLeft: 3, verticalAlign: "-0.12em", background: color }} />}
  </div>;
}

// Slam is a huge word that hits the screen: in from too big and blurred, out the same way.
// On the dark stage, pass `dark` so the glow behind the word matches the background.
export function Slam({ word, from, to, size = 190, dark = false }: { word: string; from: number; to: number; size?: number; dark?: boolean }) {
  const frame = useCurrentFrame();
  if (frame < from || frame > to) return null;
  const p = rise(frame, from, true);
  const out = between(frame, to - 6, to, 0, 1);
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
    <span style={{ fontSize: size, fontWeight: 800, letterSpacing: "-0.05em", transform: `scale(${1.35 - p * 0.35 + out * 0.2})`, filter: `blur(${(1 - Math.min(1, p)) * 14 + out * 14}px)`, opacity: Math.min(1, p * 1.6) * (1 - out), textShadow: `0 0 60px ${dark ? brand.night : stage.background}, 0 0 30px ${dark ? brand.night : stage.background}` }}>{word}</span>
  </AbsoluteFill>;
}

// SlotWord spells a word as a row of slot-machine reels: each letter spins through a blurred strip of
// random letters, and the reels stop left to right with a small bounce. Pair with the `slot` sound.
export const SLOT_SPIN = 18; // frames the first reel spins
export const SLOT_STAGGER = 4; // frames between one reel stopping and the next
export function SlotWord({ text, at, size, color = brand.ink }: { text: string; at: number; size: number; color?: string }) {
  const frame = useCurrentFrame();
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const line = size * 1.15;
  const strip = 14;
  return <span style={{ display: "inline-flex", fontSize: size, fontWeight: 800, letterSpacing: "-0.04em", color, height: line, overflow: "hidden", lineHeight: `${line}px` }}>
    {text.split("").map((ch, i) => {
      const t = spring({ frame: frame - at, fps: FPS, durationInFrames: SLOT_SPIN + i * SLOT_STAGGER, config: { damping: 13, stiffness: 110, mass: 0.9 } });
      const cells = Array.from({ length: strip }, (_, k) => letters[Math.floor(random(`slot-${i}-${k}`) * letters.length)]).concat(ch);
      // The reel is as wide as its final letter, so the word keeps its real spacing while it spins.
      return <span key={i} style={{ display: "inline-block", position: "relative", height: line, overflow: "hidden" }}>
        <span style={{ visibility: "hidden" }}>{ch}</span>
        <span style={{ position: "absolute", top: 0, left: "50%", display: "grid", justifyItems: "center", transform: `translateX(-50%) translateY(${-t * strip * line}px)`, filter: t < 0.97 ? `blur(${(1 - t) * 6 + 0.5}px)` : undefined }}>
          {cells.map((c, k) => <span key={k} style={{ height: line, color: k === strip ? color : brand.muted }}>{c}</span>)}
        </span>
      </span>;
    })}
  </span>;
}

// Glitchy splits a word into offset color channels and slices it, while `on`. Pass `dark` on the dark
// stage: the channels then add light (screen) instead of darkening (multiply), so they stay visible.
export function Glitchy({ children, on, color = "#dc2626", dark = false }: { children: string; on: boolean; color?: string; dark?: boolean }) {
  const frame = useCurrentFrame();
  const dx = on ? (random(`g${frame}`) - 0.5) * 22 : 0;
  const blend = dark ? "screen" : "multiply";
  return <span style={{ position: "relative", display: "inline-block", whiteSpace: "nowrap", color }}>
    {on && <span style={{ position: "absolute", left: dx, top: 0, color: "#22d3ee", mixBlendMode: blend, opacity: 0.8 }}>{children}</span>}
    {on && <span style={{ position: "absolute", left: -dx, top: 0, color: brand.accent, mixBlendMode: blend, opacity: 0.9 }}>{children}</span>}
    <span style={{ position: "relative", clipPath: on ? `inset(${random(`c${frame}`) * 40}% 0 ${random(`d${frame}`) * 30}% 0)` : undefined }}>{children}</span>
  </span>;
}

// Pill is a rounded caption or chip.
export function Pill({ children, filled, style }: { children: ReactNode; filled?: boolean; style?: CSSProperties }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "14px 28px", borderRadius: 999, background: filled ? brand.accent : "#fff", border: `2px solid ${filled ? brand.accent : brand.line}`, boxShadow: "0 20px 50px -20px rgba(0,0,0,.3)", fontSize: 32, fontWeight: 650, letterSpacing: "-0.02em", ...style }}>{children}</span>;
}

// Window is a dark app or terminal window: traffic lights and an optional title or URL.
export function Window({ children, title, width, style }: { children: ReactNode; title?: string; width: number; style?: CSSProperties }) {
  return <div style={{ position: "relative", width, borderRadius: 22, overflow: "hidden", background: "#0d0d0f", color: "#e4e4e7", boxShadow: "0 50px 110px -35px rgba(0,0,0,.5)", ...style }}>
    <div style={{ height: 50, display: "flex", alignItems: "center", gap: 9, padding: "0 20px", borderBottom: "1px solid #1f1f22" }}>
      {["#ff5f57", "#febc2e", "#28c840"].map((col) => <span key={col} style={{ width: 12, height: 12, borderRadius: 6, background: col }} />)}
      {title && <span style={{ margin: "0 auto", fontFamily: mono, fontSize: 16, color: "#a1a1aa" }}>{title}</span>}
    </div>
    {children}
  </div>;
}

// Tilt swings its contents in from a 3D angle and keeps them floating, like a product shot.
export function Tilt({ children, at = 0, from = { x: 16, y: -14 }, rest = { x: 3, y: -3 }, style }: {
  children: ReactNode; at?: number; from?: { x: number; y: number }; rest?: { x: number; y: number }; style?: CSSProperties;
}) {
  const frame = useCurrentFrame();
  const p = rise(frame, at, true);
  const float = Math.sin((frame - at) / 70) * 0.8;
  return <div style={{ perspective: 2400, ...style }}>
    <div style={{ transform: `rotateX(${from.x + (rest.x - from.x) * p + float}deg) rotateY(${from.y + (rest.y - from.y) * p + float * 0.6}deg) translateZ(${(1 - p) * -260}px) translateY(${(1 - p) * 60}px)`, transformStyle: "preserve-3d", opacity: Math.min(1, rise(frame, at) * 1.4) }}>{children}</div>
  </div>;
}

// Shine sweeps a band of light across its contents every `every` frames from `at`: a product window
// catching the light. Give it the same border radius as what it wraps.
export function Shine({ children, at = 0, every = s(3), radius = 22 }: { children: ReactNode; at?: number; every?: number; radius?: number }) {
  const frame = useCurrentFrame();
  const t = frame < at ? -1 : ((frame - at) % every) / every;
  const x = between(t, 0, 0.45, -30, 130); // the sweep takes the first 45% of each cycle, then rests
  return <div style={{ position: "relative", borderRadius: radius, overflow: "hidden" }}>
    {children}
    {t >= 0 && <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `linear-gradient(105deg, transparent ${x - 14}%, rgba(255,255,255,.16) ${x}%, transparent ${x + 14}%)` }} />}
  </div>;
}

// Sfx plays a generated sound effect at `at` if it exists (bun run sfx). `length` cuts it short, in frames.
export function Sfx({ name, at, volume = 0.4, length }: { name: SfxName; at: number; volume?: number; length?: number }) {
  if (!(made as string[]).includes(name)) return null;
  return <Sequence from={Math.max(0, at)} durationInFrames={length} layout="none" name={`sfx ${name}`}><Audio src={staticFile(`sfx/${name}.mp3`)} volume={volume} /></Sequence>;
}
