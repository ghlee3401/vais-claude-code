# docs-structure-redesign - 기획서

> ⛔ **Plan 단계 범위**: 이 문서는 분석과 결정만 기록합니다.
> 강행 모드: PRD 없음. ideation 기반 진행.

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 피처별 통합 뷰 불가 (phase별 분산), 단일 문서 강제로 대형 피처 관리 어려움 |
| **Solution** | `docs/{feature}/{phase}/main.md` 피처 중심 구조 + 문서 분할 허용 |
| **Effect** | 피처 폴더 하나로 전체 이력 조회, 대형 피처 sub-doc 분리 가능 |
| **Core Value** | 문서 관리 효율성 + 피처 추적성 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 현재 구조에서 피처 이력 추적이 5개 폴더 탐색 필요 |
| **WHO** | VAIS Code 사용자 |
| **RISK** | 52개 파일이 기존 경로 참조 — 영향 범위 큼 |
| **SUCCESS** | 새 구조로 전환 + 기존 스크립트/에이전트 정상 동작 |
| **SCOPE** | 경로 설정 변경 + 에이전트 규칙 변경 + 기존 문서 마이그레이션 |

---

## 1. 현재 구조 vs 새 구조

**Before:**
```
docs/
├── 00-ideation/{role}_{feature}.md
├── 01-plan/{role}_{feature}.plan.md
├── 02-design/{role}_{feature}.design.md
├── 03-do/{role}_{feature}.do.md
├── 04-qa/{role}_{feature}.qa.md
└── 05-report/{role}_{feature}.report.md
```

**After:**
```
docs/{feature}/
├── ideation/main.md
├── plan/main.md      ← 항상 존재 (요약 + sub-doc 인덱스)
├── design/main.md
├── do/main.md
├── qa/main.md
└── report/main.md
```

## 2. 핵심 변경: 중앙 경로 해석기

**경로 로직이 `lib/paths.js`의 `resolveDocPath()`에 중앙화**되어 있어, 핵심 변경점은 2곳:

### 2.1 vais.config.json docPaths 변경

**Before:**
```json
"docPaths": {
  "ideation": "docs/00-ideation/{role}_{feature}.md",
  "plan": "docs/01-plan/{role}_{feature}.plan.md",
  "design": "docs/02-design/{role}_{feature}.design.md",
  "do": "docs/03-do/{role}_{feature}.do.md",
  "qa": "docs/04-qa/{role}_{feature}.qa.md",
  "report": "docs/05-report/{role}_{feature}.report.md"
}
```

**After:**
```json
"docPaths": {
  "ideation": "docs/{feature}/ideation/main.md",
  "plan": "docs/{feature}/plan/main.md",
  "design": "docs/{feature}/design/main.md",
  "do": "docs/{feature}/do/main.md",
  "qa": "docs/{feature}/qa/main.md",
  "report": "docs/{feature}/report/main.md"
}
```

> `{role}` 변수가 경로에서 제거됨. 문서 내용 안에 role 명시는 유지.

### 2.2 lib/paths.js resolveDocPath() 수정

- `{role}` 치환 로직 유지 (하위 호환) 하되 새 템플릿에서는 미사용
- 디렉토리 자동 생성 로직 추가 (중첩 폴더 구조이므로)

## 3. 영향 분석

### 필수 수정 (코드/설정)

| # | 파일 | 변경 내용 | 우선순위 |
|---|------|----------|---------|
| 1 | `vais.config.json` | docPaths 템플릿 변경 | P0 |
| 2 | `lib/paths.js` | resolveDocPath()에 mkdirSync 추가 | P0 |
| 3 | `CLAUDE.md` | 산출물 경로 규칙 갱신 | P0 |
| 4 | 6개 C-Level agent `.md` | 산출물 경로 + Contract 갱신 | P0 |
| 5 | `scripts/doc-tracker.js` | 경로 패턴 검증 로직 | P1 |
| 6 | `scripts/auto-judge.js` | resolveDocPath 호출은 그대로 (설정만 바뀌면 자동 반영) | P2 |
| 7 | `scripts/gate-check.js` | 동일 (resolveDocPath 의존) | P2 |
| 8 | `scripts/doc-validator.js` | 동일 | P2 |
| 9 | `templates/*.template.md` | 경로 참조 갱신 | P1 |
| 10 | `tests/paths.test.js` | 테스트 기댓값 갱신 | P1 |

### 자동 반영 (resolveDocPath 의존)

`auto-judge.js`, `gate-check.js`, `doc-validator.js`, `generate-dashboard.js`는 모두 `resolveDocPath()`를 호출하므로 `vais.config.json` 변경만으로 자동 반영.

### 문서 참조만 (수정 불필요)

52개 중 `docs/01-plan/features/v050/*.md` 등 기존 plan 문서는 역사적 기록이므로 수정 불필요. sub-agent `.md`의 `@see` 주석도 코드 동작에 영향 없음.

## 4. 마이그레이션 전략

### 점진적 마이그레이션 (권장)

1. **설정 + 코드 변경** — vais.config.json, lib/paths.js, CLAUDE.md, 에이전트 .md
2. **새 피처는 새 구조** — 이후 `/vais` 실행 시 자동으로 새 구조로 생성
3. **기존 docs/ 유지** — 기존 문서는 그대로 두고 참조용으로 남김 (삭제 안 함)
4. **필요 시 마이그레이션** — 기존 피처를 다시 작업할 때 새 구조로 이동

### 기존 docs/ 처리

```
docs/
├── _legacy/              ← 기존 00-ideation ~ 05-report 폴더 이동
│   ├── 00-ideation/
│   ├── 01-plan/
│   └── ...
├── commit-workflow-improvement/  ← 새 구조
│   ├── plan/main.md
│   └── ...
└── ...
```

## 5. 문서 분할 판단 기준

에이전트가 문서 작성 시 아래 기준으로 판단:

| 조건 | 판단 |
|------|------|
| 단일 도메인, 범위 작음 | `main.md` 하나 |
| 독립 sub-task 3개 이상 | sub-task별 분리 |
| UI + infra 동시 (design) | `ui.md` + `infra.md` 분리 |
| frontend + backend 병렬 (do) | 에이전트별 분리 |
| 예상 200줄 초과 | 분리 권장 |

분리 시 `main.md`는 항상 존재하며 요약 + sub-doc 인덱스 역할.

## 6. 변경 범위 요약

| 구분 | 파일 수 |
|------|--------|
| P0 (필수 수정) | 9개 (config + paths + CLAUDE + 6 agents) |
| P1 (스크립트/템플릿) | 7개 |
| P2 (자동 반영) | 4개 |
| 문서 마이그레이션 | 기존 docs/ → `_legacy/` 이동 |

---

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-16 | 초기 기획서 작성 |
