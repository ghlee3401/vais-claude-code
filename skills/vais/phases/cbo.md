---
name: cbo
phase-router: true
c-level: cbo
version: 0.50.0
description: CBO 에이전트 호출. Business layer 오케스트레이션 (시장분석/GTM/재무/pricing/unit economics).
subAgents: [market-researcher, customer-segmentation-analyst, seo-analyst, copy-writer, growth-analyst, pricing-analyst, financial-modeler, unit-economics-analyst, finops-analyst, marketing-analytics-analyst]
---

# CBO Phase

`${CLAUDE_PLUGIN_ROOT}/agents/cbo/cbo.md`를 읽고 그 안의 지침에 따라 실행하세요.

## 인자 파싱

전달 인자 원본: `$1`

### Phase 분리 규칙

`$1`의 **첫 단어**가 아래 목록에 해당하면 phase로 분리합니다:

| 키워드 | phase |
|--------|-------|
| `ideation` | ideation |
| `plan` | plan |
| `design` | design |
| `do` | do |
| `qa` | qa |
| `report` | report |

- **Phase 명시**: `/vais cbo plan my-market` → phase=`plan`, feature=`my-market`
- **Phase 생략**: `/vais cbo my-market` → phase=미지정, feature=`my-market`

### Phase 미지정 시 동작

1. `.vais/status.json`에서 해당 피처의 currentPhase 확인
2. currentPhase 기반 다음 phase 자동 판별
3. AskUserQuestion으로 확인

### Phase별 기본 sub-agent 호출

| Phase | 기본 호출 |
|-------|-----------|
| plan | `market-researcher` + `customer-segmentation-analyst` (병렬) |
| design | `growth-analyst` + `copy-writer` + `pricing-analyst` + `financial-modeler` (병렬) |
| do | `seo-analyst` + `copy-writer` + `finops-analyst` + `unit-economics-analyst` + `marketing-analytics-analyst` (병렬) |
| qa | CBO 본체가 unit-economics / marketing-analytics / financial-modeler 결과 검증 |
| report | CBO가 투자자/팀 발표용 통합 리포트 |

### Sub-agent 선택적 위임

CEO가 `{selected: [pricing-analyst]}` 같은 필터를 전달하면 해당 sub-agent만 호출.
