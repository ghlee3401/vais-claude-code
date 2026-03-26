# Plan: Agent & Phase 리네이밍

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | renaming |
| 작성일 | 2026-03-26 |
| 목표 기간 | 1일 |

### Value Delivered

| 관점 | 내용 |
|------|------|
| Problem | 현재 agent명이 `-er` 접미사(frontender, backender, builder, reviewer)를 사용하여 직관성이 떨어지고, phase명(fe, be, infra, qa)이 약어라 의미 전달이 약함 |
| Solution | Agent를 도메인 중심 명명(design, architect, frontend, backend, review)으로 통일하고, Phase도 풀네임(architect, frontend, backend, review)으로 변경 |
| Function UX Effect | 스킬 호출 시 `/vais frontend`, `/vais backend` 등 자연스러운 명령어 사용 가능. 코드베이스 내 네이밍 일관성 확보 |
| Core Value | 도메인 중심 네이밍으로 플러그인의 전문성과 가독성 향상. manager만 역할자 명명을 유지하여 오케스트레이터 역할 강조 |

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | `-er` 접미사와 약어(fe/be/infra/qa) 기반 명명이 직관적이지 않고, 도메인 영역 중심 명명이 더 깔끔 |
| WHO | vais-code 플러그인 사용자 (개발자) |
| RISK | 파일 리네이밍 시 git history 단절. 약어를 참조하는 기존 문서/config 누락 가능성 |
| SUCCESS | SC-01: 모든 agent/phase 참조가 새 이름으로 변경. SC-02: 체이닝 문법 정상 동작. SC-03: 빌드/테스트 통과 |
| SCOPE | Agent 파일명 + 내용, Phase 파일명 + 내용, config, 문서. 기능 변경 없음 (순수 리네이밍) |

---

## 1. 배경 및 문제 정의

### 1.1 현재 네이밍

**Agent:**
| 현재 | 파일 | 역할 |
|------|------|------|
| manager | `agents/manager.md` | 오케스트레이터 |
| designer | `agents/designer.md` | UI/UX 설계 |
| builder | `agents/builder.md` | 인프라/DB |
| frontender | `agents/frontender.md` | 프론트엔드 구현 |
| backender | `agents/backender.md` | 백엔드 API 구현 |
| reviewer | `agents/reviewer.md` | QA/코드 리뷰 |

**Phase:**
| 현재 | 파일 | 의미 |
|------|------|------|
| infra | `skills/vais/phases/infra.md` | 인프라 셋업 |
| fe | `skills/vais/phases/fe.md` | 프론트엔드 |
| be | `skills/vais/phases/be.md` | 백엔드 |
| qa | `skills/vais/phases/qa.md` | 품질 검증 |

### 1.2 문제점

1. **불일치한 패턴**: manager는 `-er`, 나머지도 `-er`이지만 builder→architect 역할과 맞지 않음
2. **약어 가독성**: `fe`, `be`는 약어라 처음 보는 사용자에게 직관적이지 않음
3. **도메인 vs 역할자**: agent가 '사람'이 아닌 '영역'으로 보는 관점이 더 자연스러움 (manager 제외)

---

## 2. 목표

1. Agent 이름을 도메인 중심으로 통일 (manager만 역할자 유지)
2. Phase 이름을 풀네임으로 변경하여 직관성 확보
3. 기능 변경 없이 순수 리네이밍만 수행
4. 모든 참조 파일 누락 없이 일괄 변경

---

## 3. 변경 사항

### 3.1 Agent 리네이밍

| 현재 | 변경 후 | 파일 변경 |
|------|---------|-----------|
| manager | manager (유지) | - |
| designer | **design** | `agents/designer.md` → `agents/design.md` |
| builder | **architect** | `agents/builder.md` → `agents/architect.md` |
| frontender | **frontend** | `agents/frontender.md` → `agents/frontend.md` |
| backender | **backend** | `agents/backender.md` → `agents/backend.md` |
| reviewer | **review** | `agents/reviewer.md` → `agents/review.md` |

### 3.2 Phase 리네이밍

| 현재 | 변경 후 | 파일 변경 |
|------|---------|-----------|
| infra | **architect** | `skills/vais/phases/infra.md` → `skills/vais/phases/architect.md` |
| fe | **frontend** | `skills/vais/phases/fe.md` → `skills/vais/phases/frontend.md` |
| be | **backend** | `skills/vais/phases/be.md` → `skills/vais/phases/backend.md` |
| qa | **review** | `skills/vais/phases/qa.md` → `skills/vais/phases/review.md` |

### 3.3 네이밍 철학

- **manager**: 유일한 역할자(-er) 패턴. 오케스트레이터 역할을 강조
- **나머지**: 도메인 영역 중심 명명. agent = "영역"이라는 관점
- **Phase = Agent 1:1 대응**: architect agent → architect phase, frontend agent → frontend phase

---

## 4. 영향 범위 (전체 파일 목록)

### 4.1 파일 리네이밍 (git mv)

| # | 현재 경로 | 변경 경로 |
|---|-----------|-----------|
| 1 | `agents/designer.md` | `agents/design.md` |
| 2 | `agents/builder.md` | `agents/architect.md` |
| 3 | `agents/frontender.md` | `agents/frontend.md` |
| 4 | `agents/backender.md` | `agents/backend.md` |
| 5 | `agents/reviewer.md` | `agents/review.md` |
| 6 | `skills/vais/phases/infra.md` | `skills/vais/phases/architect.md` |
| 7 | `skills/vais/phases/fe.md` | `skills/vais/phases/frontend.md` |
| 8 | `skills/vais/phases/be.md` | `skills/vais/phases/backend.md` |
| 9 | `skills/vais/phases/qa.md` | `skills/vais/phases/review.md` |

### 4.2 내용 수정 (agent/phase 이름 참조)

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `vais.config.json` | phases 배열, phaseNames, docPaths, agentTeam roles, routing, gates, gateChecklists 키 |
| 2 | `AGENTS.md` | 에이전트 테이블, 워크플로우 다이어그램, Gate 체크포인트 |
| 3 | `README.md` | agent/phase 참조 텍스트 |
| 4 | `CHANGELOG.md` | 기존 이력은 유지, 새 항목 추가 |
| 5 | `skills/vais/SKILL.md` | phase/agent 참조, 체이닝 예시, 커맨드 테이블 |
| 6 | `skills/vais/phases/plan.md` | phase 참조 |
| 7 | `skills/vais/phases/design.md` | agent 참조 (designer→design) |
| 8 | `skills/vais/phases/auto.md` | 전체 agent/phase 참조 |
| 9 | `skills/vais/phases/help.md` | phase 목록 |
| 10 | `skills/vais/phases/init.md` | phase 참조 |
| 11 | `output-styles/vais-default.md` | agent/phase 참조 |
| 12 | `scripts/prompt-handler.js` | phase keywords/mapping |
| 13 | `scripts/generate-dashboard.js` | phase key/name 매핑 |
| 14 | `agents/manager.md` | delegates_to 목록 |
| 15 | `agents/design.md` (리네임 후) | name 필드 |
| 16 | `agents/architect.md` (리네임 후) | name 필드 |
| 17 | `agents/frontend.md` (리네임 후) | name 필드 |
| 18 | `agents/backend.md` (리네임 후) | name 필드 |
| 19 | `agents/review.md` (리네임 후) | name 필드 |
| 20 | `.claude/settings.local.json` | 에이전트 권한 경로 (cp 명령 참조) |
| 21 | `mcp/design-system-server.json` | agent 참조 확인 필요 |

### 4.3 문서 경로 변경

`vais.config.json`의 `docPaths` 및 실제 디렉토리:
| 현재 | 변경 후 |
|------|---------|
| `docs/03-infra/` | `docs/03-architect/` |
| `docs/04-qa/` | `docs/04-review/` |

> 기존 문서 디렉토리도 리네이밍 필요

---

## 5. 구현 순서

### Step 1: 파일 리네이밍 (git mv)
1. Agent 파일 5개 리네이밍
2. Phase 파일 4개 리네이밍
3. 문서 디렉토리 리네이밍 (docs/03-infra → docs/03-architect, docs/04-qa → docs/04-review)

### Step 2: Agent 파일 내용 수정
- 각 agent .md 파일의 `name:` 필드 업데이트
- manager.md의 `delegates_to` 목록 업데이트

### Step 3: Phase 파일 내용 수정
- 리네이밍된 phase 파일 내 agent/phase 참조 업데이트
- 변경되지 않은 phase 파일(plan, design, auto, help, init 등) 내 참조도 업데이트

### Step 4: Config 수정
- `vais.config.json` 전면 업데이트
- `.claude/settings.local.json` 권한 경로 업데이트

### Step 5: 문서 수정
- `AGENTS.md` 업데이트
- `README.md` 업데이트
- `skills/vais/SKILL.md` 업데이트
- `output-styles/vais-default.md` 업데이트

### Step 6: 스크립트 수정
- `scripts/prompt-handler.js` phase 매핑 업데이트
- `scripts/generate-dashboard.js` phase 키 업데이트

### Step 7: 검증
- JSON 파일 유효성 검증 (vais.config.json, plugin.json 등)
- 체이닝 문법 테스트 (`/vais frontend+backend`)
- 전체 grep으로 잔여 구이름 확인

---

## 6. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| git history 단절 | git mv 사용하면 추적 가능 | `git mv` 사용 (cp+rm 아닌) |
| 참조 누락 | 런타임 에러 | 변경 후 전체 grep으로 잔여 확인 |
| 기존 문서 내 약어 참조 | 혼란 | CHANGELOG에 매핑 테이블 기록 |
| 워크플로우 다이어그램 깨짐 | UX 저하 | AGENTS.md, README.md 다이어그램 동시 수정 |

---

## 7. 성공 기준

| ID | 기준 | 검증 방법 |
|----|------|-----------|
| SC-01 | 모든 agent/phase 참조가 새 이름으로 변경됨 | `grep -r "frontender\|backender\|builder\|reviewer\|designer"` 결과 0건 (CHANGELOG 제외) |
| SC-02 | 체이닝 문법 정상 동작 | `prompt-handler.js` 테스트 통과 |
| SC-03 | JSON 파일 유효성 | `node -e` JSON.parse 검증 통과 |
| SC-04 | 구 phase명(fe, be, infra, qa) 참조 0건 | grep 검증 (CHANGELOG, 이력 문서 제외) |

---

## 8. 코딩 규칙

- `git mv` 사용하여 파일 히스토리 보존
- JSON 수정 시 들여쓰기/포맷 유지
- 기존 기능 변경 없음 (순수 리네이밍)
- 커밋은 `/vais commit` 플로우 사용

---

## 9. 추가 변경 (v0.20.2)

### review → qa 롤백

v0.20.1에서 `reviewer` → `review`로 변경했으나, `qa`가 더 직관적이라는 판단으로 다시 변경:

| 구분 | v0.20.1 | v0.20.2 |
|------|---------|---------|
| Agent | review | **qa** |
| Phase | review | **qa** |
| 문서 경로 | docs/04-review/ | **docs/04-qa/** |

나머지 (design, architect, frontend, backend, manager)는 v0.20.1 그대로 유지.
