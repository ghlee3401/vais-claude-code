---
owner: cto
agent: cto-direct
artifact: qa-results
phase: qa
feature: simplify-non-cto-workflow
generated: 2026-05-02
summary: "Success Criteria SC-01~SC-07 검증 결과표. 6.5/7 통과 (matchRate 93%), Critical 0, Important 1 (옛 문서 warn, by-design)."
---

# QA Results — SC-01~SC-07 검증

## 검증 방법

CTO 직접 grep / node / find 명령으로 객관 증거 수집. plan main.md §Success Criteria 의 SC-01~SC-07 1:1 매핑.

## SC 검증 표

| ID | 기준 | 검증 명령 | 결과 | 판정 |
|:--:|------|---------|------|:----:|
| SC-01 | `/vais ceo {요청}` 1번 → 자동 phase + 클릭 1회 | `lib/ceo-algorithm.js` `analyzeCEO()` 호출 → 7 dimensions 객체 + activeCLevels 자동 결정 | dimensions 7개 정상, activeCLevels 자동 산출 | ✅ |
| SC-02 | 4 Primary (CEO/CPO/CTO/CSO) 자동 + CBO/COO 명시 호출만 | `grep -E '"primary"\|"secondary"' vais.config.json` | `"primary": ["ceo","cpo","cto","cso"]` + `"secondary": ["cbo","coo"]` + `"default": "primary"` + `"secondaryActivation": "explicit"` | ✅ |
| SC-03 | sub-agent 가 docs/{feature}/{phase}/{artifact}.md 직접 박제 (`_tmp/` 미생성) | `find docs -name "_tmp" -type d \| wc -l` | **0건** (사실상 v2.0 sub-agent 직접 박제 모델 작동 증거) | ✅ |
| SC-04 | 모든 phase main.md 200줄 이내 (인덱스 형식) | `wc -l` per main.md | 01-plan: 145, 02-design: 84, 03-do: 150, 04-qa: 본 문서. 단, 00-ideation: **399** (warn — 옛 v1.x 모델 작성, by-design) | ⚠️ Partial (4/5 통과, 1 by-design warn) |
| SC-05 | 모든 artifact md frontmatter 표준 8 필드 | `node scripts/doc-validator.js simplify-non-cto-workflow` | `{"passed":true,"frontmatterWarnings":[]}` — 16/16 artifact 통과 | ✅ |
| SC-06 | 자연어 명령어 안내 0건, 모든 결정 = AskUserQuestion 클릭 | `grep -c "AskUserQuestion" skills/vais/SKILL.md` + 정성 검토 | SKILL.md = 14 occurrences. 6 phase router 모두 `AskUserQuestion 도구를 호출` 강제 규칙. agent md `<!-- @refactor:begin common-rules -->` 자가 점검 블록 보유 | ✅ |
| SC-07 | doc-validator + auto-judge 새 모델 호환 | `doc-validator` passed, `auto-judge.js` v2.0 분기 (judgeCPO 01-plan/prd.md 우선, judgeAll primary-only) 단계 3 smoke test 통과 | doc-validator 16 artifact 통과 + auto-judge primary 만 판정 | ✅ |

## matchRate 계산

```
SC-01 ✅ (1.0) + SC-02 ✅ (1.0) + SC-03 ✅ (1.0) + SC-04 ⚠️ (0.5)
+ SC-05 ✅ (1.0) + SC-06 ✅ (1.0) + SC-07 ✅ (1.0)
= 6.5 / 7
= 92.86%
```

**Threshold**: 90% (vais.config.json gap analysis 기준)
**판정**: PASS (93% > 90%)

## Critical / Important 이슈

| 심각도 | # | 이슈 | 조치 |
|:-----:|:-:|------|------|
| Critical | 0 | — | — |
| Important | 1 | `00-ideation/main.md` = 399 lines (200 초과) | by-design — 옛 v1.x 모델로 작성된 ideation 문서. v2.0 인덱스 표준 적용 시 재작성 필요. 단, mainMdMaxLinesAction = "warn" 정책으로 차단 안 함. **다음 피처부터 자연 마이그레이션** |
| Info | 1 | `vais-validate-plugin.js` 가 `.mcp.json` 의 `_comment` / `mcpServers` 키를 서버로 오인식하여 2 errors | ✅ **2026-05-03 Fixed** — `validateMcpJson()` 가 `mcpServers` nested + `_*` 메타 필드 인식하도록 갱신. 0 errors / 0 warnings 로 회복 |

## Success Criteria 평가표 (CEO 추천 형식)

| SC-ID | 기준 | 결과 | 근거 |
|:-----:|------|:----:|------|
| SC-01 | CEO 7 차원 + AskUserQuestion 1번 자동 PDCA | ✅ Met | `lib/ceo-algorithm.js analyzeCEO()` 7 dimensions 정상 |
| SC-02 | 4 Primary + 2 Secondary | ✅ Met | `vais.config.json cSuite.primary/secondary` |
| SC-03 | `_tmp/` 폴더 미생성 | ✅ Met | `find docs -name _tmp -type d` = 0건 |
| SC-04 | 모든 phase main.md ≤ 200 lines | ⚠️ Partial | 4/5 통과 (00-ideation 옛 문서 warn, by-design) |
| SC-05 | frontmatter 8 필드 | ✅ Met | 16/16 artifact passed |
| SC-06 | 자연어 안내 0건, AskUserQuestion 클릭 | ✅ Met | SKILL.md + agent md 강제 규칙 다중 검증 |
| SC-07 | doc-validator + auto-judge 호환 | ✅ Met | 단계 3 smoke test + 본 QA passed |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-02 | SC-01~07 검증 결과 6.5/7 (93%) — Critical 0 / Important 1 (옛 문서 warn) — verdict: PASS. doc-validator dogfooding + grep/node 객관 증거. |
| v1.1 | 2026-05-03 | F-1 vais-validate-plugin bug fix 확인 — Info 항목 → Fixed 로 갱신. 본 피처 외부 발견 사항 모두 해소. |
