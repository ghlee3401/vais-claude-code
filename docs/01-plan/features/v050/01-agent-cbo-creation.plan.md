# Sub-plan 01 — CBO Agents Creation

> 상위: `../v050-full-overhaul.plan.md`
> 선행: 00
> 후행: 03, 06, 08

---

## 0. 목적

v0.49의 **CMO + CFO를 흡수**하는 새 C-Level `CBO (Chief Business Officer)`와 **10개 sub-agent**를 신설한다. Business layer로서 CEO 직속으로 GTM / Marketing / Finance / Unit Economics 전담.

CBO는 S-7(마케팅 GTM), S-8(사업 분석), S-1 Phase 2/6(풀 개발에서 시장분석 + GTM)의 핵심 주체다.

---

## 1. 만들 파일 (11개)

```
agents/cbo/
├── cbo.md                                   # C-Level 본체 (Opus)
├── market-researcher.md                     # Sonnet
├── customer-segmentation-analyst.md         # Sonnet
├── seo-analyst.md                           # Sonnet (CMO에서 흡수)
├── copy-writer.md                           # Sonnet (CMO에서 흡수)
├── growth-analyst.md                        # Sonnet (CMO에서 흡수)
├── pricing-analyst.md                       # Sonnet (CFO에서 흡수)
├── financial-modeler.md                     # Sonnet
├── unit-economics-analyst.md                # Sonnet
├── finops-analyst.md                        # Sonnet (CFO에서 흡수)
└── marketing-analytics-analyst.md           # Sonnet
```

**중요**: CMO/CFO 기존 파일을 그냥 옮기지 말고 **새로 쓴다**. v2 가이드의 I/O 계약, 프레임워크 목록, CBO orchestration style을 반영한 구조 필요.

---

## 2. CBO 본체 (`agents/cbo/cbo.md`)

### 2.1 Frontmatter (초안 — advisor 필드는 sub-plan 04에서 추가)
```yaml
---
name: cbo
model: opus
layer: business
description: Chief Business Officer — GTM, marketing, finance, pricing, unit economics orchestration
version: 0.50.0
agent-type: c-level
subAgents:
  - market-researcher
  - customer-segmentation-analyst
  - seo-analyst
  - copy-writer
  - growth-analyst
  - pricing-analyst
  - financial-modeler
  - unit-economics-analyst
  - finops-analyst
  - marketing-analytics-analyst
triggers:
  - gtm, marketing, seo, copy, growth, funnel
  - pricing, financial model, unit economics, CAC, LTV
  - cloud cost, finops, business analysis
---
```

### 2.2 본문 섹션 (최소)
1. **Role summary** — business layer 총괄, CMO+CFO 통합 경위, CEO 위임 수신
2. **Inputs** — CEO delegation, CPO PRD, CTO tech specs, market data, cloud billing
3. **Outputs** — GTM plan, marketing strategy docs, financial model, unit economics report, pricing strategy, cost optimization recommendations
4. **Sub-agent orchestration** (v2 가이드 기반):
   - **Plan phase**: `market-researcher` + `customer-segmentation-analyst` 병렬 → 시장 기회 + 세그먼트 정의
   - **Design phase**: `growth-analyst` + `copy-writer` + `pricing-analyst` + `financial-modeler` 병렬 → GTM/메시지/가격/재무 설계
   - **Do phase**: `seo-analyst` + `copy-writer` + `finops-analyst` + `unit-economics-analyst` + `marketing-analytics-analyst` 병렬 실행
   - **QA phase**: unit-economics 타당성(CAC ≤ 30% LTV), marketing ROI, 재무 모델 정합
   - **Report phase**: GTM 결과, 재무 건전성, 리스크, KPI를 investor/팀 발표용으로 합성
5. **Dependencies** — 없음 (CEO 직접 위임). S-7에서 CPO 완료 후 진입
6. **PDCA 5단계 템플릿 링크** — `templates/plan.template.md` 등 참조

---

## 3. Sub-agent 10개 사양

각 파일 공통 frontmatter 골격 (advisor는 04에서):
```yaml
---
name: {slug}
model: sonnet
layer: business
description: {1-line}
version: 0.50.0
agent-type: subagent
parent: cbo
triggers: [...]
---
```

### 3.1 `market-researcher.md`
- **Role**: 시장·경쟁 분석
- **Input**: 산업, 지역, 고객 세그먼트
- **Output**: 시장 분석 보고서, SWOT 매트릭스, TAM 추정
- **Frameworks**:
  - **PEST** — Political / Economic / Social / Tech 외부 환경
  - **SWOT** — Strengths / Weaknesses / Opportunities / Threats
  - **Porter 5 Forces** — supplier power / buyer power / rivalry / threat of substitutes / new entrants
  - **TAM/SAM/SOM** 산정 (top-down 인구 기반 + bottom-up 채널 도달 기반 교차검증)
- **산출 구조 템플릿**: Market overview → PEST → Competitor landscape → Porter 5F → SWOT → TAM/SAM/SOM → Trends & inflections → Strategic implications

### 3.2 `customer-segmentation-analyst.md`
- **Role**: 고객 세분화, 페르소나, 라이프사이클
- **Input**: 고객 데이터, 거래 이력, 설문/인터뷰 자료
- **Output**: 세그먼트 맵, 3~5 페르소나, RFM 분석 테이블
- **Frameworks**:
  - **RFM** — Recency / Frequency / Monetary (5x5x5 스코어)
  - **Lifecycle stages** — Awareness → Activation → Retention → Referral → Revenue → Resurrection (AARRR+R)
  - **Value tiers** — whales / core / casual / at-risk
  - **Jobs-to-be-Done** 인터뷰 구조
- **산출 구조**: 세그먼트 정의 기준 → RFM 분포 → 페르소나 카드 → 라이프사이클 맵 → 우선 세그먼트 추천

### 3.3 `seo-analyst.md`
- **Role**: SEO 감사 + 콘텐츠 마케팅 전략
- **Input**: 대상 사이트, 경쟁 사이트, 타겟 키워드
- **Output**: SEO 감사 리포트, 콘텐츠 캘린더, SEO 스코어 (목표 ≥80)
- **Frameworks**:
  - **On-page**: title / meta / H1-H3 / 본문 밀도 / alt / 내부 링크 / schema.org
  - **Off-page**: backlink 프로파일 / DA / anchor text / referring domains
  - **Technical SEO**: site speed (LCP<2.5s), mobile friendliness, structured data, sitemap.xml, robots.txt, Core Web Vitals, crawl budget
  - **Keyword research**: search volume / intent / difficulty / SERP features
  - **Content gap analysis**: 경쟁사 covered / 자사 missing
- **산출 구조**: 현 상태 스코어 → 이슈 분류(Critical/High/Medium/Low) → 키워드 전략 → 콘텐츠 캘린더 (3개월) → 기대 트래픽 lift

### 3.4 `copy-writer.md`
- **Role**: 카피라이팅 + 브랜드 포지셔닝
- **Input**: 페르소나, 제품 features, 경쟁 포지셔닝
- **Output**: 브랜드 포지셔닝 문서, 마케팅 카피 5~10종 (랜딩 히어로/서브 히어로/CTA/이메일 시퀀스 3~5통/앱스토어 설명)
- **Frameworks**:
  - **Value Proposition Canvas** (pain/gain/jobs ↔ pain relievers/gain creators/products)
  - **Tone & Voice ladder** (formality × warmth × authority)
  - **Brand Positioning statement** — "For [persona], [product] is the [category] that [diff from comp] because [reason to believe]"
  - **PAS / AIDA / BAB** 카피 프레임
  - **Benefit-driven messaging** (feature → benefit → outcome)
- **산출 구조**: 포지셔닝 statement → 톤 가이드 → 카피 변형 (각각에 A/B 변형 2종)

### 3.5 `growth-analyst.md`
- **Role**: 그로스 전략, GTM, 이메일 자동화, 퍼널 최적화
- **Input**: 비즈니스 목표, 고객 데이터, 채널 성과
- **Output**: GTM plan, 이메일 자동화 플로우, growth KPIs
- **Frameworks**:
  - **Growth loops** (user → action → reward → attract new user)
  - **Funnel optimization** (awareness → consideration → conversion → retention → referral)
  - **Email sequences** (welcome / activation / re-engagement / upsell / win-back)
  - **Growth metrics** (MoM growth, viral coefficient K, activation rate, D1/D7/D30 retention)
  - **North Star Metric** 정의
  - **PLG / SLG** 전략 선택
- **산출 구조**: 북극성 metric → growth loop 설계 → 퍼널 진단 → 채널 믹스 → 이메일 자동화 시퀀스 설계 → 12주 로드맵

### 3.6 `pricing-analyst.md`
- **Role**: Pricing 전략
- **Input**: 비용 구조, 경쟁 가격, 고객 WTP
- **Output**: Pricing 전략 문서, 매출 시뮬레이션 (Excel), feature ↔ tier 매핑
- **Frameworks**:
  - **Cost-plus** (cost + margin)
  - **Value-based** (Van Westendorp PSM — 4가지 가격 지점)
  - **Competitive** (market benchmark, positioning 맵)
  - **Tiering** (freemium / standard / pro / enterprise) + feature gating
  - **Bundling / Unbundling**
  - **Good-Better-Best (GBB)**
  - **Psychological pricing** (9-ending, decoy, anchoring)
- **산출 구조**: WTP 분석 → tier 설계 → feature matrix → 매출 시뮬 (3 시나리오: 보수/기본/낙관) → 가격 테스트 계획

### 3.7 `financial-modeler.md`
- **Role**: 3-Statement 모델 + DCF + 시나리오 + 투자자 자료
- **Input**: 매출 모델, 비용 구조, 성장 가정
- **Output**: 재무 모델 (Excel/CSV), 시나리오 분석, 투자자 덱 메트릭
- **Frameworks**:
  - **P&L (Income Statement)** — Revenue / COGS / Gross Margin / OpEx / EBITDA / Net Income
  - **Balance Sheet** — Assets / Liabilities / Equity
  - **Cash Flow Statement** — CFO / CFI / CFF / FCF
  - **DCF** (Discounted Cash Flow) — WACC 산정, terminal value
  - **Break-even analysis**
  - **5-year projection** + sensitivity (price/volume/cost 민감도)
  - **Scenario modeling** (Bear/Base/Bull)
- **산출 구조**: 가정 테이블 → 3-Statement (월간 → 연간) → DCF 밸류에이션 → 민감도 → Bear/Base/Bull → 투자자 KPI 요약

### 3.8 `unit-economics-analyst.md`
- **Role**: 단위 경제성 (CAC, LTV, Payback, Cohort, 마진)
- **Input**: 획득 비용, 고객 수익/생애가치, 이탈률
- **Output**: 단위 경제성 리포트, cohort 분석 표, CAC/LTV 벤치마크 비교
- **Frameworks**:
  - **CAC** (blended, paid-only, organic-only 분리)
  - **LTV** (단순 평균 vs. cohort-based vs. NPV-adjusted)
  - **Payback Period** (개월)
  - **LTV/CAC ratio** (목표 >3x)
  - **Cohort analysis** (획득 월별 retention + revenue 추적)
  - **Magic Number** (revenue growth / S&M spend)
  - **Contribution margin** per user
  - **SaaS metrics**: ARR, NRR (Net Revenue Retention), GRR (Gross Revenue Retention), Quick Ratio
- **산출 구조**: 현재 unit economics 스냅샷 → cohort 테이블 → 벤치마크 대비 → 개선 지렛대

### 3.9 `finops-analyst.md`
- **Role**: 클라우드 비용 분석/최적화
- **Input**: 클라우드 빌링 (AWS/GCP/Azure), 리소스 사용량
- **Output**: 비용 분석 리포트, 최적화 권고, 절감 추정
- **Frameworks**:
  - **Service 별 비용 분해** (compute/storage/network/database/data transfer)
  - **CapEx vs OpEx** 관점
  - **Reserved Instance / Savings Plan** vs On-demand vs Spot 포트폴리오
  - **Auto-scaling** 튜닝 (scale-out/in 정책, scheduled scaling)
  - **Right-sizing** (instance type 다운그레이드)
  - **Waste detection** (zombie resources, over-provisioned volumes, forgotten NAT gateways)
  - **FinOps Foundation 프레임워크** (Inform / Optimize / Operate)
  - **Tagging 전략** for cost allocation
- **산출 구조**: 현재 비용 breakdown → 상위 비용 driver → 최적화 항목 (effort × impact) → 예상 절감 ($/월) → 실행 로드맵

### 3.10 `marketing-analytics-analyst.md`
- **Role**: 마케팅 성과 + 멀티터치 어트리뷰션 + 채널 ROI
- **Input**: 마케팅 지출, 전환 데이터, 매출
- **Output**: 멀티터치 어트리뷰션 리포트, 채널 ROI, 효율 대시보드
- **Frameworks**:
  - **Attribution models**: First-touch / Last-touch / Linear / Time-decay / Position-based / Data-driven (Markov, Shapley)
  - **ROAS** (Return on Ad Spend) 계산
  - **Channel contribution matrix** (incremental vs. baseline)
  - **MER** (Marketing Efficiency Ratio) = revenue / marketing spend
  - **Funnel stage metrics** (CPM → CTR → CPC → CVR → CAC)
  - **Incrementality testing** (geo holdout, PSA tests)
  - **MMM** (Marketing Mix Modeling) 기초
- **산출 구조**: 채널별 spend/revenue → 어트리뷰션 비교 (5모델) → 채널별 ROI 랭킹 → 인크리멘탈리티 주석 → 최적 배분 권고

---

## 4. 진입 시 신경 쓸 점

### 4.1 선행에서 보장됨
- `vais.config.json`의 `cSuite.cbo.subAgents` 배열이 10개 이름 정확히 매칭
- `agents/` 디렉토리 쓰기 가능 상태

### 4.2 다음으로 넘길 보증
- `agents/cbo/*.md` 11개 모두 존재 + frontmatter 파싱 가능
- 10 sub-agent 모두 `model: sonnet`, `parent: cbo`, `agent-type: subagent` 일관
- `cbo.md`의 subAgents 배열과 실제 존재하는 파일명 100% 매칭
- 모든 sub-agent에 **Input / Output / Frameworks / 산출 구조** 4섹션 존재 (03/04/06에서 파싱)

### 4.3 함정
- **프레임워크 나열만으로 끝내지 말 것**: 각 프레임워크에 "언제 쓰는지, 산출물 형태" 한 줄 덧붙일 것. 실제 sub-agent 실행 시 LLM이 프레임워크 이름만 알면 얕은 결과가 나옴.
- **CBO orchestration의 parallel 실행**: CTO 본체의 병렬 호출 패턴(현재 frontend-engineer + backend-engineer + test-engineer 병렬)을 참고해서 일관된 스타일로 작성.
- **고유명사 충돌 주의**: `marketing-analytics-analyst` vs `growth-analyst` 경계 — marketing-analytics는 "attribution/ROI 측정", growth는 "전략 설계". 본문에 경계 명시.
- **pricing-analyst / financial-modeler / unit-economics-analyst 3각 관계**: pricing은 "가격 전략", financial-modeler는 "전체 P&L/Cash Flow", unit-economics는 "단위 경제성". frontmatter description에서 구분.

---

## 5. 검증

- [ ] `ls agents/cbo/*.md | wc -l` == 11
- [ ] 각 파일 frontmatter YAML 파싱 성공
- [ ] `grep -l "model: sonnet" agents/cbo/*.md | wc -l` == 10 (본체 제외)
- [ ] `grep "parent: cbo" agents/cbo/*.md | wc -l` == 10
- [ ] `scripts/vais-validate-plugin.js` 통과
- [ ] `agents/cbo/cbo.md`의 subAgents 배열 vs 디렉토리 파일 diff == 0

연결 SC: **SC-1**

---

## 6. 다음 단계

- sub-plan **03** (Shared Guards & Registry) — 01과 02 둘 다 완료 후 진입
- 병렬로 **02** (Existing C-Level Updates) 진행 가능
