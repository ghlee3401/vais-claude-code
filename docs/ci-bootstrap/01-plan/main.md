# ci-bootstrap - 기획서

> ⛔ **Plan 단계 범위**: 이 문서는 분석·결정만 기록합니다. 워크플로우 파일 생성은 Do 단계에서 수행.
> 🧭 **CEO 전략 plan**: 범위 경계·담당 C-Level·CI 도구 선택을 결정. 실제 YAML은 design 단계에서 담당 C-Level(COO)이 구체화합니다.

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 저장소에 CI가 없음 (`.github/` 부재). `legacy-path-guard` pre-commit hook은 opt-in이라 미설치 기여자/`--no-verify` 우회가 가능. 서버 측 강제 검증 수단 부재 |
| **Solution** | **GitHub Actions**로 PR/push 시점에 `npm test` + ESLint + legacy-path 검사를 실행. PR status check로 merge 차단 가능한 상태 확립 |
| **Function/UX Effect** | 기여자: PR 올리면 CI 결과가 자동 표시 / 유지보수자: hook 미설치자도 강제 검증 가능 |
| **Core Value** | 저장소가 **public(github.com/ghlee3401/vais-claude-code)** 인 상태에서 외부 기여가 품질 보장 없이 들어올 리스크 제거. 향후 모든 CI 의존 피처의 공통 기반 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | Layer 2(pre-commit) 단독으론 hook 미설치자 우회 가능. 저장소 public화로 외부 PR 리스크 존재 |
| **WHO** | 모든 PR 제출자(외부 포함), 유지보수자(merge 권한), 미래 Claude Code agent (자동 PR 유즈케이스) |
| **RISK** | GitHub Actions 무료 분 한도(월 2000분 public repo 무제한이나 private 시 과금), workflow 파일 잘못 짜면 무한 loop, branch protection 설정 권한 필요(owner) |
| **SUCCESS** | `.github/workflows/ci.yml` 1개가 PR/push 시 3종 검사(legacy-path + ESLint + test) 자동 실행, 실패 시 PR에서 빨간 X 표시 |
| **SCOPE** | **워크플로우 1개 + 3종 검사**. 배포 자동화·성능 regression·시크릿 스캔은 **범위 밖** (각각 별도 피처) |

---

## 0. 아이디어 개요

### 아이디어 한 줄 설명
> 저장소의 **첫 CI 인프라**를 GitHub Actions로 부트스트랩하고, 기존 pre-commit hook의 3종 검사를 서버에서도 강제한다.

### 배경 (왜 필요한지)
- 현재 문제:
  1. `.github/` 없음 → CI 0
  2. `legacy-path-guard` hook은 opt-in → 미설치자의 커밋·PR은 검증 안 됨
  3. public 저장소라 누구나 PR 가능 → 리뷰어가 로컬에서 하나하나 체크?
- 기존 해결책의 한계:
  - pre-commit hook: 개인 환경만 커버
  - CLAUDE.md Rule: LLM 가이드, hard enforcement 아님
  - 사람 리뷰: 휴먼 스케일 한계 + 놓치기 쉬움
- 이 아이디어가 필요한 이유: **"서버에서 강제 검증"** 이라는 축 자체가 빠져있음. 한 번 구축하면 다른 피처(성능 regression, 시크릿 스캔 등)도 같은 워크플로우에 얹기 쉬움 → bootstrap이라는 이름

### 타겟 사용자
- 주요: 저장소 유지보수자(merge 결정권자), 외부 기여자(PR 제출)
- 보조: 미래 Claude Code agent(자동 PR 유즈케이스)
- Pain Point: 리뷰 시 "테스트 돌려봤나요?" 질의응답 반복 + 레거시 경로 놓치는 리스크

### 사용자 시나리오

1. 상황: 외부 기여자가 `docs/01-plan/foo.md` 작성한 PR 제출
2. 행동: GitHub Actions가 자동 실행
3. 결과(현재): 유지보수자가 수동으로 체크아웃 후 검증 → 놓칠 가능성 있음
4. 결과(목표): `❌ legacy-path-guard` status check 실패 → PR 페이지에 빨간 X → merge 버튼 비활성 → 기여자가 스스로 수정

## 0.5 MVP 범위

### 핵심 작업 브레인스토밍 (중요도/난이도 매트릭스)

| 작업 | 중요도 | 난이도 | MVP 포함 |
|------|:------:|:------:|:--------:|
| `.github/workflows/ci.yml` 신규 생성 | 5 | 2 | **Y** |
| Node.js 셋업 step (actions/setup-node) | 5 | 1 | **Y** |
| `npm test` 실행 | 5 | 1 | **Y** |
| ESLint 실행 (`npm run lint`) | 5 | 1 | **Y** |
| legacy-path-guard 검사 실행 | 5 | 2 | **Y** |
| PR + main push trigger | 5 | 1 | **Y** |
| Job matrix (Node 18, 20, 22) | 3 | 2 | Y (Node 20만 시작, 확장 여지) |
| Branch protection rules 안내 | 4 | 1 | Y (문서화만, 설정은 사용자 수행) |
| CI 뱃지 README 추가 | 2 | 1 | Y |
| 캐시 최적화 (npm cache) | 3 | 2 | Y (기본 내장) |
| 성능 regression 가드 | 2 | 4 | N (별도: `ci-perf-guard`) |
| 시크릿 스캔 (secret-scanner 통합) | 3 | 3 | N (별도: `ci-secret-scan`) |
| 자동 PR 어노테이션 (위반 라인 코멘트) | 2 | 4 | N (Nice later) |
| Dependabot 설정 | 2 | 2 | N (별도: `dependabot-bootstrap`) |
| Release 자동화 | 2 | 4 | N (별도: `release-automation`) |

### MVP 포함 (9항목)
1. `.github/workflows/ci.yml` 신규
2. Node 20 셋업
3. `npm ci` → `npm test`
4. `npm run lint`
5. legacy-path-guard 검사 (hook 로직 재사용 또는 별도 CI 스크립트)
6. PR trigger (`pull_request`) + main push trigger (`push: branches: [main]`)
7. Branch protection 안내 (`docs/ci-bootstrap/`에 설정 가이드, 실제 설정은 사용자)
8. README CI 뱃지
9. npm cache (`actions/setup-node`의 `cache: 'npm'`)

### 이후 버전으로 미룰 작업
- Node matrix 확장, 자동 PR 어노테이션, 시크릿 스캔 통합, Dependabot, 릴리즈 자동화 → 각각 별도 피처로 분리

## 0.6 경쟁/참고 분석

| 도구 | 특징 | 선택 여부 |
|------|------|:--------:|
| **GitHub Actions** | 저장소 호스팅과 통합, 무료 분 충분(public), YAML 단일 파일 | ✅ 채택 |
| CircleCI | 빠름, 유연 | ❌ (외부 계정 필요, 오버킬) |
| Travis CI | 전통, open source 친화적 | ❌ (최근 정책 변화, 불안정) |
| GitLab CI | GitLab 저장소 | ❌ (현재 GitHub 사용) |
| Jenkins | self-host, 무제한 | ❌ (관리 부담 과함) |

**결론**: GitHub 저장소 + 단일 규칙 검증 → GitHub Actions가 명백한 정답.

## 0.7 PRD 입력 (CTO 전용)

| Key | Value |
|-----|-------|
| PRD 경로 | 없음 (강행 모드 — 내부 인프라) |
| 완성도 | missing |
| 검사 시각 | 2026-04-17 |

### 강행 모드 사유

- 사용자 선택: `legacy-path-guard` report §재발 방지에서 CI guard(Layer 3) 후속 피처로 분리
- 가정한 요구사항:
  1. GitHub Actions만 고려 (대안 평가 생략, §0.6 근거)
  2. 단일 워크플로우 + 단일 job (matrix/병렬은 Nice)
  3. Branch protection 자동 설정은 범위 밖 (GitHub UI 수동 + 가이드 문서)

## 1. 개요

### 1.1 기능 설명
GitHub Actions 워크플로우 1개를 신규 구성하여 PR/main push 시 `npm test` + ESLint + legacy-path-guard 검사를 자동 실행.

### 1.2 목적
- 해결하려는 문제: CI 부재로 인한 외부 PR·미설치 hook 우회 리스크
- 기대 효과: PR status check 기반 자동 품질 게이트
- 대상: 모든 저장소 기여자, 유지보수자

## 2. Plan-Plus 검증

### 2.1 의도 발견
근본 문제는 "CI가 없다"가 아니라 **"검증 책임이 개인 장치에만 있어서 일관성이 깨진다"**. 이걸 해결하려면 서버에서 동일 검사를 돌려야 함.

### 2.2 대안 탐색

| # | 대안 | 장점 | 단점 | 채택 |
|---|------|------|------|:----:|
| 1 | **GitHub Actions 단일 워크플로우** (MVP) | 제로 외부 의존, 빠른 첫 구축 | Node matrix/병렬 없음 | ✅ |
| 2 | 다중 워크플로우 (test/lint/guard 분리) | 실패 원인 가독성 ↑ | 설정 중복, 유지 부담 | ❌ (복잡도 ↑) |
| 3 | Matrix (Node 18/20/22) | 호환성 커버리지 | 분 사용량 3배 | ❌ (public이라 무료지만 MVP 과함) |
| 4 | GitHub Actions + 자체 host runner | 제어권 | 서버 관리 부담 | ❌ |

**채택: 대안 1** — 단일 workflow, 단일 job, Node 20. 성공 확인 후 matrix 확장은 후속 피처.

### 2.3 YAGNI 리뷰
- [x] 현재 필요한 기능만: test/lint/guard 3종
- [x] 과잉 설계 없음: 배포·시크릿·regression 분리
- [x] 제거 후보: Node matrix는 후속으로 미룸

## 3. 사용자 스토리

| # | As a... | I want to... | So that... |
|---|---------|-------------|------------|
| 1 | 유지보수자 | PR 페이지에서 자동으로 테스트·lint·legacy-path 결과를 확인할 수 있기를 | 로컬 체크아웃 없이 merge 여부 판단 가능 |
| 2 | 외부 기여자 | PR 제출 시 실패 사유를 즉시 받기를 | 리뷰어 기다리기 전에 스스로 수정 |
| 3 | 신규 기여자 | README CI 뱃지로 저장소 건강도를 한눈에 파악하기를 | 컨트리뷰션 장벽 낮춤 |

## 4. 기능 요구사항

### 4.1 기능 목록

| # | 기능 | 설명 | 관련 파일(예상) | 우선순위 | 상태 |
|---|------|------|----------------|:-------:|:----:|
| F1 | `.github/workflows/ci.yml` | 워크플로우 정의. triggers + jobs + steps | 신규 | Must | 미구현 |
| F2 | Node 셋업 step | `actions/setup-node@v4` with Node 20 + npm cache | F1 내부 | Must | 미구현 |
| F3 | 의존성 설치 | `npm ci` (lockfile 기반) | F1 내부 | Must | 미구현 |
| F4 | 테스트 실행 | `npm test` (node --test) | F1 내부 | Must | 미구현 |
| F5 | Lint 실행 | `npm run lint` | F1 내부 | Must | 미구현 |
| F6 | legacy-path-guard 검사 | hook 로직을 CI에서 재실행 (full tree) | F1 내부 + 옵션: `scripts/check-legacy-paths.sh` 신규 추출 | Must | 미구현 |
| F7 | Trigger 정책 | `pull_request` + `push: [main]` | F1 내부 | Must | 미구현 |
| F8 | Branch protection 안내 | GitHub Settings → Branches 가이드 | `docs/ci-bootstrap/02-design/main.md` 또는 README | Should | 미구현 |
| F9 | README CI 뱃지 | workflow status badge 추가 | `README.md` | Should | 미구현 |
| F10 | Lockfile 점검 | `package-lock.json` 미존재 시 생성 확인 | 의사결정 필요 | Must | 미구현 |

### 4.2 기능 상세 (하이라이트)

#### F6. legacy-path-guard CI 검사

**hook과의 차이**:
- hook: `git diff --cached`로 **staged 파일만** 검사
- CI: **PR/branch 전체**를 검사해야 함 (기존 파일이 merge로 들어오는 경우 대비)

**설계 질문** (design 단계 결정):
- 옵션 a: `.hooks/pre-commit`의 검사 로직을 **별도 스크립트로 추출** → hook과 CI 양쪽이 재사용
- 옵션 b: CI에서 단순 `git grep 'docs/[0-9][0-9]-'`을 예외 glob과 함께 실행

옵션 (a)가 long-term 정합성 높음. 옵션 (b)는 초기 단순성.

#### F10. Lockfile

**현재 상태**: 확인 필요. `npm ci`는 `package-lock.json` 필수.
- 없으면: design 단계에서 `npm install` 1회 실행 후 lockfile 커밋 결정
- 있으면: 그대로 사용

## 5. 정책 정의

### 5.1 CI 실행 정책

| 이벤트 | 실행 여부 |
|--------|:---------:|
| `pull_request` (open/synchronize) | ✅ |
| `push: [main]` | ✅ |
| 다른 브랜치 push | ❌ (PR 없이 개인 브랜치 commit은 스킵) |
| 태그 push | ❌ (범위 밖, 릴리즈 자동화는 별도 피처) |
| `workflow_dispatch` (수동 트리거) | ✅ (디버그용) |

### 5.2 실패 시 동작

- CI status "failure" → PR에 빨간 X 표시
- Branch protection 설정 시 merge 버튼 비활성 (사용자 수동 설정)
- 로그에 실패 step + 에러 메시지 노출

### 5.3 권한 정책

- `permissions: contents: read` 최소 권한 (읽기만)
- 쓰기 권한 필요 없음 (코드 push/PR 코멘트 쓰지 않음)

## 6. 비기능 요구사항

| 항목 | 요구사항 | 기준 |
|------|---------|------|
| 실행 시간 | 전체 워크플로우 | 3분 이내 (npm install + test + lint + guard) |
| 안정성 | Flaky 없음 | 동일 commit 재실행 시 동일 결과 |
| 비용 | 무료 한도 준수 | public repo는 무제한이지만 참고 |
| 호환성 | Node 20 | package.json engines와 일관 (`>=18.0.0`, Node 20 안정) |

## Success Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-01 | `.github/workflows/ci.yml` 존재 + 유효 YAML | `yamllint` 통과 또는 GitHub UI에서 검증 |
| SC-02 | PR 생성 시 자동 실행 | 테스트 PR 열어 CI 트리거 확인 |
| SC-03 | `npm test` 실행 + 결과 반영 | 의도적 실패 PR로 status "failure" 확인 |
| SC-04 | `npm run lint` 실행 | 동 |
| SC-05 | legacy-path-guard 검사 실행 + 위반 감지 | 레거시 패턴 포함 PR로 검증 |
| SC-06 | main push 시 자동 실행 | main direct push 또는 merge 후 확인 |
| SC-07 | README CI 뱃지 표시 (Should) | PNG/SVG 렌더링 확인 |
| SC-08 | Branch protection 가이드 문서화 (Should) | `docs/ci-bootstrap/02-design/` 섹션 존재 |

## Impact Analysis

### Changed Resources

| Resource | Type | Change Description |
|----------|------|-------------------|
| `.github/workflows/ci.yml` | create | 워크플로우 정의 (신규 디렉토리 `.github/` 포함) |
| `scripts/check-legacy-paths.sh` | create (옵션 F6a) | hook + CI 공용 검사 스크립트 |
| `.hooks/pre-commit` | modify (옵션 F6a) | 공용 스크립트 호출로 리팩터 |
| `README.md` | modify | CI 뱃지 추가 |
| `package-lock.json` | create (옵션 F10) | `npm install`로 생성 |
| `docs/ci-bootstrap/{plan,design,do,qa,report}/main.md` | create | 피처 산출물 |

### Current Consumers

| Resource | Operation | Impact |
|----------|-----------|--------|
| 개발자 로컬 환경 | hook 실행 | F6a 채택 시 hook이 공용 스크립트 참조로 바뀜 (동작 동일) |
| PR 제출자 | GitHub에서 CI 결과 확인 | 신규 UX (빨간 X / 초록 체크) |
| `npm ci` 실행 | lockfile 요구 | `package-lock.json` 필수 — F10 결정 |

### Verification
- [ ] design 단계: F6 (a vs b), F10(lockfile 생성 여부) 결정
- [ ] 실제 테스트 PR로 E2E 검증

## 7. 기술 스택

N/A — 인프라 작업 (YAML + GitHub Actions + 기존 Node 인프라 재사용).

## 8. 화면 목록

N/A — CLI/CI (UI 없음).

## 9. 일정 (예상)

| 단계 | 산출물 |
|------|--------|
| 기획 (CEO) | 본 문서 ✅ |
| 설계 (COO) | `docs/ci-bootstrap/02-design/main.md` — YAML 구조 + F6/F10 옵션 결정 |
| 구현 (COO) | workflow YAML + (옵션) 공용 스크립트 + README 뱃지 |
| QA (COO + CSO) | 테스트 PR 생성으로 실제 트리거 확인 + OWASP + 권한 |
| 보고 | `docs/ci-bootstrap/05-report/main.md` |

> **CEO 추천 담당**: **COO** (CI/CD 주 업무, `release-engineer`/`sre-engineer` 서브에이전트 소관)

---

## 주의: 사용자 결정 필요 항목 (design 진입 전)

1. **F6 옵션**: hook 로직을 (a) 공용 스크립트로 추출 vs (b) CI에서 독립 grep
2. **F10 Lockfile**: `package-lock.json` 현재 없으면 생성 커밋 여부
3. **Branch protection**: CI 구축 후 GitHub UI에서 수동 설정 의향
4. **Actions 분 한도**: public repo 무제한이지만 workflow 설계상 효율성 고려

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-17 | 초기 작성 — CEO 전략 plan. GitHub Actions 단일 워크플로우 채택, MVP 9항목, 범위 외(배포/시크릿/regression) 명시 분리. 담당 COO. Node matrix·auto-annotation은 후속 피처 |

<!-- template version: v0.18.0 -->
