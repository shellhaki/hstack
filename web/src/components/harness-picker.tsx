"use client";

import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Harness = {
  id: string;
  name: string;
  tag: string;
  live: boolean;
  points?: string[];
};

const harnesses: Harness[] = [
  {
    id: "claude",
    name: "Claude Code",
    tag: "/hstack-activate",
    live: true,
    points: ["Uses your existing login", "No API keys", "Nothing changes until you run /hstack-activate"],
  },
  {
    id: "hermes",
    name: "Hermes Agent",
    tag: "/hstack",
    live: true,
    points: [
      "Skills link into $HERMES_HOME/skills",
      "Worker is a separate hermes chat process",
      "Profiles included via HERMES_HOME",
    ],
  },
  { id: "codex", name: "Codex CLI", tag: "Coming soon", live: false },
  { id: "opencode", name: "OpenCode", tag: "Coming soon", live: false },
  { id: "cursor", name: "Cursor", tag: "Coming soon", live: false },
];

/** Selectable harness rows with real live / coming-soon states. */
export function HarnessPicker() {
  const [selected, setSelected] = useState<string[]>(["claude"]);
  const current = harnesses.find((h) => h.id === selected[0]) ?? harnesses[0];

  return (
    <div>
      <ToggleGroup
        value={selected}
        onValueChange={(v) => { if (v[0]) setSelected([v[0]]); }}
        orientation="vertical"
        aria-label="Choose your harness"
        className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {harnesses.map((h) => (
          <ToggleGroupItem
            key={h.id}
            value={h.id}
            aria-label={`${h.name}, ${h.live ? "live" : "coming soon"}`}
            className="h-auto min-h-[76px] items-center justify-start gap-3.5 rounded-xl border border-line bg-surface p-5 text-left data-pressed:border-frontier"
          >
            <span
              aria-hidden
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-md text-xs ${h.live ? "bg-frontier/15 text-frontier" : "bg-surface-2 text-ink-3"}`}
            >
              {h.name[0]}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium tracking-[-0.01em]">{h.name}</span>
              <span className={`block truncate text-[11px] ${h.live ? "font-mono text-good" : "text-ink-3"}`}>{h.tag}</span>
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div aria-live="polite" className="mt-4 rounded-xl border border-line bg-surface px-5 py-4 text-[13px] text-ink-2">
        {current.live && current.points ? (
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {current.points.map((p) => (
              <li key={p} className="inline-flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-good" aria-hidden>
                  <path d="M4 12l5 5L20 6" />
                </svg>
                {p}
              </li>
            ))}
          </ul>
        ) : (
          <p>Not yet — hstack runs in Claude Code and Hermes Agent today. {current.name} support is coming soon.</p>
        )}
      </div>
    </div>
  );
}
