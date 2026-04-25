---
artifact: prd
owner_agent: prd-writer
phase: what
canon_source: "Marty Cagan 'Inspired' (2017), Wiley + Lenny Rachitsky PRD Template (lennysnewsletter.com) + Wagenaar PRD Best Practices"
execution:
  policy: always
  intent: product-requirement-document
  prereq: [vision-statement, persona, jobs-to-be-done]
  required_after: [backlog, roadmap]
  trigger_events: []
  scope_conditions: []
template_depth: filled-sample-with-checklist
review_recommended: false
project_context_reason: "What 단계 — Vision/Strategy/Persona/JTBD 입력을 실행 가능한 요구사항으로 변환. 모든 product feature 는 PRD 1개 작성. backlog/roadmap 의 prereq."
---

# Product Requirements Document (PRD)

> **canon**: Marty Cagan *Inspired* (2017), Ch.13~16 — modern PRD spec. Lenny Rachitsky PRD Template (대표 PM 표준). Wagenaar 8-section best practices.
>
> **목적**: Vision (Why) → Strategy → **PRD (What)** → Backlog/Roadmap (When/How) 흐름의 critical bridge. 부재 시 backlog 가 단순 todo 목록으로 전락.

---

## 1. 제목 + 한 줄 요약

**Feature**: ______
**One-liner**: [한 문장 요약 — 사용자·가치·메커니즘]

## 2. Business Context (Why)

| 항목 | 내용 |
|------|------|
| **Strategic Alignment** | (Vision/BHAG 와의 연결) |
| **Business Goal** | (Strategy Kernel 의 어느 Coherent Action 에 기여?) |
| **OKR Mapping** | (어느 KR 을 충족?) |
| **Stakeholders** | (의사결정자 / 영향받는 팀) |

## 3. Users + Jobs (Persona + JTBD)

| 항목 | 내용 |
|------|------|
| **Primary Persona** | (`persona.md` 참조 — Persona Name) |
| **Core Job** | (`jobs-to-be-done.md` Core Job Statement) |
| **Top Pain** | (해소할 가장 강한 통증) |
| **Top Gain** | (생성할 가장 핵심 결과) |

## 4. Solution Overview

[3~5문장 — 사용자가 어떻게 Job 을 수행하게 되는가. 솔루션의 핵심 메커니즘. 경쟁사 대비 차별화 1줄 포함]

## 5. Requirements (MoSCoW)

| 분류 | Requirement | 수용 기준 (Acceptance) | 우선순위 |
|:----:|------------|----------------------|:------:|
| **Must** | ... | Given/When/Then | 높음 |
| **Should** | ... | ... | 중간 |
| **Could** | ... | ... | 낮음 |
| **Won't** (이번 release X) | ... | (이유 명시) | OOS |

## 6. UX / Wireframe

| 항목 | 참조 |
|------|------|
| **Wireframe** | `_tmp/ui-designer.md` 또는 Figma 링크 |
| **User Flow** | (단계별 다이어그램) |
| **Empty/Error/Loading 상태** | (반드시 명시 — Cagan 강조) |

## 7. Success Metrics

| Metric | Baseline | Target | 측정 방법 |
|--------|:--------:|:------:|----------|
| (예: 활성 사용자) | ... | ... | (event tracking) |
| (예: 전환율) | ... | ... | (funnel analysis) |
| (예: NPS) | ... | ... | (in-app survey) |

→ Success Criteria 명시 — 무엇이 충족되면 "성공" 인가.

## 8. Risks + Open Questions + Pre-mortem

### Risks
| Risk | Severity | Mitigation |
|------|:--------:|------------|
| ... | ... | ... |

### Open Questions
- [ ] (해소되지 않은 가정 / 추가 검증 필요)

### Pre-mortem (Cagan 권장)
> "1년 후 이 피처가 실패했다면, 그 이유는 무엇인가?"

[3~5개 가능 실패 요인 + 사전 완화]

---

## (작성된 sample)

**Feature**: VAIS Code v1.0 GA — Project Profile + Catalog 기반 Sub-agent 게이트
**One-liner**: 솔로 빌더가 Profile 12 변수 1회 합의로 44 sub-agent 가 자기 프로젝트 맥락에 맞는 산출물만 정전 출처와 함께 생성하도록 한다.

### 2. Business Context

| 항목 | 내용 |
|------|------|
| **Strategic Alignment** | BHAG (10만 솔로 빌더가 Fortune 500 수준 프로세스 실행) |
| **Business Goal** | Strategy Kernel Coherent Action #1, #4 (Profile 게이트 + 50+ 카탈로그) |
| **OKR Mapping** | KR1 (95% skip 적중률), KR2 (25/25 templates), KR4 (alignment 70%+) |
| **Stakeholders** | 솔로 빌더 (P1) / 스타트업 CTO (P2) / 엔터프라이즈 PM (P3) |

### 3. Users + Jobs

| 항목 | 내용 |
|------|------|
| **Primary Persona** | 김지원 (P1 솔로 빌더) |
| **Core Job** | "정전 출처 명시 산출물을 30분 내 받아 투자자·동료에게 신뢰 가능한 자료 제시" |
| **Top Pain** | ChatGPT 산출물 신뢰 의심 — 정전 출처 부재 (Extreme) |
| **Top Gain** | 모든 산출물에 정전 출처 자동 명시 (Required) |

### 4. Solution Overview

VAIS Code 는 Project Profile (12 변수: type/target_market/deployment.target/users.target_scale/sla_required 등) 을 ideation 종료 시 1회 합의 → `.vais/profile.yaml` 저장. 50+ 산출물 카탈로그 의 각 template frontmatter `execution.policy` (4 분류: Always / Scope / User-select / Triggered) + `scope_conditions` 가 Profile 과 매칭되어 sub-agent 호출 시점을 자체 판단. 결과: "쓸데없이 CI/CD" 마찰 자동 해소 + 모든 산출물에 정전 출처 강제.

### 5. Requirements

| 분류 | Requirement | 수용 기준 | 우선순위 |
|:----:|-----------|----------|:------:|
| Must | F1 Profile schema v1 (12 변수 + 5 연산자) | T-01~T-07 통합 테스트 통과 | 높음 |
| Must | F2 Template metadata schema | template-validator 25/25 통과 | 높음 |
| Must | F3 Catalog 50+ 산출물 (depth c) | catalog.json 50+ artifacts | 높음 |
| Must | F4 44 sub-agent audit Q-A/B/C/D | sub-agent-audit 48/48 통과 | 높음 |
| Must | F5 release-engineer 5분해 | 5 신규 sub-agent + deprecate alias | 높음 |
| Should | F6 신규 5 sub-agent (CEO 4 + CPO 1) | catalog owner_agent 매칭 | 중간 |
| Should | F7 Alignment α + β | EXP-4 70%+ 감지율 | 중간 |
| Should | F8 VPC 재매핑 | copy-writer → product-strategist 이관 | 중간 |
| Won't | 외부 LLM 호환 (OpenAI/Gemini) | Anthropic Claude 전용 우선 | OOS (post-GA) |

### 6. UX

| 항목 | 참조 |
|------|------|
| Wireframe | (CLI 도구이므로 N/A — terminal output 만) |
| User Flow | `/vais ceo ideation` → AskUserQuestion → profile.yaml → 6 C-Level 자동 호출 → 게이트 평가 |
| Empty/Error/Loading | profile.yaml 부재 시 ideation-guard 가 자동 추출 / 게이트 평가 미충족 시 skip + 이유 반환 |

### 7. Success Metrics

| Metric | Baseline | Target | 측정 |
|--------|:--------:|:------:|------|
| Profile 게이트 skip 적중률 | 0% | ≥ 95% | T-01~T-07 자동 + 수동 검증 |
| 우선 25 templates depth-c 완성 | 0/25 | 25/25 | template-validator --depth-check |
| 44 sub-agent audit 4기준 | 0/44 | 44/44 | sub-agent-audit |
| EXP-4 alignment α 감지율 | 미측정 | ≥ 70% | (Sprint 14 측정) |
| 외부 사용자 인터뷰 | 0명 | 5~7명 | (Sprint 11~14 ux-researcher) |

### 8. Risks + Pre-mortem

| Risk | Severity | Mitigation |
|------|:--------:|------------|
| R1 작업량 폭증 (50+ template) | High | Sprint 1~3 후 5 파일럿 측정 → 보정 |
| R4 파괴적 변경 | Med | feature flag profileGateEnabled: false 기본 |
| R6 작동 중단 | Med | release-engineer deprecated alias |

**Pre-mortem**: 1년 후 실패한다면?
1. 정전 출처 명시가 OSS 사용자에게 over-engineering 으로 받아들여짐
2. 외부 인터뷰 부재로 P1/P2 가치 미검증 → adoption rate 낮음
3. 잔여 25 templates 작성 분량으로 backlog overflow

---

## 작성 체크리스트

- [ ] 8 섹션 (제목/Why/Users/Solution/Requirements/UX/Metrics/Risks) 모두 작성되었는가?
- [ ] **Strategic Alignment** 가 Vision Statement / Strategy Kernel 과 연결되어 있는가?
- [ ] **Primary Persona** + **Core Job** 이 명시되었는가? (`persona.md` + `jobs-to-be-done.md` 참조)
- [ ] Requirements 가 **MoSCoW** (Must/Should/Could/Won't) 분류되어 있는가?
- [ ] 각 Must/Should 에 **수용 기준 (Acceptance Criteria)** 이 Given/When/Then 형식으로 명시되었는가?
- [ ] **Empty/Error/Loading 상태** 가 UX 섹션에 명시되었는가?
- [ ] Success Metrics 가 **측정 가능** (Baseline + Target + 측정 방법) 한가?
- [ ] **Pre-mortem** 으로 3~5개 가능 실패 요인 식별했는가?
- [ ] OKR `prereq` 참조와 KR mapping 되었는가?
- [ ] designCompleteness ≥ 80% (각 섹션 80자+) 충족하는가?

---

## ⚠ Anti-pattern

- **Solution-first PRD**: Why/Users 없이 Solution 부터 — 가치 미검증 산출물. Cagan 명시 경고.
- **Feature dump**: Requirements 가 단순 기능 나열, 수용 기준 없음 — 개발자가 "완료" 판단 불가.
- **Won't 섹션 누락**: 무엇을 안 하는가? 부재 시 scope creep + 일정 지연. **OOS 명시 필수**.
- **Pre-mortem 회피**: "잘 될 것이다" 식 낙관 — Cagan: 사전 실패 시나리오 검토가 후행 risk register 보다 효과.
- **OKR 무관**: PRD 가 OKR 의 KR 과 매핑 없음 — 전략-실행 단절.
- **Empty/Error 무시**: golden path 만 명시하고 빈 상태·에러·로딩 무시 — 실제 사용자 경험 80%+ 가 이 영역.
- **추상적 Metrics**: "사용자 경험 향상" — 측정 불가. NPS/DAU/Conversion 같이 구체화.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 11. Cagan + Lenny + Wagenaar 정전. 8 섹션 PRD + sample (VAIS Code v1.0 GA — 자기 참조) + checklist 10 + anti-pattern 7 |
