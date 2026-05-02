---
owner: cto
agent: cto-direct
artifact: executive-summary
phase: report
feature: simplify-non-cto-workflow
generated: 2026-05-03
summary: "v0.62 → v2.0 핵심 변경 Before/After 표. 5 핵심 결정 + 정량 효과 + Breaking change 0 입증."
---

# Executive Summary — v0.62 → v2.0 변경

## Before / After 핵심 표

| 항목 | v0.62 (Before) | v2.0 (After) | 효과 |
|------|----------------|--------------|------|
| **C-Suite 정체성** | 6 C-Suite 모두 동등, 모든 phase 강제 | 4 Primary (CEO/CPO/CTO/CSO) + 2 Secondary (CBO/COO 명시 호출) | 코드 개발 도구로 명확화, 영역 외 부담 ↓ |
| **CEO 라우팅** | 하드코드 시나리오 (S-0~S-10) | CEO 7 차원 알고리즘 (`lib/ceo-algorithm.js`) — 보안/컴플라이언스/UX/데이터/외부통신/성능/제품정의 휴리스틱 | 매 피처 같은 알고리즘 → 일관성 ↑ |
| **mandatory PDCA** | 6 C-Level 모두 plan→design→do→qa 강제 | CTO 만 mandatory. CPO/CSO 는 CEO 활성 phase 만. CBO/COO 는 사용자 명시 호출 | 비-CTO C-Level 부담 ↓ |
| **Sub-doc 모델** | `_tmp/{slug}.md` scratchpad → C-Level 큐레이션 → topic 합성 | sub-agent 가 `docs/{feature}/{phase}/{artifact}.md` 직접 박제 (frontmatter 8 필드 표준) | 큐레이션 폐기 → 토큰 ~50% 절감, 정보 손실 0 |
| **main.md 형식** | 본문 + Topic Documents + Scratchpads + 큐레이션 기록 | 5 섹션 인덱스만 (Executive/Decision Record/Artifacts/CEO 판단 근거/Next Phase) | 200 lines 자연 충족, frontmatter 자동 추출 |
| **Size budget** | `mainMdMaxLines = 200` refuse | warn (인덱스 자연 충족) | refuse → warn 강등, 외부 사용자 친화 |
| **사용자 인터페이스** | 자연어 명령어 안내 + AskUserQuestion 혼용 | 모든 결정 = AskUserQuestion 클릭 (자연어 안내 0건, 자가 점검 블록) | 클릭 < 5/phase, 결정 부담 ↓ 60%+ |
| **외부 사용자** | sub-agent md 의존성 + frontmatter 변동 시 breaking | Breaking change 0 (impact-analysis 6/6 ❌, qa 6/6 입증) | v0.62 → v2.0 즉시 사용 가능 |

## 5 핵심 결정 (Decision Record 누적)

1. **D-1 정체성** — 4 Primary + 2 Secondary. CBO/COO 자동 라우팅 제외, 사용자 명시 호출 시만 활성. 자료는 보존
2. **D-2 CEO 알고리즘** — 7 차원 휴리스틱 + phase ↔ artifact 매핑. `lib/ceo-algorithm.js` 단일 모듈
3. **D-3 sub-agent 직접 박제** — `_tmp/` 폐기, frontmatter 8 필드 (owner/agent/artifact/phase/feature/source/generated/summary)
4. **D-4 main.md 인덱스** — 5 섹션 표준. `templates/main-md.template.md` 신규
5. **D-5 AskUserQuestion 클릭** — 모든 결정 = 도구 호출. 자연어 안내 금지 (자가 점검 블록 강제)

## 정량 결과 (do + qa 누적)

| 메트릭 | 값 | 출처 |
|--------|-----|------|
| 직접 변경 파일 | ~37 | git status |
| Inject 적용 (sub-agent + C-Level body) | 51 (45+6) | patch-subdoc-block + patch-clevel-guard |
| 옛 v0.57 subdoc-index 블록 제거 | 280 lines | 6 C-Level agent.md 일괄 |
| matchRate (SC-01~07) | **93%** (6.5/7) | qa-results.md |
| Critical issues | **0** | qa-results.md |
| Important issues | 1 (옛 ideation 문서 warn, by-design) | qa-results.md |
| Breaking changes | **0** (6 영역 모두 ❌) | regression-results.md + impact-analysis.md |
| auto-judge verdict | **PASS** (matchRate 93%, criticalIssueCount 0) | `node scripts/auto-judge.js cto` |
| F-1 validator bug | ✅ Fixed (2026-05-03) | regression-results.md v1.1 |
| Plugin 검증 | 0 errors / 0 warnings | `node scripts/vais-validate-plugin.js` |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-03 | Before/After 8 항목 + 5 핵심 결정 + 정량 결과표. v2.0 변경 단일 페이지 요약. |
