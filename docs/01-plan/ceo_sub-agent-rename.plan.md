# CEO Plan: sub-agent-rename

> 하위 에이전트 이름을 2단어 kebab-case로 통일

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-05 | 초기 작성 |
| v1.1 | 2026-04-05 | 미확정 5개 이름 확정 (후보 A), CTO 위임 결정 |

---

## Executive Summary

현재 37개 에이전트 중 18개 하위 에이전트가 단일 단어 이름을 사용하고 있다.
모든 하위 에이전트를 `단어-단어` (kebab-case 2단어) 패턴으로 통일하여 일관성을 확보한다.
C-Level 에이전트(ceo, cpo, cto, cso, cmo, coo, cfo)는 현행 유지.

## Context Anchor

- **동기**: 에이전트 이름 컨벤션 불일치 — 일부는 `cost-analyst` 형태, 일부는 `backend` 단일 단어
- **목표**: 모든 하위 에이전트 이름을 `{수식어}-{역할}` 또는 `{역할}-{기능}` 2단어 kebab-case로 통일
- **제약**: C-Level 이름(ceo~cfo)은 변경하지 않음, 이미 2단어인 기존 에이전트도 현행 유지

## 이름 매핑 (확정 필요)

아래는 대화에서 논의된 후보안이다. **CP-1에서 최종 확정**.

| # | 현재 | 후보안 | 소속 | 비고 |
|---|------|--------|------|------|
| 1 | `architect` | `infra-architect` | CTO | architect 자체가 역할명사 |
| 2 | `backend` | `dev-backend` | CTO | dev- 접두 |
| 3 | `frontend` | `dev-frontend` | CTO | dev- 접두 |
| 4 | `benchmark` | `perf-benchmark` | COO | ✅ 확정 |
| 5 | `canary` | `canary-monitor` | COO | ✅ 확정 |
| 6 | `compliance` | `compliance-audit` | CSO | ✅ 확정 |
| 7 | `copywriter` | `copy-writer` | CMO | ✅ 확정 |
| 8 | `database` | `db-architect` | CTO | ✅ 확정 |
| 9 | `design` | `ui-designer` | CTO | ✅ 확정 |
| 10 | `devops` | `deploy-ops` | CTO/COO | ✅ 확정 |
| 11 | `growth` | `growth-analyst` | CMO | ✅ 확정 |
| 12 | `investigate` | `bug-investigator` | CTO | ✅ 확정 |
| 13 | `qa` | `qa-validator` | CTO | ✅ 확정 |
| 14 | `retro` | `retro-report` | CEO | ✅ 확정 |
| 15 | `security` | `security-auditor` | CSO | ✅ 확정 |
| 16 | `seo` | `seo-analyst` | CMO | ✅ 확정 |
| 17 | `sre` | `sre-ops` | COO | ✅ 확정 |
| 18 | `tester` | `test-builder` | CTO | ✅ 확정 |

**전체 18개 확정 완료** (2026-04-05, CP-1 승인)

## 영향 범위 분석

### 변경 대상 파일

| 카테고리 | 파일 수 | 설명 |
|----------|---------|------|
| **에이전트 파일명** | 18 | `agents/{c-level}/{name}.md` 파일명 변경 |
| **에이전트 내부 frontmatter** | 18 | `name:` 필드 변경 |
| **상위 에이전트 참조** | ~10 | ceo, cto, cso, cmo, coo 등 C-Level 에이전트 내 하위 에이전트명 참조 |
| **스킬 phase 파일** | 5 | `skills/vais/phases/{architect,backend,frontend,design,qa}.md` 파일명+내용 |
| **스킬 SKILL.md** | 1 | 에이전트 목록 참조 |
| **vais.config.json** | 1 | `subAgents`, `parallelGroups` 배열 |
| **CLAUDE.md** | 1 | 에이전트 테이블 (~24 참조) |
| **AGENTS.md** | 1 | 에이전트 테이블 (~22 참조) |
| **lib 코드** | 2 | `lib/absorb-evaluator.mjs`, `lib/status.js` |
| **scripts** | ~17 | `scripts/` 내 에이전트명 참조 |
| **기타 skill utils** | ~4 | `skills/vais/utils/` 내 참조 |

**총 영향 파일: ~78개**

### 변경하지 않는 것

- C-Level 에이전트 파일명/이름 (ceo, cpo, cto, cso, cmo, coo, cfo)
- 이미 2단어인 에이전트 (absorb-analyzer, code-review, cost-analyst 등 12개)
- `basic/` 디렉토리 (패턴 참고용, QA 대상 아님)
- `vendor/` 디렉토리

## 담당 C-Level

| 역할 | 담당 |
|------|------|
| **CTO** | 주담당 — 파일명 변경, frontmatter 수정, 코드/스크립트 내 참조 일괄 수정 |
| **CEO** | 계획 수립 + 최종 리뷰 |

> 이유: 순수 기술 리팩터링이므로 CTO 단독 수행. CPO/CSO/CMO/COO/CFO 불필요.

## 실행 계획 (CTO 위임)

### Phase 1: 파일명 변경
- `agents/{c-level}/` 하위 18개 파일 `git mv`

### Phase 2: Frontmatter 수정
- 각 에이전트 `.md` 파일의 `name:` 필드 변경

### Phase 3: 상위 에이전트 참조 수정
- C-Level 에이전트(ceo, cto, cso, cmo, coo) 내 하위 에이전트명 참조

### Phase 4: 설정 파일 수정
- `vais.config.json` — subAgents, parallelGroups
- `package.json` — 에이전트 등록 (있다면)

### Phase 5: 스킬/문서 수정
- `skills/vais/phases/` — 파일명 + 내용
- `skills/vais/SKILL.md`
- `skills/vais/utils/` 내 참조

### Phase 6: 코드/스크립트 수정
- `lib/absorb-evaluator.mjs`, `lib/status.js`
- `scripts/` 내 참조

### Phase 7: 프로젝트 문서 수정
- `CLAUDE.md` — 에이전트 테이블
- `AGENTS.md` — 에이전트 테이블

### Phase 8: 검증
- `node scripts/vais-validate-plugin.js` 실행
- 에이전트 이름 일관성 확인

## 리스크

| 리스크 | 대응 |
|--------|------|
| 누락된 참조로 런타임 에러 | Phase 8에서 grep 기반 전수 검증 |
| 마켓플레이스 배포 영향 | settings.json allowedTools 동기화 필요 |
| 기존 .vais/status.json 호환 | 기존 피처 진행 상태에 에이전트명 포함 시 마이그레이션 필요 |
