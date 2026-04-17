#!/usr/bin/env bash
# VAIS Code — legacy-path guard (shared, hook + CI)
# Usage:
#   bash scripts/check-legacy-paths.sh --mode=staged   # hook: git diff --cached
#   bash scripts/check-legacy-paths.sh --mode=tree     # CI:   git ls-files
#
# Exit codes:
#   0 — no violations
#   1 — violations found (details written to stderr)
#
# @see docs/legacy-path-guard/design/main.md
# @see docs/ci-bootstrap/design/main.md §3

set -euo pipefail

# ── Configuration ──────────────────────────────────────────────────
LEGACY_PATTERN='docs/[0-9][0-9]-'

# Single-source exception list.
# Files/globs whose content is ALLOWED to contain the legacy pattern string
# (e.g. they document or test the pattern itself).
EXCEPTIONS=(
  "docs/_legacy/*"
  "CHANGELOG.md"
  "tests/paths.test.js"
  "README.md"
  "CLAUDE.md"
  ".hooks/pre-commit"
  "scripts/check-legacy-paths.sh"
)

# ── Mode parsing ────────────────────────────────────────────────────
MODE=""
for arg in "$@"; do
  case "$arg" in
    --mode=staged) MODE="staged" ;;
    --mode=tree)   MODE="tree"   ;;
    *) echo "Unknown argument: $arg" >&2; exit 2 ;;
  esac
done

if [ -z "$MODE" ]; then
  echo "Usage: $0 --mode={staged|tree}" >&2
  exit 2
fi

# ── Helper: check if file matches any exception glob ───────────────
is_excepted() {
  local file="$1"
  for pat in "${EXCEPTIONS[@]}"; do
    # Use case-pattern matching via eval-safe bash glob
    # shellcheck disable=SC2254
    case "$file" in
      $pat) return 0 ;;
    esac
  done
  return 1
}

# ── File list ───────────────────────────────────────────────────────
if [ "$MODE" = "staged" ]; then
  mapfile -t FILES < <(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || true)
else
  mapfile -t FILES < <(git ls-files 2>/dev/null || true)
fi

# ── Scan ────────────────────────────────────────────────────────────
violations=""

for file in "${FILES[@]}"; do
  [ -z "$file" ] && continue

  if is_excepted "$file"; then
    continue
  fi

  if [ "$MODE" = "staged" ]; then
    matches=$(git show ":$file" 2>/dev/null | grep -nE "$LEGACY_PATTERN" || true)
  else
    [ -f "$file" ] || continue
    matches=$(grep -nE "$LEGACY_PATTERN" "$file" || true)
  fi

  if [ -n "$matches" ]; then
    violations="${violations}
[$file]
$matches
"
  fi
done

# ── Result ──────────────────────────────────────────────────────────
if [ -n "$violations" ]; then
  printf '\n❌ legacy-path-guard: 레거시 경로 docs/NN- 패턴 감지\n' >&2
  printf '%s\n' "$violations" >&2
  printf '💡 새 구조로 치환: docs/{feature}/{phase}/main.md\n' >&2
  printf '   예외가 필요하면 scripts/check-legacy-paths.sh 의 EXCEPTIONS 배열에 추가\n' >&2
  exit 1
fi

echo "[VAIS] legacy-path-guard passed."
exit 0
