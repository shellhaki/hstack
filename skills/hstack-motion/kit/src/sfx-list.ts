// The sound effects, and the prompt each is generated from with ElevenLabs (bun run sfx). See guides/sound/SKILL.md.
export const SFX = {
  whoosh: { prompt: "Fast, airy, clean whoosh for a modern motion graphics transition, no music", seconds: 1 },
  swoosh: { prompt: "Soft low cinematic swoosh, subtle, short, for a UI panel sliding in", seconds: 1 },
  click: { prompt: "Single crisp soft mouse click, minimal UI sound", seconds: 0.5 },
  pop: { prompt: "Soft rounded UI pop for an element appearing, gentle, short", seconds: 0.5 },
  tick: { prompt: "Tiny subtle UI tick for a checkmark, very short and clean", seconds: 0.5 },
  typing: { prompt: "Light fast typing on a quiet mechanical keyboard, close and clean, no room noise", seconds: 3 },
  success: { prompt: "Gentle modern two-note success chime, warm, short UI notification", seconds: 1.2 },
  glitch: { prompt: "Short subtle digital error blip, low glitch, UI warning", seconds: 0.7 },
  impact: { prompt: "Deep cinematic logo reveal hit with a soft shimmering tail, clean and modern", seconds: 2.5 },
  riser: { prompt: "Short clean cinematic riser building tension, airy, no drums", seconds: 2 },
  shimmer: { prompt: "Light sparkling shimmer, magical but subtle, short", seconds: 1.2 },
  slot: { prompt: "Short slot machine reel spin: fast mechanical clicking that slows and stops with a soft clunk, clean, no music", seconds: 1.2 },
  ratchet: { prompt: "Fast tiny ticking ratchet like a digital counter rolling up numbers, crisp and light", seconds: 1 },
  blip: { prompt: "Soft modern UI blip, short, rounded and pleasant", seconds: 0.5 },
  swipe: { prompt: "Quick sleek airy swipe transition, high and short, modern motion graphics", seconds: 0.6 },
  message: { prompt: "Gentle generic chat message received pop, short and soft, not any brand's sound", seconds: 0.6 },
  data: { prompt: "Fast digital data chirps and bleeps, a computer processing, short and clean", seconds: 1.2 },
  reveal: { prompt: "Sleek modern tech logo reveal swell with a soft shimmer tail, no drums, no music", seconds: 2.2 },
} satisfies Record<string, { prompt: string; seconds: number }>;

export type SfxName = keyof typeof SFX;
