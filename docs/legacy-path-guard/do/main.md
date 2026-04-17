# legacy-path-guard - 구현 로그

> ⚙️ **Do 단계 산출물**: 설계에서 확정된 구조를 실제 파일로 반영한 로그.
> 참조: `docs/legacy-path-guard/plan/main.md`, `docs/legacy-path-guard/design/main.md` (v1.1)

## Executive Summary

| 항목 | 결과 |
|------|------|
| 변경 파일 | 3 modify + 1 create (본 Do 문서) |
| 신규 의존성 | 0건 (SC-06 달성) |
| 검증 | 격리 git repo에서 위반 차단 + 예외 통과 모두 확인 |
| 활성화 상태 | **현재 프로젝트에서 `core.hooksPath` 미설정** — 사용자가 `npm run prepare-hooks` 1회 실행 필요 |

---

## 실행 결과 요약

### 변경 파일 인벤토리

| # | 파일 | Change | 설명 |
|---|------|:------:|------|
| 1 | `.hooks/pre-commit` | modify | 기존 ESLint/tests 검사 앞에 **legacy-path-guard 섹션 추가** (fail-fast) |
| 2 | `CLAUDE.md` | modify | Mandatory Rules에 **Rule #13 추가** (레거시 경로 금지) |
| 3 | `README.md` | modify | `Testing` 직후 **"Developer Setup" 섹션 추가** (활성화 방법 + 검사 항목 + 비활성화 + `--no-verify` 금지 안내) |
| 4 | `docs/legacy-path-guard/do/main.md` | create | 본 Do 문서 |

### Plan 대비 변경 (design v1.1에서 이미 반영)

| Plan 원안 | Do 실행 | 사유 |
|-----------|---------|------|
| `scripts/git-hooks/pre-commit` 신규 | `.hooks/pre-commit` 기존 확장 | 기존 인프라 재사용 (CLAUDE.md Rule #10) |
| `scripts/install-git-hooks.sh` 신규 | **생성하지 않음** | `npm run prepare-hooks` 기존 재사용 |
| `package.json` `setup-hooks` script 추가 | **추가하지 않음** | 기존 `prepare-hooks` 사용 |
| `rg --glob` 패턴 | `grep -nE` + `git diff --cached --name-only` | ripgrep 미설치 환경 대응 (의존성 0) |

---

## 실제 구현 스니펫

### .hooks/pre-commit — 추가된 legacy-path-guard 섹션

```sh
# ── legacy-path-guard ──────────────────────────────────────────────
# @see docs/legacy-path-guard/design/main.md §5.1
LEGACY_PATTERN='docs/[0-9][0-9]-'
violations=""
for file in $(git diff --cached --name-only --diff-filter=ACM); do
  [ -z "$file" ] && continue
  case "$file" in
    docs/_legacy/*|CHANGELOG.md|tests/paths.test.js|README.md) continue ;;
    docs/legacy-path-guard/*|docs/docs-structure-redesign/*) continue ;;
    .hooks/pre-commit) continue ;;
  esac
  matches=$(git show ":$file" 2>/dev/null | grep -nE "$LEGACY_PATTERN" || true)
  if [ -n "$matches" ]; then
    violations="${violations}
[$file]
$matches
"
  fi
done

if [ -n "$violations" ]; then
  printf '\n❌ legacy-path-guard: 레거시 경로 docs/NN- 패턴 감지\n' >&2
  printf '%s\n' "$violations" >&2
  printf '💡 새 구조로 치환: docs/{feature}/{phase}/main.md\n' >&2
  printf '   예외가 필요하면 .hooks/pre-commit 의 case 문에 추가\n' >&2
  exit 1
fi
echo "[VAIS] legacy-path-guard passed."
```

### CLAUDE.md — 신규 Rule #13

> 13. **레거시 경로 금지** — 문서·코드 모두 `docs/NN-` (예: `docs/01-plan/`, `docs/02-design/`) 패턴 사용 금지. 새 구조 `docs/{feature}/{phase}/main.md`만 사용. 예외: `docs/_legacy/`, `CHANGELOG.md`(릴리즈 이력), `tests/paths.test.js` 회귀 가드 문자열, 본 피처 문서 자체. `.hooks/pre-commit`이 자동 차단하며, 설치는 `npm run prepare-hooks` 1회 실행. `--no-verify` 사용은 금지.

### README.md — Developer Setup

`Testing` 섹션 직후에 추가. 활성화 명령, 검사 3종(legacy-path-guard + ESLint + tests), 비활성화 방법, `--no-verify` 금지 경고 포함.

---

## 검증 기록 (격리 git repo에서 수동 테스트)

### Test 1: 위반 감지 → 차단 (P0)

**셋업**: 임시 repo에 `agents/cto/bad.md` 생성 (내용: `old reference: docs/01-plan/cto_x.plan.md`) + `docs/_legacy/01-plan/legacy.md` (레거시 패턴 포함)

**실행**: `git commit -m "test commit"`

**결과**:
```
[VAIS] Running pre-commit checks...

❌ legacy-path-guard: 레거시 경로 docs/NN- 패턴 감지

[agents/cto/bad.md]
1:old reference: docs/01-plan/cto_x.plan.md

💡 새 구조로 치환: docs/{feature}/{phase}/main.md
   예외가 필요하면 .hooks/pre-commit 의 case 문에 추가
```

✅ **Pass** — 위반 감지 + 예외(`_legacy/`) 무시 + exit 1 차단

### Test 2: 예외만 남았을 때 통과 (P0)

**셋업**: Test 1에서 `bad.md` 제거, `good.md`(새 구조 경로)만 staged, `_legacy/legacy.md`도 staged

**실행**: `git commit -m "only good + legacy"`

**결과**:
```
[VAIS] Running pre-commit checks...
[VAIS] legacy-path-guard passed.
```

✅ **Pass** — legacy-path-guard 통과 (이후 ESLint는 테스트 환경에 scripts/ 없어 실패하나 이는 우리 hook 검사와 무관)

### Test 3: 현재 프로젝트 활성화 상태

**실행**: `git config --get core.hooksPath`

**결과**: (empty output)

⚠️ **현재 프로젝트에서 hook 비활성**. 사용자가 `npm run prepare-hooks` 1회 실행 시 활성화됨.

---

## Success Criteria 평가 (Do 시점 간이 평가)

| ID | Criterion | 상태 | 근거 |
|----|-----------|:----:|------|
| SC-01 | hook이 레거시 경로 커밋 차단 | ✅ Met | Test 1 결과 |
| SC-02 | 허용 예외는 통과 | ✅ Met | Test 2 결과 + case 문 |
| SC-03 | `npm run prepare-hooks` 1회로 활성 | ⏳ 사용자 실행 대기 | 명령 자체는 기존부터 유효 |
| SC-04 | CLAUDE.md Rule #13 추가 | ✅ Met | line 142 |
| SC-05 | README에 활성화 안내 | ✅ Met | "Developer Setup" 섹션 추가 |
| SC-06 | 신규 의존성 0 | ✅ Met | `package.json` dependencies 불변 |

QA 단계에서 공식 평가.

---

## 주요 결정 및 실행 기록

### D1. 기존 인프라 재사용 (Rule #10 Search Before Building 적용)

Do 진입 직전 `.hooks/pre-commit` + `npm run prepare-hooks` 발견 → 신규 스크립트 생성 중단 → design v1.1에 반영 후 실행

### D2. 허용 예외 확장

Plan/Design의 예외 목록에 **본 피처 문서 자체**(`docs/legacy-path-guard/*`) 추가 필요 확인 — plan/design/do 문서 내부에서 규칙 설명을 위해 `docs/NN-` 예시를 인용하므로 예외 지정 필수. 동일 이유로 **`docs/docs-structure-redesign/*`** 도 예외에 추가 (앞서 완료된 피처의 plan/design/do/qa/report 문서 내에도 레거시 경로 설명 포함)

### D3. `.hooks/pre-commit` 자체 예외

Hook 스크립트 본문 자체에 `LEGACY_PATTERN='docs/[0-9][0-9]-'`처럼 패턴 문자열 포함 → `.hooks/pre-commit` 파일도 예외에 추가 (메타-self-reference)

### D4. `--no-verify` 정책

Design에서는 "기술적 허용"으로 열어뒀으나 CLAUDE.md Rule #13 + README 모두에 **"사용 금지"** 명문화. 사용자 메모리 "Always use /vais commit" 규칙과 일관성 확보

---

## 잔여 작업 (QA 단계로 이관)

- [ ] 공식 SC-01~06 Met/Partial/Not Met 평가
- [ ] OWASP Top 10 스캔 (hook 스크립트 명령어 주입 여부 등)
- [ ] 전체 테스트 회귀 확인 (paths.test.js + 기타 175 tests)
- [ ] CHANGELOG.md 엔트리 초안 (0.52.2 또는 0.53.0)
- [ ] 버전 bump 방향 결정

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-17 | 초기 작성 — `.hooks/pre-commit` 확장 + CLAUDE.md Rule #13 + README Developer Setup 섹션. 격리 repo 수동 검증 Pass. 신규 의존성 0. Rule #10 준수 (기존 인프라 재사용) |
