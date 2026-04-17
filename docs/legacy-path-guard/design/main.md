# legacy-path-guard - 설계

> ⛔ **Design 단계 범위**: 이 문서는 설계 결정만 기록합니다. 실제 hook/스크립트 생성은 Do 단계에서 수행합니다.
> 참조 문서: `docs/legacy-path-guard/plan/main.md`

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 레거시 경로 재발 방지의 machine-enforceable 수단 부재 |
| **WHO** | 커밋 수행자 (사람 + Claude Code agent), 신규 기여자 |
| **RISK** | **ripgrep 미설치 환경에서 hook 실패** (design에서 발견), bypass 허용 시 guard 무력화 |
| **SUCCESS** | SC-01~06 전부 Met + 신규 의존성 0 |
| **SCOPE** | pre-commit hook + 설치 스크립트 + CLAUDE.md rule + README 안내 + bypass 금지 정책 |

---

## 🔄 Design 단계 Plan 수정 사항

Plan 작성 후 설계 검증 중 발견한 2건:

| # | Plan 가정 | 검증 결과 | 설계 조치 |
|---|-----------|-----------|-----------|
| 1 | `rg 'docs/\d\d-' --glob ...` 사용 | `which rg` → **exit 1** (시스템 미설치) | **표준 `grep -nE` + `git diff --cached --name-only` 조합으로 전환**. 의존성 0 유지 |
| 2 | `scripts/git-hooks/pre-commit` 신규 생성 + `scripts/install-git-hooks.sh` 신규 | **기존 `.hooks/pre-commit` + `npm run prepare-hooks` 인프라 발견** (`package.json:22` `"prepare-hooks": "git config core.hooksPath .hooks"`) | **기존 `.hooks/pre-commit`에 legacy-path 검사 추가**. 신규 설치 스크립트 만들지 않음(`prepare-hooks` 재사용). SC-03 검증 명령도 `npm run prepare-hooks` 기반 |

> Plan의 SC-06("신규 의존성 0") + Rule #10("Search Before Building") 재확인:
> - ripgrep 의존 도입 금지 → 순수 bash + POSIX grep 채택
> - 기존 hook 인프라 재사용 → 신규 hook 디렉토리·설치 스크립트 배제

---

## Architecture Options

| Option | 설명 | 복잡도 | 의존성 | 속도 | 선택 |
|--------|------|:------:|:------:|:----:|:----:|
| A. **순수 bash + `git diff --cached` + `grep -nE`** | git의 staged 파일 목록 → 예외 필터 → grep 패턴 검사 | 낮음 | 0 (git+grep 내장) | 빠름 | ✅ 채택 |
| B. Node.js 스크립트 | `child_process.execSync` + regex | 중 | Node (있음) | 중 | ❌ 기각 — 과설계 |
| C. ripgrep 기반 (plan 원안) | `rg --glob` 사용 | 낮음 | ripgrep 설치 필요 | 매우 빠름 | ❌ 기각 — 의존성 추가 |

**Rationale**: 검사 대상 파일이 수백 개 수준이고 패턴이 단순하므로 `grep -nE`로 충분. ripgrep은 성능 이득 있으나 기여자 환경 보장 못 함. **bash + grep + git** 3종은 git 저장소 전제에서 100% 보장.

---

## Part 1-3: IA / Wireframe / UI

N/A — CLI/hook 작업 (UI 없음).

---

## Part 4: Tech Stack Lock

| 영역 | Lang/Framework | 핵심 도구 | 비고 | 금지 |
|------|----------------|-----------|------|------|
| Hook runtime | **bash** (sh 호환) | `grep -nE`, `git diff --cached`, `git show` | shebang `#!/usr/bin/env bash` | ripgrep, Node.js, Python |
| 설치 스크립트 | **bash** | `git config core.hooksPath` | 동일 shebang | husky, pre-commit.com |
| 테스트 | Node `node:test` (기존 인프라) | `child_process.execFileSync` | hook 실행 검증용 | Jest, Mocha 신규 도입 |
| 문서 | Markdown | — | CLAUDE.md Rule 추가 | — |

---

## Part 5: Implementation Contract

### 5.1 Hook 스크립트 스펙 (`.hooks/pre-commit` — 기존 파일 확장)

**파일**: 기존 `.hooks/pre-commit` (실행 권한 `0755` 유지). legacy-path 검사를 ESLint/테스트 **앞**에 삽입 (fail-fast).

**의사 코드**:

```bash
#!/usr/bin/env bash
# @see docs/legacy-path-guard/design/main.md §5.1
# 레거시 경로 docs/NN- 패턴 커밋 차단.

set -u  # unset 변수 에러. -e는 grep exit 1이 정상 flow라 쓰지 않음.

LEGACY_PATTERN='docs/[0-9][0-9]-'

# 예외 경로 (glob 아닌 case 매칭)
is_excluded() {
    case "$1" in
        docs/_legacy/*|CHANGELOG.md|tests/paths.test.js|README.md) return 0 ;;
        docs/legacy-path-guard/*) return 0 ;;  # 본 피처 문서(메타) 자체 허용
        *) return 1 ;;
    esac
}

violations=""
while IFS= read -r file; do
    [ -z "$file" ] && continue
    is_excluded "$file" && continue
    # git show로 staged 내용 직접 검사 (working tree 아님)
    matches=$(git show ":$file" 2>/dev/null | grep -nE "$LEGACY_PATTERN" || true)
    [ -n "$matches" ] && violations+="\n[$file]\n$matches\n"
done < <(git diff --cached --name-only --diff-filter=ACM)

if [ -n "$violations" ]; then
    printf '\n❌ legacy-path-guard: 레거시 경로 docs/NN- 패턴 감지\n' >&2
    printf '%b\n' "$violations" >&2
    printf '💡 새 구조로 치환: docs/{feature}/{phase}/main.md\n' >&2
    printf '   예외가 필요하면 scripts/git-hooks/pre-commit 의 is_excluded() 에 추가\n' >&2
    exit 1
fi

exit 0
```

**책임 / 비책임**:

| 책임 | 비책임 |
|------|--------|
| staged 파일의 레거시 경로 패턴 차단 | working tree 전체 스캔(느리고 범위 넘음) |
| 허용 예외 단일 지점 관리 | 예외 자동 감지(오히려 회귀 위험) |
| 친화적 에러 메시지 + 치환 가이드 | 자동 수정(LLM 판단 필요, 범위 밖) |

### 5.2 설치 (기존 `npm run prepare-hooks` 재사용)

**변경 없음** — `package.json:22`의 `"prepare-hooks": "git config core.hooksPath .hooks"`가 이미 존재. 별도 설치 스크립트 생성하지 않음.

**활성화**: `npm run prepare-hooks` 1회 실행.
**비활성화**: `git config --unset core.hooksPath`.

> plan의 F2/F3(설치 스크립트 + setup-hooks npm script)는 **불필요** (이미 있음). SC-03 검증은 `git config --get core.hooksPath` = `.hooks` 확인으로 충분.

### 5.2-legacy. (제거됨) 신규 설치 스크립트 스펙

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
    printf 'Error: not inside a git repository\n' >&2
    exit 1
}

HOOKS_DIR="scripts/git-hooks"
cd "$REPO_ROOT"

[ -d "$HOOKS_DIR" ] || {
    printf 'Error: %s 디렉토리가 없습니다. Do 단계에서 생성 필요.\n' "$HOOKS_DIR" >&2
    exit 1
}

# 실행 권한 보장
chmod +x "$HOOKS_DIR"/* 2>/dev/null || true

git config core.hooksPath "$HOOKS_DIR"
printf '✅ Git hooks 활성화 완료 → core.hooksPath=%s\n' "$HOOKS_DIR"
printf '   레거시 경로 커밋 차단이 활성화됐습니다.\n'
printf '   비활성화: git config --unset core.hooksPath\n'
```

**특징**:
- idempotent (반복 실행 안전)
- 비-git 디렉토리 감지로 실수 방지
- 비활성화 방법 안내

### 5.3 package.json script

```json
{
  "scripts": {
    "setup-hooks": "bash scripts/install-git-hooks.sh"
  }
}
```

### 5.4 CLAUDE.md Rule #13 문구

**추가 위치**: `## Mandatory Rules` 섹션 하단 (현재 Rule #12 "Plan은 결정, Do는 실행" 뒤)

**문구**:

```markdown
13. **레거시 경로 금지** — 문서·코드 모두 `docs/NN-` (예: `docs/01-plan/`, `docs/02-design/`) 패턴 사용 금지. 새 구조 `docs/{feature}/{phase}/main.md`만 사용. 예외: `docs/_legacy/`, `CHANGELOG.md`(릴리즈 이력), `tests/paths.test.js` 회귀 가드 문자열. pre-commit hook이 자동 차단하며, 설치는 `npm run setup-hooks` 1회 실행.
```

### 5.5 README "Developer Setup" 섹션

**추가 위치**: `## Quick Start` 직후 또는 `## Contributing` 섹션 내

**문구**:

```markdown
### Developer Setup

Git hooks 활성화 (1회 실행):

\`\`\`bash
npm run setup-hooks
\`\`\`

이 hook은 `docs/NN-` 같은 레거시 경로 패턴 커밋을 차단합니다. 자세한 예외 규칙은 `docs/legacy-path-guard/plan/main.md` 참조.

비활성화: `git config --unset core.hooksPath`
```

### 5.6 테스트 전략 (Nice 우선순위)

**파일**: `tests/legacy-path-guard.test.js` (Node `node:test` 기반, 기존 인프라 일관)

| 시나리오 | 검증 |
|---------|------|
| 위반 파일 staged → hook 실행 | exit 1 + 위반 메시지 포함 |
| 허용 예외(_legacy/) staged → hook 실행 | exit 0 |
| 위반 없음 → hook 실행 | exit 0 |
| 허용 예외(CHANGELOG.md) staged with legacy pattern | exit 0 |

**구현**: `child_process.execFileSync('bash', ['scripts/git-hooks/pre-commit'])` + 테스트 격리(`fs.mkdtempSync`로 임시 repo).

---

## Error Message Design

### 사용자 경험 흐름

```
$ git commit -m "docs: update"

❌ legacy-path-guard: 레거시 경로 docs/NN- 패턴 감지

[agents/cpo/new-agent.md]
42: 저장 경로: `docs/03-do/cpo_{feature}.do.md`

💡 새 구조로 치환: docs/{feature}/{phase}/main.md
   예외가 필요하면 scripts/git-hooks/pre-commit 의 is_excluded() 에 추가

$ # 커밋 차단됨. 파일 수정 후 재커밋.
```

**원칙**:
- 실패 이유를 **첫 줄에 즉시** 표시
- 위반 파일:라인 **구체적으로**
- 해결 가이드 **1줄**
- 예외 추가 방법 명시 (숨겨놓으면 휴리스틱 회피 유도)

---

## Bypass 정책 재확인

| 상황 | 처리 |
|------|------|
| `git commit --no-verify` | **허용** (git 자체 제어 밖, hook은 기본 skip됨). 단 **CLAUDE.md Rule #13 + README에 사용 금지 명시** |
| hook 수정해서 무력화 | 리뷰에서 잡힘 (`scripts/git-hooks/pre-commit` 변경은 PR에서 눈에 띔) |
| 설치 안 한 기여자 | 경고 없음(opt-in). CI guard(`ci-bootstrap` 피처)로 보완 예정 |

---

## 재발 방지 체계 최종 그림

```
Layer 1: CLAUDE.md Rule #13 (LLM 가이드)
   ↓ (LLM이 생성 시 규칙 참조)
Layer 2: pre-commit hook (기계적 차단) ← 본 피처 주요 산출물
   ↓ (hook 미설치 또는 --no-verify)
Layer 3: CI guard (`ci-bootstrap` 별도 피처)  ← 범위 밖
   ↓ (최종 방어선)
Layer 4: 사람 리뷰 / 정기 grep 점검
```

본 피처로 Layer 1+2 확보. Layer 3(CI)는 후속 피처.

---

## Session Guide

### Module Map

| Module | Files | Description |
|--------|-------|-------------|
| M1. Hook core | `scripts/git-hooks/pre-commit` | 검사 로직 |
| M2. Install | `scripts/install-git-hooks.sh`, `package.json` | 활성화 자동화 |
| M3. Docs | `CLAUDE.md` Rule #13, `README.md` Developer Setup | 사람/LLM 가이드 |
| M4. Test | `tests/legacy-path-guard.test.js` (Nice) | 회귀 방지 |

### Recommended Session Plan

| Session | Modules | Description |
|---------|---------|-------------|
| Session 1 | M1 + M2 | hook 스크립트 + 설치 스크립트 + package.json. 로컬 수동 검증 |
| Session 2 | M3 | CLAUDE.md + README 문서화. 기존 Rule 번호 충돌 확인 |
| Session 3 | M4 (선택) | 통합 테스트. Nice 우선순위로 Do에서 건너뛸 수 있음 |

---

## Design 검증 체크리스트

- [x] Plan의 SC-01~06 모두 설계에 반영
- [x] 의존성 0 재확인 (ripgrep 의존 제거)
- [x] hook 스크립트 POSIX 호환성 (bash + git + grep만)
- [x] 허용 예외 목록 단일 지점 (`is_excluded` 함수)
- [x] bypass 정책 문서화 위치 확정
- [ ] Do 진입 전 CLAUDE.md 현재 Rule 수 확인 (Rule #13 번호 유효성)
- [ ] Do 진입 전 README의 Quick Start 섹션 위치 확인

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-17 | 초기 작성 — ripgrep 의존 제거 후 순수 bash+grep 채택, 5.1~5.6 구현 스펙 확정, 4-Layer 재발 방지 체계 정의 |
| v1.1 | 2026-04-17 | Do 진입 전 재검증: 기존 `.hooks/pre-commit` + `npm run prepare-hooks` 인프라 발견. §5.1 기존 hook 확장으로 변경, §5.2 신규 설치 스크립트 제거(재사용). Rule #10 Search Before Building 준수 |

<!-- template version: v0.18.0 -->
