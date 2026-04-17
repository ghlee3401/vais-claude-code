# Sub-plan 01 — Dead Code Removal: `lib/control/`

> 선행: —
> 후행: 04 (config에서 automation/guardrails 섹션 제거), 05 (문서 갱신)
> 담당 SC: SC-3, SC-5, SC-7

---

## 0. 배경

v0.50 plan 04(Advisor Integration)에서 `lib/control/cost-monitor.js`를 도입하면서
"`bkit-claude-code`" 상위 프로젝트의 control 서브시스템(trust-engine, loop-breaker, blast-radius,
checkpoint-manager, automation-controller) 6개를 함께 이식했다.

**현실 체크** (require 그래프 전수조사):

| 파일 | LOC | runtime require | test require |
|------|-----|-----------------|--------------|
| `lib/control/trust-engine.js` | 306 | **0** | 0 |
| `lib/control/loop-breaker.js` | 206 | **0** | 0 |
| `lib/control/blast-radius.js` | 254 | **0** | 0 |
| `lib/control/checkpoint-manager.js` | 263 | **0** | 0 |
| `lib/control/automation-controller.js` | 253 | **0** | 0 |
| ~~`lib/control/cost-monitor.js`~~ | ~~152~~ | ~~0~~ | sub-plan 06에서 advisor 진입점이 require하므로 **유지** |
| `lib/control/index.js` | 11 | **0** | 0 — re-export만 하던 모듈, 06에서도 미사용. **삭제** |

**결론**:
- trust-engine, loop-breaker, blast-radius, checkpoint-manager, automation-controller는 `@see bkit-claude-code` 주석만 남기고 플러그인에서는 한 번도 호출된 적이 없다 → **삭제**.
- `cost-monitor`는 advisor 활성화(sub-plan 06)에 사용 → **유지**.
- `vais.config.json`의 `automation` (L0~L4), `guardrails.loopBreaker`, `guardrails.blastRadiusLimit`, `guardrails.checkpoint*`은 전부 소비자 없음 → 삭제 (sub-plan 04).

---

## 1. 조치

### 1.1 `lib/control/` 선택적 삭제 (cost-monitor 유지)

```
rm lib/control/trust-engine.js
rm lib/control/loop-breaker.js
rm lib/control/blast-radius.js
rm lib/control/checkpoint-manager.js
rm lib/control/automation-controller.js
rm lib/control/index.js
# cost-monitor.js는 유지 (sub-plan 06이 require)
```

**검증**: `ls lib/control/` → `cost-monitor.js`만 남음

### 1.2 관련 테스트

- `tests/advisor-degrade.test.js` — cost-monitor 테스트, **유지** (sub-plan 06에서 활용).

### 1.3 `vais.config.json` 키 제거 (sub-plan 04에서 실제 수정, 여기선 목록만 정의)

- `automation` 섹션 전체 (level, levels, defaultLevel, emergencyFallbackLevel, gateTimeoutMs, emergencyStopEnabled, trustScoreEnabled, maxConcurrentFeatures)
- `guardrails.loopBreaker.*`
- `guardrails.blastRadiusLimit`
- `guardrails.checkpointOnPhaseTransition`
- `guardrails.checkpointOnDestructive`
- `guardrails.destructiveDetection` (→ 실제 사용처는 `scripts/bash-guard.js`로, 하드코딩되어 있어 config 불필요)

### 1.4 에이전트/스킬/문서 참조 제거

다음을 grep:
```
grep -rn "lib/control\|trust-engine\|loop-breaker\|blast-radius\|checkpoint-manager\|automation-controller\|TrustEngine\|LoopBreaker\|BlastRadius\|AutomationController" \
  agents/ skills/ scripts/ hooks/ tests/ lib/ templates/
```

결과가 있으면 해당 텍스트 수정 또는 파일 삭제.

**현재 확인된 잔존 참조** (주요):
- `CHANGELOG.md` §0.50 변경사항 — **유지**(역사 기록)
- `guide/harness-plan-v2.md` — **유지**(참고 원본)
- `guide/v050_plan/**` — **유지**(역사 기록)

### 1.5 `lib/control/` 제거 후 `vais.config.json`의 `manager.autoInvoke` 등 잔존 점검

`manager.*`은 `lib/memory.js`와 `scripts/doc-tracker.js`에서 부분적으로 소비. 유지.

---

## 2. 검증

| # | 검증 | 방법 |
|---|------|------|
| V-1 | `lib/control/cost-monitor.js`만 존재, 나머지 5 파일 + index.js 부재 | `ls lib/control/` |
| V-2 | 런타임 코드에 trust-engine/loop-breaker/blast-radius/checkpoint-manager/automation-controller 참조 0 | grep → 0 |
| V-3 | 에이전트/스킬 문서에 TrustEngine/LoopBreaker 등 언급 0 (CHANGELOG/guide 예외) | grep |
| V-4 | `npm test` 통과 (cost-monitor 테스트 유지됨) | `node --test tests/*.test.js` |

---

## 3. 리스크

| 리스크 | 완화 |
|--------|------|
| 외부 문서(블로그, 마켓플레이스 설명 등)에 "trust level L2" 등이 광고되어 있을 수 있음 | CHANGELOG에 "automation L-level 기능은 v0.50에서 설계만 있었고 실사용 전 제거" 명기 |
| 미래에 loop detection이 필요할 때 처음부터 다시 구현해야 함 | 필요해지면 "bkit-claude-code" 원본을 참고해 재이식. 지금은 YAGNI |

---

## 4. Carry-forward

**sub-plan 04에 전달**: `vais.config.json`에서 삭제할 키 목록 §1.3 참조.
**sub-plan 05에 전달**: CHANGELOG에 삭제 내역 기록 필요.
