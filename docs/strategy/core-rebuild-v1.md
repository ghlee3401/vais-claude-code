# VAIS Code 코어 재건축 전략서

> 대상: vais-claude-code v0.30.0 → v0.31.0
> 작성일: 2026-04-02
> 상태: 1단계 완료

---

## 0. 배경

### 왜 재건축인가

v0.30.0은 C-Suite 에이전트 20개, 훅 7개, 스킬 14개를 갖춘 구조이지만,
실무 투입 시 다음 문제가 반복 발생:

1. **실제 써보면 막히는 부분이 많음** — 에러가 조용히 무시되어 원인 파악 어려움
2. **새 팀원에게 설명이 어려움** — 진입점과 동작 경로가 불명확
3. **C-레벨 처리 방식 상이** — 동일한 "PDCA"가 에이전트마다 다른 의미
4. **Hook 동작 신뢰 불안** — 실행 여부 확인 불가, 이중 정의 존재

### 전략 선택

| 선택지 | 설명 | 결정 |
|--------|------|------|
| A. CTO 중심 단순화 | C-Suite 제거, CTO만 남김 | ✗ |
| B. 계약 표준화 | C-Suite 유지 + 입출력 표준화 | ✗ (2단계) |
| **C. 코어 재건축** | 기반부터 다시 다지고 위에 에이전트 재구성 | **채택** |

---

## 1. 현재 문제 상세 분석

### 1.1 Hook 이중 정의 문제

```
hooks.json:
  SubagentStop → node scripts/agent-stop.mjs   (ESM, .mjs)
  
각 agent frontmatter:
  hooks.Stop → node scripts/agent-stop.js       (CJS, .js)
```

- 파일 확장자 불일치: `.mjs` vs `.js`
- **검증 결과: `agent-stop.js`가 존재하지 않아 15개 에이전트의 Stop hook이 모두 실패 중이었음**
- SubagentStop (전역)과 agent frontmatter Stop (개별)이 중복 정의

### 1.2 모듈 시스템 혼재

| 파일 | 모듈 시스템 | 비고 |
|------|-----------|------|
| `lib/*.js` | CJS (require) | 핵심 라이브러리 |
| `scripts/bash-guard.js` | CJS | lib/ 의존 |
| `scripts/doc-tracker.js` | CJS | lib/ 의존 |
| `scripts/prompt-handler.js` | CJS | lib/ 의존 |
| `scripts/stop-handler.js` | CJS | lib/ 의존 |
| `scripts/agent-start.mjs` | ESM (import) | lib/observability/ 의존 |
| `scripts/agent-stop.mjs` | ESM (import) | lib/observability/ 의존 |
| `scripts/phase-transition.mjs` | ESM | lib/observability/ 의존 |
| `lib/observability/*.mjs` | ESM | 독립 모듈 |

**문제:** CJS와 ESM이 혼재하여, CJS 스크립트에서 ESM 모듈을 import할 수 없음.

### 1.3 상태 관리 Silent Fail

- `getStatus()`, `getMemory()`, `loadConfig()` 모두 에러 시 조용히 빈 객체 반환
- `VAIS_DEBUG=1` 안 켜면 로그조차 안 보임
- 파일이 깨져도 원인 파악 불가

### 1.4 에이전트 PDCA 산출물 불일치

| C-Level | Plan 산출물 | Do 산출물 | Report 산출물 |
|---------|-----------|----------|--------------|
| CTO | `01-plan/{f}.plan.md` | 코드 + `03-do/{f}.do.md` | `05-report/{f}.report.md` |
| CEO | (메모리 기록) | C레벨 위임 결과 | `.vais/memory.json` |
| CPO | (없음) | `00-pm/{f}.prd.md` | PRD 최종화 |
| CSO/CMO | (없음) | 스캔/감사 결과 | report.md의 섹션 |
| CFO/COO | stub | stub | stub |

→ 2단계에서 계약(Contract) 표준화로 해결 예정

### 1.5 prompt-handler 노이즈

- 175줄의 키워드 매칭으로 모든 사용자 입력에 트리거
- "api", "plan" 같은 일반 단어에 false positive 발생
- 모든 URL에 SEO 감사 제안 → 불필요한 노이즈

---

## 2. 1단계 재건축 계획

### 2.1 목표

> **Hook과 상태 관리의 신뢰성을 확보하여, "실행하면 예측 가능하게 동작한다"는 신뢰를 만든다.**

### 2.2 작업 항목

| # | 작업 | 결과 |
|---|------|------|
| R1 | 모듈 시스템 통일 | **완료** — ESM → CJS 변환, .mjs 8개 삭제 |
| R2 | Hook 이중 정의 해소 | **완료** — agent frontmatter hooks 15개 제거, hooks.json 단일 정의 |
| R3 | 상태 관리 에러 가시화 | **완료** — 파일 없음 vs 파싱 실패 구분, stderr 경고 출력 |
| R4 | Hook 실행 로그 가시화 | **완료** — lib/hook-logger.js 신설, 모든 hook에 logHook() 추가 |
| R5 | prompt-handler 검증 | **완료** — 노이즈 문제 확인, UserPromptSubmit 훅 제거 (7→6개) |
| R6 | 문서-상태 동기화 검증 | 보류 — 2단계로 이동 |

---

## 3. 작업 로그

### R1: 모듈 시스템 통일 ✅

**분석:**
- `package.json`에 "type" 필드 없음 → 기본 CJS
- `agent-stop.js`(CJS) 파일이 존재하지 않음 → 15개 에이전트 frontmatter Stop hook 전부 실패 중
- `lib/observability/`의 4개 모듈 + `index.mjs`가 ESM

**실행:**
- `lib/observability/` 5개 파일: `.mjs` → `.js` (CJS) 변환
  - `schema.js`, `rotation.js`, `state-writer.js`, `event-logger.js`, `index.js`
- `scripts/` 3개 파일: `.mjs` → `.js` (CJS) 변환
  - `agent-start.js`, `agent-stop.js`, `phase-transition.js`
- `hooks.json` 참조 업데이트: `.mjs` → `.js`
- `CLAUDE.md` 라이브러리 설명 업데이트: `lib/*.mjs (ESM)` → `lib/*.js (CJS)`
- 기존 `.mjs` 파일 8개 삭제

**검증:**
- `node -e "require('./lib/observability/index')"` → 모든 모듈 정상 로드
- `node scripts/agent-start.js test plan "test"` → 정상 동작
- `node scripts/agent-stop.js test success` → 정상 동작
- 기존 테스트 109/110 통과 (1개는 pre-existing 실패: `setRunRange` 테스트의 옛 phase명 'be'/'fe')

---

### R2: Hook 이중 정의 해소 ✅

**분석:**
- `hooks.json` SubagentStop: `agent-stop.js ${AGENT_NAME} ${OUTCOME}` — 동적 변수
- agent frontmatter Stop: `agent-stop.js {role} success` — 하드코딩 + 항상 "success"
- 둘 다 실행되면 2중 호출, outcome이 항상 "success"로 덮어써짐

**결정: hooks.json 전역 정의 유지, agent frontmatter hooks 제거**
- 이유: 전역이 `${OUTCOME}` 환경변수 사용으로 더 정확
- agent frontmatter는 "success" 하드코딩이라 실패 시에도 "success" 기록

**실행:**
- 15개 에이전트 파일에서 `hooks:` 블록 (5줄) 일괄 제거
- 대상: cto, ceo, cpo, cfo, cmo, cso, coo, architect, backend, frontend, design, qa, security, seo, validate-plugin
- pm-*, absorb-analyzer는 원래 hooks 없었음 → 변경 없음

**검증:**
- `grep "^hooks:" agents/*.md` → 0건 (모두 제거됨)

---

### R3: 상태 관리 에러 가시화 ✅

**분석:**
- `lib/status.js:getStatus()` — 모든 에러를 `createEmptyStatus()`로 삼킴
- `lib/memory.js:getMemory()` — 동일 패턴
- `lib/paths.js:loadConfig()` — 동일 패턴
- 공통 문제: "파일 없음"(정상)과 "파일 깨짐"(문제)을 구분하지 않음

**실행:**
- 3개 함수 모두 `fs.existsSync()` 사전 체크 추가
  - 파일 없음 → 조용히 기본값 반환 (첫 실행 시 정상)
  - 파일 있지만 파싱 실패 → `process.stderr.write()`로 경고 출력 + 복구 안내
- 에러 메시지 형식 통일: `[VAIS] ⚠️  {파일명} 파싱 실패: {원인}`

**검증:**
- 기존 테스트 47/48 통과 (1개 pre-existing 실패)

---

### R4: Hook 실행 로그 가시화 ✅

**분석:**
- 7개 hook 중 어떤 것이 실행되었는지 확인할 방법이 없었음
- 특히 SubagentStart/Stop은 R1 이전까지 `.js` 파일 미존재로 실행 실패 중이었을 가능성

**실행:**
- `lib/hook-logger.js` 신설
  - `.vais/hook-log.jsonl`에 append-only 기록
  - 라인 수 제한 500줄 (초과 시 앞 250줄 삭제)
  - 실패 시 graceful degradation (hook 실행 방해 금지)
- 7개 hook 스크립트 모두에 `logHook()` 호출 추가:
  - `bash-guard.js` — blocked/warn/ok 상태 기록
  - `doc-tracker.js` — 문서 추적 결과 기록
  - `stop-handler.js` — 상태 요약 기록
  - `prompt-handler.js` — 의도 감지 결과 기록
  - `agent-start.js` — 에이전트 시작 기록
  - `agent-stop.js` — 에이전트 종료 기록
  - `session-start.js` — 세션 시작 기록

**검증:**
```
$ rm -f .vais/hook-log.jsonl
$ node scripts/agent-start.js test plan "verify"
$ node scripts/agent-stop.js test success
$ cat .vais/hook-log.jsonl
{"ts":"...","hook":"SubagentStart","status":"ok","role":"test","phase":"plan"}
{"ts":"...","hook":"SubagentStop","status":"ok","role":"test","outcome":"success"}
```

---

### R5: prompt-handler 검증 → 제거 ✅

**분석:**
- 175줄의 UserPromptSubmit hook
- 기능 3가지: URL 감지, 키워드 의도 감지 (8패턴), 체이닝/범위 패턴 감지
- 문제: "api", "plan", "react" 등 일반 단어에 false positive, 모든 URL에 SEO 제안

**결정: 제거**
- 이유: 노이즈 > 가치. SKILL.md의 trigger 키워드와 Claude 자체 의도 해석으로 충분
- `hooks.json`에서 `UserPromptSubmit` 훅 삭제
- `scripts/prompt-handler.js`, `tests/prompt-handler.test.js`는 히스토리 보존으로 파일 유지

**결과: 훅 7개 → 6개**

| # | Hook | 스크립트 | 용도 |
|---|------|---------|------|
| 1 | SessionStart | `session-start.js` | 세션 초기화 + 상태 렌더링 |
| 2 | PreToolUse:Bash | `bash-guard.js` | 위험 명령 차단 |
| 3 | PostToolUse:Write\|Edit | `doc-tracker.js` | 문서 → 상태 자동 업데이트 |
| 4 | Stop | `stop-handler.js` | 진행률 요약 + 다음 단계 안내 |
| 5 | SubagentStart | `agent-start.js` | 에이전트 시작 관측 |
| 6 | SubagentStop | `agent-stop.js` | 에이전트 종료 관측 |

---

### R6: 문서-상태 동기화 검증 → 2단계 이동

status.json과 실제 문서 존재 여부를 비교하여 불일치를 감지하는 기능.
2단계에서 세션 시작 시 자동 검증으로 구현 예정.

---

## 4. 1단계 결과 요약

### 변경 파일 목록

**신규:**
- `lib/hook-logger.js` — Hook 실행 로그 유틸리티
- `lib/observability/schema.js` — CJS 버전 (`.mjs` 대체)
- `lib/observability/rotation.js` — CJS 버전
- `lib/observability/state-writer.js` — CJS 버전
- `lib/observability/event-logger.js` — CJS 버전
- `lib/observability/index.js` — CJS 버전
- `scripts/agent-start.js` — CJS 버전
- `scripts/agent-stop.js` — CJS 버전 (15개 에이전트가 참조하던 파일 실제 생성)
- `scripts/phase-transition.js` — CJS 버전

**삭제:**
- `lib/observability/schema.mjs` — ESM 제거
- `lib/observability/rotation.mjs` — ESM 제거
- `lib/observability/state-writer.mjs` — ESM 제거
- `lib/observability/event-logger.mjs` — ESM 제거
- `lib/observability/index.mjs` — ESM 제거
- `scripts/agent-start.mjs` — ESM 제거
- `scripts/agent-stop.mjs` — ESM 제거
- `scripts/phase-transition.mjs` — ESM 제거

**수정:**
- `hooks/hooks.json` — `.mjs` → `.js` 참조 수정, UserPromptSubmit 제거
- `lib/status.js` — `getStatus()` 에러 가시화
- `lib/memory.js` — `getMemory()` 에러 가시화
- `lib/paths.js` — `loadConfig()` 에러 가시화
- `scripts/bash-guard.js` — hook 로깅 추가
- `scripts/doc-tracker.js` — hook 로깅 추가
- `scripts/stop-handler.js` — hook 로깅 추가
- `scripts/prompt-handler.js` — hook 로깅 추가 (파일 유지, 훅에서는 제거)
- `hooks/session-start.js` — hook 로깅 추가
- `CLAUDE.md` — 라이브러리 설명 수정
- 15개 에이전트 파일 — frontmatter hooks 블록 제거

### 정량 변화

| 항목 | Before | After |
|------|--------|-------|
| Hook 수 | 7 | 6 (-1) |
| ESM 파일 | 8 | 0 (-8) |
| 모듈 시스템 | CJS + ESM 혼재 | CJS 단일 |
| agent-stop.js 존재 | ✗ (15개 에이전트 hook 실패) | ✅ |
| Silent fail 함수 | 3개 | 0개 |
| Hook 로그 | 없음 | `.vais/hook-log.jsonl` |
| Agent frontmatter hooks | 15개 중복 | 0 (전역 단일) |

---

## 5. 2단계 실행 결과

### 2단계 목표
> 에이전트의 입출력 계약과 경로 체계를 일관되게 만든다.

### 작업 결과

| # | 작업 | 결과 |
|---|------|------|
| W1 | config 경로 체계 재설계 | **완료** — phases 7→5, cSuiteDocPaths 신설, cdo/cro 제거 |
| W2 | 에이전트 Contract 추가 | **완료** — 7개 C-Level 모두 Input/Output/State Update 표준화 |
| W3 | CTO + sub-agent 경로 수정 | **완료** — features/ 하위 디렉토리 제거, 04-analysis→04-qa |
| W4 | CSO/CMO 독립 산출물 | **완료** — docs/06-domain/ 독립 문서 전환 |
| W5 | CFO/COO 최소 구현 | **완료** — 템플릿 2개 신설, 산출물 경로 설정 |
| W6 | CPO + PM 경로 수정 | **완료** — docs/00-pm/ → docs/00-prd/ |
| W7 | doc-tracker + status.js 확장 | **완료** — cSuiteDocPaths 합산, 동적 phase 추가 |
| W8 | 정리 + 검증 | **완료** — 테스트 수정, 구 경로 잔존 0건 |

### 새 경로 체계

```
docs/
  ├── 00-prd/{feature}.prd.md          CPO
  ├── 01-plan/{feature}.plan.md        CTO
  ├── 02-design/{feature}.design.md    CTO→design
  ├── 03-architect/{feature}.md        CTO→architect (내부)
  ├── 03-do/{feature}.do.md            CTO→fe+be
  ├── 04-qa/{feature}.qa.md            CTO→qa
  ├── 05-report/{feature}.report.md    CTO
  └── 06-domain/
       ├── {feature}.security.md       CSO
       ├── {feature}.marketing.md      CMO
       ├── {feature}.finance.md        CFO
       └── {feature}.ops.md            COO
```

### 정량 변화

| 항목 | Before | After |
|------|--------|-------|
| config phases | 7 (architect/frontend/backend 포함) | 5 (CTO 워크플로우만) |
| config docPaths 일치율 | 1/5 (20%) | 5/5 (100%) |
| C-Level 산출물 config 등록 | CPO 미등록, CSO/CMO/CFO/COO 없음 | 모두 등록 (cSuiteDocPaths) |
| Contract 섹션 | 0개 에이전트 | 7개 에이전트 |
| 독립 산출물 (CSO/CMO) | report 섹션만 | 독립 문서 |
| CFO/COO | stub | 최소 구현 + 템플릿 |
| cdo/cro (유령 역할) | config에 존재 | 제거 |

---

## 6. 남은 과제 (3단계 후보)

| # | 작업 | 설명 |
|---|------|------|
| R6 | 문서-상태 동기화 검증 | 세션 시작 시 status.json ↔ 실제 문서 존재 여부 검증 |
| R9 | 팀 온보딩 가이드 | 새 팀원용 5분 가이드 |
| R10 | .vais/ 팀 공유 정책 | status.json/memory.json git 추적 여부 결정 |
| R11 | 기존 프로젝트 도입 경로 | /vais init --analyze-existing 기능 |
| R12 | setRunRange 테스트 수정 | pre-existing 실패 (옛 phase명 'be'/'fe' 참조) |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-04-02 | 초안 작성 — 문제 분석 + 1단계 계획 |
| 2026-04-02 | 1단계 완료 — R1~R5 실행 결과 기록, 2단계 계획 추가 |
| 2026-04-02 | 2단계 완료 — W1~W8 실행 결과 기록, 3단계 후보 추가 |