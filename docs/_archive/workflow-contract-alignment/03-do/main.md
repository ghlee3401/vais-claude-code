---
owner: cto
artifact: main
phase: do
feature: workflow-contract-alignment
---

# workflow-contract-alignment — Do 인덱스

## Executive Summary

2단계 shared guard 정리, 3단계 phase router 정리, 4단계 agent prompt 정리, 5단계 template 정리, 6단계 knowledge 정리를 완료했다. 변경 범위는 `agents/_shared/*` 정본 guard, guard 전파 스크립트의 idempotency 보강, 전파된 C-Level/sub-agent inline guard 블록, `skills/vais/phases/*.md` 라우팅 계약, C-Level/대표 sub-agent prompt 의 artifact path 정렬, workflow/catalog template 의 current contract 정렬, 그리고 C-Level lazy-load knowledge 의 legacy 지식 제거다.

핵심 결과:

- subdoc frontmatter 예시에서 고정 `owner: cto`, `artifact: prd` 값을 제거했다.
- C-Level `main.md` 규칙을 owner H2 섹션 중심에서 5섹션 index 중심으로 정렬했다.
- ideation guard 의 8-field/frontmatter 본문 박제 규칙을 4-field artifact 분리 규칙으로 정정했다.
- `lib/patch-block.js` 가 separator 없는 기존 inline block 과 중복 managed block 을 안전하게 갱신하도록 보강했다.
- 6개 C-Level guard 와 45개 sub-agent subdoc guard 를 v2.2 로 전파했다.
- top-level `SKILL.md` 와 phase router 를 role별 activation contract 에 맞췄다.
- CPO/CSO 에 남아 있던 CTO식 mandatory phase 순서 강제를 제거했다.
- CBO/COO 를 Secondary 명시 호출 `plan|do|qa` 로 제한했다.
- C-Level agent prompt 에서 `main.md` 본문 산출물 지시를 artifact 경로로 교체했다.
- `prd-writer` 의 PRD 저장 위치를 `01-plan/prd.md` 로 정렬했다.
- CEO/CPO author sub-agent 의 `_tmp` scratchpad/큐레이션 대기 지시를 direct artifact 저장으로 교체했다.
- COO prompt 의 retired `release-engineer` 참조를 split sub-agent set 으로 교체했다.
- plan/design/do/qa/report template 을 artifact body 용도로 명시하고 phase index 는 `main-md.template.md` 로 분리했다.
- catalog/sample template 의 legacy `_tmp`, retired agent, old PRD path 표현을 현재 direct artifact contract 로 교체했다.
- `scripts/auto-select-template.js` 는 `01-plan/prd.md` 를 PRD primary path 로 읽도록 수정했다.
- knowledge 문서의 old PRD path, retired COO agent, Secondary phase omission, QA metric source drift 를 정리했다.

## Decision Record

| Date | Decision | Owner | Source |
|------|----------|-------|--------|
| 2026-05-12 | shared guard version 을 v2.2 로 올리고 workflow contract matrix 를 참조시킨다 | CTO | `workflow-contract-matrix.md` |
| 2026-05-12 | subdoc 예시는 역할 중립 placeholder 로 바꾼다 | CTO | `agents/_shared/subdoc-guard.md` |
| 2026-05-12 | C-Level main guard 는 5섹션 index-only 를 정본으로 삼고 legacy owner H2 는 보존 대상으로만 둔다 | CTO | `agents/_shared/clevel-main-guard*.md` |
| 2026-05-12 | patch helper 는 separator 유무와 중복 managed block 을 모두 처리하도록 수정한다 | CTO | `lib/patch-block.js` |
| 2026-05-12 | shared guard 변경은 실제 active prompt 에 반영되도록 patch scripts 로 전파한다 | CTO | `scripts/patch-clevel-guard.js`, `scripts/patch-subdoc-block.js` |
| 2026-05-12 | CTO 만 mandatory PDCA 를 유지하고 CEO/CPO/CSO/CBO/COO 라우터는 activation contract 에 맞춰 정리한다 | CTO | `phase-router-alignment-log.md` |
| 2026-05-13 | agent prompt 본문은 `main.md` 본문 박제 대신 direct artifact path 를 지시해야 한다 | CTO | `agent-prompt-alignment-log.md` |
| 2026-05-13 | templates 는 phase index 와 artifact body 역할을 명시적으로 분리해야 한다 | CTO | `template-alignment-log.md` |
| 2026-05-13 | C-Level knowledge 는 active prompt/template 과 같은 artifact contract 를 lazy-load 해야 한다 | CTO | `knowledge-alignment-log.md` |
| 2026-05-14 | cross-review-by-claude §6 권고 1+2 통합 해소 — (1) doc-validator W-SCOPE 룰을 plan body artifact fallback + regex 완화 (`\b` 제거 한글 매치 버그 봉합) + (2) `validateDocs` 에 empty-feature / ideation-only 자동 인식 + 2 피처 retroactive stub backfill (vais-positioning-rethink/05-report, v0-66-1-hotfix-alignment/02-design + 05-report, vais-positioning-rethink/01-plan/plan-rationale.md scope 섹션 append). 5 피처 모두 doc-validator PASS, npm test 293 무회귀, lint clean | CTO | `recommendations-fix-log.md` |

## Artifacts

| File | Type | Description |
|------|------|-------------|
| `03-do/main.md` | 인덱스 | 본 문서 |
| `03-do/shared-guard-alignment-log.md` | 구현 로그 | shared guard 수정 및 전파 내역 |
| `03-do/phase-router-alignment-log.md` | 구현 로그 | phase router 정책 충돌 제거 내역 |
| `03-do/agent-prompt-alignment-log.md` | 구현 로그 | agent prompt artifact/path 정렬 내역 |
| `03-do/template-alignment-log.md` | 구현 로그 | template artifact/path/sample 정렬 내역 |
| `03-do/knowledge-alignment-log.md` | 구현 로그 | knowledge lazy-load 지식 정렬 내역 |
| `03-do/recommendations-fix-log.md` | 후속 fix 로그 | cross-review 권고 1+2 (W-SCOPE 정합 / mandatoryPhases retroactive backward-compat) 통합 해소. validator 코드 수정 + retroactive stub backfill |

## CEO 판단 근거

이 작업은 사용자가 명시 승인한 "2단계 shared guard 정리"다. CEO 자동 라우팅이 아니라 `workflow-contract-alignment` 계획의 후속 실행으로 처리했다.

## Next Phase

다음은 7단계 최종 검증이다.

- 전체 legacy scan 범위 재점검
- validator/runtime compatibility warning 을 남길지 정리할지 결정
- 최종 test/lint/plugin/doc 검증 결과 확정

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-12 | 2단계 shared guard alignment 구현 인덱스 생성 |
| v1.1 | 2026-05-12 | 3단계 phase router alignment 결과 추가 |
| v1.2 | 2026-05-13 | 4단계 agent prompt alignment 결과 추가 |
| v1.3 | 2026-05-13 | 5단계 template alignment 결과 추가 |
| v1.4 | 2026-05-13 | 6단계 knowledge alignment 결과 추가 |
| v1.5 | 2026-05-14 | cross-review 권고 1+2 통합 해소 — `recommendations-fix-log.md` artifact 추가 + Decision Record 1 행 append. 5 피처 doc-validator PASS / npm test 293 무회귀 |
