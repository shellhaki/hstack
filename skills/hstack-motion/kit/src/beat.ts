import { FPS } from "./script";

// The beat grid: cut and land motion on the music's beats. Set BPM to the track's tempo (measure it, or
// read it from the music's metadata); OFFSET is the time of the first downbeat in seconds.
export const BPM = 120;
export const OFFSET = 0;

export const framesPerBeat = (60 / BPM) * FPS;
// beat(n) is the frame of the nth beat (0-based) from the start of the video; bar(n) of the nth bar (4/4).
export const beat = (n: number) => Math.round(OFFSET * FPS + n * framesPerBeat);
export const bar = (n: number) => beat(n * 4);
// snap rounds a frame to the nearest beat, so a cut or a hit lands on the grid.
export const snap = (frame: number) => beat(Math.round((frame - OFFSET * FPS) / framesPerBeat));
// beats(n) is a length of n beats in frames, for scene lengths: a scene of beats(8) is two bars.
export const beats = (n: number) => Math.round(n * framesPerBeat);
