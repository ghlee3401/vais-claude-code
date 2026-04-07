# CTO Design — codebase-full-audit

> 입력: `docs/01-plan/cto_codebase-full-audit.plan.md` (CP-1: 범위 B 확정, 26건)
> 모드: 정적 패치 설계 (ui-designer/infra-architect 위임 우회 — 신규 인프라 없음)

## 1. 설계 원칙

1. **최소 침습**: 기존 키 구조·파일 경로·frontmatter 스키마 변경 금지 (CLAUDE.md "Do NOT" 준수)
2. **단일 PR 가능 단위**: 26건을 5개 패치 그룹으로 묶어 do 단계에서 그룹 단위 검증
3. **회귀 위험 격리**: 훅 동작 변경(exit code, 정규식) 패치는 별도 그룹으로 분리하여 단독 롤백 가능
4. **문서 SoT 회복**: CLAUDE.md를 진실 소스로, 코드/frontmatter가 따라가도록 단방향 정합

## 2. 패치 그룹 (5 그룹 / 26건)

### Group 1 — 메타데이터 정합 (A-C1~C4, A-I1~I4 = 8건)

**대상**: 에이전트 frontmatter description + CLAUDE.md Architecture 표

| ID | 파일 | 변경 |
|----|------|------|
| A-C1 | `CLAUDE.md` (Agent Architecture 표) | `skill-validator` 행 추가 (CSO, "Skill markdown frontmatter validation") |
| A-C2 | `agents/cso/cso.md` frontmatter description | sub-agent 목록에 `compliance-audit`, `skill-validator` 추가 |
| A-C3 | `agents/cpo/cpo.md` frontmatter description | sub-agent 목록에 `ux-researcher` 추가 |
| A-C4 | `agents/cto/cto.md` frontmatter description | 9개 나열 → "core dev/qa/test/deploy/db/debug agents" 식으로 그룹 요약, "Use when" 강화. 351자 → ~250자 목표 |
| A-I1 | `agents/cpo/pm-discovery.md`, `pm-strategy.md`, `pm-research.md` | description에 "Use when: ..." 절 추가 |
| A-I2 | `agents/cto/ui-designer.md`, `dev-frontend.md`, `dev-backend.md` | description에 "Use when: ..." 절 추가 |
| A-I3 | `agents/cso/skill-validator.md` | description 313자 → ~200자 (validate-plugin 비교 1줄로 압축) |
| A-I4 | `agents/coo/canary-monitor.md` | description에 "vs sre-ops: 단기 배포 후 vs 상시" 명시 |

**검증**: do 후 `vais-validate-plugin.js` 실행 → frontmatter parse pass + CLAUDE.md 표 라인 카운트 = `ls agents/*/*.md | wc -l`

### Group 2 — 훅 안전성 (H-C1~C3, H-I3~I4 = 5건)

**대상**: 훅 exit code 정책, 정규식, basic/ 동기화

| ID | 파일 | 변경 |
|----|------|------|
| H-C1 | `basic/hooks/hooks.json` | (옵션 a) 메인 hooks.json과 동기화 / **(옵션 b 권장)** 파일 상단에 `"_deprecated": "v0.47.0+: see /hooks for canonical"` 메타 추가 + README 한 줄 추가 |
| H-C2 | `scripts/agent-stop.js:48` | `process.exit(1)` → `console.error('[agent-stop] doc validation failed: ' + reason); process.exit(0)` (경고로 강등). `vais.config.json > gates.cto.{phase}.requireDocs` 로 strict 옵트인 경로 보존 |
| H-C3 | `scripts/cp-guard.js:81-82` | `catch(_) {return []}` → `catch(e) { debugLog('cp-guard: event-log query failed: ' + e.message); return [] }` |
| H-I3 | `hooks/session-start.js:34-45` | 렌더링 try-catch에 `console.error('[session-start] UI render failed: ' + e.message)` 추가 |
| H-I4 | `scripts/bash-guard.js:22` | 정규식 `/^rm\s+-[a-zA-Z]*r[a-zA-Z]*f|^rm\s+-[a-zA-Z]*f[a-zA-Z]*r|^rm\s+--recursive/` 로 강화. `rm -rfoo`, `rm --recursive` 모두 매치. 화이트리스트 테스트 케이스 6개 추가 |

**롤백 단위**: H-C2는 단독 롤백 가능 (다른 그룹과 무관). H-I4는 false positive 검증 후 단계적 적용.

### Group 3 — 스크립트 견고성 (L-C1~C3, L-I1~I4 = 7건)

**대상**: try-catch, exit code, 의존성, 경합

| ID | 대상 | 변경 |
|----|------|------|
| L-C1 | `scripts/{bash-guard,cp-guard,cp-tracker,doc-validator,agent-start,agent-stop,doc-tracker,phase-transition,...}.js` (총 11개) | 최상위 `try { main() } catch(e) { console.error('[' + path.basename(__filename) + '] ' + e.message); process.exit(0) }` 래퍼 도입 (graceful degrade) |
| L-C2 | 동일 11개 | exit code 정책: **훅 차단 의도가 있는 경우만 exit(1)**, 그 외 stderr + exit(0). 정책 표를 `scripts/README.md` 또는 헤더 주석에 명시 |
| L-C3 | `lib/state-store.js` | `execSync('sleep ...')` → `await new Promise(r => setTimeout(r, ms))`. 동기 컨텍스트 필요 시 `Atomics.wait` 또는 busy-wait 회피 패턴 |
| L-I1 | `lib/memory.js`, `lib/status.js` | 순환 의존 가능 경로 주석 표시 + lazy require 패턴 일관 적용 |
| L-I2 | `lib/paths.js` | `clearConfigCache()` 함수 export 추가 (테스트/개발자용) |
| L-I3 | `lib/status.js` + `lib/memory.js` | 동시 쓰기 시 단일 락(`state-store.lock('vais-state')`)으로 직렬화 |
| L-I4 | `lib/paths.js` `VALID_FEATURE_NAME` | regex 유지하되 템플릿 치환 함수에서 한글 시 경고 로그 (회귀 방지) |

**검증**: 각 스크립트를 `node scripts/X.js < /dev/null` 으로 단독 실행 → exit 0 + stderr 메시지 출력 확인

### Group 4 — 문서 SoT 정렬 (D-I1~I4 = 4건)

| ID | 파일 | 변경 |
|----|------|------|
| D-I1 | `CLAUDE.md` Project Structure | `mcp/`, `output-styles/` 옆에 "(현재 비활성, v0.48 활용 예정)" 주석 |
| D-I2 | `CLAUDE.md` Mandatory Rules #2 | "mandatory phase 스킵 금지" 정책이 코드로 enforce되지 않음을 인식, 본 그룹에서는 **문서 일관성만 유지** (실제 enforce는 향후 릴리즈) |
| D-I3 | `CLAUDE.md` references 섹션 | `references/_inbox/만 유지` 정책을 강조, MEMORY 한 줄과 cross-link |
| D-I4 | `vais.config.json` workflow.phases | 코멘트로 "PDCA 단계 SoT는 본 키. CLAUDE.md/cto.md는 표시용 사본" 명시 |

**비고**: 본 그룹은 문서 변경만, 코드 변경 0건 → 회귀 위험 없음

### Group 5 — 훅 부수 (H-I1~I2, H-M2 추가 안 함, A-I 잔여 없음 = 2건)

| ID | 파일 | 변경 |
|----|------|------|
| H-I1 | `lib/paths.js` | config 캐시 TTL 30s → **mtime 기반 무효화** (loadConfig가 stat 비교) |
| H-I2 | `scripts/doc-tracker.js` | `resolveDocPath` 결과 null/빈 문자열 가드 추가 |

## 3. 변경 영향 매트릭스

| 그룹 | 파일 수 | 코드 변경 lines | 회귀 위험 | 의존 그룹 |
|------|---------|----------------|----------|-----------|
| 1. 메타데이터 정합 | ~10 | ~150 (모두 frontmatter/표) | 매우 낮음 | — |
| 2. 훅 안전성 | 5 | ~80 | 중 (exit code 정책 변경) | — |
| 3. 스크립트 견고성 | 13 | ~300 | 중 (락/캐시 변경) | — |
| 4. 문서 SoT 정렬 | 2 | ~30 (문서) | 없음 | 1 (cross-link) |
| 5. 훅 부수 | 2 | ~40 | 낮음 | 3 (lib/paths) |
| **합계** | **~32 파일** | **~600 lines** | — | — |

## 4. 실행 순서 (do 단계)

```
1. Group 1 (메타데이터)  ─┐
2. Group 4 (문서 정렬)   ─┴→ qa-validator (정합성 체크)
3. Group 3 (스크립트)    ─┐
4. Group 5 (훅 부수)     ─┴→ qa-validator (단독 실행 + 락 동작)
5. Group 2 (훅 안전성)   ───→ qa-validator (exit code/정규식)
```

병렬 가능: 1+4 동시, 3+5 동시. 2는 마지막 (가장 위험).

## 5. Success Criteria (do/qa에서 평가)

- **SC-01**: `vais-validate-plugin.js` 통과 + CLAUDE.md 표 행 수 = `ls agents/*/*.md | wc -l`
- **SC-02**: 모든 C-Level frontmatter description이 해당 폴더의 sub-agent 파일을 100% 언급
- **SC-03**: 11개 스크립트가 빈 stdin/잘못된 JSON/누락 파일에서 exit(0) + stderr 메시지
- **SC-04**: `bash-guard.js`가 6개 신규 우회 케이스(`rm -rfoo`, `rm --recursive /` 등) 차단
- **SC-05**: `agent-stop.js`가 문서 누락 시 더 이상 차단하지 않음 (경고만)
- **SC-06**: `vais.config.json` mtime 변경 후 다음 `loadConfig()` 호출이 갱신값 반환
- **SC-07**: Plan 문서의 Critical 10건 + Important 16건 = 26건이 do 산출물에 모두 매핑됨

## 6. 비범위 (do 단계에서 건들지 않음)

- Minor 9건 (H-M*, A-M*, L-M*)
- 신규 테스트 코드 (test-builder 위임 안 함 — 패치 검증은 qa-validator의 manual 실행으로 충분)
- 회귀 방지 자동화(validate-plugin 확장) — 옵션 C에 속함
- vendor/, basic/ 디렉토리 코드 수정 (basic은 메타 주석만)

## 7. 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-07 | 초기 작성 — 26건을 5개 패치 그룹으로 분류, 실행 순서 + SC 정의 |
| v1.1 | 2026-04-07 | CP-D 결정 반영 — 옵션 C(실용적 균형) 확정 |
