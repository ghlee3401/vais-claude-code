---
owner: cpo
agent: prd-writer
artifact: prd
phase: do
feature: vais-positioning-rethink
generated: 2026-05-09
summary: "vais-code 정체성을 '부서장 매뉴얼(organization-in-a-box)'로 재정의하고 v0.66 sprint scope(M0 Ideation Continuity + M1 Knowledge Pack Tier-1 6개)를 spec화하는 내부 메타-피처 PRD. CTO 핸드오프용 기술 제약 섹션 포함."
---

# PRD — vais-positioning-rethink (v0.66)

> organization-in-a-box: 1 PO 가 부서장 역할을 할 때 부족한 모든 도메인 지식·운영 매뉴얼·의사결정 패턴의 박제

---

## 1. Summary

vais-code 의 정체성을 *"부서장 매뉴얼 (organization-in-a-box)"* 으로 재정의하고, v0.66 sprint scope 를 **M0 (Ideation Continuity)** 와 **M1 (Knowledge Pack Tier-1 6개)** 으로 spec화한다. M0 는 ideation 컨텍스트 자동 박제 인프라(4 메커니즘)이며, M1 은 1 PO 가 부서장 역할 시 가장 부재한 6개 다학제 도메인 OJT 매뉴얼의 박제다.

핵심 비즈니스 목표: vanilla Claude Code 가 채울 수 없는 *다학제 도메인 지식 박제* 를 통해 1인 PO 가 부서장 7 영역(기획/운영/전략/PM/문서/팀원지시/개발)을 혼자 결정·산출·검증할 수 있도록 하는 것.

---

## 2. Contacts

| 이름 | 역할 | 담당 영역 |
|------|------|---------|
| 본 사용자 (ghlee0304) | PO + Maintainer | 제품 방향 결정, dogfood 검증 |
| CEO agent | 전략 라우팅 + ideation | 7 차원 알고리즘, M0 메커니즘 설계 |
| CPO agent | 제품 기획 | PRD, backlog, 페르소나 정의 |
| CTO agent | 기술 구현 | M0 hook 구현, M1 knowledge 파일 박제, lazy-load 메커니즘 |

---

## 3. Background

### 이니셔티브 컨텍스트

vais-code 는 원래 "1 PO 하네스 시스템" 으로 출발했다. 6 C-Level + 47 sub-agent + MCP server 가 추가되며 규모가 커졌지만, 정작 가장 핵심적인 가치 — *1 PO 가 부서장 역할을 할 때 필요한 다학제 도메인 지식의 박제* — 는 framework 이름 수준으로만 박제되어 있었다.

### 왜 지금인가?

2026-05-09 사용자 발화 (ideation turn 5):

> "내가 만약에 부서를 맡았을 때 프로젝트의 A 부터 Z 까지를 기획을 해야돼. 운영은 어떻게 하고 전략은 어떻게 세우고 프로젝트 관리는 어떻게 하고 [...] 그 다음에 문서는 어떻게 작성을 하고 팀원들한테는 어떻게 지시하고, 개발은 어떻게 하고 등등 이렇게 구체적으로 가는거지."

동시에 세 가지 압박이 수렴:
1. **CC native 진화 압박**: Claude Code 의 plan/review/parallel 기능 고도화 → 코드 영역 중복 심화
2. **doc 과다 우려**: 템플릿 의존·문서 비대화 → 사용자 부담
3. **M0 부재 노출**: ideation 컨텍스트가 세션 간 휘발 → 장기 프로젝트 진행 불가

### 최근 가능해진 것

- v0.65 Wisdom Split 패턴: `agents/{c-level}/knowledge/` lazy-load 구조가 이미 설계됨
- 기존 `hooks/session-start.js`, `hooks/design-mcp-trigger.js` 패턴: 새 hook 신설 레퍼런스 확보
- 이번 ideation 자체 박제(working-notes + Decision Record): M0 의 첫 self-application 검증 이미 완료

---

## 4. Objective

### 목표

vais-code 를 "부서장 매뉴얼 (organization-in-a-box)" 로 재정의하고, M0 인프라 + M1 Tier-1 6개 지식 박제를 통해 **1인 PO 가 dogfood 으로 차별화를 체감** 할 수 있는 수준에 도달한다.

### 왜 중요한가?

- **회사(프로젝트)**: vais-code 의 정체성 혼란 해소 → CC native 와 차별화 축 재정렬 → 불필요한 ceremony 감소
- **사용자(1 PO)**: 부서장 7 영역의 의사결정 시 즉각 도메인 컨텍스트 접근 → 결정 속도 + 정당화 깊이 향상
- **비전 정렬**: "1 PO 가 부서장처럼 운영" = vais-code 창립 의도의 원형 복귀

### 비전/전략 정렬

CEO ideation 결정 (2026-05-09): *"vais-code = 혼자서 부서장 역할을 할 때 부족한 모든 도메인 지식·운영 매뉴얼·의사결정 패턴을 박제한 organization-in-a-box."* — 본 PRD 는 이 정체성의 첫 구체 실행.

### Key Results (SMART OKR)

```
Objective: v0.66 sprint 내에서 "부서장 매뉴얼" 정체성의 실질적 가치를 dogfood 으로 검증한다.

KR1: M0 4 메커니즘 모두 구현 완료 — 세션 종료 후 새 세션에서 5분 내 ideation 컨텍스트 회복 1회 입증
KR2: M1 Tier-1 6개 knowledge 파일 박제 완료 — 각 파일 3000~5000자 + OJT 4요소 충족
KR3: dogfood A/B 검증 1회 — 동일 질문에 대해 vais vs vanilla CC 답변 비교, 차별화 확인
KR4: CLAUDE.md 정체성 1줄 추가 ("부서장 매뉴얼 organization-in-a-box") — 내부 alignment
KR5: CHANGELOG.md v0.66 entry — M0 + M1 spec 명시 완료
```

---

## 5. Market Segment(s)

### 누구를 위해 만드는가?

#### 1차 세그먼트 — "혼자서 부서장 역할을 하는 PO" (본 사용자, dogfood 우선)

| 항목 | 내용 |
|------|------|
| Job-to-be-done | "부서장처럼 결정할 때 옆에 있는 다학제 도메인 친구 시뮬레이션이 필요하다" |
| 상황 | 1인 PO 로서 전략/기획/운영/개발/보안/재무를 모두 결정해야 하는 순간 |
| 동기 | 각 영역에서 "이게 맞나?" 라는 불확실성을 domain-grounded 결정으로 대체하고 싶다 |
| 기대 결과 | 결정 시간 단축 + 3개월 후 결정 사유 추적 가능 + vanilla CC 대비 depth 있는 답변 |

#### 2차 세그먼트 — "자기 앱을 개발 중인 외부 1 PO/founder" (v0.67 Target-app Bootstrap 후)

| 항목 | 내용 |
|------|------|
| Job-to-be-done | "vais-code 가 내 앱의 메타 매니저 역할 — CLAUDE.md/conventions/agent 자동 부트스트랩" |
| 진입 시점 | v0.67 `/vais init {target-app}` 출시 후 |
| 주요 pain | CC 셋업 부담 + Knowledge Pack 부재 |

#### 3차 세그먼트 — 팀/기업 (v0.70+, 본 sprint 범위 외)

Knowledge pack distribution + audit trail 이 필요한 조직. 본 v0.66 scope 외.

### 제약

- vais-code 는 OSS 내부 도구 — TAM/SAM/SOM 분석 의미 약함
- "부서장 매뉴얼" 어휘는 한국 기업 문화적 — 글로벌 메시지화는 v0.67 dogfood 검증 후
- v0.66 범위: 1차 세그먼트(dogfood) 만 타깃. 외부 배포/마케팅 없음

---

## 6. Value Proposition(s)

### 어떤 고객 Job 을 해결하는가?

**Job Story (JTBD 포맷)**:
```
When 1인 PO 로서 부서장 7영역(전략/기획/운영/PM/문서/팀원지시/개발) 중 하나를 결정해야 할 때,
I want to 해당 도메인에 정통한 친구(CSO/CPO/CTO/CBO/COO/CEO)의 OJT 매뉴얼 수준 조언을 받고 싶다,
So I can 도메인 지식 부재로 인한 결정 지연 없이 부서장 수준의 의사결정·산출·검증을 혼자 수행할 수 있다.
```

### Gains (고객이 얻는 것)

- **즉각적 도메인 컨텍스트**: 전략 결정 시 Rumelt Kernel, 보안 검토 시 OWASP+GDPR, 재무 시뮬레이션 시 3-Statement — 모두 lazy-load 로 자동 주입
- **결정 추적성**: M0 working-notes/Decision Record → 3개월 후에도 "왜 이렇게 결정했나" 추적 가능
- **컨텍스트 지속성**: 세션 끊겨도 5분 내 회복 — 장기 프로젝트 진행 가능
- **OJT 깊이**: framework 이름이 아닌 실무 운영 단계 + 의사결정 패턴 + 산출물 양식 4요소

### Pains (피하게 되는 것)

- 도메인 전문가 부재로 인한 의사결정 지연·불확실성
- framework 이름만 알고 실무 적용 방법 모르는 상태
- ideation 세션 간 컨텍스트 휘발 → 재작업
- vanilla CC 와 vais-code 차별점 불명확 → 도구 전환 유혹

### 경쟁사 대비 차별화

| 도구 | 코드 영역 | 비-코드 부서장 영역 | OJT 깊이 | vais 차별화 |
|------|---------|-------------------|---------|------------|
| vanilla Claude Code | plan/review/parallel ✅ | X | X | 비-코드 6 영역 + OJT 깊이 |
| Cursor / Continue.dev | IDE 통합 ✅ | X | X | 도메인 지식 박제 |
| CC marketplace plugins | 단일 기능 (review 등) | X | X | C-Suite 조직 시뮬레이션 |
| **vais-code (v0.66+)** | CC 양보 (CTO 슬림화 예정) | 6 C-Level 매핑 ✅ | OJT 4요소 ✅ | — |

**핵심 차별화 축**: vanilla CC 가 절대 못 박는 *비-코드 부서장 영역의 OJT 매뉴얼 깊이*

---

## 7. Solution

### 7.1 명령어 흐름 (CLI UX, wireframe 대체)

vais-code 는 CLI 기반이므로 wireframe 대신 명령어·응답 흐름으로 UX 를 정의한다.

#### M0 흐름 — Ideation Continuity

```
[Session A]
사용자: /vais ceo {feature}
  → CEO: ideation 모드 시작
  → (매 turn) hook: working-notes.md 자동 append (LLM 휴리스틱)
  → (결정 확정 시) CEO: Decision Record append
  → (사용자 발화 "체크포인트") → 부분 정리 출력 + ideation 계속
  → commit → .vais/status.json 갱신 (phase: ideation, in-progress: true)

[Session B — 재개]
  → session-start hook 실행
  → .vais/status.json 에서 in-progress ideation 감지
  → main.md Decision Record + working-notes 마지막 turn 표시 (5줄 요약)
  → "이전 ideation 계속하시겠습니까?" [AskUserQuestion]
  → 승인 → 컨텍스트 회복 완료 (목표: 5분 내)
```

#### M1 흐름 — Knowledge Pack lazy-load

```
사용자: /vais cto plan {feature}
  → CEO: 7차원 알고리즘 → activeCLevel = CTO
  → CTO: plan phase 시작
  → knowledge lazy-load: agents/cto/knowledge/architecture-decision.md 주입
  → CTO: system design 5단계 기반 Plan 산출 (ADR 포함)
  → [AskUserQuestion] 승인 → docs/{feature}/01-plan/ 박제

사용자: /vais cso {feature} (보안 검토)
  → CSO: agents/cso/knowledge/owasp-gdpr-korea.md lazy-load
  → OWASP Top 10 + 한국 PIPA 체크리스트 기반 security audit
```

#### M0 + M1 통합 흐름 (self-application)

```
이번 ideation 자체가 M0 의 첫 dogfood:
  turn 1~9 → working-notes.md 자동 누적 ✅ (이미 완료)
  Decision Record 13 entries 박제 ✅ (이미 완료)
  다음 세션에서 5분 내 회복 가능 여부 → AC-M0-1 검증
```

### 7.2 Key Features

#### Feature 1: M0-① working-notes 자동 누적

**설명**: 매 ideation turn 종료 후 LLM 이 휴리스틱으로 기록 가치 판단 → `docs/{feature}/00-ideation/working-notes.md` 에 1~3줄 자동 append.

**수용 기준**:
- Given 결정이 내려진 turn, When turn 완료 시, Then 1~3줄 + Decision Record 동시 append
- Given 새 정보·관점이 등장한 turn, When turn 완료 시, Then 1~3줄 append
- Given 단순 확인 turn ("OK", "그래"), When turn 완료 시, Then skip (append 없음)
- Given 사용자 발화 0회, When working-notes 확인 시, Then 자동 누적 되어 있음 (AC-M0-3)

**우선순위**: Must Have

**구현 위치**: `hooks/` 신규 hook (assistant turn post-processing)

---

#### Feature 2: M0-② Decision Record append-only

**설명**: ideation 중 확정 결정이 내려지면 `main.md` 의 Decision Record 표에 자동 append. Owner 컬럼 필수. 기존 행 수정 불가.

**수용 기준**:
- Given 결정 확정 키워드 감지, When LLM 이 결정 감지 시, Then Date/Decision/Owner/Source 4컬럼 채워 append
- Given 기존 Decision Record, When append 발생 시, Then 기존 행 변경 없음 (append-only)
- Given owner = "CEO (ideation)", When 박제 시, Then Owner 컬럼 명시

**우선순위**: Must Have

---

#### Feature 3: M0-③ 체크포인트 키워드 인식

**설명**: 사용자가 "체크포인트" 또는 "여기까지 정리" 발화 시 → ideation 종료 없이 부분 정리 출력 후 계속.

**수용 기준**:
- Given 사용자 발화에 "체크포인트" 포함, When 발화 감지 시, Then 현재까지 Decision Record + working-notes 요약 출력
- Given 정리 출력 후, When 사용자 계속 발화 시, Then ideation 세션 그대로 유지 (종료 X)
- Given 부분 정리, When 출력 시, Then 5줄 이내 압축 요약

**우선순위**: Should Have

---

#### Feature 4: M0-④ session-start 자동 복원

**설명**: `session-start` hook 이 `.vais/status.json` 에서 `in-progress ideation` 감지 → 5줄 요약 + 마지막 turn 표시 + "계속하시겠습니까?" AskUserQuestion.

**수용 기준**:
- Given `.vais/status.json` 의 `phase: ideation, in-progress: true`, When 새 세션 시작 시, Then 5줄 요약 자동 표시
- Given 이전 working-notes, When 복원 시, Then 마지막 turn 포함
- Given 이전 Decision Record, When 복원 시, Then 마지막 3개 결정 표시
- Given 복원 완료, When 사용자 확인 시, Then ideation 재개까지 5분 내 (AC-M0-1)

**우선순위**: Must Have

**구현 위치**: `hooks/session-start.js` 확장 or 신규 `hooks/ideation-restore.js`

---

#### Feature 5: M1 Knowledge Pack 박제 — CEO Rumelt Strategy Kernel

**설명**: `agents/ceo/knowledge/rumelt-strategy-kernel.md` 박제. Diagnosis-Guiding Policy-Coherent Actions 인과 사슬, self-deception 위험 체크, 실무 워크숍 단계, ADR-style 전략 결정 양식.

**수용 기준**:
- Given 파일 존재 확인, When 분량 측정 시, Then 3000~5000자 (AC-M1-4)
- Given OJT 4요소 체크리스트 적용: (1)Framework 정의 (2)실무 운영 단계 (3)의사결정 패턴 (4)산출물 양식, When review 시, Then 4/4 충족 (AC-M1-1)
- Given CEO agent 전략 질문 처리 시, When knowledge lazy-load 발동 시, Then Rumelt Kernel 컨텍스트 주입 확인 (AC-M1-3)

**우선순위**: Must Have

---

#### Feature 6: M1 Knowledge Pack 박제 — CPO PRD Writing OJT

**설명**: `agents/cpo/knowledge/prd-writing-ojt.md` 박제. PRD 8섹션 작성 OJT + JTBD 인터뷰 스크립트 + 작성 순서 + 섹션별 흔한 실수.

**수용 기준**:
- Given OJT 4요소: PRD 8섹션 구조(framework) + 각 섹션 작성 순서(실무단계) + "이 섹션에서 흔히 빠지는 것"(의사결정패턴) + 섹션별 작성 예시(산출물양식), When review 시, Then 4/4 충족
- Given 분량, When 측정 시, Then 3000~5000자
- Given prd-writer sub-agent 호출, When knowledge lazy-load 발동 시, Then 컨텍스트 주입 확인

**우선순위**: Must Have

---

#### Feature 7: M1 Knowledge Pack 박제 — CTO Architecture Decision

**설명**: `agents/cto/knowledge/architecture-decision.md` 박제. System design 5단계(요구사항→제약→옵션→trade-off→ADR) + ADR 양식 + 흔한 실수.

**수용 기준**:
- Given OJT 4요소: 5단계 체계(framework) + 각 단계 실무 절차(실무단계) + "이 단계에서 결정 분기"(의사결정패턴) + ADR 양식(산출물양식), When review 시, Then 4/4 충족
- Given 분량, When 측정 시, Then 3000~5000자
- Given CTO 아키텍처 질문, When lazy-load 발동 시, Then 5단계 컨텍스트 주입 확인

**우선순위**: Must Have

---

#### Feature 8: M1 Knowledge Pack 박제 — CSO OWASP+GDPR Korea

**설명**: `agents/cso/knowledge/owasp-gdpr-korea.md` 박제. OWASP Top 10 코드 매핑 + 한국 PIPA(개인정보보호법) 적용 차이 + 실무 보안 체크리스트.

**수용 기준**:
- Given OJT 4요소: OWASP+PIPA 구조(framework) + 코드 레벨 매핑 절차(실무단계) + "이 취약점은 이 패턴에서 결정"(의사결정패턴) + 체크리스트 양식(산출물양식), When review 시, Then 4/4 충족
- Given 분량, When 측정 시, Then 3000~5000자
- Given CSO 보안 감사 호출, When lazy-load 발동 시, Then OWASP+PIPA 체크리스트 주입 확인

**우선순위**: Must Have

---

#### Feature 9: M1 Knowledge Pack 박제 — CBO Financial Modeler 3-Statement

**설명**: `agents/cbo/knowledge/financial-modeler-3statement.md` 박제. I/S + B/S + C/F 수식 + CAC/LTV 계산 + payback 시뮬레이션 + SaaS metrics.

**수용 기준**:
- Given OJT 4요소: 3-Statement 구조(framework) + 수식·계산 절차(실무단계) + "이 지표에서 이 결정 분기"(의사결정패턴) + 시뮬레이션 템플릿(산출물양식), When review 시, Then 4/4 충족
- Given 분량, When 측정 시, Then 3000~5000자
- Given CBO 재무 질문, When lazy-load 발동 시, Then 3-Statement 컨텍스트 주입 확인

**우선순위**: Must Have

---

#### Feature 10: M1 Knowledge Pack 박제 — COO Incident Playbook

**설명**: `agents/coo/knowledge/incident-playbook.md` 박제. Sev 1~4 분류 기준 + SLA 테이블 + 알림 트리 + 커뮤니케이션 템플릿 + post-mortem 양식.

**수용 기준**:
- Given OJT 4요소: Sev 분류 체계(framework) + 대응 절차(실무단계) + "이 Sev 에서 이 결정"(의사결정패턴) + 커뮤니케이션 템플릿(산출물양식), When review 시, Then 4/4 충족
- Given 분량, When 측정 시, Then 3000~5000자
- Given COO 인시던트 대응 호출, When lazy-load 발동 시, Then Incident Playbook 컨텍스트 주입 확인

**우선순위**: Must Have

---

#### Feature 11: CLAUDE.md 정체성 1줄 추가

**설명**: `CLAUDE.md` 의 "What This Project Is" 섹션에 "부서장 매뉴얼 (organization-in-a-box)" 정체성 1줄 추가. 내부 alignment 용. README/AGENTS.md 는 v0.67 dogfood 검증 후.

**수용 기준**:
- Given CLAUDE.md 수정 후, When 파일 확인 시, Then "organization-in-a-box" 문구 포함
- Given 수정 범위, When 확인 시, Then README/AGENTS.md 변경 없음 (Q3 결정 준수)

**우선순위**: Must Have

---

#### Feature 12: CHANGELOG.md v0.66 entry

**설명**: SemVer + Keep a Changelog 형식으로 v0.66 entry 작성. M0 4메커니즘 + M1 6개 knowledge 파일 내역 명시.

**수용 기준**:
- Given CHANGELOG.md, When v0.66 entry 확인 시, Then M0 + M1 항목 모두 포함
- Given 형식, When 확인 시, Then Keep a Changelog 6섹션 형식 준수

**우선순위**: Should Have

---

### 7.3 Technology (기술 제약 + 의존성)

#### Runtime 환경

| 항목 | 요구사항 | 비고 |
|------|---------|------|
| Node.js | 18+ | hook 실행 (CJS) |
| Claude Code | 최신 버전 | sub-agent context, AskUserQuestion |
| `.vais/status.json` | 쓰기 권한 필요 | M0 상태 추적 |

#### M0 기술 제약

**Hook 신설/확장**:
- `hooks/session-start.js`: 기존 파일에 in-progress ideation 감지 로직 추가 또는 `hooks/ideation-restore.js` 신규
- Hook 등록: `hooks/hooks.json` 에 새 hook 이벤트 추가 필요
- `hooks/events.json`: ideation-related event 추가 검토

**working-notes 자동 append 메커니즘**:
- LLM 휴리스틱 기반 — assistant turn 종료 후 별도 LLM 호출 (요약·기록가치 판단)
- 토큰 비용 추정: turn당 약 130 토큰 (prompt 100 + response 30)
- 파일 쓰기: `lib/fs-utils.js` 활용 (CJS, 기존 패턴)
- 경로: `docs/{feature}/00-ideation/working-notes.md` (append mode)

**`.vais/status.json` 스키마 확장**:
```json
{
  "activeFeature": "vais-positioning-rethink",
  "phase": "ideation",
  "ideation": {
    "inProgress": true,
    "lastTurn": 9,
    "workingNotesPath": "docs/vais-positioning-rethink/00-ideation/working-notes.md",
    "mainMdPath": "docs/vais-positioning-rethink/00-ideation/main.md"
  }
}
```

#### M1 기술 제약

**knowledge lazy-load 메커니즘**:
- 위치: `agents/{c-level}/knowledge/{filename}.md`
- 로드 트리거: C-Level agent 호출 시 해당 C-Level 의 `knowledge/` 디렉토리 자동 스캔
- 현재 상태: v0.65 Wisdom Split 에서 패턴 설계됨, 실제 lazy-load 구현은 v0.66 에서 완성 필요
- `vais.config.json`: `knowledge.lazyLoad: true` 설정 확인 또는 신규 추가

**파일 크기 제약**:
- 각 knowledge 파일: 3000~5000자 목표
- 너무 짧으면 OJT 깊이 부족, 너무 길면 lazy-load 시 컨텍스트 부담
- 압축 가이드: 이론 설명보다 "이 상황에서 이렇게 하라" 절차형 문장 우선

**참조 투명성**:
- 각 knowledge 파일에 `// @see {URL}` 또는 `> Source: {reference}` 주석 — 외부 문서 기반 시
- Rumelt 인용 시: "Good Strategy Bad Strategy (Richard Rumelt)"
- OWASP 인용 시: "OWASP Top 10: https://owasp.org/Top10/"

#### 기존 인프라 활용

| 파일 | 용도 | 참조 패턴 |
|------|------|---------|
| `hooks/session-start.js` | M0-④ 기반 | 기존 패턴 확장 |
| `hooks/design-mcp-trigger.js` | M0-① hook 패턴 레퍼런스 | hook 구조 참고 |
| `lib/fs-utils.js` | 파일 append 유틸 | working-notes append |
| `lib/memory.js` | 상태 관리 | status.json 읽기/쓰기 |
| `lib/ceo-algorithm.js` | 7차원 알고리즘 | M0 hook 내 활성 피처 판단 |

---

### 7.4 Assumptions (검증 필요 가정)

| ID | 가정 | 검증 방법 | 리스크 수준 |
|----|------|---------|------------|
| H1 | 박제 깊이가 OJT 매뉴얼 수준 (4요소: framework + 실무단계 + 의사결정패턴 + 산출물양식) 이어야 vanilla CC 와 차별화 입증된다 | dogfood A/B 검증 1회 (동일 질문, vais vs vanilla CC 비교) | 높음 — 차별화의 핵심 전제 |
| H2 | M0 인프라(4 메커니즘)가 박힌 후 M1 콘텐츠 박제 시 self-application 으로 충분히 검증 가능하다 | M1 박제 작업 자체를 M0 working-notes 로 추적 → ideation 재개 1회 입증 | 중간 — 구현 완성도 의존 |
| H3 | 1차 페르소나(본 사용자) dogfood 효용이 입증되면 2차 페르소나(외부 1 PO/founder) 유입 동기가 형성된다 | v0.67 Target-app Bootstrap 후 외부 사용자 1명 이상 테스트 | 낮음 — v0.66 범위 외, v0.67에서 검증 |
| H4 | knowledge lazy-load 메커니즘이 sub-agent 위임 시 실제로 컨텍스트를 주입한다 (v0.65 Wisdom Split 패턴이 실제 동작) | AC-M1-3 dogfood 1 피처로 검증 | 높음 — 기술 구현 불확실 |
| H5 | LLM 휴리스틱 선별 (결정/새 정보 turn 만 기록, 단순 확인 skip) 이 사용자 개입 없이 충분히 정확하다 | M0-① 구현 후 working-notes 품질 확인 (10 turn 샘플) | 중간 — LLM 판단 편차 존재 |

---

## 8. Release

### 소요 기간 (상대 기간)

| 단계 | 기간 | 범위 |
|------|------|------|
| v0.66 Alpha | Week 1 | M0 4 메커니즘 구현 완료 + M1 Tier-1 3개 박제 (CEO/CPO/CTO) |
| v0.66 Beta | Week 2 | M1 나머지 3개 박제 (CSO/CBO/COO) + dogfood A/B 검증 1회 |
| v0.66 GA | Week 2 끝 | AC 13개 모두 통과 + CHANGELOG 작성 + CLAUDE.md 정체성 추가 |

### v0.66 포함 내용 vs 미래 버전

**v0.66 (본 sprint)**:
- M0: working-notes 자동 누적 + Decision Record append + 체크포인트 키워드 + session-start 복원
- M1: Tier-1 6개 knowledge 파일 (CEO/CPO/CTO/CSO/CBO/COO)
- CLAUDE.md 정체성 1줄 추가 (내부 only)
- CHANGELOG.md v0.66 entry

**v0.67** (+2주 이후):
- Target-app Bootstrap 부분: `/vais init {target-app}` → CLAUDE.md + `.claude/settings.json` + AGENTS.md 자동 생성
- README/AGENTS.md 정체성 대외화 (dogfood 검증 후)
- M2 폐기분 흡수: `agents/_shared/delegation-protocol.md` + 각 C-Level `knowledge/delegation-context.md`

**v0.68** (+4~6주):
- M3: 문서 메타-가이드 ("왜 이 문서를 쓰나") 박제
- M1 Tier-2 knowledge 박제

**v0.69** (+8~10주):
- A. CTO 슬림화 — CC native 분기점 정합 정리

**v0.70+**:
- B. Target-app 풀 Distribution (knowledge pack 내장)

**v0.71+**:
- M4. 부서장 Cadence 자동화 (일/주/월/분기)

### 릴리즈 단계

```
Alpha (Week 1):
  - M0 hook 구현 + 동작 확인
  - M1 CEO/CPO/CTO knowledge 박제
  - 기능 단위 dogfood

Beta (Week 2 전반):
  - M1 CSO/CBO/COO knowledge 박제
  - dogfood A/B 검증 (H1 검증)
  - AC 13개 중 80% 통과

GA (Week 2 후반):
  - 잔여 AC 모두 통과
  - CHANGELOG.md + CLAUDE.md 갱신
  - /vais commit → v0.66.0 태깅
```

---

## 부록 A — OKR

```
Objective: v0.66 sprint 내에서 vais-code 가 "부서장 매뉴얼" 정체성의 실질적 가치를
           1인 PO dogfood 으로 검증 가능한 수준에 도달한다.

KR1: M0 4 메커니즘 모두 구현 → 세션 종료 후 새 세션에서 5분 내 ideation 컨텍스트 회복 1회 입증
KR2: M1 Tier-1 6개 파일 박제 완료 → 각 3000~5000자 + OJT 4요소 체크리스트 6/6 통과
KR3: dogfood A/B 1회 → vais vs vanilla CC 동일 질문 비교에서 차별화 주관적 확인
KR4: CLAUDE.md 에 "organization-in-a-box" 정체성 문구 반영 (내부 alignment)
KR5: CHANGELOG.md v0.66 entry 에 M0 + M1 spec 명시 완료
```

---

## 부록 B — Sprint Plan (첫 4주)

### Week 1 — M0 인프라

| Task | 담당 | 완료 기준 |
|------|------|---------|
| `.vais/status.json` 스키마 확장 (`ideation.inProgress`) | CTO | 스키마 정의 + 읽기/쓰기 동작 확인 |
| `hooks/session-start.js` 에 in-progress ideation 감지 로직 추가 | CTO | 새 세션에서 5줄 요약 표시 확인 |
| working-notes 자동 append hook 구현 | CTO | 10 turn 테스트 → LLM 휴리스틱 품질 확인 |
| Decision Record 자동 append 로직 구현 | CTO | 결정 키워드 감지 → append 동작 확인 |
| "체크포인트" 키워드 감지 구현 | CTO | 발화 시 부분 정리 출력 + 세션 유지 확인 |
| M1 CEO knowledge 박제: `rumelt-strategy-kernel.md` | CEO/CTO | 4요소 체크리스트 통과 + 분량 측정 |
| M1 CPO knowledge 박제: `prd-writing-ojt.md` | CPO/CTO | 4요소 체크리스트 통과 + 분량 측정 |
| M1 CTO knowledge 박제: `architecture-decision.md` | CTO | 4요소 체크리스트 통과 + 분량 측정 |

### Week 2 전반 — M1 나머지 3개 + 검증

| Task | 담당 | 완료 기준 |
|------|------|---------|
| M1 CSO knowledge 박제: `owasp-gdpr-korea.md` | CSO/CTO | 4요소 체크리스트 통과 + 분량 측정 |
| M1 CBO knowledge 박제: `financial-modeler-3statement.md` | CBO/CTO | 4요소 체크리스트 통과 + 분량 측정 |
| M1 COO knowledge 박제: `incident-playbook.md` | COO/CTO | 4요소 체크리스트 통과 + 분량 측정 |
| knowledge lazy-load 동작 검증 | CTO | dogfood 1 피처 — 컨텍스트 주입 확인 (AC-M1-3) |
| dogfood A/B 검증 | PO | 동일 질문 vais vs vanilla CC 비교 (KR3) |

### Week 2 후반 — GA 준비

| Task | 담당 | 완료 기준 |
|------|------|---------|
| CLAUDE.md 정체성 1줄 추가 | CTO | "organization-in-a-box" 문구 + README 변경 없음 확인 |
| CHANGELOG.md v0.66 entry | COO/CTO | M0 + M1 항목 포함 + Keep a Changelog 형식 |
| AC 13개 최종 점검 | PO | 전체 통과 확인 |
| `/vais commit` → v0.66.0 | COO | git tag + changelog |

---

## 부록 C — Pre-mortem (리스크 분석)

"v0.66 sprint 가 4주 후 실패했다면, 가장 큰 이유는 무엇인가?"

| ID | 리스크 | 가능성 | 영향 | 완화 전략 |
|----|--------|--------|------|---------|
| R-1 | M1 6개 박제 분량이 사용자 시간 부족으로 미완성 | 상 | 상 | Scope 좁힘: 1 framework당 3000~5000자 hard limit. 초과 시 잘라냄. week 1에 3개, week 2에 3개로 분할 |
| R-2 | M0 hook 구현 복잡도 — assistant turn 후 LLM 호출 hook 신설 어려움 | 중 | 상 | 기존 `hooks/session-start.js` + `hooks/design-mcp-trigger.js` 패턴 그대로 복제. 완전 자동화 실패 시 "수동 체크포인트" fallback (M0-③만 유지) |
| R-3 | knowledge lazy-load 미구현 — H4 가정이 틀림 (v0.65 Wisdom Split 이 실제 동작 안 함) | 중 | 상 | 우선 파일 박제 자체 완료. lazy-load 실패 시 manual include 지시 (`@include agents/cto/knowledge/architecture-decision.md`) fallback |
| R-4 | dogfood 검증 편향 — 1 PO 자신이 만들고 검증 → 객관성 부족 | 상 | 중 | v0.67 외부 사용자 1명 확보 계획. v0.66 은 "주관적 확인" 수준으로 기준 낮춤 (H1 검증 기준 완화) |
| R-5 | M1 콘텐츠가 LLM-generated 수준 — vanilla CC 와 차별화 약함 | 중 | 상 | 박제 시 사용자 (도메인 PO 관점) review 1회 의무. "이 단계에서 내가 막혔던 실제 경험" 삽입 요청 |

---

## 부록 D — Stakeholder Map

| 이해관계자 | 관심사 | 영향력 | 참여 수준 |
|---------|------|--------|---------|
| 본 사용자 (ghlee0304) | 부서장 7영역 의사결정 효율화, dogfood 즉각 효용 | 상 | 승인 (모든 결정) |
| CEO agent | 7차원 알고리즘 정확도, ideation 컨텍스트 보존 | 상 | 협의 (M0 메커니즘 설계) |
| CPO agent | PRD 품질, M1 CPO knowledge 깊이 | 중 | 협의 (knowledge 박제 review) |
| CTO agent | Hook 구현 가능성, lazy-load 메커니즘 | 상 | 실행 (기술 구현 전담) |
| Claude Code 사용자 커뮤니티 | 도구 차별화, OSS 기여 가치 | 하 | 정보 제공 (v0.67 이후) |
| Anthropic (CC native 진화 팀) | CC native 기능과의 중복 여부 | 하 | 모니터링 (vais 정체성 차별화 추적) |

---

## 부록 E — User Stories

### M0 Stories

```
As a 1인 PO (본 사용자),
I want to 세션이 끊겨도 ideation 내용을 잃지 않고,
So that 다음 세션에서 5분 내에 컨텍스트를 회복하고 계속 진행할 수 있다.

Acceptance Criteria:
- Given 세션 종료 전 working-notes 자동 누적됨,
  When 새 세션 시작 시,
  Then session-start hook 이 5줄 요약을 자동 표시한다.

- Given 사용자가 "체크포인트" 발화,
  When 감지 시,
  Then 현재까지의 Decision Record + working-notes 요약을 출력하고 ideation 을 종료하지 않는다.
```

```
As a 1인 PO,
I want to ideation 중 결정이 내려질 때 자동으로 Decision Record 에 기록되고,
So that 3개월 후에도 "왜 이 결정을 내렸나" 를 추적할 수 있다.

Acceptance Criteria:
- Given 결정 확정 키워드 감지,
  When 기록 시,
  Then Date/Decision/Owner/Source 4컬럼 형식으로 main.md 에 append 된다.
- Given 기존 Decision Record,
  When 새 행 추가 시,
  Then 기존 행은 변경되지 않는다 (append-only).
```

### M1 Stories

```
As a 1인 PO,
I want to CTO 에게 아키텍처 결정을 요청할 때 System Design 5단계 + ADR 기반의 답변을 받고,
So that "이 결정이 왜 맞는가" 를 ADR 형식으로 문서화할 수 있다.

Acceptance Criteria:
- Given CTO 아키텍처 질문,
  When agents/cto/knowledge/architecture-decision.md 가 lazy-load 되면,
  Then 5단계 체계 + ADR 양식 기반 답변이 나온다.
- Given 답변,
  When vanilla CC 답변과 비교 시,
  Then ADR 구조 + trade-off 명시 여부에서 차별화가 확인된다.
```

```
As a 1인 PO,
I want to CSO 보안 감사 요청 시 OWASP Top 10 + 한국 PIPA 체크리스트 기반 리뷰를 받고,
So that 한국 서비스 개발 시 법적 컴플라이언스 누락 없이 보안 점검을 완료할 수 있다.

Acceptance Criteria:
- Given CSO 보안 감사 호출,
  When agents/cso/knowledge/owasp-gdpr-korea.md lazy-load 시,
  Then OWASP Top 10 + PIPA 항목 모두 포함한 체크리스트 출력.
```

---

## 부록 F — Job Stories (JTBD)

```
When 전략 방향을 결정해야 하는데 Rumelt 방식을 모를 때,
I want to CEO agent 에게 물어보면 Diagnosis-Guiding Policy-Coherent Actions 인과 사슬로 분석해주기를,
So I can 전략 결정의 논리적 근거를 갖추고 stakeholder 에게 설명할 수 있다.
```

```
When 재무 모델이 없어서 투자 타당성을 판단 못 할 때,
I want to CBO agent 가 3-Statement + CAC/LTV payback 시뮬레이션을 자동으로 만들어주기를,
So I can 숫자 기반으로 "이 피처에 시간을 쓸 가치가 있나" 를 판단할 수 있다.
```

```
When 인시던트 발생 시 어떻게 대응해야 할지 모를 때,
I want to COO agent 가 Sev 분류 + 알림 트리 + 커뮤니케이션 템플릿을 즉시 제공해주기를,
So I can 혼자서도 부서장 수준의 인시던트 대응을 할 수 있다.
```

```
When ideation 세션이 길어져 중간에 끊어야 할 때,
I want to 아무 것도 안 해도 context 가 자동으로 보존되기를,
So I can 다음 세션에서 5분 내에 다시 이어서 진행할 수 있다.
```

---

## 부록 G — MoSCoW Prioritization

| 피처 | 분류 | 이유 |
|------|------|------|
| M0-① working-notes 자동 누적 | Must Have | 컨텍스트 보존의 핵심. 없으면 M0 목표 달성 불가 |
| M0-② Decision Record append-only | Must Have | 결정 추적성의 핵심. 없으면 M0 목표 달성 불가 |
| M0-④ session-start 자동 복원 | Must Have | AC-M0-1 (5분 회복) 의 인프라. M0 의 가장 가시적 가치 |
| M1 CEO Rumelt Strategy Kernel | Must Have | 전략 결정 = 1 PO 가 가장 자주 부재. 즉각 효용 + 차별화 최대 |
| M1 CPO PRD Writing OJT | Must Have | PO 가 매주 1+회 사용. self-referential 검증 가능 (본 PRD 자체가 dogfood) |
| M1 CTO Architecture Decision | Must Have | 비싼 결정. vanilla CC 대비 ADR 구조 차별화 명확 |
| M1 CSO OWASP+GDPR Korea | Must Have | 한국 서비스 개발 시 필수. 1 PO 가 가장 두려워하는 영역 |
| M1 CBO Financial Modeler | Must Have | 재무 판단 = 1 PO 부재 영역 No.1. dogfood 효용 최고 |
| M1 COO Incident Playbook | Must Have | 운영 부서장 매뉴얼 핵심. 위기 시 즉각 가치 |
| CLAUDE.md 정체성 1줄 추가 | Must Have | 내부 alignment. v0.66 정체성 선언 |
| M0-③ 체크포인트 키워드 | Should Have | UX 개선. M0-①+②+④ 로 기본 보장되면 우선순위 낮춤 가능 |
| CHANGELOG.md v0.66 entry | Should Have | 릴리즈 관리. Must 는 아니지만 v0.66 GA 기준 포함 |
| knowledge lazy-load 완전 자동화 | Could Have | v0.65 Wisdom Split 기반이나 H4 미검증. manual fallback 으로 대체 가능 |
| README/AGENTS.md 정체성 대외화 | Won't Have (v0.66) | Q3 결정: dogfood 검증 후 v0.67. 성급한 대외 메시지 retraction 비용 큼 |
| Target-app Bootstrap | Won't Have (v0.66) | Q4 결정: v0.67. M0+M1 완성 후 의미 있음 |
| M4 Cadence 자동화 | Won't Have (v0.66) | v0.71+. 지금은 지나치게 이름 |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-09 | 초기 작성 — ideation (turn 1~9) + plan-rationale (§1~§6) 기반 PRD 8섹션 + 부록 7개 (A~G) 합성. prd-writer 에이전트 산출 |
