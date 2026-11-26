#!/usr/bin/env bash
# Updates hstack to the latest skills and sub-agents, for every harness it is installed in.
#   bash update.sh            update
#   bash update.sh --check    only report what is installed and where it comes from
set -euo pipefail

# The install step below replaces this skill's own folder, so run from a copy.
if [ -z "${HSTACK_UPDATE_COPY:-}" ]; then
  copy=$(mktemp "${TMPDIR:-/tmp}/hstack-update.XXXXXX")
  cp "$0" "$copy"
  HSTACK_UPDATE_COPY=1 exec bash "$copy" "$@"
fi

REPO="shellhaki/hstack"
BIN_DIR="${HSTACK_BIN:-$HOME/.local/bin}"
CONFIG="$HOME/.config/hstack"
CODEX_DIR="${CODEX_HOME:-$HOME/.codex}"
HERMES_DIR="${HERMES_HOME:-$HOME/.hermes}"
say() { printf '%s\n' "$*"; }
fail() { printf 'hstack-update: %s\n' "$*" >&2; exit 1; }

# 1. Which harnesses have hstack, and where do their skills come from?
agents=()
[ -L "$HOME/.claude/skills/hstack" ] && agents+=(claude)
if [ -L "$HOME/.agents/skills/hstack" ]; then
  command -v muse >/dev/null 2>&1 && agents+=(muse)
  { [ -f "$CODEX_DIR/agents/hstack-worker.toml" ] || command -v codex >/dev/null 2>&1; } && agents+=(codex)
fi
[ -L "$HERMES_DIR/skills/hstack" ] && agents+=(hermes)
[ ${#agents[@]} -gt 0 ] || fail "hstack is not installed for any harness. Install: curl -fsSL https://hstack.shellhaki.dev/install | sh"

source_dir=""
for link in "$HOME/.claude/skills/hstack" "$HOME/.agents/skills/hstack" "$HERMES_DIR/skills/hstack"; do
  [ -L "$link" ] && { source_dir=$(readlink "$link"); break; }
done
case "$source_dir" in
  "$CONFIG"/*) mode=binary ;;
  *) mode=clone; clone=$(cd "$source_dir/../.." && git rev-parse --show-toplevel 2>/dev/null) || fail "skills link to $source_dir, which is not in a git clone" ;;
esac

versions() { # print "name version" for each installed skill
  for f in "$1"/*/SKILL.md; do
    [ -f "$f" ] || continue
    printf '%s %s\n' "$(basename "$(dirname "$f")")" "$(sed -n 's/^version: *//p' "$f" | head -1)"
  done
}
skills_root=$([ "$mode" = binary ] && echo "$CONFIG/skills" || echo "$clone/skills")
before=$(versions "$skills_root")

say "Harnesses: ${agents[*]}"
say "Source: $([ "$mode" = binary ] && echo "hstack CLI ($CONFIG)" || echo "git clone ($clone)")"
if [ "${1:-}" = "--check" ]; then say "$before"; exit 0; fi

# 2. Get the latest.
if [ "$mode" = clone ]; then
  [ -z "$(git -C "$clone" status --porcelain --untracked-files=no)" ] || fail "$clone has uncommitted changes; commit them or update it yourself"
  git -C "$clone" pull --ff-only || fail "git pull failed in $clone; resolve it there"
else
  mkdir -p "$BIN_DIR"
  if command -v go >/dev/null 2>&1; then
    # @main, not @latest: @latest is the newest tag, which can be older than the skills on main.
    say "Building the latest hstack from main..."
    GOBIN="$BIN_DIR" GOPROXY=direct go install "github.com/$REPO/cmd/hstack@main" || fail "go install failed"
  else
    os=$(uname -s | tr '[:upper:]' '[:lower:]')
    case "$(uname -m)" in x86_64|amd64) arch=amd64 ;; arm64|aarch64) arch=arm64 ;; *) fail "unsupported CPU" ;; esac
    say "Downloading the latest hstack release (Go is not installed, so this is the newest tag, not main)..."
    curl -fsSL "https://github.com/$REPO/releases/latest/download/hstack_${os}_${arch}" -o "$BIN_DIR/hstack.tmp" || fail "download failed"
    chmod +x "$BIN_DIR/hstack.tmp" && mv "$BIN_DIR/hstack.tmp" "$BIN_DIR/hstack"
  fi
fi

# 3. Reinstall for each harness. The installer keeps each harness's chosen worker model.
for agent in "${agents[@]}"; do
  if [ "$mode" = clone ]; then
    if [ "$agent" = codex ] && command -v hstack >/dev/null 2>&1; then
      HSTACK_AGENT=codex bash "$clone/install.sh" >/dev/null && hstack install --agent codex >/dev/null
    else
      HSTACK_AGENT=$agent bash "$clone/install.sh" >/dev/null
    fi
  else
    "$BIN_DIR/hstack" install --agent "$agent" >/dev/null
  fi
  say "updated $agent"
done

# 4. Report what changed.
after=$(versions "$skills_root")
say ""
say "Skill versions (before -> after):"
join -a1 -a2 -e "-" -o 0,1.2,2.2 <(echo "$before" | sort) <(echo "$after" | sort) | while read -r name old new; do
  if [ "$old" = "$new" ]; then say "  $name $new"; else say "  $name $old -> $new"; fi
done
say ""
say "Start a new session to load the updated skills."
