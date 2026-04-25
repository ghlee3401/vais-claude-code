---
owner: cpo
topic: opportunity-tree
phase: design
feature: subagent-architecture-rethink
authors: [product-discoverer]
---

# Topic: Opportunity Solution Tree (CPO 큐레이션)

> Source: `_tmp/product-discoverer.md` (583 lines) → CPO 큐레이션으로 핵심만 합성.

## 1. Desired Outcome

VAIS 사용자가 sub-agent 호출 시 **Project Profile + 정책 게이트로 불필요한 산출물 차단** + **검증된 정전 기반 산출물 수령**.

측정 지표:
- default-execute 호출 비율: 0%
- 산출물 정책 준수율: 95%+
- 사용자 의도 외 파일 생성: 주 0회

## 2. Opportunity 우선순위

| 순위 | OPP | 통증 핵심 | Score (I × (1−S)) | 사용자 인용/관찰 |
|:----:|-----|----------|:------------------:|----------------|
| 1 | **OPP-8** | 분리 기준 비일관 — C-Level마다 다른 렌즈 | 5.6 | ideation T1 |
| 2 | **OPP-1** | Default-execute — "쓸데없이 CI/CD 만든다" | 5.1 | ideation T6 |
| 2 | **OPP-7** | 단계 간 alignment 누락 (Core↔Why↔What↔How) | 5.1 | KP-5 |
| 4 | OPP-3 | Template 부재 — AI 매번 포맷 발명 | 4.7 | KP-9 |
| 4 | OPP-4 | 프로젝트 미적합 산출물 (DPIA on internal-tool 등) | 4.7 | KP-11 |
| 6 | OPP-2 | 정체성 모호 (release-engineer "뭐하는지 모르겠다") | 3.6 | T6 |
| 7 | OPP-5 | 잘못된 매핑 (VPC → copy-writer) | 3.2 | KP-9 |
| 8 | OPP-6 | 중복 배치 (SWOT이 market-researcher·growth-analyst에 동시) | 2.9 | KP-1 |

## 3. Solution 매핑 (plan 채택 메커니즘과 정렬)

| OPP | 채택 솔루션 | 메커니즘 |
|-----|-----------|---------|
| OPP-8 | Sol-8-A: 4단계 프레임 + 메타-원칙 일관 적용 | 모든 sub-agent frontmatter에 `phase: [core\|why\|what\|how]` 추가 |
| OPP-1 | Sol-1-A: 정책 4분류 + Profile 게이트 (Sol-1-B fallback) | 호출 전 Profile 평가, B 정책 자동 skip |
| OPP-7 | Sol-7-A: α(auto-judge) + β(alignment 산출물) 조합 | C-Level 전환 시 키워드 일치율 + alignment-{from}-{to}.md |
| OPP-3 | Sol-3-A: Template depth (c) — sample+checklist+anti-pattern | (b) 깊이는 ideation에서 거부됨 |
| OPP-4 | Sol-4-A: Project Profile 1회 합의 → Scope 자동 평가 | 매 호출 파라미터 전달 부담 회피 |
| OPP-2 | Sol-2-A: Template metadata schema (artifact 명시) + 메타-원칙 | "산출물이 sub-agent 정의" |
| OPP-5 | Sol-5-B: 카탈로그 정전화 + owner_agent 역방향 선언 | 메타-원칙에 더 부합 |
| OPP-6 | Sol-8-A에 흡수 (분리 기준 일관화로 자동 해소) | — |

## 4. Experiments (do/qa phase 검증 실험)

| EXP | 가설 | 비용 | 우선순위 |
|-----|------|------|:--------:|
| **EXP-1** | Profile 게이트 동작 — local-only 프로파일에서 ci-cd-configurator skip | 30분 | 즉시 |
| **EXP-2** | depth (c) template 품질 비교 — 필수 5섹션 충족률 | 1시간 | 즉시 |
| **EXP-3** | 44 sub-agent Q-D 매핑 점검 — 불일치 ≥3건 발견 | 2~3시간 | 즉시 |
| **EXP-4** | alignment α 메커니즘 프로토타입 — 70% 감지율 | 4~8시간 | do 전 |
| **EXP-5** | 외부 인터뷰 — "쓸데없이 만든다" 통증 보편성 (5명 중 3명+) | 2~3주 | ux-researcher 분담 |

## 5. Risk Assumptions (Top 3 — 즉시 검증)

| 가정 | 카테고리 | 리스크 | 확신도 | 검증 방법 |
|------|---------|:------:|:------:|---------|
| Profile 게이트가 실제로 통증 해소하는가 | User Value | 상 | 중 | EXP-1 + EXP-5 |
| Profile 합의 UX가 직관적인가 (12 변수 인지부하) | Usability | 상 | 하 | think-aloud 3명 |
| 50+ template 작업량이 14~22주 내 가능한가 | Feasibility | 상 | 하 | 5개 파일럿 sprint 측정 |

전체 8 risk category 매핑은 `_tmp/product-discoverer.md` 섹션 5 참조.

## 6. CPO 큐레이션 기록

| Source (`_tmp/product-discoverer.md`) | 채택 | 거절 | 병합 | 추가 | 이유 |
|----|:----:|:----:|:----:|:----:|------|
| Outcome (1줄 정의) | ✅ | | | | 측정 지표까지 명확 |
| Opportunities 8개 (Score 포함) | ✅ | | | | 우선순위 명확 — design 분석에 직접 사용 |
| Solutions 16개 (각 OPP당 2~3) | | | ✅ | | 채택 솔루션만 추출 (Sol-{N}-A 위주). 거절 솔루션은 대안 트레이스용으로 _tmp/ 보존 |
| Experiments 5개 | ✅ | | | | do/qa phase 직접 활용 |
| Risk Assumptions 8 카테고리 (15개 가정) | | | ✅ | | Top 3만 main 큐레이션, 나머지는 _tmp/ 보존 |
| 인터뷰 질문 5개 | | | ✅ | | ux-researcher 인터뷰 스크립트와 통합 — `interview-plan.md` 참조 |
| Sol-1-C (사용자 매번 확인) | | ✅ | | | 옵션 피로 (D-8 거부 — R5) |
| Sol-3-B/C (b 깊이 / 외부 정전 링크) | | ✅ | | | (c) 깊이 채택 (D-5) |
| Sol-7-B/C (γ CEO 게이트 / SRP만) | | ✅ | | | α+β 조합 채택 (extended-scope.md) |
| Sol-8-B/C (분리 기준 문서화만 / SRP만) | | ✅ | | | 4단계 프레임 + 메타-원칙 채택 |
| **추가 결정** | | | | ✅ | OPP-6(중복 배치)는 OPP-8 해소 시 자동 흡수로 판단 — 별도 솔루션 불필요 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 큐레이션 — _tmp/product-discoverer.md(583줄) 핵심 추출 |
