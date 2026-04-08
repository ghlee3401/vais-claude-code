# CTO Do: agent-rename-v2

> P1~P9 실행 로그 + 검증 결과

## 실행 요약

| 항목 | 값 |
|------|---|
| 실행자 | CTO 직접 (sub-agent 위임 0건) |
| 실행 시각 | 2026-04-08 |
| Phase 수 | 9 (P1~P9) |
| Rename | 23건 (agents 20 + skills/phases 3) |
| 수정 파일 | 66개 (git status 기준) |
| 버전 bump | v0.47.1 → v0.48.0 (BREAKING) |
| 결과 | ✅ 성공 (검증 모두 통과) |

## Phase별 실행 결과

### P1. 파일 rename (23건)

**도구**: Bash (`git mv` × 23, atomic chained with `&&`)

**실행 명령**: design 문서 §3.P1 참조

**검증**: `git status --short | grep -E "^R" | wc -l` → 23 ✅

### P2. Frontmatter `name:` 갱신 (23건)

**도구**: Bash + sed (`sed -i 's/^name: OLD$/name: NEW/'`)

**검증**: 23개 파일의 `basename` ↔ `name:` 일치성 확인 → mismatches=0 ✅

### P3-P7. 참조 치환 (~52 파일)

**도구**: Bash + sed (단어 경계 `\b` 사용, 20개 매핑 일괄)

**대상**:
- `agents/**/*.md` (33 파일)
- `skills/vais/**/*.md` (11 파일)
- `lib/**/*.{js,mjs}` (1 파일)
- `scripts/**/*.js` (4 파일)
- `output-styles/**/*.md` (1 파일)
- `vais.config.json`
- `CLAUDE.md`, `AGENTS.md`, `README.md`

**충돌 처리**: `\bcode-review\b` / `\bcompliance-audit\b` 등 substring 충돌은 단어 경계로 자연 차단됨 — replace 후 결과(`code-reviewer`)에 재매칭되지 않음.

**False Positive 1건 발견 + 복원**:
- 문제: `\bvalidate-plugin\b` 패턴이 스크립트 파일명 `vais-validate-plugin.js` 내부의 `validate-plugin` 부분을 매칭
- 발생 위치: `CLAUDE.md`, `agents/cso/skill-validator.md`, `scripts/vais-validate-plugin.js`
- 복원: `sed -i 's/vais-plugin-validator/vais-validate-plugin/g'`로 원복
- 교훈: 향후 design 단계에서 substring 검사 시 **agent 이름이 다른 파일/스크립트 식별자의 일부인 경우**도 충돌 매트릭스에 포함 필요

### P8. CHANGELOG + 버전 동기화 (7곳)

**버전 bump**: v0.47.1 → v0.48.0

**동기화 위치**:
1. `package.json` (version)
2. `vais.config.json` (version)
3. `.claude-plugin/plugin.json` (version)
4. `.claude-plugin/marketplace.json` (version × 2)
5. `CLAUDE.md` (헤더 문자열)
6. `README.md` (헤더 문자열)
7. `CHANGELOG.md` (신규 섹션)

**CHANGELOG.md 신규 섹션**: `## [0.48.0] - 2026-04-08` — BREAKING CHANGES + 20개 매핑 표 + 마이그레이션 가이드

> `output-styles/vais-default.md` 점검: v0.47.1 표기 없음 → bump 불필요

### P9. 검증 결과

```
=== 1. JSON validity ===
vais.config.json: OK
package.json: OK
plugin.json: OK
marketplace.json: OK

=== 2. validate-plugin ===
✅ 검증 통과 — 플러그인/마켓플레이스 배포 준비 완료
오류: 0 | 경고: 0 | 정보: 6
- vais-code@0.48.0
- 38개 agent 정의 (7개 C-Level 디렉토리)

=== 3. Frontmatter consistency ===
Total mismatches: 0

=== 4. Residual OLD names ===
validate-plugin: 4 (모두 false positive — `vais-validate-plugin.js` 스크립트 파일명)
실제 agent 참조 잔존: 0
```

## Success Criteria 평가

| SC | 기준 | 결과 |
|----|------|------|
| SC-01 | 20개 agent + 3개 skill phase 파일명 변경 | ✅ git status R 23건 |
| SC-02 | 23개 파일 frontmatter `name:` 갱신 | ✅ mismatches=0 |
| SC-03 | OLD agent 이름 grep 잔존 0 (docs/ 제외) | ✅ 실제 잔존 0 (false positive 4 분리) |
| SC-04 | `vais-validate-plugin.js` 정상 종료 | ✅ 0 errors |
| SC-05 | `vais.config.json` JSON 유효 + subAgents 갱신 | ✅ |
| SC-06 | CHANGELOG에 매핑 표 + 마이그레이션 노트 | ✅ |
| SC-07 | 7곳 버전 동기화 | ✅ |
| SC-08 | substring 오염 0건 (`code-reviewerer` 등) | ✅ |

## git 변경 요약

```
M  .claude-plugin/marketplace.json
M  .claude-plugin/plugin.json
M  AGENTS.md
M  CHANGELOG.md
M  CLAUDE.md
M  README.md
M  package.json
M  vais.config.json
M  agents/ceo/{ceo,absorb-analyzer}.md
RM agents/ceo/retro-report.md → retrospective-writer.md
M  agents/cfo/cfo.md
RM agents/cfo/{cost-analyst→finops-analyst, pricing-modeler→pricing-analyst}.md
M  agents/cmo/cmo.md
M  agents/coo/coo.md
RM agents/coo/{perf-benchmark→performance-engineer, canary-monitor→release-monitor,
              sre-ops→sre-engineer, docs-writer→technical-writer}.md
M  agents/cpo/{cpo,data-analyst,ux-researcher}.md
RM agents/cpo/{pm-discovery→product-discoverer, pm-strategy→product-strategist,
              pm-research→product-researcher, pm-prd→prd-writer}.md
M  agents/cso/{cso,security-auditor,skill-validator}.md
RM agents/cso/{validate-plugin→plugin-validator, compliance-audit→compliance-auditor,
              code-review→code-reviewer}.md
M  agents/cto/{cto,db-architect,infra-architect,ui-designer}.md
RM agents/cto/{dev-backend→backend-engineer, dev-frontend→frontend-engineer,
              test-builder→test-engineer, bug-investigator→incident-responder,
              deploy-ops→release-engineer, qa-validator→qa-engineer}.md
M  skills/vais/...
RM skills/vais/phases/{dev-backend→backend-engineer, dev-frontend→frontend-engineer,
                       qa-validator→qa-engineer}.md
M  lib/absorb-evaluator.mjs
M  scripts/{agent-start,doc-validator,generate-dashboard,vais-validate-plugin}.js
```

총 66개 파일 변경 (rename 23 포함).

## 백업

| 파일 | 위치 |
|------|------|
| `.vais/agent-state.json` | `.vais/agent-state.json.bak.{timestamp}` |
| git pre-state | 직전 커밋 (`git reset --hard HEAD`로 롤백 가능 — ⚠️ 사용자 승인 필요) |

## 다음 단계

CTO QA phase 진행:
```
/vais cto qa agent-rename-v2
```

QA 단계 검증 항목:
- 스모크 테스트: validate-plugin 재실행
- 회귀 검증: 기존 다른 피처(`.vais/`) 호환성
- gap 분석: 누락된 sub-agent 호출 경로
- 커밋 전 최종 점검

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-08 | 초기 작성 — P1~P9 실행 로그 + 검증 결과 (SC-01~SC-08 모두 통과) |
