---
owner: cto
artifact: shared-guard-alignment-log
phase: do
feature: workflow-contract-alignment
generated: 2026-05-12
source: "docs/workflow-contract-alignment/01-plan/workflow-contract-matrix.md"
summary: "shared guard v2.2 정렬, patch-block 중복 제거 로직 보강, C-Level 6개와 sub-agent 45개에 inline guard 전파."
---

# Shared Guard Alignment Log

## 1. 변경 범위

| Area | Files |
|------|-------|
| Shared guards | `agents/_shared/subdoc-guard.md`, `clevel-main-guard.md`, `clevel-main-guard.full.md`, `checkpoint-policy.md`, `work-rules.md`, `ideation-guard.md` |
| Propagated C-Level prompts | `agents/{ceo,cpo,cto,cso,cbo,coo}/{role}.md` |
| Propagated sub-agent prompts | 45 files targeted by `scripts/patch-subdoc-block.js` |
| Patch helper | `lib/patch-block.js` |

## 2. 주요 수정

| Contract | Before | After |
|----------|--------|-------|
| Subdoc frontmatter example | `owner: cto`, `artifact: prd` fixed sample | `{owner}`, `{artifact}`, `{phase}`, `{feature}` placeholders |
| Knowledge refs | `cto/knowledge/...` style sample | `agents/{owner}/knowledge/{file}.md` full prefix |
| Handoff path | `docs/{feature}/{phase}/{name}.md` | `docs/{feature}/{NN-phase}/{artifact}.md` |
| C-Level main | owner H2 section replacement language | 5-section index-only, append-only Decision Record |
| Ideation artifact | `main.md` body + 8-field wording | `main.md` index + `ideation-decision.md` artifact + 4 required fields |
| Checkpoint policy | role CP table without activation contract | CTO mandatory, CPO/CSO activated artifact only, CBO/COO explicit secondary |
| Patch helper | first marker/version only, duplicate stale block could remain | optional separator support + duplicate managed block collapse |

## 3. 전파 결과

```text
patch-clevel-guard.js summary:
  총 대상: 6 파일
  버전 교체: 6
  경고: 0

patch-subdoc-block.js summary:
  총 대상: 45 파일
  버전 교체: 45
  경고: 0

duplicate cleanup pass:
  버전 교체: 10
  경고: 0
```

최종 dry-run:

```text
patch-clevel-guard.js --dry-run:
  동일 버전 스킵: 6
  경고: 0

patch-subdoc-block.js --dry-run:
  동일 버전 스킵: 45
  경고: 0
```

## 4. 검증

| Check | Result |
|-------|--------|
| stale guard scan | PASS — v2.1 guard, fixed `owner: cto` sample, 8-field mandatory wording 없음 |
| duplicate injected marker scan | PASS — duplicate marker 없음 |
| `npm test` | PASS — 290 tests, 287 pass, 3 skipped |
| `npm run lint` | PASS |
| `node scripts/vais-validate-plugin.js .` | PASS — 0 errors, 0 warnings |
| `node scripts/doc-validator.js cto workflow-contract-alignment` | Expected drift — scope-contract legacy warnings remained before QA doc creation |

## 5. 후속 대상

- 3단계: phase router 정책 충돌 제거
- 4단계: agent prompt 안의 오래된 artifact path 직접 지시 제거
- 5단계: template 의 `main.md` index-only vs full body 충돌 정리

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-12 | shared guard alignment 구현 로그 작성 |
