# Sub-plan 07 — Harness Gates (4-Step Pipeline)

> 상위: `../v050-full-overhaul.plan.md`
> 선행: 00, 04, 06
> 후행: 08

---

## 0. 목적

sub-agent 종료 시점(SubagentStop hook)에 발동하는 **4단계 검증 파이프라인**을 구축한다:

1. **Document Validation** — 필수 산출물 존재/내용 확인
2. **Checkpoint Validation** — AskUserQuestion 체크포인트 기록 확인
3. **Phase Gate Judgment** — 위 두 결과 + tool 호출 수를 종합해 phase 완료 판정
4. **Transition + Guidance** — gate 통과 시 다음 phase 자동 전이 / 실패 시 재시도 가이드

Ideation phase는 optional이므로 doc validation만 수행 (summary 파일 존재 + 4 섹션), checkpoint/gate는 skip.

---

## 1. 변경 파일

```
scripts/
├── agent-stop.js                     # 4단계 파이프라인 구현
├── agent-start.js                    # VALID_ROLES whitelist 갱신
└── phase-transition.js               # CBO 지원, ideation→plan 전이

lib/quality/
└── gate-manager.js                   # judgePhaseCompletion 강화

lib/validation/
├── doc-validator.js                  # 기존 확장 — 파일 존재 + ≥500B + 섹션 구조
└── cp-guard.js                       # Checkpoint 정합성

lib/pdca/
└── session-guide.js                  # getNextStepGuidance / getRetryGuidance

hooks/
├── hooks.json                        # SubagentStop 라우팅
└── events.json                       # 이벤트 타입 추가

lib/observability/schema.js           # role_transition, phase_transition_auto, phase_transition_retry, gate_judgment 이벤트
```

---

## 2. agent-stop.js 4단계 파이프라인

### 2.1 API

```js
async function handleSubagentStop(context) {
  const { feature, phase, role, subAgent, toolCallCount, sessionId } = context;

  // ideation 예외 경로
  if (phase === 'ideation') {
    return await handleIdeationStop(context);
  }

  // Step 1: Documents
  const docResult = await DocValidator.validate(feature, phase);
  //   → { valid: bool, results: [{file, exists, hasContent, valid, reason}] }

  // Step 2: Checkpoints
  const cpResult = await CPGuard.validateCheckpoints(feature, phase);
  //   → { valid: bool, hasAskUserQuestion: bool, cpCount: int, cpIntegrity: [] }

  // Step 3: Gate Judgment
  const gate = await GateManager.judgePhaseCompletion({
    feature, phase,
    documentsValid: docResult.valid,
    checkpointsRecorded: cpResult.valid,
    toolCallCount
  });
  //   → { pass: bool, failures: [], reason: string }
  await EventLogger.log({ type: 'gate_judgment', feature, phase, result: gate.pass ? 'pass' : 'fail', reason: gate.reason });

  // Step 4: Transition or Retry
  if (gate.pass) {
    const next = await PhaseTransitioner.transitionToNextPhase(feature, phase);
    await EventLogger.log({ type: 'phase_transition_auto', feature, fromPhase: phase, toPhase: next.phase, reason: 'gate_passed' });
    const guidance = await SessionGuide.getNextStepGuidance(feature, next.phase);
    const trustLevel = await readTrust(sessionId);
    if (trustLevel >= 'L3') {
      return { action: 'return_to_ceo', nextPhase: next.phase, guidance };
    }
    return { action: 'ask_user', nextPhase: next.phase, guidance };
  } else {
    await EventLogger.log({ type: 'phase_transition_retry', feature, phase, failures: gate.failures });
    const retry = await SessionGuide.getRetryGuidance(feature, phase, gate.failures);
    return { action: 'retry_phase', currentPhase: phase, failures: gate.failures, guidance: retry };
  }
}
```

### 2.2 Ideation 예외 분기 (`handleIdeationStop`)

```js
async function handleIdeationStop({feature, role}) {
  const path = `docs/00-ideation/${role}_${feature}.md`;
  if (!fs.existsSync(path)) return { action: 'continue', reason: 'ideation not ended yet' };
  const valid = validateIdeationSections(path); // 4 섹션 존재 여부
  if (!valid) return { action: 'warn', reason: 'ideation summary missing required sections' };
  // no gate, no next-phase enforcement — optional
  return { action: 'complete', outputPath: path };
}
```

---

## 3. Document Validator (`lib/validation/doc-validator.js`)

### 3.1 TEMPLATE_OUTPUTS
```js
const TEMPLATE_OUTPUTS = {
  plan:     ['REQUIREMENTS.md', 'SCOPE.md', 'TIMELINE.md'],
  design:   ['DESIGN_SPEC.md', 'ARCHITECTURE.md'],
  do:       ['IMPLEMENTATION.md', 'TEST_RESULTS.md'],
  qa:       ['QA_REPORT.md', 'COMPLIANCE_REPORT.md'],
  report:   ['FINAL_REPORT.md', 'RETROSPECTIVE.md'],
  ideation: ['{role}_{feature}.md']  // 별도 경로 docs/00-ideation/
};
```

### 3.2 검증 기준
- 파일 존재
- 크기 ≥ 500 bytes (빈 템플릿 방지)
- (optional) 필수 섹션 헤더 존재 체크 (phase별로 다름)

### 3.3 CBO phase outputs 확장 (GAP 해소)
현 `TEMPLATE_OUTPUTS`는 CBO 고유 산출물(예: `market-analysis.md`, `financial-model.csv`, `gtm-plan.md`)을 명시하지 않음. 처리 방식:
- 기본 TEMPLATE_OUTPUTS 준수 (REQUIREMENTS/SCOPE/TIMELINE 등)
- 추가로 `TEMPLATE_OUTPUTS_BY_ROLE.cbo.plan = ['market-analysis.md']` 같은 역할별 override 테이블 지원
- 본 sub-plan에서는 role-override 스키마만 추가, 실제 CBO 고유 파일 목록 확정은 09 또는 후속 작업

---

## 4. Checkpoint Guard (`lib/validation/cp-guard.js`)

### 4.1 `.vais/features/{feature}/checkpoints/{phase}.json` 구조
```json
{
  "phase": "design",
  "checkpoints": [
    {
      "id": "cp-1",
      "question": "아키텍처 선택지 중 A안을 선택하시겠습니까?",
      "timestamp": "2026-04-15T10:23:00Z",
      "userResponse": "approved",
      "context": "..."
    }
  ]
}
```

### 4.2 검증
- `checkpoints.length > 0`
- 각 CP에 `{question, timestamp, userResponse}` 존재
- userResponse가 `approved` | `rejected` | `deferred` 중 하나

### 4.3 edge case (GAP 대응)
- 사용자 timeout → `userResponse: "deferred"`
- 사용자 거절 → `userResponse: "rejected"` 일 때 gate 통과 여부? → **통과 허용** (거절도 의사결정). 단 retrospective에 기록.

---

## 5. Gate Manager (`lib/quality/gate-manager.js`)

### 5.1 judgePhaseCompletion 결정 테이블

| documentsValid | checkpointsRecorded | toolCallCount | pass | note |
|---|---|---|---|---|
| ✅ | ✅ | >0 | ✅ | standard pass |
| ✅ | ✅ | 0 | ✅ (warn) | no tool calls logged — 원인 불명 경고 |
| ✅ | ❌ | >0 | ❌ | missing checkpoints |
| ❌ | ✅ | >0 | ❌ | missing documents |
| ❌ | ❌ | any | ❌ | both missing |

### 5.2 ideation 예외
```js
if (phase === 'ideation') return { pass: true, reason: 'ideation is optional, gate skipped' };
```

### 5.3 실패 메시지 포맷
```js
{
  pass: false,
  failures: [
    { type: 'missing_file', file: 'REQUIREMENTS.md' },
    { type: 'no_checkpoint', phase: 'plan' }
  ],
  reason: '산출물 1건 누락, 체크포인트 미기록'
}
```

---

## 6. agent-start.js VALID_ROLES/VALID_SUBAGENTS

```js
const VALID_ROLES = ['ceo', 'cpo', 'cto', 'cso', 'cbo', 'coo', 'auto'];

const VALID_SUBAGENTS = [
  // CEO
  'absorb-analyzer', 'skill-creator',
  // CPO
  'product-discoverer', 'product-strategist', 'product-researcher', 'prd-writer',
  'backlog-manager', 'ux-researcher', 'data-analyst',
  // CTO
  'infra-architect', 'backend-engineer', 'frontend-engineer', 'ui-designer',
  'db-architect', 'qa-engineer', 'test-engineer', 'incident-responder',
  // CSO
  'security-auditor', 'code-reviewer', 'secret-scanner', 'dependency-analyzer',
  'plugin-validator', 'skill-validator', 'compliance-auditor',
  // CBO
  'market-researcher', 'customer-segmentation-analyst', 'seo-analyst', 'copy-writer',
  'growth-analyst', 'pricing-analyst', 'financial-modeler', 'unit-economics-analyst',
  'finops-analyst', 'marketing-analytics-analyst',
  // COO
  'release-engineer', 'sre-engineer', 'release-monitor', 'performance-engineer'
];
```

**제거 확인**:
- `cmo`, `cfo` 없음
- `retrospective-writer`, `technical-writer` 없음

---

## 7. hooks.json / events.json

### 7.1 hooks.json
```json
{
  "SubagentStop": {
    "enabled": true,
    "handler": "scripts/agent-stop.js",
    "exec": "handleSubagentStop(context)",
    "critical": true,
    "description": "v0.50 4-step gate pipeline (doc/cp/gate/transition)"
  },
  "SessionStart": {
    "handler": "hooks/session-start.js",
    "exec": ["check-cc-advisor-support", "migration-engine", "render-dashboard"]
  }
}
```

### 7.2 events.json 추가 타입
- `role_transition`: `{from_role, to_role, reason, feature}`
- `phase_transition_auto`: `{feature, fromPhase, toPhase, reason}`
- `phase_transition_retry`: `{feature, phase, failures}`
- `gate_judgment`: `{feature, phase, result, reason}`
- `ideation_started`, `ideation_ended` (05에서 예고됨 — 여기서 실제 등록)
- `advisor_call`, `advisor_degraded`, `advisor_budget_block` (04에서 예고 — 여기서 실제 등록)

---

## 8. SessionGuide (`lib/pdca/session-guide.js`)

### 8.1 `getNextStepGuidance(feature, nextPhase)`
- 다음 phase의 목적, 예상 산출물, 권장 sub-agent 나열
- trustLevel에 따라 "자동 전환합니다" vs "승인하시겠습니까?"

### 8.2 `getRetryGuidance(feature, phase, failures)`
- failures 배열을 사람이 읽기 쉽게 변환
- 복구 명령 제안: `/vais {c-level} {phase} {feature}` 재실행 가이드
- failure 타입별 디버깅 팁 (예: `missing_file` → `templates/{phase}.template.md` 참조)

---

## 9. 진입 시 신경 쓸 점

### 9.1 선행에서 보장됨
- 00: state-machine 전이 규칙, config의 phases 정의
- 04: advisor 이벤트 타입 정의
- 06: phase 라우터가 sub-agent 호출 시 feature/phase 컨텍스트 전달

### 9.2 다음으로 넘길 보증
- SubagentStop hook 발동 시 4단계 파이프라인 전부 동작
- ideation phase에 대해 gate skip + summary 검증
- VALID_SUBAGENTS가 실제 `agents/` 내용과 정확히 일치
- 이벤트 스키마가 `lib/observability/schema.js`에 다 등록됨

### 9.3 함정
- **VALID_SUBAGENTS 누락 1건도 치명적**: 누락된 sub-agent가 호출되면 agent-start.js에서 reject → 라우팅 실패. 01/02/03에서 확정한 실측 카운트와 100% 매칭 필수.
- **toolCallCount 0인데 pass?**: "대화만 하고 파일은 안 썼는데 산출물이 있다"는 엣지 케이스. 가능성:
  - 사용자가 직접 파일 편집 후 agent 세션이 단지 분석만 수행
  - 처리: warn 통과가 맞음 (사용자 주권 원칙)
- **ideation 종료 없이 agent stop**: 사용자가 중단 → 5 §6.3 복원 정보 `.vais/features/{topic}/resume/` 기록
- **PhaseTransitioner가 ideation → plan 전이 시 role 바꿔야 함**: ideation role=(예)ceo, plan role=(예)cpo. 라우터가 이 변경을 알아야 함. state-machine에 role transition 함께 갱신.
- **gate 실패 이벤트 폭탄**: 사용자가 같은 실수 반복 시 phase_transition_retry 이벤트 수십 건 쌓임. observability rotation policy(`lib/observability/rotation.js`) 확인.

---

## 10. 검증

- [ ] `scripts/agent-stop.js` 4단계 파이프라인 존재
- [ ] `tests/gate-manager.test.js` 결정 테이블 5케이스 통과
- [ ] `tests/state-machine.test.js` validate transition 정/오 통과
- [ ] `tests/migration.test.js` (00에서 작성한 것) 여전히 통과
- [ ] 수동: design phase 완료 → do phase 자동 전이 로그 확인 (trustLevel ≥ L3)
- [ ] 수동: plan phase에서 파일 1개 누락 → `retry_phase` 가이드 출력 확인
- [ ] 수동: `/vais cpo ideation test` → `handleIdeationStop` 호출 + gate 미발동
- [ ] `grep "cmo\|cfo" scripts/agent-start.js` == 0
- [ ] 이벤트 8종 schema export

연결 SC: **SC-5**

---

## 11. 다음 단계

- **08** Cleanup — 이제 구 C-Level 디렉토리 안전 삭제 가능
