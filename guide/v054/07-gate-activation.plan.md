# Sub-plan 07 — Gate Activation

> 릴리즈: **v0.56.0** (CP-9 릴리즈 분리 결정)
> 선행: v0.55 전체 완료 + 04 carry-forward의 `gates` 스키마 확장
> 후행: v0.56용 docs/tests 마무리
> 담당 SC: SC-12, 신설 SC-G1~G6
> 갱신: 2026-04-17 CP-9에 따라 v0.56 릴리즈로 이동. 2026-04-17 실제 코드 재검증으로 CMO/CFO 전제 무효화 반영.

---

## 0. 목적

v0.50 plan 07의 의도를 **완성**한다. 현재 상태 (2026-04-17 재확인):

- ✅ `lib/quality/gate-manager.js` (386 LOC): GATE_DEFINITIONS + checkGate + resolveAction + judgePhaseCompletion 완비
- ✅ `scripts/auto-judge.js` (300 LOC): C-Level별 판정 로직 구현. **`judgeCPO/CTO/CSO/CBO/COO` 5개 존재, CMO/CFO 함수는 이미 삭제되어 CBO로 통합된 상태**
- ✅ `scripts/gate-check.js` (333 LOC): gate 상태 조회
- ❌ **gate-manager와 auto-judge 미연결** — auto-judge가 gate-manager의 checkGate를 호출하지 않음
- ❌ **agent-stop.js의 4-step pipeline 미구현** — 현재 2-step(doc-validator + cp-guard, 82 LOC)
- ❌ **메트릭 이름 매핑** — auto-judge 결과 키가 gate-manager의 메트릭 이름과 일치하지 않음
- ❌ **guidance 모듈 부재** — gate fail 시 다음 액션 자동 제안하는 로직 없음

본 sub-plan은 **4개 빈 부분을 채워서 메트릭 기반 게이팅을 실제 동작시킨다**.

---

## 1. 설계

### 1.1 호출 모델

```
SubagentStop hook
    │
    ▼
scripts/agent-stop.js (4-step pipeline)
    │
    ├── Step 1: Document validation (현행 scripts/doc-validator.js)
    ├── Step 2: Checkpoint validation (현행 scripts/cp-guard.js)
    ├── Step 3: Gate judgment (신규)
    │          ├─ scripts/auto-judge.js 호출 → C-Level별 메트릭 추출
    │          └─ lib/quality/gate-manager.checkGate(phase, {metrics, role})
    │              → pass | retry | fail | skip
    └── Step 4: Guidance (신규)
               ├─ pass → 다음 단계 안내
               ├─ retry → 미충족 메트릭 + 재시도 가이드
               └─ fail → 사용자 체크포인트 + 블록
```

### 1.2 메트릭 매핑 (auto-judge → gate-manager)

`auto-judge.js`의 각 judge 함수 결과를 gate-manager가 이해하는 메트릭 이름으로 매핑:

| C-Level | auto-judge 측정 | gate-manager 메트릭 |
|---------|-----------------|--------------------|
| CPO | PRD 8 섹션 완성도 | `designCompleteness` (0~100, 섹션수×12.5) |
| CTO | 요구사항 vs 구현 매칭률 | `matchRate` (0~100, % 형식) |
| CTO | 심각 취약점 수 | `criticalIssueCount` |
| CSO | OWASP Top 10 점수 | `owaspScore` (0~10) |
| CSO | critical 취약점 | `criticalIssueCount` |
| **CBO** | SEO 점수 + GTM 완성도 통합 | `marketingScore` (신규 metric) |
| COO | CI/CD 단계 정의율 | `opsReadiness` (0~100) |
| 공통 | convention 준수율 | `conventionCompliance` |
| 공통 | 코드 품질 점수 | `codeQualityScore` |

### 1.3 CBO 판정 로직 검증 (리팩터 아닌 검증)

**⚠️ 원 플랜 전제 무효화**: 2026-04-17 실제 코드 재확인 결과 `judgeCMO`/`judgeCFO` 함수는 이미 삭제되어 있고 `judgeCBO` 하나로 통합된 상태. 따라서 "통합 리팩터"는 **불필요**.

대신 v0.56 착수 시 아래만 검증:
- 현재 `judgeCBO`가 SEO 점수, 비용/수익, 가격 전략을 모두 커버하는지
- 누락된 판정 차원이 있다면 `judgeCBO`에 추가 (새 함수 생성 X)
- `marketingScore` 신규 메트릭(§4.2)의 소스 데이터가 `judgeCBO`에서 생성되는지

이 변경은 T-1의 **범위 축소**로 이어진다 — 기존 ~150 LOC 수정이 아니라 메트릭 이름 매핑 + marketingScore 산출 로직 추가 정도.

### 1.4 `vais.config.json > gates` 확장 (04에서 예고된 스키마)

```jsonc
"gates": {
  "defaults": {
    "designCompleteness": 80,
    "codeQualityScore": 60,
    "criticalIssueCount": 0,
    "matchRate": 90,
    "owaspScore": 8,
    "conventionCompliance": 70,
    "marketingScore": 70,
    "opsReadiness": 70
  },
  "roleOverrides": {
    "cso": { "matchRate": 95, "codeQualityScore": 80 },
    "cto": {}
  },
  "cto": {
    "plan": {
      "requirePrd": "ask",
      "completenessThreshold": 6
    }
  }
}
```

`lib/quality/gate-manager.js`의 기존 `GATE_DEFINITIONS` + `ROLE_THRESHOLD_OVERRIDES`는 이 config를 읽어 **덮어쓰기 가능**하게 수정.

### 1.5 Guidance 모듈 (신규)

`lib/quality/guidance.js` (~100 LOC):

```js
function generateGuidance({ role, phase, gateResult, metrics }) {
  // gateResult.verdict: 'pass' | 'retry' | 'fail'
  // returns: { action, nextSteps, userMessage }
}
```

- `pass`: "✅ 다음 phase로 진행하세요"
- `retry`: "⚠️ {matchRate} 89% < 90%. qa-engineer 재실행하세요"
- `fail`: "🛑 critical 취약점 3개 발견. CSO 개입 필요. 사용자 승인 필요"

---

## 2. 태스크

| # | 태스크 | 파일 |
|---|--------|------|
| T-1 | `scripts/auto-judge.js` — 메트릭 이름을 gate-manager 표준으로 통일 + `marketingScore` 산출 로직 추가. **CMO/CFO → CBO 통합은 이미 완료되어 skip** | EDIT (~50 LOC 수정, 원 플랜 ~150 LOC에서 축소) |
| T-2 | `lib/quality/gate-manager.js` 수정 — `GATE_DEFINITIONS`, `ROLE_THRESHOLD_OVERRIDES`를 config에서 읽도록 | EDIT (~50 LOC) |
| T-3 | `lib/quality/guidance.js` 신규 — gate 결과 → 사용자 메시지 생성 | NEW (~100 LOC) |
| T-4 | `scripts/agent-stop.js` 수정 — 4-step pipeline 구현 | EDIT (~80 LOC 추가) |
| T-5 | `vais.config.json > gates` 확장 — §1.4 스키마 반영 | EDIT |
| T-6 | `lib/quality/gate-manager.js`의 `judgePhaseCompletion`을 agent-stop.js가 실제 호출하도록 연결 | EDIT |
| T-7 | Observability: `gate_judgment` 이벤트 payload 표준화 (score 포함) | REVIEW `lib/observability/schema.js` |
| T-8 | `scripts/gate-check.js` 갱신 — auto-judge 결과 기반 표시 | EDIT (~50 LOC 수정) |
| T-9 | `tests/gate-manager.test.js` 확장 — config 오버라이드, CBO 통합 케이스 | EDIT |
| T-10 | `tests/gate-activation.test.js` 신규 — agent-stop 4-step 통합 smoke test | NEW (~200 LOC) |
| T-11 | agent markdown 갱신 — 각 C-Level에 "gate 통과 조건" 섹션 추가 (메트릭 이름 명시) | EDIT 6 파일 |

---

## 3. 검증 (신규 SC-G1 ~ G6)

| # | Criteria | 검증 |
|---|----------|------|
| SC-G1 | `auto-judge.js`에서 `judgeCPO/CTO/CSO/CBO/COO` 5개만 존재 (CMO/CFO 부재 — v0.56 착수 시점에 이미 참) + 각 judge 결과 키가 gate-manager 표준 메트릭 이름과 일치 | `grep "function judge" scripts/auto-judge.js` + 통합 smoke test |
| SC-G2 | `node scripts/gate-check.js {feature} do` 실행 시 auto-judge → gate-manager → verdict 반환 | integration smoke test |
| SC-G3 | agent-stop.js가 SubagentStop 훅에서 실행될 때 4-step 전부 수행 (각 step 이벤트 발행) | `tests/gate-activation.test.js` |
| SC-G4 | `gate_judgment` 이벤트에 `score`, `threshold`, `verdict` 포함 | `lib/observability/schema.js` 스키마 |
| SC-G5 | `vais.config.json > gates.defaults.matchRate = 95`로 변경 시 gate-manager가 95 사용 | 수동 테스트 |
| SC-G6 | `guidance.generateGuidance` 결과가 retry 시 미달 메트릭 이름 + 구체 수치 포함 | `tests/gate-manager.test.js` 확장 |

---

## 4. 함정

### 4.1 메트릭 수집의 "간접성"

auto-judge는 agent의 **산출물 파일(마크다운)**을 파싱해서 메트릭을 추출한다. 즉:
- agent가 PRD 8 섹션을 모두 작성해야 `designCompleteness = 100`
- agent markdown에 "gate 통과 조건" 섹션이 있어야 agent가 의식적으로 산출물 작성 시 신경 씀

T-11에서 각 C-Level agent markdown에 해당 섹션을 추가하지 않으면 gate는 항상 fail.

### 4.2 `marketingScore` 신규 메트릭

기존 gate-manager에 없는 메트릭. 정의 필요:
- SEO 점수 (0~100) × 0.5
- GTM 완성도 (0~100) × 0.5
- = marketingScore

CBO의 seo-analyst + growth-analyst 산출물 병합 판정.

### 4.3 Legacy auto-judge 호출자

`auto-judge.js`를 현재 누가 호출하는가? 확인 필요.

```
grep -rn "auto-judge" hooks/ scripts/ skills/ agents/
```

현재는 CEO의 Full-Auto 모드(수동)에서만 사용 추정. 07 이후는 **agent-stop.js가 자동 호출**하는 형태가 됨. 기존 CLI 호출은 호환성 유지.

### 4.4 Performance

agent-stop hook은 5초 timeout. auto-judge + gate-manager 실행 시간이 이를 초과하면 hook 실패. 성능 측정 필요.

---

## 5. 리스크 & 완화

| 리스크 | 완화 |
|--------|------|
| agent가 "gate 통과 조건"을 이해하지 못해 산출물이 일관성 없으면 false-negative 다수 | T-11에서 agent markdown에 "gate 메트릭 체크리스트"를 구조화해 제공. 초기에는 `VAIS_GATE_MODE=warn`으로 경고만, `strict`로 차단은 선택 |
| 메트릭 수치가 agent의 주관적 해석에 의존 | auto-judge 파싱 로직을 "규칙 기반 + 객관적 카운팅"으로 제한. LLM 판정 호출 안 함 (결정론 확보) |
| gate 판정으로 작업 흐름이 블록되면 사용자 짜증 | `VAIS_GATE_STRICT` 환경변수로 강도 조절. 기본 warn. Rule #11(사용자 주권)과 일치 |
| auto-judge 300 LOC 리팩터 중 기존 CEO Full-Auto 동작 깨짐 | 회귀 테스트 추가 — 07의 T-10 |

---

## 6. 최소 실용 범위 (MVP) vs. 완전 구현

현실적 릴리즈를 위해 **단계적 구현** 고려:

### 6.1 MVP (07에 반드시 포함)
- T-1: CMO+CFO → CBO 통합
- T-4: agent-stop 4-step pipeline
- T-5: config gates 확장 스키마
- T-10: 기본 통합 테스트

### 6.2 확장 (여력 있을 때)
- T-3: guidance 모듈 (풍부한 사용자 메시지)
- T-11: agent markdown 전면 갱신

MVP만 하면 "gate가 동작한다" 수준, 확장까지 하면 "gate가 친절하게 가이드한다" 수준.

---

## 7. Carry-forward

**sub-plan 05**:
- CHANGELOG에 gate activation 상세 기록
- CLAUDE.md "Key Configuration" — `gates` 스키마 상세 설명
- 테스트 목록에 `tests/gate-activation.test.js` 반영

**범위 밖 (v0.56+)**:
- LLM 기반 메트릭 평가 (예: 코드 품질을 Opus가 판정)
- 대시보드(08)에 gate 결과 시각화 통합
- Multi-feature parallel gate 평가
