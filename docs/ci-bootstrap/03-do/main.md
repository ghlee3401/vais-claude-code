# ci-bootstrap — Do

> 참조 문서: `docs/ci-bootstrap/01-plan/main.md`, `docs/ci-bootstrap/02-design/main.md`
> 담당 C-Level: **COO** (release-engineer)
> 실행일: 2026-04-17

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | Layer 2(pre-commit) 단독으론 hook 미설치자 우회 가능. 저장소 public화로 외부 PR 리스크 존재 |
| **WHO** | 모든 PR 제출자(외부 포함), 유지보수자(merge 권한), 미래 Claude Code agent |
| **SUCCESS** | `.github/workflows/ci.yml` 1개가 PR/push 시 3종 검사(legacy-path + ESLint + test) 자동 실행 |
| **SCOPE** | 워크플로우 1개 + 3종 검사. 배포 자동화·성능 regression·시크릿 스캔은 범위 밖 |

---

## 구현 내역

### Session 1 — 공용 스크립트 + hook 리팩터

| 파일 | 변경 | 결과 |
|------|------|------|
| `scripts/check-legacy-paths.sh` | **create** | `--mode=staged` / `--mode=tree` 인터페이스. EXCEPTIONS 배열을 단일 소스로 관리. 종료 코드 0/1. GNU bash 5.x 호환 |
| `.hooks/pre-commit` | **modify** | legacy-path inline 블록(28줄) → `bash scripts/check-legacy-paths.sh --mode=staged` 1줄 치환. ESLint/test 블록 유지 |

**변경 세부 (`pre-commit`):**
- 제거: `LEGACY_PATTERN`, `violations` 루프, `case` 예외 분기, `git show :$file | grep` 로직
- 추가: `bash scripts/check-legacy-paths.sh --mode=staged` 단일 호출
- 동작 동일성: 예외 리스트·출력 메시지·종료 코드 모두 스크립트 내에서 동일하게 유지

**예외 리스트 (`scripts/check-legacy-paths.sh` EXCEPTIONS 배열):**
```
docs/_legacy/*
CHANGELOG.md
tests/paths.test.js
README.md
CLAUDE.md
docs/legacy-path-guard/*
docs/docs-structure-redesign/*
docs/ci-bootstrap/*
.hooks/pre-commit
scripts/check-legacy-paths.sh
```

---

### Session 2 — lockfile + eslint devDep

| 파일 | 변경 | 결과 |
|------|------|------|
| `package.json` | **modify** | `devDependencies: { "eslint": "^9.0.0" }` 추가 |
| `package-lock.json` | **create** | lockfileVersion 3 스텁 생성 |

**주의 — lockfile 스텁 상태 (필수 사용자 액션):**

현재 `package-lock.json`은 eslint 의존성 트리가 없는 최소 스텁입니다. `npm ci`는 lockfile에 실제 패키지 항목이 없으면 실패합니다.

**CI Push 전 필수 실행:**
```bash
npm install
# package-lock.json이 eslint 9.x 전체 트리로 갱신됨
git add package-lock.json
```

이후 `/vais commit`으로 커밋.

---

### Session 3 — GitHub Actions workflow

| 파일 | 변경 | 결과 |
|------|------|------|
| `.github/workflows/ci.yml` | **create** | trigger: PR + main push + workflow_dispatch. job: `build-and-test`. steps: checkout → setup-node@v4 → npm ci → legacy-path guard → lint → test |

**Step 순서 (design §2.4 준수):**
1. `actions/checkout@v4` (fetch-depth: 0 — git ls-files가 전체 트리 접근)
2. `actions/setup-node@v4` (node-version: 20, cache: npm)
3. `npm ci`
4. `bash scripts/check-legacy-paths.sh --mode=tree`
5. `npm run lint`
6. `npm test`

**permissions:** `contents: read` (최소 권한, design D8)

---

### Session 4 — README + Do 문서

| 파일 | 변경 | 결과 |
|------|------|------|
| `README.md` | **modify** | 상단 뱃지에 CI status 뱃지 추가 (GitHub Actions 기본). "CI Status Check 강제" 섹션 추가 (branch protection 가이드) |
| `docs/ci-bootstrap/03-do/main.md` | **create** | 본 문서 |

**CI 뱃지 URL:**
```
https://github.com/ghlee3401/vais-claude-code/actions/workflows/ci.yml/badge.svg
```

---

## 검증 명령 (SC 매핑)

| SC ID | 검증 명령 | 상태 |
|-------|----------|------|
| SC-01 | YAML 구문: `cat .github/workflows/ci.yml` 수동 검토 또는 GitHub Actions UI | 로컬 검토 완료 |
| SC-02 | 테스트 PR 생성 후 Actions 탭 확인 | QA 단계 |
| SC-03 | 의도적 테스트 실패 PR → status failure 확인 후 revert | QA 단계 |
| SC-04 | lint 위반 라인 추가 PR → failure 확인 후 revert | QA 단계 |
| SC-05 | `docs/01-test/foo.md` 포함 PR → legacy-path-guard failure 확인 | QA 단계 |
| SC-06 | main merge 후 push trigger 확인 | QA 단계 |
| SC-07 | README 뱃지 렌더링 확인 (GitHub UI) | QA 단계 |
| SC-08 | `docs/ci-bootstrap/02-design/main.md §5` + README 섹션 존재 | 완료 |

**로컬 검증 명령:**
```bash
# legacy-path guard (tree mode)
bash scripts/check-legacy-paths.sh --mode=tree

# lint (npm install 완료 후)
npm run lint

# tests
npm test
```

---

## Rollback 절차

| 시나리오 | 대응 |
|---------|------|
| CI workflow 오작동 | `.github/workflows/ci.yml` revert PR. `workflow_dispatch`로 재실행 후 확인 |
| legacy-path 오탐 | `scripts/check-legacy-paths.sh` EXCEPTIONS 배열에 경로 추가 PR |
| ESLint 규칙 오탐 | `eslint.config.js` rules 수정 PR. `--no-verify` 사용 금지 |
| hook 회귀 | `.hooks/pre-commit`에서 `bash scripts/check-legacy-paths.sh --mode=staged` 호출 제거 후 인라인 로직 복원 |
| lockfile 충돌 | `npm install` 재실행 → lockfile 재생성 후 커밋 |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-17 | 초기 작성 — Session 1~4 구현 완료. lockfile 스텁 이슈 명시 (npm install 필요) |

<!-- template version: v0.18.0 (ops variant) -->
