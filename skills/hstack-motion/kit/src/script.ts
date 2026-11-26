import voice from "./voice.json";

// The script, one line per scene, and every timing derived from it. With the voice generated
// (bun run voice), each scene lasts as long as its line and `at` gives the frame a word is said.
// Before that, both are estimated from the words.
//
// text:  the line as written (on screen, and for timing)
// say:   what the voice gets: the same words with delivery cues for ElevenLabs v3, e.g. "[fast] …"
// tempo: speeds the generated audio up afterwards (1.12 = 12% faster) for a line read too slowly
// min:   the shortest the scene may be, in seconds

export type Line = { id: string; text: string; say?: string; tempo?: number; min: number };

// The lines below are the kit's sample, for the example scenes only. Replace all of them with the
// storyboard's lines; never reuse their wording.
export const SCRIPT: Line[] = [
  { id: "intro", text: "Introducing Product.", say: "Introducing Product.", min: 2.6 },
  { id: "nodes", text: "Everything your team needs, in one place.", say: "[warm] Everything your team needs, in one place.", min: 3.6 },
  { id: "words", text: "Build, ship and grow.", say: "[confident] Build, ship and grow.", min: 3.0 },
  { id: "bars", text: "For a fraction of the price.", say: "[excited] For a fraction of the price.", min: 3.4 },
  { id: "outro", text: "Product. Made for your team.", say: "[warm] Product. Made for your team.", min: 3.4 },
];

export const FPS = 60;
export const TRANSITION = 20; // frames each scene overlaps the next
const LEAD = 0.2; // seconds before a line starts in its scene
const TAIL = 0.3; // seconds after it ends
const WORDS_PER_SECOND = 2.6;

type Word = { text: string; start: number; end: number };
const VOICE = voice as Record<string, { seconds: number; words: Word[] }>;

export const s = (seconds: number) => Math.round(seconds * FPS);
export const LEAD_FRAMES = s(LEAD);
export const hasVoice = (id: string) => Boolean(VOICE[id]);

const line = (id: string) => {
  const l = SCRIPT.find((x) => x.id === id);
  if (!l) throw new Error(`no script line "${id}"`);
  return l;
};
const spoken = (id: string) => VOICE[id]?.seconds ?? line(id).text.split(/\s+/).length / WORDS_PER_SECOND;

export const sceneFrames = (id: string) => Math.round(Math.max(line(id).min, LEAD + spoken(id) + TAIL) * FPS);
export const TOTAL_FRAMES = SCRIPT.reduce((sum, l) => sum + sceneFrames(l.id), 0) - TRANSITION * (SCRIPT.length - 1);

const normalise = (w: string) => w.toLowerCase().replace(/[^a-z0-9.]/g, "").replace(/^\.+|\.+$/g, "");

// at is the frame, within its scene, when `word` is said (its nth occurrence), so motion lands on it.
export function at(id: string, word: string, nth = 0): number {
  const want = normalise(word);
  const hits = VOICE[id]?.words.filter((w) => normalise(w.text) === want);
  if (hits?.[nth]) return Math.round((LEAD + hits[nth].start) * FPS);
  const words = line(id).text.split(/\s+/).map(normalise);
  const index = words.reduce<number[]>((acc, w, i) => (w === want ? [...acc, i] : acc), [])[nth];
  if (index === undefined) throw new Error(`"${word}" is not in the ${id} line`);
  return Math.round((LEAD + (index / words.length) * spoken(id)) * FPS);
}
