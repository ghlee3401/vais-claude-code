# design-system-mcp-activation - 기획서 (Standard)

> ⛔ **Plan 단계 범위**: 분석·결정만 기록. 프로덕트 파일 생성·수정은 Do 단계.
> 📝 **Standard 템플릿** + 3 topic 분리 (200 lines budget 준수)

## 요청 원문

> "현재 ui designer가 ui-ux-pro-max mcp를 항상 부르고 있나?"
> → fact-finding 결과 **한 번도 부르지 않음** → 사용자가 "MCP 활성화 ideation" 선택 → ideation 4 결정 → CTO plan 강행 (PRD 부재)

## In-scope

- `vais.config.json > mcp.enabled` `false` → `true` + `.mcp.json` 신규
- `.claude-plugin/plugin.json` 에 mcp 항목 등록
- `agents/cto/ui-designer.md` + `agents/cto/frontend-engineer.md` tools 권한 추가 → `agent-permission-model.md`
- design phase 진입 hook + `design_system_generate` 자동 호출 + idempotency
- Hard fail 검증 (Python3 + vendor 무결성) + 한국어 안내 → `hard-fail-strategy.md`
- 마이그레이션 fallback (구버전 사용자 자동 ON) → `migration-fallback.md`
- `README.md` + `CLAUDE.md` + ui-designer.md description 갱신

## Out-of-scope

- `vendor/ui-ux-pro-max` 자체 데이터/스크립트 개선 — 별도 피처
- 신규 design tool 추가 — 현 3개만 사용
- 안내 메시지 i18n — 한국어 우선, 영어는 별도
- MCP 응답 캐싱 일반화 — 본 피처는 file 기반 idempotency 만
- design 외 phase 에서 MCP 호출 — design + (do 의 stack-search) 두 곳만
- 자동 Python 설치 시도 — 안내만, 자동 시도 X

> 자발 감지 확장 후보는 `## 관찰 (후속 과제)` (Rule #9).

---

## Executive Summary

| Perspective | Content | Contributing C-Levels |
|-------------|---------|-----------------------|
| **Problem** | v0.48 ~ v0.60.0 12 minor 동안 MCP 비활성 — ui-designer 가 token 없이 디자인하거나 사용자 수동 호출 필요 | ceo (ideation) |
| **Solution** | mcp.enabled true + .mcp.json 등록 + agent tool 권한 + design 자동 호출 hook + Hard fail 검증 | cto (plan~do) |
| **Function/UX Effect** | design 진입 시 MASTER.md 자동 생성 (수동 호출 0건). Python3 미설치 시 명확한 안내 + exit | cpo 영역, 본 피처는 cto |
| **Core Value** | 12 minor 미뤄온 약속 이행 + design phase 자동화 폐쇄 루프 완성 | ceo, cto |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | ui-designer 가 design token 없이 디자인 (현재) → MCP 자동 호출로 토큰 영속화 (목표) |
| **WHO** | vais-code OSS 사용자 전체 (default ON, opt-out). 1인 사용자 = 본인 |
| **RISK** | (R1) Python3 미설치 첫 진입 장벽 (R2) vendor 손상 시 진단 어려움 (R3) MCP subprocess 보안 (R4) 12 minor 코드의 dead spec |
| **SUCCESS** | design 자동 호출 100%, 수동 호출 0건, Hard fail 안내 명확 |
| **SCOPE** | Standard — config 5개 + agent 2개 + script 3개 (~9 파일, ~200 LOC) |

---

## Decision Record (multi-owner)

| # | Decision | Owner | Rationale | Source topic |
|---|----------|:-----:|-----------|--------------|
| D-1 | MCP 활성화 scope = OSS default ON | ceo | Profile gate 패턴, blocker 없음 | `00-ideation/main.md` |
| D-2 | design phase 진입 시 generate 자동 호출 | ceo | 매번 명시 트리거 UX 비용 회피 | `00-ideation/main.md` |
| D-3 | 3개 tool 모두 사용 | ceo | 원설계 의도 존중 | `00-ideation/main.md` |
| D-4 | Python3/vendor 미설치 시 Hard fail | ceo | 사일런트 품질 저하 회피 | `hard-fail-strategy.md` |
| D-5 | tool 권한: ui-designer (search+gen) / frontend-engineer (stack) | cto | 역할 경계 일치 | `agent-permission-model.md` |
| D-6 | stack-search 호출 시점 = do phase | cto | 구현 직전 가치 최대 | `agent-permission-model.md` |
| D-7 | MASTER.md 존재 시 generate skip (idempotency) | cto | 캐싱 일반화 회피, 단순 file 기반 | (main.md inline) |
| D-8 | Python 최소 = 3.10 (잠정, design 단계 확정) | cto | macOS 14+/Ubuntu 22+ 표준 | `hard-fail-strategy.md` |
| D-9 | vendor 무결성 = 4단계 검증 (디렉토리/파일 존재) | cto | checksum 은 over-engineering (YAGNI) | `hard-fail-strategy.md` |
| D-10 | 마이그 fallback default = true (Profile gate 패턴) | cto | 일관성, 검증된 모델 답습 | `migration-fallback.md` |
| D-11 | Hard fail 안내 = 한국어 우선, README#Install 링크 | cto | 문서 일관성, i18n 별도 | `hard-fail-strategy.md` |
| D-12 | MCP 통합 테스트 = mock subprocess CI + manual smoke | cto | CI 안정성, Python 다양성 통제 불가 | `hard-fail-strategy.md` |
| D-13 | ui-designer.md description 정정 | cto | "Auto-generates via MCP and consumes" 호출 주체 명시 | (main.md inline) |

> Q-1 ~ Q-9 ideation 미해결 → D-5 ~ D-13 plan 해소.

---

## 0. 아이디어 요약

| Key | Value |
|-----|-------|
| 한 줄 설명 | design phase 가 ui-ux-pro-max MCP 자동 호출하여 design token (`design-system/{feature}/MASTER.md`) 생성·소비 |
| 배경 | v0.48 부터 vendor + mcp/server.json 설계만 있고 활성화 미루어짐. ui-designer 가 토큰 없이 디자인 또는 수동 호출 |
| 타겟 사용자 | vais-code OSS 사용자 (default ON). Python3 + vendor 보유 |
| 핵심 시나리오 | `/vais cto design my-feature` → hook → Python3/vendor 검증 → generate 자동 호출 → MASTER.md 영속화 → ui-designer Read 소비 |

## 0.7 PRD 입력 (CTO 강행 체크)

| Key | Value |
|-----|-------|
| PRD 경로 | "없음 (강행 모드)" |
| 완성도 | missing |
| 검사 시각 | 2026-04-26 |

### 강행 모드 사유

- 사용자 선택: CP-0 B 강행
- 가정한 요구사항: 1) Python3 설치 가능 2) vendor 데이터 plugin 배포에 포함

> ⚠️ 강행 plan. design 단계에서 vendor 실측 + Python 의존 확인 필요.

## 2. Plan-Plus 검증

### 2.1 의도 발견

근본 문제는 **"설계도(mcp/server.json)는 있는데 시공이 안 된 12 minor 부채"**. ui-designer 토큰 부재는 표면 증상, 본질은 **vendor + MCP 통합 약속 이행**.

### 2.2 대안 탐색

| # | 대안 | 장점 | 단점 | 채택 |
|---|------|------|------|:----:|
| 1 | MCP 활성화 (본 결정) | 원설계 존중, 자동화 완성 | Python3 강제 | ✅ |
| 2 | Bash subprocess 직접 호출 | MCP 우회 | 표준화 안 됨 | ❌ |
| 3 | 사전 토큰 read-only | 의존 0 | 자동화 0 | ❌ |

### 2.3 YAGNI 리뷰

- [x] 현재 필요 기능만 — caching/i18n/자동 Python 설치 모두 OOS
- [x] 미래 요구 과잉 설계 없음 — 신규 MCP tool 추가는 별도
- [x] 제거 가능 기능: 없음 (3 tool 모두 D-3 핵심)

## 4. 기능 요구사항 (요약)

| # | 기능 | 설명 | 우선순위 | 관련 파일 |
|---|------|------|:-------:|----------|
| 1 | MCP 활성화 config | mcp.enabled true + .mcp.json 신규 | Must | `vais.config.json`, `.mcp.json` |
| 2 | Plugin manifest 등록 | plugin.json 에 mcp 항목 | Must | `.claude-plugin/plugin.json` |
| 3 | Agent tool 권한 분배 | → `agent-permission-model.md` | Must | `agents/cto/{ui-designer, frontend-engineer}.md` |
| 4 | Design phase hook | generate 자동 호출 + MASTER.md 영속화 | Must | `hooks/design-mcp-trigger.js` (신규) |
| 5 | Hard fail 검증 | → `hard-fail-strategy.md` | Must | `lib/mcp-validator.js` (신규) |
| 6 | Idempotency | MASTER.md 존재 시 skip | Must | (4) hook 내부 |
| 7 | 마이그 fallback | → `migration-fallback.md` | Must | `lib/mcp-validator.js` |
| 8 | 안내 메시지 | → `hard-fail-strategy.md` | Must | (5) validator 내부 |
| 9 | 문서 갱신 | README + CLAUDE.md + description | Must | `README.md`, `CLAUDE.md`, `agents/cto/ui-designer.md` |

## 5. 정책 (요약)

| # | 정책 | 상세 |
|---|------|------|
| 1 | MCP 호출 권한 | → `agent-permission-model.md` |
| 2 | Hard fail trigger | → `hard-fail-strategy.md` |
| 3 | Idempotency | MASTER.md 존재 + 비어있지 않으면 skip. 재생성은 사용자 수동 삭제 |
| 4 | Backwards compat | → `migration-fallback.md` |
| 5 | Subprocess 보안 | `command` 인자 내 `${query}`/`${project_name}` shell escape 검증 |

## 6. 비기능 (요약)

| 항목 | 요구사항 | 기준 |
|------|---------|------|
| 성능 | generate 1회 / feature, MASTER.md 캐시 | 호출 ≤ 1회 (재생성 명시 삭제 후) |
| 보안 | subprocess 입력 sanitize | shell metachar 차단, project_name pattern |
| 호환성 | → `hard-fail-strategy.md` | Python 3.10+ 잠정 |
| 테스트 | mock CI + manual smoke | npm test 통과 + 1회 manual |

## Success Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-01 | design 진입 시 MASTER.md 자동 생성 | manual smoke |
| SC-02 | Python3 미설치 → 한국어 안내 + exit(1) | mock CI + manual |
| SC-03 | ui-designer 가 design_search 호출 가능 | manual smoke |
| SC-04 | 기존 사용자 자동 마이그 | mock CI 5 시나리오 (`migration-fallback.md`) |
| SC-05 | 문서 일관성 (README/CLAUDE.md/description) | grep |
| SC-06 | 재호출 시 MASTER.md 보존 | manual smoke (mtime 변화 없음) |

## Impact Analysis

### Changed Resources

| Resource | Type | Change |
|----------|------|--------|
| `.mcp.json` | create | MCP server 등록 진입점 |
| `hooks/design-mcp-trigger.js` | create | design 진입 감지 + generate 호출 + Hard fail |
| `lib/mcp-validator.js` | create | Python3 + vendor 검증 + 안내 |
| `vais.config.json` | modify | mcp.enabled true + description |
| `.claude-plugin/plugin.json` | modify | mcp server 항목 |
| `agents/cto/ui-designer.md` | modify | tools (search+gen) + description (D-13) |
| `agents/cto/frontend-engineer.md` | modify | tools (stack-search) |
| `hooks/hooks.json` | modify | design-mcp-trigger PreToolUse 등록 |
| `README.md`, `CLAUDE.md` | modify | Python3 의존 + 설치 가이드 |

### Verification

- [ ] design 단계 vendor 스크립트 실측 (Python 의존 확인)
- [ ] mock subprocess 테스트 CI 등록
- [ ] breaking change 0 — 기존 design phase 흐름 유지

## 7. 기술 스택

| 영역 | 기술 | 이유 |
|------|------|------|
| MCP protocol | Claude Code 내장 MCP | 표준 |
| 호출 layer | Node.js subprocess → Python3 | server.json command 패턴 |
| 검증 layer | `lib/mcp-validator.js` JS | `lib/project-profile.js` 동급 |
| Hook | PreToolUse on Agent (ui-designer 진입) | design 자동 감지 가장 확실 |
| 테스트 | node:test + mock subprocess | CI 무결 |

## 관찰 (후속 과제)

> Rule #9: 자발 감지 확장 후보는 여기 기록만. In-scope 자동 승계 금지.

- (관찰-1) MCP 호출 결과 캐싱 일반화 — 다수 MCP server 도입 시
- (관찰-2) Hard fail 안내 i18n (한국어/영어 분기)
- (관찰-3) vendor/ui-ux-pro-max v2 (BM25 → embedding upgrade)
- (관찰-4) 다른 MCP server 추가 (예: vais-feature-tracker) 동일 패턴 활용

---

## Topic Documents (v0.57+)

| Topic | 파일 | Owner | 한 줄 요약 | 참조 scratchpad |
|-------|------|:-----:|-----------|----------------|
| Agent Permission Model | `agent-permission-model.md` | cto | D-5/D-6/정책1 — tool 권한 분배 + 호출 시점 | (없음 — CTO 직접) |
| Hard Fail Strategy | `hard-fail-strategy.md` | cto | D-4/D-9/D-11/D-12/정책2/SC-02 — Python3+vendor 검증 + 안내 | (없음 — CTO 직접) |
| Migration Fallback | `migration-fallback.md` | cto | D-10/정책4/SC-04 — Profile gate 패턴 답습 | (없음 — CTO 직접) |

## Scratchpads (v0.57+)

| Agent | 경로 | 크기 | 갱신 |
|-------|------|:----:|-----|
| (CTO 직접 작성, sub-agent 위임 없음) | — | — | — |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Standard, 13 결정 (D-1~D-4 ideation + D-5~D-13 plan) |
| v1.1 | 2026-04-26 | topic 3개 분리 (agent-permission-model / hard-fail-strategy / migration-fallback). main.md 247→~190 lines |
