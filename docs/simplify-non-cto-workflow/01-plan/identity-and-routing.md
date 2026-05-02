---
owner: cto
agent: cto-direct
artifact: identity-and-routing
phase: plan
feature: simplify-non-cto-workflow
generated: 2026-05-02
summary: "vais-code 정체성 = 코드 개발 도우미. 4 C-Suite 기본 + CBO/COO 선택 활성. 자료 보존 + 자동 라우팅에서만 제외."
---

# Identity & Routing — 4 C-Suite 정체성

## 한 줄 요약

vais-code = **코드 개발 도우미**. CEO 자동 라우팅 = **4 C-Suite (CEO+CPO+CTO+CSO)** 기본. CBO/COO 는 명시 호출 시만 활성. 자료/sub-agent/외부 거장 자료 그대로 보존.

## 정체성 정의

| 옛 정체성 | 새 정체성 |
|---------|---------|
| "Virtual AI C-Suite for software development" — 6 C-Suite, 풀 서비스 런칭 라이프사이클 | "Virtual AI C-Suite for software development" — **4 C-Suite 코드 개발 + 2 선택 (비즈니스/운영)** |
| 모든 피처 6 C-Suite 다 거치는 게 default | 코드 개발 95% 피처 = 4 C-Suite. SaaS 출시 / CI/CD 신규 등은 명시 활성 |

## 4 C-Suite 기본 흐름

```
사용자 요청
   ↓
CEO (ideation) — 7 차원 분석 + 라우팅 결정
   ↓
CPO (제품 정의 — 필요시) — prd / persona / jtbd / OST 등
   ↓
CTO (코드 — 항상) — architecture / impl / qa
   ↓
CSO (보안 — 필요시) — threat-model / OWASP / secret / dependency
   ↓
보고
```

## CBO/COO 선택 활성

### 자동 라우팅 X — 명시 호출 O

```
/vais cbo {feature}     # 사용자 명시 시 활성
/vais coo {feature}
```

CEO 가 ideation 단계에서 자동으로 CBO/COO 호출 안 함.

### CBO 명시 활성 시나리오

- SaaS 출시 → unit-economics, pricing, gtm
- 가격 정책 변경 → pricing-analyst
- GTM 캠페인 → growth-analyst, marketing-analytics
- SEO 감사 → seo-analyst
- 시장 분석 → market-researcher (PEST/Five Forces/SWOT)
- 재무 모델 → financial-modeler

### COO 명시 활성 시나리오

- CI/CD 신규 구축 → ci-cd-configurator
- Docker 컨테이너화 → container-config-author
- DB 마이그레이션 (사용자 명시) → migration-planner
- 운영 Runbook → runbook-author
- 모니터링 시스템 → sre-engineer
- Release 자동화 → release-notes-writer
- 성능 벤치마크 (단순 사용 시) → performance-engineer

## 자료 보존 (변경 X)

- `agents/cbo/` 10 sub-agent + canon_source 그대로
- `agents/coo/` 8 sub-agent + canon_source 그대로
- 외부 거장 자료 (PEST/Five Forces/SWOT/GDPR/CI/CD/SRE 등) 보존
- 단지 CEO 자동 라우팅 알고리즘에서 빠짐

## vais.config.json 변경

```json
{
  "cSuite": {
    "primary": ["ceo", "cpo", "cto", "cso"],
    "secondary": ["cbo", "coo"],
    "_comment": "primary = CEO 자동 라우팅 대상. secondary = 사용자 명시 호출 시만 활성."
  }
}
```

CEO 의 7 차원 알고리즘이 `primary` 만 검토. `secondary` 는 사용자가 `/vais {c-level} ...` 직접 호출 시 진입.

## 사용자 인지 영향

| 차원 | 옛 | 새 |
|------|---|---|
| CEO 라우팅 시 거치는 C-Level | 6 모두 | **4 (default)** |
| ideation 시 사용자 인지해야 할 C-Level | 6 | **4** |
| CEO 알고리즘 차원 | 10 (마케팅/SLA/비용 포함) | **7** |
| ideation 토큰 | ~3K | **~2K** |

## ONBOARDING.md 갱신 영향

ONBOARDING.md 의 "What This Is" 절에서 "6 C-Level Executives" → "**4 Primary + 2 Secondary**" 갱신. Architecture Mermaid 의 C-Suite 노드도 primary/secondary 구분.

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-02 | 4 C-Suite 정체성 정의. CBO/COO 명시 활성 시나리오. vais.config.json 갱신 spec. |
