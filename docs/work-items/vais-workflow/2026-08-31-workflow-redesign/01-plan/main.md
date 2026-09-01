---
schema: vais-phase/v1
work_item: WI-2026-08-31-workflow-redesign
phase: plan
revision: 1
status: approved
based_on:
  - user-conversation-2026-08-30-to-2026-08-31
  - docs/260821_plugin-architecture-review/01-plan/main.md
approved_by: user
approved_at: 2026-08-31
---

# Plan — VAIS workflow redesign

## 1. 사용자 요청과 문제

VAIS는 비개발자가 AI와 함께 앱을 만들 수 있도록 중간 결과를 남기고, 그 결과를 기반으로 계획·설계·구현·검증을 반복하는 Claude Code 플러그인이다. 현재는 많은 Agent Markdown과 고정 템플릿을 읽고 sub-agent별 문서를 직접 생성하면서 컨텍스트와 토큰을 낭비한다. 역할 위임과 병렬 실행이 실제로 보장되지 않으며, 작은 수정에도 큰 작업과 비슷한 무게로 동작한다.

사용자가 원하는 결과는 다음과 같다.

- Plan과 Review를 모든 작업에 남겨 전체 시스템 영향과 변경 이유를 추적한다.
- Design에 요구사항별 동작, 입력, 출력, 오류, UI 흐름과 QA 기대 결과를 연결한다.
- UI는 실제 브라우저와 스크린샷으로 검증하고 사용자의 피드백을 다시 Design에 반영한다.
- AI QA는 스스로 수정·재검증하되 무한 반복하지 않는다.
- Feature의 장기 이력과 한 번의 변경인 Work item을 사람이 쉽게 찾을 수 있게 연결한다.
- 비개발자가 C-Level이나 Phase를 직접 조작하지 않아도 VAIS가 필요한 역할을 호출한다.
- `/vais`가 붙은 요청만 관리 흐름으로 실행해 일반 Claude의 자유 진행을 막는다.
- 완료된 Report는 당시의 기록으로 고정하고 이후 변경은 새 Work item에서 수행한다.

## 2. 선행 이력과 관계

| 항목 | 판단 |
|---|---|
| 선행 작업 | `260821_plugin-architecture-review`가 동일 문제를 진단한 기존 Plan이다. |
| 관계 | 이번 Work item은 선행 리뷰를 폐기하지 않고 실제 개편 설계로 이어간다. |
| Primary feature | `vais-workflow` |
| Affected features | Agent orchestration, documentation, QA, session control |
| 중복 처리 | 기존 문서는 Legacy 이력으로 연결하며 복사하거나 재작성하지 않는다. |

## 3. Plan에 포함된 Ideation

| 대안 | 장점 | 문제 | 결정 |
|---|---|---|---|
| 기존 구조의 템플릿만 축소 | 빠르고 변경 위험이 작음 | 상태·승인·Agent 실행 보장이 해결되지 않음 | 제외 |
| 기존 구조를 즉시 전면 교체 | 구조가 단순해짐 | 기존 프로젝트와 평가 기준을 잃고 마이그레이션 위험이 큼 | 제외 |
| 새 실행 커널을 병행 구축한 뒤 비교 전환 | 기존 기준선을 보존하면서 새 흐름을 검증 가능 | 일시적으로 호환 계층이 필요함 | **채택** |

핵심 방향은 **모든 작업의 5단계와 사람의 승인은 유지하고, 단계별 문서 깊이·Agent 수·컨텍스트만 작업 규모와 변경 영역에 맞게 조절하는 것**이다.

## 4. 결과 미리보기

### 사용자 흐름

```text
/vais 자연어 요청
→ 과거 Feature/Work item 검색
→ CPO Plan 제시
→ 사용자 Plan 승인
→ CTO 통합 Design 제시
→ 사용자 Design 승인
→ Do
→ QA 준비 확인
→ 독립 AI QA
→ 실제 화면·검증 결과 제시
→ 사용자 최종 승인
→ Report 작성·완료
```

사용자는 CPO, CTO, CSO나 `plan`, `do`, `review`를 직접 호출하지 않는다. VAIS 관련 요청·피드백·승인은 매번 `/vais`로 시작하며, VAIS는 매 응답에 현재 Work item과 단계, 다음 행동을 한 줄로 보여준다.

### 문서 결과

한 Work item에는 루트 상태 문서와 다섯 단계의 정본만 존재한다. Agent별 판단은 정본에 통합하고 별도 Markdown으로 만들지 않는다. Review의 로그와 스크린샷처럼 기계 증거만 evidence 아래에 보존한다.

## 5. 범위

### 포함

- `/vais` 단일 대화 진입점과 단계·역할 자동 라우팅
- Feature/Work item 구조, 관계 검색, Master 인덱스
- Plan·Design·Do·Review·Report 상태 머신과 사용자 승인 Gate
- Compact/Standard/Extended 규모 판정
- C-Level 및 specialist 역할 경계와 구조화된 handoff
- 조건부 보안·운영·비즈니스 검토
- Do QA 준비 확인과 독립 AI QA
- 브라우저 기반 UI 검증 및 스크린샷 증거
- 단일 진행 Work item, 세션 lease, 대기 요청
- 외부 변경 감지와 단계별 쓰기 권한
- 기존 문서·명령·상태의 호환 마이그레이션
- Mini Booking 예제 앱을 이용한 개편 전후 평가

### 제외

- 실제 사업의 시장 진출, 가격 정책 또는 운영 인프라 구축
- Graph DB나 Vector DB 기반 지식 검색
- 완료된 Legacy 문서의 일괄 재작성
- 사용자 편집기나 외부 프로세스가 만든 변경을 강제로 차단하거나 자동 삭제하는 기능
- 사용자 승인 없이 후속 Work item을 자동 생성하는 기능
- 이 Plan/Design 정본 작성 요청에서의 제품 코드 변경

## 6. 작업 규모

**Extended**로 분류한다. 사용자 명령, 상태 저장, 문서 구조, Agent 계약, Hook 권한, QA와 마이그레이션을 함께 바꾸는 다영역 변경이며 기존 플러그인 사용자와 문서에 대한 호환 위험이 있기 때문이다. Extended는 문서와 검증 깊이를 높이지만 다섯 단계 외의 추가 Phase를 만들지는 않는다.

## 7. 요구사항

| ID | 요구사항 | 완료 조건 |
|---|---|---|
| REQ-001 | 모든 작업은 Plan→Design→Do→Review→Report를 거친다. | 작업 규모와 무관하게 다섯 단계 기록이 존재한다. |
| REQ-002 | Ideation은 별도 단계·문서 없이 Plan에 포함한다. | `ideation` 상태와 새 ideation 문서가 생성되지 않는다. |
| REQ-003 | CPO는 Plan, CTO는 Design/Do, 독립 QA는 Review, CEO는 전체 조정/Report를 맡는다. | 각 Phase 정본과 실행 기록에서 책임이 확인된다. |
| REQ-004 | Plan과 Design은 사용자 승인 후 다음 단계로 진행한다. | 명시적인 승인 사건 없이는 상태 전이가 거부된다. |
| REQ-005 | AI QA PASS 후에만 사용자 최종 승인을 요청하고, 승인 후에만 Report를 작성한다. | Review FAIL/BLOCKED에서 최종 승인·Report 경로가 없다. |
| REQ-006 | VAIS 관련 모든 요청·피드백·승인은 `/vais`로 시작한다. | `/vais` 없는 대화는 상태·문서·제품 코드를 변경하지 않는다. |
| REQ-007 | Feature는 장기 기능, Work item은 한 번의 변경으로 관리한다. | 모든 Work item에 primary/affected Feature 관계가 존재한다. |
| REQ-008 | 기존 완료·미완료 Work item을 검색해 유사 작업 관계를 사용자에게 제안한다. | Plan에 검색 결과와 사용자의 관계 승인 여부가 남는다. |
| REQ-009 | Feature와 Work item 전체를 `docs/README.md`에서 조회할 수 있다. | Master가 정본 메타데이터로부터 생성되고 링크 검증을 통과한다. |
| REQ-010 | 단계와 상태를 분리한 event 기반 상태 머신을 사용한다. | 허용 목록 밖의 전이가 런타임에서 차단된다. |
| REQ-011 | 프로젝트 전체에서 진행 가능한 Work item은 최대 하나다. | 여러 세션에서도 active/waiting-user/blocked 작업이 중복되지 않는다. |
| REQ-012 | 다른 요청은 Work item을 만들지 않고 대기 요청으로 보관한다. | 사용자 선택 전 Feature/Work item ID와 Phase 문서가 생기지 않는다. |
| REQ-013 | 작업 규모는 Compact/Standard/Extended로 분류하되 Phase를 생략하지 않는다. | 규모는 문서 깊이·Agent·검사 범위에만 영향을 준다. |
| REQ-014 | Plan은 문제·목표·범위·REQ·흐름·엣지 케이스·완료 조건·영향을 정의한다. | Plan Gate 필수 항목이 이 문서 또는 후속 Plan에 존재한다. |
| REQ-015 | Design은 각 REQ의 동작·입력·출력·오류·UI·기술 설계와 TC를 정의한다. | 모든 REQ가 구현 결정과 검증 사례에 연결된다. |
| REQ-016 | 모든 Design은 전문 영역을 필요/불필요/불확실로 판단한다. | 판단 또는 triage 결과가 없으면 Design Gate가 차단된다. |
| REQ-017 | Design이 구현 Agent, 작업 순서, 병렬성, 수정 가능 경로를 정한다. | Do dispatch에 담당·질문·범위가 명시된다. |
| REQ-018 | specialist는 Markdown 대신 구조화된 handoff를 반환한다. | Phase 책임자만 정본 문서를 작성한다. |
| REQ-019 | Do는 승인된 Design 범위만 구현하며 새 영역 발견 시 Design으로 돌아간다. | 승인 범위 밖 쓰기가 차단되거나 Design checkpoint로 전환된다. |
| REQ-020 | Do와 Review 사이에 런타임 소유의 QA 준비 확인을 둔다. | READY만 Review에 진입하며 NOT_READY 3회 연속이면 blocked가 된다. |
| REQ-021 | AI QA는 구현 Agent와 독립적이며 제품 코드를 수정하지 않는다. | QA Agent 쓰기 권한과 수정 경로가 분리된다. |
| REQ-022 | AI QA 실패는 Design→Do→준비 확인→Review 순으로 최대 3회 자동 보완한다. | 최초 QA 포함 최대 4회 실행 후 실패하면 review/blocked가 된다. |
| REQ-023 | UI는 실제 브라우저에서 주요 상태와 화면 크기를 확인한다. | Review evidence에 스크린샷과 실행 결과가 존재한다. |
| REQ-024 | 사용자 피드백 원문과 AI의 구조화된 해석을 함께 보존한다. | 피드백이 Design 또는 범위 변경 시 Plan revision으로 연결된다. |
| REQ-025 | 완료 Report는 불변이며 이후 수정은 새 Work item으로 진행한다. | 완료 Report 쓰기 시도가 차단되고 새 작업 관계가 생성된다. |
| REQ-026 | Plan/Design은 최신 main과 의미 있는 승인본 revision만 보존한다. | 미승인 문구 수정이나 단순 재확인은 revision을 늘리지 않는다. |
| REQ-027 | Agent는 역할별 최소 Context View와 필요 시 검색 영수증을 사용한다. | 모든 파일을 선로드하지 않고 사용한 근거를 추적할 수 있다. |
| REQ-028 | 기계적 검사는 Tool, 판단은 Agent가 담당한다. | 검사 결과 계약과 판단 handoff가 분리된다. |
| REQ-029 | 단계별 쓰기 권한과 repo drift 검사를 적용한다. | 외부 변경을 감지하고 범위에 따라 Do/Design/Plan으로 라우팅한다. |
| REQ-030 | 기존 엔진과 문서를 보존한 채 새 엔진을 Shadow Mode로 검증한다. | 동일 시나리오의 기존/신규 결과를 비교한 뒤 기본값을 전환한다. |

## 8. 주요 엣지 케이스

| 상황 | 기대 처리 |
|---|---|
| `/vais` 없이 “진행해”라고 말함 | 읽기 전용 안내만 하고 상태를 바꾸지 않는다. |
| “좋네”처럼 모호하게 답함 | 공식 승인으로 기록하지 않는다. |
| `/vais 승인할게`라고 말함 | 현재 유일한 waiting-user Gate를 승인한다. 모호하면 대상을 확인한다. |
| 진행 중 다른 작업을 요청함 | 새 Work item 없이 pending request로 보관하거나 사용자의 무시 지시를 따른다. |
| 다른 세션에서 같은 저장소를 수정하려 함 | 기존 진행 작업을 보여주고 mutation lease를 주지 않는다. |
| 기존 작업이 blocked임 | 슬롯을 유지한다. 다른 작업은 사용자가 pause/cancel해야 시작한다. |
| 사용자가 직접 코드를 편집함 | 다음 `/vais`에서 drift를 감지하고 자동 삭제 없이 영향 범위를 재판단한다. |
| QA 도구가 설치되지 않음 | required 검사라면 BLOCKED, 선택 검사라면 근거와 함께 미실행 기록을 남긴다. |
| UI가 없는 변경 | UI 검증을 N/A로 기록하고 이유를 남긴다. |
| Report 후 같은 기능 수정 요청 | 기존 Report를 수정하지 않고 새 Work item 관계를 제안한다. |

## 9. 비기능 기준

- **이해 가능성**: 비개발자가 C-Level과 내부 파일 구조를 몰라도 다음 행동을 알 수 있어야 한다.
- **추적성**: REQ, Design, TC, 코드 변경, QA 증거가 연결되어야 한다.
- **안전성**: 승인·단계·쓰기 범위·반복 횟수는 프롬프트 권고가 아니라 런타임에서 강제한다.
- **효율성**: 기존 대비 Agent 지침 로딩량, 중복 호출, 생성 문서 수와 크기를 줄인다.
- **호환성**: 기존 문서와 명령을 즉시 파괴하지 않으며 평가 전에는 기본 엔진을 교체하지 않는다.
- **정직성**: 실행하지 않은 검사, 확인하지 못한 화면, 존재하지 않는 사용자 연구를 만들어내지 않는다.

## 10. Plan Gate 결과

| 조건 | 결과 |
|---|---|
| 원 요청과 문제 | PASS |
| 선행 작업 및 Feature 관계 | PASS |
| 목표·범위·제외 범위 | PASS |
| 안정적인 REQ와 완료 조건 | PASS |
| 사용자 흐름과 엣지 케이스 | PASS |
| 규모·영향 판단 | PASS — Extended |
| 사용자 승인 | PASS — 2026-08-31 대화에서 확정 |
