---
artifact: swot-analysis
owner_agent: market-researcher
phase: why
canon_source: "Albert Humphrey, Stanford Research Institute (SRI), 1960s 'TAM' (Team Action Model) → SWOT 명명 (Heinz Weihrich 1982 'TOWS Matrix' 확장)"
execution:
  policy: always
  intent: position-assessment
  prereq: []
  required_after: [strategy-kernel]
  trigger_events: []
  scope_conditions: []
template_depth: filled-sample-with-checklist
review_recommended: true
project_context_reason: "Why 단계 — 회사·제품의 내부 (S/W) + 외부 (O/T) 통합 평가. Always 정책: 모든 프로젝트가 작성. review_recommended=true: 자기기만 (내부 약점 회피 / 외부 위협 부정) 위험."
---

# SWOT Analysis (+ TOWS Matrix)

> **canon**: Albert Humphrey (Stanford Research Institute), 1960s — Fortune 500 기업 전략 실패 원인 연구 ("TAM": Team Action Model). 1982 Heinz Weihrich *Long Range Planning* "The TOWS Matrix" 로 4-quadrant 매트릭스 + 전략 도출 단계 추가.
>
> **목적**: 회사 **내부** (Strengths / Weaknesses) 와 **외부** (Opportunities / Threats) 를 한 페이지에 통합 → 전략 옵션 도출 (TOWS).
>
> **review_recommended=true**: 1 인 작성 시 약점·위협 회피 위험. 외부 검토 또는 brainstorm 권장. Humphrey 원래 의도: **팀 토론 도구**.

---

## Part 1. SWOT Matrix (2x2)

|  | **Helpful** | **Harmful** |
|:-:|:-----------:|:-----------:|
| **Internal** | **Strengths** (강점) | **Weaknesses** (약점) |
| **External** | **Opportunities** (기회) | **Threats** (위협) |

### Strengths (내부 강점)

> **정의**: 통제 가능 + 경쟁 우위. 회사·팀·제품 자체의 우위 자원.

- [ ] (강점 1)
- [ ] (강점 2)

### Weaknesses (내부 약점)

> **정의**: 통제 가능 + 경쟁 열위. 개선 책임이 우리에게.

- [ ] (약점 1)
- [ ] (약점 2)

### Opportunities (외부 기회)

> **정의**: 통제 불가 + 활용 가능. PEST·Five Forces 결과 흐름.

- [ ] (기회 1)
- [ ] (기회 2)

### Threats (외부 위협)

> **정의**: 통제 불가 + 대응 필요. 무시 시 사업 위협.

- [ ] (위협 1)
- [ ] (위협 2)

---

## Part 2. TOWS Matrix (전략 도출 — Weihrich 1982)

> **목적**: SWOT 4 사분면 조합으로 4 가지 전략 옵션 생성. SWOT 가 "현황", TOWS 가 "행동".

| | **External: Opportunities** | **External: Threats** |
|:-:|:---------------------------:|:---------------------:|
| **Internal: Strengths** | **SO** (Maxi-Maxi) — 강점으로 기회 활용 | **ST** (Maxi-Mini) — 강점으로 위협 방어 |
| **Internal: Weaknesses** | **WO** (Mini-Maxi) — 약점 보완 + 기회 활용 | **WT** (Mini-Mini) — 약점·위협 동시 회피 |

| 전략 | 내용 | 우선순위 |
|------|------|:------:|
| **SO**: ... + ... → ... | (강점·기회 결합) | 높음 |
| **ST**: ... + ... → ... | (강점으로 위협 방어) | 중간 |
| **WO**: ... + ... → ... | (약점 보완 + 기회) | 중간 |
| **WT**: ... + ... → ... | (방어·축소) | 낮음 |

---

## (작성된 sample)

**제품**: VAIS Code | **시점**: 2026-Q2

### SWOT Matrix

#### Strengths
- 6 C-Level + 44 sub-agent 오케스트레이션 — 도메인 특화
- 정전 매핑 카탈로그 (50+ 산출물 × 정전 출처) 진행 중 — 큐레이션 moat
- clevel-coexistence + sub-doc 보존 등 메타-아키텍처 차별화
- 1 인 운영 → 빠른 피벗 가능
- Claude Opus 4.x 1M context 의 의사결정 추적성 우수

#### Weaknesses
- 1 인 운영 → bus factor = 1 (지속성 위험)
- 외부 사용자 검증 부재 (Sprint 11~14 까지) — RA-1 100% 미검증
- 마케팅 / GTM 레인 부재 — OSS 인지도 낮음
- 50+ template 작성 분량 부담 (RA-3) — Sprint 11~14 완료 추정 1 일 (보정 후) 이지만 사용자 검수 시간 미확보
- 카탈로그가 한국어 중심 — 글로벌 OSS 채택 장벽

#### Opportunities
- Claude Code 마켓플레이스 초기 (2025 Q4 출시) — first mover advantage
- LLM 1M context 안정 시점 (2026) — multi-agent orchestration 가능 layer 형성
- 1 인 창업 / 솔로 빌더 트렌드 급증 — VAIS P1 페르소나 시장 확대
- OSS 정전 카탈로그는 PR 기여자 친화적 → community contribution 선순환
- NCSOFT 사내 도입 가능성 (Beta-2 — 2026 Q3 후) → enterprise 사례

#### Threats
- Anthropic 정책 변화 / API 가격 인상 (공급자 risk)
- AutoGPT / CrewAI 가 도메인 특화 layer 추가 시 경쟁 (현재 generic 이지만 변경 가능)
- Cursor / Windsurf 등 IDE 도구가 PRD·아키텍처 generation 영역 확장 시 시장 잠식
- AI 규제 강화 (EU AI Act 2027~) — high-risk 분류 변경 시 영향
- 정전 출처 명시가 OSS 사용자에게 over-engineering 으로 받아들여질 risk

### TOWS Matrix

| 전략 | 내용 | 우선순위 |
|------|------|:------:|
| **SO**: 정전 카탈로그 (S) + 마켓플레이스 first mover (O) → **2026 Q3 GA + 카탈로그 OSS 공개** | OSS 컨트리뷰션 acceleration | 높음 |
| **SO**: clevel-coexistence (S) + 솔로 빌더 트렌드 (O) → **솔로 빌더 전용 documentation + 사례 publish** | P1 시장 직접 공략 | 높음 |
| **ST**: 정전 매핑 (S) + AutoGPT 경쟁 위협 (T) → **카탈로그 깊이 + 6 C-Level 도메인 특화 강조** | 차별화 강화 | 중간 |
| **ST**: 1M context (S) + Anthropic 의존 (T) → **MCP 표준 채택 → 일부 LLM 독립성 확보** | 공급자 risk 완화 | 중간 |
| **WO**: 1 인 운영 (W) + OSS 커뮤니티 (O) → **PR contributor 50+ 모집 + 분산 ownership** | bus factor 완화 | 높음 |
| **WO**: 외부 검증 부재 (W) + NCSOFT 도입 (O) → **Beta-2 사내 적용 → RA-1 1차 검증** | RA-1 가속 | 높음 |
| **WT**: 마케팅 부재 (W) + IDE 도구 확장 (T) → **명시적 포지셔닝 ("C-Suite 시뮬레이션", "AI 의수")** | 정체성 방어 | 중간 |
| **WT**: 한국어 중심 (W) + 글로벌 OSS 채택 장벽 (T) → **GA 후 영문 카탈로그 우선 작성** | global access 확보 | 낮음 (GA 후) |

→ **결론**: SO + WO 전략 6 개를 우선 실행. 특히 (a) 마켓플레이스 GA + (b) PR contributor 모집 + (c) NCSOFT 사내 도입을 **2026 Q3** 동시 추진.

---

## 작성 체크리스트

- [ ] 4 사분면 (S/W/O/T) 모두 **3 개 이상** 항목이 있는가? (1~2 개는 분석 부족 신호)
- [ ] Strengths 와 Weaknesses 가 **내부** 요인인가? (외부 = O/T)
- [ ] Opportunities 와 Threats 가 **외부** 요인인가? (내부 = S/W) — 자주 혼동
- [ ] PEST·Five Forces 분석 결과가 O/T 에 흘러들어와 있는가?
- [ ] 각 항목이 **검증 가능** 한가? ("우수한 팀" X — "정전 출처 명시 산출물 100%" 같이 측정 가능)
- [ ] TOWS 매트릭스로 **4 가지 전략 옵션** (SO/ST/WO/WT) 모두 도출했는가?
- [ ] 각 전략 옵션에 **우선순위** 가 부여되었는가?
- [ ] 자기기만 검토: 약점·위협을 회피하지 않았는가? (review_recommended=true 이유)

---

## ⚠ Anti-pattern

- **List Without Strategy**: SWOT 4 사분면만 작성하고 끝남 — 단순 brainstorm. **TOWS 단계 (전략 도출)** 가 빠지면 가치 50%.
- **내부·외부 혼동**: "경쟁사가 많다" 를 Weakness 로 분류 — 외부 (Threat) 임. "경쟁사 많음에 대응 못 하는 우리" 가 Weakness.
- **Helpful 편향**: Strengths 와 Opportunities 만 길게 작성 → 자기 만족적. Humphrey 원 의도: **팀 토론으로 약점·위협 직시**.
- **추상적 항목**: "혁신적 문화" / "글로벌 시장 진출" — 측정 불가 / 검증 불가. "정전 출처 명시 산출물 100%" / "EU AI Act 2027 시행 → high-risk 재분류 가능성" 같이 구체화.
- **PEST·Five Forces 분석 무관**: PEST·Five Forces 후 SWOT 작성하면 O/T 에 그 결과가 자연 흘러야 함. 따로 작성하면 일관성 결여.
- **분기/연도 부재**: SWOT 는 시점 의존적. 1 년 전 SWOT 로 2026 결정하면 stale. **분석 시점 + 재작성 주기** 명시.
- **Self Praise**: "최고의 팀" / "탁월한 기술" — 비교 기준 없는 자기 평가. Strengths 는 **경쟁자 대비** 우위.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 5 Day 3. Humphrey SRI + Weihrich 1982 TOWS 정전 + 2x2 매트릭스 + TOWS 전략 도출 단계 + sample (VAIS 2026 Q2 SWOT + 8 전략) + checklist 8 + anti-pattern 7 |
