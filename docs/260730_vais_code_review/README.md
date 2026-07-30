# vais-code 전체 리뷰 (2026-07-30)

> 분석 방식: vais 워크플로우 미사용, 소스 직접 분석 (정량 측정 + 정성 평가).
> 기준: 이 플러그인을 만든 원래 목적 3가지에 대한 적합성.

## 원래 목적 (평가 기준)

1. **이력을 남기면서 일관성 있는 개발** — 개발 히스토리가 문서로 축적되고, 세션이 바뀌어도 맥락이 이어질 것
2. **완성도 높은 결과물** — 계획 → 구현 → 검증 루프로 품질을 끌어올릴 것
3. **하네스/루프 엔지니어링 학습** — hook, 상태 관리, 에이전트 오케스트레이션 실험장

## 총평 (Verdict)

**목적 1·2를 달성하는 핵심 메커니즘은 유효하다. 그러나 그 위에 쌓인 "조직 시뮬레이션 레이어"가 핵심 가치의 3~5배 비용을 소모하고 있다.**

| 평가 항목 | 판정 | 근거 |
|-----------|------|------|
| 이력/일관성 (목적 1) | ⚠️ 과잉 달성 | 이력은 남는데, 이력을 남기는 행위 자체가 주 작업이 됨. 피처 1개 = 문서 17개 (실측) |
| 완성도 (목적 2) | ⚠️ 역효과 구간 진입 | plan→do→qa 루프는 유효. 그러나 phase당 15~20k 토큰의 프레임워크 오버헤드가 실제 작업 토큰을 잠식 |
| 학습 (목적 3) | ✅ 달성 | hook 8종, 상태 관리, lazy-load 실험 등은 실제로 잘 만들어짐. 단, 학습 산출물이 프로덕션에 그대로 남아 부채화 |
| 유지보수 비용 | ❌ 위험 | 소스 ~1.4MB, 그중 60% 이상이 "플러그인이 자기 자신을 관리하는 코드" (validator/patcher/guard/audit) |

## 핵심 수치 (요약)

| 항목 | 실측값 | 문제 |
|------|--------|------|
| 세션 시작 고정 오버헤드 | **~7k 토큰** | CLAUDE.md(3k) + 에이전트 목록 주입(~2.5k) + session-start(1.5k) — vais를 안 써도 매 세션 지불 |
| `/vais cto {phase}` 1회 프레임워크 오버헤드 | **~15-20k 토큰** | SKILL.md + phases/ + cto.md + 가드 3종 + vais.config.json + 템플릿, 실제 작업 전 로드 |
| 피처 1개 문서 산출량 | **17 파일 / 1,701줄** (vais-positioning-rethink 실측) | main.md "인덱스"가 89줄, Decision Record 30행 |
| 등록 에이전트 수 | **~80개** (47 sub-agent + knowledge 19 + _shared 8이 전부 에이전트로 등록) | `package.json > agents: ["agents/"]` 가 가드/지식 문서까지 에이전트로 노출 — 명백한 버그성 낭비 |
| 템플릿 | 51개 / 313KB | 실사용 빈도 대비 과잉 (why/what/how/core/biz/alignment 6계층) |
| scripts | 37개 / 283KB | 대부분 자기 관리용 (validator, patcher, auditor, judge) |

## 진단 한 줄 요약

> **"조직 시뮬레이션(C-Suite 롤플레이)"이 수단에서 목적으로 뒤집혔다.**
> 원래 수단이었던 CEO/CPO/CBO/COO 레이어·게이트·Decision Record·아웃트로 의식(儀式)이
> 원래 목적이었던 "이력 남기는 일관성 있는 개발"을 잡아먹고 있다.

## 권고 방향 (3줄)

1. **제거**: C-Suite 시뮬레이션 레이어 축소 (6 C-Level → 1 오케스트레이터), 에이전트 80 → ~10, 템플릿 51 → ~6, 문서 의식(main.md 인덱스/Decision Record/아웃트로 체인) 폐지
2. **유지**: `/vais` 진입점, plan→do→review 경량 루프, `docs/{feature}/` 이력, status.json + session-start 복원, design-system/brands, commit 플로우, bash-guard
3. **추가**: **HTML 보고서 / 슬라이드 덱 생성 기능** — design-system/brands 를 스타일 정본으로 쓰는 안티-AI-slop 보고서 생성기 (이미 가진 자산과 정확히 맞물림)

## 문서 구성

| 파일 | 내용 |
|------|------|
| [01-current-state.md](01-current-state.md) | 정량 분석 — 구조, 크기, 토큰 비용 실측 |
| [02-problem-analysis.md](02-problem-analysis.md) | 문제 진단 — 7개 문제의 원인과 증거 |
| [03-keep-remove-add.md](03-keep-remove-add.md) | 권고안 — 유지/제거/추가 목록 + 목표 아키텍처 |
| [04-report-generator-proposal.md](04-report-generator-proposal.md) | 신규 기능 제안 — HTML 보고서/PPT 생성기 설계 |
