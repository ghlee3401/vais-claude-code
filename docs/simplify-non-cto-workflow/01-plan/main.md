---
owner: cto
phase: plan
feature: simplify-non-cto-workflow
generated: 2026-05-02
summary: "v2.x 통합 모델 (코드 개발 도우미 정체성 + CEO 7 차원 + sub-agent 직접 박제 + AskUserQuestion 인터페이스 + 4 가드 spec) 의 구체 spec 정제. main.md 는 인덱스, 상세는 artifact MD 분리."
---

# simplify-non-cto-workflow — Plan (인덱스)

> Phase: 📋 plan | Owner: CTO | Date: 2026-05-02
> 참조: `docs/simplify-non-cto-workflow/00-ideation/main.md` v2.4
>
> **v2.x 자기 적용**: 본 plan main.md 는 **인덱스만**. 본문은 artifact MD 분리. main.md 가 200줄 초과 안 함.

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 현재 vais-code = 너무 많은 강제 규칙 + 6 C-Suite 모두 PDCA + _tmp 압축 모델 → 사용자 혼란 + 토큰 낭비 + UX 부담 |
| **Solution** | 코드 개발 도우미 정체성 (4 C-Suite 기본) + CEO 빈틈없는 판단 (7 차원) + sub-agent 직접 박제 (_tmp 폐기) + AskUserQuestion 클릭 |
| **Effect** | 사용자 결정 부담 ↓ 60%+ / 토큰 ↓ 약 50% / 일관성 ↑ / 정보 손실 0 |
| **Core Value** | 비전문가가 빈틈없는 결과를 받는 도구 — CEO 가 알아서 결정, 사용자는 클릭만 |

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | 6 C-Suite × 6 phase × N artifact 강제 모델이 사용자 부담 ↑ + 일관성 ↓ |
| WHO | 비전문가 사용자 (개발 경험 적음) — 결정 위임자 |
| RISK | 기존 산출물 (37 sub-agent + 4 가드 + scripts) 호환성 / 메모리 모델 / 외부 사용자 |
| SUCCESS | (1) `/vais ceo {요청}` 1번으로 자동 PDCA (2) 사용자 클릭 < 5번 per phase (3) sub-agent 직접 박제 동작 (4) CBO/COO 자동 라우팅 제외 |
| SCOPE | vais-code 자체 메타 변경 (코드 + 가드 + config + skill 라우팅) |

## Decision Record

| # | Decision | Owner | Source artifact |
|---|----------|:-----:|----------------|
| 1 | 정체성 = 코드 개발 도우미 (4 C-Suite 기본, CBO/COO 선택) | cto | identity-and-routing.md |
| 2 | CEO 알고리즘 = 7 차원 체크리스트 + phase↔artifact 매핑 | cto | ceo-algorithm.md |
| 3 | sub-agent 직접 박제 (`_tmp` 폐기, 큐레이션 폐기) | cto | subdoc-spec.md |
| 4 | main.md = 인덱스만 (Decision Record + Artifacts 표 + Next Phase) | cto | main-md-spec.md |
| 5 | frontmatter 표준 (owner/agent/artifact/phase/feature/source/generated/summary) | cto | frontmatter-spec.md |
| 6 | 사용자 인터페이스 = AskUserQuestion 클릭 (자연어 안내 금지) | cto | ux-interface.md |
| 7 | 강제 규칙은 CEO 알고리즘 안으로 흡수 (사용자 안 보임) | cto | ceo-algorithm.md |
| 8 | 4 가드 변경 — advisor 무변경, clevel-main 50%, subdoc 100%, ideation 30% | cto | guards-spec.md |
| 9 | CTO PDCA 그대로 유지 (코드 영역 phase 분리 의미 있음) | cto | identity-and-routing.md |
| 10 | CBO/COO 자료 보존 (자동 라우팅에서만 빠짐) | cto | identity-and-routing.md |

## Topic Documents (artifact 인덱스)

| Topic | 파일 | Owner | Source 거장 | 한 줄 요약 |
|-------|------|:-----:|:----------:|-----------|
| Identity & Routing | `identity-and-routing.md` | cto | — | 4 C-Suite 정체성 + CBO/COO 선택 활성 정책 |
| CEO Algorithm | `ceo-algorithm.md` | cto | — | 7 차원 체크리스트 + phase↔artifact 매핑 + 호출 흐름 |
| Subdoc Spec | `subdoc-spec.md` | cto | — | sub-agent 직접 박제 규약 (_tmp 폐기) |
| Main.md Spec | `main-md-spec.md` | cto | — | 각 phase main.md = 인덱스 형식 (5 섹션) |
| Frontmatter Spec | `frontmatter-spec.md` | cto | — | sub-agent artifact 표준 frontmatter (8 필드) |
| UX Interface | `ux-interface.md` | cto | — | AskUserQuestion 클릭 패턴 + 옵션 가이드 |
| Guards Spec | `guards-spec.md` | cto | — | 4 가드 변경 spec (advisor/clevel-main/subdoc/ideation) |
| Impact Analysis | `impact-analysis.md` | cto | — | 영향받는 파일 + 변경 spec + 의존 순서 |
| Tech Risks | `tech-risks.md` | cto | — | 위험 + 완화 + rollback |

## Success Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-01 | `/vais ceo {요청}` 1번 호출 → CEO 가 자동 phase 결정 + 사용자 클릭 1회로 진행 | E2E 테스트 |
| SC-02 | 4 C-Suite (CEO+CPO+CTO+CSO) 가 CEO 자동 라우팅 기본. CBO/COO 는 명시 호출만 활성 | `/vais ceo` 후 routing 결과 grep |
| SC-03 | sub-agent 가 `docs/{feature}/{phase}/{artifact}.md` 직접 박제 (`_tmp/` 폴더 미생성) | `find docs -name "_tmp" -type d` → 0건 |
| SC-04 | main.md 가 모든 phase 에서 200줄 이내 (인덱스 형식) | wc -l |
| SC-05 | 모든 artifact md 가 frontmatter 표준 8 필드 보유 | grep frontmatter |
| SC-06 | 자연어 명령어 안내 0건 — 모든 결정은 AskUserQuestion 클릭 | output style + skill md grep |
| SC-07 | doc-validator + auto-judge 가 새 모델 호환 | 회귀 테스트 |

## Impact Analysis (요약 — 상세는 `impact-analysis.md`)

| 영역 | 변경 파일 수 | 변경 종류 |
|------|:----:|---------|
| 정책 진입점 | ~3 | CLAUDE.md / vais.config.json / .claude-plugin/plugin.json |
| C-Level agent md | 6 | Contract 섹션 + 호출 흐름 갱신 |
| Skill 라우팅 | 6+ | skills/vais/phases/{c-level}.md + SKILL.md |
| Scripts 검증 | 6 | doc-validator / auto-judge / phase-transition / cp-tracker / cp-guard / patch-* |
| 상태 관리 | 1 | lib/status.js |
| 공유 가드 | 4 | _shared/{advisor,clevel-main,subdoc,ideation}-guard.md |
| 템플릿 | ~7 | templates/*.template.md |
| 진입 가이드 | 2 | ONBOARDING.md / AGENTS.md |

총 ~35 파일. 변경 순서: identity → CEO 알고리즘 → 가드 → scripts → templates → 진입 가이드.

## 기능 요구사항 (요약)

| # | 기능 | 우선순위 |
|---|------|:-------:|
| 1 | CEO 7 차원 체크리스트 구현 (`agents/ceo/ceo.md` + 매핑 데이터) | Must |
| 2 | sub-agent 직접 박제 (subdoc-guard.md 재작성 + patch 스크립트) | Must |
| 3 | main.md 인덱스 형식 (templates/main-md.template.md 신규) | Must |
| 4 | frontmatter 표준 (sub-agent md + validator 갱신) | Must |
| 5 | CBO/COO 자동 라우팅 제외 (vais.config.json + CEO agent) | Must |
| 6 | AskUserQuestion 강제 재확인 (skill md 점검) | Must |
| 7 | 4 가드 변경 (advisor 무변경, 나머지 갱신) | Must |
| 8 | doc-validator 새 모델 호환 (W-SCOPE / W-MAIN-SIZE / W-OWN 갱신) | Must |
| 9 | 기존 코드/문서 마이그레이션 (현재 docs/ 비어 있어 부담 적음) | Nice |
| 10 | E2E 테스트 (가상 피처로 자동 흐름 검증) | Must |

## 정책 (비즈니스 규칙)

| # | 정책 |
|---|------|
| 1 | CEO 자동 라우팅 = 4 C-Suite (CEO+CPO+CTO+CSO) 기본. CBO/COO 는 사용자 명시 시만 |
| 2 | 모든 결정 포인트 = AskUserQuestion 클릭. 옵션 2~3개. 자연어 안내 금지 |
| 3 | sub-agent 박제 = `docs/{feature}/{phase}/{artifact}.md` 직접. `_tmp/` 폴더 사용 금지 |
| 4 | main.md = 인덱스만. 200줄 초과 시 artifact MD 분리 강제 (자연 충족) |
| 5 | frontmatter 8 필드 (owner/agent/artifact/phase/feature/source/generated/summary) 필수 |
| 6 | 거장 외부 자료 = 거장 단위 분리 (1 framework = 1 MD). 한 파일 통합 금지 |
| 7 | 큐레이션 (채택/거절/병합) 폐기. sub-agent artifact = 산출물 그대로 |

## 비기능 요구사항

| 항목 | 요구사항 | 기준 |
|------|---------|------|
| 토큰 효율 | 옛 모델 대비 약 50% 절감 | per phase 토큰 측정 |
| 사용자 부담 | 클릭 < 5번 per phase | E2E 카운트 |
| 일관성 | 매 피처 같은 알고리즘 → "왜 그건 안 해?" 빈도 0 | 사용자 피드백 |
| 호환성 | 외부 vais-code 사용자 영향 최소 (AskUserQuestion 강제 규칙 그대로) | breaking change 평가 |

## 변경 순서 + 의존

```
1. identity-and-routing       → 4 C-Suite + CBO/COO 정책 확정
2. ceo-algorithm              → 7 차원 + phase↔artifact 매핑 정의
3. frontmatter-spec           → 표준 8 필드 정의 (다른 단계 의존)
4. subdoc-spec                → sub-agent 박제 규약 (frontmatter 의존)
5. main-md-spec               → main.md 인덱스 형식 (frontmatter 의존)
6. ux-interface               → AskUserQuestion 패턴 (skill md 갱신)
7. guards-spec                → 4 가드 변경 (위 모두 의존)
8. impact-analysis            → 영향 파일 매핑 + 변경 순서
9. tech-risks                 → 위험 분석 + rollback
```

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-02 | CTO plan main.md (인덱스). v2.x 통합 모델을 9 topic artifact 로 분리 spec. SC 7건. Impact 요약. 변경 순서 정의. 상세는 artifact MD. |
