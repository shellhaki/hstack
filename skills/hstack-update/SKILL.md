---
name: hstack-update
description: Update hstack to the latest skills and sub-agents. Use only when the user invokes /hstack-update. Detects every harness hstack is installed in (Claude Code, Muse Code, Codex, Hermes Agent) and whether it came from the hstack CLI or a git clone, fetches the latest, reinstalls each, and reports the skill versions that changed.
purpose: One command to get the latest hstack everywhere it is installed.
author: shellhaki
version: 0.1.0
disable-model-invocation: true
---

# hstack-update

1. Run the update script, which lives next to this file:
   ```
   bash <this skill's folder>/update.sh
   ```
   It finds the harnesses hstack is installed in and where the skills come from, then:
   - **hstack CLI install:** rebuilds the CLI from `main` with Go (`go install …@main`), or downloads
     the latest release when Go is missing, then runs `hstack install --agent <harness>` for each.
   - **git clone install:** `git pull --ff-only` in the clone, then reruns `install.sh` for each.
     If the clone has uncommitted changes it stops; never stash, reset or discard them.

   `bash update.sh --check` only reports what is installed, without changing anything.
2. Show the user the script's output: the harnesses updated and the skill versions before and after.
   If it failed, show the error line and the fix it suggests; don't work around it.
3. Tell the user to start a new session: skills already loaded in this one stay the old version.
