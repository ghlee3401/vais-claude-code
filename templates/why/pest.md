---
artifact: pest-analysis
owner_agent: market-researcher
phase: why
canon_source: "Francis Aguilar 'Scanning the Business Environment' (1967), Macmillan — 원래 ETPS, 후일 PEST/PESTLE 로 확장"
execution:
  policy: scope
  intent: macro-environment-scan
  prereq: []
  required_after: [strategy-kernel]
  trigger_events: []
  scope_conditions:
    - field: target_market
      operator: IN
      value: [global, multi-country, regulated-industry]
    - field: timeline
      operator: ">="
      value: 12-months
template_depth: filled-sample-with-checklist
review_recommended: false
project_context_reason: "Why 단계 — 거시환경 변화 (정치·경제·사회·기술) 가 사업 가설에 영향. scope: 글로벌·다국가·규제 산업·12개월+ 장기 기획에서만 의미. 1인 OSS 플러그인은 skip."
---

# PEST Analysis

> **canon**: Francis Aguilar (Harvard Business School) *Scanning the Business Environment* (1967) — 원래 **ETPS** (Economic / Technical / Political / Social) 로 도입. 1980 년대 PEST 로 재배열, 이후 PESTLE (Legal / Environmental 추가) 로 확장.
>
> **목적**: 통제 불가능한 거시환경 변화를 사전에 식별하여 전략 가정 (assumption) 의 취약성 평가. **risk register 가 아닌 environment scan** — 위협만 보지 말고 기회도 보라.
>
> **PEST vs SWOT 구분**: SWOT 의 OT (Opportunity/Threat) 는 외부 요인이지만 **회사 시점**. PEST 는 **세계 시점** 으로 거시환경 자체를 그림. PEST → SWOT 의 OT 로 흐른다.

---

## 구조 (4 요인)

### Political (정치·정책·규제)

| 항목 | 작성 가이드 |
|------|------------|
| 정부 정책 변화 | (관련 산업 규제 / 보조금 / 세제) |
| 무역 정책 | (관세 / FTA / 수출입 제약) |
| 정치적 안정성 | (선거 주기 / 정권 변화 / 지정학적 리스크) |
| 산업 규제 동향 | (구체적 법안 / 시행 예정일) |

### Economic (경제)

| 항목 | 작성 가이드 |
|------|------------|
| 거시 경제 지표 | (GDP / 인플레이션 / 금리 / 환율) |
| 가처분 소득 | (목표 고객의 구매력 변화) |
| 경기 사이클 | (확장 / 정점 / 수축 / 저점 — 어느 단계?) |
| 산업별 경기 | (해당 산업의 매출 성장률 / 시장 규모) |

### Social (사회·문화)

| 항목 | 작성 가이드 |
|------|------------|
| 인구 통계 | (연령 / 성별 / 지역 분포 변화) |
| 라이프스타일 | (작업 방식 / 소비 패턴 / 가치관 변화) |
| 교육 수준 | (목표 시장의 디지털 리터러시 등) |
| 문화 트렌드 | (사회 운동 / 미디어 영향) |

### Technological (기술)

| 항목 | 작성 가이드 |
|------|------------|
| 신기술 출현 | (핵심 사업 영향 가능 5 년 내 기술) |
| 기술 채택률 | (목표 시장의 기술 수용성) |
| R&D 투자 | (산업별 R&D 강도 / 특허 동향) |
| 자동화·AI 영향 | (직업·산업 구조 변화 가능성) |

---

## (작성된 sample)

**제품**: VAIS Code (AI C-Suite Plugin) | **시점**: 2026-Q2

### Political

| 항목 | 내용 |
|------|------|
| AI 규제 | EU AI Act (2024 발효, 2026 본격 적용) — high-risk AI 분류. 본 플러그인은 "developer tooling" 영역으로 high-risk 미해당. **monitor only** |
| 데이터 주권 | 한국 개인정보보호법 / GDPR / CCPA — VAIS 는 로컬 파일 시스템 사용 (서버 X) 이므로 영향 minimal |
| OSS 정책 | 미국·EU 정부의 OSS 활용 가이드라인 강화 — 호재 |

### Economic

| 항목 | 내용 |
|------|------|
| AI 투자 사이클 | 2024~2026 AI 투자 정점기. 2027 이후 옥석 가리기. **VAIS GA (2026 Q3) 타이밍 적합** |
| 고금리 환경 | 스타트업 자금 조달 어려움 → 1 인 빌더·소규모 팀 증가 (VAIS 의 P1 페르소나 시장 확대) |
| 한국 IT 매출 | 2026 GDP 대비 IT 비중 증가 추세 — 사내 도입 (NCSOFT 음성기술팀) 환경 양호 |

### Social

| 항목 | 내용 |
|------|------|
| 1 인 창업 트렌드 | 2026 솔로 빌더 급증 (no-code + AI 도구 결합) — VAIS Core Purpose 와 정렬 |
| AI 도구 거부감 | "AI 가 모든 것을 자동화" 에 대한 피로 → "사용자 주권" (VAIS Core Value 2) 차별화 가능 |
| OSS 기여 문화 | GitHub Star 와 PR 기여가 채용·경력에 영향 — H2 OSS 커뮤니티 빌딩 가능성 |

### Technological

| 항목 | 내용 |
|------|------|
| LLM 발전 속도 | Claude 4.x / GPT-5 / Gemini 2.x — 2026 기준 1M context 안정. **VAIS 의 multi-agent orchestration 가능 layer 형성** |
| Claude Code 생태계 | 마켓플레이스 출시 (2025 Q4) → plugin 생태계 초기. **first mover 가능** |
| MCP 표준 | Anthropic MCP (Model Context Protocol) 표준 확산 중 — VAIS 가 MCP 서버 통합 가능 |
| AI 코드 도구 경쟁 | Cursor / Windsurf / Copilot 활발 — VAIS 는 "C-Suite 시뮬레이션" 도메인 특화로 정체성 차별 |

→ **요약**: P (중립) / E (호재) / S (호재) / T (호재) — 거시환경은 본 피처 GA 타이밍에 우호적. 다만 **AI 규제 강화 시점 (2027~) 전 GA** 가 critical.

---

## 작성 체크리스트

- [ ] 4 요인 (P/E/S/T) 모두 작성되었는가? (어느 하나도 "해당 없음" 단순 처리 X)
- [ ] 각 요인에 **구체적 수치·법안·시행일·기관명** 등 검증 가능한 데이터가 포함되어 있는가?
- [ ] 위협뿐 아니라 **기회** 도 식별했는가? (PEST 의 양면성)
- [ ] 분석 시점이 명시되어 있는가? (PEST 는 시간 의존적 — 1 년 후 다시 작성 필요)
- [ ] 제품·시장·산업 범위가 정의되어 있는가? (글로벌? 한국? B2B? B2C?)
- [ ] 각 항목의 영향도가 명시되었는가? (호재 / 중립 / 악재 / 모니터링 only)
- [ ] SWOT 의 Opportunities/Threats 로 어떻게 흐르는지 의도적으로 매핑했는가?
- [ ] 정전 출처 (Aguilar 1967) 가 frontmatter 에 명시되어 있는가?

---

## ⚠ Anti-pattern

- **Wikipedia 복붙**: "EU 의 GDP 는 X 조 달러" 같은 보편 사실 나열 — 본 사업·제품과의 연결 없음. PEST 는 **이 제품에 미치는 영향** 을 분석.
- **악재만 나열**: PEST 를 risk register 로 오용. 거시환경은 **양방향** — 동일 기술 변화가 한 회사엔 위협, 다른 회사엔 기회.
- **수치 부재**: "정부가 AI 규제 강화 중" — 어떤 법안? 시행일? 본 사업 영향 정량? 검증 불가능한 진술은 분석이 아님.
- **6 요인 PESTLE 강제**: 1 인 OSS 플러그인이 Legal·Environmental 까지 작성 → 빈 칸 채우기. **본 사업과 무관한 요인은 명시적으로 "해당 없음 + 이유"** 로 적되, 단순 회피 X.
- **분석 후 미반영**: PEST 작성하고 Strategy Kernel·OKR 에 반영 X — 작성 자체가 목적이 됨. PEST 는 **전략 가정 검증** 도구이므로 결과가 후속 산출물에 흘러야 함.
- **시점 미명시**: PEST 는 1 년 후면 거의 무효화. 작성 시점·재작성 주기 (예: 분기 갱신) 명시 필요.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — Sprint 5 Day 1. Aguilar 1967 ETPS 정전 + Wikipedia/HBR PEST 변형 + scope_conditions (글로벌·다국가·규제·12개월+) — 1 인 OSS skip 정당화 |
