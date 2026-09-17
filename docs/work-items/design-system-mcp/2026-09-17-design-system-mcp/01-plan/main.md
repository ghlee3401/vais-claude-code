---
schema: vais-phase/v1
work_item: WI-2026-09-17-design-system-mcp
phase: plan
revision: 1
status: approved
based_on: []
---

# Plan — 디자인 시스템 MCP 유지·삭제 결정 (design-system-mcp)

kind: harness (플러그인 자체 정리) · 규모: compact · 로드맵 H8

## 1. 문제

플러그인에 `vais-design-system` MCP 서버(`.mcp.json`, `plugin.json`, `mcp/` runner → Python `vendor/ui-ux-pro-max/scripts/search.py`, CSV 1.2MB)와 브랜드 카탈로그 `design-system/`(DESIGN.md 5종 160KB)가 남아 있다. 확인된 사실: (1) 이 세션 내내 서버는 "Connection closed" 로 연결에 실패했다. (2) `lib/`·`hooks/`·`scripts/` 어디도 이 폴더를 부르지 않는다. 남은 참조는 역할 카드 `ui-designer.knowledge` 한 줄, README 의존성 표 Python 행, 설계 대응표 "보류 (H8)" 행뿐이다. (3) `design-system/INDEX.md` 는 지워진 Legacy(`hooks/design-mcp-trigger.js`, `.vais/status.json`, `designSystem` 설정)를 가리키는 죽은 문서다. (4) H4 이후 화면은 스크린샷으로 보고, 5단계 디자인 시스템 문서는 사용자가 고르는 스타일 3안으로 만든다 — MCP 없이도 동작한다.

## 2. 목표

MCP·vendor·브랜드 카탈로그를 유지할지 삭제할지 근거와 함께 결정하고, 결정대로 저장소·문서·의존성 표를 정리해 로드맵 H1~H8 을 닫는다.

## 3. 범위

포함: 결정 기록(장부 decision), 결정에 따른 파일·등록·문서 정리, 검증, 버전. 제외: 새 디자인 도구 도입, 5단계 양식 변경, `brief` 스킬(무관).

## 4. 요구사항

| ID | 요구사항 | 완료 조건 |
|---|---|---|
| REQ-001 | 결정: 유지·축소·삭제 중 하나를 근거와 함께 Design 에서 제시하고 사용자 승인으로 확정한다. 근거는 연결 실패 이력, 코드 참조 0, Python 의존성, 크기, 5단계 양식과의 관계. | 장부에 decision 1건 이상. |
| REQ-002 | 정리: 결정대로 `.mcp.json`·`plugin.json` MCP 등록, `mcp/`·`vendor/`·`design-system/`, 역할 카드 knowledge, README 의존성 표를 일관되게 바꾼다. 유지면 연결 실패 원인을 고쳐 `tools/list` 가 응답한다. | 플러그인 검증 오류 0, `/reload-plugins` 뒤 MCP 오류 없음. |
| REQ-003 | 문서·로드맵: 설계 대응표 H8 행을 결정으로 바꾸고, roadmap H7 완료·H8 완료, CHANGELOG. | grep 통과. |
| REQ-004 | 검증·버전: `npm test`·회귀·lint·검증 PASS, 버전 7면 동기화. | doctor fail 0. |

## 5. 사용자 흐름

사용자는 Design 에서 안을 고르고 승인만 한다. 삭제면 설치 표에서 Python 이 사라지고 플러그인이 가벼워진다. 유지면 5단계 디자인 시스템 작업에서 색·글꼴 검색 도구가 실제로 응답한다. 그 외 사용법은 같다.

## 6. 엣지 케이스

- `brief` 스킬은 `design-system` 이라는 단어를 자체 템플릿에서 쓸 뿐 이 폴더와 무관하다 — 건드리지 않는다.
- 삭제 뒤 plugin.json 에 `mcpServers` 가 비면 검증기가 정보 항목만 바꿔야 한다(오류 아님).
- `references/` 는 gitignored 인박스라 범위 밖이다.
- 유지를 고르면 연결 실패 원인(Python 부재·stdio 프로토콜)을 재현해야 하고 compact 를 넘길 수 있다 → Design 에서 규모 재판단.

## 7. 완료 조건

decision 장부 기록, 결정과 저장소 상태 일치, `npm test`·`npm run regression`·lint·플러그인 검증 PASS, 독립 QA PASS, doctor fail 0, roadmap H1~H8 완료.

## 8. 영향

변경 후보: `.mcp.json`, `.claude-plugin/plugin.json`, `mcp/**`, `vendor/**`, `design-system/**`, `contracts/v2-role-cards.json`(knowledge 1줄), README, `docs/harness/{design,roadmap}.md`, CHANGELOG, 버전 7면. 상태 머신·양식·계약 구조는 바꾸지 않는다. 커밋은 `/vais 저장` 흐름.
