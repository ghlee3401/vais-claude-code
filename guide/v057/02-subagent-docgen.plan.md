# v0.57 Sub-plan 02 — Sub-agent Doc Generation Rules

> 선행: 00
> 후행: 04
> 대상: 30+ sub-agent markdown (`agents/{c-level}/*.md` 중 C-Level 파일 6개 제외)

## 1. 목적

각 sub-agent 가 자기 분야의 분석·설계·구현 결과를 **축약 없이** 자기 이름의 sub-doc 에 남기도록 markdown 지침을 업데이트. C-Level main.md 는 인덱스 역할만 하고, 실제 원본 분석은 sub-doc 에 보존.

## 2. 대상 agent 전수 목록

| C-Level | Sub-agent | 기본 저장 phase | 기본 sub-doc 경로 |
|---------|-----------|----------------|-------------------|
| CEO | absorb-analyzer | (해당 없음 — 외부 흡수) | `docs/_absorb/{source}.md` (별도 규칙) |
| CEO | skill-creator | (해당 없음 — meta) | 변경 없음 |
| CPO | product-discoverer | 00-ideation | `00-ideation/product-discoverer.md` |
| CPO | product-strategist | 00-ideation, 03-do | `{phase}/product-strategist.md` (기존 strategy.md rename) |
| CPO | product-researcher | 01-plan | `01-plan/product-researcher.md` |
| CPO | prd-writer | 03-do | `03-do/prd-writer.md` |
| CPO | backlog-manager | 01-plan, 03-do | `{phase}/backlog-manager.md` |
| CPO | ux-researcher | 00-ideation, 01-plan | `{phase}/ux-researcher.md` |
| CPO | data-analyst | 04-qa | `04-qa/data-analyst.md` |
| CTO | infra-architect | 02-design | `02-design/infra-architect.md` (기존 infra.md rename) |
| CTO | ui-designer | 02-design | `02-design/ui-designer.md` + `02-design/ui-designer.review.md` |
| CTO | frontend-engineer | 03-do | `03-do/frontend-engineer.md` |
| CTO | backend-engineer | 03-do | `03-do/backend-engineer.md` |
| CTO | db-architect | 02-design | `02-design/db-architect.md` |
| CTO | qa-engineer | 04-qa | `04-qa/qa-engineer.md` |
| CTO | test-engineer | 03-do | `03-do/test-engineer.md` |
| CTO | incident-responder | 04-qa | `04-qa/incident-responder.md` |
| CSO | security-auditor | 04-qa | `04-qa/security-auditor.md` |
| CSO | code-reviewer | 04-qa | `04-qa/code-reviewer.md` |
| CSO | secret-scanner | 04-qa | `04-qa/secret-scanner.md` |
| CSO | dependency-analyzer | 04-qa | `04-qa/dependency-analyzer.md` |
| CSO | plugin-validator | 04-qa | `04-qa/plugin-validator.md` |
| CSO | skill-validator | 04-qa | `04-qa/skill-validator.md` |
| CSO | compliance-auditor | 04-qa | `04-qa/compliance-auditor.md` |
| CBO | market-researcher | 01-plan | `01-plan/market-researcher.md` |
| CBO | customer-segmentation-analyst | 01-plan | `01-plan/customer-segmentation-analyst.md` |
| CBO | seo-analyst | 04-qa | `04-qa/seo-analyst.md` |
| CBO | copy-writer | 03-do | `03-do/copy-writer.md` |
| CBO | growth-analyst | 03-do | `03-do/growth-analyst.md` |
| CBO | pricing-analyst | 01-plan | `01-plan/pricing-analyst.md` |
| CBO | financial-modeler | 01-plan | `01-plan/financial-modeler.md` |
| CBO | unit-economics-analyst | 04-qa | `04-qa/unit-economics-analyst.md` |
| CBO | finops-analyst | 04-qa | `04-qa/finops-analyst.md` |
| CBO | marketing-analytics-analyst | 04-qa | `04-qa/marketing-analytics-analyst.md` |
| COO | release-engineer | 03-do | `03-do/release-engineer.md` |
| COO | sre-engineer | 03-do | `03-do/sre-engineer.md` |
| COO | release-monitor | 04-qa | `04-qa/release-monitor.md` |
| COO | performance-engineer | 04-qa | `04-qa/performance-engineer.md` (기존 performance.md rename) |

**총 37 개** (meta 2개 제외하면 35개).

> 실제 phase 는 호출 맥락에 따라 달라질 수 있음 — 위 "기본 저장 phase" 는 가장 흔한 경우. sub-agent markdown 에는 "현재 phase 와 agent 슬러그로 경로 생성" 로직을 기술 (하드코딩 금지).

## 3. 각 sub-agent markdown 에 추가할 공통 섹션

아래 블록을 각 sub-agent markdown 에 삽입 (정확한 위치는 sub-plan 구현 시 결정, 보통 "## 핵심 역할" 이후 + "## 문서 참조 규칙" 근방).

```markdown
## 산출물 (Sub-doc)

**저장 경로**: `docs/{feature}/{현재-phase-폴더}/{agent-slug}.md`

(phase 폴더 매핑: ideation→00-ideation, plan→01-plan, design→02-design, do→03-do, qa→04-qa, report→05-report)

**작성 규칙**:
1. 호출 완료 시 반드시 위 경로에 자기 분석/설계/구현 결과를 **축약 없이** 기록
2. 공통 템플릿: `templates/subdoc.template.md` (또는 특화 템플릿: `engineer/analyst/auditor/designer/researcher`)
3. 파일 상단에 메타 헤더 3줄:
   ```
   > Author: {agent-slug}
   > Phase: {NN-phase}
   > Refs: {참조한 상위 문서 경로들, 쉼표 구분}
   ```
4. 복수 산출물일 때 qualifier 사용 (예: `{slug}.review.md`, `{slug}.audit.md`). qualifier 는 kebab-case 1~2 단어.
5. C-Level main.md 에 담길 "한 줄 요약" 을 **문서 첫 줄 또는 Executive Summary 첫 행** 에 명확히 작성 (C-Level 이 인덱스 작성 시 이를 인용).

**금지**:
- ❌ C-Level main.md 를 직접 Write/Edit (race 방지. 필요하면 C-Level 에게 요약 반환)
- ❌ 다른 sub-agent 의 sub-doc 수정
- ❌ 빈 파일 또는 템플릿 그대로 저장 (무의미한 스캐폴드 금지)
```

## 4. 특수 케이스

### 4.1 ui-designer — 복수 산출물 (.review qualifier 유지)

- **primary**: `02-design/ui-designer.md` — IA / 와이어프레임 / 화면별 정의
- **review qualifier**: `02-design/ui-designer.review.md` — 디자인 크리틱 (기존 review.md rename)

### 4.2 qa-engineer — 4-qa main.md 와의 관계

- qa-engineer 가 Gap 분석 + 이슈 리스트 → `04-qa/qa-engineer.md` 에 상세
- CTO 가 main.md 에 Critical: N / Important: M / matchRate: X% 요약 + qa-engineer.md 링크
- **gate-manager 가 파싱하는 `Critical: N` 숫자는 main.md 와 sub-doc 양쪽 모두에서 유효** (sub-plan 04 에서 파서 업데이트)

### 4.3 incident-responder — 호출 시에만 작성

- 자동 호출 조건 4종 (CTO.md 에 기술됨) 에 해당할 때만 `04-qa/incident-responder.md` 생성
- 호출 안 된 피처는 파일 없음 (정상)

### 4.4 CSO auditor 다수 — phase 공유

- security-auditor + code-reviewer + secret-scanner + dependency-analyzer + compliance-auditor 가 모두 `04-qa/` 에 자기 sub-doc
- CSO main.md (`04-qa/main.md`) 는 각 auditor 의 verdict / critical 합계 인덱스

### 4.5 CBO analyst 다수 — phase 분산

- Plan 단계: market-researcher / customer-segmentation-analyst / pricing-analyst / financial-modeler
- Do 단계: copy-writer / growth-analyst
- QA 단계: seo-analyst / unit-economics-analyst / finops-analyst / marketing-analytics-analyst
- CBO main.md 는 phase 별 인덱스를 따로 유지 (CBO 는 phase 간 분석 흐름이 길어서 Decision Chain 이 중요)

### 4.6 CEO — 특수 agent

- absorb-analyzer: 외부 skill/reference 흡수 — feature-scope 아님 → `docs/_absorb/{source-slug}.md` (별도 규칙, 본 플랜 범위 외)
- skill-creator: meta agent — feature-scope 산출물 없음 → 변경 없음

## 5. sub-agent 와 C-Level 간 계약 (Contract)

각 sub-agent markdown 에 Contract 섹션 (기존에 있는 경우 업데이트):

| 구분 | 항목 | 값 |
|------|------|-----|
| **Input** | feature | 피처명 |
| | phase | 현재 phase |
| | context | C-Level 전달 context |
| **Output** | sub-doc | `docs/{feature}/{NN-phase}/{agent-slug}.md` (필수) |
| | summary | C-Level 에 반환할 한 줄 요약 (main.md 인덱스용) |
| | artifacts | 생성/수정한 코드 파일 목록 (해당 시) |
| **Handoff** | return | C-Level 에게 `{sub-doc 경로, summary}` 튜플 반환 |

## 6. 변경 파일 체크리스트

총 35개 파일 (각 파일은 비슷한 블록 삽입, 특수 케이스만 개별 처리):

```
agents/cpo/product-discoverer.md
agents/cpo/product-strategist.md
agents/cpo/product-researcher.md
agents/cpo/prd-writer.md
agents/cpo/backlog-manager.md
agents/cpo/ux-researcher.md
agents/cpo/data-analyst.md

agents/cto/infra-architect.md
agents/cto/ui-designer.md            (특수: .review qualifier)
agents/cto/frontend-engineer.md
agents/cto/backend-engineer.md
agents/cto/db-architect.md
agents/cto/qa-engineer.md             (특수: gate 파싱 양립)
agents/cto/test-engineer.md
agents/cto/incident-responder.md      (특수: 조건부 생성)

agents/cso/security-auditor.md
agents/cso/code-reviewer.md
agents/cso/secret-scanner.md
agents/cso/dependency-analyzer.md
agents/cso/plugin-validator.md
agents/cso/skill-validator.md
agents/cso/compliance-auditor.md

agents/cbo/market-researcher.md
agents/cbo/customer-segmentation-analyst.md
agents/cbo/seo-analyst.md
agents/cbo/copy-writer.md
agents/cbo/growth-analyst.md
agents/cbo/pricing-analyst.md
agents/cbo/financial-modeler.md
agents/cbo/unit-economics-analyst.md
agents/cbo/finops-analyst.md
agents/cbo/marketing-analytics-analyst.md

agents/coo/release-engineer.md
agents/coo/sre-engineer.md
agents/coo/release-monitor.md
agents/coo/performance-engineer.md    (특수: 기존 performance.md rename)
```

**미포함** (본 플랜 범위 외): agents/ceo/absorb-analyzer.md, agents/ceo/skill-creator.md.

## 7. 자동화 가능성 검토

수동으로 35개 파일에 동일 블록을 삽입하는 건 비효율. 옵션:

| 옵션 | 장점 | 단점 |
|------|------|------|
| A. 수동 편집 35건 | 특수 케이스 처리 쉬움 | 시간 소요 |
| B. `scripts/inject-subdoc-section.js` 원샷 스크립트 | 일괄 처리 | 특수 케이스 수동 보정 필요 |
| C. `_shared/subdoc-guard.md` include 파일 신설 | DRY. includes 메커니즘 활용 | includes 지원 여부 확인 필요 (현재 `_shared/advisor-guard.md` 선례 있음) |

**권장: C**. `agents/_shared/subdoc-guard.md` 에 §3 공통 블록 기술, 각 sub-agent frontmatter 에 `includes: [_shared/subdoc-guard.md]` 추가. 특수 케이스만 개별 섹션.

기존 선례 확인: `agents/cto/backend-engineer.md:19-21` 에 이미 `includes: - _shared/advisor-guard.md` 사용 중. 동일 패턴 활용.

## 8. 성공 기준

| # | Criteria | 검증 |
|---|----------|------|
| SC-02-1 | `agents/_shared/subdoc-guard.md` 존재 + 공통 블록 기술 | ls agents/_shared/ |
| SC-02-2 | 35 개 sub-agent markdown 의 frontmatter `includes` 에 `_shared/subdoc-guard.md` 포함 | grep `_shared/subdoc-guard.md` in agents/{cpo,cto,cso,cbo,coo}/*.md |
| SC-02-3 | 특수 케이스 5건 (ui-designer.review / performance-engineer rename / qa-engineer gate 연동 / incident-responder 조건부 / CBO phase 분산) 개별 섹션 확인 | grep |
| SC-02-4 | 샘플 피처로 smoke test — Do 단계 3 agent 병렬 호출 시 sub-doc 3개 생성 | smoke test |

## 9. 리스크

| 리스크 | 완화 |
|--------|------|
| `includes` 메커니즘이 Claude Code 에서 미지원 | `_shared/advisor-guard.md` 선례 이미 동작 중. 동작 확인 후 진행 |
| sub-agent 가 경로 생성 로직을 틀리게 실행 | sub-plan 04 의 doc-validator 가 경로 위반 감지 |
| 빈 sub-doc 스팸 | doc-validator 가 크기/섹션 개수 체크 (경고) |

## 10. 다음

- sub-plan 03 (템플릿) 에서 `subdoc-guard.md` 가 참조할 템플릿 5종 정의
- sub-plan 04 에서 doc-validator 가 경로/크기/링크 검증
