---
artifact: value-proposition-canvas
owner_agent: product-strategist
phase: why
canon_source: "Osterwalder, Pigneur, Bernarda, Smith, Papadakos 'Value Proposition Design' (2014), Wiley + Osterwalder & Pigneur 'Business Model Generation' (2010), Wiley"
execution:
  policy: always
  intent: product-market-fit
  prereq: [jobs-to-be-done, persona]
  required_after: [strategy-kernel, prd]
  trigger_events: []
  scope_conditions: []
template_depth: filled-sample-with-checklist
review_recommended: true
project_context_reason: "Why 단계 — Customer Profile (JTBD/Persona 기반) 과 Value Map (제품·서비스) 의 명시적 fit 검증. 본 템플릿이 곧 product-market fit 의 Osterwalder 형태. F8 재매핑: 기존 copy-writer (CBO) 에 위치했으나 PMF 분석은 product 영역 → product-strategist (CPO) 가 owner."
---

# Value Proposition Canvas (VPC)

> **canon**: Alexander Osterwalder, Yves Pigneur, Greg Bernarda, Alan Smith, Trish Papadakos. *Value Proposition Design: How to Create Products and Services Customers Want* (2014), Wiley. 기반: *Business Model Generation* (2010) 의 9-block Business Model Canvas 중 "Customer Segments + Value Propositions" 2 block 을 확대한 zoom-in 도구.
>
> **목적**: **Customer Profile** (Job + Pain + Gain) ↔ **Value Map** (Products & Services + Pain Reliever + Gain Creator) 의 fit 을 명시적으로 그림. PMF (Product-Market Fit) 의 Osterwalder 형태.
>
> **JTBD 와 관계**: JTBD 가 Job 정의 후, VPC 가 그 Job 을 둘러싼 Pain·Gain 으로 확장 + 우리 제품의 대응 (Pain Reliever / Gain Creator) 매핑.

---

## Part 1. Customer Profile (Right side — 동그라미)

> **JTBD + Persona 입력**: prereq 의 jobs-to-be-done.md / persona.md 결과를 입력으로 받아 3 영역 작성.

### Customer Jobs

| 차원 | 정의 | 작성 |
|------|------|------|
| **Functional Jobs** | 실용적 작업 (기능적) | (예: PRD 30분 내 작성) |
| **Emotional Jobs** | 감정 변화 (자신감·안심 등) | (예: 전문가 검토받은 안심) |
| **Social Jobs** | 타인 인식 변화 (지위·인정) | (예: 투자자에게 신뢰받음) |
| **Supporting Jobs** | 보조 작업 | (예: 산출물 백업·공유) |

### Pains (현재 상황의 frustration)

> **분류 (Osterwalder)**:
> - **Undesired Outcomes / Problems / Characteristics**: 일이 잘못되는 방식
> - **Obstacles**: Job 시작·완료를 막는 장애물
> - **Risks**: 일이 잘못될 가능성 (정량 또는 정성)

| Pain | 강도 (Extreme / Moderate / Mild) | 빈도 |
|------|:-----:|:----:|
| Pain 1 | Extreme | 매주 |
| Pain 2 | Moderate | 월 1-2회 |

### Gains (desired outcomes)

> **분류**:
> - **Required Gains**: 가져야 마땅한 결과 (없으면 작동 안 함)
> - **Expected Gains**: 일반적으로 기대되는 결과 (없어도 작동, 있으면 만족)
> - **Desired Gains**: 명시적으로 원하는 결과 (있으면 기쁨)
> - **Unexpected Gains**: 예상 못 한 결과 (있으면 wow)

| Gain | 분류 | 중요도 |
|------|:----:|:-----:|
| Gain 1 | Required | 높음 |
| Gain 2 | Desired | 중간 |

---

## Part 2. Value Map (Left side — 사각형)

### Products & Services

> 우리가 제공하는 것 — 물리/디지털/서비스/금융 모두 포함.

| 항목 | 설명 |
|------|------|
| Product 1 | (예: VAIS Code 플러그인) |
| Service 1 | (예: 마켓플레이스 자동 업데이트) |

### Pain Relievers (Pain → Relieve)

| Pain Reliever | 어떤 Pain 을 해소? | 강도 (Essential / Important / Nice-to-have) |
|---------------|------|:-----:|
| Reliever 1 | Pain 1 | Essential |
| Reliever 2 | Pain 2 | Important |

### Gain Creators (Gain → Create)

| Gain Creator | 어떤 Gain 을 생성? | 강도 |
|--------------|------|:-----:|
| Creator 1 | Gain 1 | Essential |
| Creator 2 | Gain 2 | Nice-to-have |

---

## Part 3. Fit (Customer Profile ↔ Value Map)

> **Osterwalder 의 핵심 검증**: Pain Reliever 가 Pain 을 1:1 또는 N:M 으로 매핑되어야 함. 매핑 안 되는 Pain Reliever 는 "있을 만한 기능" 이지 검증된 가치가 아님.

### Fit Matrix

| Customer Pain | 매핑된 Pain Reliever | Coverage |
|---------------|----------------------|:--------:|
| Pain 1 (Extreme) | Reliever 1 (Essential) | ✅ Strong |
| Pain 2 (Moderate) | Reliever 2 (Important) | ✅ |

| Customer Gain | 매핑된 Gain Creator | Coverage |
|---------------|---------------------|:--------:|
| Gain 1 (Required) | Creator 1 (Essential) | ✅ Strong |
| Gain 2 (Desired) | Creator 2 (Nice-to-have) | ⚠ Weak |

### Fit Assessment

- **Problem-Solution Fit**: Customer Pain 의 Extreme 모두 Pain Reliever 로 해소? Y/N
- **Product-Market Fit**: Required Gain 모두 Gain Creator 로 해소? Y/N
- **Wow Fit (Optional)**: Unexpected Gain 까지 다루는가? Y/N

---

## (작성된 sample)

**제품**: VAIS Code | **타겟 Persona**: P1 솔로 빌더 (`persona.md`)

### Customer Profile

#### Customer Jobs

| 차원 | Job |
|------|-----|
| **Functional** | 정전 출처 명시 PRD 30 분 내 작성 / 새 영역 (보안·GTM) 자동 점검 / 투자자 자료 1 주 안에 작성 |
| **Emotional** | "내가 1 인이지만 컨설팅 펌 수준의 결과물 낼 수 있다" 자신감 / 막막함 → 안심 |
| **Social** | 투자자·동료에게 "어떻게 이런 자료를 혼자 만들었나?" 인정받음 |
| **Supporting** | 산출물 git 자동 추적 / 결정 근거 (Decision Record) 자동 누적 |

#### Pains

| Pain | 강도 | 빈도 |
|------|:----:|:----:|
| ChatGPT 산출물 신뢰 의심 — 정전 출처 부재 | **Extreme** | 매번 |
| 새 영역 (보안·법무·GTM) 직접 챙기기 막막 | **Extreme** | 새 피처마다 |
| 산출물마다 prompt 재구성 — context 손실 | Moderate | 매번 |
| 투자자 미팅 자료 작성에 1 주 소요 | **Extreme** | 월 1-2회 |
| 결정 근거가 휘발 — 1 달 후 "왜 이걸 결정했지?" | Moderate | 월 1회 |

#### Gains

| Gain | 분류 | 중요도 |
|------|:----:|:-----:|
| 30 분 내 PRD 8 섹션 완성 | **Required** | 높음 |
| 모든 산출물에 정전 출처 (Cagan / Rumelt / Torres / SRE Book) 자동 명시 | **Required** | 높음 |
| 영역 무관 (보안·GTM·재무) 자동 점검 | **Desired** | 높음 |
| Decision Record 자동 누적 — 결정 추적성 | **Expected** | 중간 |
| 투자자 자료가 시리즈 B 회사처럼 보임 | **Desired** | 높음 |
| Profile 1회 합의 → 모든 sub-agent 자동 정렬 | **Unexpected** | 중간 |

### Value Map

#### Products & Services

| 항목 | 설명 |
|------|------|
| **VAIS Code Plugin** | Claude Code 마켓플레이스 무료 plugin |
| **6 C-Level Agent** | CEO/CPO/CTO/CSO/CBO/COO orchestration |
| **44 Sub-agent** | 도메인 특화 (security/finance/UX 등) |
| **50+ Template Catalog** | 정전 출처 frontmatter 강제 (`templates/{phase}/*.md`) |

#### Pain Relievers

| Reliever | 해소 Pain | 강도 |
|----------|-----------|:-----:|
| 정전 출처 frontmatter 강제 (canon_source) | "정전 출처 부재" | **Essential** |
| Profile 게이트 + scope-conditional sub-agent | "새 영역 막막" → 자동 호출 | **Essential** |
| clevel-coexistence + sub-doc 보존 | "context 손실 / 결정 휘발" | **Essential** |
| Sprint 단위 Roadmap + RICE 우선순위 | "투자자 자료 1 주" → 30분 PRD | **Essential** |

#### Gain Creators

| Creator | 생성 Gain | 강도 |
|---------|-----------|:-----:|
| 50+ template depth (c) — sample + checklist + anti-pattern | "정전 자동 명시" + "30분 PRD" | **Essential** |
| 6 C-Level x 44 sub-agent 도메인 분담 | "영역 무관 자동 점검" | **Essential** |
| Decision Record append-only | "결정 추적성" | Important |
| Project Profile 12 변수 1 회 합의 | "Unexpected Gain — 모든 sub-agent 자동 정렬" | Important |

### Fit Matrix

| Customer Pain | 매핑된 Reliever | Coverage |
|---|---|:---:|
| 정전 출처 부재 (Extreme) | canon_source 강제 (Essential) | ✅ Strong |
| 새 영역 막막 (Extreme) | Profile 게이트 + scope (Essential) | ✅ Strong |
| context 손실 (Moderate) | clevel-coexistence + sub-doc (Essential) | ✅ Strong |
| 투자자 자료 1 주 (Extreme) | Sprint Roadmap + RICE (Essential) | ✅ Strong |
| 결정 근거 휘발 (Moderate) | Decision Record append-only (Important) | ✅ |

| Customer Gain | 매핑된 Creator | Coverage |
|---|---|:---:|
| 30분 PRD (Required) | depth (c) template + RICE (Essential) | ✅ Strong |
| 정전 출처 자동 명시 (Required) | canon_source frontmatter (Essential) | ✅ Strong |
| 영역 무관 자동 점검 (Desired) | 44 sub-agent + Profile (Essential) | ✅ Strong |
| Decision Record (Expected) | append-only Decision Record (Important) | ✅ |
| 시리즈 B 자료 (Desired) | (간접 — 정전 출처 + 표준 카탈로그가 결합 효과) | ✅ |
| Profile 1회 자동 정렬 (Unexpected) | 12 변수 schema (Important) | ✅ Wow |

### Fit Assessment

- **Problem-Solution Fit**: ✅ 모든 Extreme Pain 에 Essential Reliever 매핑
- **Product-Market Fit**: ✅ 모든 Required Gain 에 Essential Creator 매핑
- **Wow Fit**: ✅ Unexpected Gain ("Profile 1회 자동 정렬") 에 Wow level Creator 존재

→ **결론**: PMF 가설은 VPC 차원에서 **strong fit**. 그러나 본 fit 은 **자기 진단** — RA-1 외부 인터뷰 (Sprint 11~14) 로 검증 필수.

---

## 작성 체크리스트

- [ ] Customer Profile 3 영역 (Jobs / Pains / Gains) 모두 작성되었는가?
- [ ] Customer Jobs 가 Functional / Emotional / Social 3 차원 모두 포함하는가?
- [ ] Pains 의 강도 (Extreme / Moderate / Mild) + 빈도 가 명시되었는가?
- [ ] Gains 의 4 분류 (Required / Expected / Desired / Unexpected) 가 명시되었는가?
- [ ] Value Map 3 영역 (Products & Services / Pain Relievers / Gain Creators) 모두 작성되었는가?
- [ ] Pain Reliever 의 강도 (Essential / Important / Nice-to-have) 가 명시되었는가?
- [ ] **Fit Matrix** 가 작성되어 Pain ↔ Reliever / Gain ↔ Creator 매핑이 명시되었는가?
- [ ] Coverage 평가 (Strong / Weak / Missing) 가 각 매핑에 부여되었는가?
- [ ] Problem-Solution Fit / Product-Market Fit 두 단계 모두 평가되었는가?
- [ ] JTBD (`prereq`) 와 Persona (`prereq`) 의 결과가 Customer Profile 에 반영되었는가?
- [ ] 정전 출처 (Osterwalder 2014) 가 frontmatter 에 명시되어 있는가?

---

## ⚠ Anti-pattern

- **Solution-Led VPC**: 제품을 먼저 그리고 거꾸로 Pain·Gain 만들기 — Osterwalder 명시 경고. **Customer Profile 부터 작성** 후 Value Map.
- **Pain 과 Pain Reliever 1:1 강제**: 모든 Pain 에 정확히 1 개 Reliever — 현실은 N:M 매핑. 일부 Pain 은 한 개 Reliever 로 부분 해소될 수 있음.
- **Gain Creator = 기능 나열**: "X 기능 / Y 기능 / Z 기능" — 기능은 어떤 Gain 을 만드는가? Gain Creator 는 **Gain 자체** 를 명시.
- **Fit Matrix 누락**: 두 캔버스만 그리고 끝남 — VPC 의 핵심 가치는 **fit 검증**. matrix 없으면 단순 brainstorm.
- **자기 진단으로 결론**: VPC fit 이 "✅ Strong" 으로 평가됨에도 외부 검증 없이 "PMF 달성" 선언. **VPC 는 가설 도구**, 실제 PMF 는 사용자 인터뷰로 검증.
- **Pain·Gain 추상화**: "사용성 안 좋다" / "더 빨라야 한다" — 측정 불가. 강도 + 빈도 + 구체적 시나리오로 구체화.
- **Persona 없는 VPC**: 단일 Persona 1 명에 대한 Customer Profile 이 아닌 "모든 사용자" 일반화 — 무가치. **1 Persona = 1 VPC** 원칙.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 6 (F8 VPC 재매핑). Osterwalder 2014 *Value Proposition Design* 정전. Customer Profile (Jobs / Pains / Gains) + Value Map (P&S / Pain Relievers / Gain Creators) + Fit Matrix + Problem-Solution / Product-Market / Wow Fit 3 단계 평가 + sample (VAIS P1 솔로 빌더 — 5 Pain / 6 Gain / 4 Reliever / 4 Creator + Strong Fit 결론) + checklist 11 + anti-pattern 7 |
