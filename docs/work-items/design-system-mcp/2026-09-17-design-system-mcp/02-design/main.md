---
schema: vais-phase/v1
work_item: WI-2026-09-17-design-system-mcp
phase: design
revision: 1
status: approved
based_on: []
---

# Design — 디자인 시스템 MCP 유지·삭제 결정 (design-system-mcp)

## 1. 접근

**전부 삭제**를 제시한다. 근거 넷(연결 실패 이력, 코드 참조 0, Python 의존성, 5단계 양식이 MCP 없이 동작)이 모두 삭제 쪽이고, 축소안(브랜드 DESIGN.md 5종만 남김)은 `design-system/INDEX.md` 가 이미 죽은 문서라 "남길 정본" 이 없다. 5단계 디자인 시스템의 스타일 3안은 지금처럼 사용자가 대표 화면에 입힌 스크린샷으로 고른다. 필요해지면 git 이력(4.0.0)에서 언제든 되살릴 수 있다.

## 2. REQ 별 동작 · 입력 · 출력 · 오류 · 결정 · TC

| REQ | 동작 | 입력 | 출력 | 오류 | 구현 결정 | TC |
|---|---|---|---|---|---|---|
| REQ-001 | 결정 기록 | 이 Design | 장부 decision | — | `## 결정` 절 불릿이 승인 때 decision 으로 기록된다. 대안(유지·축소)과 기각 이유를 같은 절에 적는다 | TC-001 |
| REQ-002 | 정리 | 저장소 | MCP 없는 플러그인 | 검증기 오류 → NOT_READY | `git rm -r mcp/ vendor/ design-system/`, `.mcp.json` 삭제, `plugin.json` 의 `mcpServers` 블록 제거, `contracts/v2-role-cards.json` `ui-designer.knowledge` 를 `[]` 로(스키마 확인), README 의존성 표 Python 행 삭제, CLAUDE 구조도 `mcp/ · design-system/ · vendor/` 줄과 Do NOT `vendor/` 줄 삭제 | TC-002 |
| REQ-003 | 문서·로드맵 | design.md·roadmap.md·CHANGELOG | 최종 상태 | — | 대응표 H8 행 → "삭제 (H8) — 근거 4" , roadmap H7 완료(4.0.0)·H8 완료, 진행 상태 표 아래 "로드맵 종료" 한 줄, CHANGELOG [4.0.1] Removed | TC-003 |
| REQ-004 | 검증·버전 | — | PASS | — | 버전 7면 4.0.1(기능 추가 없는 제거·정리). `npm test`·`npm run regression`·lint·plugin-validator, `/reload-plugins` 뒤 MCP 서버 0개 | TC-004 |

## 3. 결정

- 디자인 시스템 MCP(`mcp/`·`.mcp.json`·plugin.json mcpServers)·`vendor/ui-ux-pro-max`·`design-system/` 를 전부 삭제한다. 근거: 세션 내내 "Connection closed" 로 연결 실패, lib·hooks·scripts 에 참조 0, Python3 의존성이 비개발자 설치를 무겁게 함, 5단계 디자인 시스템은 H4 이후 스크린샷 3안으로 동작.
- 유지안 기각: 연결 실패 원인 재현·수리와 Python 의존성 유지가 compact 를 넘고, 쓰는 코드가 없어 고쳐도 사용처가 없다.
- 축소안(브랜드 DESIGN.md 5종만 참고 자료로 보관) 기각: INDEX 가 Legacy 를 가리키는 죽은 문서라 정본이 없고, 필요하면 원본(VoltAgent/awesome-design-md)이나 git 이력에서 가져온다.
- 되살림 경로: git 태그 없이 4.0.0 커밋(`66d0f6b`)에서 세 폴더를 checkout 하면 된다. Report 에 적는다.

## 4. 전문 영역

| 영역 | 판단 |
|---|---|
| 데이터 계약 | 필요 — 역할 카드 `knowledge` 빈 배열이 스키마·로더에 허용되는지. TC-002 |
| 보안 | 불필요 — 삭제만 |
| UI·성능 | 불필요 |

## 5. 담당 · 쓰기 범위

main voice 직접, 위임 없음. 쓰기 범위: `mcp/**`, `vendor/**`, `design-system/**`, `.mcp.json`, `.claude-plugin/**`, `contracts/**`, `docs/harness/**`, `package.json`, `package-lock.json`, `vais.config.json`, `CHANGELOG.md`, `README.md`, `CLAUDE.md`, `ONBOARDING.md`.

## 6. readiness · review

readiness: `test`, `plugin-validator`. review: `secret-scan` + 독립 QA(읽기 전용)가 삭제 완전성(grep 으로 남은 참조 0)·검증기 결과·문서를 대조한다.

## 7. TC

| TC | 검증 | 기대 |
|---|---|---|
| TC-001 | 장부에 H8 decision 이 근거와 함께 기록 | `ledger list --kind decision` 에 표시 |
| TC-002 | 세 폴더·`.mcp.json` 없음, plugin.json 에 mcpServers 없음, 역할 카드 knowledge 참조 없음, repo 전체 grep `vendor/ui-ux-pro-max`·`design-system-server`·`vais-design-system` 0건(CHANGELOG·work-items 제외), plugin-validator 오류 0 | 기대대로 |
| TC-003 | design.md 대응표 H8 행 삭제 표기, roadmap H7·H8 완료, CHANGELOG [4.0.1] | grep 통과 |
| TC-004 | 버전 7면 4.0.1, `npm test`·회귀·lint PASS | 기대대로 |

## 8. rollback

`git checkout 66d0f6b -- mcp vendor design-system .mcp.json` 과 plugin.json `mcpServers` 블록 복원. 문서는 revert.
