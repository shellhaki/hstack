"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { INSTALL_CMD, INSTALL_HERMES } from "@/lib/site";

/** Install transcripts per live harness. Commands are the real ones;
 * sample output lines stay in the tile's existing illustrative style. */
export function InstallTerminal() {
  const [tab, setTab] = useState("claude");

  return (
    <div className="tile flex min-w-0 flex-col">
      <div className="flex items-center gap-1.5 border-b border-line px-4 py-3" aria-hidden>
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="ml-3 font-mono text-xs text-ink-3">~/code</span>
      </div>
      <Tabs value={tab} onValueChange={setTab} aria-label="Install transcript by harness" className="flex min-w-0 flex-1 flex-col">
        <div className="overflow-x-auto px-5 pt-3">
          <TabsList aria-label="Harness">
            <TabsTrigger value="claude" className="min-h-9 flex-1">Claude Code</TabsTrigger>
            <TabsTrigger value="hermes" className="min-h-9 flex-1">Hermes Agent</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="claude" className="min-w-0 flex-1">
          <div className="overflow-x-auto p-5 font-mono text-[13px] leading-7">
            <div className="whitespace-nowrap"><span className="text-frontier">$</span> {INSTALL_CMD}</div>
            <div className="whitespace-nowrap text-ink-3">✓ linked 4 skills and 2 sub-agents into ~/.claude</div>
            <div className="whitespace-nowrap"><span className="text-frontier">$</span> claude --model opus</div>
            <div className="whitespace-nowrap"><span className="text-frontier">&gt;</span> /hstack-activate</div>
            <div className="whitespace-nowrap text-ink-3">Which smaller model should do the work? <span className="text-ink">haiku 5.5</span></div>
            <div className="whitespace-nowrap text-ink-3">hstack active · <span className="text-frontier">opus</span> directs, <span className="text-small">haiku</span> builds</div>
            <div><span className="text-frontier">&gt;</span><span className="caret" /></div>
          </div>
        </TabsContent>
        <TabsContent value="hermes" className="min-w-0 flex-1">
          <div className="overflow-x-auto p-5 font-mono text-[13px] leading-7">
            <div className="whitespace-nowrap"><span className="text-frontier">$</span> {INSTALL_CMD}</div>
            <div className="whitespace-nowrap"><span className="text-frontier">$</span> {INSTALL_HERMES}</div>
            <div className="whitespace-nowrap text-ink-3">✓ linked skills into ~/.hermes/skills — no sub-agent files</div>
            <div className="whitespace-nowrap text-ink-3">Done. In a session, run <span className="text-ink">/hstack</span></div>
            <div className="whitespace-nowrap text-ink-3">Which smaller model should do the work? <span className="text-ink">spark-1.2</span></div>
            <div className="whitespace-nowrap text-ink-3">hstack active · frontier directs, worker builds as a separate hermes chat process</div>
            <div><span className="text-frontier">&gt;</span><span className="caret" /></div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
