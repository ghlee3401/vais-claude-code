---
owner: cpo
artifact: plan-rationale
phase: plan
feature: vais-positioning-rethink
---

# Plan Rationale — vais-positioning-rethink

> 기회 → 부재 갭 → 범위 → 페르소나 → 성공 기준 → 리스크. PRD (Do phase) 입력 자료.

## §1. 기회 분석 — 7 영역 매핑

### 1.1 사용자 (1 PO) 의 부서장 역할 7 영역

CEO ideation turn 5 에서 사용자가 명시:

> *"내가 만약에 부서를 맡았을 때 프로젝트의 A 부터 Z 까지를 기획을 해야돼. 운영은 어떻게 하고 전략은 어떻게 세우고 프로젝트 관리는 어떻게 하고 이런 것들. 그 다음에 문서는 어떻게 작성을 하고 팀원들한테는 어떻게 지시하고, 개발은 어떻게 하고 등등 이렇게 구체적으로 가는거지."*

| # | 영역 | vais-code C-Level 매핑 |
|---|------|---------------------|
| 1 | 기획 (A→Z) | CPO + CEO (vision/strategy + PRD) |
| 2 | 운영 | COO (CI/CD, incident, runbook) |
| 3 | 전략 | CEO (Rumelt kernel, OKR) |
| 4 | 프로젝트 관리 | CPO (백로그, 로드맵, sprint) + CEO (라우팅) |
| 5 | 문서 작성 | All (각 phase 산출 + meta: *왜 이걸 쓰나*) |
| 6 | 팀원 지시 | CEO → C-Level → sub-agent 위임 프로토콜 |
| 7 | 개발 | CTO + sub-agents |

### 1.2 부재 갭

vanilla CC 가 채울 수 있는 영역 vs 못 채우는 영역:

| 영역 | vanilla CC | vais-code 현재 | 갭 |
|------|-----------|---------------|-----|
| 7. 개발 (코드) | ✅ plan/review/parallel | 🟡 중복 + ceremony | CC 양보 권장 (A. CTO 슬림화) |
| 1. 기획 (PRD) | 🟡 generic outline | ✅ CPO + prd-writer | 박제 깊이 부족 (framework 이름만) |
| 3. 전략 | ❌ Rumelt/OKR 없음 | 🟡 strategy-kernel-author | 박제 깊이 부족 |
| 2. 운영 | ❌ Sev/SLA/runbook 없음 | 🟡 COO + sub | 박제 깊이 부족 |
| 4. PM | 🟡 generic todo | ✅ backlog-manager + roadmap | OK |
| 5. 문서 메타 | ❌ "왜 쓰나" 없음 | ❌ 없음 | M3 신설 필요 |
| 6. 팀원 지시 | ❌ 없음 | ❌ 없음 | M2 → M1 흡수 |

→ **부재의 핵심 = 박제 깊이 부족 (framework 이름만, OJT 매뉴얼 없음) + 문서 메타/위임 프로토콜 부재**.

### 1.3 우선순위 도출

가장 큰 부재 영역 (1 PO 가 가장 두려워하는 = 즉각 효용 + vanilla CC 차별화):

1. CSO 보안·컴플라이언스 (한국 GDPR 적용)
2. CBO 재무 모델링 (3-Statement)
3. CEO 전략 (Rumelt)
4. COO 운영 (Incident playbook)
5. CPO PRD writing (8 섹션 + JTBD 인터뷰)
6. CTO Architecture (ADR + system design 5 단계)

→ **M1 Tier-1 6 개의 근거**.

## §2. v0.66 Sprint Scope

### 2.1 M0 — Ideation Continuity

| 메커니즘 | spec | 트리거 |
|---------|------|--------|
| ① working-notes 자동 누적 | 매 turn LLM 휴리스틱 선별 → 1~3 줄 entry append. `docs/{feature}/00-ideation/working-notes.md` | hook (assistant turn 끝) |
| ② Decision Record append-only | 확정 결정만 main.md Decision Record 표에 append. Owner 컬럼 필수 | 결정 키워드 감지 시 LLM 자가 |
| ③ 사용자 "체크포인트" 키워드 | "체크포인트", "여기까지 정리" → 부분 정리 + 계속 (ideation 종료 X) | 사용자 발화 |
| ④ session-start 자동 복원 | `.vais/status.json` 의 in-progress ideation 감지 → 5 줄 요약 + main.md Decision Record + working-notes 마지막 turn 표시 | session-start hook |

### 2.2 M1 — Knowledge Pack Tier-1 6 개

박제 깊이 = 부서장 OJT 매뉴얼 (4 요소 충족):
- (1) Framework 정의
- (2) 실무 운영 단계 (예: SWOT 시 stakeholder 인터뷰 N 명, 경쟁사 deep dive 항목)
- (3) 의사결정 패턴 (예: 어떤 분기에 어떤 옵션 선택)
- (4) 산출물 양식 (template + 예시)

| # | 위치 | Framework |
|---|------|----------|
| 1 | `agents/ceo/knowledge/rumelt-strategy-kernel.md` | Diagnosis-Guiding Policy-Coherent Actions 인과 사슬, self-deception 위험 체크 |
| 2 | `agents/cpo/knowledge/prd-writing-ojt.md` | PRD 8 섹션 + JTBD 인터뷰 스크립트 + 작성 순서 |
| 3 | `agents/cto/knowledge/architecture-decision.md` | System design 5 단계 (요구사항 → 제약 → 옵션 → trade-off → ADR), ADR 양식 |
| 4 | `agents/cso/knowledge/owasp-gdpr-korea.md` | OWASP Top 10 코드 매핑 + GDPR 한국 PIPA 적용 + 실무 체크리스트 |
| 5 | `agents/cbo/knowledge/financial-modeler-3statement.md` | I/S + B/S + C/F 수식, CAC/LTV 계산, payback 시뮬레이션 |
| 6 | `agents/coo/knowledge/incident-playbook.md` | Sev 1~4 + SLA + 알림 트리, 커뮤니케이션 템플릿 |

### 2.3 자기 적용 (self-application) 순서

1. M0 (인프라) 박힘 → 이번 ideation 박제가 M0 의 첫 dogfood 검증 (이미 완료)
2. M1 6 개 박제 진행 — 각 박제 작업 자체가 M0 의 working-notes 누적 대상
3. dogfood: 다음 vais-code 피처 시작 시 M1 knowledge 가 sub-agent 컨텍스트로 lazy-load 되어 차별화 입증

## §3. 사용자 페르소나

### 3.1 1 차 페르소나 — 본 사용자 (1 PO)

| 항목 | 내용 |
|------|------|
| Role | 1 인 PO, vais-code 메인테이너 + 다른 앱 개발 |
| Pain | 부서장 7 영역 모두 혼자 결정해야 — 다학제 도메인 지식 부재 |
| Job-to-be-done | "내가 부서장처럼 결정할 때 옆에 있는 도메인 친구 시뮬레이션" |
| 효용 측정 | (a) 결정 시간 단축 (b) 결정 정당화 깊이 (c) 3 개월 후 결정 사유 추적 가능 |

### 3.2 2 차 페르소나 — 외부 1 PO/founder (v0.67 Target-app Bootstrap 부분 후)

| 항목 | 내용 |
|------|------|
| Role | 자기 앱 개발 중인 1 PO/founder |
| Pain | Claude Code 셋업·CLAUDE.md 작성·convention 정의 부담 + 부서장 매뉴얼 부재 |
| Job-to-be-done | "vais-code 가 내 앱의 메타 매니저 역할 — CLAUDE.md/conventions/agent 자동 부트스트랩" |
| 효용 측정 | (a) 셋업 시간 < 5 분 (b) Knowledge Pack 즉시 사용 가능 |

### 3.3 3 차 페르소나 — 팀/기업 (v0.70+)

knowledge pack distribution + audit trail. 본 sprint 범위 외.

## §4. 성공 기준 (Acceptance Criteria)

### 4.1 M0 (Ideation Continuity)

| ID | 기준 | 검증 방법 |
|----|------|----------|
| AC-M0-1 | 세션 종료 후 새 세션에서 5 분 내 컨텍스트 회복 | dogfood: 본 ideation 후 다음 세션에서 재개 시간 측정 |
| AC-M0-2 | commit 시 in-progress ideation 자동 박제 | hook 동작 확인 |
| AC-M0-3 | 사용자 명시 부담 0 (working-notes append 자동) | 사용자 발화 0 회로 working-notes 누적 검증 |
| AC-M0-4 | "체크포인트" 키워드 인식 — 부분 정리 + 계속 | 키워드 발화 시 동작 검증 |
| AC-M0-5 | session-start 자동 복원 — in-progress 감지 + 5 줄 요약 | hook 동작 확인 |

### 4.2 M1 (Knowledge Pack Tier-1)

| ID | 기준 | 검증 방법 |
|----|------|----------|
| AC-M1-1 | 6 개 framework 모두 OJT 깊이 4 요소 (framework/실무단계/의사결정패턴/산출물양식) 충족 | review checklist + 다른 C-Level 의 cross-review |
| AC-M1-2 | dogfood 시 vanilla CC plan 대비 차별화 입증 — 동일 질문 vais vs vanilla 답변 비교 | A/B 테스트 1 회 |
| AC-M1-3 | knowledge lazy-load 동작 — sub-agent 위임 시 자동 컨텍스트 주입 | dogfood 1 피처 |
| AC-M1-4 | 박제 분량 = 각 framework 3000~5000 자 (너무 짧으면 OJT 깊이 부족, 너무 길면 lazy-load 부담) | 분량 측정 |

### 4.3 v0.66 전체

| ID | 기준 |
|----|------|
| AC-v0.66-1 | M0 + M1 모두 박제 완료 + dogfood 1 회 검증 |
| AC-v0.66-2 | 본 ideation 의 작업 자체가 dogfood 사례 — main.md/working-notes 박제 → 다음 세션 회복 1 회 입증 |
| AC-v0.66-3 | CHANGELOG.md 에 v0.66 entry — M0 + M1 spec 명시 |
| AC-v0.66-4 | CLAUDE.md 정체성 1 줄 추가 ("부서장 매뉴얼 organization-in-a-box") — 내부 alignment |

## §5. 리스크 + 완성도 자가 점검

### 5.1 리스크

| ID | 리스크 | 완화책 |
|----|--------|--------|
| R-1 | M1 6 개 박제 시 사용자 시간 부족 — Tier-1 만 해도 큰 분량 | scope 좁힘: 1 framework 당 3000~5000 자 (over-engineering 방지) |
| R-2 | M0 hook 구현 복잡도 — assistant turn 후 LLM 호출 hook 신설 필요 | 기존 hook 패턴 참고 (`hooks/session-start.js`, `hooks/design-mcp-trigger.js`) |
| R-3 | 정체성 "부서장 매뉴얼" 이 너무 한국적 — 글로벌 OSS 메시지 retraction | 점진적 (Q3 답): 내부 즉시, 대외 v0.67 후 |
| R-4 | dogfood 검증 편향 — 본 사용자가 만들고 본 사용자가 검증 → 객관성 부족 | v0.67 Target-app Bootstrap 후 외부 사용자 유입 → 검증 |
| R-5 | M1 콘텐츠 박제 자체가 LLM-generated 일 위험 — vanilla CC 와 차별화 약함 | 박제 시 사용자 (도메인 전문가가 아닌 부서장 관점) review 1 회 의무 |

### 5.2 완성도 자가 점검 (CPO Plan Gate)

| 항목 | 충족 |
|------|------|
| 기회 분석 | ✅ §1 7 영역 매핑 + 부재 갭 |
| 범위 (M0+M1) | ✅ §2 spec 상세 |
| 페르소나 | ✅ §3 3 단계 (1 차 본인, 2 차 외부, 3 차 팀/기업) |
| 성공 기준 | ✅ §4 13 AC |
| 리스크 | ✅ §5 5 R |

→ **5/5 = 100% Plan 완성도**. PRD (Do phase) 진입 가능.

## §6. PRD 진입을 위한 prd-writer 컨텍스트

prd-writer 호출 시 전달할 컨텍스트:
- 본 plan-rationale.md (전체)
- ideation main.md (Decision Record 13 entries)
- ideation working-notes.md (turn 1~9 흐름)
- v0.66 sprint scope = M0 + M1 Tier-1 6 개
- 페르소나 1 차 + 2 차 (3 차 보류)
- 성공 기준 13 AC
- 리스크 5 R + 완화책

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-09 | 초기 작성 — CEO ideation 후 CPO plan rationale. 6 섹션 (기회/범위/페르소나/성공기준/리스크/PRD 컨텍스트) 100% 완성도 |
