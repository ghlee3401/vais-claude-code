---
artifact: five-forces-analysis
owner_agent: market-researcher
phase: why
canon_source: "Michael Porter 'How Competitive Forces Shape Strategy' Harvard Business Review (1979) + Porter 'Competitive Strategy' (1980), Free Press"
execution:
  policy: scope
  intent: industry-attractiveness
  prereq: []
  required_after: [strategy-kernel]
  trigger_events: []
  scope_conditions:
    - field: market_position
      operator: IN
      value: [new-entry, expansion, competitive-pressure]
    - field: target_market
      operator: NOT_IN
      value: [internal-tool-only]
template_depth: filled-sample-with-checklist
review_recommended: false
project_context_reason: "Why 단계 — 진입 산업의 구조적 매력도 평가. scope: 신규 시장 진입 / 확장 / 경쟁 심화 상황에서만. 사내 도구는 skip. 1 회 분석 후 산업 변화 시 재작성."
---

# Porter's Five Forces Analysis

> **canon**: Michael Porter (Harvard Business School), "How Competitive Forces Shape Strategy", *Harvard Business Review* (1979 March/April) — 산업 매력도 (industry attractiveness) 결정 5 가지 구조적 힘. 1980 *Competitive Strategy* 단행본 확장.
>
> **목적**: "이 산업이 장기 수익성을 가질 수 있는 산업인가?" 판단. 5 force 의 합력이 **산업 평균 ROIC** 를 결정.
>
> **PEST 와 차이**: PEST 는 거시환경 (외부, 회사 통제 X), Five Forces 는 **산업 구조** (회사가 일부 영향 가능). PEST → Five Forces → SWOT 흐름.

---

## 5 Forces 구조

### 1. Threat of New Entrants (신규 진입자 위협)

| 항목 | 작성 가이드 |
|------|------------|
| 진입 장벽 | (자본 / 기술 / 규제 / 브랜드 / 유통망) |
| 규모 경제 | (기존 사업자 vs 신규의 비용 격차) |
| 전환 비용 | (고객이 다른 사업자로 옮길 비용) |
| 평가 | 높음 / 중간 / 낮음 — 위협도 |

### 2. Bargaining Power of Suppliers (공급자 교섭력)

| 항목 | 작성 가이드 |
|------|------------|
| 공급자 집중도 | (공급자 수 / 대안 가용성) |
| 차별화 정도 | (공급품의 대체 가능성) |
| 전방 통합 위협 | (공급자가 직접 우리 시장 진입 가능?) |
| 평가 | 높음 / 중간 / 낮음 |

### 3. Bargaining Power of Buyers (구매자 교섭력)

| 항목 | 작성 가이드 |
|------|------------|
| 구매자 집중도 | (소수 대형 vs 다수 소형) |
| 가격 민감도 | (구매자 입장의 본 제품 가격 비중) |
| 후방 통합 위협 | (구매자가 직접 만들 가능?) |
| 평가 | 높음 / 중간 / 낮음 |

### 4. Threat of Substitutes (대체재 위협)

| 항목 | 작성 가이드 |
|------|------------|
| 대체재 정의 | (다른 형태로 동일 욕구 해소하는 솔루션) |
| 가격·성능 비교 | (대체재의 cost/performance) |
| 전환 비용 | (대체재로 옮길 때 발생 비용) |
| 평가 | 높음 / 중간 / 낮음 |

### 5. Industry Rivalry (산업 내 경쟁)

| 항목 | 작성 가이드 |
|------|------------|
| 경쟁자 수·규모 | (시장 점유율 분포) |
| 산업 성장률 | (성장 시장 = 경쟁 완화 / 정체 시장 = 경쟁 격화) |
| 차별화 정도 | (제품 동질성 → 가격 경쟁) |
| 퇴출 장벽 | (산업 떠나기 어려운 자산 / 약속) |
| 평가 | 높음 / 중간 / 낮음 |

---

## (작성된 sample)

**산업**: AI Coding Assistant Plugin Market | **시점**: 2026-Q2

### 1. Threat of New Entrants

**위협도**: **높음** (낮은 진입 장벽)
- LLM API 접근성 — Anthropic / OpenAI 모두 API 공개
- Claude Code 마켓플레이스는 plugin 등록 진입 장벽 낮음
- 자본·기술·인프라 모두 minimal — 1 인 개발자도 plugin 등록 가능
- 차별화: **카탈로그·정전 매핑** 이 진입 장벽 (단순 prompt 는 1 일에 복제 가능, 50+ 정전 매핑은 수개월 큐레이션 필요)

### 2. Bargaining Power of Suppliers

**교섭력**: **매우 높음**
- LLM 공급자 = Anthropic (Claude API) — 사실상 monopoly 의존
- 가격 결정권 100% Anthropic — Token 비용 인상 시 직접 영향
- 대안: OpenAI / Google — 그러나 Claude Code 마켓플레이스 자체가 Anthropic 의존
- 완화: MCP 표준 채택 → 일부 LLM 독립성 확보. 그러나 marketplace 의존성은 유지

### 3. Bargaining Power of Buyers

**교섭력**: **낮음 (B2C OSS) ~ 중간 (B2B 기업)**
- B2C OSS 사용자: 개별 협상 X, take-it-or-leave-it
- B2B 기업 사용자 (NCSOFT 등): 소수 대형 — enterprise 가격 협상 가능
- 전환 비용: 낮음 — 다른 plugin 으로 1 일 내 이동 가능 → buyer 가 떠나기 쉬움 (lock-in 부재)

### 4. Threat of Substitutes

**위협도**: **높음**
- 대체재 1: ChatGPT / Claude.ai 직접 사용 — 비싸고 비효율적이지만 무료 plugin 대체 가능
- 대체재 2: Cursor / Windsurf — IDE 내장 AI 도구 (다른 layer 이지만 일부 use case 중복)
- 대체재 3: 사내 인적 컨설팅 — 정전 출처 명확, 비용 100x 비쌈
- 차별화: **C-Suite 시뮬레이션** + **정전 매핑** 의 결합은 대체재가 한 번에 못 함

### 5. Industry Rivalry

**경쟁 강도**: **중간 ~ 높음 (성장 중)**
- 경쟁자: AutoGPT / CrewAI / LangGraph — agent orchestration layer
- 그러나 본 산업 (AI C-Suite 시뮬레이션) 은 **2026 시점 거의 vacant** — first mover advantage
- 성장률: 매우 높음 (LLM 시장 + plugin 생태계 동반 성장) → 경쟁 완화
- 차별화: 도메인 특화 (소프트웨어 제품 라이프사이클) + 정전 출처 강제

→ **종합 산업 매력도**: **중간 (모호한 신호)**
- 매력 요인: low rivalry (vacant niche), high growth, first mover, defensible moat (카탈로그)
- 비매력 요인: 공급자 의존 (Anthropic), 신규 진입 위협 (낮은 장벽), 대체재 다양

→ **전략적 함의**: (1) 카탈로그 깊이 / 정전 매핑 → 신규 진입자 진입 장벽 강화 / (2) MCP 표준 채택 → Anthropic 의존성 감소 / (3) B2B enterprise 우선 → buyer lock-in 강화

---

## 작성 체크리스트

- [ ] 5 force 모두 작성되었는가? (어느 하나도 "해당 없음" 회피 X)
- [ ] 각 force 의 평가 (높음 / 중간 / 낮음) 와 **근거** 가 명시되었는가?
- [ ] 산업 정의가 명확한가? ("AI 산업" X — "AI Coding Assistant Plugin" 같이 구체)
- [ ] 본 회사·제품의 차별화 / 완화 전략이 각 force 에 대응하여 명시되었는가?
- [ ] **종합 매력도 + 전략적 함의** 가 결론에 있는가?
- [ ] 정량 데이터 (시장 규모 / 성장률 / 시장 점유율) 가 가능한 곳에 포함되었는가?
- [ ] Strategy Kernel (`required_after`) 의 Guiding Policy 가 5 forces 분석을 반영하는가?

---

## ⚠ Anti-pattern

- **모든 force 가 "중간"**: 분석 회피 신호. 명확한 위협 / 기회 식별 못 하면 분석 가치 X. 데이터 부족 시 명시 ("데이터 부족 — 추가 조사 필요").
- **회사 SWOT 으로 변질**: Five Forces 는 **산업 구조** 분석. "우리 회사의 강점은 X" 는 SWOT 영역. Five Forces 는 회사 무관 산업 자체 분석.
- **공급자·구매자 일반화**: "공급자가 많다" 만 적음 — 어느 공급자? 어느 비중? 가격 결정권은? 구체화 필요.
- **대체재 = 직접 경쟁자**: 같은 제품 카테고리는 Industry Rivalry. 대체재는 **다른 형태로 동일 욕구** 해소 (예: 자동차 ↔ 대중교통).
- **분석 후 전략 미연결**: 5 forces 분석으로 끝남 — Strategy Kernel·차별화 전략에 반영 X. **전략적 함의** 결론이 빠지면 단순 보고서.
- **6th Force 강제**: "정부 / 보완재" 6th force 추가 — Porter 거부. PESTLE 와 명확히 구분 영역.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — Sprint 5 Day 2. Porter HBR 1979 정전 + 5 forces 표 + sample (AI Coding Plugin 산업) + 종합 매력도 결론 + scope (사내 도구 제외) |
