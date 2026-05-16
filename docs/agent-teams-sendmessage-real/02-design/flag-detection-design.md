---
owner: cto
artifact: flag-detection-design
phase: design
feature: agent-teams-sendmessage-real
generated: 2026-05-17
agent: infra-architect
summary: "cc-version-detect 확장 시그니처 + conversation-orchestrator 분기 알고리즘 + T1~T3 mitigation 의사코드 + decisions-log template diff"
---

# Flag Detection Design — agent-teams-sendmessage-real

> Phase: 🎨 design | Owner: CTO | Date: 2026-05-17
> 참조 문서: `docs/agent-teams-sendmessage-real/01-plan/main.md`, `docs/agent-teams-sendmessage-real/01-plan/tech-plan.md`, `docs/agent-teams-sendmessage-real/01-plan/security-gate-plan.md`

---

## 2-A. `lib/cc-version-detect.js` 확장 시그니처

### 신규 export 함수: `detectExperimentalAgentTeamsFlag()`

```
반환 타입: { enabled: boolean, source: 'env' | 'settings.json' | 'none', raw: string | null }
```

**우선순위**: env 변수 → `~/.claude/settings.json` → none (기존 `_cached` 패턴과 독립된 `_flagCached` 변수 사용)

**의사코드**:

```
// @see https://nodejs.org/api/process.html#processenv
// @see https://nodejs.org/api/fs.html#fsreadfilesyncpath-options

let _flagCached = null

function detectExperimentalAgentTeamsFlag():
  if _flagCached is not null:
    return _flagCached

  // 1. env 변수 우선
  envVal = process.env['CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS']
  if envVal exists (not undefined):
    _flagCached = {
      enabled: envVal === '1' or envVal === 'true',
      source: 'env',
      raw: envVal
    }
    return _flagCached

  // 2. settings.json fallback
  settingsPath = path.join(os.homedir(), '.claude', 'settings.json')
  try:
    raw = fs.readFileSync(settingsPath, 'utf8')
    parsed = JSON.parse(raw)
    val = parsed['CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS']
    if val exists:
      _flagCached = {
        enabled: val === '1' or val === 'true' or val === true,
        source: 'settings.json',
        raw: String(val)
      }
      return _flagCached
  catch (any error):
    // 파일 없거나 파싱 실패 — none 으로 fall-through

  // 3. 미설정
  _flagCached = { enabled: false, source: 'none', raw: null }
  return _flagCached
```

### `checkAgentTeamsAllowed()` 반환 타입 확장

**변경 전**:
```
{ allowed: boolean, reason: string, version: object | null }
```

**변경 후** (simulationMode 필드 추가):
```
{
  allowed: boolean,
  reason: string,
  version: object | null,
  simulationMode: boolean,   // 신규 — true = simulation fallback, false = real SendMessage
  flagInfo: object | null    // 신규 — detectExperimentalAgentTeamsFlag() 결과
}
```

**시나리오별 반환값**:

| 조건 | allowed | simulationMode | reason |
|------|---------|---------------|--------|
| enabled=false | false | — | 'agentTeams.enabled=false (opt-out)' |
| CC 버전 감지 실패 | false | — | 'Claude Code 버전 감지 실패 — sequential fallback' |
| CC < 2.1.0 | false | — | 'Claude Code X.Y.Z < 2.1.0 — sequential fallback' |
| CC 2.1+ + flag missing | true | **true** | 'CC 2.1+ / flag not set — simulation mode' |
| CC 2.1+ + flag enabled | true | **false** | 'CC 2.1+ / flag set — real SendMessage' |

**의사코드 추가분** (기존 함수 하단에 append):

```
// checkAgentTeamsAllowed() 내 — v.supportsAgentTeams === true 분기 이후

  flagInfo = detectExperimentalAgentTeamsFlag()

  if flagInfo.enabled is false:
    return {
      allowed: true,
      reason: `CC ${v.major}.${v.minor}.${v.patch} / flag not set (source: ${flagInfo.source}) — simulation mode`,
      version: v,
      simulationMode: true,
      flagInfo
    }

  return {
    allowed: true,
    reason: `CC ${v.major}.${v.minor}.${v.patch} / flag set (source: ${flagInfo.source}) — real SendMessage`,
    version: v,
    simulationMode: false,
    flagInfo
  }
```

---

## 2-B. `skills/vais/utils/conversation-orchestrator.js` 분기 알고리즘

### ConversationSession 생성 시 mode capture

```
constructor(opts):
  // ... 기존 필드 유지 ...

  // 신규: simulationMode capture (opts 에서 직접 받거나 checkAgentTeamsAllowed 결과)
  this.simulationMode = opts.simulationMode ?? true   // 기본값 true = 안전
  this.mode = this.simulationMode ? 'simulated' : 'real'
```

### review-window 단계 real / simulated 분기

기존 `_sendReviewRequest()` 의 `dryRun` 분기를 `simulationMode` 로 교체:

```
async _sendReviewRequest(participantClevel):

  // [T3] 최우선 — sub-agent caller 차단 (D-15)
  _enforceMainSubDirectionality(participantClevel)

  // [T2] actor whitelist 검증 (D-16)
  _validateActor(participantClevel)

  if this.simulationMode:
    // 0.68.0 byte-compat: dryRun 동일 동작
    return {
      actor: participantClevel,
      eventType: EVENT_TYPES.AGREE,
      topic: `[simulated] auto-agree on draft v${this.roundCount + 1}`,
      mode: 'simulated',
      messageHash: null
    }

  // real 모드
  if not this.sendMessageFn:
    throw new Error('sendMessageFn required in real mode (simulationMode=false)')

  // [T1] 시크릿 grep — 송신 직전 (D-17)
  promptText = _buildReviewPrompt(this.feature, this.phase, this.consensusTurns)
  _scanSecrets(promptText)   // hit 시 throw + log warning

  try:
    resp = await this.sendMessageFn({
      to: participantClevel,
      prompt: promptText,
      timeoutMs: this.turnTimeoutMs
    })
  catch (e):
    return {
      actor: participantClevel,
      eventType: EVENT_TYPES.TIMEOUT,
      topic: `SendMessage timeout/error: ${e.message.slice(0, 100)}`,
      mode: 'real',
      messageHash: null
    }

  hash = _sha256(JSON.stringify(resp))
  return {
    ..._parseResponse(participantClevel, resp),
    mode: 'real',
    messageHash: hash
  }
```

### event 객체 schema 변경 (mode + messageHash 필드)

**변경 전** (기존 log() 박제 schema):
```
{ time, actor, eventType, topic, ref }
```

**변경 후**:
```
{ time, actor, eventType, topic, ref, mode: 'real' | 'simulated', messageHash: string | null }
```

`log()` 메서드 확장:
```
log(eventType, actor, topic, refObj = {}, mode = this.mode, messageHash = null):
  this.events.push({
    time: new Date().toISOString(),
    actor,
    eventType,
    topic,
    ref: (typeof refObj === 'string' ? refObj : JSON.stringify(refObj)).slice(0, 200),
    mode,
    messageHash
  })
```

---

### T3 mitigation — `_enforceMainSubDirectionality()` (D-15, 최우선)

보안 위협: sub-agent 가 SendMessage 를 통해 다른 agent 에 prompt injection 전달 가능.

```
// [T3] main→sub 일방향 정책. sub-agent 가 SendMessage 호출 시 차단.
// callerContext 는 ConversationSession 생성 시 opts.callerContext 로 주입.
// 값: 'main' | 'c-level' | 'sub-agent'

function _enforceMainSubDirectionality(targetActor):
  if this.callerContext === 'sub-agent':
    msg = `[T3] SendMessage blocked: sub-agent caller is not allowed to send messages. ` +
          `caller=${this.callerContext}, target=${targetActor}, feature=${this.feature}`
    process.stderr.write('[VAIS] ⚠️  ' + msg + '\n')
    this.log('security-block', 'system', msg, {}, this.mode, null)
    throw new Error(msg)
```

> work-rules.md v2.3 §SendMessage 정책 에 "sub-agent 발신 금지" 명시 필요 (Do phase 에서 append).
> Gate C grep: `grep -r "sendMessage\|SendMessage" lib/ skills/ hooks/` → sub-agent 파일 경로 0 hit 확인.

---

### T2 mitigation — `_validateActor()` 화이트리스트 (D-16)

보안 위협: agent ID 위조로 의사결정 라우팅 교란.

```
// [T2] actor whitelist — parallelGroup C-Level + 'main' + synthesizer
// this.allowedActors = [...parallelGroup, 'main', this.synthesizer]  (constructor 에서 구성)

function _validateActor(actor):
  if not this.allowedActors.includes(actor):
    msg = `[T2] Unknown actor '${actor}' — message dropped. ` +
          `allowed=${JSON.stringify(this.allowedActors)}, feature=${this.feature}`
    process.stderr.write('[VAIS] ⚠️  ' + msg + '\n')
    this.log('security-block', 'system', msg, {}, this.mode, null)
    // throw 하지 않고 drop (IDX 위조 시 파이프라인 전체 중단 방지)
    return false
  return true
```

`constructor` 에 추가:
```
  // [T2] 화이트리스트 구성 — parallelGroup 은 opts 에서 주입
  this.parallelGroup = opts.parallelGroup || []
  this.allowedActors = Array.from(new Set([
    ...this.parallelGroup,
    'main',
    this.synthesizer
  ]))
```

---

### T1 mitigation — `_scanSecrets()` 시크릿 grep (D-17)

보안 위협: SendMessage body 에 민감 정보(API 키, 토큰 등) 포함 가능.

```
// [T1] SendMessage 송신 전 시크릿 패턴 grep
// security-gate-plan §3 AC-CSO-1 regex 재사용

const SECRET_PATTERNS = [
  /(password|passwd)\s*[:=]\s*["'][^"']{8,}/i,
  /secret\s*[:=]\s*["'][^"']{8,}/i,
  /api[_-]?key\s*[:=]\s*["'][^"']{8,}/i,
  /token\s*[:=]\s*["'][^"']{8,}/i
]

function _scanSecrets(text):
  for pattern in SECRET_PATTERNS:
    if pattern.test(text):
      msg = `[T1] Secret pattern detected in SendMessage body — send blocked. ` +
            `pattern=${pattern.source.slice(0, 50)}, feature=${this.feature}`
      process.stderr.write('[VAIS] ⚠️  ' + msg + '\n')
      this.log('security-block', 'system', msg, {}, this.mode, null)
      throw new Error(msg)
```

---

### FSM 분기 전체 흐름 (mermaid)

```mermaid
flowchart TD
    A[ConversationSession.run()] --> B{simulationMode?}
    B -- true --> C[simulated branch\n0.68.0 byte-compat\nauto-agree]
    B -- false --> D[_enforceMainSubDirectionality\nT3: sub caller? → throw]
    D --> E[_validateActor\nT2: whitelist check\n→ drop if unknown]
    E --> F[_buildReviewPrompt]
    F --> G[_scanSecrets\nT1: regex grep\n→ throw if hit]
    G --> H[sendMessageFn call\nCC harness SendMessage]
    H -- timeout/error --> I[TIMEOUT event\nmode:real, hash:null]
    H -- response --> J[_parseResponse\nhash = sha256 response]
    J --> K[event log\nmode:real, messageHash:hash]
    C --> L[event log\nmode:simulated, hash:null]
    I --> L
    K --> L
    L --> M[decisions-log 박제]
```

---

## 2-C. `hooks/session-start.js` 경고 분기

`main()` 함수 내 config 로드 이후, ctx 구성 이전에 삽입:

**의사코드**:

```
// Agent Teams 경고 분기 (3 조건)
agentTeamsEnabled = config?.orchestration?.agentTeams?.enabled ?? false

if agentTeamsEnabled:
  result = checkAgentTeamsAllowed(agentTeamsEnabled)

  if result.allowed and result.simulationMode:
    // 조건 1: enabled=true + CC 2.1+ + env flag missing
    process.stderr.write(
      '[VAIS] ⚠️  Agent Teams enabled but CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS env not set' +
      ' — using simulation. See ONBOARDING.md#agent-teams-activation\n'
    )

  else if not result.allowed and result.reason.includes('< 2.1.0'):
    // 조건 2: enabled=true + env flag set + CC < 2.1
    process.stderr.write(
      '[VAIS] ⚠️  Agent Teams requires Claude Code 2.1+' +
      ' — sequential fallback\n'
    )

  // 조건 3: allowed=true + simulationMode=false → 조용 (정상 활성)

// agentTeamsEnabled=false → 조용 (조건 4)
```

---

## 2-E. `templates/decisions-log.template.md` 헤더 변경

### Before / After diff

**변경 전** (Events Timeline 표 헤더):
```
| # | time (UTC ISO 8601) | actor | event-type | topic | ref |
|---|--------------------|-------|-----------|-------|-----|
| 1 | {2026-mm-ddT...} | {actor} | {제기|반박|합의|pivot|timeout} | {한 줄 요약} | {링크 또는 hash} |
```

**변경 후** (`mode` + `messageHash` 컬럼 추가):
```
| # | time (UTC ISO 8601) | actor | event-type | topic | ref | mode | messageHash |
|---|--------------------|-------|-----------|-------|-----|------|-------------|
| 1 | {2026-mm-ddT...} | {actor} | {제기|반박|합의|pivot|timeout} | {한 줄 요약} | {링크 또는 hash} | {real\|simulated} | {sha256 또는 —} |
```

**추가 주석** (표 아래에 append):
```
> real 모드 = CC 내장 SendMessage 도구 사용 / simulated = CTO 일괄 합성.
> event-type enum 정의는 동일. messageHash = SHA-256(response JSON), simulated 행은 `—`.
> 하위 호환: 기존 v1.0 timeline 행은 mode/messageHash 컬럼 비워도 valid.
```

---

## 인터페이스 계약 표

모든 신규 export / 변경 시그니처를 한 곳에 박제.

### `lib/cc-version-detect.js`

| 항목 | 타입 | 변경 종류 | 비고 |
|------|------|-----------|------|
| `detectExperimentalAgentTeamsFlag()` | `() → { enabled: boolean, source: 'env'\|'settings.json'\|'none', raw: string\|null }` | 신규 추가 | `_flagCached` 내부 캐시 사용 |
| `checkAgentTeamsAllowed(enabledConfig)` | `(boolean) → { allowed, reason, version, simulationMode: boolean, flagInfo: object\|null }` | 기존 확장 | simulationMode + flagInfo 필드 추가. 기존 3 필드 유지 |
| `_resetFlagCache()` | `() → void` | 신규 추가 | 테스트용. `_flagCached = null` |

### `skills/vais/utils/conversation-orchestrator.js`

| 항목 | 타입 | 변경 종류 | 비고 |
|------|------|-----------|------|
| `ConversationSession` constructor `opts.simulationMode` | `boolean` (default: true) | 신규 파라미터 | `opts.dryRun` 는 하위 호환 유지 |
| `ConversationSession` constructor `opts.callerContext` | `'main'\|'c-level'\|'sub-agent'` (default: 'main') | 신규 파라미터 | T3 분기용 |
| `ConversationSession` constructor `opts.parallelGroup` | `string[]` (default: []) | 신규 파라미터 | T2 화이트리스트 구성용 |
| `ConversationSession.mode` | `'real'\|'simulated'` | 신규 인스턴스 필드 | |
| `ConversationSession.allowedActors` | `string[]` | 신규 인스턴스 필드 | parallelGroup + main + synthesizer 합집합 |
| `ConversationSession.log()` | 5번째 파라미터 `mode`, 6번째 `messageHash` 추가 | 기존 확장 | 기본값으로 backward-compat |
| `_scanSecrets(text)` | `(string) → void` (throws on hit) | 신규 내부 함수 | T1 mitigation |
| `_validateActor(actor)` | `(string) → boolean` | 신규 내부 메서드 | T2 mitigation, false = drop |
| `_enforceMainSubDirectionality(targetActor)` | `(string) → void` (throws on violation) | 신규 내부 메서드 | T3 mitigation |
| `_sha256(text)` | `(string) → string` | 신규 내부 함수 | Node.js `crypto.createHash('sha256')` 사용 |

### `hooks/session-start.js`

| 항목 | 변경 종류 | 비고 |
|------|-----------|------|
| `main()` — agentTeams 경고 분기 블록 추가 | 기존 확장 | config 로드 직후 삽입. 3 조건 if/else |
| `require('../lib/cc-version-detect').checkAgentTeamsAllowed` | 신규 import 추가 | simulationMode 필드 사용 |

---

## T1~T3 mitigation 박제 위치 요약

| 위협 | 박제 파일 | 박제 위치 | 알고리즘 |
|------|----------|-----------|---------|
| **T1** 메시지 leak | `conversation-orchestrator.js` | `_sendReviewRequest()` — sendMessageFn 호출 직전 | `_scanSecrets(promptText)` — 4 regex 패턴. hit → throw |
| **T2** agent ID 위조 | `conversation-orchestrator.js` | `_sendReviewRequest()` 진입 시 | `_validateActor(participantClevel)` — parallelGroup 화이트리스트. unknown → drop |
| **T3** prompt injection | `conversation-orchestrator.js` | `_sendReviewRequest()` 최선두 (T2 이전) | `_enforceMainSubDirectionality()` — callerContext=sub-agent → throw |
| T3 정책 문서 | `agents/_shared/work-rules.md` | "SendMessage 정책" 신규 섹션 | "sub-agent 발신 금지" 명시 (Do phase append) |
| T3 Gate C 검증 | CSO code-reviewer | QA phase Gate C | `grep -r "sendMessage\|SendMessage" lib/ skills/ hooks/` → sub-agent 경로 0 hit |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-17 | 초기 작성 — 2-A/B/C/E 설계 + T1~T3 mitigation 의사코드 + 인터페이스 계약 표 + mermaid |
