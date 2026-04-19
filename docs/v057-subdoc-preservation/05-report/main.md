# v057-subdoc-preservation — 완료 보고서

> 참조 문서: `../01-plan/main.md`, `../02-design/main.md`, `../02-design/interface-contract.md`, `../03-do/main.md`, `../04-qa/main.md`

## Executive Summary

### Project Overview

| 항목 | 내용 |
|------|------|
| Feature | `v057-subdoc-preservation` |
| 시작일 | 2026-04-19 |
| 완료일 | 2026-04-20 |
| 기간 | 2일 (Plan → Design → Do(A/B/C/D) → QA → Report) |
| 버전 목표 | v0.56.2 → **v0.57.0** |

### Value Delivered

| Perspective | Planned | Actual |
|-------------|---------|--------|
| **Problem** | 35+ sub-agent 원본 분석이 C-Level main.md 축약에서 유실 + 병렬 쓰기 race + 근거 추적 불가 | 동일 — `_tmp/` scratchpad 도입으로 원본 보존 경로 확보 |
| **Solution** | sub-agent `_tmp/{slug}.md` scratchpad + C-Level topic 별 큐레이션 문서 + main.md 인덱스화 (2-layer 모델) | 구현 완료. **단, `includes[]` 런타임 미동작(R1 발동)으로 "블록 직접 복붙 (Option A) + patch 스크립트"로 pivot** |
| **UX Effect** | 사용자는 topic 중심 독서, 필요 시 `_tmp/` 원본 추적 | 모델 확정 + convention/validator/templates 완비. 실제 적용은 신규 피처부터 (기존은 그대로) |
| **Core Value** | (1) 의사결정 근거 추적성, (2) 큐레이션 가치 가시화, (3) race 제거, (4) 사용자 친화 구조 | 4가지 모두 인프라 확보. 큐레이션 품질은 운영 누적으로 검증 필요 |

---

## Success Criteria Final Status

| ID | Criterion | Status | Evidence |
|----|-----------|:------:|----------|
| SC-01 | `vais.config.json > workflow.topicPresets` + `docPaths.scratchpad` 스키마 | ✅ Met | Batch A T1 (diff 확인) |
| SC-02 | `_shared/subdoc-guard.md` + 35 sub-agent `includes` → **pivot: 본문 block-inject** | ✅ Met (Pivot) | Batch A T2 + Batch B 36 agent 패치 (grep) |
| SC-03 | 6 C-Level md main.md = 인덱스+의사결정+큐레이션 포맷 | ✅ Met | Batch D T3 — 6 파일 |
| SC-04 | `templates/subdoc.template.md` 존재 (공통 1종) | ✅ Met | Batch A T5 (ls) |
| SC-05 | `doc-validator.js` `_tmp/` + topic + 큐레이션 검증 | ✅ Met | Batch C T7 — W-* 경고 6종 (tests 12 pass) |
| SC-06 | `status.js` subDocs[] + registerSubDoc/listSubDocs/unregisterSubDoc | ✅ Met | Batch C T8 (tests 13 pass) |
| SC-07 | `auto-judge.js` main.md → `_tmp/qa-engineer.md` fallback | ✅ Met | Batch C T9 (tests 6 pass) |
| SC-08 | CLAUDE.md Rule #13 확장 + **Rule #14 신설** + AGENTS 동기화 | ✅ Met | Batch D T11 (diff) |
| SC-09 | 4 파일 버전 0.56.2 → **0.57.0** + CHANGELOG | ✅ Met | Batch D T13 (grep) |
| SC-10 | Smoke test — 샘플 피처에 W-* 경고 실제 발화 | ✅ Met | Batch D T15 — 5/5 경고 발화 |
| SC-11 | `npm test` 169 pass / lint / validate-plugin | ⚠️ Partial | npm test **193 pass** (초과 달성), lint(eslint 미설치) Deferred, validator 0 오류 |

**Success Rate**: **10 Met / 1 Partial** out of 11 = **95%** (Partial 0.5 가중 시 종합 matchRate 97%)

---

## PDCA Cycle Summary

| Phase | Status | Key Output |
|-------|:------:|------------|
| Plan | ✅ | `../01-plan/main.md` — 12 Feature (F1~F12) + 11 SC + Impact Analysis(70+ files) |
| Design | ✅ | `../02-design/main.md` + `../02-design/interface-contract.md` — 4 Contract 확정 |
| Do (Batch A) | ✅ | `vais.config.json` + `_shared/subdoc-guard.md` + `subdoc.template.md` + R1 smoke FAIL 확정 |
| Do (Batch B) | ✅ | **36 agent 본문 block-inject** (Option A pivot) + patch 스크립트 |
| Do (Batch C) | ✅ | `doc-validator.js` / `lib/status.js` / `auto-judge.js` 3종 확장 + 테스트 |
| Do (Batch D) | ✅ | 6 C-Level md 포맷 + Rule #14 + 버전 0.57.0 + CHANGELOG + smoke test |
| QA | ✅ | `../04-qa/main.md` — matchRate 97%, Critical 0, Important 5, **pass_with_warnings** |
| Report | ✅ | 본 문서 |

> Batch E (`guide/v057/*` 7 파일 재작성)는 범위 밖으로 명시 이관.

---

## Key Decisions & Outcomes

| Decision | Source | Followed? | Outcome |
|----------|--------|:---------:|---------|
| `_tmp/` 영구 보존 + git 커밋 | Plan §5.1 규칙 #1 | ✅ | convention 확정. `.hooks/pre-commit` 영향 없음 확인 |
| 공통 템플릿 1종만 (특화 5종 v0.57.1 이연) | Plan §0.5 MVP | ✅ | `templates/subdoc.template.md` 단일 파일로 출시 |
| `_shared/subdoc-guard.md` include 로 DRY | Plan F4 | ❌ (Pivot) | R1 smoke FAIL → **Option A 블록 직접 복붙**. `includes[]` 는 advisor 프롬프트 빌더 전용임이 확정됨 |
| 큐레이션 기록 섹션 강제 | Plan §5.1 규칙 #3 | ✅ | topic 문서에 `## 큐레이션 기록` 섹션 필수. doc-validator `W-TPC-01` 경고 |
| enforcement = warn only (v0.57) | Plan §5.1 규칙 #5 | ✅ | `workflow.subDocPolicy.enforcement: "warn"`. fail 전환은 v0.58+ |
| Walking Skeleton Do 분할 (A/B/C/D) | Plan §CTO 기술분해 | ✅ | 4 Batch 순차 + Batch E(guide) 이관으로 범위 관리 |
| 35 sub-agent 일괄 수정 전략 | Plan Impact §Changed | ✅ (확장) | **36 파일** (ceo/absorb-analyzer + skill-creator 포함 여부 Batch B 진행 중 확정) patch 스크립트로 실행 |
| v0.57 은 신규 피처만 적용, 기존 피처 무변경 | Plan §6 호환성 | ✅ | 기존 v0.56 피처 main.md 단독 허용. warn 없음 |

---

## QA Results

| Metric | Target | Final | 판정 |
|--------|--------|-------|:---:|
| matchRate (Gap 일치율) | ≥ 90% | **97%** | ✅ |
| criticalIssueCount | 0건 | **0건** | ✅ |
| importantIssueCount | — | 5건 | ⚠️ (기술 부채 이관) |
| npm test | ≥ 169 pass | **193 pass / 0 fail** | ✅ |
| plugin-validator | 0 오류 | 0 오류 / 0 경고 / 9 정보 | ✅ |
| Interface Contract 이행 | 4/4 | 4/4 | ✅ |

**릴리즈 판정**: **pass_with_warnings** — Critical 없음, Important 5건 모두 후속 sprint 이관 가능.

### Important 이슈 (기술 부채로 이관)

| # | 이슈 | 우선순위 | 후속 조치 |
|---|------|:-------:|----------|
| TD-1 | `lib/registry/agent-registry.js > loadAgent()` mergedBody 가 sub-agent runtime 미반영 (advisor 프롬프트 전용) | Medium | 문서화 (Rule #14) 완료. 코드 제거 여부는 v0.58 검토 |
| TD-2 | `advisor-guard.md` 도 sub-agent runtime 미로드 확정 — **advisor-activation (v0.54) 전제 재검토 필요** | **High** | 별도 sprint "advisor 실제 동작 감사" |
| TD-3 | `scripts/patch-advisor-frontmatter.js` 가 frontmatter 만 수정하는지 감사 | **High** | TD-2 원인 진단용 |
| SC-C6 | lint (eslint) 로컬 미설치 | Low | CI 에서 `npx eslint` 또는 `npm i -D eslint` |
| Batch E | `guide/v057/*` 7 파일이 구 "영구 보존" 모델로 작성됨 (실제 구현과 불일치) | Low | 별도 세션에서 Batch E 실행 |

---

## Retrospective

### Keep (잘한 점)
- **Walking Skeleton 4-Batch 분할**: A(infra) → B(36 agent 패치) → C(tooling) → D(release). 각 Batch 가 독립 커밋 가능한 단위로 분리되어 리뷰/롤백 용이.
- **R1 smoke test 선행**: Plan 에서 명시한 리스크 R1(include 런타임 미동작)을 Batch A 완료 직후 smoke test 로 검증 → Pivot 타이밍 확보. 만약 Batch B 끝까지 진행 후 발견했으면 35 agent 재작업 필요했을 것.
- **enforcement=warn 기본값 선택**: 도입 초기 사용자에게 점진적 전환 여유 제공. fail 강제화는 v0.58 이후.
- **템플릿 최소주의**: 공통 `subdoc.template.md` 1종만으로 출시, 특화 5종은 v0.57.1 이연 → 범위 관리 성공.

### Problem (개선할 점)
- **`includes[]` 메커니즘이 실제 런타임에 통합되지 않은 채 v0.54 advisor-activation 부터 전제로 쓰였다**: v0.57 에서 처음 smoke test 로 확인됨. 더 일찍 감사했어야 함. → **TD-2 / TD-3 별도 sprint**
- **메타 피처 문서 자체가 2-layer 모델을 사용하지 않음**: `docs/v057-subdoc-preservation/` 는 CTO 가 main.md 에 직접 기록 (sub-agent 위임 없는 메타 작업). "Dogfooding" 기회 놓침 → 다음 실제 피처에서 적용 검증.
- **lint 도구 로컬 미설치**: SC-11 lint 항목 Deferred 로 처리. 개발환경 표준화 미흡.
- **`guide/v057/*` 는 Plan 단계에서 구 모델로 작성됐으나 Do 종료 전까지 재작성 미실행**: Batch E 로 이관했으나 사용자 혼란 유발 가능. `docs/` (메모리) 와 `guide/` (배포) 분리 관리 필요.

### Try (다음에 시도할 것)
- **신규 피처에서 2-layer 모델 실제 적용 (dogfooding)**: 첫 피처에서 C-Level 큐레이션 품질을 정성 평가. `## 큐레이션 기록` 섹션이 실제로 채택/거절/병합/추가 근거를 기록하는지.
- **advisor 메커니즘 감사 sprint**: TD-2 / TD-3 → `agent-registry.loadAgent()` 의 실제 소비자 경로 전수 확인. 미사용이면 제거 또는 실제 경로에 연결.
- **doc-validator enforcement 단계적 강화**: v0.57.1 warn → v0.58 retry → v0.59 fail. 피처 N개 누적 후 judgment.
- **특화 템플릿 5종 (v0.57.1)**: engineer / analyst / auditor / designer / researcher 별 sub-doc 템플릿. 현재 공통 1종만으로 일부 agent 스타일 충돌 가능.
- **`_tmp/` 리포 크기 모니터링**: 피처당 ≤ 1MB 가정이 실제로 유지되는지 N피처 누적 후 측정. 필요 시 압축/아카이빙 전략.

---

## Next Steps

- [ ] **v0.57.0 Release**: `/vais commit` 으로 Conventional Commits + 태그 `v0.57.0` 생성 → COO 협업으로 npm publish / 마켓플레이스 배포
- [ ] **Batch E — `guide/v057/*` 7 파일 재작성**: 별도 세션에서 "scratchpad + 큐레이션 + topic" 모델로 재작성 (Low priority)
- [ ] **TD-2 / TD-3 advisor 감사 sprint**: `includes[]` 의 실제 런타임 경로 확인 + advisor-activation 전제 재검증 (High priority, 별도 피처)
- [ ] **v0.57.1 특화 템플릿 5종 추가**: engineer / analyst / auditor / designer / researcher
- [ ] **dogfooding**: 다음 실제 피처를 2-layer 모델로 실행하여 큐레이션 품질 검증

<!-- v0.57 subdoc-section begin -->

---

## Topic Documents (v0.57+)

> Report 는 **main.md 단독** 정책 (`vais.config.json > workflow.subDocPolicy.reportPhase = "single"`). 본 피처는 메타 작업이라 sub-agent 위임 없음 → Topic Documents / Scratchpads 섹션 생략.

<!-- v0.57 subdoc-section end -->

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-20 | 초기 작성 — QA pass_with_warnings(97%/0 Critical) 기반 Report. TD-2/TD-3/Batch E 이관, v0.57.0 릴리즈 준비 완료 |

<!-- template version: report v0.57.0 -->
