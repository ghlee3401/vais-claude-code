# CTO Plan — codebase-full-audit

> 🚨 **모드**: 강행 (CP-0에서 사용자가 B 선택, PRD 미작성)
> 이 문서는 프로덕트 피처가 아닌 **내부 엔지니어링 감사 작업**의 plan입니다.

## 0.1 작업 정의

VAIS Code v0.47.0 코드베이스 전체에 대한 1회성 정합성/품질 감사를 수행한다. 대상은 (1) 아키텍처 설계, (2) hooks 서브시스템, (3) 37+개 에이전트 역할/위임 관계, (4) lib·scripts 코드 품질이다. 산출물은 이슈 리스트와 우선순위화된 수정안이며, 실제 수정은 CP-1 이후 do 단계에서 수행한다.

## 0.7 PRD 검사 결과 / 가정 (강행 모드)

- **PRD 경로**: `docs/03-do/cpo_codebase-full-audit.do.md` — 부재
- **사용자 결정**: CP-0에서 B(강행) 선택 — 감사 작업 특성상 PRD 오버엔지니어링 회피
- **가정**:
  - 감사 기준은 CLAUDE.md의 "Project Structure", "Agent Architecture", "Mandatory Rules"를 진실 소스로 삼는다
  - "각 agent 역할이 잘 동작하는지"는 frontmatter 정합성과 위임 관계 일관성으로 정의한다 (실제 런타임 동작 테스트는 별도 QA 단계)
  - "hook 점검"은 정적 분석 + exit code 정책 검토로 정의한다 (실제 훅 발화 추적은 별도)

## 1. Executive Summary

| Perspective | Content |
|-------------|---------|
| Problem | v0.46→0.47 빠른 흡수 사이클로 인해 frontmatter·CLAUDE.md 표·훅 정책의 동기화가 일부 깨졌다 |
| Solution | 4축(아키텍처/훅/에이전트/lib) 감사로 Critical/Important/Minor 이슈를 식별하고 do 단계에서 일괄 수정 |
| Effect | 신규 기여자/사용자가 CLAUDE.md만 읽어도 정확한 에이전트 위임 관계를 파악, 훅 차단으로 인한 작업 중단 위험 감소 |
| Core Value | "문서-코드-설정" 3자 정합성 회복 |

## 2. Context Anchor

| Key | Value |
|-----|-------|
| WHY | v0.47.0 흡수/리네이밍 작업으로 메타데이터 표류 의심, 사용자가 직접 점검 요청 |
| WHO | VAIS Code 메인테이너(사용자) + 향후 기여자 |
| RISK | 감사 범위 발산 → "ocean boiling". 본 plan은 정적 분석 범위로 한정 |
| SUCCESS | 식별된 Critical 이슈 100% 수정, Important 80%+ 수정, MEMORY/CHANGELOG에 감사 결과 기록 |
| SCOPE | 정적 분석 + 문서 정합성. 런타임 회귀 테스트, 성능 벤치마크는 범위 밖 |

## 3. 발견된 이슈 인벤토리

### 3.1 훅 서브시스템 (총 10건)

#### Critical
- **H-C1** `basic/hooks/hooks.json`이 구형 `agent-tracker.js` 호출 — 메인 `agent-start/stop.js`와 불일치. fork 시 구형 훅 실행 위험
- **H-C2** `agent-stop.js:48` 문서 누락 시 `process.exit(1)` — 사용자 피드백 수집 차단
- **H-C3** `cp-guard.js:81-82` event-log 쿼리 실패 시 `catch(_) {return []}` silent 실패 → CP 검증 무력화

#### Important
- **H-I1** `paths.js` 30초 config 캐시 — 세션 중 vais.config.json 수정 미반영
- **H-I2** `doc-tracker.js` `resolveDocPath` null 처리 미흡 (`endsWith` 사용)
- **H-I3** `session-start.js` UI 렌더링 실패 silent (try-catch만)
- **H-I4** `bash-guard.js` 정규식 우회 가능 (`rm --recursive /`, `rm -rfoo` 등)

#### Minor
- **H-M1** `events.json` 스키마에 `checkpoint` 이벤트 누락 (cp-tracker는 로깅 중)
- **H-M2** 훅 timeout(3000~5000ms) 초과 시 동작 미정의
- **H-M3** `Write|Edit` 매처가 향후 신규 도구 포함 정책 불명확

### 3.2 에이전트 메타데이터 (총 10건)

#### Critical
- **A-C1** **CLAUDE.md 표 누락**: `skill-validator`(CSO 하위, v0.47.0 신규)가 Architecture 표에 미등재 → 실제 38개 vs 표 37개
- **A-C2** **CSO frontmatter 부정확**: description이 3개 sub-agent만 명시 (security-auditor/validate-plugin/code-review). 누락: `compliance-audit`, `skill-validator`
- **A-C3** **CPO frontmatter 부정확**: description이 pm-* 4개만 명시. 누락: `ux-researcher`(파일에는 "delegated by CPO" 명시되어 있음)
- **A-C4** **CTO description**: sub-agent 9개 나열로 351자 — "Use when" 구체성 부족, 가독성 저하

#### Important
- **A-I1** `pm-discovery`, `pm-strategy`, `pm-research` — "Use when" 절 누락 (Triggers만 존재)
- **A-I2** `ui-designer`, `dev-frontend`, `dev-backend` — "Use when" 가이드 부족
- **A-I3** `skill-validator` description 313자 — validate-plugin 비교 설명이 장황
- **A-I4** `canary-monitor` vs `sre-ops` 구분이 description만으로 불명확

#### Minor
- **A-M1** `code-review`가 1인칭("당신은") 사용 — 다른 에이전트의 3인칭 컨벤션 위반
- **A-M2** `seo-analyst`, `copy-writer`, `growth-analyst` — 트리거 키워드 부재

### 3.3 lib / scripts 코드 품질 (총 10건)

#### Critical
- **L-C1** scripts/* 11개 파일이 try/catch 미보유 (bash-guard, cp-guard, cp-tracker, doc-validator, agent-start 등) — JSON 파싱/fs 작업 미보호
- **L-C2** Exit code 정책 불일치 — `paths.js`만 `process.exit(1)` 사용, 다른 스크립트는 에러 시 exit 안 함 → 훅 차단 효과 무효화
- **L-C3** `state-store.js`의 `execSync('sleep ...')` — 현재 상수만 쓰지만 향후 외부 입력 시 shell injection 위험

#### Important
- **L-I1** Circular dependency 잠재성: `memory→paths`, `status→fs-utils→state-store` (lazy require로 완화 중)
- **L-I2** `loadConfig()` 30초 TTL 캐싱 무효화 API 외부 미노출
- **L-I3** `status.json`과 `memory.json` 동시 쓰기 시 원자성 미보장
- **L-I4** `VALID_FEATURE_NAME` regex가 한글 허용 (`가-힣`) — 템플릿 치환 시 edge case 가능

#### Minor
- **L-M1** scripts에서 `require('../lib/paths') → loadConfig()` 반복 — 공통 진입점화 가능
- **L-M2** `mandatoryPhases` 키 로드되지만 실제 enforce 미흡
- **L-M3** Memory entry 타입(`debt`, `error`)이 manager 조회에서 미활용

### 3.4 아키텍처/문서 정합성 (총 5건)

#### Important
- **D-I1** CLAUDE.md "Project Structure"에 `output-styles/`, `mcp/` 명시되어 있으나 실제 활성도 낮음 (vais.config.json `mcp` 키 미사용)
- **D-I2** `vais.config.json > workflow.mandatoryPhases` 키가 정책상 존재하나 enforce 코드 부재
- **D-I3** `references/` 흡수 인박스 정책이 CLAUDE.md와 메모리(`feedback_references_folder.md`)에 분산 — 단일 SoT 부재
- **D-I4** PDCA 단계 표가 CLAUDE.md / cto.md / vais.config.json 3곳에 중복 — 변경 시 동기화 비용

#### Minor
- **D-M1** `basic/` 디렉토리가 "참고용"이라고 표시되나 실제 hooks 차이로 혼동 유발 (H-C1과 연결)

## 4. 전체 이슈 통계

| 범주 | Critical | Important | Minor | 합계 |
|------|----------|-----------|-------|------|
| 훅 | 3 | 4 | 3 | 10 |
| 에이전트 | 4 | 4 | 2 | 10 |
| lib/scripts | 3 | 4 | 3 | 10 |
| 아키텍처/문서 | 0 | 4 | 1 | 5 |
| **총계** | **10** | **16** | **9** | **35** |

## 5. 기능 요구사항 (감사 후속 조치)

| # | 기능 | 우선순위 | 난이도 |
|---|------|---------|--------|
| 1 | Critical 10건 수정 (H-C*, A-C*, L-C*) | Must | 중 |
| 2 | CLAUDE.md Architecture 표 재동기화 (skill-validator 추가, 표 vs 파일 자동 검증 스크립트) | Must | 하 |
| 3 | C-Level frontmatter 정정 (CSO/CPO/CTO description 갱신) | Must | 하 |
| 4 | scripts/* try-catch 일괄 추가 + exit code 정책 통일 | Must | 중 |
| 5 | basic/ 디렉토리 deprecation 또는 hooks.json 동기화 | Must | 하 |
| 6 | Important 16건 수정 | Should | 중 |
| 7 | bash-guard 정규식 강화 + events.json 스키마 보완 | Should | 중 |
| 8 | Minor 9건 수정 | Nice | 하 |
| 9 | 감사 결과를 CHANGELOG.md, MEMORY에 기록 | Must | 하 |
| 10 | 회귀 방지: `vais-validate-plugin.js`에 frontmatter↔표 정합성 체크 추가 | Should | 중 |

## 6. 비범위 (Out of Scope)

- 런타임 통합 테스트 / 회귀 테스트 작성
- 새로운 에이전트/스킬 추가
- vais.config.json 키 구조 변경
- vendor/ 수정
- 성능 벤치마크
- v0.48.0 신규 피처

## 7. 결정 (CP-1)

- **선택 범위**: **B. 표준** — Critical 10건 + Important 16건 = **총 26건 수정**
- **체이닝**: `plan → infra-architect(frontmatter↔표 정합성 분석) → dev-backend(스크립트/문서 패치) → qa-validator`
- **제외**: Minor 9건은 향후 v0.48 cleanup 사이클로 이월
- **회귀 방지**: 본 범위에서 제외 (확장 옵션 C에 포함됨), 다만 do 단계 산출물에 "다음 사이클 권장 작업"으로 명시

## 8. 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-07 | 초기 작성 — 4축 감사 결과 35건 이슈 식별 |
| v1.1 | 2026-04-07 | CP-1 결정 반영 — 범위 B(표준, 26건) 확정 |
