#!/usr/bin/env bash
# Launcher for the Playwright MCP server.
#
# WHY THIS WRAPPER EXISTS
# -----------------------
# .mcp.json is strict JSON and cannot carry comments, and the browser path we
# need differs per machine. So the decision lives here instead of being
# hardcoded into the committed JSON.
#
# The Claude Code cloud container ships a pre-installed Chromium under
# /opt/pw-browsers/ and sets PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1, so npm never
# fetches the build that the installed Playwright actually expects. Those two
# build numbers do not match, and launching without an explicit path fails with
# "Executable doesn't exist at .../chromium_headless_shell-<N>/...".
#
# On a normal laptop none of that applies: Playwright manages its own browsers
# and resolves them on its own. Passing a container path there would break it.
#
# So: pass --executable-path ONLY when we actually resolve a browser outside
# Playwright's own store. Otherwise pass nothing and let Playwright decide.
#
# Resolution order:
#   1. $PLAYWRIGHT_CHROMIUM_PATH  — explicit override, always wins
#   2. /opt/pw-browsers/chromium-*/chrome-linux/chrome  — the cloud container.
#      Globbed, not pinned to build 1194, so a container image update that
#      bumps the build number does not break this.
#   3. nothing — Playwright's default resolution (the laptop case)
#
# See docs/env-notes.md for the full background.

set -euo pipefail

browser="${PLAYWRIGHT_CHROMIUM_PATH:-}"

if [ -z "$browser" ]; then
  for candidate in /opt/pw-browsers/chromium-*/chrome-linux/chrome; do
    if [ -x "$candidate" ]; then
      browser="$candidate"
      break
    fi
  done
fi

args=()
if [ -n "$browser" ] && [ -x "$browser" ]; then
  args+=(--executable-path "$browser")
fi

exec npx -y @playwright/mcp@latest "${args[@]}" "$@"
