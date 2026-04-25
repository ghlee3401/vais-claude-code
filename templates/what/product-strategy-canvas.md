---
artifact: product-strategy-canvas
owner_agent: product-strategist
phase: what
canon_source: "Marty Cagan 'Inspired' (2017), Wiley + 'Empowered' (Cagan & Jones, 2020) — Product Strategy Canvas 9 sections framework"
execution:
  policy: always
  intent: product-strategy-articulation
  prereq: [vision-statement, strategy-kernel]
  required_after: [prd, roadmap]
  trigger_events: []
  scope_conditions: []
template_depth: filled-sample-with-checklist
review_recommended: false
project_context_reason: "What 단계 — Vision/Strategy Kernel 입력을 product 차원의 9 섹션으로 구체화. PRD 와 다름: PRD 는 단일 feature, Product Strategy Canvas 는 product 전체."
---

# Product Strategy Canvas (Cagan)

> **canon**: Marty Cagan *Inspired* (2017), Ch.6~8 — Product Vision → Product Strategy → Product Roadmap 흐름. *Empowered* (2020) 에서 9 섹션 canvas 형태로 구체화.
>
> **Strategy Kernel (Rumelt) vs Product Strategy Canvas (Cagan)**: Rumelt 는 회사·사업 전략 (Diagnosis-Policy-Action). Cagan 은 product 전략 (Insight-Strategy-Execution-Outcome). Rumelt 는 What/Why, Cagan 은 How (product 차원).

---

## 9 Sections

| # | Section | 정의 |
|:-:|---------|------|
| 1 | **Insight** | 데이터 + 정성 조사로 발견한 핵심 통찰 1~3개 |
| 2 | **Strategy** | Insight 를 행동으로 변환하는 전략 (focus + bet) |
| 3 | **Objectives** | 분기·반기 목표 (OKR 의 O 와 정렬) |
| 4 | **Outcomes (KR)** | 목표 달성 측정 지표 |
| 5 | **Activities** | 진행 중·계획 중 product 작업 (시간 박스) |
| 6 | **Risks** | 가설 부재 / 외부 변화 / 의존성 |
| 7 | **Budget** | 시간 · 인력 · 비용 자원 |
| 8 | **Timeline** | 분기별 milestone (Now-Next-Later) |
| 9 | **Stakeholders** | 의사결정자 + 영향받는 팀 + 사용자 대표 |

---

## (작성된 sample)

**Product**: VAIS Code | **시점**: 2026-Q2~Q4

### 1. Insight

(a) 1인 빌더 시장이 LLM 1M context 안정화 (2026~) 에 따라 급증 — 그러나 generic AI 도구 (ChatGPT/Cursor) 는 **정전 출처 부재** + **맥락 무시 default-execute** 로 신뢰 부족. (b) Claude Code 마켓플레이스 (2025 Q4 출시) 는 plugin 생태계 초기 — first mover advantage 가능. (c) 정전 cross-reference 카탈로그 큐레이션은 수개월 작업이라 단순 prompt 복제 X — 자연 moat 형성.

### 2. Strategy

**Focus**: 솔로 빌더 + 소규모 팀 PM 에 한정. 엔터프라이즈는 H2 (2027~). **Bet**: 정전 출처 frontmatter 강제 + Profile 게이트 가 차별화 핵심. ChatGPT/Cursor 와 다른 layer ("AI C-Suite 시뮬레이션") 로 정체성. **Trade-off**: 다른 LLM 호환 / 다국어 / GUI 모두 H2~H3 로 미루고, Anthropic Claude + 한국어/영어 + CLI 만 GA.

### 3. Objectives (2026-Q2 ~ Q4)

- O1: VAIS sub-agent default-execute 패턴 해소
- O2: 50+ 정전 카탈로그 OSS 표준 진입
- O3: NCSOFT 음성기술팀 사내 도입 사례 확보 (Beta-2)

### 4. Outcomes (KR)

- KR1: Profile 게이트 skip 적중률 ≥ 95%
- KR2: 우선 25 templates depth-c 완성
- KR3: 44 sub-agent audit 4기준 통과
- KR4: alignment α 70%+ 감지율 (EXP-4)
- KR5: 외부 인터뷰 5~7명 RA-1 검증

### 5. Activities

- Sprint 1~3 ✅: Profile + Template metadata + audit 인프라
- Sprint 4~6 ✅: Core 5 + Why 6 templates + VPC 재매핑
- Sprint 7~8 ✅: 10 신규 sub-agent + release 5분해 + audit 매트릭스
- Sprint 9 ✅: 34 sub-agent Q-A/Q-B 마이그레이션
- Sprint 10~11 (현재): audit 보강 + What 7 templates
- Sprint 12 (예정): How 11 templates + Biz 5
- Sprint 13~14 (예정): Alignment 3 + 외부 인터뷰

### 6. Risks

| Risk | Severity | Mitigation |
|------|:--------:|-----------|
| R1 작업량 폭증 | High → Med (Sprint 4~9 측정 후) | 5 파일럿 측정 + partial Beta |
| R4 파괴적 변경 | Med | feature flag + deprecate alias |
| R5 외부 인터뷰 모집 지연 | Med | NCSOFT 사내 도입 → 자연 인터뷰 |

### 7. Budget

- 인력: 1 + Claude Opus 4.x (1M context)
- 비용: 0 고정 / Anthropic API (사용자 부담)
- 시간: GA 14 sprint (~14주, 단일 세션 단축 가능 — Sprint 4~9 ~50분)

### 8. Timeline (Now-Next-Later)

- **Now (2026-Q2)**: Sprint 10~14 GA 도달
- **Next (2026-Q3~Q4)**: Beta-2 (NCSOFT) + Beta-3 (외부 OSS)
- **Later (2027~)**: Enterprise 버전 + 사내 정전 흡수 + 다른 LLM 호환

### 9. Stakeholders

- 의사결정자: 이근호 (single owner)
- 영향: NCSOFT 음성기술팀 / Claude Code 사용자 / Anthropic
- 사용자 대표: 외부 인터뷰 5~7명 (Sprint 14)

---

## 작성 체크리스트

- [ ] 9 섹션 (Insight/Strategy/Objectives/Outcomes/Activities/Risks/Budget/Timeline/Stakeholders) **모두** 작성?
- [ ] Insight 가 **데이터 + 정성 조사** 기반인가? (직관 X)
- [ ] Strategy 의 **Trade-off** (포기하는 것) 가 명시되었는가?
- [ ] Objectives 가 **OKR 의 O** 와 정렬되는가?
- [ ] Outcomes 가 **측정 가능** 한 KR 인가?
- [ ] Activities 가 **시간 박스** (분기·반기) 로 명확한가?
- [ ] Risks 에 **Severity + Mitigation** 이 명시되었는가?
- [ ] Timeline 이 **Now-Next-Later** 형식인가?

---

## ⚠ Anti-pattern (Cagan 명시)

- **Insight 부재**: Strategy 부터 시작 — 가설 검증 부재. **Insight 가 Strategy 보다 선행**.
- **Activities = Roadmap**: 시간 박스 없는 단순 list. Activities 는 **분기 단위 commitment**.
- **모든 stakeholder**: "전 사용자" / "전 팀" — focused 부재. 의사결정자 1~2명 + 사용자 대표 5~7명.
- **Budget 회피**: "필요한 만큼" — 자원 = 우선순위. 시간/인력/비용 명시 필요.
- **Trade-off 부재**: "모든 것을 잘한다" — 전략 부재. **포기하는 영역 명시** 필요.
- **OKR 무관**: Objectives + Outcomes 가 회사 OKR 과 단절 — 부서 silo.
- **Risks 단순 나열**: Severity + Mitigation 없으면 risk register 무의미.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 11. Cagan *Inspired* (2017) + *Empowered* (2020) 정전. 9 섹션 + sample (VAIS Code 2026-Q2~Q4) + checklist 8 + anti-pattern 7 |
