---
artifact: financial-model
owner_agent: financial-modeler
phase: biz
canon_source: "Aswath Damodaran 'Investment Valuation' (2012, 3rd ed.), Wiley + Paul Pignataro 'Financial Modeling and Valuation' (2013), Wiley + Wall Street Prep 3-Statement Model best practices"
execution:
  policy: scope
  intent: financial-modeling
  prereq: [strategy-kernel, prd]
  required_after: [pricing-strategy]
  trigger_events: []
  scope_conditions:
    - field: revenue_model
      operator: NOT_IN
      value: [none]
template_depth: filled-sample-with-checklist
review_recommended: true
project_context_reason: "Biz 단계 — 3-Statement (P&L / Balance Sheet / Cash Flow) + DCF + 시나리오 분석. 투자유치/M&A/예산 결정 시 필수. review_recommended=true: 가정 (assumption) 의 자기기만 위험."
---

# Financial Model (3-Statement + DCF)

> **canon**: Damodaran *Investment Valuation* (2012) — DCF + relative valuation 표준. Pignataro *Financial Modeling* (2013) — Excel 모델 구조. Wall Street Prep — 3-Statement model best practices.
>
> **목적**: 비즈니스 가정을 정량 모델로 변환 → 투자자·이사회 의사결정 근거. **assumption 명시 + sensitivity 분석** 필수.

---

## 1. 3-Statement Model

### 1.1 Income Statement (P&L)

| 항목 | Y1 | Y2 | Y3 | 비고 |
|------|----|----|----|------|
| Revenue | ... | ... | ... | (volume × price 분해) |
| COGS | ... | ... | ... | (직접 비용) |
| Gross Profit | ... | ... | ... | Revenue - COGS |
| Gross Margin % | ... | ... | ... | |
| OpEx (S&M / R&D / G&A) | ... | ... | ... | (분류별 분해) |
| EBITDA | ... | ... | ... | |
| Depreciation | ... | ... | ... | |
| EBIT | ... | ... | ... | |
| Interest | ... | ... | ... | |
| Tax | ... | ... | ... | |
| Net Income | ... | ... | ... | |

### 1.2 Balance Sheet

| 항목 | Y1 | Y2 | Y3 | 비고 |
|------|----|----|----|------|
| **Assets** | | | | |
| Cash | ... | ... | ... | (Cash Flow 와 연결) |
| AR (수취 채권) | ... | ... | ... | DSO 가정 |
| Inventory | ... | ... | ... | DIO 가정 |
| PP&E | ... | ... | ... | |
| **Total Assets** | ... | ... | ... | |
| **Liabilities** | | | | |
| AP | ... | ... | ... | DPO 가정 |
| Debt | ... | ... | ... | |
| **Equity** | | | | |
| Equity | ... | ... | ... | (Net Income 누적) |

### 1.3 Cash Flow Statement

| 항목 | Y1 | Y2 | Y3 |
|------|----|----|----|
| **Operating CF** | | | |
| Net Income | ... | ... | ... |
| + Depreciation | ... | ... | ... |
| - Δ Working Capital | ... | ... | ... |
| **Investing CF** | | | |
| - CapEx | ... | ... | ... |
| **Financing CF** | | | |
| + Equity raised | ... | ... | ... |
| + Debt | ... | ... | ... |
| **Net Cash Change** | ... | ... | ... |

→ 3-Statement 가 **수학적으로 closed** — Net Income → Equity, CF → Cash 정합.

## 2. DCF Valuation (Damodaran)

| Step | 내용 |
|:----:|------|
| 1 | Revenue 성장률 가정 (5~10년 + Terminal) |
| 2 | EBITDA 마진 추정 |
| 3 | FCF (Free Cash Flow) 계산: EBITDA - CapEx - ΔWC - Tax |
| 4 | Discount Rate (WACC) 결정 |
| 5 | Terminal Value (Gordon Growth or Exit Multiple) |
| 6 | PV (Present Value) 합 = Enterprise Value |
| 7 | EV - Debt + Cash = Equity Value |

## 3. Scenario Analysis (3 case)

| Scenario | Probability | Revenue Y3 | Equity Value |
|----------|:----------:|:----------:|:----:|
| **Best** | 25% | (+50%) | ... |
| **Base** | 50% | (forecast) | ... |
| **Worst** | 25% | (-30%) | ... |

→ Expected Value = Σ (Probability × Equity Value)

## 4. Sensitivity Analysis

핵심 변수 ±10% / ±20% 시 Equity Value 변동:
- Revenue 성장률
- EBITDA 마진
- WACC
- Terminal Growth Rate

---

## (작성된 sample)

### VAIS Code Plugin (OSS — financial-model 미적용)

본 프로젝트는 **scope skip** 됨 (revenue_model = none / OSS 무료 / scope_conditions 미충족).

대안 sample: H2 (2027~) Enterprise 버전 가설 (사내 정전 + 회사별 카탈로그 SaaS) 모델.

| Year | Y1 (2027) | Y2 (2028) | Y3 (2029) |
|------|:--------:|:--------:|:--------:|
| Customer count | 3 | 15 | 50 |
| ARPU (annual) | $50k | $50k | $50k |
| **Revenue** | **$150k** | **$750k** | **$2.5M** |
| COGS (Anthropic API + 인프라) | $30k | $150k | $500k |
| Gross Margin % | 80% | 80% | 80% |
| S&M | $50k | $200k | $500k |
| R&D | $100k (1인) | $250k (3인) | $600k (8인) |
| G&A | $20k | $50k | $150k |
| **EBITDA** | -$50k | $100k | $750k |
| EBITDA % | -33% | 13% | 30% |

**가정**:
- ARPU: 사내 정전 도입 + 회사별 카탈로그 = 연 $50k (entry-level enterprise)
- Customer growth: NCSOFT (2026 Beta-2) → 3 → 5 (2027) → 30 (2029, OSS PR contributor 50+ 의 일부 전환)
- WACC: 25% (early-stage tech)

**DCF (5 year + Terminal)**:
- Y4~Y5 Revenue $5M / $10M (포화 전)
- Terminal Growth: 5%
- **Enterprise Value**: ~$25M (Y3 EBITDA 30x or DCF 합)
- **Caveat**: 가정 강함 — sensitivity ±20% Customer count 시 EV $15~40M.

---

## 작성 체크리스트

- [ ] **3-Statement** (P&L / BS / CF) 모두 작성 + **수학적 closed** (Net Income → Equity, CF → Cash)?
- [ ] **5+ 년 forecast** + Terminal Year 포함?
- [ ] **DCF Valuation** 7-step 모두 명시?
- [ ] **Scenario 3 case** (Best/Base/Worst) + Probability 가중 Expected Value?
- [ ] **Sensitivity Analysis** 핵심 4 변수 (Revenue / Margin / WACC / Terminal)?
- [ ] 모든 **assumption** 명시 (변수 / 출처 / 근거)?
- [ ] WACC 산출 근거 (CAPM 또는 industry benchmark)?
- [ ] review_recommended=true 이유 명시?

---

## ⚠ Anti-pattern (Damodaran 명시)

- **Hockey-stick growth**: Y3 부터 매출 100x — 가정 부적절. 산업 benchmark 와 비교 필수.
- **Single-scenario**: Base case 만 — risk 미반영. 3 scenario + Probability 강제.
- **Assumption 부재**: 숫자만 나열, 출처 / 근거 없음 — 신뢰성 0.
- **Terminal Value 과대**: Gordon Growth 8%+ 또는 Exit Multiple 30x+ — Damodaran 경고 (산업별 적정 1~3% / 5~15x).
- **WACC 임의**: "10%" 또는 "20%" 임의 선택 — CAPM 또는 산업 benchmark 명시 필수.
- **3-Statement 미정합**: P&L Net Income 이 BS Equity 변화와 불일치 — 모델 오류.
- **Sensitivity 부재**: 단일 valuation 수치만 — 가정 불확실성 미반영.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 13. Damodaran + Pignataro + Wall Street Prep 정전. 3-Statement + DCF + Scenario + Sensitivity + sample (VAIS Enterprise H2 가설) + checklist 8 + anti-pattern 7 |
