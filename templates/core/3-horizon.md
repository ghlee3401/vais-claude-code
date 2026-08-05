---
artifact: 3-horizon
owner_agent: roadmap-author
phase: core
canon_source: "Baghai, Coley, White 'The Alchemy of Growth' (1999), Perseus + McKinsey 'Three Horizons of Growth' framework"
execution:
  policy: always
  intent: portfolio-balance
  prereq: [strategy-kernel]
  required_after: [okr, roadmap]
  trigger_events: []
  scope_conditions: []
template_depth: filled-sample-with-checklist
review_recommended: false
project_context_reason: "Core 단계 다섯 번째 산출물 — 단일 OKR/Roadmap 으로는 단기 (H1) 만 다뤄 장기 성장 (H2/H3) 이 invisible. 3-Horizon 은 portfolio 차원 자원 배분 (70:20:10) 을 명시화."
---

# 3-Horizon Model (McKinsey)

> **canon**: Baghai, Coley, White *The Alchemy of Growth* (1999) — McKinsey 컨설턴트가 200+ 회사 분석 후 도출한 성장 portfolio 프레임워크.
>
> **핵심**: 회사·제품 활동을 **3 개 시간축 (Horizon)** 으로 분리해 자원·인재·KPI 를 차별화 — 단일 KPI 로 모든 활동을 평가하면 H2/H3 (미래 성장) 이 H1 (현재 수익) 에 잡아먹힘.
>
> **자원 배분 권장**: H1 70% / H2 20% / H3 10% (Google 의 70:20:10 도 같은 사상). 단계마다 전혀 다른 metrics — H1 은 ROI, H3 는 옵션 가치.

---

## 3 Horizons 정의

| Horizon | 시간축 | 정의 | 목표 | 측정 |
|:-------:|:------:|------|------|------|
| **H1** | 0~12 개월 | 현재 핵심 사업 — 매출·이익 즉시 발생 | extend & defend | ROI / 매출 / 이익률 |
| **H2** | 1~3 년 | 부상하는 사업 — 빠른 성장, 미흡한 수익 | build | 매출 성장률 / 고객 획득률 |
| **H3** | 3~7 년 | 미래 옵션 — 실험·연구·투자 | seed | 학습량 / 옵션 검증 / 가설 통과율 |

---

## 구조

### Horizon 1 — Extend & Defend (0~12 개월)

| 항목 | 내용 |
|------|------|
| **핵심 사업** | (현재 매출의 80%+ 를 차지하는 제품·세그먼트) |
| **목표** | (현재 사업 강화 — 시장 점유율·운영 효율) |
| **자원 비중** | 70% |
| **KPI** | (ROI, 매출, churn, NPS 등 lagging) |
| **주요 활동** | 1~3 개 |

### Horizon 2 — Build (1~3 년)

| 항목 | 내용 |
|------|------|
| **부상 사업** | (현재 수익은 적지만 빠르게 성장 중인 사업) |
| **목표** | (확장 가능한 비즈니스 모델 검증 + 시장 점유) |
| **자원 비중** | 20% |
| **KPI** | (매출 성장률, customer cohort retention, 단위 경제성) |
| **주요 활동** | 1~3 개 |

### Horizon 3 — Seed (3~7 년)

| 항목 | 내용 |
|------|------|
| **미래 옵션** | (현재 매출 거의 없음. 가설·실험 단계) |
| **목표** | (옵션 가치 확보 — 미래에 H1/H2 가 될 후보 확보) |
| **자원 비중** | 10% |
| **KPI** | (가설 검증율, 학습 속도, 실험 수, 핵심 가정 통과율) |
| **주요 활동** | 1~3 개 (실험 / 인수 / 파트너십) |

---

## (작성된 sample)

**제품**: VAIS Code | **작성일**: 2026-04-25

### Horizon 1 — Extend & Defend (2026 Q2~Q4)

| 항목 | 내용 |
|------|------|
| **핵심 사업** | Claude Code marketplace plugin (vais-code) — 6 C-Level + 44 sub-agent 오케스트레이션 |
| **목표** | Sprint 1~14 GA 도달 + 우선 25 template (depth c) 완성 + 외부 사용자 5~7 명 인터뷰 |
| **자원 비중** | 70% (이근호 1 인 + Claude Opus) |
| **KPI** | (a) marketplace 설치 수 → 100+ / (b) NPS ≥ 40 / (c) 회귀 테스트 263+ pass |
| **주요 활동** | 1) Sprint 4~6 templates Core+Why / 2) Sprint 7~10 sub-agent audit + 신규 5 / 3) Sprint 11~14 alignment + 외부 인터뷰 |

### Horizon 2 — Build (2027 Q1~2028 Q4)

| 항목 | 내용 |
|------|------|
| **부상 사업** | (a) 50+ template 카탈로그 OSS 표준화 + (b) NCSOFT 음성기술팀 사내 도입 (Beta-2) |
| **목표** | OSS 커뮤니티 PR 기여자 50+ / 사내 1 팀 정착 → 2 팀 확산 / 카탈로그 매출 모델 검증 |
| **자원 비중** | 20% (community ops + enterprise PoC) |
| **KPI** | (a) PR contributor 50+ / (b) 사내 도입 팀 수 / (c) 카탈로그 다운로드율 |
| **주요 활동** | 1) OSS 컨트리뷰션 가이드 / 2) NCSOFT 음성기술팀 적용 사례 publish / 3) enterprise 버전 가설 검증 (사내 정전 + 회사별 카탈로그) |

### Horizon 3 — Seed (2029~2032)

| 항목 | 내용 |
|------|------|
| **미래 옵션** | (a) "사내 정전 (회사별 표준 + 외부 정전 혼합) 자동 흡수" 메커니즘 / (b) 다른 IDE/AI 플랫폼 포팅 (Cursor, Copilot, Windsurf) / (c) 산업별 specialization (게임·헬스케어·핀테크) |
| **목표** | 옵션 가치 확보 — 어느 하나가 H2 로 부상할 수 있도록 가설 검증 |
| **자원 비중** | 10% (실험 + 인수 검토) |
| **KPI** | (a) 가설 통과율 / (b) 옵션 1 개당 학습 비용 / (c) 산업별 도메인 정전 정확도 |
| **주요 활동** | 1) 사내 정전 흡수 PoC (이번 피처 absorb-analyzer 확장) / 2) Cursor/Windsurf 호환성 실험 / 3) 게임 산업 도메인 정전 카탈로그 prototyping |

→ **70:20:10 검증**: 본 작성 시점 자원은 H1 ~85% (이근호 시간 대부분), H2 ~10% (NCSOFT 음성기술팀 자연 도입), H3 ~5% (실험 부재). H3 가 부족 — 향후 분기마다 1 개씩 H3 옵션 실험 추가 필요.

---

## 작성 체크리스트

- [ ] H1/H2/H3 각각이 **다른 시간축** (0~12 개월 / 1~3 년 / 3~7 년) 을 다루는가?
- [ ] 각 Horizon 마다 **다른 KPI** 가 정의되어 있는가? (H1=ROI / H2=성장률 / H3=학습)
- [ ] 자원 비중 70:20:10 (또는 변형) 이 명시되어 있는가?
- [ ] H1 활동이 **현재 매출의 80%+** 를 차지하는 핵심 사업과 직결되는가?
- [ ] H2 가 **수익 < 성장** 단계의 부상 사업인가? (이미 수익 = H1 / 가설 단계 = H3)
- [ ] H3 가 **옵션 가치** 로 평가되는가? (ROI 로 평가하면 모든 H3 가 즉시 폐기됨 — Christensen *Innovator's Dilemma*)
- [ ] Strategy Kernel (`prereq`) 의 Guiding Policy 가 H1/H2/H3 자원 배분과 정합하는가?
- [ ] OKR (`required_after`) 의 Objective 가 주로 H1 + 일부 H2 를 다루는가? (H3 는 OKR 보다 옵션 메트릭 적합)

---

## ⚠ Anti-pattern

- **단일 KPI 적용**: 모든 Horizon 을 ROI 또는 매출로 평가 — H3 (가설 단계) 가 즉시 폐기됨. *Innovator's Dilemma* (Christensen) 의 핵심 경고: 기존 KPI 로 미래 사업을 평가하면 항상 손해.
- **H1 만 존재**: "지금 매출 나는 것만 한다" — 단기 효율적이지만 5 년 후 사업 소멸. McKinsey 200+ 회사 분석: H1-only 회사는 평균 8 년 내 정체.
- **H3 자원 부재**: "H3 는 좋은데 자원이 없다" — 자원 = 우선순위. H3 에 0% 배분은 미래 포기 선언. 최소 5~10% 명시.
- **H2 와 H3 혼동**: 가설 검증도 안 된 사업을 H2 로 분류해 기대 수익 KPI 부여 → 실패 시 즉시 폐기. H2 진입 기준은 "비즈니스 모델 가설 검증 완료".
- **Time horizon 짧음**: H3 를 "1~2 년" 으로 잡음 — 그건 H2. H3 는 3~7 년 이상이어야 옵션 가치 사고 가능. 짧은 horizon = R&D 가 분기 KPI 압력 받음.
- **자원 비중 미명시**: "셋 다 균형 있게" — 결과: 모든 시간 H1 에 쓰임 (긴급함이 중요함을 이김). 70:20:10 명시적 commitment 필요.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — Sprint 4 Day 5. design draft 미존재 → Baghai/Coley/White *The Alchemy of Growth* + Christensen *Innovator's Dilemma* 정전 기반 직접 작성. 3 Horizon 표 + sample (VAIS H1/H2/H3) + 70:20:10 검증 단락 + 작성 체크리스트 8 + anti-pattern 6 |
