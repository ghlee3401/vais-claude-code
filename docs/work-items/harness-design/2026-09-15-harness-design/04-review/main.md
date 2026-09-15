---
schema: vais-phase/v1
work_item: WI-2026-09-15-harness-design
phase: review
revision: 1
status: approved
based_on: []
---

# Review — 하네스 설계 문서 (독립 QA 2차)

## 판정: PASS (14/14)

독립 QA(assignment AS-8e4f4131, clean-room, 읽기 전용, 수정 회차 1)가 `docs/harness/` 세 파일을 Plan REQ-001~014 와 Design TC-001~014 기준으로 다시 검사했다. 입력은 문서 본문, 출력은 TC 별 판정이다. 1차 FAIL 두 건(TC-001, TC-009)은 해소됐다.

## TC 별 기대 · 실제 · 판정

| TC | REQ | 입력 | 기대 | 실제 | 판정 |
|---|---|---|---|---|---|
| TC-001 | REQ-001 | design.md 0절 | 공백 포함 300자 이내, 사슬·역할 언급, 절 참조 오류 없음 | 227자, 사슬·역할 카드 언급, 절 번호 없음 | PASS |
| TC-002 | REQ-002 | 2절 표 | 11행 8열 | 빈칸 0 | PASS |
| TC-003 | REQ-003 | 3절 | 부모표·stale·인용 강제 | 셋 존재 | PASS |
| TC-004 | REQ-004 | 4절 두 표 | 공통 7행(손잡이 6 전부)·단계 11행 | 빈칸 0, PostToolUse 배정됨 | PASS |
| TC-005 | REQ-005 | 5절 표 | kind 4행 문서·ID·갱신 | 존재 | PASS |
| TC-006 | REQ-006 | 6절 표 | 4면 출처·갱신 시점 | 존재 | PASS |
| TC-007 | REQ-007 | 7절 표 | 5행 입력·출력·읽기/쓰기 | 존재 | PASS |
| TC-008 | REQ-008 | 8절 | 기록 지점 ≥5, 스위치, 도장, 회귀 | 기록 6종 외 전부 존재 | PASS |
| TC-009 | REQ-009 | 10절 대응표 | 모든 행 파일·상태, io.js·agent-policy·PostToolUse 행 | 33행 빈칸 0, 지정 3행 존재 | PASS |
| TC-010 | REQ-010 | 11절 | 장면 6 종결 | Report 5 · 경고 1 로 종결 | PASS |
| TC-011 | REQ-011 | 12절 | 결함 12 전부 H 번호 | 전부 | PASS |
| TC-012 | REQ-012 | roadmap.md | 8행 규모·의존·완료 조건 | 존재 | PASS |
| TC-013 | REQ-013 | 9절 표 | 단계 11 + Review owner | 9행으로 전부 커버 | PASS |
| TC-014 | REQ-014 | 9절 규칙 | 세 조건 + guard 거부 | 존재 | PASS |

TC-015, TC-016 은 Design 11절 장면 B·D 의 예시 ID 로만 등장하며 검사 항목이 아니다.

## 엣지 · 제한

- 글자 수는 QA 가 도구 없이 수기로 셌다 (Bash 차단). 227자는 300자 한도에 여유가 커서 판정에 영향 없다.
- QA 가 남긴 경미 결함 3건은 TC 밖이며 Report 의 잔여 제한으로 넘긴다: roadmap.md 머리말의 "2.13 절" 표기가 design.md 에서는 13절, 요약에 "억지력" 낱말 대신 개념 서술, 5절 "회차 diff 요약" 담당 파일이 대응표에 없음.
- 도구 receipt(plugin-validator, secret-scan)는 재실행하지 않고 준비 단계 결과를 신뢰했다.

## 증거

- QA handoff: `04-review/evidence/handoffs/AS-8e4f4131-7e97-4907-b7d4-2263ab7554b6.json`
- 1차 QA handoff: `04-review/evidence/handoffs/AS-7f64349b-0ed8-4b9f-a4c8-5938141d4f2a.json`
- 도구 receipt: `03-do/evidence/checks/plugin-validator.json`, `04-review/evidence/checks/secret-scan.json`
- 판정 근거 줄: design.md 7행(요약), 51~75행(억지력), 141~176행(대응표), 194~207행(결함); roadmap.md 5~14행.
