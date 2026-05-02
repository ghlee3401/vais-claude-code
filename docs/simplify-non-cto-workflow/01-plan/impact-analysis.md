---
owner: cto
agent: cto-direct
artifact: impact-analysis
phase: plan
feature: simplify-non-cto-workflow
generated: 2026-05-02
summary: "v2.x 통합 모델의 정확한 영향 파일 매핑 (~35 파일) + 변경 spec + 의존 순서. CTO PDCA 그대로 유지."
---

# Impact Analysis — v2.x 변경 영향 매핑

## 한 줄 요약

총 ~35 파일 변경 (정책 3 / agent md 6 / skill 7 / scripts 6 / lib 1 / 가드 4 / 템플릿 7 / 진입 가이드 2). CTO PDCA 그대로. CBO/COO sub-agent / 외부 거장 자료 보존.

## 영향 파일 매트릭스

### 1. 정책 진입점 (3)

| 파일 | 변경 종류 | 핵심 변경 |
|------|---------|---------|
| `CLAUDE.md` | modify | Rule #2/#3/#9/#13/#14/#15 갱신 (mandatory phase → CTO + CEO ideation 만, 산출물 경로 = phase 폴더 + artifact MD, Lake 자동, 외부 자료 분리, sub-agent 직접 박제, multi-C-Level 공존 단순화) |
| `vais.config.json` | modify | `cSuite.primary` (4) + `cSuite.secondary` (2) 분리, `workflow.docPaths` 갱신, `workflow.topicPresets` → `workflow.phaseArtifactMapping` 으로 재구성, `cLevelCoexistencePolicy.mainMdMaxLines` 200 그대로 (자연 충족), `scopeContractPolicy` 폐기 또는 단순화 |
| `.claude-plugin/plugin.json` | modify | description 갱신 (4 Primary + 2 Secondary 명시) |

### 2. 6 C-Level Agent md (6)

| 파일 | 변경 정도 | 변경 |
|------|:------:|------|
| `agents/ceo/ceo.md` | High | 7 차원 체크리스트 + phase↔artifact 매핑 + AskUserQuestion 클릭 흐름 추가 |
| `agents/cpo/cpo.md` | Medium | Output 표 phase 별 갱신 (인덱스 main.md 형식) |
| `agents/cto/cto.md` | Low | PDCA 그대로 + main.md 인덱스 형식 정정 + `_tmp` 폐기 |
| `agents/cso/cso.md` | Medium | Output 표 갱신 + 자동 라우팅 4 C-Suite 명시 |
| `agents/cbo/cbo.md` | Low | "선택 활성 (사용자 명시 호출)" 명시 + 자동 라우팅 제외 |
| `agents/coo/coo.md` | Low | 동일 |

### 3. Skill 라우팅 (7+)

| 파일 | 변경 |
|------|------|
| `skills/vais/SKILL.md` | AskUserQuestion 강제 규칙 재확인 + CBO/COO 명시 호출 안내 |
| `skills/vais/phases/ceo.md` | 7 차원 알고리즘 + 자동 phase 결정 흐름 |
| `skills/vais/phases/cpo.md` | main.md 인덱스 + sub-agent 직접 박제 |
| `skills/vais/phases/cto.md` | PDCA 유지 + main.md 인덱스 + sub-agent 직접 박제 |
| `skills/vais/phases/cso.md` | 동일 |
| `skills/vais/phases/cbo.md` | "명시 호출 시만 활성" 안내 |
| `skills/vais/phases/coo.md` | 동일 |

### 4. Scripts 검증 (6)

| 파일 | 변경 |
|------|------|
| `scripts/doc-validator.js` | W-MAIN-SIZE 폐기, W-IDX-01 = Artifacts 표 검사, W-OWN = artifact frontmatter 검사 (기존 topic frontmatter 대체), W-SCOPE 폐기 또는 단순화 |
| `scripts/auto-judge.js` | 새 모델 호환 (matchRate / criticalIssueCount 그대로, phase 별 통과 기준 갱신) |
| `scripts/phase-transition.js` | 4 C-Suite 자동 라우팅 + 2 선택 활성 분기 |
| `scripts/cp-tracker.js` | CP 트래킹 (CTO 만 CP-0/CP-1/CP-D/CP-2/CP-Q 유지, 비-CTO 폐기) |
| `scripts/cp-guard.js` | 동일 |
| `scripts/patch-subdoc-block.js` | 새 subdoc-guard 블록 inline 주입 spec |
| `scripts/patch-clevel-guard.js` | 새 clevel-main-guard 블록 (단순화) inline 주입 |

### 5. 상태 관리 (1)

| 파일 | 변경 |
|------|------|
| `lib/status.js` | per-role mandatory phases 정의 (cto: 5 phase, ceo: ideation 만, 비-CTO: phase 자동 결정) |

### 6. 공유 가드 (4) — `guards-spec.md` 참조

| 파일 | 변경 정도 |
|------|:------:|
| `agents/_shared/advisor-guard.md` | 무변경 |
| `agents/_shared/clevel-main-guard.md` | 50% 단순화 |
| `agents/_shared/subdoc-guard.md` | 100% 재작성 |
| `agents/_shared/ideation-guard.md` | 30% 갱신 |

### 7. 템플릿 (7)

| 파일 | 변경 |
|------|------|
| `templates/main-md.template.md` (신규) | 5 섹션 표준 (Executive Summary / Decision Record / Artifacts / CEO 판단 근거 / Next Phase) |
| `templates/plan-minimal.template.md` | 본 피처에서 사용 X (CTO PDCA 만 적용). 변경 X 또는 헤더에 "CTO 전용" 명시 |
| `templates/plan-standard.template.md` | 동일 |
| `templates/plan-extended.template.md` | 동일 |
| `templates/design.template.md` | main.md 인덱스 형식 적용 |
| `templates/do.template.md` | 동일 |
| `templates/qa.template.md` | 동일 |
| `templates/report.template.md` | 동일 |
| `templates/subdoc.template.md` | **폐기** — 새 모델에서 sub-agent 직접 박제. artifact 별 자유 형식 |

### 8. 진입 가이드 (2)

| 파일 | 변경 |
|------|------|
| `ONBOARDING.md` | "What This Is" 4 Primary + 2 Secondary 명시. Architecture Mermaid 갱신. 워크플로우 예시 (CEO 자동 라우팅) 갱신 |
| `AGENTS.md` | 4 C-Suite 정체성 명시 |

## 변경 순서 (의존)

```
1. frontmatter-spec       ← 가장 기본 (다른 모든 단계 의존)
2. subdoc-spec            ← frontmatter 의존
3. main-md-spec           ← frontmatter 의존
4. ceo-algorithm          ← 위 3 의존
5. identity-and-routing   ← 정책 (vais.config.json)
6. ux-interface           ← skill 라우팅 갱신
7. guards-spec            ← 위 모두 의존
8. patch 스크립트 실행 (clevel + subdoc 본문 주입)
9. doc-validator + auto-judge 갱신
10. lib/status.js per-role
11. ONBOARDING.md / AGENTS.md / CLAUDE.md 갱신
12. E2E 테스트
```

## 회귀 시나리오

| # | 시나리오 | 기대 |
|---|---------|------|
| R-1 | `/vais ceo {요청}` 호출 | 7 차원 분석 + AskUserQuestion 1번 + 자동 PDCA 진행 |
| R-2 | sub-agent 호출 (예: prd-writer) | `docs/{feature}/01-plan/prd.md` 직접 박제 (`_tmp/` 미생성) |
| R-3 | C-Level 의 main.md 작성 | 인덱스 형식 + Artifacts 표 (frontmatter 자동 추출) |
| R-4 | `/vais cbo {feature}` 명시 호출 | CBO 활성 (옛 모델 그대로) |
| R-5 | doc-validator 실행 | W-MAIN-SIZE 폐기 / W-IDX-01 새 spec 호환 |
| R-6 | 외부 사용자 호환성 | AskUserQuestion 강제 그대로, 외부 영향 0 |

## Breaking Change 평가

| 영역 | breaking? | 근거 |
|------|:--------:|------|
| 기존 docs (현재 비어있음) | ❌ | 마이그레이션 부담 0 |
| sub-agent md frontmatter 변경 | ❌ | 본문 추가만, 기존 필드 유지 |
| vais.config.json 키 추가 | ❌ | additive (primary/secondary) |
| `_tmp` 폴더 폐기 | ⚠️ → ❌ | 기존 _tmp 폴더 git 보존, 새 작성만 새 모델 (legacy 잔존 OK) |
| AskUserQuestion 강제 | ❌ | 기존 규칙 그대로 |
| External marketplace 사용자 | ❌ | 옵트인 (CBO/COO 명시 호출 가능) |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-02 | ~35 파일 영향 매핑. 8 영역 분류. 변경 순서 12단계. 회귀 시나리오 6건. Breaking change 평가 6 영역 모두 ❌. |
