# Sub-plan 00 — Migration Foundation

> 상위: `../v050-full-overhaul.plan.md`
> 선행: 없음 (모든 sub-plan의 전제)
> 후행: 01, 02, 05

---

## 0. 목적

v0.49.2 → v0.50.0 전환의 **기반**을 마련한다. 설정 파일, 상태 머신, 경로 규칙, 마이그레이션 로직, 버전 메타데이터를 일관되게 갱신한다. 여기가 틀어지면 이후 sub-plan이 전부 불안정해진다.

---

## 1. 범위

**만질 파일**:
- `vais.config.json` (전면 갱신)
- `lib/core/state-machine.js` (확장 — v0.50 전용은 별도 파일 `state-machine-v050.js`에 작성 후 치환)
- `lib/core/migration-engine.js` (신규)
- `lib/paths.js` (규칙 추가)
- `package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `CHANGELOG.md` (버전 동기화)

**건드리지 않을 것**:
- `agents/` (sub-plan 01, 02 소관)
- `skills/` (sub-plan 05, 06 소관)
- `hooks/` (sub-plan 07 소관)

---

## 2. 태스크

### 2.1 `vais.config.json` 갱신

v0.50 스펙으로 전면 재작성:

```json
{
  "version": "0.50.0",
  "cSuite": {
    "roles": ["ceo", "cpo", "cto", "cso", "cbo", "coo"],
    "ceo":  { "required": true,  "model": "opus", "layer": "executive",   "agent": "agents/ceo/ceo.md", "subAgents": ["absorb-analyzer", "skill-creator"] },
    "cpo":  { "required": false, "model": "opus", "layer": "product",     "agent": "agents/cpo/cpo.md", "subAgents": ["product-discoverer","product-strategist","product-researcher","prd-writer","backlog-manager","ux-researcher","data-analyst"] },
    "cto":  { "required": false, "model": "opus", "layer": "technology",  "agent": "agents/cto/cto.md", "subAgents": ["infra-architect","backend-engineer","frontend-engineer","ui-designer","db-architect","qa-engineer","test-engineer","incident-responder"] },
    "cso":  { "required": false, "model": "opus", "layer": "security",    "agent": "agents/cso/cso.md", "subAgents": ["security-auditor","code-reviewer","secret-scanner","dependency-analyzer","plugin-validator","skill-validator","compliance-auditor"] },
    "cbo":  { "required": false, "model": "opus", "layer": "business",    "agent": "agents/cbo/cbo.md", "subAgents": ["market-researcher","customer-segmentation-analyst","seo-analyst","copy-writer","growth-analyst","pricing-analyst","financial-modeler","unit-economics-analyst","finops-analyst","marketing-analytics-analyst"] },
    "coo":  { "required": false, "model": "opus", "layer": "operations",  "agent": "agents/coo/coo.md", "subAgents": ["release-engineer","sre-engineer","release-monitor","performance-engineer"] }
  },
  "dependencies": {
    "cto": ["cpo"],
    "cso": ["cto"],
    "coo": ["cto"],
    "cbo": []
  },
  "pipeline": {
    "launchDefault": ["cbo", "cpo", "cto", "cso", "cbo", "coo"],
    "pipelineRoles": ["cbo", "cpo", "cto", "cso", "coo"]
  },
  "workflow": {
    "phases": [
      { "id": "ideation", "optional": true,  "description": "자유 대화, 산출물 비강제" },
      { "id": "plan",     "optional": false, "description": "요구사항/범위 문서" },
      { "id": "design",   "optional": false, "description": "설계 문서" },
      { "id": "do",       "optional": false, "description": "구현" },
      { "id": "qa",       "optional": false, "description": "검증" },
      { "id": "report",   "optional": false, "description": "최종 리포트" }
    ]
  },
  "gapThreshold": 0.90,
  "automation": { "level": "L2", "levels": ["L0","L1","L2","L3","L4"] },
  "advisor": { "__PLACEHOLDER__": "sub-plan 04에서 채움" }
}
```

### 2.2 State Machine (`lib/core/state-machine-v050.js`)

**export 하는 것**:
- `PIPELINE_ROLES = ['cbo', 'cpo', 'cto', 'cso', 'coo']` (CEO 제외 — 동적 라우팅 주체)
- `VALID_ROLES = ['ceo', 'cpo', 'cto', 'cso', 'cbo', 'coo', 'auto']`
- `PHASE_MACHINE`:
  ```js
  {
    ideation: { next: 'plan',   prerequisites: [],               optional: true,  outputs: ['{role}_{topic}.md'] },
    plan:     { next: 'design', prerequisites: [],               optional: false, outputs: ['REQUIREMENTS.md','SCOPE.md','TIMELINE.md'] },
    design:   { next: 'do',     prerequisites: ['plan'],         optional: false, outputs: ['DESIGN_SPEC.md','ARCHITECTURE.md'] },
    do:       { next: 'qa',     prerequisites: ['plan','design'],optional: false, outputs: ['IMPLEMENTATION.md','TEST_RESULTS.md'] },
    qa:       { next: 'report', prerequisites: ['do'],           optional: false, outputs: ['QA_REPORT.md','COMPLIANCE_REPORT.md'] },
    report:   { next: null,     prerequisites: ['qa'],           optional: false, outputs: ['FINAL_REPORT.md','RETROSPECTIVE.md'] }
  }
  ```
- 함수:
  - `validatePhaseTransition(currentPhase, nextPhase, completedPhases) → {valid, reason}`
  - `validateRoleTransition(fromRole, toRole, featureName) → {valid, reason}` (config `dependencies` 참조)
  - `initializeFeatureState(feature, startRole, startPhase) → stateObject`
  - `advancePhase(state) → newState` (PHASE_MACHINE.next 적용)

**특이**: ideation은 optional이므로 `validatePhaseTransition('ideation', 'plan', [])` 허용. ideation skip도 허용 (`validatePhaseTransition(null, 'plan', [])`).

### 2.3 Migration Engine (`lib/core/migration-engine.js`)

**역할**: 기존 `.vais/` 디렉토리에 남아있는 v0.49 상태 파일을 v0.50 스키마로 자동 변환.

**핵심 로직**:
1. `.vais/status.json` 존재 시 `metadata.version` 확인
2. `< 0.50` 이면 아래 변환 수행:
   - 모든 `cmo_*` feature → `cbo_*`로 rename (path + 내부 role 필드)
   - 모든 `cfo_*` feature → `cbo_*`로 rename
   - `agents.retrospective-writer` 레코드 제거
   - `agents.technical-writer` 레코드 제거
   - `cto.subAgents`에서 `release-engineer`, `performance-engineer` 제거 후 `coo.subAgents`에 추가
3. 변환 전 `.vais/_backup/v049-{timestamp}.tar.gz` 자동 생성
4. 실패 시 backup으로 자동 복원 + 에러 로그
5. `metadata.version = "0.50.0"` 갱신 후 저장

**API**:
```js
async function migrate({dryRun = false, force = false}) → {migrated: bool, warnings: [], errors: [], backupPath}
```

### 2.4 `lib/paths.js` 확장

**추가 규칙**:
- `ideationPath(role, topic)` → `docs/00-ideation/${role}_${topic}.md`
- `featureOutputPath(feature, phase, filename)` → `.vais/features/${feature}/outputs/${phase}/${filename}`
- `checkpointPath(feature, phase)` → `.vais/features/${feature}/checkpoints/${phase}.json`
- `resumePath(feature, timestamp)` → `.vais/features/${feature}/resume/${timestamp}.json`

**기존 규칙 유지**:
- `docs/01-plan/features/{feature}.plan.md`
- `docs/02-design/features/{feature}.design.md`
- `docs/03-analysis/...`, `docs/05-qa/...`, `docs/06-report/...`

### 2.5 버전 동기화

모두 `0.49.2` → `0.50.0`:
- `package.json` → `"version": "0.50.0"`
- `.claude-plugin/plugin.json` → `"version": "0.50.0"`
- `.claude-plugin/marketplace.json` → `"metadata.version"`, `"plugins[0].version"` 양쪽
- `vais.config.json` → `"version": "0.50.0"` (위 2.1 포함)
- `CHANGELOG.md` → `## [0.50.0] - 2026-04-16` 섹션 헤더만 추가 (본문은 sub-plan 09에서 완성)

---

## 3. 진입 시 신경 쓸 점

### 3.1 선행 sub-plan에서 물려받는 것
없음.

### 3.2 이 sub-plan이 다음으로 넘겨야 하는 보증
- 01이 `agents/cbo/*.md`를 만들 때 `vais.config.json` 경로가 선행해서 존재
- 02가 CTO 본체에서 release-engineer 제거 시 migration.js가 상태 파일도 자동 이관
- 05가 `docs/00-ideation/` 경로를 사용 가능
- 07에서 state-machine이 ideation/phase 전이를 이미 검증 가능

### 3.3 함정
- **config 먼저 vs agent markdown 먼저 치킨-에그**: config가 agent path를 참조하지만 실제 파일은 01/02 이후 생성된다. 해결: config validation은 01/02 완료 후 실행하는 것으로 gate 설계. 이 sub-plan에서는 "파일이 곧 생길 것을 전제로" config만 작성.
- **marketplace.json은 두 곳에 version**: `metadata.version` + `plugins[0].version`. 한쪽만 올리면 배포 시 CC가 캐시된 구버전 로드.
- **migration dry-run 먼저**: 실제 사용자 환경에 파일이 있으면 `{dryRun: true}`로 diff만 출력하고 사용자 승인 후 실제 실행. 테스트 픽스처에서만 `force: true` 허용.

---

## 4. 검증

- [ ] `node -e "require('./vais.config.json')"` 파싱 성공
- [ ] `vais.config.json` JSON schema 검증 (sub-plan 09에서 schema 확정 전이라도 최소 `cSuite.roles.length === 6` 확인)
- [ ] `lib/core/state-machine-v050.js` unit test: 6 phase transition 정상 + 3 invalid transition reject
- [ ] `lib/core/migration-engine.js` unit test: `cmo_feat_a` fixture → `cbo_feat_a` 변환 + backup 생성 확인
- [ ] 버전 4파일에서 `grep -c "0.50.0"` ≥ 1 각각
- [ ] `CHANGELOG.md`에 `## [0.50.0]` 섹션 헤더 존재

연결 SC: **SC-2, SC-3**

---

## 5. 다음 단계

- sub-plan **01** (CBO Agents) — 병렬 시작 가능
- sub-plan **02** (Existing C-Level Updates) — 병렬 시작 가능
- sub-plan **05** (Ideation Phase) — 병렬 시작 가능

선행 조건이 모두 00에 의존. 셋은 서로 독립이므로 순서 자유.
