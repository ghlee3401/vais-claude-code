---
owner: cto
artifact: main
phase: design
feature: vais-positioning-rethink
---

# vais-positioning-rethink — Design 인덱스

## Executive Summary

CTO design — vais-code 는 CLI 기반이라 ui-designer 생략. infra-architect 단독 영역 (M0 hook 아키텍처 + .vais/status.json 스키마 + M1 PoC negative test). 핵심 발견: 기존 `Stop` hook + `session-start.js` 재활용 가능 → **신규 hook 0 개**, 기존 `scripts/stop-handler.js` 와 `hooks/session-start.js` 만 확장. Lean Rewrite v3.0 정신 정합.

## Decision Record

| Date | Decision | Owner | Source |
|------|----------|-------|--------|
| 2026-05-09 | **ui-designer 생략** — vais-code 는 CLI 기반, 화면 설계 무의미. infra-architect 영역만 진행 | CTO (design) | cto.md PDCA design phase 표 |
| 2026-05-09 | **신규 hook 0 개** — `Stop` hook (`scripts/stop-handler.js`) 으로 M0-①+② 통합 (turn 종료 시점 자연 적합), `session-start.js` 확장으로 M0-④. M0-③ 만 `UserPromptSubmit` 사용 (Claude Code spec 확인 필요, FAIL 시 in-conversation 처리 fallback) | CTO (design) | m0-design §1 |
| 2026-05-09 | **LLM 휴리스틱 = Claude API haiku 호출** — turn 당 130 토큰. 기존 lib 패턴 (Anthropic SDK 추가 필요). FAIL 시 SKIP default (over-record 보다 under-record 선호) | CTO (design) | m0-design §3 |
| 2026-05-09 | **status.json ideation 스키마** — `features.{feature}.ideation.{inProgress, lastTurn, workingNotesPath, mainMdPath, lastUpdated}` 5 필드. lazy populate (feature 진입 시만 작성) | CTO (design) | m0-design §2 |
| 2026-05-09 | **M1 PoC = 3 단계 negative test** — Step1 stub 박제 + signature 검색 (PASS A), Step2 파일명 변경 + 재호출 (PASS B = 실패 확인), Step3 결과 매트릭스 → autonomous discovery 판정 | CTO (design) | m1-poc-design §1 |
| 2026-05-09 | **Manual @include fallback** — 각 agent .md 의 Knowledge Index 섹션에 *literal Read 지시* + sub-agent 가 Read 도구 명시 호출. PoC FAIL 시 즉시 전환 가능. 콘텐츠 동일, 형식만 다름 | CTO (design) | m1-poc-design §2 |
| 2026-05-09 | **Design Gate 통과** — 6/6 (ui 생략 정당화 / hook 재활용 / LLM 휴리스틱 spec / status 스키마 / PoC 절차 / fallback 즉시 전환). CTO do (W1 D1 PoC) 진입 가능 | CTO (design) | 본 main.md |
| 2026-05-09 | **Design Lean Rewrite v2.0** — 4 critical 이슈 (§7 cto-tech-plan 중복 / Decision Record 분산 / manual fallback 비대 / PoC 시간 ceremony) 처리. m0-design 235→~150, m1-poc-design 137→~75. 합계 424 → ~280 (-34%). lean 정신 일관성 검증 (두 번째 self-application) | CTO (design v2) | design 검토 chat |

## Artifacts

| File | Type | Description |
|------|------|-------------|
| `02-design/main.md` | 인덱스 | 본 문서 |
| `02-design/m0-design.md` | 아키텍처 | Hook 재활용 설계 + status 스키마 + LLM 휴리스틱 spec |
| `02-design/m1-poc-design.md` | 검증 설계 | Lazy-load negative test 절차 + manual @include fallback |

## CEO 판단 근거

CTO design phase = ui-designer + infra-architect 병렬 (cto.md). vais-code 는 CLI 도구 → ui-designer 생략 정당. infra-architect 가 다룰 영역 = M0 hook 아키텍처 + status 스키마 + M1 PoC. 본 design 은 sub-agent 위임 없이 CTO 직접 작성 (lean — sub-agent overhead 제거).

PRD v2.0 §5 (lazy-load PoC W1 D1) + cto-tech-plan v2.0 §2 (negative test 재정의) 를 design 으로 elaborate. 코드 변경 0 (Plan ≠ Do, Design ≠ Do).

## Next Phase

### CTO do (W1 D1 lazy-load PoC 부터)

`/vais cto do vais-positioning-rethink` — Sprint v2 W1 D1 의 첫 task = M1 PoC negative test 실행. PASS → M0 hook 구현 진행 (W1 D2~D3). FAIL → manual @include fallback 으로 즉시 전환 후 진행.

> ⚠️ Mandatory phase 순서: do → qa → report. Do phase 첫 작업 = PoC 실행 (코드 변경 시작).

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-09 | 초기 작성 — CTO design (ui-designer 생략, infra-architect 영역만). 7 Decision Record + 2 artifacts. 424 줄 |
| v2.0 | 2026-05-09 | **Lean Rewrite** — 4 critical 이슈 처리 (중복/분산/비대/ceremony). 8 Decision Record. 424 → ~280 (-34%). vais-code lean 정신 일관성 두 번째 검증 |
