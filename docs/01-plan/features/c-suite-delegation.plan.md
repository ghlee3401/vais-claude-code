---
feature: c-suite-delegation
status: plan
created: 2026-04-01
supersedes: vais-dev.plan.md
---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 사용자가 `/vais plan`, `/vais architect` 같은 구현 단계를 직접 호출하거나, C-레벨이 실무자를 직접 호출하는 구조로 인해 계층과 책임이 불명확하다 |
| **Solution** | 사용자는 C-레벨만 호출하고, C-레벨이 필요한 실무자를 알아서 오케스트레이션하는 완전 위임 구조로 전환한다 |
| **Functional UX Effect** | "구현해줘" → `/vais cto` 하나로 끝. CTO가 plan→design→architect→backend→frontend→qa를 사용자와 상호작용하며 진행 |
| **Core Value** | 각 C-레벨이 자신의 도메인과 실무자를 완전히 책임지는 실제 조직 구조와 동일한 위계 |

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 구현 단계 직접 호출은 C-레벨 계층 구조를 무의미하게 만듦 |
| **WHO** | vais-code 사용자 (개발자) |
| **RISK** | CTO 단일 호출로 전체 구현 플로우가 돌아가야 하므로 CTO agent 복잡도 증가 |
| **SUCCESS** | 사용자가 C-레벨 이외의 agent를 직접 호출할 필요가 없어짐 |
| **SCOPE** | agents/*.md 수정 + skills/vais/SKILL.md 정리. 실무자 agent 기능 자체는 유지 |

---

## 1. 목표 위계 구조

```
사용자
  │
  ├── /vais ceo    → CEO (전략) ──→ 다른 C-레벨에만 위임
  │                                  ├→ CTO (기술)
  │                                  ├→ CMO (마케팅)
  │                                  ├→ CFO (재무)
  │                                  ├→ CPO (제품)
  │                                  ├→ COO (운영)
  │                                  └→ CSO (보안)
  │
  ├── /vais cto    → CTO (기술) ──→ 실무자에 위임
  │                                  ├→ architect
  │                                  ├→ backend
  │                                  ├→ frontend
  │                                  ├→ qa
  │                                  └→ design
  │
  ├── /vais cmo    → CMO (마케팅) → 실무자에 위임
  │                                  └→ seo
  │
  ├── /vais cso    → CSO (보안) ──→ 실무자에 위임
  │                                  ├→ security
  │                                  └→ validate-plugin
  │
  ├── /vais cfo    → CFO (재무) ──→ 직접 수행 (실무자 없음)
  ├── /vais cpo    → CPO (제품) ──→ PM sub-agents에 위임
  └── /vais coo    → COO (운영) ──→ 직접 수행
```

**핵심 규칙:**
- CEO는 C-레벨에게만 위임. 실무자 직접 호출 금지
- 각 C-레벨은 자신의 실무자를 완전히 책임
- 실무자는 C-레벨을 통해서만 호출됨 (사용자 직접 호출 불가)

---

## 2. 요구사항

### 2.1 `/vais` 스킬 변경

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-01 | `skills/vais/SKILL.md` 액션 목록에서 `plan ~ qa`, `report`, `commit`, `test`, `next` 제거 | Must |
| FR-02 | 제거된 액션 호출 시 "CTO를 통해 실행하세요: `/vais cto {feature}`" 안내 | Should |
| FR-03 | `skills/vais/SKILL.md` description 트리거에서 구현 단계 키워드 제거 | Must |

### 2.2 CTO agent 강화

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-04 | CTO가 전체 구현 워크플로우를 직접 오케스트레이션: plan→design→architect→backend→frontend→qa | Must |
| FR-05 | 각 단계 전환 시 사용자에게 확인/질문 (AskUserQuestion) | Must |
| FR-06 | CTO가 필요 시 다른 C-레벨에 자문 요청 가능 (예: 보안 검토 → CSO 호출) | Should |

### 2.3 CEO agent 제약

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-07 | CEO가 실무자(architect/backend/frontend/qa/seo 등) 직접 호출 금지 명시 | Must |
| FR-08 | CEO는 C-레벨에게만 위임하도록 agent 지침 업데이트 | Must |

### 2.4 각 C-레벨의 실무자 소유권 명시

| C-레벨 | 소유 실무자 |
|--------|-----------|
| CTO | architect, backend, frontend, qa, design |
| CMO | seo |
| CSO | security, validate-plugin |
| CPO | pm-discovery, pm-strategy, pm-research, pm-prd |
| CFO | (없음, 직접 수행) |
| COO | (없음, 직접 수행) |

---

## 3. CTO 워크플로우 상세

사용자가 `/vais cto login` 실행 시 CTO의 진행 방식:

```
1. 요구사항 파악
   → AskUserQuestion: 기능 범위, 기술 스택, 우선순위 확인

2. Plan 단계
   → architect agent에 기획 위임 (또는 직접 수행)
   → AskUserQuestion: "기획서 검토 후 설계 단계로 넘어갈까요?"

3. Design 단계
   → design agent에 화면설계 위임
   → AskUserQuestion: "설계 완료. 아키텍처/인프라 설정으로 넘어갈까요?"

4. Architect 단계
   → architect agent에 DB/인프라 위임
   → AskUserQuestion: "인프라 설정 완료. 백엔드 구현 시작할까요?"

5. Backend + Frontend 단계 (병렬 가능)
   → backend, frontend agent 호출

6. QA 단계
   → qa agent 호출
   → AskUserQuestion: "QA 완료. 보고서 생성할까요?"
```

---

## 4. 변경 대상 파일

| 파일 | 변경 내용 |
|------|---------|
| `skills/vais/SKILL.md` | 구현 단계 액션 제거, C-레벨만 노출 |
| `skills/vais/phases/plan.md` 등 10개 | 리다이렉트 스텁 (→ CTO 안내) |
| `agents/cto.md` | 전체 구현 워크플로우 오케스트레이션 로직 추가 |
| `agents/ceo.md` | C-레벨에만 위임하도록 제약 명시 |
| `agents/cmo.md` | seo 소유권 명시 (현재도 있지만 강화) |
| `agents/cso.md` | security/validate-plugin 소유권 명시 |

**변경 없음:** architect.md, backend.md, frontend.md, qa.md, design.md, seo.md
(실무자 agent 기능은 그대로, 호출 경로만 변경)

---

## 5. Success Criteria

| 기준 | 검증 방법 |
|------|---------|
| `/vais cto login` 실행 시 CTO가 plan→qa 전체 플로우를 사용자 확인하며 진행 | 실행 테스트 |
| `/vais plan` 실행 시 "CTO를 통해 실행하세요" 안내 출력 | 실행 테스트 |
| `/vais ceo` 실행 시 CEO가 C-레벨에만 위임 (실무자 직접 호출 없음) | 코드 확인 |
| `/vais cmo` 실행 시 CMO가 seo agent에 위임 | 실행 테스트 |

---

## 6. 리스크

| 리스크 | 대응 |
|--------|------|
| CTO agent가 너무 복잡해짐 | 단계별 phase 파일은 유지하되 CTO가 순서대로 호출하는 방식으로 구성 |
| 사용자가 특정 단계만 재실행하고 싶을 때 | CTO에게 "architect 단계만 다시 해줘"로 요청 가능하도록 CTO agent에 명시 |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-01 | 최초 작성 (vais-dev 방향 폐기 후 재설계) |
