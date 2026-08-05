---
owner: cto
artifact: template-alignment-log
phase: do
feature: workflow-contract-alignment
generated: 2026-05-13
source: "Stage 5 template alignment"
summary: "workflow/catalog templates 의 PRD 경로, phase index/body 역할, legacy sample 표현을 current artifact contract 에 맞춰 정리."
---

# Template Alignment Log

## 1. Scope

5단계는 template 계층만 정리했다. 목적은 새 문서를 생성할 때 legacy contract 가 다시 복사되지 않게 하는 것이다.

## 2. Changes

| Area | Before | After |
|------|--------|-------|
| PRD input path | `docs/{feature}/03-do/main.md` | `docs/{feature}/01-plan/prd.md` |
| Plan templates | `_tmp` / scratchpad inventory section | direct artifact reference section |
| Workflow templates | `main.md index-only` 문구와 full body template 혼재 | artifact body template 로 명시, index 는 `main-md.template.md` |
| Sample templates | `release-engineer`, `_tmp`, `clevel-coexistence`, `sub-doc 보존` | COO 운영 agent 분리, phase index, direct artifact 보존 |
| Auto selector | PRD quality reads old do main path only | `01-plan/prd.md` primary, old do main fallback |
| Init utility | reverse-generated plan/design body targets `main.md` | artifact file + `main.md` index split |

## 3. Files Updated

| File group | Notes |
|------------|-------|
| `templates/plan-*.template.md` | PRD path and artifact-body wording |
| `templates/design.template.md`, `do.template.md`, `qa.template.md`, `report.template.md`, `ideation.template.md` | body/index role split |
| `templates/what/*`, `templates/how/*`, `templates/why/*`, `templates/alignment/*`, `templates/core/*` | legacy sample wording cleanup |
| `scripts/auto-select-template.js` | PRD detector primary path update |
| `scripts/template-validator.js` | stale `_tmp` design reference comment cleanup |
| `skills/vais/utils/init.md` | reverse-generation target path update |

## 4. Residual

Knowledge files are intentionally left for Stage 6. Code-level backward compatibility for old `_tmp` docs and old PRD fallback remains outside this stage.

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-13 | template alignment log 작성 |
