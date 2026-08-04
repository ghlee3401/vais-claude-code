---
artifact: hypothesis
owner_agent: product-discoverer
phase: what
canon_source: "Marty Cagan 'Inspired' (2017), Wiley Ch.8 — 8 Risk Categories framework + Cagan & Jones 'Empowered' (2020) — Product Risks"
execution:
  policy: always
  intent: risk-hypothesis
  prereq: []
  required_after: [experiment-design, prd]
  trigger_events: []
  scope_conditions: []
template_depth: filled-sample-with-checklist
review_recommended: false
project_context_reason: "What 단계 — Cagan 의 8 risk categories 기반 가설 분류. PRD 작성 전 risks 사전 식별 + experiment-design.md 의 입력. opportunity-solution-tree 와 병렬 작성."
---

# Hypothesis (Cagan 8 Risk Categories)

> **canon**: Marty Cagan *Inspired* (2017) Ch.8 + *Empowered* (Cagan & Jones, 2020) — product 의 8 가지 risk category. 각 category 별 가설 (hypothesis) 을 명시적으로 식별 → experiment 로 검증.
>
> **8 Risk Categories**: Value / Usability / Feasibility / Business / Ethical / Security / Regulatory / Strategic Fit.

---

## 8 Risk Categories

| # | Category | 정의 | 책임 sub-agent |
|:-:|----------|------|----------------|
| 1 | **Value** | 고객이 충분히 원하는가 (사용·구매) | product-discoverer + customer-segmentation-analyst |
| 2 | **Usability** | 고객이 어떻게 사용하는지 알 수 있는가 | ux-researcher + ui-designer |
| 3 | **Feasibility** | 우리가 실제 만들 수 있는가 (기술·시간·비용) | infra-architect + backend-engineer |
| 4 | **Business** | 비즈니스 모델 + 단위 경제성 정합 | financial-modeler + unit-economics-analyst |
| 5 | **Ethical** | 사회·윤리적 영향 (privacy, bias, harm) | compliance-auditor |
| 6 | **Security** | 공격 표면 + 데이터 보호 | security-auditor |
| 7 | **Regulatory** | 규제·법무 (GDPR, AI Act, 산업별) | compliance-auditor |
| 8 | **Strategic Fit** | Vision/Strategy 와의 정렬 | strategy-kernel-author |

---

## Hypothesis Statement Format

> "We believe [solution] is [strong/weak] in [risk category] because [evidence]. To validate, we will [experiment method]."

| # | Risk Category | Hypothesis | Evidence Required | Test Method | Success Criteria |
|:-:|--------------|-----------|-------------------|-------------|------------------|
| 1 | Value | ... | (인터뷰 / 사용 데이터) | (interview / smoke test) | (정량 임계) |
| 2 | Usability | ... | (think-aloud / heatmap) | (usability test) | (성공률 N%+) |
| ... | ... | ... | ... | ... | ... |

---

## (작성된 sample)

**Product**: VAIS Code v1.0 GA | **시점**: 2026-Q2 (Sprint 11)

| # | Risk | Hypothesis | Evidence Required | Test Method | Success Criteria |
|:-:|------|-----------|-------------------|-------------|------------------|
| 1 | **Value** | "솔로 빌더가 정전 출처 명시 산출물에 충분한 가치를 느낀다" | 외부 인터뷰 N=5~7 (Sprint 14) | EXP-5 user interviews | 5/7 명이 "다시 사용" 의도 표현 |
| 2 | **Usability** | "Profile 12 변수 입력이 직관적 (학습 비용 감당 가능)" | think-aloud N=3 (Sprint 5~6 권장) | EXP-2 usability test | 3/3 명이 5분 내 완성 + 2/3 anti-pattern 인지 |
| 3 | **Feasibility** | "50+ template depth-c 작성이 14~22주 내 가능" | 5 파일럿 측정 (Sprint 4~6 ✅) | RA-3 measurement | 평균 ≤ 1.5일/template — 측정값 ~75초 ✅ (대폭 단축) |
| 4 | **Business** | "OSS 무료 → enterprise 버전 전환 가능 (H2 2027)" | NCSOFT 사내 도입 사례 + enterprise PoC | Beta-2 + Enterprise PoC | 1+ enterprise contract by 2027 H2 |
| 5 | **Ethical** | "정전 출처 강제로 AI hallucination + bias 완화" | 정전 매핑 정확도 검증 | random sample 10 audit | 10/10 정전 출처 정확 |
| 6 | **Security** | "profile.yaml + Profile 기반 게이트가 secret 노출 + path traversal 방지" | T-01~T-07 (Sprint 1~3 ✅) | integration test | secret/path 차단 100% ✅ |
| 7 | **Regulatory** | "OSS plugin 영역은 EU AI Act high-risk 미해당 (developer tooling)" | EU AI Act 분류 검토 + legal review | regulatory monitoring | 2027 시행 시 high-risk 미분류 |
| 8 | **Strategic Fit** | "Profile + 정전 카탈로그가 Vision BHAG (10만 솔로 빌더) 달성 핵심 메커니즘" | Vision/Strategy Kernel 매핑 | quarterly review | 분기 1회 정렬 검토 |

---

## 작성 체크리스트

- [ ] **8 risk categories 모두** 가설 식별되었는가? ("해당 없음" 회피 X — 명시적 면제 이유)
- [ ] 각 Hypothesis 가 **"We believe ___ is ___ in ___ because ___"** 형식인가?
- [ ] 각 Hypothesis 의 **Evidence Required** 가 명시되었는가? (인터뷰 N / 데이터 / 사례)
- [ ] 각 Hypothesis 의 **Test Method** 가 명시되었는가? (`experiment-design.md` 참조)
- [ ] **Success Criteria** 가 정량 임계 또는 binary 결과로 명시되었는가?
- [ ] **Strategic Fit** 가 Vision/Strategy 매핑되어 있는가?
- [ ] **Riskiest Assumption** 식별 — 8 risk 중 가장 위험한 1개 명시?
- [ ] 각 risk 의 **책임 sub-agent** 가 매핑되었는가?

---

## ⚠ Anti-pattern (Cagan 명시)

- **Risk 회피**: "다 괜찮을 것이다" — 8 risk 중 일부만 검토. **모든 8 categories** 명시적 평가.
- **Value risk 무시**: "기술 잘 만들면 사용자가 올 것이다" (build it and they will come) — Cagan 명시 경고. Value 가 가장 자주 fail.
- **Falsifiable 부재**: "사용자가 좋아할 것" — 반증 불가. 측정 가능한 임계치 필요.
- **Test Method 부재**: 가설만 작성하고 검증 방법 없음 — 단순 brainstorm.
- **Strategic Fit 무시**: 다른 7 risk 만 보고 Vision 정렬 검토 X — feature factory.
- **Ethical/Regulatory 단순**: GDPR / AI Act / privacy 무시 — 향후 사업 전환 시 비용 폭증. 사전 식별 필수.
- **단일 risk 책임**: 모든 risk 를 1 명이 책임 — 도메인 전문성 부족. 책임 sub-agent 매핑.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 11. Cagan *Inspired* (2017) Ch.8 + *Empowered* (2020) 정전. 8 risk categories + Hypothesis Statement format + sample (VAIS Code v1.0 GA — 8 risk 모두 평가) + checklist 8 + anti-pattern 7 |
