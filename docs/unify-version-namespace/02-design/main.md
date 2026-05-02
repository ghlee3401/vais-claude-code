---
owner: cto
agent: cto-direct
artifact: phase-index
phase: design
feature: unify-version-namespace
generated: 2026-05-03
summary: "치환 자동화 spec — Node 일괄 스크립트 (카테고리 A description + config 키) + 수동 편집 리스트 (CLAUDE/ONBOARDING/AGENTS/agent body prose)."
---

# unify-version-namespace — Design (인덱스)

> Phase: 🎨 design | Owner: CTO (직접) | Date: 2026-05-03
> 참조: `docs/unify-version-namespace/01-plan/main.md` v1.0 + `replace-spec.md` v1.0

## 1. Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | plan 의 4 카테고리 → do 단계에서 모호하지 않게 실행하려면 정확한 치환 패턴 + 수동 편집 분리 필요 |
| **Solution** | (a) Node 일괄 스크립트 1회 실행 — agent/skill description + config 키 (b) 수동 편집 리스트 — prose 가 짙은 4 파일 (CLAUDE/ONBOARDING/AGENTS/agent body) |
| **Effect** | do 단계 시간 ↓ — 자동 ~80%, 수동 ~20% |
| **Core Value** | 라벨 변경이지만 false positive 방지 (블록 마커 v2.0 안 건드리기) |

## 2. Decision Record

| # | Decision | Owner | Rationale | Source artifact |
|---|----------|:-----:|-----------|----------------|
| D-1 | Node `scripts/unify-version-cleanup.js` 임시 스크립트 작성 후 do 단계에서 1회 실행, 그 후 삭제 | cto | 일회성 마이그레이션 스크립트. 영구 보존 X | `do` 단계 |
| D-2 | 블록 마커 보호 — 정규식이 `<!-- ... version: v2.0 -->` 라인은 무조건 제외 | cto | 카테고리 B 보존 (patch 스크립트 의존) | 동일 |
| D-3 | 수동 편집 4 파일 (`CLAUDE.md`, `ONBOARDING.md`, `AGENTS.md`, agent body prose 일부) | cto | prose 흐름 보존이 자동화보다 중요 | 동일 |
| D-4 | `vais.config.json` `_v2_*` 키 rename — 수동 sed (jq 미설치 환경 호환) | cto | JSON 키 rename 은 grep 1줄로 충분 | 동일 |
| D-5 | 자동 스크립트는 dry-run 우선 + 결과 리뷰 후 적용 | cto | 51 sub-agent 영향 가능성 → 안전 우선 | 동일 |

## 3. Artifacts

| Artifact | Owner | Agent | 한 줄 요약 | 파일 |
|----------|:-----:|:-----:|----------|------|
| automation-spec | cto | cto-direct | Node 스크립트 정규식 + 보호 규칙 + dry-run 흐름 | (do 단계에서 스크립트 자체로 박제) |

> 본 design 은 small refactor 라 별도 artifact 분리 불필요. main.md 인덱스 + 표만으로 do 가 작업 가능.

## 4. CEO 판단 근거

- **포함 — automation-spec inline**: 정규식 패턴이 design 핵심. plan replace-spec 와 do 사이 brigde
- **제외 — 별도 risk 분석**: tech-risks 는 plan 에서 충분 (낮은 위험, 블록 마커 보호로 충분)

## 5. 자동 치환 패턴 (do 가 사용)

### 패턴 1 — agent description (frontmatter `description: |` 블록)

```regex
# Before:
^  v2\.0:?\s*(4 Primary.*?$)
# After:
  0.64.0+: $1
```

### 패턴 2 — `v2.0+ Secondary` / `v2.0+ Primary` (description prose)

```regex
v2\.0\+ (Secondary|Primary)
→ $1
```

### 패턴 3 — template 헤더 `🎯 **v2.0+ ...**`

```regex
🎯 \*\*v2\.0\+([^*]+)\*\*
→ 🎯 **$1**

🎯 \*\*v2\.0\+\*\*([^—\n]+)
→ 🎯 **0.64.0+**$1
```

### 패턴 4 — 평서문 "v2.0 모델" / "v2.x 모델" / "v2.0 통합 모델"

```regex
v2\.0 통합 모델 → (제거 또는 "0.64.0+" 평문)
v2\.0 모델       → (제거 또는 "0.64.0+ 모델" 평문)
v2\.x 모델       → (제거)
```

### 패턴 5 — vais.config.json `_v2_*` 키

```sed
s/"_v2_routing_comment"/"_routing_comment"/g
s/"_v2_was_/"_legacy_was_/g
```

### 보호 규칙 (false positive 방지)

```
SKIP if line matches:
  /<!-- (subdoc-guard|clevel-main-guard|main-md template) version: v[\d.]+ -->/
  /docs/(simplify-non-cto-workflow|ceo-judgment.*)\//
  /CHANGELOG\.md/
```

## 6. 수동 편집 리스트 (do 가 직접 처리)

| # | 파일 | 변경 내용 |
|:-:|------|----------|
| M-1 | `CLAUDE.md` | Rule #2/#3/#9/#13/#14/#15 prose 의 "v2.0" / "v2.x" 평문 정리 |
| M-2 | `ONBOARDING.md` | "What This Is" 섹션 + 변경 이력 v2.0 라벨 제거 |
| M-3 | `AGENTS.md` | "v2.0 — CTO 만 mandatory" 등 라벨 제거 |
| M-4 | 6 C-Level agent.md body | inject 블록 외 prose 의 "v2.0 모델" 검토 |

## 7. Next Phase

→ **do** (CTO 진입 — 임시 스크립트 작성 + 실행 + 수동 편집)

다음 phase 의 예상 artifact:
- `cleanup-log.md` — 실행 결과 (전후 grep 카운트, 영향 파일 수, 잔여 항목)

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-03 | CTO design 인덱스. 자동화 5 정규식 패턴 + 보호 규칙 + 수동 편집 4 파일 리스트. small refactor 라 별도 artifact 미생성. |
