#!/bin/zsh
# Twice-daily Ordalin auto-publish from keyword-radar (launchd: com.ordalin.radar-autopublish).
# Fetches candidates, lets a headless Claude Code run import tools and publish guides per
# docs/radar-autopublish.md, then sends the summary to Telegram through keyword-radar.
set -u
export PATH="$HOME/.local/bin:$HOME/Library/pnpm:$HOME/.nvm/versions/node/v22.23.4/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
ROOT="${0:A:h:h:h}"
cd "$ROOT" || exit 1
set -a; . ./.env.radar; set +a
RUN="$ROOT/.ordalin-imports/radar-auto/$(TZ=Australia/Melbourne date +%Y-%m-%d-%H%M)"
mkdir -p "$RUN"
exec > >(tee -a "$RUN/run.log") 2>&1
NODE=(node --experimental-strip-types --experimental-specifier-resolution=node --no-warnings)

report() {
  node -e 'process.stdout.write(JSON.stringify({ text: require("fs").readFileSync(0, "utf8") }))' <<<"$1" |
    curl -sS -X POST "$RADAR_URL/ordalin/report" -H "Authorization: Bearer $RADAR_TOKEN" -H "Content-Type: application/json" --data-binary @- >/dev/null
}

# A run missed while the Mac slept starts on wake; keep the summary out of the night like the
# radar's own pushes, and leave the candidates to the next scheduled run.
HOUR=$(TZ=Australia/Melbourne date +%H)
if [[ -z "${DRY_RUN:-}" && ( 10#$HOUR -lt 9 || 10#$HOUR -ge 23 ) ]]; then
  echo "outside 09:00-23:00 Melbourne; next scheduled run picks these up"; exit 0
fi

# Another run still going (a slow batch): skip this one.
LOCK="$ROOT/.ordalin-imports/radar-auto/lock"
if ! mkdir "$LOCK" 2>/dev/null; then
  echo "previous run still going"; exit 0
fi
trap 'rmdir "$LOCK"' EXIT

if ! COUNT=$("${NODE[@]}" scripts/radar-autopublish/candidates.ts --out="$RUN" | tail -1); then
  report "取候选失败，这次没跑。日志：$RUN/run.log"; exit 1
fi
if [[ "$COUNT" == "0" && -z "${DRY_RUN:-}" ]]; then
  "${NODE[@]}" scripts/radar-autopublish/candidates.ts --commit="$RUN"
  report "雷达这段时间没有新推送，没有可上线的。"; exit 0
fi

# DRY_RUN=1: decisions only, nothing imported, written or pushed; summary printed, not sent.
if [[ -n "${DRY_RUN:-}" ]]; then
  PROMPT_EXTRA="DRY RUN: do steps 1-4 only. Do not run imports:prepare, imports:screenshots or imports:apply, do not write or edit files, do not use git. In the final message, list what you would import and publish (with the official URL you found) and what you would skip."
fi

PROMPT="$(sed -n '/^<!-- prompt -->$/,/^<!-- \/prompt -->$/p' docs/radar-autopublish.md | sed '1d;$d')
Run directory: $RUN
Candidates: $RUN/candidates.json ($COUNT items)
${PROMPT_EXTRA:-}"

claude -p "$PROMPT" \
  --permission-mode acceptEdits \
  --allowedTools "Read" "Write" "Edit" "Glob" "Grep" "WebSearch" "WebFetch" \
    "Bash(pnpm imports:*)" "Bash(pnpm test*)" "Bash(pnpm typecheck*)" "Bash(pnpm lint*)" "Bash(pnpm exec vitest*)" \
    "Bash(git status*)" "Bash(git add*)" "Bash(git commit*)" "Bash(git pull*)" "Bash(git push*)" "Bash(git diff*)" "Bash(git log*)" \
    "Bash(curl*)" "Bash(ls*)" "Bash(cat*)" "Bash(head*)" "Bash(jq*)" "Bash(mkdir*)" "Bash(node*)" \
  --output-format text >"$RUN/summary.txt"
STATUS=$?

if [[ -n "${DRY_RUN:-}" ]]; then
  cat "$RUN/summary.txt"; exit $STATUS
fi
if [[ $STATUS -eq 0 && -s "$RUN/summary.txt" ]]; then
  "${NODE[@]}" scripts/radar-autopublish/candidates.ts --commit="$RUN"
  report "$(cat "$RUN/summary.txt")"
else
  report "Claude 运行失败（退出码 $STATUS），候选留到下次重试。日志：$RUN/run.log"
  exit 1
fi
