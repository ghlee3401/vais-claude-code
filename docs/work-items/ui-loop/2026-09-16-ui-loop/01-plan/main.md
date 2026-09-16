---
schema: vais-phase/v1
work_item: WI-2026-09-16-ui-loop
phase: plan
revision: 1
status: approved
based_on: []
---

# Plan — UI 루프 (ui-loop, 로드맵 H4)

## 한 줄 요약

화면을 고치는 작업(`ui` kind)을 "시안 고르기 → 적용 → 실제 화면 보고 확인/수정(최대 5회) → 기록" 루프로 만들고, 화면은 항상 기계가 찍은 스크린샷(그림)으로만 보인다. 근거 `docs/harness/design.md` 2절(W·V 확인 열)·5절(ui kind, 화면 확인 정지점)·11절 장면 C, 로드맵 H4. 완료 조건은 장면 C 통과. kind: harness. 규모: extended.

## 1. 문제

- 사용자는 그림만 보고 승인하기로 했지만(2026-09-15 결정) 지금 커널은 화면을 만들 수도 보여줄 수도 없다. W·V 단계는 파일 존재만 검사한다(H2 잔여).
- UI 수정은 "고쳤다" 는 말만 있고 실제 화면 전/후, 무엇이 바뀌었는지 diff 가 없어 자동으로 진행할수록 오리무중이다(초기 고충).
- 사용자의 취향("버튼은 크게, 파랑")이 기록되지 않아 다음 UI 작업이 같은 지적을 반복한다.
- 수정 요청 횟수 상한이 없어 끝없이 돌 수 있다.

## 2. 목표

`ui` kind 에 Do 뒤 **화면 확인 정지점** 을 추가하고, 스크린샷 생성·검수 페이지·회차 diff·취향 장부를 runtime 이 만든다. W·V 단계 문서의 산출물도 같은 도구로 그림이 된다. 앱을 띄우는 어댑터(H6)·feature/bug 인용 강제(H6)·MCP 결정(H8)은 제외한다.

## 3. 범위

포함: ui kind 양식(한 줄 Plan·시안 Design), 화면 확인 정지점 상태·이벤트·명령, 스크린샷 도구(설치된 Chrome 헤드리스), 검수 페이지, 회차 diff 요약, 취향 장부·주입, 수정 5회 상한, W·V 산출물 렌더링, doctor(브라우저·statusline 프로젝트 설정), 장면 C 회귀, 문서·버전 3.4.0.
제외: 앱 기동·서버 실행 어댑터(H6: 이번엔 정적 파일 `file://` 과 이미 떠 있는 URL 만), feature/bug kind(H6), 사용자 명령 다섯(H5), design-system MCP 유지/삭제(H8), 실제 제품 앱.

## 4. 요구사항

| ID | 요구사항 | 완료 조건 |
|---|---|---|
| REQ-001 | `ui` kind 양식: Plan 은 요청 확인 한 줄(+kind·대상 화면 ID), Design 은 시안 안 목록(규모별 1~3)이며 안마다 데스크톱·모바일 스크린샷 파일이 있어야 Gate 통과. | 스크린샷 없는 안은 Design 실패, 있으면 통과. |
| REQ-002 | 시안은 앱 작업 사본(Work item 폴더 안)에 적용한 상태를 찍은 그림이다. 설명만 있는 안은 무효. | 사본 경로·스크린샷 경로가 Design 에 기록되고 파일이 존재한다. |
| REQ-003 | 화면 확인 정지점: ui kind 의 Do 가 READY 면 Review 로 가지 않고 `do/waiting-user` 에서 실제 화면 세트(전/후)를 제시한다. `/vais 확인` 이면 Review, 수정 문장이면 같은 Work item 안에서 Design 세부 수정 → Do 재실행. | 상태 머신 이벤트 2종, 다른 kind 는 변화 없음. |
| REQ-004 | 수정 루프 상한: 정지점 수정이 5회를 넘으면 blocked 로 멈추고 이유를 보인다. | 6번째 수정 요청이 거부된다. |
| REQ-005 | 스크린샷 도구: 설치된 Chrome 을 헤드리스로 실행해 `file://` 경로 또는 URL 을 데스크톱(1280×800)·모바일(390×844) PNG 로 찍는다. Chrome 이 없으면 조용히 넘기지 않고 실패 이유를 낸다. | 두 크기 PNG 생성, 미설치 시 명확한 오류. |
| REQ-006 | 검수 페이지: 회차마다 `03-do/evidence/screens/round-N/` 에 스크린샷을, Review 에 `04-review/evidence/review.html` 을 만들어 승인 시안 vs 실제 화면을 나란히 보인다. AI 는 응답에서 PNG 를 직접 열어 보인다. | 파일 생성, 페이지에 전/후·검수표 ≤5줄. |
| REQ-007 | 회차 diff 요약: 수정 회차마다 바뀐 파일과 CSS 값 변화를 쉬운 말로 뽑는다("padding 12→16, 색 유지"). 기계 추출만, 지어내지 않음. | 변경 없는 회차는 "변경 없음". |
| REQ-008 | 취향 장부: 정지점의 수정 요청 원문과 최종 선택 안을 장부 `preference` 로 남기고, 다음 ui/W/V Design 시작 시 주입한다. | 장면 C 뒤 decisions.md 취향 절에 2건 이상. |
| REQ-009 | W·V 단계 산출물 렌더링: `do ready` 가 W 의 html 을 png 로, V 의 svg 를 png 로 만들어 확인 단계에서 그림으로 보인다. 렌더 실패는 NOT_READY. | fixture W·V 가 png 로 렌더된다. |
| REQ-010 | doctor: `browser` 검사(Chrome 경로), `statusline` 검사가 `~/.claude/settings.json` 외에 프로젝트 `.claude/settings*.json` 도 본다(H3 잔여 결함). | 프로젝트 설정만 있을 때 pass. |
| REQ-011 | 장면 C 회귀: fixture `tests/fixtures/mini-booking` 에서 ui 작업을 시안 2안 → 승인 → 적용 → 정지점 수정 2회(diff·취향 기록) → `/vais 확인` → Review(검수 페이지) → 최종 승인 → Report 까지 CLI 로 진행. | `npm run regression` 통과. Chrome 없는 환경은 렌더러 대체로 상태 로직만 검증하고 그 사실을 표시. |
| REQ-012 | 문서·버전: roadmap H3 완료·H4 진행, design.md 대응표, CLAUDE(그림으로 보이기 규칙)·README·ONBOARDING, CHANGELOG, 3.4.0. | doctor version-sync PASS. |

## 5. 사용자 흐름

1. `/vais 상세 화면 버튼이 눈에 안 띔` → kind `ui` 제안 → Plan 한 줄 승인.
2. Design: 시안 2안이 각각 데스크톱·모바일 그림으로 제시된다. `/vais 1번` 뒤 `/vais design 승인`.
3. Do 가 적용 → 실제 화면 전/후 그림 제시 → "더 크게" → 다시 적용 → 그림 + "padding 12→16, 색 유지" → "색은 파랑" → 반복 → `/vais 확인`.
4. Review: 독립 QA 가 승인 시안 vs 실제 화면 검수 페이지로 판정 → `/vais 최종 승인` → Report. 취향 장부에 "버튼은 크게, 파랑" 이 남고 다음 UI 작업의 Design 첫 줄에 뜬다.

## 6. 엣지 케이스

| 상황 | 처리 |
|---|---|
| Chrome 미설치 | Design·Do 가 실패 이유를 내고 doctor 가 설치 안내. 그림 없는 승인은 없다. |
| 수정 요청이 요구사항 변경 | 정지점에서 `/vais 새 작업:` 으로 안내, 현재 작업은 확인 또는 취소. |
| 6번째 수정 | blocked, "5회 상한 — 확인하거나 취소" 안내. |
| 정지점에서 세션 끊김 | 브리핑이 `do/waiting-user` 와 마지막 회차 그림 경로를 알린다. |
| 모바일 레이아웃만 깨짐 | 두 크기 모두 항상 찍는다. |
| 앱이 서버 실행 필요 | 이번엔 URL 을 사용자가 주거나 정적 파일만. 기동은 H6. |

## 7. 완료 조건

REQ-001~012 테스트 증명, 장면 A·C·E·F 회귀 통과, `npm test`·`lint`·`validate`·`regression`·`doctor` PASS, 독립 QA PASS, 최종 승인.

## 8. 영향

변경: state-machine(이벤트 2종·회차 카운터), router(`확인`·`N번`), prompt hook(정지점 지침), phase-check(ui 양식), phase-transaction(정지점·렌더), work-kinds.json(ui 양식·트리거), doctor, ledger(preference). 신규: screen-capture.js, review-page.js, diff-summary.js, 장면 C, fixture 시안. 기존 kind 동작은 그대로. 반영은 push·업데이트 뒤.
