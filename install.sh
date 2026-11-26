#!/usr/bin/env bash
# Install hstack from a clone, for Claude Code, Muse Code, Codex or Hermes Agent.
#   Claude Code: links skills into ~/.claude/skills and sub-agents into ~/.claude/agents.
#   Muse Code:   links skills into ~/.agents/skills (Muse workers read agents/*.md from this clone).
#   Codex:       links skills into ~/.agents/skills. Codex sub-agents are generated TOML files,
#                which only the Go installer writes: run `hstack install --agent codex`.
#   Hermes:      links skills into $HERMES_HOME/skills (default ~/.hermes/skills; set HERMES_HOME
#                to target a profile). The worker is a separate `hermes chat` process, so there
#                are no sub-agent files to write.
# The worker model is chosen inside a session, with /hstack.
# Usage: ./install.sh [claude-config-dir]     (default: ~/.claude)
#        HSTACK_AGENT=muse ./install.sh
#        HSTACK_AGENT=codex ./install.sh
#        HSTACK_AGENT=hermes ./install.sh
set -euo pipefail

HERE=$(cd "$(dirname "$0")" && pwd)
AGENT=${HSTACK_AGENT:-claude}

link() { # source dest
  if [ -e "$2" ] && [ ! -L "$2" ]; then
    echo "skip $(basename "$2"): $2 exists and is not an hstack link" >&2
    return
  fi
  ln -sfn "$1" "$2"
  echo "linked $2"
}

prune() { # dir: drop our links whose target no longer exists
  for l in "$1"/*; do
    if [ -L "$l" ] && [ ! -e "$l" ]; then
      case "$(readlink "$l")" in "$HERE"/*|"$HOME/.config/hstack"/*) rm "$l"; echo "removed $l" ;; esac
    fi
  done
}

case "$AGENT" in
  claude)
    BASE=${1:-$HOME/.claude}
    mkdir -p "$BASE/skills" "$BASE/agents"
    prune "$BASE/skills"; prune "$BASE/agents"
    for skill in "$HERE"/skills/*/; do link "${skill%/}" "$BASE/skills/$(basename "$skill")"; done
    for agent in "$HERE"/agents/*.md; do link "$agent" "$BASE/agents/$(basename "$agent")"; done
    echo "Done. In Claude Code, on your frontier model, run /hstack."
    ;;
  muse)
    BASE=$HOME/.agents
    mkdir -p "$BASE/skills"
    prune "$BASE/skills"
    for skill in "$HERE"/skills/*/; do link "${skill%/}" "$BASE/skills/$(basename "$skill")"; done
    echo "Done. In Muse Code, on your frontier model (e.g. muse --model muse-wonder-1.0), run /hstack."
    ;;
  codex)
    BASE=$HOME/.agents
    mkdir -p "$BASE/skills"
    prune "$BASE/skills"
    for skill in "$HERE"/skills/*/; do link "${skill%/}" "$BASE/skills/$(basename "$skill")"; done
    echo "Skills linked. Codex sub-agents (hstack_worker, hstack_reviewer, hstack_researcher) are not linked:"
    echo "  they are generated TOML in \${CODEX_HOME:-~/.codex}/agents. Write them with: hstack install --agent codex"
    echo "Done. In Codex, on your frontier model, run /hstack."
    ;;
  hermes)
    BASE=${HERMES_HOME:-$HOME/.hermes}
    mkdir -p "$BASE/skills"
    prune "$BASE/skills"
    for skill in "$HERE"/skills/*/; do link "${skill%/}" "$BASE/skills/$(basename "$skill")"; done
    echo "Done. In Hermes Agent, on your frontier model, run /hstack (the worker is a separate \`hermes chat\` process)."
    ;;
  *)
    echo "unknown HSTACK_AGENT=$AGENT (use claude, muse, codex or hermes)" >&2
    exit 1
    ;;
esac
echo "Update later with: git -C $HERE pull"
