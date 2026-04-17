# legacy-path-guard - 기획서

> ⛔ **Plan 단계 범위**: 이 문서는 분석과 결정만 기록합니다. 실제 hook/스크립트 생성은 Do 단계에서 수행합니다.
> 🧭 **CEO 전략 plan**: 범위·담당 C-Level·옵션 선택을 결정. 기술 세부 설계는 design 단계에서 담당 C-Level(COO)이 보강합니다.

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | `docs-structure-redesign`(v0.52.1)에서 30개 파일 레거시 경로 참조를 제거했으나, **구조적 재발 방지 수단이 없음**. LLM·사람 모두 문서를 작성할 때 옛 경로 패턴을 다시 도입할 수 있음 |
| **Solution** | **Pre-commit hook + CLAUDE.md rule 조합**으로 커밋 시점에 레거시 경로(`docs/\d\d-`)를 자동 차단하고, LLM 가이드라인에 명시해 사전 예방 |
| **Function/UX Effect** | 개발자: 커밋 순간 즉각 피드백(경로 규칙 위반 행 표시) / LLM: 문서 작성 시 CLAUDE.md rule을 통해 규칙 내재화 |
| **Core Value** | "정합성 복구"를 **1회성 수정**에서 **상시 보장**으로 격상. 단위 경제성: hook 1개로 향후 모든 레거시 경로 회귀 제거 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | `docs-structure-redesign` 피처에서 드러난 "부분 구현 방치" 패턴 재발 차단 |
| **WHO** | VAIS Code 플러그인 유지보수자(직접 커밋), Claude Code LLM(자동 생성 경로 검증) |
| **RISK** | hook 설치 방식(husky vs native git hooks) 의존성 추가 여부, bypass(`--no-verify`) 관련 사용자 메모리 충돌 검토 |
| **SUCCESS** | 레거시 경로 포함 커밋이 차단됨 + CLAUDE.md에 규칙 명시 + 개발 문서에 hook 활성화 방법 안내 |
| **SCOPE** | **pre-commit hook(a) + CLAUDE.md rule(c)** 구현. **CI guard(b)는 범위 밖** (`.github/` 부재 → 별도 피처 `ci-bootstrap`). 레거시 문서 전수 재정리 작업도 범위 밖 |

---

## 0. 아이디어 개요

### 아이디어 한 줄 설명
> 커밋 시점에 `docs/\d\d-` 패턴 레거시 경로 참조를 자동 차단하는 **pre-commit hook**과, LLM이 애초에 쓰지 않도록 하는 **CLAUDE.md rule**을 도입한다.

### 배경 (왜 필요한지)
- 현재 문제: `docs-structure-redesign`이 재발을 막는 guard 없이 끝남. 실제 재발 시 다시 수십 파일 일괄 치환 사이클 반복
- 기존 해결책의 한계: **정기 grep 점검**은 휴먼 의존, **코드 리뷰**는 LLM·봇 생성에 약함
- 이 아이디어가 필요한 이유: **자동화된 경계 차단**이 가장 저비용·고효과. v0.52.1 report §재발 방지에서 (a)+(c) 조합 권장 확정

### 타겟 사용자
- 주요 사용자: **커밋 수행자** (사람 + Claude Code agent)
- 보조 사용자: **PR 리뷰어** (CI 미구축 시 사람 리뷰만)
- Pain Point: 레거시 경로 재발 시 30개 파일 재치환 반복 비용

### 사용자 시나리오

1. 상황: Claude Code agent가 새 에이전트 문서 작성하면서 무의식적으로 `docs/01-plan/...` 문자열을 사용
2. 행동: 사용자가 `/vais commit` 실행
3. 결과(현재): 그대로 커밋됨 → 차기 작업에서 grep 반복 발견
4. 결과(목표): pre-commit hook이 **커밋 차단** + 위반 라인 표시 → 즉시 수정 후 재커밋

## 0.5 MVP 범위

### 핵심 작업 브레인스토밍 (중요도/난이도 매트릭스)

| 작업 | 중요도 | 난이도 | MVP 포함 |
|------|:------:|:------:|:--------:|
| Pre-commit hook 스크립트 작성 (shell/node) | 5 | 2 | **Y** |
| hook 설치 방식 결정 (husky / git hooks / package.json) | 5 | 3 | **Y** |
| `.gitignore` 제외 규칙 확인 및 hook 자동 복구 경로 | 3 | 2 | Y |
| CLAUDE.md Rule 추가 (레거시 경로 금지) | 5 | 1 | **Y** |
| README에 hook 활성화 방법 문서화 | 3 | 1 | Y |
| hook bypass 정책 결정 (`--no-verify` 허용/차단 여부) | 4 | 2 | **Y** |
| 위반 시 친화적 에러 메시지 + 자동 수정 제안 | 3 | 2 | Y |
| 허용 예외 목록 (`docs/_legacy/`, `CHANGELOG.md`, 테스트 가드) 명시화 | 5 | 1 | **Y** |
| CI guard (GitHub Actions) | 3 | 4 | N (CI 인프라 부재, 별도 피처) |
| pre-push hook 확장 | 2 | 2 | N (pre-commit로 충분) |
| 다른 규칙 guard로 확장 (시크릿 스캔 등) | 2 | 4 | N (CSO 기존 기능과 중복) |

### MVP 포함 (7항목)
1. Pre-commit hook 스크립트 (`scripts/git-hooks/pre-commit` 또는 `scripts/legacy-path-guard.sh`)
2. 설치 방식: **native git hooks + `scripts/install-git-hooks.sh`** 권장 (husky 의존성 추가 회피, Node 필수 요건 없음)
3. 허용 예외: `docs/_legacy/`, `CHANGELOG.md`, `tests/paths.test.js`의 회귀 가드 문자열
4. CLAUDE.md Rule #13(신규) 추가: "레거시 경로 패턴(`docs/\d\d-`) 사용 금지"
5. README에 "Developer Setup → Git hooks 활성화" 섹션 추가
6. bypass 정책: `--no-verify`는 **사용자 메모리 규칙에 따라 금지** (기본). 긴급시 사용자 명시 승인 필요
7. 위반 메시지: 해당 파일:라인 + 권장 치환 패턴 표기

### 이후 버전으로 미룰 작업
- CI guard: `ci-bootstrap` 피처로 분리 (.github/workflows 신규 구축 필요)
- pre-push hook, 다른 규칙 (시크릿 스캔) 확장

## 0.6 경쟁/참고 분석

| 서비스 | 유사 기능 | 장점 | 단점 | 차별화 포인트 |
|-------|---------|------|------|------------|
| husky | Node.js 기반 git hook 관리 | 설치 편의 | Node 의존성 + `.husky/` 디렉토리 추가 | 본 프로젝트는 이미 Node 사용 중, husky가 오버킬 |
| pre-commit (Python) | 멀티 언어 hook 프레임워크 | 공유 설정 | Python 의존성 | 본 프로젝트는 Python 비사용 |
| native git hooks | Built-in | 의존성 0 | 팀원마다 개별 설치 필요 | 설치 스크립트 제공으로 해결 가능 — **채택** |
| lint-staged | 파일 단위 검사 | 성능 | 구성 복잡도 | 단일 grep 규칙에 불필요 |

**결론**: native git hooks + 설치 스크립트. 최소 의존성.

## 0.7 PRD 입력 (CTO 전용)

| Key | Value |
|-----|-------|
| PRD 경로 | 없음 (강행 모드 — 내부 기술부채 처리) |
| 완성도 | missing |
| 검사 시각 | 2026-04-17 |

### 강행 모드 사유

- 사용자 선택: `docs-structure-redesign` report §재발 방지 옵션 (a)+(c) 조합이 이미 확정
- 가정한 요구사항:
  1. pre-commit hook은 **opt-in** (팀원이 설치 스크립트 실행해야 활성)
  2. CI 무구축 상태이므로 hook 미설치자의 커밋은 리뷰로만 잡음 (알려진 gap)
  3. bypass는 기본 금지 (사용자 메모리 "Always use /vais commit" 규칙과 일관)

## 1. 개요

### 1.1 기능 설명
커밋 시점에 `docs/\d\d-` 패턴 레거시 경로 참조를 감지하여 차단하는 pre-commit hook + LLM 가이드라인 추가.

### 1.2 목적
- 해결하려는 문제: 레거시 경로 재발 (피처 단위 재작업 비용)
- 기대 효과: 상시 자동 차단으로 `docs-structure-redesign` 같은 대규모 재마이그레이션 불필요
- 대상 사용자: 모든 커밋 수행자 (사람 + Claude Code agent)

## 2. Plan-Plus 검증

### 2.1 의도 발견
근본 문제는 "경로 문자열 회귀"가 아니라 **"플러그인 내부 규칙의 machine-enforceable 부재"**. 즉, CLAUDE.md rule은 LLM 가이드에 불과하고, 실제 타입체크 같은 강제 수단이 없음. hook은 이 갭을 메우는 최소 수단.

### 2.2 대안 탐색

| # | 대안 | 장점 | 단점 | 채택 여부 |
|---|------|------|------|----------|
| 1 | **Native git hook + 설치 스크립트 (a) + CLAUDE.md rule (c)** | 의존성 0, 본 피처 범위에 정확히 맞음 | 팀원이 hook 설치 해야 함 | ✅ 채택 |
| 2 | husky 도입 | 설치 자동화 | `package.json` 의존성 + `prepare` 스크립트 + husky 런타임 | ❌ 기각 (오버킬) |
| 3 | CI guard만 (b) | 서버 강제 | `.github/` 신규 구축 필요 + 범위 확대 | ❌ 기각 (별도 피처 `ci-bootstrap`) |
| 4 | CLAUDE.md rule만 (c) | 0비용 | hard enforcement 아님, LLM 가이드 한계 | ❌ 기각 (단독으론 약함, 조합으로 채택) |
| 5 | lib/에 runtime validator | 완벽 강제 | 과설계, 커밋 시점보다 늦음 | ❌ 기각 |

**채택: 대안 1** — (a)+(c) 조합. 최소 의존성 + 2중 방어선.

### 2.3 YAGNI 리뷰
- [x] 현재 필요한 기능만 포함 (pre-commit + rule) → Y
- [x] 미래 요구사항 과잉 설계 없음 (pre-push, 다른 규칙 확장은 범위 밖)
- [x] 제거할 수 있는 기능: 위반 시 "자동 수정 제안"은 단순 메시지로 축소

## 3. 사용자 스토리

| # | As a... | I want to... | So that... |
|---|---------|-------------|------------|
| 1 | 플러그인 유지보수자 | 커밋 시 레거시 경로가 자동 차단되기를 | 재발 시 수십 파일 재치환 반복을 막고 싶다 |
| 2 | Claude Code agent | CLAUDE.md에 명시된 규칙을 참조할 수 있기를 | 문서 생성 시 레거시 패턴을 피할 수 있다 |
| 3 | 신규 기여자 | 간단한 `npm run setup-hooks` 한 번으로 hook을 설치할 수 있기를 | 설정 부담 없이 기여 가능하다 |

## 4. 기능 요구사항

### 4.1 기능 목록

| # | 기능 | 설명 | 관련 파일(예상) | 우선순위 | 구현 상태 |
|---|------|------|----------------|:-------:|:--------:|
| F1 | pre-commit hook 스크립트 | `rg 'docs/\d\d-' --glob '!docs/_legacy/**' --glob '!CHANGELOG.md'` 검사 + 위반 시 exit 1 | `scripts/git-hooks/pre-commit` 또는 `scripts/legacy-path-guard.sh` | Must | 미구현 |
| F2 | 설치 스크립트 | `scripts/install-git-hooks.sh` — `git config core.hooksPath scripts/git-hooks` 설정 | 동 | Must | 미구현 |
| F3 | package.json script | `"setup-hooks": "bash scripts/install-git-hooks.sh"` | `package.json` | Must | 미구현 |
| F4 | 허용 예외 처리 | `_legacy/`, `CHANGELOG.md`, 회귀 가드 등 예외 허용 | F1 내부 | Must | 미구현 |
| F5 | 친화적 에러 메시지 | 위반 파일:라인 + 권장 치환 패턴 표시 | F1 내부 | Must | 미구현 |
| F6 | CLAUDE.md Rule #13 추가 | "레거시 경로 패턴 사용 금지" 명시 | `CLAUDE.md` | Must | 미구현 |
| F7 | README 설치 가이드 | "Developer Setup → Git hooks 활성화" 섹션 | `README.md` | Should | 미구현 |
| F8 | bypass 정책 문서화 | `--no-verify` 금지 (사용자 메모리 준수) 명시 | CLAUDE.md 또는 README | Should | 미구현 |
| F9 | 통합 테스트 | 위반 파일 생성 → hook 실행 → exit 1 검증 | `tests/legacy-path-guard.test.js` (신규) | Nice | 미구현 |

### 4.2 기능 상세

#### F1. pre-commit hook
- **트리거**: `git commit` 실행 직전
- **정상 흐름**: (1) staged 파일 목록 추출 → (2) `rg 'docs/\d\d-'` 실행 (예외 glob 적용) → (3) 위반 0건이면 exit 0 → 커밋 진행
- **예외 흐름**: 위반 1건 이상이면 exit 1 + 파일/라인/권장 치환 메시지 출력 → 커밋 차단
- **산출물**: `scripts/git-hooks/pre-commit` (실행 권한 부여)

#### F2. 설치 스크립트
- **트리거**: `npm run setup-hooks` 또는 `bash scripts/install-git-hooks.sh`
- **정상 흐름**: `git config core.hooksPath scripts/git-hooks` 설정 → 확인 메시지
- **예외 흐름**: non-git 디렉토리면 경고 후 종료
- **산출물**: `scripts/install-git-hooks.sh`

## 5. 정책 정의

### 5.1 경로 규칙 정책 (F4 허용 예외)

| 카테고리 | 허용 패턴 | 사유 |
|---------|----------|------|
| `_legacy/` 하위 | `docs/_legacy/**/*.md` | 역사적 레퍼런스 보존 |
| `CHANGELOG.md` | 전체 | 릴리즈 이력은 옛 경로 그대로 참조 가능 |
| 회귀 가드 테스트 | `tests/paths.test.js:112` 주변 문자열 | 레거시 경로 사용 금지 검증 목적 |
| README 안내 블록 | `README.md:287` 주변 | `_legacy/` 이관 안내 서술 |

### 5.2 Bypass 정책

| 항목 | 규칙 | 비고 |
|------|------|------|
| `git commit --no-verify` | **금지** | 사용자 메모리 "Always use /vais commit" 규칙과 일관. hook skip 자체가 재발 벡터 |
| 긴급 commit 필요 시 | 사용자가 직접 파일 수정 후 재커밋 | hook bypass보다 빠름 |
| hook 설치 없음 | 경고는 있으나 차단 없음 (opt-in) | CI guard(별도 피처)로 보완 |

### 5.3 유효성 검증 규칙

| 항목 | 검증 방법 |
|------|----------|
| hook 자체 동작 | 위반 파일 생성 → `git commit` 시도 → exit 1 확인 |
| 예외 허용 | `docs/_legacy/` 내부에 옛 패턴 유지해도 통과 |
| CLAUDE.md 규칙 | Rule #13 추가 + grep 검증 |

## 6. 비기능 요구사항

| 항목 | 요구사항 | 기준 |
|------|---------|------|
| 성능 | hook 실행 시간 | 200ms 이하 (ripgrep 기본 성능) |
| 의존성 | 신규 npm 패키지 0개 | 확인 필수 |
| 호환성 | macOS/Linux 기본 지원 | Windows는 Git Bash 경유 |
| 유지보수 | 허용 예외 추가 시 단일 파일 수정 | `scripts/git-hooks/pre-commit` 내 상수 관리 |

## Success Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-01 | pre-commit hook이 레거시 경로 커밋 차단 | 위반 파일 테스트 커밋 → exit 1 |
| SC-02 | 허용 예외(`_legacy/`, `CHANGELOG.md`, 회귀 가드)는 통과 | 해당 파일 수정 커밋 → exit 0 |
| SC-03 | `npm run setup-hooks` 1회 실행으로 hook 활성 | `git config --get core.hooksPath` = `scripts/git-hooks` |
| SC-04 | CLAUDE.md Rule #13 추가 | `git grep 'Rule #13\|레거시 경로.*금지' CLAUDE.md` |
| SC-05 | README에 hook 활성화 방법 문서화 | README 내 "Git hooks" 섹션 존재 |
| SC-06 | 신규 의존성 0 | `package.json` dependencies/devDependencies 불변 |

## Impact Analysis

### Changed Resources

| Resource | Type | Change Description |
|----------|------|-------------------|
| `scripts/git-hooks/pre-commit` | create | hook 스크립트 |
| `scripts/install-git-hooks.sh` | create | 설치 자동화 |
| `package.json` | modify | `scripts.setup-hooks` 추가 |
| `CLAUDE.md` | modify | Rule #13 추가 |
| `README.md` | modify | "Developer Setup" 섹션 |
| `tests/legacy-path-guard.test.js` | create (Nice) | hook 통합 테스트 |
| `docs/legacy-path-guard/01-plan/main.md` | create | 본 문서 |
| `docs/legacy-path-guard/{design,do,qa,report}/main.md` | create | 후속 단계 산출물 |

### Current Consumers

| Resource | Operation | Impact |
|----------|-----------|--------|
| `/vais commit` | call git commit | hook 설치 시 차단 동작 추가 — 설계 단계에서 `/vais commit` 내 pre-verify 통합 여부 판단 |
| 기여자 설정 | setup | `npm run setup-hooks` 1회 실행 필요 — README 안내 |

### Verification
- [x] 의존성 추가 없음 확인 계획
- [ ] `.gitignore` / CI 관련 파일 영향 검토 (design 단계)

## 7. 기술 스택

N/A — 인프라 작업 (bash + ripgrep + git config).

## 8. 화면 목록 (예상)

N/A — UI 없음.

## 데이터 모델 개요

N/A — 상태 저장 없음.

## API 엔드포인트 개요

N/A.

## 9. 일정 (예상)

| 단계 | 산출물 |
|------|--------|
| 기획 (CEO) | 본 문서 ✅ |
| 설계 (COO) | `docs/legacy-path-guard/02-design/main.md` — hook 스크립트 구조 + 설치 흐름 |
| 구현 (COO + CTO 협업) | `docs/legacy-path-guard/03-do/main.md` + 실제 스크립트/README |
| QA (CSO 또는 CTO) | `docs/legacy-path-guard/04-qa/main.md` — SC-01~06 검증 |
| 보고 | `docs/legacy-path-guard/05-report/main.md` |

> **CEO 추천 담당**: **COO** (hooks/운영 주 업무). 구현 시 Node/shell 실제 코드 작성은 `release-engineer` 또는 `sre-engineer` 서브에이전트 위임.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-17 | 초기 작성 — CEO 전략 plan. 범위: (a)+(c), CI(b)는 `ci-bootstrap`로 분리. 담당 COO 추천, native git hooks 채택, bypass 금지 정책 |

<!-- template version: v0.18.0 -->
