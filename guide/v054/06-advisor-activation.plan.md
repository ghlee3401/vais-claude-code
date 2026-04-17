# Sub-plan 06 — Advisor Activation

> 릴리즈: **v0.56.0** (CP-9 릴리즈 분리 결정)
> 선행: v0.55 전체 완료 (03에서 `lib/advisor/*` + `lib/control/cost-monitor.js` 유지됨)
> 후행: v0.56용 docs/tests 마무리
> 담당 SC: 신설 SC-A1~A5

---

## 0. 목적

v0.50 plan 04에서 설계만 끝나고 **호출 진입점이 빠진** Advisor Tool 통합을 완성한다. 사용자 결정(2026-04-17): CP-3 = (B) 런타임 연결.

**현재 상태**:
- ✅ `lib/advisor/wrapper.js` 113 LOC — Anthropic SDK fallback 호출 로직 완비
- ✅ `lib/advisor/prompt-builder.js` 60 LOC — system/user prompt 합성 완비
- ✅ `lib/control/cost-monitor.js` 152 LOC — spend tracking + degrade gracefully 완비
- ✅ `lib/observability/schema.js` — `advisor_call`, `advisor_degraded`, `advisor_budget_block` 이벤트 등록 완료
- ✅ `vais.config.json > advisor` 섹션 완비
- ✅ 38 sub-agent frontmatter `advisor.enabled: true` + `includes: [_shared/advisor-guard.md]` 패치 완료
- ✅ `scripts/check-cc-advisor-support.js` (67 LOC) 존재
- ✅ `scripts/patch-advisor-frontmatter.js` (75 LOC) 존재
- ❌ **wrapper.callAdvisor를 실제로 호출하는 진입점 부재**
- ❌ session-start hook에서 native/fallback 모드 판정 미통합
- ❌ wrapper에서 cost-monitor 미연결 (checkBudget/recordCall 호출 없음)
- ❌ wrapper에서 observability `advisor_call` 이벤트 미기록

본 sub-plan은 **빠진 4개 진입점/연결**을 추가한다.

---

## 1. 설계

### 1.1 호출 모델

Claude Code가 frontmatter `advisor:` 필드를 native로 처리할 가능성이 불확실하므로 **양 모드 모두 지원**한다.

```
session-start hook
    │
    ▼
check-cc-advisor-support.js → .vais/advisor-mode.json {mode: "native" | "wrapper" | "disabled"}
    │
    ├── "native"   → CC가 frontmatter로 직접 advisor 호출. plugin은 spend 파일 갱신 미참여 (CC가 책임)
    │                단, 사용자가 명시적으로 cost 추적 원하면 (B) 옵션 노출 가능 (out of scope)
    │
    ├── "wrapper"  → sub-agent가 Bash 도구로 `node scripts/advisor-call.js ...` CLI 호출
    │                CLI가 wrapper.callAdvisor → cost-monitor → observability 순서로 처리
    │
    └── "disabled" → ANTHROPIC_API_KEY 부재 등. 모든 advisor 호출 즉시 unavailable 반환
```

### 1.2 진입점 = `scripts/advisor-call.js` (신규 CLI)

agent markdown 본문에 다음과 같은 호출 가이드를 넣는다 (`_shared/advisor-guard.md` 갱신):

````markdown
## Advisor 사용 (fallback 모드)

복잡한 결정 직전(early), 막혔을 때(stuck), 종료 직전(final) advisor 의견을 받으려면:

```bash
node scripts/advisor-call.js \
  --sub-agent="backend-engineer" \
  --c-level="cto" \
  --trigger="early" \
  --summary="Stripe webhook signature 검증 구현 시작"
```

stdout으로 advice가 출력된다. native 모드에서는 CC가 자동 처리하므로 본 명령 불필요.
````

CLI는 다음을 수행:
1. `.vais/advisor-mode.json` 읽기 → `disabled`면 즉시 종료
2. session_id 결정 (`VAIS_SESSION_ID` 환경변수 또는 신규 UUID)
3. `cost-monitor.checkBudget(sessionId)` → `allowed=false`면 `advisor_budget_block` 이벤트 + degrade 메시지 출력 후 종료
4. sub-agent markdown 로드 (`agents/{c-level}/{sub-agent}.md`) — `_shared/advisor-guard.md` include 병합 (단순 concat)
5. `wrapper.callAdvisor({...})` 실행
6. 성공 시: `cost-monitor.recordCall({...})` + `EventLogger.log('advisor_call', {...})` + advice를 stdout 출력
7. 실패 시: status별 분기 (degraded/timeout/unavailable)

### 1.3 wrapper.js 수정 (cost-monitor + observability 연결)

현재 wrapper는 cost를 계산만 하고 어디에도 기록 안 함. 다음 수정:

```diff
+const costMonitor = require('../control/cost-monitor');
+const { EventLogger, EVENT_TYPES } = require('../observability');

 async function callAdvisor(opts) {
+  // 1) budget check
+  const budget = await costMonitor.checkBudget(opts.sessionId);
+  if (!budget.allowed) {
+    return nullResult('budget_block', true);
+  }
   // ... 기존 SDK 호출 ...
+
+  // 2) record + emit
+  await costMonitor.recordCall({sessionId: opts.sessionId, subAgent: opts.subAgent, cost, tokens});
+  try {
+    new EventLogger('.vais/event-log.jsonl').log(EVENT_TYPES.ADVISOR_CALL, {
+      timestamp: new Date().toISOString(),
+      session_id: opts.sessionId,
+      sub_agent: opts.subAgent,
+      c_level: opts.cLevel,
+      trigger: opts.trigger,
+      tokens_in: tokens.input,
+      tokens_out: tokens.output,
+      cached_tokens: tokens.cached,
+      cost,
+      status: 'ok',
+    });
+  } catch(_) {}
   return { advice, tokens, cost, degraded: false, status: 'ok' };
```

degraded/budget_block/unavailable 케이스도 각각 해당 이벤트 발행.

### 1.4 session-start hook 통합

`hooks/session-start.js`에 다음 추가:

```js
// advisor 모드 판정 (1세션 1회, 결과 캐시)
try {
  const { spawnSync } = require('child_process');
  spawnSync('node', [path.join(__dirname, '..', 'scripts', 'check-cc-advisor-support.js')], {
    stdio: 'ignore',
    env: { ...process.env, VAIS_SESSION_ID: sessionId },
  });
} catch(_) {}
```

`scripts/check-cc-advisor-support.js`는 이미 존재. 동작 확인 후 누락 부분(예: `.vais/advisor-mode.json` 작성) 보강.

### 1.5 `_shared/advisor-guard.md` 갱신

기존 가이드는 native 가정. fallback 모드 호출 가이드를 §1.2와 같이 추가.

### 1.6 Anthropic SDK 설치

`package.json`의 `optionalDependencies`에 추가:

```diff
+  "optionalDependencies": {
+    "@anthropic-ai/sdk": "^0.30.0"
+  },
```

`optional`이므로 설치 실패해도 npm install 자체는 성공. wrapper.js의 `getSDK()`가 false 반환하면 `unavailable` 처리됨.

---

## 2. 태스크

| # | 태스크 | 파일 |
|---|--------|------|
| T-1 | `scripts/advisor-call.js` 신규 작성 (~150 LOC) | NEW |
| T-2 | `lib/advisor/wrapper.js` 수정 — cost-monitor + observability 연결 | EDIT |
| T-3 | `hooks/session-start.js` 수정 — check-cc-advisor-support 호출 | EDIT |
| T-4 | `scripts/check-cc-advisor-support.js` 검증 + 필요 시 보강 (`.vais/advisor-mode.json` 작성 보장) | REVIEW + EDIT |
| T-5 | `agents/_shared/advisor-guard.md` 갱신 — fallback CLI 사용법 추가 | EDIT |
| T-6 | `package.json`에 `@anthropic-ai/sdk` optionalDependencies 추가 | EDIT |
| T-7 | 기존 `tests/advisor-integration.test.js` 갱신 — wrapper의 cost-monitor + observability 연결 검증 | EDIT |
| T-8 | 기존 `tests/advisor-degrade.test.js` 갱신 — wrapper에서 budget_block 이벤트 발행 검증 | EDIT |
| T-9 | `tests/advisor-call-cli.test.js` 신규 — CLI smoke test (mock SDK) | NEW (선택) |
| T-10 | `lib/observability/index.js` export에 `EVENT_TYPES.ADVISOR_*` 노출 확인 | REVIEW |

---

## 3. 검증 (신규 SC-A1 ~ A5)

| # | Criteria | 검증 |
|---|----------|------|
| SC-A1 | `scripts/advisor-call.js` CLI가 mock SDK로 호출 시 stdout에 advice 출력 + `.vais/event-log.jsonl`에 `advisor_call` 이벤트 1건 추가 | smoke test |
| SC-A2 | `cost-monitor.recordCall` 호출 후 `.vais/advisor-spend.json`의 session.calls += 1, month.cost += <expected> | `tests/advisor-integration.test.js` |
| SC-A3 | session.calls가 max_calls_per_session 도달 후 callAdvisor → `status='budget_block'`, `advice=null`, `advisor_budget_block` 이벤트 발생 | `tests/advisor-degrade.test.js` |
| SC-A4 | `hooks/session-start.js` 실행 후 `.vais/advisor-mode.json` 존재 + `mode` 값이 native/wrapper/disabled 중 하나 | smoke test |
| SC-A5 | `npm install` 시 `@anthropic-ai/sdk` 설치 실패해도 전체 install 성공. wrapper는 `unavailable` 반환 | `npm install --no-optional` 시뮬레이션 |

---

## 4. 함정 (v050 plan 04 §3.3 carry-over)

- **frontmatter 멱등성**: `patch-advisor-frontmatter.js`는 이미 멱등 보장. 본 sub-plan에서는 재실행 안 함 (이미 패치 완료).
- **`.vais/advisor-spend.json` race**: 여러 CLI 호출이 동시에 recordCall → 마지막 write 승리. v0.55 범위에서는 허용 (단일 사용자 시나리오). v0.56에서 `proper-lockfile` 도입 검토.
- **session_id 전파**: `VAIS_SESSION_ID` 환경 변수 + session-start에서 신규 발행. CLI는 환경변수 없으면 자체 UUID 생성 (단일 호출 단위).
- **Beta API 헤더 변경**: `vais.config.json > advisor.beta_header`로 외부화 완료. 향후 `advisor-tool-2026-XX-XX`로 교체 시 config만 수정.
- **Degrade 알림 1회만**: cost-monitor가 `degraded=true` 세팅 후 wrapper가 status별 이벤트 발행 시 `notify_once_per_session` 플래그 확인 후 stderr 출력 1회. CLI 반복 호출 시 메시지 중복 방지.

---

## 5. 리스크 & 완화

| 리스크 | 완화 |
|--------|------|
| Claude Code의 native advisor 지원이 불확실 → check-cc-advisor-support의 판정 로직이 부정확할 수 있음 | 보수적 fallback: 판정 실패 시 `wrapper` 모드로. 사용자가 직접 `.vais/advisor-mode.json` 수정 가능 |
| sub-agent가 Bash 도구로 CLI 호출하는 패턴이 자연스럽지 않음 | `_shared/advisor-guard.md`에 호출 시점/포맷을 명확히. 강제는 아니며 sub-agent 판단 |
| Anthropic API 키 미설정 환경에서 사용자 혼란 | check-cc-advisor-support가 `disabled` 모드로 명확히 판정 + session-start에서 stderr 안내 메시지 |
| 호출 비용 폭증 | cost-monitor의 캡(`max_calls_per_session=15`, `monthly_budget_usd=200`)이 hard limit. degraded 후 자동 차단 |

---

## 6. Carry-forward

**sub-plan 04**: `vais.config.json > advisor` 섹션 유지 (이미 반영).
**sub-plan 05**:
- CLAUDE.md "Agent Architecture" 섹션에 advisor 활성화 모드 설명 추가
- CHANGELOG에 신규 진입점(`scripts/advisor-call.js`) 명시
- README "Setup" 섹션에 `ANTHROPIC_API_KEY` 환경변수 안내 추가
