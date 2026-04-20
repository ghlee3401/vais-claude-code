# marketplace-version-audit — 기획서

> ⛔ **Plan 단계 범위**: 분석과 결정만. 실제 수정은 Do 단계.
> Feature: `marketplace-version-audit` | CSO plan:do:qa (사용자 명시적 연속 실행 승인)
> <!-- size budget: main.md ≤ 200 lines -->

## Executive Summary

| Perspective | Content | Contributing C-Levels |
|-------------|---------|-----------------------|
| **Problem** | v0.58.0 origin/main 푸시 직후, 마켓플레이스 배포 구조 건전성 + 이전 버전 문자열 잔재(release-critical 파일의 stale version) 감사 필요 | cso |
| **Solution** | Gate B(plugin deployment) 재검증 + 카테고리 기반 legacy version 감사(`0.4x.x` / `0.5x.x` / `v0.4x.x` / `v0.5x.x` 패턴) + 정리 필요/보존 판정 | cso |
| **Effect** | 사용자가 v0.58.0 을 받을 때 UI/문서/README/output-style 에 stale "v0.57" 배지가 안 뜸 | cso |
| **Core Value** | (1) 마켓플레이스 배포 신뢰도, (2) 사용자 혼동 방지, (3) 기술 부채 누적 방지 | cso |

## Decision Record (multi-owner)

| # | Decision | Owner | Rationale | Source topic |
|---|----------|:-----:|-----------|--------------|
| 1 | 대상 범위: 프로덕트 경로만 (docs/, guide/, .git/, node_modules, vendor/, basic/ 제외) | cso | 문서는 역사 기록(legitimate), 외부/서드파티는 범위 밖 | 본 §1 |
| 2 | 보존 카테고리 5종 명시 | cso | false positive 와 legitimate history 구분 필수 | 본 §2 |
| 3 | 정리 대상 카테고리 판정 기준 | cso | "현재 버전이어야 할 자리에 stale 버전" = 수정 | 본 §3 |
| 4 | Gate B (plugin-validator) 사전 pass 확인 | cso | 이미 baseline 통과 — 수정 후 재실행으로 회귀 가드 | 본 §4 |

## [CSO] 감사 계획

### 1. 감사 범위

- **포함**: `.claude-plugin/`, `agents/`, `lib/`, `scripts/`, `skills/`, `templates/`, `hooks/`, `output-styles/`, `package.json`, `vais.config.json`, `README.md`, `CLAUDE.md`, `AGENTS.md`
- **제외**: `docs/` (feature history), `guide/` (legacy plan archives), `CHANGELOG.md` (release log), `tests/fixtures/` (샘플 데이터), `package-lock.json` (deps), `.git/`, `node_modules/`, `vendor/`, `basic/`

### 2. 보존 카테고리 (legitimate 히스토리)

| # | 카테고리 | 예시 | 근거 |
|---|----------|------|------|
| 1 | CHANGELOG 스타일 변경 이력 표 | `\| v1.0 \| 2026-03-14 \| 초기 출력 스타일 정의 \|` in `output-styles/` | 변경 이력은 history 보존 |
| 2 | v0.57 시스템 마커 | `<!-- subdoc-guard version: v0.57.0 -->` | guard 블록 버전 마커 (교체 시점 판정용) |
| 3 | v0.57 구현 스크립트 | `scripts/patch-phase-templates-subdoc.js` 의 "v0.57" 문자열 | 과거 스크립트 — **실행 이력**으로만 사용되지 않으면 제거 후보 (§3 판정) |
| 4 | Frontmatter `version: 0.50.0` | `agents/**/*.md` / `skills/**/*.md` | agent/skill **schema 버전** — 플러그인 버전과 별개 (의도적 고정값) |
| 5 | 과거 테스트 상수 | `tests/**/*.test.js` 의 특정 버전 assertion | 회귀 가드 목적 보존 |

### 3. 정리 대상 카테고리 (stale — 수정 필요)

| # | 카테고리 | 판정 기준 |
|---|----------|-----------|
| A | **README / CLAUDE 의 사용자 대면 배지** | "v0.56.2" / "v0.57.0" 등 프로젝트 현재 버전을 나타내는 문구 | 
| B | **output-styles 의 SessionStart 배지** | UI 에 표시되는 `VAIS Code vX.Y.Z` 헤더 |
| C | **skills/ utils 나 phases 의 "this is vX.Y" 설명** | 스킬 가이드 내 "현재 버전" 언급 |
| D | **package.json / plugin.json / marketplace.json / vais.config.json** | 단일 source of truth (v0.58.0 이어야 함) — 이미 확인 완료 ✅ |
| E | **릴리즈 노트성 문자열이 코드에 있는 경우** | description/comment 에 "v0.57.0 에 추가됨" → 이건 보존. "현재 v0.56" → 교체 |

### 4. Gate B 사전 baseline

- `node scripts/vais-validate-plugin.js` 실행 결과: **✅ 통과** (오류 0, 경고 0, 정보 10)
- `plugin.json` / `marketplace.json` / `package.json` / `vais.config.json` 모두 **0.58.0** 확인 완료
- Do 단계에서 수정 후 **재실행**으로 회귀 가드

## Topic Documents

| Topic | 파일 | Owner | 요약 |
|-------|------|:-----:|------|
| (해당 없음 — main.md 단독, 140라인 이내) | — | — | — |

## Success Criteria

| ID | Criterion | Target | 검증 |
|----|-----------|--------|------|
| SC-01 | Gate B (plugin-validator) pass | 오류 0 | `node scripts/vais-validate-plugin.js` |
| SC-02 | 카테고리 A/B/C 잔재 0건 (프로덕트 경로) | 없음 | grep |
| SC-03 | 카테고리 D release 파일 일관성 | 4 파일 모두 0.58.0 | grep |
| SC-04 | 보존 카테고리 1/2/4/5 무변경 | 영향 없음 | diff |
| SC-05 | npm test 회귀 없음 | 210 pass 유지 | npm test |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-20 | 초기 Plan — 감사 범위, 보존/정리 카테고리, SC-01~05 |
