---
owner: cto
agent: cto-direct
artifact: validator-rules
phase: design
feature: simplify-non-cto-workflow
generated: 2026-05-02
summary: "doc-validator.js 룰 4 갱신 + 1 폐기 spec. W-MAIN-SIZE warn / W-IDX-01 갱신 / W-OWN 갱신 / W-SCOPE 단순화 / W-FRONT 신규."
---

# Validator Rules — doc-validator.js 룰 변경

## 적용 위치

`scripts/doc-validator.js`

## 룰 변경 매트릭스

| 룰 ID | 옛 동작 | 새 동작 | 변경 정도 |
|-------|--------|--------|---------|
| W-SCOPE-01 | "## 요청 원문" 섹션 누락 시 fail | CEO ideation 박제로 자동 충족 → 룰 단순화 (warn) | 50% |
| W-SCOPE-02 | "## In-scope" 섹션 누락 fail | CEO ideation artifactPlan 으로 대체 → warn | 50% |
| W-SCOPE-03 | "## Out-of-scope" 섹션 누락 fail | warn 또는 폐기 | 80% |
| W-MAIN-SIZE | main.md > 200 lines refuse | 인덱스 모델로 자연 충족 → warn | 90% |
| W-IDX-01 | "Topic Documents" 섹션 검사 | **"Artifacts" 섹션 검사** (frontmatter 자동 추출) | 100% |
| W-OWN-01 | topic 문서 frontmatter `owner` 누락 | **artifact 문서 frontmatter `owner` 누락** | 30% (대상 변경) |
| W-OWN-02 | topic 문서 `owner` ∉ enum | **artifact 문서 `owner` ∉ enum** | 30% |
| W-MRG-02 | Decision Record Owner 컬럼 누락 | 동일 | 무변경 |
| W-MRG-03 | owner 섹션 0개 + topic 2+ 개 | 동일 (topic → artifact) | 30% |
| W-TPC-01 | "## 큐레이션 기록" 섹션 누락 warn | **폐기** (큐레이션 모델 자체 없음) | 100% (폐기) |
| **W-FRONT** (신규) | — | artifact 문서 frontmatter 8 필드 검증 (owner / agent / artifact / phase / feature / source / generated / summary) | 신규 |

## 코드 변경 (의사 코드)

### W-FRONT 신규 룰

```javascript
function validateArtifactFrontmatter(filePath) {
  const fm = parseFrontmatter(readFile(filePath));
  const required = ['owner', 'agent', 'artifact', 'phase', 'feature', 'generated', 'summary'];
  const conditional = ['source']; // 외부 자료 흡수 sub-agent 만 필수
  const errors = [];
  
  // 필수 7 필드 검사
  for (const field of required) {
    if (!fm[field]) errors.push({ code: 'W-FRONT-01', field, message: `frontmatter ${field} 누락` });
  }
  
  // owner enum
  const ownerEnum = ['ceo', 'cpo', 'cto', 'cso', 'cbo', 'coo'];
  if (fm.owner && !ownerEnum.includes(fm.owner)) {
    errors.push({ code: 'W-FRONT-02', message: `owner '${fm.owner}' ∉ enum` });
  }
  
  // phase enum
  const phaseEnum = ['ideation', 'plan', 'design', 'do', 'qa', 'report'];
  if (fm.phase && !phaseEnum.includes(fm.phase)) {
    errors.push({ code: 'W-FRONT-03', message: `phase '${fm.phase}' ∉ enum` });
  }
  
  // 파일 stem = artifact
  const stem = path.basename(filePath, '.md');
  if (fm.artifact && fm.artifact !== stem && stem !== 'main') {
    errors.push({ code: 'W-FRONT-04', message: `artifact '${fm.artifact}' ≠ 파일 stem '${stem}'` });
  }
  
  // summary 길이
  if (fm.summary && fm.summary.length > 200) {
    errors.push({ code: 'W-FRONT-05', message: `summary > 200자 (${fm.summary.length})`, severity: 'warn' });
  }
  
  return errors;
}
```

### W-IDX-01 갱신 (Topic → Artifacts)

```javascript
// 옛: function validateTopicDocsSection(mainMdPath) { ... }
// 새: 

function validateArtifactsSection(mainMdPath) {
  const content = readFile(mainMdPath);
  const hasArtifactsSection = /^## \d+\. Artifacts/m.test(content) || /^## Artifacts/m.test(content);
  if (!hasArtifactsSection) {
    return [{ code: 'W-IDX-01', message: 'main.md 에 "Artifacts" 섹션 누락 (frontmatter 기반 자동 생성 필요)' }];
  }
  return [];
}
```

### W-MAIN-SIZE warn 으로 강등

```javascript
// vais.config.json:
//   cLevelCoexistencePolicy.mainMdMaxLinesAction: "refuse" → "warn"

function validateMainMdSize(filePath) {
  const lines = countLines(filePath);
  const limit = config.cLevelCoexistencePolicy.mainMdMaxLines || 200;
  if (lines > limit) {
    return [{
      code: 'W-MAIN-SIZE',
      message: `main.md ${lines} lines exceeds ${limit}; consider artifact split`,
      severity: 'warn', // refuse 아님
    }];
  }
  return [];
}
```

### W-TPC-01 폐기

```javascript
// 옛: function validateCurationRecord(topicPath) { ... }
// 새: (함수 자체 폐기)
```

### W-SCOPE 단순화

```javascript
function validateScope(planMainPath) {
  // 옛: 3 섹션 (요청 원문 / In-scope / Out-of-scope) 모두 fail
  // 새: ideation 박제 (artifactPlan) 가 있으면 자동 충족
  const ideationPath = planMainPath.replace('01-plan/main.md', '00-ideation/main.md');
  if (existsSync(ideationPath)) {
    const ideation = parseFrontmatter(readFile(ideationPath));
    if (ideation.summary && /artifactPlan/.test(readFile(ideationPath))) {
      return []; // CEO ideation 으로 충족
    }
  }
  // ideation 없으면 warn (refuse 아님)
  return [{ code: 'W-SCOPE-01', severity: 'warn', message: '권장: CEO ideation 박제 또는 ## 요청 원문 섹션' }];
}
```

## doc-validator 호출 인터페이스 변경

```javascript
// 옛
node scripts/doc-validator.js {feature}

// 새 (호환 유지)
node scripts/doc-validator.js {feature}
node scripts/doc-validator.js {feature} --strict      # legacy fail 모드
node scripts/doc-validator.js {feature} --check-frontmatter  # W-FRONT 만
```

## vais.config.json 영향

```json
{
  "cLevelCoexistencePolicy": {
    "mainMdMaxLinesAction": "warn",  // 옛 "refuse" → "warn"
    "_comment_v2": "v2.x — main.md = 인덱스만 → 자연 충족"
  },
  "scopeContractPolicy": {
    "enforcement": "warn",  // 옛 "fail" → "warn"
    "_comment_v2": "v2.x — CEO ideation 박제로 대체"
  },
  "subDocPolicy": {
    "_comment_v2": "v2.x — _tmp/큐레이션 폐기. requireCurationRecord 무관",
    "requireCurationRecord": false
  }
}
```

## 회귀 테스트

| # | 시나리오 | 기대 |
|---|---------|------|
| V-1 | artifact md frontmatter 8 필드 모두 있음 | 통과 |
| V-2 | artifact md frontmatter `owner` 누락 | W-FRONT-01 ERROR |
| V-3 | artifact md `owner: invalid` | W-FRONT-02 ERROR |
| V-4 | artifact md `phase: invalid` | W-FRONT-03 ERROR |
| V-5 | artifact md 파일 stem ≠ artifact | W-FRONT-04 ERROR |
| V-6 | artifact md summary > 200자 | W-FRONT-05 WARN |
| V-7 | main.md 250줄 (옛 refuse) | W-MAIN-SIZE WARN (자연 충족 권장) |
| V-8 | main.md "Artifacts" 섹션 누락 | W-IDX-01 ERROR |
| V-9 | main.md "큐레이션 기록" 섹션 누락 | (룰 폐기 — 통과) |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-02 | doc-validator 룰 변경 매트릭스 + W-FRONT 신규 + W-IDX-01/W-OWN/W-MAIN-SIZE/W-SCOPE 갱신 + W-TPC-01 폐기. vais.config.json 영향. 회귀 9 시나리오. |
