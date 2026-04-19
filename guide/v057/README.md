# VAIS Code v0.56.2 → v0.57.0 — Master Plan (Index)

> Feature: `v057-subdoc-preservation`
> Phase: Plan (Master / Index)
> Version: v0.56.2 → **v0.57.0 (Sub-doc Preservation)**
> 갱신: 2026-04-19

## 🗂 릴리즈 한 줄 요약

| Release | Theme | 핵심 변경 |
|---------|-------|-----------|
| **v0.57.0 Sub-doc Preservation** | 세분화된 문서 보존 | 35+ sub-agent 산출물을 `docs/{feature}/{NN-phase}/{agent}.md` 로 개별 저장. `main.md` 는 **인덱스 + 핵심 결정** 포맷으로 재정의 |

---

## 0. 이 플랜의 목적

### 0.1 사용자 요청 원문

> "지금 c level들의 main.md나 좀 더 세분화된 문서를 c레벨만 적고 남기게 되어있는데 각 sub agent들이 남기는 문서도 사용자가 참고할 수 있도록 남겼으면 좋겠어. main.md에 너무 내용이 축약되는걸 지양하자"

### 0.2 현상 진단

v0.56.2 기준, `agents/` 전수 스캔 결과:

| 카테고리 | 개수 | 자기 sub-doc 남기는 비율 |
|----------|------|-------------------------|
| C-Level (CEO/CPO/CTO/CSO/CBO/COO) | 6 | 6/6 (main.md 필수) |
| Sub-agent (Sonnet 실행 레이어) | 35+ | **약 5/35** (ad-hoc) |

현재 **명시적으로 sub-doc 을 작성하는 sub-agent** (agents/\* grep):

| Sub-agent | Sub-doc 경로 | 근거 |
|-----------|-------------|------|
| CTO @ Gate 2 (자동) | `docs/{feature}/02-design/interface-contract.md` | `agents/cto/cto.md:332,342` |
| infra-architect | `docs/{feature}/02-design/infra.md` | `agents/cto/backend-engineer.md:39` 참조 |
| ui-designer | `docs/{feature}/02-design/review.md` | `agents/cto/ui-designer.md:66` |
| product-strategist | `docs/{feature}/03-do/strategy.md` | `agents/cpo/product-strategist.md:144` |
| performance-engineer (선택) | `docs/{feature}/04-qa/performance.md` | `agents/coo/performance-engineer.md:126` |

나머지 30+ sub-agent (backend-engineer, frontend-engineer, qa-engineer, test-engineer, db-architect, incident-responder, security-auditor, code-reviewer, secret-scanner, dependency-analyzer, compliance-auditor, market-researcher, customer-segmentation-analyst, seo-analyst, copy-writer, growth-analyst, pricing-analyst, financial-modeler, unit-economics-analyst, finops-analyst, marketing-analytics-analyst, release-engineer, sre-engineer, release-monitor, product-discoverer, product-researcher, prd-writer, backlog-manager, ux-researcher, data-analyst, absorb-analyzer, skill-creator, plugin-validator, skill-validator) 는 **작업 결과를 C-Level main.md 에 녹여 넣거나 오케스트레이터가 요약**하는 구조 → 사용자가 sub-agent 의 원본 분석·근거에 접근할 경로 없음.

### 0.3 문제점

1. **축약 손실**: qa-engineer 가 분석한 ~60 Critical/Important 이슈가 CTO main.md 요약표 5줄로 압축
2. **추적 불가**: 향후 "이 결정의 근거?" 라는 질문에 원본 sub-agent 분석 못 찾음
3. **병렬 에이전트 충돌**: Do 단계에서 frontend-engineer + backend-engineer + test-engineer 가 **같은** `main.md` 에 동시 Write → race condition / 내용 덮어쓰기 위험
4. **gap 분석 한계**: qa-engineer 의 Gap 분석이 main.md 에만 있으면 gate-manager 가 `Critical: N` 한 줄 파싱만 가능 — sub-doc 이 있으면 구조화된 메트릭 주입 가능

### 0.4 원칙

- **main.md = 의사결정 문서**: 사용자가 "이 피처 어떤 결정으로 갔지?" 를 보는 곳. 테이블·표·요약 위주.
- **{agent}.md = 근거 문서**: sub-agent 가 자기 분야에서 **원본 분석 / 측정치 / 전문 관점** 을 남기는 곳. 축약 없이 상세하게.
- **Rule #3 를 변경하지 않음**: `main.md` 가 인덱스 역할은 이미 CLAUDE.md 에 허용 (`대형 피처는 sub-doc 분리 가능 (main.md가 인덱스)`). v0.57 은 이걸 **선택에서 표준** 으로 승격.
- **Gate/validator 호환**: `main.md` 는 여전히 mandatory. sub-doc 부재는 차단 사유 아님 (**optional but recommended**).

---

## 1. Sub-plan 목록 & 구현 순서

### 1.1 v0.57.0 Sub-plans (00 ~ 05)

| # | Sub-plan | 파일 | 선행 | 핵심 변경 |
|---|----------|------|------|-----------|
| 00 | Sub-doc 컨벤션 + 경로 정책 | `v057/00-subdoc-convention.plan.md` | — | 경로 패턴 확정 (`docs/{feature}/{NN-phase}/{agent-slug}.md`), naming 규칙, 병렬 충돌 방지, `vais.config.json > workflow.subDocPolicy` 스키마 |
| 01 | C-Level main.md → Index 포맷 | `v057/01-clevel-mainmd-index.plan.md` | 00 | 6 개 C-Level agent markdown 업데이트: main.md 가 (a) Executive Summary (b) 의사결정 테이블 (c) Sub-doc 링크 인덱스 (d) Decision Record Chain 으로 구성되도록 프롬프트 변경 |
| 02 | Sub-agent 자기 문서 작성 규칙 | `v057/02-subagent-docgen.plan.md` | 00 | 30+ sub-agent markdown 에 "산출물 섹션" 추가: `docs/{feature}/{NN-phase}/{slug}.md` Write 필수. C-Level 이 Agent 위임 시 sub-doc 경로 반환받아 main.md 인덱스에 링크 |
| 03 | Sub-agent 템플릿 | `v057/03-subagent-templates.plan.md` | 00 | 공통 템플릿 1개 (`templates/subdoc.template.md`) + 자주 쓰는 3~5종 특화 템플릿 (engineer, analyst, auditor, designer, researcher). 기존 phase 템플릿 5종은 유지 |
| 04 | doc-validator / status / gate 업데이트 | `v057/04-validators-trackers.plan.md` | 00, 01, 02 | `scripts/doc-validator.js`: main.md 가 sub-doc 링크를 포함하면 가산점. `lib/status.js`: sub-doc 인벤토리 트래킹 (`features.{feature}.subDocs[]`). `scripts/auto-judge.js`: main.md 없을 때 sub-doc fallback 파싱 (옵션) |
| 05 | Tests + Docs + 버전 | `v057/05-tests-docs.plan.md` | 00~04 | 신규/갱신 테스트, CLAUDE.md Rule #3 보강 (sub-doc 표준 패턴 예시), AGENTS.md 동기화, README 업데이트, CHANGELOG v0.57.0, 버전 0.56.2 → **0.57.0** |

### 1.2 의존성 그래프

```
00 Convention ─┬─→ 01 C-Level main.md  ─┐
               ├─→ 02 Sub-agent docgen  ─┼─→ 04 Validators ─→ 05 Docs/Tests ─→ 🏁 v0.57.0
               └─→ 03 Templates         ─┘
```

- **00 이 모든 것의 선행**. convention 이 정해져야 01/02/03 의 경로·슬러그·필드가 일관됨.
- 01/02/03 은 **서로 독립** — 병렬 가능. 단 같은 C-Level 파일을 만지는 경우 순차.
- 04 는 01/02 결과물을 소비.
- 05 최종.

---

## 2. 설계 핵심 결정 (초안, sub-plan 에서 확정)

### 2.1 경로 컨벤션 (sub-plan 00 에서 상세)

```
docs/{feature}/
├── 00-ideation/
│   ├── main.md                   # CEO 인덱스
│   ├── product-discoverer.md     # CPO sub-agent
│   └── product-strategist.md
├── 01-plan/
│   ├── main.md                   # C-Level 인덱스
│   ├── prd-writer.md             # CPO sub-agent (PRD 초안)
│   ├── backlog-manager.md
│   ├── market-researcher.md      # CBO sub-agent
│   └── ...
├── 02-design/
│   ├── main.md                   # 인덱스
│   ├── ui-designer.md            # (기존 main.md 내 "화면 설계" 섹션 이관)
│   ├── ui-designer.review.md     # (기존 review.md 를 슬러그.qualifier 형태로 통일)
│   ├── infra-architect.md        # (기존 infra.md → 슬러그 기반 이름으로 rename)
│   ├── interface-contract.md     # CTO Gate 2 자동 생성 (슬러그 없음 — 시스템 산출물)
│   └── db-architect.md
├── 03-do/
│   ├── main.md                   # 구현 로그 인덱스
│   ├── frontend-engineer.md
│   ├── backend-engineer.md
│   ├── test-engineer.md
│   ├── prd-writer.md             # (CPO Do: 기존 PRD 본문을 main.md 에서 분리)
│   └── product-strategist.md     # (기존 strategy.md rename)
├── 04-qa/
│   ├── main.md                   # QA 요약 인덱스
│   ├── qa-engineer.md            # (기존 main.md 내 Gap 분석 이관)
│   ├── security-auditor.md       # CSO sub-agent
│   ├── code-reviewer.md
│   ├── performance-engineer.md
│   └── release-monitor.md
└── 05-report/
    └── main.md                   # Report 는 인덱스 없이 단일 유지 (축약이 OK)
```

**슬러그 규칙**:
- 파일명 = sub-agent 의 `frontmatter.name` (kebab-case)
- 동일 agent 가 같은 phase 에서 여러 산출물을 남기면 `{slug}.{qualifier}.md` (예: `ui-designer.review.md`)
- `interface-contract.md` 같은 **시스템 생성물** 은 슬러그 아닌 의미명 유지 (예외 리스트 sub-plan 00 에서 확정)

### 2.2 main.md 인덱스 포맷 (sub-plan 01 에서 상세)

```markdown
# {feature} - {phase} (CTO)

## Executive Summary
| Perspective | Content |
|-------------|---------|
| Problem | ... |
| Solution | ... |

## Decision Record
| # | 결정 | 근거 | sub-doc |
|---|------|------|---------|
| 1 | 인증 방식 = JWT | 보안 + 확장성 | [backend-engineer.md](backend-engineer.md#auth) |

## Sub-documents
| Agent | 산출물 | 경로 | 핵심 요약 (1~2줄) |
|-------|--------|------|------------------|
| ui-designer | IA / 와이어프레임 | `ui-designer.md` | 5 화면 설계, 탭 기반 |
| infra-architect | DB 스키마 / 환경 | `infra-architect.md` | 3 테이블, PG 16 |
| backend-engineer | API 구현 | `backend-engineer.md` | 8 endpoint, JWT |

## Gate Metrics
- matchRate: 93%
- criticalIssueCount: 0
```

### 2.3 Sub-doc 공통 템플릿 (sub-plan 03 에서 상세)

```markdown
# {feature} — {phase} — {agent}

> 작성자: {agent}
> 참조: `docs/{feature}/01-plan/main.md`, `docs/{feature}/02-design/main.md`

## 1. 맥락 (Context)
이 작업에 들어온 입력 (상위 Decision, 참조 문서).

## 2. 분석 / 설계 / 구현 (Body)
에이전트 전문 영역 상세. 축약 금지.

## 3. 결정 (Decisions)
| # | 결정 | 대안 | 선택 이유 |

## 4. 산출물 (Artifacts)
- 생성/수정 파일 목록
- 외부 링크

## 5. 인계 (Handoff)
다음 단계 에이전트에게 넘기는 메모.
```

특화 템플릿 (sub-plan 03):
- `engineer.template.md` — frontend/backend/test/db/infra engineer
- `analyst.template.md` — market/pricing/financial/unit-economics/finops/marketing-analytics/seo/growth/customer-segmentation/data
- `auditor.template.md` — security/compliance/code-review/secret-scanner/dependency/plugin-validator/skill-validator
- `researcher.template.md` — ux-researcher/product-researcher/product-discoverer
- `designer.template.md` — ui-designer/copy-writer

---

## 3. 성공 기준 (Master SC)

| # | Criteria | 검증 |
|---|----------|------|
| SC-1 | `docs/{feature}/{NN-phase}/{agent-slug}.md` 컨벤션이 `vais.config.json > workflow.subDocs` 에 정의됨 | diff |
| SC-2 | 6 개 C-Level agent markdown 의 PDCA 테이블 + "Output" 섹션이 main.md = 인덱스 포맷을 명시 | grep `sub-documents` in agents/\*/(ceo\|cpo\|cto\|cso\|cbo\|coo).md |
| SC-3 | 30+ sub-agent markdown 이 "산출물 섹션" 에서 sub-doc 경로를 명시 | grep `docs/{feature}/{NN-phase}/{name}.md` in agents/\*/*.md (각 sub-agent) |
| SC-4 | `templates/subdoc.template.md` 존재 + 최소 1개 특화 템플릿 (engineer) | ls templates/ |
| SC-5 | `scripts/doc-validator.js` 가 main.md 의 sub-doc 링크 목록을 파싱하여 실존 여부 확인 (경고만, 차단 X) | 신규 테스트 |
| SC-6 | `lib/status.js` 가 sub-doc 작성 시 `.vais/status.json features.{feature}.subDocs[]` 갱신 | 신규 테스트 |
| SC-7 | `npm test` + `npm run lint` 전부 pass | 명령어 |
| SC-8 | CHANGELOG v0.57.0 + 4 파일 버전 동기화 (package.json / vais.config.json / .claude-plugin/plugin.json / .claude-plugin/marketplace.json) | diff |
| SC-9 | 최소 1개 샘플 피처로 시연 — ui-designer + backend-engineer + qa-engineer 각각 sub-doc 생성 후 main.md 에서 링크 확인 | smoke test |
| SC-10 | CLAUDE.md Rule #3 에 sub-doc 표준 예시 추가, AGENTS.md 동기화 | diff |

---

## 4. Checkpoint Decisions (sub-plan 진입 전 확인 필요)

아래는 **플래닝 단계에서 사용자 확인이 필요한 항목**. 각 sub-plan 이 착수 전 CP 로 걸고 AskUserQuestion 호출.

| # | Decision | 옵션 | 기본 (권장) |
|---|----------|------|------------|
| CP-1 | sub-doc 누락 시 정책 | A. 경고만 / B. gate verdict = retry / C. gate verdict = fail | **A. 경고만** (v0.57 은 도입 단계. 강제는 v0.58+ 에서 검토) |
| CP-2 | 기존 ad-hoc sub-doc 마이그레이션 | A. rename (infra.md → infra-architect.md) / B. 심볼릭/redirect 파일 유지 / C. 그대로 둠 (예외 리스트) | **A. rename** (convention 일관성). C 예외: `interface-contract.md` (시스템 산출물) |
| CP-3 | main.md 인덱스 자동 생성 여부 | A. C-Level 이 수동 작성 / B. doc-validator 가 sub-doc 스캔하여 자동 주입 / C. 하이브리드 (자동 목록 + 수동 요약) | **C. 하이브리드** — 자동 목록 섹션 + 수동 Executive/Decision |
| CP-4 | 병렬 에이전트의 main.md 쓰기 | A. C-Level 이 sub-doc 취합 후 main.md 작성 / B. sub-agent 가 main.md 직접 편집 / C. lock 파일 | **A. 취합 후 작성** (race 방지) |
| CP-5 | Report 단계 (05-report) sub-doc | A. 필요 / B. main.md 단일 유지 | **B. main.md 단일** (report 는 본질적으로 축약 문서) |
| CP-6 | `vais.config.json > workflow.subDocs` 스키마 위치 | A. 신규 섹션 / B. 기존 `docPaths` 확장 / C. 에이전트 frontmatter 에 per-agent 정의 | **B. `docPaths` 확장** (single source of truth) |

---

## 5. 범위 밖 (Not in scope)

- 에이전트 개수 감량 / 역할 재편 (v0.56 에서 확정, 변경 없음)
- MCP 서버 활성화 (`mcp/` 현재 비활성, 변경 없음)
- `docs/_legacy/` 구조 변경 (회귀 가드 유지)
- CI/CD 플러그인 자체 CI 복구 (v0.55 삭제 결정 유지)
- `05-report/main.md` 를 sub-doc 로 쪼개는 것 (CP-5 에서 "B 유지" 기본)

---

## 6. 참조

- v0.54/v0.55/v0.56 마스터 플랜: `guide/v054/README.md`
- v0.56.1 Gate Awareness: `CHANGELOG.md#0561`
- 현재 매니페스트: `package.json`, `vais.config.json`, `.claude-plugin/plugin.json`
- hooks entrypoint: `hooks/hooks.json`
- agent 전수 목록: `CLAUDE.md > Agent Architecture`
- sub-plan 파일: `guide/v057/00~05-*.plan.md`
