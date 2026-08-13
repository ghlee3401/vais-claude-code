---
owner: cto
artifact: workflow-policy-decisions
phase: plan
feature: adaptive-workflow-kernel
summary: "대표가 확정한 작은 작업 자동 진행, 고위험 보안 재확인, 전체 실행 감사 로그, 위험 기반 검증 정책"
---

# Workflow Policy Decisions

## 1. 확정 정책

### 작은 작업

작은 작업도 AI가 즉시 수정하지 않는다. 먼저 한 번의 실행 예고를 보여주고 승인을 받는다.

실행 예고에는 다음 항목을 포함한다.

- 무엇을 바꿀지
- 변경 결과의 짧은 예시
- 예상 변경 파일 또는 영역
- 실행할 검사
- 발견된 위험
- 자동 진행이 허용되는 범위
- 다시 확인하게 되는 조건

사용자가 승인하면 Plan, Do, QA와 결과 기록을 자동으로 끝낸다. 아래 조건이 생길 때만 다시 확인한다.

- 처음 설명한 범위를 벗어남
- 일반에서 높은 위험으로 바뀜
- destructive 또는 되돌리기 어려운 작업 필요
- 테스트나 gate 실패
- 요구사항이 서로 충돌함

### 높은 보안 위험

`high` 또는 `regulated`로 판단하면 자동 실행 전에 반드시 대화형 보안 재확인을 수행한다.

확인할 내용은 작업에 맞게 최소한으로 선택한다.

- 어떤 데이터와 권한을 다루는지
- 외부 시스템으로 데이터가 나가는지
- 실패 시 사용자와 사업에 미치는 영향
- rollback이 가능한지
- 추가 보안 검사와 기록 보존이 필요한지

AI는 답변을 반영한 최종 실행 계획과 남은 위험을 다시 보여준다. 사용자가 명시적으로 승인한 뒤에만 실행한다. 실행 중 새로운 보안 조건이 발견되면 멈추고 다시 확인한다.

### 모든 AI 실행 기록

AI가 수행한 모든 실행 행동은 runId 기준의 append-only 감사 로그로 남긴다.

항상 기록할 이벤트는 다음과 같다.

- 요청 접수와 redacted summary/hash
- 규모·위험도 판단과 근거
- 실행 예고와 사용자 승인·수정·중단
- 읽은 context의 경로·선택 이유·content hash
- 호출한 agent의 시작·종료·결과
- tool 이름, 대상, 시작·종료 시각, 성공·실패
- shell command의 redacted form과 exit code
- 파일 생성·수정 경로와 before/after hash
- 테스트·lint·scan·gate 결과
- 재시도, 오류, scope 변경과 보안 재확인
- 생성한 artifact와 최종 상태
- duration, agent 수, 승인 수, 실제 또는 proxy cost

모든 행동을 기록한다는 것은 모든 민감한 내용을 원문 복제한다는 뜻은 아니다.

- 비밀값과 개인정보는 기록 전에 redaction한다.
- 코드 변경의 정본은 Git이며 감사 로그에는 path와 hash를 남긴다.
- 큰 tool output은 요약·hash·별도 evidence reference로 남긴다.
- 모델의 비공개 내부 추론은 저장 대상이 아니다.
- 로그는 AI가 장문으로 작성하지 않고 hook과 deterministic logger가 생성한다.

### 비용과 검증

비용 절감을 기본 우선순위로 둔다. 다만 검증 강도는 작업 크기가 아니라 위험도에 따라 필요한 부분만 높인다.

| 작업 | 일반 위험 | 높은 위험 |
|---|---|---|
| 작게 | 관련 lint/test만 실행 | 보안 재확인 + 관련 보안 검사 + 강화 QA |
| 표준 | contract 영향에 맞춘 설계·통합 검사 | threat/rollback 검토 + 보안·통합 검사 |
| 전체 | 전체 PDCA와 제품 검증 | 전체 PDCA + 보안·컴플라이언스 증거 |

문서 분량과 agent 수는 규모에 따라 줄이고, 검사는 위험이 있는 부분에 집중한다.

## 2. 작은 작업 예시

사용자 요청:

> 로그인 버튼 문구를 "로그인"에서 "계속"으로 바꿔줘.

실행 전 VAIS 표시 예시:

```text
개발 크기: 작게
위험도: 일반

변경 예정
- 로그인 버튼 문구를 "계속"으로 변경
- 로그인 처리 로직과 API는 변경하지 않음

결과 예시
- 변경 전: [로그인]
- 변경 후: [계속]

예상 범위
- 로그인 버튼 UI 파일 1개
- 관련 UI 테스트 1개

검증
- 관련 테스트
- lint
- 변경 범위 확인

자동 진행 경계
- 승인 후 구현과 QA까지 자동 진행
- 인증 로직 변경, 추가 파일 확장, 테스트 실패 시 다시 확인
```

사용자는 `이대로 실행`, `내용 수정`, `중단` 중 하나를 선택한다. `이대로 실행` 이후에는 경계 안에서 자동으로 완료한다.

## 3. 승인 상태 모델

| 상태 | 의미 |
|---|---|
| `preview-required` | 모든 작업의 최초 실행 예고 대기 |
| `approved` | 설명한 경계 안에서 자동 진행 가능 |
| `security-review-required` | high/regulated 대화형 재확인 필요 |
| `security-approved` | 보안 조건을 반영한 실행 승인 |
| `reapproval-required` | scope/risk/destructive/failure로 재승인 필요 |
| `blocked` | 사용자 중단 또는 해결되지 않은 gate fail |

일반 patch의 정상 workflow 승인은 1회다. high/regulated는 최초 예고와 보안 대화를 결합할 수 있지만, 보안 확인을 생략할 수 없다.

## 4. 감사 로그 품질 기준

- E2E에서 실행된 tool/agent/change/check마다 대응 event가 있어야 한다.
- 누락 event는 0건이어야 한다.
- 모든 event는 `runId`, `timestamp`, `actor`, `eventType`, `outcome`을 가진다.
- 민감 필드 redaction 테스트를 통과해야 한다.
- 로그 실패가 조용히 사라지지 않고 run summary에 `auditIncomplete=true`로 표시되어야 한다.
- 감사 로그는 기본 실행 context에 자동 주입하지 않는다. 상태 조회나 감사 요청 시에만 읽는다.

## 변경 이력

| version | date | change |
|---|---|---|
| v1.0 | 2026-08-12 | 대표 확정 운영 정책과 작은 작업 실행 예시 기록 |
