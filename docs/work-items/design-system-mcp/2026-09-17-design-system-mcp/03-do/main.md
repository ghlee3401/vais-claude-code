---
schema: vais-phase/v1
work_item: WI-2026-09-17-design-system-mcp
phase: do
revision: 1
status: draft
based_on: []
---

# Do — design-system-mcp

## 구현 변경

- REQ-001 Design 승인 시 `## 결정` 4 불릿이 장부 decision 으로 기록됨(삭제 결정·유지 기각·축소 기각·되살림 경로).
- REQ-002 `mcp/`(2), `vendor/ui-ux-pro-max`(18), `design-system/`(11), `.mcp.json` 을 `git rm` 으로 삭제(사용자가 실행 — write guard 가 AI 의 rm·git rm 을 막음). `plugin.json` `mcpServers` 블록 제거, `contracts/v2-role-cards.json` `ui-designer.knowledge` → `[]`(runtime 은 이 필드를 읽지 않음), README 의존성 표 Python 행 삭제, CLAUDE 구조도·Do NOT `vendor/` 줄 삭제.
- REQ-003 `docs/harness/design.md` 대응표 H8 행 → "삭제 (H8)" + 근거 4·되살림 커밋 `66d0f6b`; `roadmap.md` H7 완료(4.0.0)·H8 완료(4.0.1)·로드맵 종료 문구; CHANGELOG [4.0.1] Removed; README·CLAUDE·ONBOARDING 상태 줄 H1~H8 완료.
- REQ-004 버전 7면 4.0.1.

## 검증 증거

- 남은 참조 grep(`vendor/ui-ux-pro-max`·`design-system-server`·`vais-design-system`, docs·CHANGELOG 제외): 저장소 파일 0건. `.claude/settings.local.json`(gitignored 개인 설정)에만 옛 MCP 도구 허용 항목이 남아 있어 사용자가 지우면 된다.
- plugin-validator 오류 0·경고 0, 구성 요소 skills·agents·hooks(MCP 없음).
- `npm test` 전체 PASS, `npm run regression` 10/10, `npm run lint` 0 경고.
