# Design: pm-skills 흡수 — CPO 서브에이전트 신설 + C-Suite 강화

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | CPO가 pm sub-agents를 참조하지만 실제 파일(pm-discovery, pm-strategy, pm-research, pm-prd)이 없어 호출 불가. CMO/CFO/CTO/CSO도 각 도메인 PM 프레임워크가 없어 산출물 품질 제한 |
| WHO | CPO, CMO, CFO, CTO, CSO 에이전트 + VAIS 사용자 |
| RISK | pm-skills 스킬 1:1 매핑 시 에이전트 파일 과다. C-Suite 역할 경계 혼재 가능성 |
| SUCCESS | SC-01: `/vais cpo {feature}` 실행 시 pm-discovery→pm-strategy+pm-research(병렬)→pm-prd 4단계 파이프라인 완주. SC-02: CMO가 GTM/ICP 프레임워크 포함 마케팅 전략 생성. SC-03: CSO가 privacy-policy 법적 체크리스트 수행 |
| SCOPE | `agents/pm-discovery.md`, `agents/pm-strategy.md`, `agents/pm-research.md`, `agents/pm-prd.md` 신규 생성 + `agents/cmo.md`, `agents/cfo.md`, `agents/cto.md`, `agents/cso.md` 보강 |

---

## 1. 최종 에이전트 계층 (변경 후)

```
CEO (opus) — 전략 + 전체 오케스트레이션
  ├─ CPO (opus) — 제품 방향 오케스트레이션
  │     ├─ pm-discovery  ← 신규 생성 (OST, Assumption Mapping)
  │     ├─ pm-strategy   ← 신규 생성 (Product Strategy Canvas, JTBD, Lean Canvas)
  │     ├─ pm-research   ← 신규 생성 (Personas, Market Sizing, Competitor Analysis)
  │     └─ pm-prd        ← 신규 생성 (PRD 8섹션, OKR, Sprint Plan)
  ├─ CTO (opus) — 기술 실행 오케스트레이션
  │     ├─ design / architect / frontend / backend / qa (기존 유지)
  │     └─ [보강] Data Analytics 역량 추가
  ├─ CMO (sonnet) — 마케팅 오케스트레이션
  │     ├─ seo (기존 유지)
  │     └─ [보강] GTM/ICP/North Star Metric/Growth Loops
  ├─ CSO (sonnet) — 보안/검증 오케스트레이션
  │     ├─ security / validate-plugin (기존 유지)
  │     └─ [보강] Privacy Policy/NDA 법적 컴플라이언스
  ├─ CFO (sonnet) — 재무/ROI 분석
  │     └─ [보강] Pricing Strategy/Monetization Strategy 프레임워크
  └─ COO (sonnet) — 운영/CI/CD (변경 없음)
```

---

## 2. 신규 에이전트 설계 (CPO 서브에이전트 4개)

### 2.1 `agents/pm-discovery.md`

**역할**: Opportunity Solution Tree(Teresa Torres) 기반 기회 발견 에이전트.

```yaml
name: pm-discovery
version: 1.0.0
description: |
  PM Discovery 에이전트. Teresa Torres의 Opportunity Solution Tree 기반.
  기회 발견 → 가정 도출 → 실험 설계 → 사용자 인터뷰.
  Triggers: (직접 호출 금지 — CPO를 통해 호출)
model: sonnet
tools: [Read, Write, Glob, Grep, TodoWrite]
memory: none
```

**핵심 로직**:
1. 비즈니스 목표 → 기회 맵 (OST 3레벨: 목표 → 기회 → 솔루션)
2. 핵심 가정 도출 (Assumption Mapping: 리스크 × 알 수 없음)
3. 가정 검증 실험 설계
4. 인터뷰 스크립트 생성

**산출물**: 구조화된 기회 분석 결과 (CPO에게 반환, 파일 저장 없음)

**CPO에게 반환하는 출력 형식**:
```
## pm-discovery 결과

### 핵심 기회 영역 (OST)
- 목표: {비즈니스 목표}
- 기회 1: {기회 설명} — 리스크: {상/중/하}
- 기회 2: ...

### 최우선 검증 가정
- 가정 1: {내용} (리스크: 상, 확신도: 하)
- 가정 2: ...

### 권장 다음 단계
- {인터뷰 / 실험 / 프로토타입}
```

---

### 2.2 `agents/pm-strategy.md`

**역할**: Product Strategy Canvas 9섹션 기반 제품 전략 에이전트.

```yaml
name: pm-strategy
version: 1.0.0
description: |
  PM Strategy 에이전트. Product Strategy Canvas, Value Proposition(JTBD), Lean Canvas 기반.
  Triggers: (직접 호출 금지 — CPO를 통해 호출)
model: sonnet
tools: [Read, Write, Glob, Grep, TodoWrite]
memory: none
```

**핵심 로직**:
1. Value Proposition — JTBD 6-Part 포맷 (When / I want to / So I can / But / Which makes me feel / Unlike)
2. Lean Canvas — 9개 블록 (Problem / Solution / UVP / Unfair Advantage / Customer Segments / Key Metrics / Channels / Cost / Revenue)
3. Competitive Positioning — Geoffrey Moore 포맷
4. Strategic Analysis 선택 적용: SWOT / PESTLE / Porter's Five Forces / Ansoff Matrix

**산출물**: CPO에게 전략 구조 반환 + `docs/00-pm/{feature}-strategy.md` 저장

**CPO에게 반환하는 출력 형식**:
```
## pm-strategy 결과

### Value Proposition (JTBD)
When {상황}, I want to {목표}, So I can {결과}...

### Lean Canvas 핵심
- Problem: {상위 3개}
- UVP: {한 문장}
- Key Metrics: {AARRR 기반}

### 전략 방향
- {포지셔닝 / 성장 전략 한 줄 요약}
```

---

### 2.3 `agents/pm-research.md`

**역할**: 시장/사용자 리서치 에이전트.

```yaml
name: pm-research
version: 1.0.0
description: |
  PM Research 에이전트. User Personas, Market Sizing(TAM/SAM/SOM), Competitor Analysis.
  Triggers: (직접 호출 금지 — CPO를 통해 호출)
model: sonnet
tools: [Read, Write, Glob, Grep, TodoWrite]
memory: none
```

**핵심 로직**:
1. User Personas — 3개 페르소나 (이름, 배경, 목표, 페인포인트, 행동 패턴)
2. Market Sizing — TAM/SAM/SOM 상향식 + 하향식 교차 검증
3. Competitor Analysis — 5개사 (기능 매트릭스 + 포지셔닝 맵)
4. Customer Journey Map — 5단계 (인지 → 고려 → 구매 → 사용 → 추천)

**산출물**: CPO에게 리서치 결과 반환 + `docs/00-pm/{feature}-research.md` 저장

**CPO에게 반환하는 출력 형식**:
```
## pm-research 결과

### Primary Persona
{이름}: {배경 한 줄}, 핵심 페인포인트: {내용}

### Market Sizing
- TAM: {규모}
- SAM: {규모}
- SOM: {규모} (근거: {방법론})

### 경쟁사 요약
| 경쟁사 | 강점 | 약점 | 포지셔닝 |
|--------|------|------|---------|
| {이름} | ... | ... | ... |
```

---

### 2.4 `agents/pm-prd.md`

**역할**: PRD 8섹션 합성 + 릴리즈 관리 에이전트.

```yaml
name: pm-prd
version: 1.0.0
description: |
  PM PRD 에이전트. discovery+strategy+research 결과를 합성해 PRD 생성.
  OKR, Sprint Plan, Pre-mortem 포함.
  Triggers: (직접 호출 금지 — CPO를 통해 호출)
model: sonnet
tools: [Read, Write, Edit, Glob, Grep, TodoWrite]
memory: none
```

**핵심 로직**:
1. PRD 8섹션 합성:
   - Overview (WHY, Problem Statement)
   - Goals & Success Metrics (OKR 연계)
   - User Stories (JTBD 포맷)
   - Functional Requirements (MoSCoW 우선순위)
   - Technical Constraints (CTO 핸드오프용)
   - Timeline & Milestones (Sprint Plan)
   - Risks & Mitigations (Pre-mortem 결과 반영)
   - Stakeholder Map
2. 3개 PM 서브에이전트 결과를 섹션별로 매핑

**산출물**: `docs/00-pm/{feature}.prd.md` (최종 PRD 파일)

---

## 3. 기존 에이전트 보강 설계

### 3.1 `agents/cmo.md` 보강

**현재 상태**: 마케팅 방향 분석 + SEO 위임 (seo sub-agent 호출)
**보강 내용**: GTM 전략 프레임워크 추가

**추가할 섹션**: `## GTM 전략 프레임워크`

| 추가 역량 | 내용 |
|---------|------|
| GTM Strategy | Beachhead Segment → ICP → Early Majority 확장 경로 |
| ICP 정의 | Firmographic + Behavioral + Psychographic 3축 |
| North Star Metric | 제품 핵심 가치 지표 1개 + 지원 지표 3개 |
| Growth Loops | Viral / Paid / Content / Product-led 루프 설계 |
| GTM Motions | PLG (Product-led) / SLG (Sales-led) / CLG (Community-led) 판단 기준 |
| Competitive Battlecard | Win/Loss 분석 + 경쟁사 대비 USP 정리 |
| Positioning Statement | "For [target], [product] is the [category] that [UVP]. Unlike [alternative], [differentiator]." |

**추가 위치**: `agents/cmo.md`의 "작업 원칙" 섹션 앞에 삽입

---

### 3.2 `agents/cfo.md` 보강

**현재 상태**: 비용-편익, ROI 분석 (stub 수준)
**보강 내용**: 가격/수익화 전략 프레임워크 참조 추가

**추가할 섹션**: `## 가격/수익화 전략 프레임워크`

| 추가 역량 | 내용 |
|---------|------|
| Pricing Strategy | Value-based / Cost-plus / Competitive / Freemium 모델 비교 의사결정 트리 |
| Monetization Strategy | SaaS / Marketplace / Transaction / Usage-based 모델별 단가 계산 방법 |
| Unit Economics | CAC, LTV, Payback Period, NRR 산정 방법론 |

---

### 3.3 `agents/cto.md` 보강

**현재 상태**: 기술 전체 오케스트레이션 (design→architect→frontend+backend→qa)
**보강 내용**: QA/분석 단계에서 활용할 데이터 분석 역량 추가

**추가할 섹션**: QA 단계 확장 내에 `### 데이터 분석 역량`

| 추가 역량 | 내용 |
|---------|------|
| SQL Queries | 제품 메트릭 쿼리 패턴 (DAU/MAU, Retention, Funnel) |
| Cohort Analysis | 사용자 코호트 분석 설계 방법 |
| A/B Test Analysis | 실험 설계 (Sample Size, Significance, Guardrail Metrics) |

---

### 3.4 `agents/cso.md` 보강

**현재 상태**: Gate A (보안 감사 via security sub-agent) + Gate B (플러그인 검증 via validate-plugin sub-agent)
**보강 내용**: Gate A에 법적 컴플라이언스 체크리스트 추가

**추가할 섹션**: Gate A 내 `### 법적 컴플라이언스 체크리스트`

| 추가 역량 | 내용 |
|---------|------|
| Privacy Policy | GDPR/CCPA 필수 조항 체크리스트 (데이터 수집 목적, 보존 기간, 사용자 권리) |
| NDA Draft | NDA 필수 항목 검토 (기밀 정보 정의, 유효 기간, 예외 조항) |
| Terms of Service | ToS 필수 조항 (책임 한계, 서비스 변경 고지, 분쟁 해결) |

---

## 4. 서브에이전트 입출력 계약

### 4.1 CPO → pm-discovery 호출 계약

**CPO가 전달하는 컨텍스트**:
```
## pm-discovery 요청

피처: {feature}
비즈니스 목표: {CEO/CPO가 정의한 목표}
현재 알고 있는 사용자 문제: {있으면}
```

**pm-discovery가 반환하는 결과**:
```
핵심 기회 영역 (OST), 최우선 검증 가정, 권장 다음 단계
```

---

### 4.2 CPO → pm-strategy 호출 계약

**CPO가 전달하는 컨텍스트**:
```
## pm-strategy 요청

피처: {feature}
pm-discovery 결과: {핵심 기회 영역}
분석 범위: [Lean Canvas | SWOT | Porter's | Ansoff] (기본: Lean Canvas + JTBD)
```

**pm-strategy가 반환하는 결과**:
```
Value Proposition (JTBD), Lean Canvas 핵심 블록, 전략 방향 요약
저장: docs/00-pm/{feature}-strategy.md
```

---

### 4.3 CPO → pm-research 호출 계약

**CPO가 전달하는 컨텍스트**:
```
## pm-research 요청

피처: {feature}
pm-strategy 결과: {타깃 세그먼트, Value Proposition}
분석 범위: [Personas | Market Sizing | Competitors | Journey Map] (기본: 전체)
```

**pm-research가 반환하는 결과**:
```
Primary Persona, Market Sizing (TAM/SAM/SOM), 경쟁사 요약 테이블
저장: docs/00-pm/{feature}-research.md
```

---

### 4.4 CPO → pm-prd 호출 계약

**CPO가 전달하는 컨텍스트**:
```
## pm-prd 요청

피처: {feature}
pm-discovery 결과: {핵심 기회, 가정}
pm-strategy 결과: {Value Proposition, Lean Canvas}
pm-research 결과: {Personas, Market Sizing, Competitors}
```

**pm-prd가 반환하는 결과**:
```
PRD 생성 완료: docs/00-pm/{feature}.prd.md
핵심 방향: {WHY 한 문장}
CTO 핸드오프 준비: {Technical Constraints 섹션 하이라이트}
```

---

## 5. 파일 변경 전체 목록

| 작업 | 파일 | 비고 |
|------|------|------|
| 신규 생성 | `agents/pm-discovery.md` | OST, Assumption Mapping |
| 신규 생성 | `agents/pm-strategy.md` | JTBD, Lean Canvas, SWOT 등 |
| 신규 생성 | `agents/pm-research.md` | Personas, TAM/SAM/SOM, Competitors |
| 신규 생성 | `agents/pm-prd.md` | PRD 8섹션 합성 |
| 보강 | `agents/cmo.md` | GTM, ICP, North Star, Growth Loops 섹션 추가 |
| 보강 | `agents/cfo.md` | Pricing/Monetization 프레임워크 섹션 추가 |
| 보강 | `agents/cto.md` | Data Analytics (SQL/Cohort/A/B) 역량 추가 |
| 보강 | `agents/cso.md` | Privacy Policy/NDA/ToS 체크리스트 추가 |
| 변경 없음 | `agents/cpo.md` | 이미 pm sub-agents 오케스트레이션 로직 포함 |

---

## 6. 구현 순서 (Session Guide)

### Module 1 — CPO 서브에이전트 신규 생성 (독립, 병렬 가능)
- `agents/pm-discovery.md`
- `agents/pm-strategy.md`
- `agents/pm-research.md`

### Module 2 — CPO PRD 에이전트 생성 (Module 1 완료 후)
- `agents/pm-prd.md` (3개 서브에이전트 입력 형식 반영)

### Module 3 — C-Suite 에이전트 보강 (Module 1과 병렬 가능)
- `agents/cmo.md` — GTM/ICP/North Star Metric 섹션 추가
- `agents/cfo.md` — Pricing/Monetization 섹션 추가
- `agents/cto.md` — Data Analytics 섹션 추가
- `agents/cso.md` — 법적 컴플라이언스 체크리스트 추가

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-01 | 최초 작성 — pm-skills absorb 에이전트 설계 확정 |
