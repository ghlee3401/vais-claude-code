# Sub-plan 04 — `vais.config.json` Cleanup

> 선행: 01 (lib/control 삭제), 02 (lib/pdca 삭제), 03 (duplicate consolidation)
> 후행: 05
> 담당 SC: SC-5

---

## 0. 배경

`vais.config.json`은 v0.50에서 `automation`, `guardrails`, `advisor`, `parallelGroups`, `chaining`, `dependencies`, `reviewLoops`, `gates`, `manager` 등을 추가했다. 그러나 런타임 코드가 소비하는 키는 제한적이다. **01~03에서 관련 모듈이 삭제**되면 소비자 없는 키가 명확해진다.

### 0.1 키별 소비자 매트릭스

| 키 | runtime 소비자 | 유지/삭제 |
|----|----------------|-----------|
| `version` | `lib/paths.js loadConfig`, `scripts/vais-validate-plugin.js` | 유지 |
| `plugin.*` | 문서용 | 유지 |
| `cSuite.roles`, `rolesList`, `autoKeywords` | `scripts/agent-start.js`, agent markdown, skills/phases | 유지 |
| `dependencies` | 문서 힌트(CLAUDE.md), 런타임 소비 없음 | 유지 (문서/에이전트 힌트용) |
| `pipeline.*` | skills/phases/ceo.md 라우팅 설명 | 유지 |
| `observability.*` | `lib/observability/*`, `scripts/agent-stop.js` | 유지 |
| `mcp` | 비활성, 미래용 | 유지 |
| `workflow.phases/mandatoryPhases/docPaths/phaseMeta` | `lib/paths.js resolveDocPath`, `scripts/doc-validator.js`, status.js | 유지 |
| `gapThreshold` | `scripts/auto-judge.js` | 유지 |
| `parallelGroups` | 런타임 소비 없음 (skills/에서 표시만) | **삭제 검토** (대체: skills/phases/cto.md에 문자열로 이동) |
| `chaining` | 런타임 소비 없음 | **삭제 검토** |
| `gapAnalysis.*` | `scripts/auto-judge.js` | 유지 |
| `qa.*` | agent markdown 참고 | 유지 (문서 힌트) |
| `manager.enabled/memory/autoInvoke/entryTypes` | `lib/memory.js`, `scripts/doc-tracker.js` | 유지 (검증 후 entryTypes 소비 확인) |
| `automation.*` | `lib/control/*` (삭제됨) | **삭제** |
| `guardrails.destructiveDetection` | `scripts/bash-guard.js`는 하드코딩으로 동작, config 미참조 | **삭제** |
| `guardrails.loopBreaker.*` | `lib/control/loop-breaker.js` (삭제됨) | **삭제** |
| `guardrails.blastRadiusLimit` | `lib/control/blast-radius.js` (삭제됨) | **삭제** |
| `guardrails.checkpointOnPhaseTransition` | `lib/control/checkpoint-manager.js` (삭제됨) | **삭제** |
| `guardrails.checkpointOnDestructive` | 〃 | **삭제** |
| `orchestration.gateAction` | agent markdown 참조 + `scripts/doc-validator.js`? | 유지 (문서에서 참조) |
| `gates.cto.plan.*` | agent markdown(CTO)에서 "strict/ask/skip" 참조 | 유지 (CTO plan phase 동작 규격). sub-plan 07에서 **확장** (역할별 threshold 섹션 추가) |
| `advisor.*` | `lib/advisor/*` + `lib/control/cost-monitor.js` (sub-plan 06에서 활성화) | **유지** |
| `conventions.referenceComment` | 에이전트 markdown 참조 (규칙 Rule #7) | 유지 |
| `featureNameValidation` | `lib/status.js validateFeatureName` — 현재 하드코딩. config 키는 참고용 | **키 삭제** (소비자 없음) — 또는 status.js가 config 읽도록 수정 (추가 작업 크므로 키 삭제 권장) |
| `featureNameSuggestions` | 사용자 힌트(CLI 표시 없음) | **삭제** (소비자 없음) |

---

## 1. 조치

### 1.1 `vais.config.json` 수정

**삭제할 최상위 키**: `automation`, `guardrails`
**유지**: `advisor` (sub-plan 06이 wrapper/cost-monitor에서 소비)

**삭제할 하위 키**:
- `parallelGroups` (내용은 skills/phases/{cto,cbo,coo}.md에 인라인 이동)
- `chaining`
- `featureNameValidation`
- `featureNameSuggestions`

최종 유지되는 스켈레톤:
```json
{
  "version": "0.55.0",
  "plugin": {...},
  "cSuite": {...},
  "dependencies": {...},
  "pipeline": {...},
  "observability": {...},
  "mcp": {...},
  "workflow": {...},
  "gapThreshold": 0.90,
  "gapAnalysis": {...},
  "qa": {...},
  "manager": {...},
  "orchestration": {"gateAction": "confirm"},
  "gates": {...},
  "advisor": {...},
  "conventions": {...}
}
```

### 1.2 소비자 교체 (parallelGroups 이전)

`parallelGroups`를 참조하는 문서가 있으면 skills/phases/*.md에 문자열로 인라인.

```
grep -rn "parallelGroups" agents/ skills/ scripts/ hooks/ lib/ templates/
```

### 1.3 `destructiveDetection` 잔존 확인

`scripts/bash-guard.js`가 config를 읽지 않고 하드코딩 blocklist로 동작함을 확인. 그러면 키 삭제가 안전.

---

## 2. 검증

| # | 검증 | 방법 |
|---|------|------|
| V-1 | `vais.config.json`에 `automation`, `guardrails` 키 부재. `advisor` 키 유지 | `jq '.automation, .guardrails' vais.config.json` → null, `jq '.advisor' vais.config.json` → object |
| V-2 | `vais.config.json` 유효 JSON | `node -e "require('./vais.config.json')"` |
| V-3 | 런타임에서 config 로드 정상 | `npm test` (paths.test.js, status.test.js 등) |
| V-4 | version 키가 0.55.0 | grep |

---

## 3. 리스크

| 리스크 | 완화 |
|--------|------|
| config 키 참조 문서(CLAUDE.md "vais.config.json 참조" 부분)가 구 키 명기 중 | sub-plan 05에서 CLAUDE.md의 설정 설명 갱신 |
| 외부 사용자가 `automation.level`을 설정해두고 있을 수 있음 | v0.55 마이그레이션 노트에 "자동 무시됨" 명기. 경고만 출력하는 코드 불필요 (config에 알 수 없는 키 있어도 기본 JSON.parse는 에러 안 냄) |
| `featureNameValidation` 키가 외부 문서에 노출되어 있음 | README/CLAUDE.md에 규칙만 문장으로 남기고 JSON 키 삭제 |

---

## 4. Carry-forward

**sub-plan 05**:
- `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`의 version 동기화
- CLAUDE.md "Key Configuration" 섹션 갱신 (automation/guardrails 섹션 설명 제거, advisor/gates 섹션 설명 강화)
- CHANGELOG에 config cleanup 내역 기록

**sub-plan 07**:
- `gates` 섹션에 다음 threshold 추가 (v050 plan 07의 스펙 반영):
  - `gates.designCompleteness` (default 80)
  - `gates.codeQualityScore` (default 60)
  - `gates.criticalIssueCount` (default 0)
  - `gates.matchRate` (default 90)
  - `gates.owaspScore` (default 8, CSO 전용)
  - `gates.conventionCompliance` (default 70)
- role별 override (예: `gates.cso.matchRate: 95`)
- 07의 agent-stop.js 4-step pipeline이 이 설정을 소비
