# CTO Do: sub-agent-rename

> 하위 에이전트 18개의 이름을 2단어 kebab-case로 리네이밍

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-05 | 초기 작성 — 전체 18개 에이전트 리네이밍 완료 |

---

## 1. 구현 결정사항

### 리네이밍 전략: name 필드 변경 + 파일 복사 + 구파일 deprecation stub

Claude Code는 에이전트 식별에 파일명이 아닌 frontmatter의 `name:` 필드를 사용한다. 따라서:

1. **새 파일 생성**: 새 이름의 `.md` 파일 생성 (전체 내용 포함)
2. **구 파일 deprecation**: 구 파일은 `name: _deprecated_{old_name}`으로 변경하여 이름 충돌 방지
3. **참조 갱신**: C-Level 에이전트, config, scripts, skills, docs 등 모든 참조를 새 이름으로 갱신

### 왜 git mv가 아닌 Write + stub 방식인가

- Bash 도구가 사용 불가한 환경에서 실행
- Write 도구로 새 파일 생성 + 구 파일을 stub으로 덮어쓰기 방식이 안전
- 구 파일을 즉시 삭제하면 에이전트 해석 시 참조 깨짐 위험 → stub 유지

## 2. 변경 파일 목록

### 생성된 파일 (18개 새 에이전트 파일)

| # | 경로 | 설명 |
|---|------|------|
| 1 | `agents/cto/infra-architect.md` | architect → infra-architect |
| 2 | `agents/cto/dev-backend.md` | backend → dev-backend |
| 3 | `agents/cto/dev-frontend.md` | frontend → dev-frontend |
| 4 | `agents/cto/ui-designer.md` | design → ui-designer |
| 5 | `agents/cto/db-architect.md` | database → db-architect |
| 6 | `agents/cto/deploy-ops.md` | devops → deploy-ops |
| 7 | `agents/cto/bug-investigator.md` | investigate → bug-investigator |
| 8 | `agents/cto/qa-validator.md` | qa → qa-validator |
| 9 | `agents/cto/test-builder.md` | tester → test-builder |
| 10 | `agents/cso/security-auditor.md` | security → security-auditor |
| 11 | `agents/cso/compliance-audit.md` | compliance → compliance-audit |
| 12 | `agents/cmo/copy-writer.md` | copywriter → copy-writer |
| 13 | `agents/cmo/growth-analyst.md` | growth → growth-analyst |
| 14 | `agents/cmo/seo-analyst.md` | seo → seo-analyst |
| 15 | `agents/coo/perf-benchmark.md` | benchmark → perf-benchmark |
| 16 | `agents/coo/canary-monitor.md` | canary → canary-monitor |
| 17 | `agents/coo/sre-ops.md` | sre → sre-ops |
| 18 | `agents/ceo/retro-report.md` | retro → retro-report |

### Deprecation stub으로 변환된 파일 (18개 구 파일)

| # | 경로 | stub name |
|---|------|-----------|
| 1 | `agents/cto/architect.md` | `_deprecated_architect` |
| 2 | `agents/cto/backend.md` | `_deprecated_backend` |
| 3 | `agents/cto/frontend.md` | `_deprecated_frontend` |
| 4 | `agents/cto/design.md` | `_deprecated_design` |
| 5 | `agents/cto/database.md` | `_deprecated_database` |
| 6 | `agents/cto/devops.md` | `_deprecated_devops` |
| 7 | `agents/cto/investigate.md` | `_deprecated_investigate` |
| 8 | `agents/cto/qa.md` | `_deprecated_qa` |
| 9 | `agents/cto/tester.md` | `_deprecated_tester` |
| 10 | `agents/cso/security.md` | `_deprecated_security` |
| 11 | `agents/cso/compliance.md` | `_deprecated_compliance` |
| 12 | `agents/cmo/copywriter.md` | `_deprecated_copywriter` |
| 13 | `agents/cmo/growth.md` | `_deprecated_growth` |
| 14 | `agents/cmo/seo.md` | `_deprecated_seo` |
| 15 | `agents/coo/benchmark.md` | `_deprecated_benchmark` |
| 16 | `agents/coo/canary.md` | `_deprecated_canary` |
| 17 | `agents/coo/sre.md` | `_deprecated_sre` |
| 18 | `agents/ceo/retro.md` | `_deprecated_retro` |

### 수정된 참조 파일

| # | 경로 | 변경 내용 |
|---|------|----------|
| 1 | `vais.config.json` | subAgents 배열 18개 이름 갱신, parallelGroups 갱신 |
| 2 | `agents/cto/cto.md` | description, phase table, delegation table, chaining table, CP 템플릿 |
| 3 | `agents/ceo/ceo.md` | 파이프라인 다이어그램, CSO 루프 |
| 4 | `agents/cso/cso.md` | description, Gate A/B/C 테이블, delegation table |
| 5 | `agents/cmo/cmo.md` | description, phase table, delegation table |
| 6 | `agents/coo/coo.md` | description, phase table, PDCA table, delegation table |
| 7 | `agents/cfo/cost-analyst.md` | architect → infra-architect 참조 |
| 8 | `skills/vais/phases/architect.md` | name 필드 + 내부 참조 |
| 9 | `skills/vais/phases/backend.md` | name 필드 + 내부 참조 |
| 10 | `skills/vais/phases/frontend.md` | name 필드 + 내부 참조 |
| 11 | `skills/vais/phases/design.md` | name 필드 + 내부 참조 |
| 12 | `skills/vais/phases/qa.md` | name 필드 + 내부 참조 |
| 13 | `skills/vais/utils/next.md` | frontend+backend → dev-frontend+dev-backend |
| 14 | `skills/vais/utils/mcp-builder.md` | architect → infra-architect |
| 15 | `skills/vais/utils/init.md` | architect_{feature} → infra-architect_{feature} |
| 16 | `lib/absorb-evaluator.mjs` | Layer 2 키워드 배열 갱신 |
| 17 | `scripts/agent-start.js` | VALID_ROLES execRoles 배열 갱신 |
| 18 | `scripts/gate-check.js` | architect 문서 경로 참조 |
| 19 | `scripts/generate-dashboard.js` | PHASE_META 키 갱신 |
| 20 | `CLAUDE.md` | 프로젝트 구조 트리, Execution 레이어 테이블, CTO 워크플로우 |
| 21 | `AGENTS.md` | Execution 레이어 테이블, 병렬 실행 설명, 직접 호출 경고문 |

### 에이전트 내부 크로스 참조 갱신

| # | 파일 | 변경 |
|---|------|------|
| 1 | `agents/cto/deploy-ops.md` | deploy-ops vs infra-architect 테이블 |
| 2 | `agents/cto/db-architect.md` | db-architect vs infra-architect 테이블 |
| 3 | `agents/cso/compliance-audit.md` | compliance-audit vs security-auditor 테이블 |
| 4 | `agents/cto/test-builder.md` | test-builder vs qa-validator 테이블 |
| 5 | `agents/coo/sre-ops.md` | sre-ops vs canary-monitor 테이블, deploy-ops 참조 |
| 6 | `agents/cto/ui-designer.md` | qa → qa-validator 참조 |

## 3. Design 이탈 항목

없음. Plan에서 정의한 18개 이름 매핑을 그대로 적용.

## 4. 미완료 항목

| # | 항목 | 우선순위 | 비고 |
|---|------|---------|------|
| 1 | 구 파일(deprecation stub) 삭제 | Low | 안정화 확인 후 일괄 삭제 가능. 현재 stub 상태로 무해함 |
| 2 | `prompt-handler.js` 키워드 검토 | Low | architect/frontend/backend는 사용자 의도 감지용 NL 키워드 — 에이전트 식별자가 아님. 변경 불요 판단 |
| 3 | CHANGELOG.md 갱신 | Medium | 다음 릴리스 시 반영 |

## 5. 발견한 기술 부채

| # | 항목 | 우선순위 | 설명 |
|---|------|---------|------|
| 1 | Deprecation stub 파일 18개 잔존 | Low | 이름 충돌 방지용. 1~2 릴리스 후 삭제 권장 |
| 2 | `prompt-handler.js` NL 키워드 | Low | 사용자 입력 의도 감지 키워드가 에이전트 이름과 같은 단어 사용. 현재는 문제 없으나 혼동 가능성 존재 |
