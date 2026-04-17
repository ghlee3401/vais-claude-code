# Sub-plan 00 — CI Removal (축소)

> 선행: —
> 후행: 05 (docs 갱신)
> 담당 SC: SC-1
> 갱신: 2026-04-17 CP-1 결정에 따라 **범위 축소** (ESLint/pre-commit/legacy-path-guard 전부 유지)

---

## 0. 범위 정의

CP-1 확정: "CI 인프라(자동 실행 채널) ≠ 코드 품질 도구(ESLint, tests, pre-commit)". 분리해서 CI 인프라만 제거.

| 대상 | 위치 | 조치 |
|------|------|------|
| GitHub Actions CI workflow | `.github/workflows/ci.yml` | **삭제** |
| `.github/` 디렉토리 (다른 파일 없으면) | `.github/` | **삭제** |
| README.md CI 배지 (있다면) | `README.md` | **삭제** |
| `package.json > scripts.lint` | | **유지** (로컬 `npm run lint`로 계속 사용) |
| `eslint.config.js` | | **유지** |
| `devDependencies.eslint` | `package.json` | **유지** |
| `.hooks/pre-commit` | | **유지** |
| `scripts/check-legacy-paths.sh` | | **유지** (pre-commit이 호출) |
| `package.json > scripts.prepare-hooks` | | **유지** |
| CLAUDE.md Rule #13 pre-commit 문장 | | **유지** (pre-commit 살아있으므로) |

범위 **밖** (유지):
- `agents/coo/release-engineer.md` (사용자 프로젝트 CI/CD 셋업 에이전트) — 플러그인 기능 (CP-8)

---

## 1. 태스크 상세

### 1.1 GitHub Actions 제거

```
rm -rf .github/workflows/
# .github/ 안에 다른 파일 있는지 확인 후
rmdir .github/ (비어있으면)
```

**검증**: `ls .github/workflows` → fail

### 1.2 README.md 정리 (CI 배지 있다면)

```
grep -i "shields.io\|github actions\|workflow.*badge" README.md
```
결과 있으면 해당 줄 삭제. 없으면 skip.

### 1.3 (확인) 로컬 품질 도구 동작

CI가 사라졌을 때 기여자가 수동으로 동등 검증을 돌릴 수 있어야 한다:

```
npm test              # node --test tests/*.test.js
npm run lint          # eslint scripts/ lib/ hooks/ --max-warnings=0
bash scripts/check-legacy-paths.sh --mode=tree   # 레거시 경로 전체 스캔
```

세 명령 모두 기존대로 동작해야 하며 **수정이 필요하지 않다**. 단순 확인만.

### 1.4 CHANGELOG.md 갱신 (sub-plan 05에서 병합)

`[0.55.0]` 섹션에 다음 기록:
- Removed: GitHub Actions CI workflow (`.github/workflows/ci.yml`)
- Rationale: 플러그인 자체 CI는 Claude Code 마켓플레이스 유통에 필수가 아니며, 검증은 로컬 `npm test`, `npm run lint`, `.hooks/pre-commit`으로 수행 (기존 도구 전부 유지).

---

## 2. 검증

| # | 검증 항목 | 방법 |
|---|-----------|------|
| V-1 | `.github/workflows/ci.yml` 부재 | `ls .github/workflows/ci.yml` fail |
| V-2 | `package.json`의 `lint`, `prepare-hooks` 스크립트 + `eslint` devDep 여전히 존재 | `grep '"lint"\|"prepare-hooks"\|"eslint"' package.json` 3곳 match |
| V-3 | `.hooks/pre-commit` 여전히 존재 | `ls .hooks/pre-commit` |
| V-4 | `eslint.config.js` 여전히 존재 | `ls eslint.config.js` |
| V-5 | `scripts/check-legacy-paths.sh` 여전히 존재 | `ls scripts/check-legacy-paths.sh` |
| V-6 | `npm test` 통과 | `node --test tests/*.test.js` |
| V-7 | `npm run lint` 통과 | `npm run lint` |

---

## 3. 리스크 & 완화

| 리스크 | 완화 |
|--------|------|
| 기여자가 PR push 시 CI가 없어 자동 검증 실패 모름 | README에 "PR 전 `npm test && npm run lint` 수동 실행" 가이드 추가. `.hooks/pre-commit`이 로컬에서 이미 강제 |
| 누군가 나중에 CI를 다시 추가하고 싶을 때 | git history에서 `.github/workflows/ci.yml` 복원 가능 |

---

## 4. Carry-forward

**다음 sub-plan**:
- ESLint가 **남아있음**. 01~03의 파일 삭제 시 린트 경고 0 유지 주의.
- `.hooks/pre-commit`이 **남아있음**. 커밋 시 기존 규칙 계속 적용.
- sub-plan 05 CHANGELOG에 "CI 삭제" 단 한 줄만 기록하고 "ESLint 제거" 등은 **기록하지 않는다** (제거 안 됨).
