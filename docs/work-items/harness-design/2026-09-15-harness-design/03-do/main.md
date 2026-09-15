---
schema: vais-phase/v1
work_item: WI-2026-09-15-harness-design
phase: do
revision: 1
status: draft
based_on: []
---

# Do — 하네스 설계 문서 확정 (QA 수정 1회차 반영)

## 변경 (구현)

Design revision 1 의 세부 수정(material=false)을 `docs/harness/**` 에 반영했다. 코드·hook·설정·상태 파일은 건드리지 않았다.

| 파일 | 이번 회차 변경 | 근거 |
|---|---|---|
| `docs/harness/design.md` | 0절 요약을 300자 이내로 줄이고 역할 카드를 언급, 잘못된 절 참조 제거. 4절 공통 억지력에 PostToolUse 행 추가. 10절 대응표에 PostToolUse 기록 hook, `lib/io.js` 접점 어댑터, `agent-policy.js` guard 행 추가. 장면 D·E 를 Report 로 종결 | REQ-001, REQ-004, REQ-009, REQ-010 |
| `docs/harness/README.md` | 한 장 요약을 design.md 0절과 동일하게 갱신 | REQ-001 |
| `docs/harness/roadmap.md` | 변경 없음 | REQ-012 |

specialist 위임은 없다. 문서 작업이라 별도 Agent 조건에 해당하지 않는다.

## 증거 (검증)

- readiness check `plugin-validator` 를 transaction 이 다시 실행한다.
- 1차 QA FAIL 항목(TC-001, TC-009)과 리스크 3건 중 문서로 해결 가능한 2건(PostToolUse 배정, 장면 D·E 종결)을 반영했다. 남은 리스크 "design.md 와 승인 Design 불일치" 는 이번 회차가 Design 세부 수정 → Do 순서를 지켰으므로 해소됐다.
- 2차 독립 QA 가 TC-001~TC-014 를 다시 검사한다. TC-015, TC-016 은 장면 예시 ID 로 검사 대상이 아니다.
