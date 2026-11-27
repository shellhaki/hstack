import { Fragment, type ReactNode } from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { springTiming, TransitionSeries, type TransitionPresentation } from "@remotion/transitions";
import { between } from "./motion";
import { Sfx } from "./kit";
import { hasVoice, LEAD_FRAMES, s, SCRIPT, sceneFrames, TOTAL_FRAMES, TRANSITION } from "./script";
import type { SfxName } from "./sfx-list";
import { iris, reel, through, whip } from "./transitions";
import { Bars, Intro, Nodes, Outro, Words } from "./scenes/examples";

// The whole video: the scenes in script order, each handing over to the next with a transition and a
// sound, the voice under each scene, and the music under everything.

// One component per script line, by id.
const SCENES: Record<string, () => ReactNode> = { intro: Intro, nodes: Nodes, words: Words, bars: Bars, outro: Outro };

// How each scene is entered, and the sound under the move (guides/transitions/SKILL.md).
const HANDOVER: Record<string, [TransitionPresentation<Record<string, never>>, SfxName]> = {
  nodes: [through(), "whoosh"], words: [whip(), "swipe"], bars: [reel(), "slot"], outro: [iris(), "shimmer"],
};

// Put the user's track at public/music/background.mp3 to use it (guides/sound/SKILL.md).
const MUSIC = "music/background.mp3";
const HAS_MUSIC = false;

const fade = (f: number) => Math.min(1, f / s(0.6), (TOTAL_FRAMES - f) / s(1.5));

export function Video({ voice = true }: { voice?: boolean }) {
  const level = voice ? 0.07 : 0.2;
  return <>
    {HAS_MUSIC && <Audio src={staticFile(MUSIC)} volume={(f) => level * fade(f)} />}
    <TransitionSeries>
      {SCRIPT.map(({ id }, i) => {
        const Scene = SCENES[id];
        const [presentation, sound] = HANDOVER[id] ?? [through(), "whoosh"];
        return <Fragment key={id}>
          {i > 0 && <TransitionSeries.Transition presentation={presentation} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION })} />}
          <TransitionSeries.Sequence durationInFrames={sceneFrames(id)} name={id}>
            <FadeOut last={i === SCRIPT.length - 1}><Scene /></FadeOut>
            {i > 0 && <Sfx name={sound} at={0} length={s(0.8)} volume={0.28} />}
            {voice && hasVoice(id) && <Sequence from={LEAD_FRAMES} layout="none" name={`voice ${id}`}><Audio src={staticFile(`voice/${id}.mp3`)} /></Sequence>}
          </TransitionSeries.Sequence>
        </Fragment>;
      })}
    </TransitionSeries>
  </>;
}

// FadeOut eases the last scene away; every other scene hands over through its transition.
function FadeOut({ children, last }: { children: ReactNode; last: boolean }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  if (!last) return <>{children}</>;
  return <AbsoluteFill style={{ opacity: 1 - between(frame, durationInFrames - s(0.5), durationInFrames, 0, 1) }}>{children}</AbsoluteFill>;
}
