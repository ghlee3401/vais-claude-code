# Sub-plan 00 — CI Removal

> 선행: —
> 후행: 04 (config cleanup이 ESLint ignore 규칙을 참조할 수 있음), 05 (docs 갱신)
> 담당 SC: SC-1, SC-2

---

## 0. 범위 정의

사용자 지시 "ci 쓰는 부분은 지웠으면 좋겠어"의 정확한 범위:

| 대상 | 위치 | 조치 |
|------|------|------|
| GitHub Actions CI workflow | `.github/workflows/ci.yml` | **삭제** |
| `.github/` 디렉토리 (다른 파일 없으면) | `.github/` | **삭제** |
| ESLint 실행 | `package.json > scripts.lint` | **삭제** |
| ESLint 설정 | `eslint.config.js` | **삭제** |
| ESLint devDependency | `package.json > devDependencies.eslint` | **삭제** |
| pre-commit hook | `.hooks/pre-commit` | **삭제** (CP-1 default) |
| pre-commit 활성화 스크립트 | `package.json > scripts.prepare-hooks` | **삭제** |
| legacy-path guard shell script | `scripts/check-legacy-paths.sh` | **삭제** |
| CLAUDE.md Rule #13 중 pre-commit 강제 문장 | `CLAUDE.md` | **수정** (pre-commit 참조 제거, "새 구조 강제" 원칙만 유지) |

범위 **밖** (유지):
- `agents/coo/release-engineer.md` (사용자 프로젝트에 CI 셋업해주는 에이전트) — 플러그인 **기능**
- `hooks/hooks.json` 및 `hooks/*.js` (Claude Code runtime hooks) — CI와 무관
- `.hooks/` 디렉토리 자체는 pre-commit 파일만 있으므로 삭제 후 디렉토리도 제거

---

## 1. 태스크 상세

### 1.1 GitHub Actions 제거

```
rm -rf .github/workflows/
# .github/ 안에 다른 파일 있는지 확인 후
rmdir .github/ (비어있으면)
```

**검증**: `ls .github` → "No such file or directory"

### 1.2 ESLint 제거

**`package.json` diff**:
```diff
   "scripts": {
     "test": "node --test tests/*.test.js",
-    "lint": "eslint scripts/ lib/ hooks/ --max-warnings=0",
-    "prepare-hooks": "git config core.hooksPath .hooks"
+    "test": "node --test tests/*.test.js"
   },
-  "devDependencies": {
-    "eslint": "^9.0.0"
-  },
```

**파일 삭제**: `eslint.config.js`, `package-lock.json` (ESLint 트랜지티브 디펜던시 제거를 위해 regenerate)

### 1.3 pre-commit hook 제거

```
rm .hooks/pre-commit
rmdir .hooks/
rm scripts/check-legacy-paths.sh
```

**주의**: `scripts/check-legacy-paths.sh`는 CI + pre-commit 둘 다에서 사용. 두 곳 모두 제거 후 스크립트 삭제. 레거시 경로 차단 규칙(Rule #13)은 **CLAUDE.md와 리뷰어 규율**로 대체.

### 1.4 CLAUDE.md Rule #13 수정

현재:
> `.hooks/pre-commit`이 자동 차단(top-level만 검사 — feature 하위 `docs/{feature}/NN-phase/`는 Rule #3에 의해 허용)하며, 설치는 `npm run prepare-hooks` 1회 실행. `--no-verify` 사용은 금지.

수정 후 (pre-commit 참조 삭제):
> 레거시 경로 패턴을 새로 만들지 않는다. 코드 리뷰 / PR 단계에서 수동 확인.

### 1.5 CHANGELOG.md 갱신

`[0.55.0]` 섹션에 다음 기록:
- Removed: GitHub Actions CI workflow (`.github/workflows/ci.yml`)
- Removed: ESLint 설정 및 `lint` 스크립트
- Removed: pre-commit hook (`.hooks/pre-commit`, `scripts/check-legacy-paths.sh`, `npm run prepare-hooks`)
- Rationale: 플러그인 자체 CI는 Claude Code 마켓플레이스 유통에 필수가 아니며, 검증은 로컬 `npm test` 수동 실행으로 충분.

---

## 2. 검증

| # | 검증 항목 | 방법 |
|---|-----------|------|
| V-1 | `.github/workflows/ci.yml` 부재 | `ls .github/workflows/` fail |
| V-2 | `eslint.config.js` 부재 | `ls eslint.config.js` fail |
| V-3 | `package.json`에 `lint`, `prepare-hooks`, `eslint` 키 모두 없음 | `grep "eslint\|prepare-hooks\|\"lint\"" package.json` → 0 |
| V-4 | `.hooks/` 부재 | `ls .hooks` fail |
| V-5 | `scripts/check-legacy-paths.sh` 부재 | `ls scripts/check-legacy-paths.sh` fail |
| V-6 | `npm test` 여전히 통과 | `node --test tests/*.test.js` |
| V-7 | CLAUDE.md에 `.hooks/pre-commit` 언급 0 | `grep "pre-commit\|prepare-hooks" CLAUDE.md` → 0 |
| V-8 | CHANGELOG.md에 `[0.55.0]` 섹션 + 제거 항목 명시 | diff |

---

## 3. 리스크 & 완화

| 리스크 | 완화 |
|--------|------|
| 기여자가 push 시 lint/test 실패를 CI 없이 발견 못 함 | README에 "PR 전 `npm test` 수동 실행" 가이드 추가 |
| 레거시 docs 경로(`docs/01-plan/` 등)가 다시 생성될 수 있음 | CLAUDE.md Rule #13 유지 + PR 리뷰 |
| 다른 도구(lint-staged, husky 등)가 `.hooks/`를 참조 | 현재 package.json에 없음 확인 완료 |

---

## 4. Carry-forward

**다음 sub-plan(01~03)에 전달**:
- ESLint가 사라졌으므로 lib/scripts에 남는 코드는 린트 강제 없음. Dead code 제거 시 "lint 통과 때문에 어쩔 수 없이 남긴 코드" 고려할 필요 없음.
- `check-legacy-paths.sh`가 사라졌으므로 sub-plan 05의 문서 갱신 시 언급 제거.
