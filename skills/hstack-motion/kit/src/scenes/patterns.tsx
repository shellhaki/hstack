import { FileText, Lock } from "lucide-react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { between, enter, pop, rise } from "../motion";
import { Glitchy, Sfx, Shine, Stage, Tilt, typed, Window } from "../kit";
import { s } from "../script";
import { brand, mono } from "../theme";

// More example scenes that teach techniques (guides/motion.md). Read them; don't ship them. They use
// fixed timings (s(...)) so they preview on their own in the Gallery composition.

// Chats: "how people do it today". Generic chat windows fill with messages, one ping each.
// Never draw a real app's logo or UI: the windows stay generic.
const THREADS = [
  { title: "#dev-team", messages: ["here's the .env for staging", "DATABASE_URL=postgres://admin:…", "thx 🙏"] },
  { title: "Group chat", messages: ["can someone send the API key again?", "sk_live_51H…"] },
  { title: "Direct message", messages: ["new laptop, what's the prod password", "check the doc from last month"] },
];
export function Chats() {
  const frame = useCurrentFrame();
  let k = 0;
  return <Stage>
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 48, perspective: 2400 }}>
      {THREADS.map((thread, i) => {
        const open = s(0.2) + i * 8;
        const in_ = enter(frame, open);
        return <div key={thread.title} style={{ width: 500, height: 560, borderRadius: 26, background: "#fff", border: `2px solid ${brand.line}`, boxShadow: "0 40px 90px -40px rgba(0,0,0,.35)", overflow: "hidden", ...in_, transform: `rotateY(${(i - 1) * 8}deg) ${in_.transform}` }}>
          <div style={{ padding: "20px 26px", borderBottom: `2px solid ${brand.line}`, fontSize: 26, fontWeight: 700 }}>{thread.title}</div>
          <div style={{ display: "grid", gap: 16, padding: 24 }}>
            {thread.messages.map((text, j) => {
              const t = open + s(0.35) + (k++) * 9;
              const mine = j % 2 === 1;
              return <div key={j} style={{ justifySelf: mine ? "end" : "start", maxWidth: 380, padding: "14px 20px", borderRadius: 20, fontSize: 24, lineHeight: 1.3, overflowWrap: "anywhere", background: mine ? brand.accent : "#f1f1ec", ...pop(frame, t) }}>
                <Sfx name="message" at={t} volume={0.25} />
                {text}
              </div>;
            })}
          </div>
        </div>;
      })}
    </AbsoluteFill>
  </Stage>;
}

// Cards: "what goes wrong". Cards fall in with a 3D tilt, then the key word glitches.
const PROBLEMS = ["Copied, pasted, forgotten", "No idea which is current", "Nobody can revoke access"];
export function Cards() {
  const frame = useCurrentFrame();
  const glitch = s(1.6);
  return <Stage>
    <Sfx name="glitch" at={glitch} volume={0.35} />
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 70, perspective: 2000 }}>
      <div style={{ display: "flex", gap: 36 }}>
        {PROBLEMS.map((text, i) => {
          const t = s(0.15) + i * 7;
          const p = rise(frame, t, true);
          return <div key={text} style={{ width: 440, padding: "40px 36px", borderRadius: 24, background: "#fff", border: `2px solid ${brand.line}`, fontSize: 36, fontWeight: 700, letterSpacing: "-0.02em", boxShadow: "0 40px 80px -40px rgba(0,0,0,.4)", transform: `translateY(${(1 - p) * -500}px) rotateX(${(1 - p) * 60}deg) rotateZ(${(1 - p) * (i - 1) * 8 + (i - 1) * 2}deg)`, opacity: Math.min(1, rise(frame, t) * 2) }}>
            <Sfx name="pop" at={t + 6} volume={0.25} />
            {text}
          </div>;
        })}
      </div>
      <div style={{ fontSize: 110, fontWeight: 800, letterSpacing: "-0.05em", ...enter(frame, glitch - 8) }}>
        Just <Glitchy on={frame >= glitch && frame < glitch + s(0.5)}>security risks.</Glitchy>
      </div>
    </AbsoluteFill>
  </Stage>;
}

// Encrypt: a secret scrambles into ciphertext, then the characters collapse into a lock.
const SECRET = "DATABASE_URL=postgres://admin:hunter2@db";
const CIPHER = "abcdef0123456789+/=";
export function Encrypt() {
  const frame = useCurrentFrame();
  const scramble = s(0.6), collapse = s(1.5), lock = collapse + 14;
  const shown = typed(SECRET, frame, s(0.1), 60);
  const done = between(frame, scramble, scramble + s(0.6), 0, 1); // share of characters scrambled
  const pull = between(frame, collapse, collapse + 16, 0, 1);
  const half = (SECRET.length - 1) / 2;
  return <Stage dark>
    <Sfx name="typing" at={s(0.1)} length={s(0.5)} volume={0.3} />
    <Sfx name="data" at={scramble} volume={0.35} />
    <Sfx name="impact" at={lock} volume={0.4} />
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", fontFamily: mono, fontSize: 46 }}>
        {shown.split("").map((ch, i) => {
          const changed = i / SECRET.length < done;
          const c = changed ? CIPHER[Math.floor(random(`c${i}-${Math.floor(frame / 3)}`) * CIPHER.length)] : ch;
          return <span key={i} style={{ display: "inline-block", width: "0.62em", textAlign: "center", color: changed ? brand.accent : "#fafafa", transform: `translateX(${(half - i) * 0.62 * 46 * pull}px) scale(${1 - pull})`, opacity: 1 - pull }}>{c}</span>;
        })}
      </div>
      <div style={{ position: "absolute", width: 170, height: 170, borderRadius: 40, background: brand.accent, display: "grid", placeItems: "center", boxShadow: `0 0 80px ${brand.accent}88`, ...pop(frame, lock) }}>
        <Lock size={84} color={brand.ink} strokeWidth={2.4} />
      </div>
    </AbsoluteFill>
  </Stage>;
}

// Copies: "it gets copied everywhere". Copies of one file multiply on a tilted plane while the camera
// pulls back.
export function Copies() {
  const frame = useCurrentFrame();
  const cols = 9, rows = 5;
  const zoom = between(frame, 0, s(2.4), 2.4, 1);
  return <Stage>
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", perspective: 1800 }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 170px)`, gap: 26, transform: `scale(${zoom}) rotateX(38deg) rotateZ(-12deg)`, transformStyle: "preserve-3d" }}>
        {Array.from({ length: cols * rows }, (_, i) => {
          const center = Math.floor((cols * rows) / 2);
          const d = Math.abs((i % cols) - (center % cols)) + Math.abs(Math.floor(i / cols) - Math.floor(center / cols));
          const t = d * 4;
          return <div key={i} style={{ height: 120, borderRadius: 18, background: i === center ? brand.accent : "#fff", border: `2px solid ${i === center ? brand.ink : brand.line}`, display: "flex", alignItems: "center", gap: 10, padding: "0 18px", fontFamily: mono, fontSize: 24, fontWeight: 600, boxShadow: "0 20px 40px -24px rgba(0,0,0,.35)", ...pop(frame, t) }}>
            {d % 3 === 0 && <Sfx name="blip" at={t} volume={0.12} />}
            <FileText size={28} color={brand.ink} />.env
          </div>;
        })}
      </div>
    </AbsoluteFill>
  </Stage>;
}

// Product: the real app, rebuilt from its own tokens, tilted in 3D, slowly turning, light sweeping
// across it. Replace the placeholder rows with the app's real screen (guides/from-codebase.md).
export function Product() {
  const frame = useCurrentFrame();
  return <Stage>
    <Sfx name="swoosh" at={0} volume={0.3} />
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Tilt at={2}>
        <Shine at={s(0.8)}>
          <Window title="app.example.com" width={1300}>
            <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", height: 620 }}>
              <div style={{ borderRight: "1px solid #1f1f22", padding: 22, display: "grid", alignContent: "start", gap: 14, fontSize: 20, color: "#a1a1aa" }}>
                {["[NEED: real sidebar]", "…", "…"].map((label, i) => <span key={i} style={enter(frame, s(0.4) + i * 5, 12)}>{label}</span>)}
              </div>
              <div style={{ padding: 30, display: "grid", alignContent: "start", gap: 14 }}>
                {Array.from({ length: 6 }, (_, i) => <div key={i} style={{ height: 56, borderRadius: 12, background: "#18181b", ...enter(frame, s(0.5) + i * 4, 16) }} />)}
              </div>
            </div>
          </Window>
        </Shine>
      </Tilt>
    </AbsoluteFill>
  </Stage>;
}
