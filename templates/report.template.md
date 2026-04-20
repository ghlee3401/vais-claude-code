# {feature} — 완료 보고서

> 참조 문서: `docs/{feature}/01-plan/main.md`, `docs/{feature}/02-design/main.md`, `docs/{feature}/04-qa/main.md`
> <!-- size budget: main.md ≤ 200 lines 권장. Report phase 는 `reportPhase: "single"` 정책으로 멀티-오너 허용하나 경고 없음. -->

## Executive Summary

### Project Overview

| 항목 | 내용 |
|------|------|
| Feature | {피처명} |
| 시작일 | {date} |
| 완료일 | {date} |
| 기간 | {n}일 |

### Value Delivered

| Perspective | Planned | Actual |
|-------------|---------|--------|
| **Problem** | {계획한 문제 해결} | {실제 해결한 문제} |
| **Solution** | {계획한 솔루션} | {실제 구현한 솔루션} |
| **UX Effect** | {계획한 UX 효과} | {실제 UX 효과} |
| **Core Value** | {계획한 핵심 가치} | {실제 달성한 가치} |

---

## Success Criteria Final Status

| ID | Criterion | Status | Evidence |
|----|-----------|--------|----------|
| SC-01 | {기준} | ✅ Met / ⚠️ Partial / ❌ Not Met | {근거} |

**Success Rate**: {n}/{m} criteria met ({p}%)

---

## PDCA Cycle Summary

| Phase | Status | Key Output |
|-------|--------|------------|
| Plan | ✅/⬜ | `docs/{feature}/01-plan/main.md` |
| Design | ✅/⬜ | `docs/{feature}/02-design/main.md` |
| Do | ✅/⬜ | `docs/{feature}/03-do/main.md` |
| QA | ✅/⬜ | `docs/{feature}/04-qa/main.md` |

---

## Key Decisions & Outcomes

| Decision | Source | Followed? | Outcome |
|----------|--------|-----------|---------|
| {결정 사항} | Plan/Design | ✅/❌ | {결과} |

---

## QA Results

| Metric | Target | Final |
|--------|--------|-------|
| Gap 일치율 | ≥90% | {n}% |
| QA 통과율 | ≥90% | {n}% |
| Critical 이슈 | 0건 | {n}건 |
| Warning 이슈 | — | {n}건 |

---

## Retrospective

### Keep (잘한 점)
-

### Problem (개선할 점)
-

### Try (다음에 시도할 것)
-

---

## Next Steps

- [ ]

<!-- v0.57 subdoc-section begin -->

---

## Topic Documents (v0.57+)

> Report 는 **main.md 단독** 정책 (`vais.config.json > workflow.subDocPolicy.reportPhase = "single"`). Topic Documents / Scratchpads 섹션은 선택 사항.

<!-- v0.57 subdoc-section end -->


---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | {date} | 초기 작성 |

<!-- template version: v0.58.0 (v0.57+ subdoc / v0.58+ clevel-coexistence 포함) -->
