---
owner: cto
agent: cto-direct
artifact: phase-index
phase: plan
feature: unify-version-namespace
generated: 2026-05-03
summary: "아키텍처 라벨 'v2.0 모델' 일괄 제거. plugin semver 0.64.0 단일 namespace 화. 79 파일 스캔 → 4 카테고리 분류 (drop/keep/rephrase/historical)."
---

# unify-version-namespace — Plan (인덱스)

> Phase: 📋 plan | Owner: CTO (직접) | Date: 2026-05-03
> 참조: 사용자 요청 — "아키텍처랑 플러그인이랑 버전 다르게 하면 헷갈리지 않아? 0.64.0으로 다 정리하자"

## 1. Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 두 namespace 공존 (아키텍처 "v2.0 모델" + plugin semver "0.64.0") → 매번 매핑 설명 필요, 외부 사용자 혼란 |
| **Solution** | 아키텍처-레벨 "v2.0" 라벨 일괄 drop. plugin semver 0.64.0 단일 namespace 화. 단, 내부 asset 블록 버전 (subdoc-guard v2.0, clevel-main-guard v2.0, main-md template v2.0) 은 component-local 버전이라 KEEP |
| **Effect** | 단일 진실 — `0.64.0` 만 보면 됨. CHANGELOG/문서/agent description 일관성 |
| **Core Value** | 인지 부하 ↓ — "지금 뭐가 v2 야?" 질문 0건 |

## 2. Decision Record

| # | Decision | Owner | Rationale | Source artifact |
|---|----------|:-----:|-----------|----------------|
| P-1 | 아키텍처 라벨 "v2.0 모델" / "v2.x 모델" / "v2.0 통합" → drop | cto | 단일 namespace 원칙. plugin semver 가 진실 | `replace-spec.md` |
| P-2 | 내부 asset 블록 버전 (subdoc-guard/clevel-main-guard/main-md template "v2.0") → KEEP | cto | component-local 버전. patch 스크립트가 의존. 다른 namespace 라 사용자 혼란 없음 | `replace-spec.md` |
| P-3 | description 의 "v2.0+ Secondary" / "v2.0+ CTO 전용" 등 → "0.64.0+" 또는 평문화 | cto | description 은 외부 사용자가 읽음 → 단일 namespace 적용 | `replace-spec.md` |
| P-4 | docs/simplify-non-cto-workflow/* + CHANGELOG 의 "v2.0" 언급 → KEEP (historical artifact) | cto | 박제된 PDCA 산출물. 시간이 지나면 바뀐 의미가 헷갈리지만 git 추적 가능 | `replace-spec.md` |
| P-5 | 코드 코멘트 "v2.0 helpers" / "v2.0 분기" → "0.64.0+" 또는 의도 평문화 | cto | code review 시 readability ↑ | `replace-spec.md` |

## 3. Artifacts (이 phase 박제 자료)

| Artifact | Owner | Agent | Source 거장 | 한 줄 요약 | 파일 |
|----------|:-----:|:-----:|:----------:|----------|------|
| replace-spec | cto | cto-direct | — | 79 파일 4 카테고리 분류 + 정확 치환 규칙 + 예시 | [`replace-spec.md`](./replace-spec.md) |

## 4. CEO 판단 근거

- **포함 — replace-spec**: 79 파일 분류 + 정확 치환 규칙이 do 단계 자동화의 baseline. 카테고리 모호하면 do 가 실수
- **제외 — risk-analysis**: 본 cleanup 은 표면 라벨 변경이라 위험 낮음. patch 스크립트 의존성 있는 블록 버전은 KEEP 대상이라 안전
- **제외 — UX 변경**: AskUserQuestion 강제, 산출물 위치 등 동작 변경 0. 라벨만 정리

## 5. Next Phase

→ **design** (CTO 진입 — 정확 치환 패턴 + 자동화 스크립트 spec)

다음 phase 의 예상 artifact:
- `replacement-rules.md` — sed/Node 기반 자동 치환 패턴 (정규식 + 컨텍스트 매칭)
- `manual-edit-list.md` — 자동화 불가능한 prose (CLAUDE.md / ONBOARDING.md / AGENTS.md) 수동 편집 항목

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-03 | CTO plan 인덱스. 79 파일 스캔, 4 카테고리 분류 (drop/keep/rephrase/historical). Decision 5건. plugin semver 0.64.0 단일 namespace 정책 정의. |
