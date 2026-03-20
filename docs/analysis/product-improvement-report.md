# VAIS Claude Code - Product Improvement Report

> **작성일**: 2026-03-19
> **버전**: v0.14.0 기준 분석
> **관점**: Service Product Owner

---

## 1. Executive Summary

VAIS Code는 Claude Code 기반의 9단계 구조화된 개발 워크플로우 플러그인으로, 제로 디펜던시 아키텍처와 에이전트 팀 오케스트레이션을 통해 체계적인 웹 개발을 지원합니다. 전반적으로 잘 설계된 프로젝트이지만, **보안, 안정성, 사용자 경험, 테스트 커버리지** 측면에서 개선 기회가 존재합니다.

| 구분 | 심각도 | 건수 |
|------|--------|------|
| CRITICAL (즉시 수정) | 🔴 | 3 |
| HIGH (조기 수정) | 🟠 | 8 |
| MEDIUM (개선 권장) | 🟡 | 12 |
| LOW (향후 검토) | 🟢 | 6 |

---

## 2. CRITICAL Issues (즉시 수정 필요)

### 2.1 🔴 bash-guard 테스트와 실제 코드 패턴 불일치

**파일**: `scripts/bash-guard.js` vs `tests/bash-guard.test.js`

- **문제**: 테스트 파일의 정규식 패턴과 실제 스크립트의 패턴이 다름
  - 테스트: `/rm\s+(-[a-z]*r[a-z]*f...)\s+\/(?!\S)/`
  - 스크립트: `/(?:sudo\s+)?rm\s+(?:...)\s+[\/~.]/`
- **영향**: 테스트가 통과하지만 실제 보안 필터링은 다르게 동작 → 보안 취약점
- **권장**: 테스트 패턴을 실제 스크립트에서 import하거나, 단일 소스로 통합

### 2.2 🔴 Feature Name Path Traversal 취약점

**파일**: `lib/status.js` (saveFeatureRegistry 함수)

- **문제**: 피처명에 `../evil` 같은 경로 탐색 문자가 허용됨
- **영향**: `.vais/features/` 디렉토리 외부에 파일 생성 가능
- **권장**: 피처명을 `[a-zA-Z0-9가-힣_-]` 패턴으로 제한하는 검증 함수 추가

### 2.3 🔴 Memory/Status 파일 동시 접근 Race Condition

**파일**: `lib/memory.js`, `lib/status.js`

- **문제**: 파일 잠금 없이 read → modify → write 수행
- **시나리오**: 두 Claude 세션이 동시에 memory.json 수정 시 데이터 손실
- **권장**: 원자적 파일 쓰기 (임시 파일 → rename) 또는 파일 잠금 메커니즘 도입

---

## 3. HIGH Priority Issues

### 3.1 🟠 Memory Entry 무한 증가

**파일**: `lib/memory.js`

- **문제**: `vais.config.json`에 `maxEntries: 500` 설정이 있지만, 코드에서 이 제한을 실행하지 않음
- **영향**: memory.json이 무한 증가 → 대규모 프로젝트에서 성능 저하
- **권장**: `addEntry()` 시 maxEntries 초과 시 오래된 엔트리 자동 삭제 (circular buffer)

### 3.2 🟠 Gap Analysis 무한 루프 위험

**파일**: `skills/vais/phases/check.md`

- **문제**: `autoIterate: true` 시 90% 임계값에 도달하지 못하면 무한 반복 가능
- **영향**: 사용자가 수동 종료해야 하며, 리소스 낭비
- **권장**: maxIterations(5) 도달 시 강제 중단 + 사용자에게 수동 개입 안내

### 3.3 🟠 Config Cache 무효화 없음

**파일**: `lib/paths.js` (line 70)

- **문제**: `_configCache`가 글로벌로 캐시되고 절대 갱신되지 않음
- **영향**: 세션 중 vais.config.json 수정 시 반영 안 됨
- **권장**: TTL 기반 캐시 무효화 (예: 30초) 또는 파일 mtime 체크

### 3.4 🟠 설치 후 검증 절차 부재

**파일**: `README.md`

- **문제**: 사용자가 설치 후 정상 작동 여부를 확인할 방법이 없음
- **영향**: 설치 실패 시 첫 사용에서 원인 불명의 오류 발생
- **권장**: "설치 확인" 섹션 추가 (`/vais help` 실행으로 동작 확인)

### 3.5 🟠 에러 메시지 부재 영역

- Feature name 유효성 검증 실패 시 메시지 없음
- MCP 디자인 시스템 검색 실패 시 사용자 안내 없음
- status.json 손상 시 복구 경로 없음
- Phase 문서 미존재 시 다음 단계 안내 없음

### 3.6 🟠 Webhook 실패 시 복구 없음

**파일**: `lib/webhook.js`

- **문제**: fire-and-forget 방식으로 실패 시 재시도나 DLQ 없음
- **영향**: 중요한 워크플로우 이벤트 알림 손실
- **권장**: 최소 1회 재시도 + 실패 이벤트 로컬 로그 저장

### 3.7 🟠 동기식 파일 I/O로 인한 성능 병목

**파일**: `lib/` 전체

- **문제**: 모든 파일 작업이 `readFileSync`, `writeFileSync` 사용
- **영향**: memory.json이 10MB 이상 성장 시 이벤트 루프 블로킹
- **권장**: Hook 스크립트에서 async 파일 I/O로 전환

### 3.8 🟠 사용 가이드의 체계적 부재

- 첫 번째 피처 개발 워크스루 없음
- 팀 워크플로우 가이드 없음
- 트러블슈팅 가이드 없음
- 완성된 예시 문서 없음

---

## 4. MEDIUM Priority Issues

### 4.1 🟡 테스트 커버리지 부족

| 모듈 | 테스트 상태 | 비고 |
|------|-----------|------|
| `lib/status.js` | ✅ 테스트 있음 | |
| `lib/memory.js` | ✅ 테스트 있음 | |
| `lib/paths.js` | ✅ 테스트 있음 | |
| `lib/webhook.js` | ✅ 테스트 있음 | 에러 시나리오 부족 |
| `scripts/bash-guard.js` | ✅ 테스트 있음 | 패턴 불일치 문제 |
| `scripts/generate-dashboard.js` | ❌ 테스트 없음 | HTML 생성 로직 복잡 |
| `scripts/prompt-handler.js` | ❌ 테스트 없음 | 체이닝 파싱 로직 핵심 |
| `scripts/stop-handler.js` | ❌ 테스트 없음 | |
| `scripts/doc-tracker.js` | ❌ 테스트 없음 | 경로 매칭 에지 케이스 |
| E2E 워크플로우 | ❌ 없음 | Phase 전환 통합 테스트 |

### 4.2 🟡 Template 버전 불일치

| 템플릿 | 버전 |
|--------|------|
| research.template.md | v0.8.1 |
| plan.template.md | v0.8.1 |
| design.template.md | v0.11.0 |
| check.template.md | v0.8.1 |
| review.template.md | 미표기 |

→ 모든 템플릿을 동일 버전으로 통일 필요

### 4.3 🟡 README 구조 개선

- 체이닝 문법(`:`, `+`)이 Phase 개별 설명보다 먼저 나옴 → 개념 이해 전에 고급 문법 노출
- 솔로 개발자 vs 팀 개발자 경로 구분 없음
- 국제 사용자를 위한 영문 README 부재

### 4.4 🟡 Output Style 개선

- 병렬 실행(fe+be) 결과 포맷 미정의
- 에러 상태 출력 포맷 없음
- `AskUserQuestion` 포맷 가이드 없음

### 4.5 🟡 Plugin Manifest 보완

**파일**: `.claude-plugin/plugin.json`

- `homepage`, `documentation`, `bugs` 필드 없음
- Claude Code 최소 버전 요구사항 미선언 (README에는 v2.1.32+ 명시)
- Agent 목록이 manifest에 명시적으로 선언되지 않음

### 4.6 🟡 MCP 서버 견고성

- Python 미설치 시 에러 핸들링 없음
- 검색 쿼리 길이/형식 제한 없음
- `max_results` 상한선 없음 (1000 입력 시 성능 이슈)
- `CLAUDE_PLUGIN_ROOT` 미정의 시 핸들링 없음

### 4.7 🟡 사용하지 않는 설정 필드

- `vais.config.json`의 `skipGatesInRange: false` — 코드에서 참조하지 않음
- `featureNameSuggestions` — 제안만 하고 강제하지 않음

### 4.8 🟡 Memory ID 충돌 가능성

**파일**: `lib/memory.js`

- 수동 편집된 memory.json에서 ID 패턴이 깨지면 `m-001`부터 재시작 → ID 중복
- UUID 또는 timestamp 기반 ID로 전환 권장

### 4.9 🟡 docs/ 디렉토리 활용 부족

- 현재 PowerPoint 생성기와 v0.11.0 PPTX 파일만 존재 (현재 v0.14.0)
- 예시 프로젝트, 가이드, 트러블슈팅 문서 없음

### 4.10 🟡 Hook Timeout 여유 부족

- `doc-tracker.js`의 3000ms 타임아웃이 느린 시스템에서 부족할 수 있음
- 설정 가능하게 하거나 5000ms로 증가 권장

### 4.11 🟡 Vendor 디렉토리 문서 부재

- UI/UX Pro Max 디자인 시스템의 출처, 라이선스, 크기, 사용법 설명 없음
- `vendor/README.md` 추가 필요

### 4.12 🟡 debug.js 에러 무시

- 로그 파일 쓰기 실패 시 완전히 무시됨
- 최소한 `process.stderr`에 경고 출력 권장

---

## 5. LOW Priority Issues

### 5.1 🟢 webhook.js의 프로토콜 감지

- `webhookUrl.startsWith('https')` 대신 `new URL()` 사용 권장

### 5.2 🟢 get-context.js의 모듈 로딩

- `path.join()` 대신 `require.resolve()` 사용 권장

### 5.3 🟢 generate-dashboard.js의 HTML 이스케이프

- `escapeHtml()`이 `&<>`만 처리 → 따옴표 이스케이프 추가 권장

### 5.4 🟢 io.js의 stdin 에러 구분

- `readStdin()` catch 블록에서 "입력 없음" vs "잘못된 JSON" 구분 없음

### 5.5 🟢 CHANGELOG에서 Breaking Change 표시 강화

- Phase 이름 변경(frontend→fe) 등 하위 호환성 깨는 변경에 명시적 마이그레이션 가이드 필요

### 5.6 🟢 Output Style 버전 하드코딩

- `vais-default.md`에 예시 버전이 `v0.10.0`으로 하드코딩 → 동적 변수로 표시 권장

---

## 6. 개선 로드맵 제안

### Phase 1: 안정성 확보 (1-2일)

| # | 작업 | 관련 이슈 |
|---|------|-----------|
| 1 | bash-guard 테스트/코드 패턴 통합 | 2.1 |
| 2 | Feature name 검증 함수 추가 | 2.2 |
| 3 | 원자적 파일 쓰기 도입 (write → rename) | 2.3 |
| 4 | maxEntries 제한 실행 코드 추가 | 3.1 |
| 5 | Gap Analysis 하드 리밋 추가 | 3.2 |

### Phase 2: 사용자 경험 개선 (3-5일)

| # | 작업 | 관련 이슈 |
|---|------|-----------|
| 6 | README에 "설치 확인" + "첫 번째 피처" 섹션 추가 | 3.4, 3.8 |
| 7 | 에러 메시지 체계 구축 | 3.5 |
| 8 | docs/examples/ 디렉토리 생성 및 예시 문서 작성 | 4.9 |
| 9 | 트러블슈팅 가이드 작성 | 3.8 |
| 10 | Template 버전 통일 (v0.14.0) | 4.2 |

### Phase 3: 품질 강화 (1주)

| # | 작업 | 관련 이슈 |
|---|------|-----------|
| 11 | prompt-handler, generate-dashboard 테스트 추가 | 4.1 |
| 12 | E2E 워크플로우 테스트 구축 | 4.1 |
| 13 | Plugin manifest 보완 | 4.5 |
| 14 | MCP 서버 견고성 개선 | 4.6 |
| 15 | Config cache TTL 적용 | 3.3 |

### Phase 4: 확장성 (향후)

| # | 작업 | 관련 이슈 |
|---|------|-----------|
| 16 | Async 파일 I/O 전환 | 3.7 |
| 17 | Webhook 재시도 + 실패 로그 | 3.6 |
| 18 | 영문 README 추가 | 4.3 |
| 19 | 팀 워크플로우 가이드 | 3.8 |
| 20 | Memory ID를 UUID 기반으로 전환 | 4.8 |

---

## 7. 강점 (유지 및 발전)

분석 과정에서 확인된 프로젝트의 핵심 강점:

1. **제로 디펜던시 아키텍처** — Node.js 내장 모듈만 사용하여 이식성과 보안 극대화
2. **구조화된 9단계 워크플로우** — 체계적 개발 프로세스 강제로 품질 향상
3. **Config-Driven 설계** — `vais.config.json` 하나로 전체 워크플로우 제어
4. **Manager Memory 시스템** — 의사결정 타임라인 추적으로 프로젝트 히스토리 보존
5. **Agent Team 계층 구조** — Manager → Tech-Lead → Specialists 명확한 역할 분담
6. **보안 우선 설계** — bash-guard 훅으로 위험 명령어 차단
7. **Lazy-loaded MCP** — 필요한 Phase에서만 디자인 시스템 로딩
8. **체이닝 문법** — `:` (순차) + `+` (병렬) 조합으로 유연한 실행

---

*이 보고서는 코드베이스의 모든 주요 파일을 분석하여 작성되었습니다.*
*lib/ (6개), scripts/ (6개), agents/ (6개), phases/ (17개), templates/ (8개), config 파일, 테스트 파일 포함.*
