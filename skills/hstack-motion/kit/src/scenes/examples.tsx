import { Activity, Layers, Lock, Server, Terminal, Users } from "lucide-react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { between, pop, rise } from "../motion";
import { Sfx, SLOT_SPIN, SLOT_STAGGER, SlotWord, Stage, typed, TypeLine } from "../kit";
import { at, s } from "../script";
import { brand, mono } from "../theme";

// Example scenes that teach techniques (guides/motion/SKILL.md). Read them; don't ship them. A video made
// of these with new words looks like every other video from this kit. Each reads its timing from its
// script line with `at`.

// Intro: "Introducing" types, the logo lands with a ring of light, and the name spins in on slot reels.
export function Intro() {
  const frame = useCurrentFrame();
  const word = at("intro", "Introducing");
  const land = at("intro", brand.name.split(" ")[0]) - 6;
  const logo = rise(frame, land, true);
  const ring = between(frame, land, land + s(0.9), 0, 1);
  return <Stage>
    <Sfx name="typing" at={word} length={s(0.5)} volume={0.35} />
    <Sfx name="reveal" at={land} volume={0.4} />
    <Sfx name="slot" at={land + 2} volume={0.5} />
    {brand.name.split("").map((_, i) => <Sfx key={i} name="tick" at={land + 4 + SLOT_SPIN + i * SLOT_STAGGER} volume={0.18} />)}
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
      <TypeLine text="Introducing" at={word} cps={26} size={44} cursor={frame < land} style={{ color: brand.muted }} />
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 34, height: 190 }}>
        <span style={{ position: "absolute", left: -80, top: -65, width: 320, height: 320, borderRadius: 999, border: `5px solid ${brand.accent}`, transform: `scale(${0.4 + ring * 2})`, opacity: frame >= land ? 1 - ring : 0 }} />
        <Img src={staticFile(brand.logo)} style={{ width: 150, transform: `scale(${logo}) rotate(${(1 - logo) * -50}deg)`, opacity: Math.min(1, logo * 2) }} />
        {frame >= land && <SlotWord text={brand.name} at={land + 4} size={150} />}
      </div>
    </AbsoluteFill>
  </Stage>;
}

// Nodes: features pop in one by one around a circle, then lines connect them to the logo with pulses.
const FEATURES: [string, typeof Lock][] = [["Encrypted", Lock], ["Environments", Layers], ["Access", Users], ["Audit trail", Activity], ["CLI", Terminal], ["Self-host", Server]];
export function Nodes() {
  const frame = useCurrentFrame();
  const start = s(0.25), link = at("nodes", "one") - 8;
  const center = { x: 960, y: 560 }, radius = 380;
  const hub = rise(frame, link - 6, true);
  const place = (i: number) => {
    const a = -Math.PI / 2 + (i / FEATURES.length) * Math.PI * 2;
    return { x: center.x + Math.cos(a) * radius, y: center.y + Math.sin(a) * radius };
  };
  return <Stage>
    {FEATURES.map((_, i) => <Sfx key={i} name="blip" at={start + i * 6} volume={0.35} />)}
    <Sfx name="data" at={link} volume={0.3} />
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <circle cx={center.x} cy={center.y} r={radius} fill="none" stroke={brand.line} strokeWidth={2} strokeDasharray="6 10" />
      {FEATURES.map((_, i) => {
        const { x, y } = place(i);
        const draw = between(frame, link + i * 3, link + i * 3 + 12, 0, 1);
        const pulse = ((frame - link + i * 7) % 40) / 40;
        return <g key={i}>
          <line x1={x} y1={y} x2={x + (center.x - x) * draw} y2={y + (center.y - y) * draw} stroke={brand.ink} strokeWidth={3} strokeLinecap="round" />
          {draw >= 1 && <circle cx={x + (center.x - x) * pulse} cy={y + (center.y - y) * pulse} r={7} fill={brand.accent} stroke={brand.ink} strokeWidth={2} />}
        </g>;
      })}
    </svg>
    {FEATURES.map(([label, Icon], i) => {
      const { x, y } = place(i);
      const p = rise(frame, start + i * 6, true);
      const lit = frame >= link + i * 3 + 12;
      return <div key={label} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${p})`, display: "flex", alignItems: "center", gap: 14, padding: "14px 22px 14px 14px", borderRadius: 999, background: "#fff", border: `2px solid ${lit ? brand.ink : brand.line}`, whiteSpace: "nowrap", boxShadow: "0 20px 50px -20px rgba(0,0,0,.3)" }}>
        <span style={{ width: 50, height: 50, borderRadius: 999, display: "grid", placeItems: "center", background: lit ? brand.accent : "#f1f1ec" }}><Icon size={26} color={brand.ink} /></span>
        <span style={{ fontSize: 28, fontWeight: 650 }}>{label}</span>
      </div>;
    })}
    <div style={{ position: "absolute", left: center.x, top: center.y, transform: `translate(-50%, -50%) scale(${0.5 + hub * 0.5})`, opacity: Math.min(1, hub * 2), width: 220, height: 220, borderRadius: 999, background: "#fff", border: `4px solid ${brand.ink}`, display: "grid", placeItems: "center", boxShadow: `0 0 0 ${10 + Math.sin(frame / 6) * 4}px ${brand.accent}73` }}>
      <Img src={staticFile(brand.logo)} style={{ width: 110 }} />
    </div>
  </Stage>;
}

// Words: one giant word rolls up out of a mask on each spoken word, with its command typed under it.
const VERBS: [string, string][] = [["BUILD.", "product build"], ["SHIP.", "product deploy"], ["GROW.", "product invite team@example.com"]];
export function Words() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const times = VERBS.map(([w]) => at("words", w.replace(".", "")));
  const current = Math.max(0, times.filter((t) => frame >= t - 4).length - 1);
  const start = times[current], next = times[current + 1] ?? durationInFrames + 20;
  const p = rise(frame, start - 4, true);
  const out = between(frame, next - 11, next - 4, 0, 1);
  return <Stage>
    {times.map((t, i) => <Sfx key={i} name="slot" at={t - 6} length={s(0.5)} volume={0.35} />)}
    <div style={{ position: "absolute", left: 160, top: 360, height: 260, width: 1600, overflow: "hidden" }}>
      <div style={{ fontSize: 220, fontWeight: 850, letterSpacing: "-0.06em", lineHeight: "250px", transform: `translateY(${(1 - p) * 100 - out * 100}%)`, filter: `blur(${out * 10}px)` }}>{VERBS[current][0]}</div>
    </div>
    <div key={current} style={{ position: "absolute", left: 170, top: 650, fontFamily: mono, fontSize: 34, opacity: rise(frame, start) }}>
      <span style={{ background: brand.accent, padding: "0 8px", borderRadius: 6, marginRight: 12 }}>❯</span>{typed(VERBS[current][1], frame, start, 50)}
    </div>
  </Stage>;
}

// Bars: what each option costs, growing on the word, a counter climbing, and a share-of-price badge.
// Every number comes from the code or a dated source, footnoted.
const OPTIONS = [
  { name: "Competitor A", note: "Team · $20 per user", amount: 200, ours: false },
  { name: "Competitor B", note: "Pro · $18 per user", amount: 180, ours: false },
  { name: "Product", note: "Team · one price", amount: 5, ours: true },
];
export function Bars() {
  const frame = useCurrentFrame();
  const ourAt = at("bars", "fraction") - 6;
  const max = Math.max(...OPTIONS.map((o) => o.amount));
  return <Stage>
    {OPTIONS.map((o, i) => <Sfx key={i} name={o.ours ? "success" : "ratchet"} at={o.ours ? ourAt : 4 + i * 8} length={o.ours ? undefined : s(0.7)} volume={0.3} />)}
    <div style={{ position: "absolute", left: 160, top: 120, fontSize: 84, fontWeight: 800, letterSpacing: "-0.05em", ...pop(frame, 4) }}>
      <span style={{ background: brand.accent, padding: "0 16px", borderRadius: 14 }}>A fraction of the price.</span>
    </div>
    <div style={{ position: "absolute", left: 160, top: 400, display: "grid", gap: 40 }}>
      {OPTIONS.map((o, i) => {
        const t = o.ours ? ourAt : 4 + i * 8;
        const grow = between(frame, t, t + s(0.7), 0, 1);
        return <div key={o.name} style={{ display: "grid", gridTemplateColumns: "360px 1fr", alignItems: "center", gap: 30, opacity: rise(frame, t - 4) }}>
          <div><div style={{ fontSize: 36, fontWeight: 700 }}>{o.name}</div><div style={{ fontSize: 22, color: brand.muted }}>{o.note}</div></div>
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <span style={{ height: 64, width: Math.max(14, (o.amount / max) * 900 * grow), borderRadius: 14, background: o.ours ? brand.accent : "#1c1c1f" }} />
            <span style={{ fontSize: 54, fontWeight: 800 }}>${Math.round(o.amount * grow)}</span>
          </div>
        </div>;
      })}
    </div>
    <div style={{ position: "absolute", left: 160, bottom: 50, fontSize: 18, color: brand.muted }}>[NEED: dated sources for every price shown]</div>
  </Stage>;
}

// Outro: the logo, the tag line typed, and the website in a pill.
export function Outro() {
  const frame = useCurrentFrame();
  const pop_ = rise(frame, s(0.15), true);
  const urlAt = at("outro", "team.") + 6;
  return <Stage>
    <Sfx name="impact" at={s(0.15)} volume={0.45} />
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <Img src={staticFile(brand.logo)} style={{ width: 170, transform: `scale(${pop_}) rotate(${(1 - pop_) * -40}deg)` }} />
      <TypeLine text="Made for your team." at={at("outro", "Made")} cps={34} size={50} cursor={false} />
      <div style={{ fontSize: 36, fontWeight: 700, padding: "10px 28px", borderRadius: 999, background: brand.accent, ...pop(frame, urlAt) }}>{brand.url}</div>
    </AbsoluteFill>
  </Stage>;
}
