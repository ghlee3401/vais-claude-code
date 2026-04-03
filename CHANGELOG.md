# Changelog

## [0.36.1] - 2026-04-03

### Fixed

- **absorb-evaluator**: path traversal 취약점 수정 (`_assertWithinBoundary` 추가)
- **absorb-evaluator**: 코드 블록 카운트 `Math.floor()` 적용 (홀수 fence 오류)
- **absorb-evaluator**: ledger record 크기 제한 (10KB) 추가

### Changed

- **CLAUDE.md**: 버전 동기화, `basic/` 패턴 참고용 명시 및 리뷰 제외 규칙 추가
- **commit.md**: 버전 일괄 반영 대상 5개 파일 구체적 명시, 불일치 시 커밋 중단 규칙

---

## [0.36.0] - 2026-04-03

### Added

- **absorb-mcp**: absorb 워크플로우에 MCP 흡수 경로 추가
- **absorb-analyzer**: 6단계 MCP 심화 분석 (도구성/래핑 가능성/독립성/재사용성)
- **absorb-evaluator**: `mcpCandidate` 플래그 + `_assessMcpFit` 등 4개 private 메서드
- **CEO absorb Do**: `absorb-mcp` action 분기 (vendor/ 배치 + mcp/ JSON 생성)
- **templates/mcp-server.template.json**: MCP 서버 JSON 템플릿

---

## [0.35.0] - 2026-04-03

### Added

- **basic/**: 하네스 엔지니어링 최소 참조 구조 (CLAUDE.md, agents, skills, hooks, scripts, memory, templates, src)
- **basic/.mcp.json**: MCP 서버 설정 템플릿

---

## [0.33.3] - 2026-04-03

### Fixed

- **bash-guard**: `rm -rf /`, `rm --recursive` BLOCKED 목록 추가 — OWASP A03
- **phase-transition**: CLI `from`/`to` 인자 화이트리스트 검증 추가 — OWASP A01/A08
- **agent-start**: CLI `role` 인자 화이트리스트 검증 추가 — OWASP A01/A08
- **webhook**: `isPrivateHost()` 사설 IP 차단 로직 추가 — OWASP A10 (SSRF)
- **agents/pm-***: `disallowedTools` 필드 추가 (pm-discovery/strategy/research/prd) — Gate B

---

## [0.25.0] - 2026-04-01

### Changed

- **SKILL.md** — 체이닝 문법(`:` 순차, `+` 병렬) 제거. 에이전트 자율 위임 구조로 전환
- **README** — 전면 재작성. GitHub docs 스타일, 체이닝 섹션 제거, Command Format / Executive Roles 구조 정비

### Removed

- 체이닝 파싱 섹션 (`## 체이닝 파싱`, `## 병렬 에이전트 매핑`)
- 체이닝 액션 예시 (`ceo:cpo:cto`, `ceo:cto`, `plan:design:architect`, `frontend+backend`)

---

## [0.24.0] - 2026-04-01

### Added

- **CPO 에이전트 신설** (`agents/cpo.md`) — 제품 방향 + PRD 생성 + pm sub-agents 오케스트레이션
- **CFO 에이전트 stub** (`agents/cfo.md`) — 재무/ROI 분석 역할 예약
- **COO 에이전트 stub** (`agents/coo.md`) — 운영/CI/CD 역할 예약
- **seo sub-agent** (`agents/seo.md`) — CMO에서 분리된 SEO 감사 전용 에이전트
- **security sub-agent** (`agents/security.md`) — CSO Gate A 전용 OWASP 체크리스트 에이전트
- **validate-plugin sub-agent** (`agents/validate-plugin.md`) — CSO Gate B 전용 플러그인 검증 에이전트
- **phases/cpo.md / cfo.md / coo.md** — 각 C-Suite phase 실행 파일

### Changed

- **CMO v2.0** (`agents/cmo.md`) — 인라인 SEO 로직 제거, seo sub-agent 위임 패턴으로 교체
- **CSO v2.0** (`agents/cso.md`) — 인라인 OWASP/plugin 로직 제거, security/validate-plugin sub-agent 위임으로 교체
- **CEO** (`agents/ceo.md`) — CPO/CFO/COO 위임 테이블 추가, `ceo:cpo:cto` 체이닝 지원
- **SKILL.md** — cpo/cfo/coo 액션 추가, `ceo:cpo:cto` 체이닝 예시 추가
- **README** — v0.24.0 기준 전체 리뉴얼 (C-Suite 계층 다이어그램, 에이전트 표, 마이그레이션 가이드)
- **Stop hooks** — 모든 에이전트 `${CLAUDE_PLUGIN_ROOT:-$(pwd)}` fallback 적용 (개발 환경 호환)

### Removed

- `skills/vais-seo/` — 독립 스킬 제거, `agents/seo.md`로 통합
- `skills/vais-validate-plugin/` — 독립 스킬 제거, `agents/validate-plugin.md`로 통합
- `agents/manager.md` — deprecated 에이전트 완전 삭제
- `skills/vais/phases/manager.md` — deprecated phase 파일 삭제
- `skills/vais/phases/auto.md` — deprecated phase 파일 삭제

---

## [0.23.0] - 2026-04-01

### Added

- **C-Suite 아키텍처 v2.0** — 6-레이어 플랫폼 아키텍처 (Phase 1 + Phase 2)
  - `agents/cto.md` — CTO 에이전트 (manager 역할 계승 + 오케스트레이션)
  - `agents/ceo.md` — CEO 에이전트 (비즈니스 전략 + Reference Absorption 지휘)
  - `agents/cmo.md` — CMO 에이전트 (마케팅 + SEO 감사 통합)
  - `agents/cso.md` — CSO 에이전트 (보안 Gate A + 플러그인 검증 Gate B)
  - `skills/vais/phases/cto|ceo|cmo|cso|absorb.md` — 각 C-Suite 워크플로우 지침
- **lib/observability/** — Layer 4 State/Event 모듈
  - `state-writer.js` — `.vais/agent-state.json` 실시간 에이전트 상태 관리
  - `event-logger.js` — `.vais/event-log.jsonl` 감사 로그 (append-only JSONL)
  - `schema.js` — 이벤트 타입 상수 + 페이로드 스키마
  - `rotation.js` — 로그 로테이션 유틸
- **lib/absorb-evaluator.js** — Reference Absorption 평가 엔진
  - checkDuplicate / checkOverlap / assessQuality / assessFit / evaluate / record
  - `.vais/absorption-ledger.jsonl` append-only 기록
- **scripts/** — Hook 호출 CLI 래퍼
  - `agent-start.js`, `agent-stop.js`, `phase-transition.js`
- **hooks/events.json** — 이벤트 스키마 문서 (MCP/대시보드 소비용)
- **package.json** — Claude plugin 메타데이터 (`claude-plugin` 필드)

### Changed

- `vais.config.json` → v2.0.0 플랫폼 버전 + `cSuite`, `observability`, `plugin`, `mcp` 섹션 추가
- `hooks/hooks.json` — SubagentStart/Stop 이벤트 훅 추가
- `agents/manager.md` — deprecated redirect → CTO
- `skills/vais/phases/auto.md` — deprecated redirect → CTO
- `skills/vais-seo/SKILL.md` — deprecated redirect → CMO (`/vais cmo`)
- `skills/vais-validate-plugin/SKILL.md` — deprecated redirect → CSO (`/vais cso`)
- `skills/vais/SKILL.md` — cto/ceo/cmo/cso/absorb 액션 추가, manager/auto deprecated 처리

## [0.22.0] - 2026-03-26

### Added

- **vais-seo v2: Clean Architecture 리팩토링** — 단일 seo-audit.js(738줄)를 카테고리별 모듈로 분리
  - `scripts/seo-helpers.js` — 공유 상수/헬퍼 (circular dependency 해결)
  - `scripts/seo-scoring.js` — 카테고리별 가중치 기반 점수 엔진 (100점 만점)
  - `scripts/auditors/html-audit.js` — A~K 기존 카테고리
  - `scripts/auditors/nextjs-audit.js` — Next.js 메타데이터 검사
  - `scripts/auditors/crawlability.js` — **L. 크롤러 접근성** (return null, 인증 게이트, 리다이렉트 탐지)
  - `scripts/auditors/ssr-analysis.js` — **M. SSR/CSR 렌더링 분석** (use client, dynamic ssr:false, Suspense)
  - `scripts/auditors/web-vitals.js` — **N. Core Web Vitals 힌트** (next/image, CLS, 폰트)
  - `scripts/auditors/i18n-seo.js` — **O. 국제화 SEO** (hreflang, alternates, locale)
- **SKILL.md**: 16개 카테고리(A~O) + 점수 시스템 문서화

## [0.21.0] - 2026-03-26

### Added

- **인터랙티브 패턴 보강** — 11개 phase 파일에 multiSelect, preview, scope 패턴 추가
  - **multiSelect**: plan(MVP 기능), frontend(컴포넌트), qa(이슈 선택), init(피처 선택) — 4개 phase
  - **preview**: design(설계안 구조), plan(UI 라이브러리), architect(DB 설정), commit(버전 diff) — 4개 phase
  - **scope**: frontend(모듈 범위), backend(API 그룹), qa(검사 범위) — 3개 phase
  - **신규 AskUserQuestion**: backend(구현 승인), manager(영향 확인), next(다음 단계), status(액션 실행) — 4개 phase
  - 모든 신규 패턴에 auto 모드 호환 (기본값 자동 선택)
- **PDCA 문서**: interactive-patterns Plan/Design/Analysis/Report

## [0.20.2] - 2026-03-26

### Changed

- **review → qa 롤백** — `review`보다 `qa`가 더 직관적이라는 판단
  - Agent: `review` → `qa`
  - Phase: `review` → `qa`
  - 문서 경로: `docs/04-review/` → `docs/04-qa/`

## [0.20.1] - 2026-03-26

### Changed

- **Agent 리네이밍** — 도메인 중심 명명으로 통일 (manager만 역할자 유지)
  - `designer` → `design`
  - `builder` → `architect`
  - `frontender` → `frontend`
  - `backender` → `backend`
  - `reviewer` → `review`
- **Phase 리네이밍** — 약어를 풀네임으로 변경
  - `infra` → `architect`
  - `fe` → `frontend`
  - `be` → `backend`
  - `qa` → `review`
- **체이닝 문법 변경** — `/vais frontend+backend`, `/vais plan:design:architect`
- **전체 참조 업데이트** — vais.config.json, AGENTS.md, README.md, SKILL.md, phase 파일, 스크립트, 테스트 등 25+ 파일

## [0.20.0] - 2026-03-26

### Added

- **SessionStart Progress Bar** — 피처 진행률을 시각적 바로 표시 (`lib/ui/progress-bar.js`)
- **SessionStart Workflow Map** — 7단계 워크플로우를 화살표 체인으로 시각화 (`lib/ui/workflow-map.js`)
- **Output Style 자동 주입** — `vais-default.md`를 SessionStart에서 자동 주입 (SSoT)

### Changed

- **SessionStart hook 모듈화** — `buildReportRule()` 하드코딩 제거, thin orchestrator로 리팩토링
- **에러 격리 강화** — Progress Bar, Workflow Map, Output Style 각각 독립 try-catch

---

## [0.19.1] - 2026-03-25

### Fixed

- **commit phase 확인 누락 방지** — 버전 범프 불필요(None) 판단 시에도 반드시 AskUserQuestion으로 사용자 확인 필수 규칙 추가

---

## [0.19.0] - 2026-03-25

### Changed

- **에이전트 리네이밍** — 역할 기반 `-er` 패턴으로 통일
  - `infra-dev` → `builder`
  - `frontend-dev` → `frontender`
  - `backend-dev` → `backender`
  - `qa` → `reviewer`
- **agent .md 변경이력 제거** — 토큰 절약 (AGENTS.md 포함)
- 전체 참조 일괄 업데이트: vais.config.json, SKILL.md, AGENTS.md, README, phase 파일, output-styles

---

## [0.18.1] - 2026-03-25

### Added

- **commit phase에 자동 semver 판단 + 버전 일괄 반영** — 커밋 전 변경 규모를 분석하여 major/minor/patch 제안, 7곳 버전 참조 일괄 업데이트

---

## [0.18.0] - 2026-03-25

### Added

- **PDCA 문서 퀄리티 대폭 개선** — bkit 수준의 문서 구조 달성
  - Plan 템플릿: Executive Summary, Context Anchor, Success Criteria, Impact Analysis 추가
  - Design 템플릿: Architecture Options (3안 비교), Session Guide (Module Map) 추가
  - QA 템플릿: Architecture/Convention Compliance, Success Criteria Evaluation 추가
  - Report 템플릿/phase 신규 생성 — Value Delivered, Keep/Problem/Try 회고
- **Phase 간 컨텍스트 연결 메커니즘**
  - Plan: Checkpoint 1 (요구사항 확인) + Checkpoint 2 (명확화 질문)
  - Design: Upstream Context Loading + Checkpoint 3 (설계안 선택) + Session Guide 생성
  - FE/BE: Upstream Context Loading + Code Comment Convention (`// Design Ref:`, `// Plan SC:`)
  - QA: Checkpoint 5 (리뷰 결정) + Architecture/Convention 검증 + Success Criteria 평가
- **output-style 미적용 수정** — plugin.json `outputStyles` 필드 복원, SessionStart hook 하단 리포트 주입
- **report 액션 등록** — `/vais report {feature}` 워크플로우 지원

### Changed

- 모든 템플릿 버전을 v0.18.0으로 통일
- `vais.config.json` phases 배열에 `"report"` 추가, phaseNames에 `"보고서"` 추가

---

## [0.17.0] - 2026-03-25

### Changed

- 버전 범프 (0.16.1 → 0.17.0)

---

## [0.16.1] - 2026-03-24

### Fixed

- **버전 불일치 수정** — `vais.config.json`이 0.15.0으로 뒤처져 있던 문제 수정
- **전체 버전 통일** — 모든 파일의 버전 참조를 0.16.1로 일괄 업데이트

---

## [0.16.0] - 2026-03-23

### Added

- **SEO Audit Next.js 강화** — `scripts/seo-audit.js`에 Next.js `generateMetadata` API 검사 추가 (~250줄)
  - `auditNextJSMetadata()`, `auditStaticMetadataFields()`, `auditGenerateMetadataPattern()`, `auditViewportExport()`, `auditMetadataBase()`, `auditNextJSFileMetadata()` 함수 추가
  - Next.js 메타데이터 생성 패턴 및 정적 메타데이터 필드 자동 검사
- **SEO Audit 테스트** — `tests/seo-audit.test.js` 신규 작성 (35개 테스트, 9개 suite)
  - SEO Audit 함수 검증 및 에러 핸들링 테스트
- **Designer Agent 디자인 크리틱 추가** — `agents/designer.md` v2.1.0
  - 시니어 디자이너 관점 UI 코드 리뷰 (7개 관점: Visual Hierarchy, Spacing, Typography, Color, Consistency, Accessibility, Feedback & States)
- **Design Phase 보강** — `skills/vais/phases/design.md`에 Part 4: Design Review 추가 (Steps 12-16)
  - UI 코드 리뷰 및 디자인 크리틱 통합
- **QA Agent Expert Code Review 추가** — `agents/qa.md` v1.1.0
  - Google Staff Engineer(L7) 관점 심층 코드 크리틱 (8개 관점)
- **QA Phase 보강** — `skills/vais/phases/qa.md`에 Step 5.5: Expert Code Review 추가
- **QA Report 생성** — `docs/04-qa/vais-code.md` — 전체 QA 보고서

### Changed

- **SEO Audit 확장성 개선** — 기존 기본 SEO 검사에서 Next.js 특화 검사로 확장
- **Design/QA 단계 깊이 강화** — UI 코드 크리틱과 전문가 코드 리뷰 프로세스 추가

---

## [0.15.0] - 2026-03-20

### Changed (Breaking)

- **9→6단계 워크플로우 리스트럭처링**
  - research + plan → **plan** (아이디어 탐색, MVP 범위, 요구사항, 정책, 코딩 규칙 통합)
  - ia + wireframe + design → **design** (IA + 와이어프레임 + UI 설계 통합)
  - check + review → **qa** (Gap 분석 + 코드 리뷰 + 보안 + QA 통합)
  - 문서 경로: `docs/01-plan/`, `docs/02-design/`, `docs/03-infra/`, `docs/04-qa/`
- **에이전트 팀 재편**
  - manager + tech-lead → **manager** (Plan 실행 + 전체 오케스트레이션 + Gate 판정)
  - reviewer → **qa** (Gap + 리뷰 + 보안 + 테스트 통합)
  - `agents/tech-lead.md`, `agents/reviewer.md` 삭제
- **Gate 2→4개 확장** — plan, design, infra, fe 각 단계 완료 시 바이너리 체크리스트 판정
- **설계 병렬화 제거** — design 단계에서 UI+DB 병렬 실행 제거. DB는 infra 단계에서 처리

### Added

- **infra 단계** — DB 스키마, 마이그레이션, ORM, 환경변수, 프로젝트 설정 담당
- **infra-dev 에이전트** (`agents/infra-dev.md`) — infra 단계 전담
- **qa 에이전트** (`agents/qa.md`) — QA 단계 전담 (리턴 경로 포함)
- **Interface Contract** — Gate 2에서 Manager가 Plan(데이터 모델) + Design(화면-데이터) 합성 → API 스펙 확정
- **QA 리턴 경로** — QA 산출물에 `target agent + fix_hint + return_to` 포함. Manager가 라우팅
- **Manager 컨텍스트 위생** — 매 단계 산출물 파일 저장. Gate 판정 시 해당 단계 산출물 + 체크리스트만 로드
- **수정 체이닝 테이블** — UI/레이아웃, 스타일, 기능 변경, 정책 변경, 데이터 변경 등 유형별 최적 체이닝 경로
- `templates/infra.template.md`, `templates/qa.template.md` 신규 생성
- `skills/vais/phases/infra.md`, `skills/vais/phases/qa.md` 신규 생성

### Removed

- `agents/tech-lead.md` — manager에 흡수
- `agents/reviewer.md` — qa로 대체
- `skills/vais/phases/research.md` — plan에 흡수
- `skills/vais/phases/ia.md` — design에 흡수
- `skills/vais/phases/wireframe.md` — design에 흡수
- `skills/vais/phases/check.md` — qa에 흡수
- `skills/vais/phases/review.md` — qa에 흡수
- `templates/research.template.md`, `ia.template.md`, `wireframe.template.md`, `db.template.md`, `check.template.md`, `review.template.md`

---

## [0.14.1] - 2026-03-19

### Fixed

- **[CRITICAL] bash-guard 테스트/코드 패턴 통합** — 테스트가 패턴을 인라인 복사하던 구조에서 실제 스크립트의 `checkGuard()` 함수를 import하도록 리팩토링. 패턴 불일치로 인한 보안 취약점 해소
- **[CRITICAL] Feature name path traversal 방지** — `validateFeatureName()` 추가. `../evil`, `path/traversal` 등 경로 탐색 문자 차단. 허용: 한글, 영문, 숫자, `-`, `_`
- **[CRITICAL] 원자적 파일 쓰기** — `status.js`, `memory.js`에서 `writeFileSync` → `tmp + rename` 패턴으로 전환. 동시 세션에서의 데이터 손실 방지
- **Memory maxEntries 제한** — `addEntry()` 시 `vais.config.json`의 `maxEntries`(기본 500) 초과분 자동 삭제
- **Memory ID 충돌 방지** — 순차 번호(`m-001`)에서 타임스탬프+랜덤 기반(`m-{ts}-{hex}`)으로 전환
- **Config cache TTL** — 무한 캐싱에서 30초 TTL로 변경. 세션 중 설정 파일 변경 시 자동 반영
- **Webhook 재시도 + URL 검증** — 1회 재시도 로직 추가, URL 사전 검증, 프로토콜 감지를 URL.protocol 기반으로 개선
- **debug.js** — 로그 쓰기 실패 시 stderr 경고 출력 (기존: 무시)
- **io.js** — stdin 접근 에러와 JSON 파싱 에러를 구분하여 stderr에 원인 표시
- **paths.js resolveDocPath** — 미치환 템플릿 변수(`{xxx}`) 잔존 시 빈 문자열 반환
- **generate-dashboard.js** — `escapeHtml`에 `"` → `&quot;`, `'` → `&#39;` 추가
- **get-context.js** — `require.resolve()`로 모듈 경로 사전 검증
- **stop-handler.js** — `summary.phases` 누락 시 방어 처리 추가
- **vais.config.json** — 미사용 `skipGatesInRange` 필드 제거

### Added

- `featureNameValidation` 설정 블록 (`vais.config.json`)
- `clearConfigCache()` 함수 (`lib/paths.js`) — 테스트에서 캐시 초기화용
- `validateFeatureName()` export (`lib/status.js`)
- **MCP 서버 파라미터 제한** — `minLength`, `maxLength`, `minimum`, `maximum` 추가
- **plugin.json** — `homepage`, `bugs`, `requiredClaudeCodeVersion` 필드 추가
- **output-styles** — 병렬 실행 결과, 에러 상태 포맷 추가. 버전 표시를 `v{version}` 동적 플레이스홀더로 변경
- **vendor/README.md** — 디자인 시스템 라이선스, 용도, 크기 정보 문서화
- **README** — 설치 확인 섹션, 첫 피처 워크스루, 트러블슈팅 섹션 추가
- **tests/prompt-handler.test.js** — 체이닝/범위 패턴 매칭 테스트 11건
- **tests/status.test.js** — `validateFeatureName` 테스트 9건
- 전체 101건 테스트 통과

### Changed

- **hooks.json** — doc-tracker, prompt-handler 타임아웃 3초 → 5초
- **marketplace.json** — 버전 0.13.0 → 0.14.1
- 전체 템플릿 버전 v0.14.1로 통일

---

## [0.14.0] - 2026-03-19

### Added

- **Agent Teams 네이티브 통합** — Claude Code Agent Teams 구조 적용
  - `vais.config.json`에 `agentTeam` 설정 추가 (orchestrator, roles, routing)
  - `plugin.json`에 `agentTeam` 선언 (에이전트 디렉토리, 오케스트레이터)
  - 6개 에이전트 frontmatter에 `team`, `role`, `delegates_to` 메타데이터 추가
  - 병렬 라우팅(design, implementation)과 council 패턴을 선언적 구성으로 정의
- **MCP Tool Search — vendor 디자인 시스템 lazy loading** (`mcp/design-system-server.json`)
  - `design_search`: BM25 기반 스타일/컬러/폰트/UX 검색
  - `design_system_generate`: 디자인 토큰 MASTER.md 자동 생성
  - `design_stack_search`: 스택별 (html-tailwind, react, nextjs) UI 가이드라인 검색
  - `lazyLoad: true` — design/wireframe 단계에서만 활성화, 컨텍스트 사용량 절감
- **HTTP Webhook 공용 유틸리티** (`lib/webhook.js`)
  - `sendWebhook(event, data)` — fire-and-forget HTTP POST 전송
  - `VAIS_WEBHOOK_URL` 환경변수로 활성화 (미설정 시 무동작)
  - 전송 실패해도 워크플로우 차단 안 함
  - 4개 훅 스크립트에 연동:
    - `session-start.js` → `session_start` (세션 시작, 프로젝트/피처 정보)
    - `doc-tracker.js` → `phase_complete` (단계 완료, 피처/단계/파일)
    - `stop-handler.js` → `stop` (응답 완료, 진행률/다음 단계)
  - 웹훅 테스트 4개 추가 (서버 수신 확인, 실패 안전성 검증)
- **Memory Timestamps** — 메모리 신선도 추적
  - `memory.json` v1 → v2: `lastModified` 필드 추가, 저장 시 자동 갱신
  - `getMemoryAge()` 유틸리티: 마지막 수정 시간, 경과 분, stale 여부 반환
  - v1 메모리 자동 마이그레이션 (기존 데이터 무손실)
  - 테스트 3개 추가 (lastModified 갱신, getMemoryAge, v1 마이그레이션)
- **ESLint + EditorConfig** — 코드 품질 기반 도구
  - `.editorconfig`: indent 2 spaces, LF, UTF-8, trailing whitespace 제거
  - `.eslintrc.json`: no-eval, eqeqeq, no-var, prefer-const 등 핵심 규칙
  - vendor/, docs/ 디렉토리 제외

---

## [0.13.0] - 2026-03-18

### Changed

- **fix 액션을 manager로 통합** — `/vais fix`를 제거하고 영향 분석·수정 체이닝·검증 로직을 Manager Command 모드에 흡수
  - 기존: `/vais fix` → Manager 호출 → Tech Lead 위임 (불필요한 중간 단계)
  - 변경: `/vais manager "수정 요청"` → 직접 영향 분석 → Tech Lead 위임 (단일 진입점)
  - Manager가 수정 유형별 영향 범위 분석, 체이닝 결정, 검증까지 일괄 처리
- **agents/manager.md** — 영향 분석 테이블, 수정 체이닝 매핑, 재귀 방지, 검증 로직 추가
- **prompt-handler.js** — `/vais fix` 키워드를 manager로 라우팅
- **SKILL.md** — manager 설명에 "영향 분석 기반 수정" 추가, 트리거에서 `fix` 제거

### Removed

- `skills/vais/phases/fix.md` — fix 단독 액션 삭제
- SKILL.md 액션 목록에서 `fix [feature]` 행 삭제
- help.md 커맨드 목록에서 `/vais fix` 제거

---

## [0.12.0] - 2026-03-17

### Added

- **UI/UX Pro Max 번들** (`vendor/ui-ux-pro-max/`) — nextlevelbuilder/ui-ux-pro-max-skill (MIT) 번들 통합
  - 50+ 스타일, 161 컬러 팔레트, 57 폰트 페어링, 161 제품 유형, 99 UX 가이드라인
  - BM25 검색 엔진 (Python) + CSV 데이터셋
  - design 단계에서 `--design-system` 명령으로 디자인 토큰 자동 생성
  - `design-system/{feature}/MASTER.md` 출력 → designer 에이전트가 소비

### Changed

- **design 단계 역할 분리** — UI/UX Pro Max가 토큰 생성, designer 에이전트가 토큰 소비
- **designer 에이전트** — 토큰 소비자 역할 명확화, design-system/ 참조 규칙 추가
- **fe 단계** — `design-system/{feature}/MASTER.md` 참조 단계 추가

---

## [0.11.2] - 2026-03-17

### Changed

- **init(역설계) 템플릿 통일** — 각 단계별 `templates/*.template.md` 참조 추가, 정상 설계와 동일한 문서 구조 보장
- **플레이스홀더 통일** — 모든 phase 스킬 파일의 경로 표기를 `$1` → `{feature}`로 변경 (`vais.config.json` docPaths와 일치)
- **init feature registry 생성** — 역설계 시에도 `.vais/features/{feature}.json` 생성하도록 Step 4 추가
- **init check/review 범위 명시** — 역설계는 research~design만 생성, check/review는 별도 실행임을 명시

---

## [0.11.1] - 2026-03-17

### Added

- **`.claude/settings.json` 훅 등록** — 플러그인 미설치 환경에서도 Stop, UserPromptSubmit, PreToolUse, PostToolUse 훅이 동작하도록 프로젝트 설정 파일 추가

---

## [0.10.0] - 2026-03-15

### Added

- **Manager 에이전트** — 프로젝트 최상위 의사결정자. 전체 히스토리 기억, 피처 간 의존성 관리, Tech Lead 지시
  - `/vais manager` — Query 모드 (프로젝트 현황, 피처 히스토리, 의존성, 기술 부채 조회)
  - `/vais manager "자연어"` — Command 모드 (판단 후 Tech Lead에 위임)
  - 두 가지 모드: Query (질의 → memory 조회 → 답변), Command (실행 요청 → 판단 → Tech Lead 지시)
- **Memory 시스템** (`lib/memory.js`) — `.vais/memory.json` 영속 메모리
  - 7가지 엔트리 타입: decision, change, feedback, dependency, debt, error, milestone
  - 피처별/타입별/기간별 조회, 의존성 맵, 기술 부채 관리, 프로젝트 요약
- **doc-tracker memory 연동** — 단계 완료 시 milestone 자동 기록

### Changed

- **auto 워크플로우** — Manager → Tech Lead 경유 구조로 변경
- **fix 워크플로우** — Manager 경유 크로스-피처 영향 분석 추가 (Step 0, Step 7) *(v0.13.0에서 manager로 통합됨)*
- **SKILL.md** — manager 트리거 키워드 추가 (매니저, 현황, 히스토리, 부채, 의존성, 브리핑)
- **vais.config.json** — manager 설정 섹션 추가, team.maxTeammates 5→6
- **에이전트 계층 구조**: Manager (What & Why) → Tech Lead (How) → 전문 에이전트팀

---

## [0.9.1] - 2026-03-15

### Changed

- **README.md 전면 개선** — 중복 제거(체이닝 예시·auto 설명·병렬 매핑·설정 JSON+표), 빠른 시작 경량화, 변경 이력은 CHANGELOG 링크로 대체
- **제목 아래 버전·수정일 한 줄 표시** — `**v0.9.1** · 최종 수정 2026-03-14`
- **전체 날짜 수정** — 모든 파일의 2025 날짜를 2026-03-14로 통일

---

## [0.9.0] - 2026-03-14

### Changed

- **wireframe 스킬 통합** — 별도 `/wireframe` 스킬을 `/vais wireframe`으로 통합. 옵션(`--format`, `--device`) 및 컴포넌트 라이브러리를 wireframe 페이즈에 병합
- **fix 체이닝 방식 전환** — 직접 문서/코드 수정에서 영향 분석 후 적절한 단계 체이닝 실행으로 변경
- **check Gap 방향 판단** — Gap 발견 시 AskUserQuestion으로 구현 수정/설계 수정 선택권 부여

---

## [0.8.8] - 2026-03-14

### Fixed

- **`vais.config.json` gates 불일치** — `["plan", "design"]` → `["plan", "fe"]` (tech-lead.md와 동기화)
- **`plugin.json` hooks 경로** — `./hooks/hooks.json` → `../hooks/hooks.json` (plugin.json 기준 상대 경로)

---

## [0.8.7] - 2026-03-14

### Fixed

- **`status.js` 중복 조건문 제거** — `updatePhase()`에서 `idx + 1 < phases.length` 조건이 외부 조건과 중복
- **피처명 빈값 검증** — `initFeature()`, `saveFeatureRegistry()`에 빈 문자열/null 검증 추가
- **`loadConfig()` 캐싱** — 같은 프로세스 내 반복 JSON 파싱 방지 (성능 최적화)

---

## [0.8.6] - 2026-03-14

### Fixed

- **🔴 크리티컬: `status.js` `path` 모듈 누락** — 피처 레지스트리 함수(`saveFeatureRegistry`, `getFeatureRegistry`, `updateFeatureStatus`)가 `path.join()` 호출 시 크래시하던 버그 수정
- **`get-context.js` 다음 단계 표시 오류** — 현재 단계를 "다음"으로 잘못 표시하던 문제 수정. in-progress면 "📍 진행중", 아니면 "💡 다음"으로 표시
- **`doc-tracker.js` design-db 매핑** — `design-db` 문서 작성 시 `design` 단계로 올바르게 매핑
- **`prompt-handler.js` fix 키워드 충돌** — 일반 대화에서 "수정", "바꿔" 등으로 fix 모드 오진입 방지. `/vais fix` 명시 호출만 감지

### Changed

- **`session-start.js` 출력 형식 간소화** — `hookSpecificOutput` 중첩 구조 제거, `additionalContext`만 사용 (최신 스펙)
- **`plugin.json` 스키마 업데이트** — `agents`, `hooks` 필드 추가
- **`hooks.json`에 `Notification` 이벤트 추가** — 백그라운드 작업 완료 알림 처리

---

## [0.8.5] - 2026-03-14

### Added

- **`/vais fix` 명령어**: 영향 분석 기반 수정
  - 피처 자동 감지 → 영향 범위 분석 → 사용자 확인 → 코드·문서 일괄 수정 → 검증
  - 수정 유형별 영향 범위 매핑: UI/레이아웃, 기능, 정책, 데이터, 화면 추가/삭제
  - 정책 충돌 감지 — 기획서 정책과 충돌 시 사용자에게 알림
  - 수정 후 빌드 검증 + 문서 일관성 체크 (최대 3회 재시도)
  - prompt-handler 키워드: fix, 수정, 고쳐, 바꿔, 변경해, 이상해, 깨져, 틀어

---

## [0.8.4] - 2026-03-14

### Changed

- **단계명 간소화**: `frontend` → `fe`, `backend` → `be`
  - 커맨드: `/vais fe login`, `/vais be login`, `/vais fe+be login`
  - phases 배열, phaseNames, parallelGroups, prompt-handler 키워드 매핑 일괄 변경
  - 스킬 파일 이름: `frontend.md` → `fe.md`, `backend.md` → `be.md`
  - 에이전트 이름(`frontend-dev`, `backend-dev`)은 변경 없음
  - 기존 키워드 `frontend`, `backend` 입력 시 자동으로 `fe`, `be`로 매핑

---

## [0.8.3] - 2026-03-14

### Added

- **피처 레지스트리 시스템**: plan에서 정의된 기능 목록을 `.vais/features/{feature}.json`에 구조화 저장
  - `saveFeatureRegistry()`, `getFeatureRegistry()`, `updateFeatureStatus()` — `lib/status.js`
  - plan → ia → wireframe → design → fe → be → check → review 전 단계에서 자동 참조
  - 각 기능별 구현 상태 추적 (미구현 → 진행중 → 완료)
  - `get-context.js`에서 기능 목록 컨텍스트 자동 출력
- **모든 단계 스킬 파일에 피처 레지스트리 참조 추가**: ia, wireframe, design, fe, be, check, review

---

## [0.8.2] - 2026-03-14

### Fixed

- **Stop Handler 항상 표시**: 활성 피처가 없어도 버전 정보와 시작 안내를 표시
  - 기존: 활성 피처 없으면 푸터 미출력 → 사용자 혼란
  - 변경: 항상 `💠 v0.8.2` 버전 표시 + `💡 시작: /vais init <피처명>` 안내
- 활성 피처는 있으나 진행 요약이 없는 경우에도 기본 안내 표시

---

## [0.8.1] - 2026-03-14

### Added

- **QA 시나리오 리스트**: check 단계에서 기획서 기반 QA 시나리오 자동 생성, review 단계에서 Pass/Fail 판정
  - 핵심 기능 테스트, 엣지 케이스, UI/UX 검증 포함
  - QA 통과율 산출하여 최종 판정에 반영
- **`/vais init` 명령어**: 기존 프로젝트에 VAIS Code 적용
  - 코드베이스 분석 → research/plan/ia/wireframe/design 문서 역생성
  - 코드 수정 없이 문서만 생성하여 워크플로우 진입 준비

---

## [0.8.0] - 2026-03-14

### Changed

- **워크플로우 10단계 → 9단계로 간소화 (docs 폴더 10개 → 7개)**
  - `convention` 단계 제거 → 코딩 규칙을 plan(기획) 단계에 통합
  - `frontend` / `backend` 단계는 유지하되 docs 폴더만 제거 (코드가 산출물)
  - docs 폴더 번호 재배정: 01-research ~ 07-review
- 모든 파일에서 phase 참조, 문서 경로, 다이어그램 일괄 동기화
- 버전 v0.7.0 → v0.8.0

### Removed

- `skills/vais/phases/convention.md` (convention 단계)
- `templates/convention.template.md`
- `docPaths`에서 frontend, backend 경로 (단계 자체는 유지)

---

## [0.7.0] - 2026-03-14

### Changed

- **SKILL.md를 Skills 2.0 구조로 리팩토링** — 491줄 모놀리식 → ~50줄 슬림 라우터
  - `!`cat`` 전처리로 `$0`(액션)에 해당하는 phase 파일만 동적 로드
  - `!`node`` 전처리로 현재 워크플로우 상태 동적 주입
  - `$ARGUMENTS` (`$0`, `$1`) 네이티브 치환 활용
  - frontmatter `tools` → `allowed-tools` (Skills 2.0 스펙)
- **session-start.js 경량화** — 176줄 → 50줄 (상세 컨텍스트는 SKILL.md가 담당)
- **output-styles 정리** — Quick/Full 레벨 참조 제거, 10칸 진행률로 통일

### Added

- `skills/vais/phases/` — 14개 phase별 독립 참조 파일
- `scripts/get-context.js` — 워크플로우 상태 마크다운 출력 스크립트
- `CHANGELOG.md` — 릴리즈 노트 분리

### Removed

- Quick/Full 2레벨 시스템 관련 설명 일괄 제거

---

## [0.6.3] - 2026-03-14

### Changed

- Gap 분석 자동 반복 로직 개선 (최대 5회, 90% 기준)
- 보안 스캔을 check 단계에 통합

### Added

- 컴포넌트 어노테이션 (`data-component`, `data-props`)
- 문서 참조 투명성 (에이전트 참조 문서 기록)
- CSS 파일 자동 감지 (frontend 단계)

---

## [0.6.0] - 2026-03-14

### Added

- 체이닝 문법 (`:` 순차, `+` 병렬)
- 설계 병렬화 (UI + DB)
- 5명 에이전트 팀 (tech-lead, designer, frontend-dev, backend-dev, reviewer)
- 빌드 검증 통합 Gap 분석
- Plan-Plus 3단계 검증
- 6개 훅 시스템
- 50개 유닛 테스트

---

## [0.5.0] - 2026-03-14

### Added

- 10단계 개발 워크플로우 초기 구현
- `/vais auto` 자동 워크플로우
- 와이어프레임 생성 (ASCII/HTML)
- `.vais/status.json` 상태 관리
