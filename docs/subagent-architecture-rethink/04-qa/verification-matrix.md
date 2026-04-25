---
owner: cpo
topic: verification-matrix
phase: qa
feature: subagent-architecture-rethink
---

# Topic: Verification Matrix (designCompleteness + 결정 매핑 + SC 측정)

## 1. designCompleteness 상세 (PRD 8섹션)

| # | 섹션 | 헤딩 (한/영) | 분량 | 내용 충족 |
|:-:|------|------------|:----:|---------|
| 1 | Summary / 요약 | `## 1. Summary` ✅ | ~250자 | 3 결함 + 4단계 메타-프레임 + mirror→prosthesis ✅ |
| 2 | Contacts / 담당 | `## 2. Contacts` ✅ | ~200자 | Owner + 6 C-Level + 위임 매트릭스 ✅ |
| 3 | Background / 배경 | `## 3. Background` ✅ | ~350자 | 사용자 자기진단 + 재프레임 + 3 결함 + 메타-프레임 채택 ✅ |
| 4 | Objective / 목표 | `## 4. Objective` ✅ | ~280자 | OKR (Doerr) + SC-01~10 통과 기준 ✅ |
| 5 | Market Segment / 대상 | `## 5. Market Segment` ✅ | ~280자 | P1/P2/P3 + JTBD + TAM/SAM/SOM ✅ |
| 6 | Value Proposition / 가치 제안 | `## 6. Value Proposition` ✅ | ~350자 | UVP + JTBD 6-Part + Geoffrey Moore + 차별점 ✅ |
| 7 | Solution / 기능 | `## 7. Solution` ✅ | ~380자 | F1~F8 + 기술 7요소 + 기술 제약 ✅ |
| 8 | Release / 출시 | `## 8. Release` ✅ | ~280자 | Sprint 1~14 + 3-Horizon + Go/No-Go ✅ |

**결과**: 8/8 모두 헤딩 + 80자+ 충족. **designCompleteness = 100%**. SC-07 통과 ✅.

## 2. 결정 일치성 매핑 (Plan↔Do)

### Plan 단계 (D-1~D-8)

| # | Plan 결정 | Do PRD 위치 | 일치 |
|:-:|----------|-----------|:----:|
| D-1 | 4단계 메타-프레임 채택 | 섹션 3, 7 | ✅ |
| D-2 | "산출물이 sub-agent 정의" 메타-원칙 | 섹션 3, 7 (F2) | ✅ |
| D-3 | 시나리오 역산 거부 | (배경 — Background 섹션) | ✅ |
| D-4 | 문헌 기반 뼈대 | 섹션 3 + Reference Canon | ✅ |
| D-5 | Template depth (c) | 섹션 7 (F3 SC-04) | ✅ |
| D-6 | 정책 4분류 | 섹션 7 (F2 + F3 정책 분포) | ✅ |
| D-7 | Project Profile + ideation hook | 섹션 7 (F1 SC-01) | ✅ |
| D-8 | C 확장 범위 채택 | 전체 PRD scope | ✅ |

### Design 단계 (D-D1~D-D13)

| # | Design 결정 | Do PRD 위치 | 일치 |
|:-:|-----------|-----------|:----:|
| D-D1 | 4단계 + 메타-원칙 일관 적용 | 섹션 7 | ✅ |
| D-D2 | Profile + 정책 게이트 | 섹션 7 (F1+F2) | ✅ |
| D-D3 | Template depth (c) | 섹션 7 (F3) | ✅ |
| D-D4 | release-engineer 5분해 + 의심 5 | 섹션 7 (F4+F5) | ✅ |
| D-D5 | Alignment α+β | 섹션 7 (F7) | ✅ |
| D-D6 | Profile schema v1 12 변수 | 섹션 7 (F1) | ✅ |
| D-D7 | VPC → product-strategist | 섹션 7 (F8 SC-06) | ✅ |
| D-D8 | CEO 4 신설 | 섹션 7 (F6) | ✅ |
| D-D9 | roadmap-author 신설 | 섹션 7 (F6) | ✅ |
| D-D10 | OPP-6 자동 흡수 | (`02-design/main.md` 참조 — 별도 작업 X) | ✅ |
| D-D11 | P1 경량화 정전 가이드 — 검토 보류 | 섹션 OOS + Decision Record | ✅ (OUT 명시) |
| D-D12 | 즉시 적용 3가지 | 섹션 7 (F2 frontmatter — canon_source/review_recommended/project_context_reason) | ✅ |
| D-D13 | "Always" 9개 적정성 인터뷰 검증 | RA + qa 검증 | ✅ |

**결과**: 21/21 결정 모두 PRD 또는 OOS에 명시. 누락 없음 ✅.

## 3. SC 측정 가능성 매트릭스

| SC | 임계 | 측정 도구 / 방법 | 측정 가능 |
|:--:|-----|-------------|:--------:|
| SC-01 | 3항목 모두 | (a) `hooks/ideation-guard.js` grep / (b) profile.yaml 파일 존재 / (c) `lib/project-profile.js` 모든 C-Level Context Load grep | ✅ 자동 |
| SC-02 | 25/25 | `scripts/template-validator.js` 일괄 실행 | ✅ 자동 (스크립트 신규) |
| SC-03 | 6/6 시나리오 | 통합 테스트: 6 sub-agent × Profile 의도적 위배 → skip 발생 확인 | ✅ 자동 |
| SC-04 | 25/25 (3섹션 충족) | template-validator 확장: `## (작성된 sample)` 100자+ + `## 작성 체크리스트` 5+ + `## ⚠ Anti-pattern` 3+ | ✅ 자동 |
| SC-05 | 모두 충족 | (a) `agents/coo/{name}.md` 5개 + description 80자+ / (b) 산출물 template SC-04 / (c) deprecate notice grep | ✅ 자동 |
| SC-06 | 3항목 변경 | (a) VPC template owner_agent grep / (b) copy-writer.md grep / (c) product-strategist.md grep | ✅ 자동 |
| SC-07 | designCompleteness ≥ 80 | `lib/auto-judge.js` PRD 파싱 → 헤딩 8개 + 각 80자+ | ✅ 자동 (현재 이미 통과) |
| SC-08 | 50/50 | template-validator 50개 일괄 (SC-04 확장) | ✅ 자동 |
| SC-09 | 44/44 점검 | `04-qa/subagent-audit-matrix.md` 행 수 + Q-A/B/C/D 4컬럼 모두 채워짐 | ✅ 자동 (스크립트 + 수동) |
| SC-10 | a 2/2 + b 충족 | (a) `lib/auto-judge.js` alignment 메트릭 grep + alignment 산출물 template 3개 / (b) `02-design/user-interviews.md` 작성됨 + Profile 변수 ≥1개 사용자 피드백 반영 | ✅ 자동(a) + 수동(b) |

**결과**: 10/10 모두 측정 가능 ✅. 측정 도구 8개 중 5개 신규 작성 필요 (`template-validator.js`, `auto-judge.js` alignment 메트릭, 통합 테스트 6, sub-agent audit 검증, alignment template 검증).

## 4. EXP 검증 시점 매핑

| EXP | qa 시점 가능? | 실제 실행 시점 |
|:---:|:------------:|------------|
| EXP-1 (Profile 게이트 30분) | ✅ | Sprint 1 |
| EXP-2 (depth c 품질 1시간) | ✅ | Sprint 4 |
| EXP-3 (44 매트릭스 2~3시간) | ✅ | Sprint 7 |
| EXP-4 (alignment α 4~8시간) | ❌ (qa는 검증 가능성만 확인) | Sprint 11 |
| EXP-5 (외부 인터뷰 2~3주) | ❌ | Sprint 11~14 |

## 5. 큐레이션 기록

| 검증 항목 | 결과 |
|----------|:----:|
| designCompleteness 100% | ✅ |
| 결정 일치성 21/21 | ✅ |
| SC 측정 가능성 10/10 | ✅ |
| 누락된 결정 없음 | ✅ |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — designCompleteness + 결정 매핑 + SC 측정 매트릭스 |
