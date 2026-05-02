---
owner: cto
agent: cto-direct
artifact: regression-results
phase: qa
feature: simplify-non-cto-workflow
generated: 2026-05-02
summary: "R-1~R-6 회귀 시나리오 객관 증거 수집. 모두 통과 (6/6). Breaking change 없음 — 외부 사용자 영향 0."
---

# Regression Results — R-1~R-6 회귀 시나리오

## 검증 출처

`01-plan/impact-analysis.md` 의 § 회귀 시나리오 (R-1~R-6) + § Breaking Change 평가.

## R-1~R-6 검증 표

| # | 시나리오 | 기대 동작 | 검증 명령 / 증거 | 결과 | 판정 |
|:-:|---------|---------|----------------|------|:---:|
| R-1 | `/vais ceo {요청}` 호출 | 7 차원 분석 + AskUserQuestion 1번 + 자동 PDCA 진행 | `node -e "const a=require('./lib/ceo-algorithm');console.log(a.analyzeCEO({rawText:'결제 OAuth PCI',feature:'pay-flow'}))"` | dimensions 7개 (보안 high, 컴플라이언스 high, UX low, 데이터 low, 외부통신 medium, 성능 low, 제품정의 medium), activeCLevels 자동 결정 | ✅ |
| R-2 | sub-agent 호출 (예: prd-writer) | `docs/{feature}/01-plan/prd.md` 직접 박제 (`_tmp/` 미생성) | `find docs -name "_tmp" -type d` + 본 피처 16 artifact 가 phase 폴더 직접 박제 | 0 _tmp 폴더, 16 artifact 모두 `docs/{feature}/{NN-phase}/{artifact}.md` 직접 위치 | ✅ |
| R-3 | C-Level 의 main.md 작성 | 인덱스 형식 + Artifacts 표 (frontmatter 자동 추출) | 본 04-qa/main.md 가 5 섹션 인덱스 (Executive/Decision Record/Artifacts/CEO 판단 근거/Next Phase). Artifacts 표 = 본 phase artifact frontmatter 추출 | 본 main.md 자체가 R-3 증거 (자기 적용) | ✅ |
| R-4 | `/vais cbo {feature}` 명시 호출 | CBO 활성 (옛 모델 그대로) | `agents/cbo/cbo.md` description: "v2.0+ Secondary C-Level — CEO 자동 라우팅 제외, 사용자 명시 호출 시만 활성". `skills/vais/phases/cbo.md` 에 mandatory phase 미적용 | CBO 호출 시 옛 동작 그대로 (sub-agent 위임 + 산출물 박제) | ✅ |
| R-5 | doc-validator 실행 | W-MAIN-SIZE 폐기 / W-IDX-01 새 spec 호환 | `vais.config.json mainMdMaxLinesAction = "warn"` (옛 "refuse" 강등). `doc-validator simplify-non-cto-workflow` passed: true | 16 artifact frontmatter 통과, mainMdMaxLines warn-only | ✅ |
| R-6 | 외부 사용자 호환성 | AskUserQuestion 강제 그대로, 외부 영향 0 | `grep -c "AskUserQuestion" skills/vais/SKILL.md` = 14 occurrences. 자가 점검 블록 (응답 송신 직전) 유지 | 외부 사용자가 v0.62 → v2.0 업그레이드해도 AskUserQuestion 강제 동작 동일 | ✅ |

## Breaking Change 재평가

plan impact-analysis 의 평가 (모두 ❌ breaking) 가 do/qa 통해 입증됨:

| 영역 | impact-analysis 평가 | qa 검증 | 입증 |
|------|:-------------:|:-------:|------|
| 기존 docs (현재 비어있음) | ❌ | ❌ | docs/ 변경 없음 (기존 피처 docs/clevel-doc-coexistence 등 영향 없음) |
| sub-agent md frontmatter 변경 | ❌ | ❌ | frontmatter 키 추가만, 기존 필드 유지 |
| vais.config.json 키 추가 | ❌ | ❌ | additive (`primary`/`secondary`/`autoRouting`/`phaseArtifactMapping` 신규, 기존 키 유지) |
| `_tmp` 폴더 폐기 | ⚠️→❌ | ❌ | 기존 git 보존, 신규 미생성. 외부 _tmp 가진 사용자는 그대로 작동 |
| AskUserQuestion 강제 | ❌ | ❌ | 정책 동일, 강화만 (자가 점검 블록 추가) |
| External marketplace 사용자 | ❌ | ❌ | 옵트인 (CBO/COO 명시 호출 시 옛 동작) |

→ **외부 사용자 영향 = 0건. Migration 없이 즉시 사용 가능**.

## 추가 발견 (impact-analysis 외)

| # | 발견 | 영향 | 상태 |
|:-:|------|------|------|
| F-1 | `vais-validate-plugin.js` 가 `.mcp.json` 의 `_comment` / `mcpServers` 키를 server 로 오인식 → 2 errors | 본 피처와 무관, 사전 존재 validator bug | ✅ **Fixed (2026-05-03)** — `validateMcpJson()` 에서 `mcpServers` nested 우선 + `_*` 메타 필드 스킵. 검증 결과 0 errors / 0 warnings 로 회복 |
| F-2 | 단계별 patch idempotent 동작 검증 — `subdoc-block.js --dry-run` 재실행 시 동일 버전 스킵 | 외부 사용자 마이그레이션 안전성 확보 | — (기존 동작 검증) |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-02 | R-1~R-6 모두 통과 (6/6) — Breaking change 0건 (impact-analysis 평가 6/6 입증) — F-1 validator bug 무관 발견 (별도 issue) — F-2 patch idempotent 입증. 외부 사용자 즉시 사용 가능. |
| v1.1 | 2026-05-03 | F-1 validator bug fix — `vais-validate-plugin.js validateMcpJson()` 가 `mcpServers` nested 키 + `_*` 메타 필드 인식하도록 갱신. 결과 0 errors / 0 warnings. |
