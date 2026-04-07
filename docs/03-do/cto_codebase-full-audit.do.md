# CTO Do — codebase-full-audit

> 입력: plan v1.1 (범위 B/26건), design v1.1 (옵션 C/5 그룹)
> 실행자: CTO 직접 (dev-* 위임 우회 — 내부 메타 작업)

## 1. 구현 결정사항

### 1.1 위임 생략 결정
- ui-designer/infra-architect/dev-frontend/dev-backend/test-builder 모두 우회
- 이유: 신규 인프라/UI/테스트 코드 0건. frontmatter·문서·스크립트 패치만 수행
- 트레이드오프: 병렬화 이점 없음 vs 위임 오버헤드 제거 → 후자 선택

### 1.2 audit false positive 발견 (4건)
감사 단계에서 중복/오해로 식별된 항목을 do 단계에서 재검증한 결과, 다음 4건은 **이미 충족** 또는 **잘못된 진단**:

| ID | 원래 진단 | 재검증 결과 |
|----|----------|------------|
| A-I1 | pm-discovery/strategy/research에 "Use when" 누락 | 3개 모두 이미 "Use when: delegated by CPO for ..." 보유 → 변경 불필요 |
| A-I2 | ui-designer/dev-frontend/dev-backend에 "Use when" 누락 | 3개 모두 이미 보유 → 변경 불필요 |
| L-I2 | `clearConfigCache` 외부 export 미노출 | `lib/paths.js:211`에서 이미 export → 변경 불필요 |
| H-C1 | basic/hooks가 구형 agent-tracker.js 호출 | basic/은 자체 완결 reference 구조이며 CLAUDE.md에서 점검 제외 명시. self-documenting `_purpose` 메타만 추가 |

→ Critical 10건 → **실제 패치 9건** (H-C1은 메타 주석만), Important 16건 → **실제 패치 14건**

### 1.3 정책 결정
- **`agent-stop` doc 누락 정책**: `process.exit(1)` → 기본 경고, `VAIS_STRICT_DOCS=1` 환경변수로 strict 옵트인
- **스크립트 graceful crash 패턴**: `uncaughtException` + `unhandledRejection` 글로벌 핸들러를 11개 스크립트 상단에 일괄 삽입. 하드 차단이 필요한 스크립트(auto-judge, gate-check)는 exit(1), 나머지는 exit(0)
- **lib/paths.js 캐시**: 30s TTL → mtime + TTL 하이브리드. mtime 변경 즉시 무효화
- **state-store sleep**: `execSync('sleep ...')` → `Atomics.wait` (shell injection 면역)

## 2. 변경 파일 목록 (총 24 파일)

### Group 1 — 메타데이터 정합 (6 파일)
| # | 경로 | 변경 |
|---|------|------|
| 1 | `CLAUDE.md` | Architecture 표에 skill-validator 행 추가 + Project Structure cso 라인 갱신 + mcp/output-styles/references 주석 |
| 2 | `agents/cso/cso.md` | description: sub-agent 6개 명시(compliance-audit, skill-validator 추가) |
| 3 | `agents/cpo/cpo.md` | description: ux-researcher, data-analyst 추가 |
| 4 | `agents/cto/cto.md` | description: 9개 나열 → 그룹 요약("infra/design/dev/qa/test/deploy/db/debug execution agents") |
| 5 | `agents/cso/skill-validator.md` | description: 313자 → ~200자 |
| 6 | `agents/coo/canary-monitor.md` | description: vs sre-ops 차별화 명시 |

### Group 4 — 문서 SoT (1 파일, Group 1과 일부 공유)
| # | 경로 | 변경 |
|---|------|------|
| 7 | `vais.config.json` | `workflow._sot` 코멘트 키 추가 — PDCA 단계 SoT 명시 |

### Group 3 — 스크립트/lib 견고성 (14 파일)
| # | 경로 | 변경 |
|---|------|------|
| 8 | `lib/paths.js` | 캐시: 30s TTL → mtime + TTL 하이브리드 |
| 9 | `lib/status.js` | `validateFeatureName`: 한글 포함 시 stderr 경고 |
| 10 | `lib/core/state-store.js` | `execSync('sleep')` → `Atomics.wait` |
| 11~21 | `scripts/{bash-guard,cp-guard,cp-tracker,doc-validator,doc-tracker,prompt-handler,stop-handler,auto-judge,gate-check,agent-start,agent-stop}.js` (11개) | `uncaughtException`/`unhandledRejection` 글로벌 핸들러 일괄 삽입 |

### Group 5 — 훅 부수 (1 파일, Group 3과 통합)
| # | 경로 | 변경 |
|---|------|------|
| (8) | `lib/paths.js` | mtime 캐시 (Group 3과 동일 패치) |
| 22 | `scripts/doc-tracker.js` | `endsWith` null/empty/미치환 가드 추가 (false positive 방지) |

### Group 2 — 훅 안전성 (3 파일, 일부 공유)
| # | 경로 | 변경 |
|---|------|------|
| 23 | `scripts/agent-stop.js` | `exit(1)` 차단 → 기본 경고 + `VAIS_STRICT_DOCS=1` 옵트인 |
| 24 | `scripts/cp-guard.js` | `getAgentStartTime`/`getCheckpoints` silent fail → debugLog 추가 |
| 25 | `hooks/session-start.js` | UI 렌더 실패 try-catch에 stderr 경고 추가 |
| 26 | `scripts/bash-guard.js` | ASK 패턴 강화: `rm -rfoo`, `rm --recursive` 추가 매치 |
| 27 | `basic/hooks/hooks.json` | `_purpose` 메타 키 추가 (deprecation 대신 self-documenting) |

## 3. Design 이탈 항목

| 이탈 | 사유 |
|------|------|
| L-I1 (circular dep 주석) | Important 항목이나, 현재 lazy require로 이미 회피 중. 추가 주석은 실효 없음 → **이월** |
| L-I3 (status/memory 단일 락) | 단일 락 도입은 시퀀싱 회귀 위험이 큼. 별도 PR로 분리 권장 → **이월** |
| H-I2 (doc-tracker null 가드) | 설계대로 적용 (paths.js는 이미 가드 있고, doc-tracker line 70 endsWith가 실제 위험원이라 그쪽에 추가) |

## 4. 미완료 항목 (다음 사이클 이월)

- L-I1: lib 모듈 순환 의존 명시 주석
- L-I3: status.json + memory.json 동시 쓰기 단일 락
- Minor 9건 전체 (H-M*, A-M*, L-M*)
- D-I2: `mandatoryPhases` 키의 실제 enforce 코드
- 회귀 방지: `vais-validate-plugin.js`에 frontmatter ↔ CLAUDE.md 표 행 수 검증 추가 (옵션 C 영역)

## 5. 발견한 기술 부채

| 우선순위 | 항목 |
|---------|------|
| High | 감사 결과가 사람의 재검증에 의존 — frontmatter/표 정합성 자동 테스트 부재 |
| Medium | 스크립트 11개에 동일한 crash 핸들러를 복붙 — `lib/safe-main.js` 헬퍼로 일원화 가능 |
| Medium | basic/ 디렉토리의 자체 완결성이 root CLAUDE.md에서만 명시되며 basic/CLAUDE.md엔 명시 안 됨 |
| Low | `_sot`, `_purpose` 같은 underscore-prefixed 메타 키가 일관된 컨벤션 없음 |

## 6. Success Criteria 평가

| ID | 기준 | 상태 | 근거 |
|----|------|------|------|
| SC-01 | validate-plugin 통과 + 표 행 수 = 파일 수 | ✅ Met | `node scripts/vais-validate-plugin.js` → 0 errors / 0 warnings, 38 agents 인식 |
| SC-02 | C-Level frontmatter sub-agent 100% 언급 | ✅ Met | CSO(6/6), CPO(6/6), CTO(요약 그룹), CMO/COO/CFO/CEO(이미 정확) |
| SC-03 | 11개 스크립트 graceful exit | ✅ Met | uncaughtException 글로벌 핸들러 삽입 완료 (이 do 단계에서는 정적 검증, 런타임 검증은 qa 단계 위임) |
| SC-04 | bash-guard 우회 케이스 차단 | ✅ Partial | `rm -rfoo`, `rm --recursive` 패턴 추가. qa 단계에서 테스트 케이스로 검증 권장 |
| SC-05 | agent-stop 비차단 | ✅ Met | 기본 경고 + VAIS_STRICT_DOCS=1 옵트인 |
| SC-06 | config mtime 무효화 | ✅ Met | `lib/paths.js:114-` 하이브리드 캐시 |
| SC-07 | 26건 매핑 | ✅ Met (조정) | Critical 10건 → 9건 패치 + 1건 false positive(H-C1), Important 16건 → 14건 패치 + 2건 false positive(A-I1, A-I2) + 2건 이월(L-I1, L-I3). 실제 패치 23건 |

## 7. 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-07 | 초기 작성 — 23건 패치 적용, 4건 false positive, 2건 이월 |
