# CTO Plan: agent-rename-v2

> CEO plan v1.1 입력 기반 기술 변환 — 20개 sub-agent를 업계 표준 직무명으로 rename

## 0.7 입력 모드

- **모드**: CEO plan 기반 강행 (CPO PRD 부재, CP-0에서 사용자 승인)
- **입력 문서**: `docs/01-plan/ceo_agent-rename-v2.plan.md` v1.1
- **확정 사항**: 20개 매핑, C. 확장 범위, CTO 단독 실행

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 20개 sub-agent 이름이 업계 표준과 어긋나거나 직전 작업의 임시 명명에 머물러 있음. ~52개 파일이 옛 이름을 참조 중 |
| **Solution** | (1) 23건의 `git mv` (agents 20 + skills/phases 3) + (2) 52개 파일 내 ~200+ 참조 일괄 치환 + (3) `vais.config.json` subAgents/parallelGroups 갱신 + (4) `validate-plugin` 통과 검증 |
| **Effect** | 마켓플레이스 표준 직무명으로 검색·노출 개선, 외부 도구 호환성 확보 |
| **Core Value** | 일관된 `{도메인}-{직무 접미사}` 패턴, 내부 조어 0건 |

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | CEO plan v1.1에서 C. 확장 범위 확정 — 업계 표준화 |
| **WHO** | VAIS Code 마켓플레이스 사용자, Cursor/Copilot 호환 사용자 |
| **RISK** | 누락 참조로 런타임 에러, 직전 sub-agent-rename 커밋과의 git history 노이즈 |
| **SUCCESS** | grep 잔존 0건, `node scripts/vais-validate-plugin.js` 통과, 모든 agent frontmatter `name:` 갱신 |
| **SCOPE** | agents/ + skills/ + lib/ + scripts/ + 루트 .md/.json (~52 파일 + 23 rename) |

## 기능 요구사항 요약

| # | 기능 | 우선순위 | 난이도 |
|---|------|---------|--------|
| 1 | 20개 sub-agent 파일명 변경 (`git mv`) | Must | 하 |
| 2 | 각 agent frontmatter `name:` 필드 갱신 | Must | 하 |
| 3 | C-Level agent (ceo/cto/cso/cmo/coo/cfo/cpo) 내부 참조 일괄 치환 | Must | 중 |
| 4 | `vais.config.json` subAgents/parallelGroups/autoKeywords 갱신 | Must | 중 |
| 5 | skills/vais/phases/ 하위 3개 파일 rename + 내용 치환 | Must | 중 |
| 6 | lib/scripts 코드 내 문자열 참조 갱신 | Must | 중 |
| 7 | CLAUDE.md / AGENTS.md / README.md 테이블 갱신 | Must | 하 |
| 8 | CHANGELOG.md에 매핑 표 + 마이그레이션 노트 추가 | Must | 하 |
| 9 | output-styles/ 내 참조 갱신 | Must | 하 |
| 10 | validate-plugin 검증 + grep 전수 잔존 확인 | Must | 중 |

## 영향 범위 (정밀 측정)

### 파일 rename (총 23건)

**agents/ (20건)**

| 현재 경로 | 신규 경로 |
|-----------|-----------|
| `agents/cto/dev-backend.md` | `agents/cto/backend-engineer.md` |
| `agents/cto/dev-frontend.md` | `agents/cto/frontend-engineer.md` |
| `agents/cto/test-builder.md` | `agents/cto/test-engineer.md` |
| `agents/cto/bug-investigator.md` | `agents/cto/incident-responder.md` |
| `agents/cto/deploy-ops.md` | `agents/cto/release-engineer.md` |
| `agents/cto/qa-validator.md` | `agents/cto/qa-engineer.md` |
| `agents/cso/validate-plugin.md` | `agents/cso/plugin-validator.md` |
| `agents/cso/compliance-audit.md` | `agents/cso/compliance-auditor.md` |
| `agents/cso/code-review.md` | `agents/cso/code-reviewer.md` |
| `agents/coo/perf-benchmark.md` | `agents/coo/performance-engineer.md` |
| `agents/coo/sre-ops.md` | `agents/coo/sre-engineer.md` |
| `agents/coo/canary-monitor.md` | `agents/coo/release-monitor.md` |
| `agents/coo/docs-writer.md` | `agents/coo/technical-writer.md` |
| `agents/cfo/pricing-modeler.md` | `agents/cfo/pricing-analyst.md` |
| `agents/cfo/cost-analyst.md` | `agents/cfo/finops-analyst.md` |
| `agents/ceo/retro-report.md` | `agents/ceo/retrospective-writer.md` |
| `agents/cpo/pm-discovery.md` | `agents/cpo/product-discoverer.md` |
| `agents/cpo/pm-strategy.md` | `agents/cpo/product-strategist.md` |
| `agents/cpo/pm-research.md` | `agents/cpo/product-researcher.md` |
| `agents/cpo/pm-prd.md` | `agents/cpo/prd-writer.md` |

**skills/vais/phases/ (3건)**

| 현재 경로 | 신규 경로 |
|-----------|-----------|
| `skills/vais/phases/dev-backend.md` | `skills/vais/phases/backend-engineer.md` |
| `skills/vais/phases/dev-frontend.md` | `skills/vais/phases/frontend-engineer.md` |
| `skills/vais/phases/qa-validator.md` | `skills/vais/phases/qa-engineer.md` |

### 참조 치환 대상 (52개 파일)

| 카테고리 | 파일 수 | 주요 파일 |
|----------|---------|-----------|
| **agents/** (C-Level + 자기 자신) | 33 | ceo.md, cpo.md, cto.md, cso.md, coo.md, cfo.md + 27 sub-agent .md |
| **skills/vais/phases/** | 10 | cto.md, cso.md, coo.md, cfo.md, plan.md, infra-architect.md, ui-designer.md, dev-backend.md, dev-frontend.md, qa-validator.md |
| **skills/vais/utils/** | 1 | next.md |
| **lib/** | 1 | absorb-evaluator.mjs |
| **scripts/** | 4 | agent-start.js, doc-validator.js, generate-dashboard.js, vais-validate-plugin.js |
| **루트 문서** | 4 | CLAUDE.md, AGENTS.md, README.md, CHANGELOG.md |
| **vais.config.json** | 1 | subAgents, parallelGroups, autoKeywords |
| **output-styles/** | 1 | vais-default.md |
| **package.json** | 1 (확인 필요) | claude-plugin agents 등록 |

**총 56 unique 파일 영향** (rename 23 + 일부 중복)

### 영향 받지 않음

- C-Level 에이전트명 (ceo~cfo) — 변경 없음
- 12개 표준 sub-agent (security-auditor, seo-analyst, copy-writer, growth-analyst, infra-architect, ui-designer, db-architect, ux-researcher, data-analyst, skill-validator, absorb-analyzer, **검토 후 확정 필요**)
- `basic/`, `vendor/`, `references/`, `docs/` (역사 기록 보존)

## 실행 계획 (Phase 분할 — Design 단계에서 상세화)

| Phase | 작업 | 예상 도구 | 검증 |
|-------|------|----------|------|
| **P1. 파일 rename** | 23건 `git mv` | Bash | `git status` |
| **P2. Frontmatter 갱신** | 20개 agent + 3개 skill phase의 `name:` 필드 | Edit | grep `^name:` |
| **P3. agents/ 내부 참조** | 33개 .md 일괄 치환 (Edit replace_all) | Edit | grep 잔존 0 |
| **P4. skills/ 내부 참조** | 11개 파일 치환 | Edit | grep 잔존 0 |
| **P5. vais.config.json** | subAgents/parallelGroups/autoKeywords 배열 | Edit | JSON valid + validate-plugin |
| **P6. lib/scripts** | 5개 코드 파일 문자열 치환 | Edit | 단위 동작 확인 |
| **P7. 루트 문서** | CLAUDE.md, AGENTS.md, README.md 테이블 갱신 | Edit | 시각적 검토 |
| **P8. CHANGELOG + version** | v0.48.0 bump + 마이그레이션 매핑 표 | Edit | 7곳 버전 동기화 |
| **P9. 검증** | `node scripts/vais-validate-plugin.js` + grep 전수 + 빌드 | Bash | 통과 |

## Interface Contract (다음 단계 위임용)

| Key | Value |
|-----|-------|
| **다음 phase 위임 방식** | CTO 단독 (위임 없음). dev-backend/dev-frontend 등 sub-agent 미사용 |
| **사유** | 본 작업이 sub-agent 자체를 rename하므로 sub-agent 호출 시 기존/신규 이름 충돌 위험 |
| **실행자** | CTO Do phase에서 직접 실행 (Edit/Bash 도구) |
| **결정 사항 (CEO plan에서 상속)** | 20개 매핑 표, C. 확장 범위 |
| **결정 사항 (CTO plan에서 추가)** | Phase 분할 9단계, validation 전략, sub-agent 위임 안 함 |

## Success Criteria

- **SC-01**: 20개 agent 파일명이 신규 이름으로 변경됨 (git mv history 보존)
- **SC-02**: 23개 파일의 frontmatter `name:` 필드가 신규 이름과 일치
- **SC-03**: `grep -rE "(dev-backend|dev-frontend|test-builder|...|qa-validator)"` 결과가 0건 (docs/, vendor/, basic/, references/ 제외)
- **SC-04**: `node scripts/vais-validate-plugin.js` 정상 종료
- **SC-05**: `vais.config.json` JSON 유효성 + subAgents 배열 길이 = 20개 변경 반영
- **SC-06**: CHANGELOG.md에 매핑 표 + 마이그레이션 노트 포함
- **SC-07**: 7곳 버전 동기화 (package.json, vais.config.json, CHANGELOG, plugin.json 등)

## 리스크 및 대응

| 리스크 | 심각도 | 대응 |
|--------|--------|------|
| 일괄 치환 시 단어 경계 문제 (`backend` ⊂ `dev-backend`) | 높 | `\b{name}\b` 정규식 또는 정확한 문자열 매칭만 사용 |
| frontmatter `name:` ↔ 파일명 불일치 | 중 | P2 후 sanity check 스크립트 |
| `dev-backend` 같이 신규 이름이 부분 문자열로 잔존 | 중 | grep 검증 시 `\bdev-backend\b` 패턴 사용 |
| `bug-investigator` 같이 docs/ 역사 기록에 잔존 | 저 | docs/ 제외 (의도적 보존) |
| 직전 sub-agent-rename 커밋과 git noise | 중 | 단일 커밋으로 묶고 `feat(rename)!: agent industry naming` 메시지 |
| `.vais/agent-state.json`에 옛 이름 캐싱 | 저 | 실행 전 `.vais/agent-state.json` 백업, 필요 시 초기화 |
| 마켓플레이스 배포 시 사용자 워크플로우 깨짐 | 높 | CHANGELOG에 BREAKING CHANGE 명기 + 매핑 표 제공 |

## CTO 단독 실행 결정

본 작업은 sub-agent **자체**를 rename하므로 다음과 같은 dependency 위험이 있습니다:

```
CTO → dev-backend 호출 → dev-backend.md 읽기 시도
                       → 파일이 backend-engineer.md로 이미 rename되어 있으면 실패
                       → 또는 frontmatter name:이 backend-engineer로 변경되어 있으면 호출 불일치
```

따라서 **dev-frontend / dev-backend / test-builder 등 어떤 sub-agent도 위임 호출하지 않습니다**. CTO가 Do phase에서 Edit/Bash로 직접 모든 변경을 수행합니다.

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-08 | 초기 작성 — CEO plan v1.1 입력 기반 강행 모드, 9-phase 실행 계획 |
