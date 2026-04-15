# Sub-plan 04 — Advisor Integration (Module M-24)

> 상위: `../v050-full-overhaul.plan.md`
> 선행: 03
> 후행: 06, 07

---

## 0. 목적

모든 Sonnet sub-agent에 Anthropic Beta **Advisor Tool** (`advisor_20260301`)을 기본 활성화한다. Sub-agent(executor=Sonnet 4.6)가 mid-generation에 Opus 4.6 advisor를 호출해 전술적 판단을 보강한다.

정책: `max_uses=3`, ephemeral caching 5m, **Degrade Gracefully** (비용 캡 초과 시 advisor 자동 비활성화 + Sonnet 단독 계속 작업).

---

## 1. 산출물

```
lib/advisor/
├── wrapper.js                # Anthropic API 호출 래퍼 (CC 미지원 fallback)
├── prompt-builder.js         # 시스템 프롬프트 + _shared/advisor-guard.md 병합
└── index.js                  # export 진입점 (선택)

lib/control/
└── cost-monitor.js           # advisor 누적 비용 추적 + Degrade Gracefully

scripts/
└── check-cc-advisor-support.js  # 세션 시작 시 CC advisor frontmatter 지원 판정

lib/observability/
└── schema.js                 # (기존) advisor_call, advisor_degraded, advisor_budget_block 이벤트 타입 추가

vais.config.json              # advisor 섹션 완성 (00의 PLACEHOLDER 대체)

agents/**/*.md                # 32(또는 실측) sub-agent frontmatter에 advisor + includes 추가

tests/
├── advisor-integration.test.js
└── advisor-degrade.test.js
```

---

## 2. 태스크

### 2.1 `lib/advisor/wrapper.js`

**목적**: CC subagent frontmatter가 `advisor_20260301` tool을 직접 인식하지 못할 때 우회.

**API**:
```js
async function callAdvisor({
  conversation,          // 전체 sub-agent 대화 history
  subAgent,              // e.g. 'backend-engineer'
  cLevel,                // e.g. 'cto'
  trigger,               // 'early' | 'stuck' | 'final' | 'reconcile'
  sessionId,
  budgetRemaining        // cost-monitor에서 전달
}) → {
  advice: string,
  tokens: {input, output, cached},
  cost: number,          // USD
  degraded: bool,        // 비용 초과 시 true + advice == null
  status: 'ok' | 'budget_block' | 'unavailable' | 'timeout'
}
```

**내부**:
- Anthropic SDK (`@anthropic-ai/sdk`) 의존 — `package.json`에 추가 필요 (없으면 이 sub-plan에서 dep 추가)
- Model: `claude-opus-4-6`
- Beta header: `anthropic-beta: advisor-tool-2026-03-01`
- `max_tokens`: 2048
- Caching: `{type: "ephemeral", ttl: "5m"}`
- 실패 처리: 네트워크/타임아웃/401 각각 status 코드 분기
- 로깅: 모든 호출을 `lib/observability` 를 통해 `advisor_call` 이벤트로 기록

### 2.2 `lib/advisor/prompt-builder.js`

**목적**: sub-agent 시스템 프롬프트 + `_shared/advisor-guard.md` + trigger별 컨텍스트를 합쳐 advisor 호출 페이로드 생성.

**API**:
```js
function buildAdvisorPrompt({
  subAgentMarkdown,       // registry.loadAgent() 결과의 mergedBody
  conversation,
  trigger,                // 'early' | 'stuck' | 'final' | 'reconcile'
  currentFiles            // 최근 편집한 파일 경로 목록 (optional)
}) → {
  systemPrompt: string,
  userPrompt: string
}
```

**트리거별 템플릿**:
- `early`: "이제 {작업 요약}을 시작하려 한다. 접근 방향이 올바른가? 놓친 전제는?"
- `stuck`: "다음 에러/상태에서 막혔다: {에러}. 시도한 것: {시도}. 다른 접근은?"
- `final`: "작업이 끝났다. 다음 산출물이 완성됐다: {요약}. 빠뜨린 것 있나?"
- `reconcile`: "advisor 이전 조언과 1차 자료가 충돌한다: {충돌}. 어느 쪽이 맞나?"

### 2.3 `lib/control/cost-monitor.js`

**목적**: advisor 누적 비용 추적 + 캡 강제 + Degrade Gracefully.

**Schema** (`.vais/advisor-spend.json`):
```json
{
  "session_id": "...",
  "session": {
    "cost": 0.42,
    "calls": 7,
    "by_subagent": { "backend-engineer": 3, "qa-engineer": 2, ... }
  },
  "month": {
    "period": "2026-04",
    "cost": 87.31,
    "calls": 142,
    "reset_date": "2026-05-01"
  },
  "degraded": false,
  "last_updated": "2026-04-15T11:23:00Z"
}
```

**API**:
```js
async function checkBudget(sessionId) → {allowed, remaining, reason}
async function recordCall({sessionId, subAgent, cost, tokens}) → {totalSession, totalMonth}
async function isDegraded() → bool
async function resetIfNewMonth() → bool                 // 월 첫 호출 시 month 구획 초기화
function degradeReason() → 'session_cap' | 'monthly_cap' | null
```

**캡 정책**:
- `session.max_calls_per_session` 기본 15
- `month.monthly_budget_usd` 기본 200
- 초과 시: `degraded=true` 세팅, `advisor_degraded` 이벤트 기록
- 복구: 새 달 진입 시 `resetIfNewMonth()`가 `degraded=false` 자동 복원

### 2.4 `vais.config.json` advisor 섹션 (00의 PLACEHOLDER 대체)

```json
"advisor": {
  "enabled": true,
  "executor": { "model": "claude-sonnet-4-6" },
  "advisor": { "model": "claude-opus-4-6" },
  "max_uses_per_request": 3,
  "caching": { "type": "ephemeral", "ttl": "5m" },
  "max_calls_per_session": 15,
  "monthly_budget_usd": 200,
  "beta_header": "advisor-tool-2026-03-01",
  "spend_file": ".vais/advisor-spend.json",
  "fallback": {
    "strategy": "degrade_gracefully",
    "notify_once_per_session": true
  }
}
```

### 2.5 Sub-agent frontmatter 일괄 패치

모든 Sonnet sub-agent (실측 카운트 — sub-plan 03에서 확정)의 frontmatter에 두 필드 추가:

```yaml
---
# ... 기존 필드 ...
advisor:
  enabled: true
  model: claude-opus-4-6
  max_uses: 3
  caching: { type: ephemeral, ttl: 5m }
includes:
  - _shared/advisor-guard.md
---
```

**스크립트로 일괄 패치** (권장): `scripts/patch-advisor-frontmatter.js`
- 대상 디렉토리: `agents/{ceo,cpo,cto,cso,cbo,coo}/`
- 본체 파일(`{c-level}.md`) 제외
- 기존 frontmatter 파싱 → 필드 merge (덮어쓰기 X, 없을 때만 추가) → 저장
- 멱등성: 여러 번 실행해도 중복 삽입 없음

### 2.6 Observability schema (`lib/observability/schema.js` 확장)

3개 이벤트 타입 추가:

```js
const EVENT_TYPES = {
  // ... 기존 ...
  advisor_call: {
    fields: ['timestamp','session_id','sub_agent','c_level','trigger','tokens_in','tokens_out','cached_tokens','cost','status']
  },
  advisor_degraded: {
    fields: ['timestamp','session_id','reason','fallback_model','monthly_spent','cap','next_reset']
  },
  advisor_budget_block: {
    fields: ['timestamp','session_id','sub_agent','total_spent','cap','remaining']
  }
};
```

### 2.7 `scripts/check-cc-advisor-support.js`

**목적**: 세션 시작 시 (session-start hook에서 호출) CC가 frontmatter `advisor:` 필드를 직접 인식하는지 판정.

**동작**:
1. 테스트 에이전트(fixture) 로드 시도 with dummy `advisor:` 필드
2. CC subagent tool list에 `advisor_20260301`이 자동 주입되는지 확인
3. 결과:
   - **native**: `.vais/advisor-mode.json` → `{mode: "native"}` (frontmatter 직접 사용)
   - **fallback**: `{mode: "wrapper"}` (lib/advisor/wrapper.js 경유)
   - **unsupported**: `{mode: "disabled"}` (Anthropic API 키 없음 등)
4. 세션 중 1회 캐시

### 2.8 테스트

**`tests/advisor-integration.test.js`**:
- Mock Anthropic SDK
- backend-engineer fixture 1회 작업 중:
  - callAdvisor 호출 패턴: early → (작업) → stuck(optional) → (작업) → final
  - 평균 2~3회 호출, `max_uses=3` 초과 시 4번째 호출 자동 reject
- `advisor_call` 이벤트 정확히 기록됨
- caching 활성 시 tokens_in의 cached_tokens 필드 존재

**`tests/advisor-degrade.test.js`**:
- `advisor-spend.json` fixture: `month.cost = 199.5` (캡 200 직전)
- callAdvisor → 월 캡 초과 → `degraded=true, advice=null, status='budget_block'`
- 이벤트: `advisor_budget_block` + `advisor_degraded` 둘 다 기록
- sub-agent는 advisor 없이 작업 계속 (null advice 수신 시 정상 폴백)
- 월 변경 mock → `resetIfNewMonth()` → `degraded=false` 복원

---

## 3. 진입 시 신경 쓸 점

### 3.1 선행에서 보장됨
- `_shared/advisor-guard.md` 완성 (03)
- `lib/registry/agent-registry.js`가 includes 병합 지원 (03)
- sub-agent 실측 카운트 확정 (03)

### 3.2 다음으로 넘길 보증
- `scripts/check-cc-advisor-support.js` 실행 결과 파일 존재
- native 모드 확정이면 wrapper는 미사용 (코드는 남김)
- fallback 모드 확정이면 wrapper 우회 — session-start에서 자동 선택
- 모든 sub-agent frontmatter에 `advisor:` + `includes:` 존재 (멱등 패치 완료)
- `vais.config.json.advisor` 섹션 완성
- 이벤트 3종 schema export

### 3.3 함정
- **frontmatter 패치 멱등성 필수**: 두 번째 실행 때 `advisor:` 키 중복 주입되면 YAML 파싱 에러 → 배포 전체 실패. 테스트로 2회 실행 → diff == 0 확인.
- **Anthropic SDK 의존 추가**: `@anthropic-ai/sdk`를 `package.json`에 넣을 때 peer/optional 고민. **optionalDependencies**로 넣어 CC 환경에서 자체 설치 안 되면 fallback `disabled`로 처리.
- **비용 계산 공식**: Opus 4.6 pricing $15/1M input tokens, $75/1M output tokens 가정. caching read $1.5/1M, write $18.75/1M — 코드에 하드코딩하지 말고 `vais.config.json.advisor.pricing`으로 꺼내기 (향후 가격 변경 대응).
- **`.vais/advisor-spend.json` 동시 쓰기 레이스**: 여러 sub-agent가 병렬 실행 시 `recordCall()` 동시 write. 간단 해결: 파일 잠금 (`proper-lockfile` 또는 atomic rename).
- **session_id 생성 시점**: session-start hook에서 UUID 생성 → 환경 변수 `VAIS_SESSION_ID`로 전파. check-cc-advisor-support.js도 이것을 공유.
- **Degrade Gracefully 알림은 1회만**: 같은 세션에서 degrade 상태를 10번 공지하면 노이즈. `notify_once_per_session: true` 준수.
- **Beta API 버전 고정**: `advisor-tool-2026-03-01` 헤더 — 향후 변경 시 config에서 교체 가능하도록 유지.

---

## 4. 검증

- [ ] `node scripts/check-cc-advisor-support.js` 실행 → `.vais/advisor-mode.json` 생성
- [ ] `grep -l "advisor:" agents/**/*.md | grep -v "{c-level-main}.md" | wc -l` == 실측 카운트
- [ ] `grep -l "_shared/advisor-guard.md" agents/**/*.md | wc -l` == 같은 카운트
- [ ] `vais.config.json.advisor.monthly_budget_usd` 존재
- [ ] `lib/observability/schema.js`에 3개 이벤트 타입 export
- [ ] `tests/advisor-integration.test.js` 통과
- [ ] `tests/advisor-degrade.test.js` 통과
- [ ] Advisor 호출 한 번 실제 실행 후 `.vais/advisor-spend.json` 업데이트 확인

연결 SC: **SC-14, SC-16, SC-17, SC-18, SC-19, SC-20**

---

## 5. 다음 단계

- **06** Phase Routers — CEO 라우터가 advisor 결과를 받는 sub-agent를 호출
- **07** Harness Gates — agent-stop이 advisor 이벤트를 수집
