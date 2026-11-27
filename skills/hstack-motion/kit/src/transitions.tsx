import type { ReactNode } from "react";
import { AbsoluteFill, interpolate } from "remotion";
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import { brand } from "./theme";

// The scene transitions (guides/transitions/SKILL.md). Each moves the camera rather than just fading.

type Props = TransitionPresentationComponentProps<Record<string, never>> & { children: ReactNode };
const make = (component: (p: Props) => ReactNode) => (): TransitionPresentation<Record<string, never>> => ({ component, props: {} });

const mix = (p: number, a: number, b: number) => interpolate(p, [0, 1], [a, b], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// whip: a fast pan sideways, both scenes smeared by motion blur at the middle of the move.
export const whip = make(({ children, presentationDirection: dir, presentationProgress: p }) => {
  const x = dir === "exiting" ? mix(p, 0, -1920) : mix(p, 1920, 0);
  const blur = Math.sin(p * Math.PI) * 26;
  return <AbsoluteFill style={{ transform: `translateX(${x}px) skewX(${Math.sin(p * Math.PI) * -6}deg)`, filter: `blur(${blur}px)` }}>{children}</AbsoluteFill>;
});

// reel: the new scene rolls up from below like a slot-machine reel, the old one rolling out the top.
export const reel = make(({ children, presentationDirection: dir, presentationProgress: p }) => {
  const y = dir === "exiting" ? mix(p, 0, -1080) : mix(p, 1080, 0);
  const blur = Math.sin(p * Math.PI) * 18;
  return <AbsoluteFill style={{ transform: `translateY(${y}px) scaleY(${1 + Math.sin(p * Math.PI) * 0.08})`, filter: `blur(${blur}px)` }}>{children}</AbsoluteFill>;
});

// iris: the new scene opens out of a growing circle, edged with a ring of yellow light.
export const iris = make(({ children, presentationDirection: dir, presentationProgress: p }) => {
  if (dir === "exiting") return <AbsoluteFill style={{ transform: `scale(${mix(p, 1, 1.06)})` }}>{children}</AbsoluteFill>;
  const r = mix(p, 0, 1250);
  return <AbsoluteFill>
    <AbsoluteFill style={{ clipPath: `circle(${r}px at 50% 50%)` }}>{children}</AbsoluteFill>
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
      <span style={{ width: r * 2, height: r * 2, borderRadius: "50%", border: `${mix(p, 14, 2)}px solid ${brand.accent}`, opacity: mix(p, 1, 0), boxShadow: `0 0 60px ${brand.accent}` }} />
    </AbsoluteFill>
  </AbsoluteFill>;
});

// through: the camera moves forward through one scene into the next.
export const through = make(({ children, presentationDirection: dir, presentationProgress: p }) => {
  const entering = dir === "entering";
  const scale = entering ? mix(p, 0.88, 1) : mix(p, 1, 1.2);
  const blur = entering ? mix(p, 16, 0) : mix(p, 0, 20);
  const opacity = entering ? interpolate(p, [0, 0.55], [0, 1], { extrapolateRight: "clamp" }) : interpolate(p, [0.35, 1], [1, 0], { extrapolateLeft: "clamp" });
  return <AbsoluteFill style={{ transform: `scale(${scale})`, filter: blur > 0.1 ? `blur(${blur}px)` : undefined, opacity }}>{children}</AbsoluteFill>;
});
