---
artifact: lean-canvas
owner_agent: product-strategist
phase: what
canon_source: "Ash Maurya 'Running Lean' (2012), O'Reilly + 'Scaling Lean' (2016) — 9-block Business Model Canvas adaptation for early-stage products"
execution:
  policy: scope
  intent: business-model-validation
  prereq: [vision-statement]
  required_after: [strategy-kernel, prd]
  trigger_events: []
  scope_conditions:
    - field: timeline
      operator: IN
      value: [pre-pmf, mvp, early-stage, validation]
template_depth: filled-sample-with-checklist
review_recommended: false
project_context_reason: "What 단계 — pre-PMF 단계의 가설 정렬. 기존 사업이거나 PMF 검증 완료 시 Strategy Kernel + PRD 가 더 적합. 1 페이지 9 블록 형태로 빠른 가설 visualization."
---

# Lean Canvas

> **canon**: Ash Maurya *Running Lean* (2012), O'Reilly Ch.3 — Osterwalder Business Model Canvas 의 startup-friendly 변형. 9 블록 1 페이지로 비즈니스 모델 가설을 가시화.
>
> **Lean Canvas vs Business Model Canvas (Osterwalder)**: Maurya 가 Key Partners → Problem, Key Activities → Solution, Key Resources → Key Metrics, Customer Relationships → Unfair Advantage 로 교체. 초기 단계 가설 검증에 더 적합.
>
> **VPC vs Lean Canvas**: VPC 는 Customer Profile + Value Map 의 fit 분석 (zoom-in). Lean Canvas 는 비즈니스 모델 전체 (zoom-out). 둘 다 작성 권장.

---

## 9 Blocks

| # | Block | 정의 | 작성 가이드 |
|:-:|-------|------|------------|
| 1 | **Problem** | 고객의 상위 3개 통증 + 현재 대안 | 측정 가능한 통증 + 대안의 한계 |
| 2 | **Solution** | 각 Problem 에 대응하는 상위 3개 솔루션 | 기능이 아닌 outcome 중심 |
| 3 | **UVP** (Unique Value Proposition) | 1줄 차별화 메시지 | "For X, Y is the Z that..." |
| 4 | **Unfair Advantage** | 경쟁사가 쉽게 복제 X 한 자산 | (브랜드/IP/네트워크 효과/도메인 전문성) |
| 5 | **Customer Segments** | 1차 타겟 + Early Adopter 정의 | 1 segment 부터 시작 (focused) |
| 6 | **Channels** | 고객 도달 경로 | (마케팅 / 판매 / 지원 채널) |
| 7 | **Revenue Streams** | 수익 모델 | (subscription / one-time / freemium / 광고) |
| 8 | **Cost Structure** | 고정비 + 변동비 + CAC | (개발비 / 운영비 / 마케팅 cost) |
| 9 | **Key Metrics** | 비즈니스 핵심 지표 (AARRR) | (Acquisition / Activation / Retention / Revenue / Referral) |

---

## 작성 순서 (Maurya 권장)

1. Customer Segments (5) — 누구?
2. Problem (1) — 어떤 통증?
3. UVP (3) — 왜 우리?
4. Solution (2) — 어떻게?
5. Channels (6) — 어디서?
6. Revenue Streams (7) → Cost Structure (8) — 경제성?
7. Key Metrics (9) — 무엇을 측정?
8. Unfair Advantage (4) — 차별화?

---

## (작성된 sample)

**제품**: VAIS Code v1.0 GA | **시점**: 2026-Q3

| Block | 내용 |
|-------|------|
| **1. Problem** | (a) 1인 빌더는 PRD/아키텍처/GTM 영역 전반 못 챙김 (Extreme) / (b) ChatGPT 산출물 정전 출처 부재 — 신뢰 의심 (Extreme) / (c) 매번 prompt 재구성 — context 손실 (Moderate) — **현재 대안**: ChatGPT Pro / Cursor / 인적 컨설팅 (각 부족) |
| **2. Solution** | (a) 6 C-Level + 44 sub-agent 도메인 분담 / (b) 50+ template 정전 출처 frontmatter 강제 / (c) clevel-coexistence + sub-doc 보존 — Profile 1회 합의로 모든 sub-agent 자동 정렬 |
| **3. UVP** | "For 솔로 빌더 + 소규모 팀 PM, VAIS Code is AI C-Suite Plugin that delivers canon-grounded artifacts matched to your project profile — unlike generic AI tools producing arbitrary formats with no workflow continuity" |
| **4. Unfair Advantage** | (a) 50+ 산출물 ↔ ~30 정전 cross-reference 큐레이션 — 수개월 작업 / (b) clevel-coexistence + sub-doc 보존 메타-아키텍처 — 단순 prompt 복제 X / (c) 1M context Opus 4.x 활용 |
| **5. Customer Segments** | **Primary**: 1인 SaaS 창업자 (P1, 김지원) / **Secondary**: 스타트업 CTO (P2) + 엔터프라이즈 PM (P3) / **Early Adopter**: NCSOFT 음성기술팀 (Beta-2 후보) |
| **6. Channels** | OSS GitHub (organic) + Claude Code marketplace (Anthropic 공식) + 사내 도입 (NCSOFT) + Lenny Newsletter / Indie Hackers (콘텐츠) |
| **7. Revenue Streams** | OSS 무료 (현재) → Enterprise 버전 (사내 정전 + 회사별 카탈로그, 2027 H2) → SaaS hosted (option, 2028 H2) |
| **8. Cost Structure** | 고정비: 0 (1인 운영) / 변동비: Anthropic API token cost (사용자 부담) / 마케팅: organic only |
| **9. Key Metrics** | **Acquisition**: marketplace install / **Activation**: ideation 첫 완료 / **Retention**: 3 sprint+ 사용자 / **Revenue**: enterprise contract count / **Referral**: PR contributor count → North Star: **30분 내 정전 출처 명시 PRD 완성한 활성 사용자 수** |

---

## 작성 체크리스트

- [ ] 9 블록 **모두** 작성되었는가? (어느 하나 빈칸 X)
- [ ] Problem 의 **상위 3개** + **현재 대안** 이 명시되었는가?
- [ ] UVP 가 **"For X, Y is the Z that..."** 형식인가?
- [ ] Customer Segments 에 **Early Adopter** 가 명시되었는가? (Maurya 강조)
- [ ] Revenue Streams 와 Cost Structure 의 **경제성 방향** (수익 > 비용 가능성) 이 평가되었는가?
- [ ] Key Metrics 가 AARRR 5단계 중 **3개 이상** 포함하는가?
- [ ] Unfair Advantage 가 정말 **복제 어려운가**? (단순 기능 우위 X)
- [ ] Vision Statement (`prereq`) + Strategy Kernel 의 Guiding Policy 와 정렬되는가?

---

## ⚠ Anti-pattern (Maurya 명시)

- **Problem 회피**: "고객이 기능 X 를 원한다" — 기능은 Solution 영역. Problem 은 **고객의 통증** 자체.
- **모든 세그먼트**: "B2B + B2C + 모든 산업" — focused 부재. **1 segment 부터 시작** + Early Adopter 1명 명시 (Maurya).
- **Unfair Advantage = 기능 우위**: "더 빠른 / 더 좋은" — 1주에 복제 가능. 진짜 unfair 는 **자산** (브랜드/IP/네트워크/도메인 전문성).
- **Cost Structure 추상**: "운영비, 마케팅비" — 구체 수치 부재 시 경제성 평가 불가.
- **Key Metrics = Vanity Metrics**: 페이지뷰 / 다운로드 수 — actionable 하지 않음. AARRR Activation/Retention 같이 행동 변화 측정.
- **UVP 부정확**: "Best in class" / "Innovative" — 구체적 대안 + 차별점 명시 필요.
- **Channels = "마케팅"**: 채널 = 고객 도달 경로. "구글 광고 / OSS GitHub / 컨텐츠 마케팅" 같이 구체.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 11. Maurya *Running Lean* (2012) 정전 + 9 블록 + 작성 순서 (Maurya 권장) + sample (VAIS Code v1.0 GA) + checklist 8 + anti-pattern 7 |
