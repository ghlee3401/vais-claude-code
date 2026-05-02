---
owner: cto
agent: cto-direct
artifact: main-md-template
phase: design
feature: simplify-non-cto-workflow
generated: 2026-05-02
summary: "templates/main-md.template.md 정확 마크다운 (5 섹션 표준). C-Level 이 phase main.md 작성 시 placeholder 채움."
---

# main-md.template.md (정본)

## 적용 위치

`templates/main-md.template.md` (신규)

## 정본 마크다운

````markdown
---
owner: {c-level}             # ceo|cpo|cto|cso (이 phase 책임)
agent: {c-level}-direct
artifact: phase-index
phase: {phase}               # ideation|plan|design|do|qa|report
feature: {feature}
generated: {YYYY-MM-DD}
summary: "{phase 한 줄 요약 ≤200자}"
---

# {feature} — {Phase Name} (인덱스)

> Phase: {icon} {phase} | Owner: {C-Level} | Date: {date}
> 참조: {이전 phase main.md 링크}

## 1. Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | {1~2문장} |
| **Solution** | {1~2문장} |
| **Effect** | {사용자 체감 변화} |
| **Core Value** | {핵심 가치} |

## 2. Decision Record (multi-owner)

| # | Decision | Owner | Rationale | Source artifact |
|---|----------|:-----:|-----------|----------------|
| 1 | {결정 한 줄} | {c-level} | {근거} | `{artifact}.md` |

> 이전 phase 의 Decision 은 그대로 유지 (append-only). 자기 결정만 새 행 추가.

## 3. Artifacts (이 phase 박제 자료)

> sub-agent 가 직접 박제한 artifact 들의 인덱스. C-Level 이 frontmatter 만 읽고 표 자동 생성.

| Artifact | Owner | Agent | Source 거장 | 한 줄 요약 | 파일 |
|----------|:-----:|:-----:|:----------:|----------|------|
| {name} | {owner} | {agent} | {source 또는 —} | {summary} | [`{name}.md`](./{name}.md) |

> 표 행 순서: 알파벳 또는 frontmatter `priority` 필드 (있으면)

## 4. CEO 판단 근거 (왜 이 artifact 들이 이 phase 에)

- 포함: {sub-agent A 활성 이유 1줄}
- 포함: {sub-agent B 활성 이유}
- 제외: {제외된 차원 — 이유}

> CEO ideation 의 7 차원 결과 참조. 매 피처 같은 알고리즘.

## 5. Next Phase

→ **{next-phase}** ({다음 책임 C-Level} 진입)

다음 phase 의 예상 artifact (CEO ideation 박제 기준):
- {artifact 1}
- {artifact 2}
- ...

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | {date} | 초기 작성 — {간단 설명} |
````

## 자동 채우기 알고리즘

C-Level 이 phase main.md 작성 시:

```javascript
async function writePhaseMain(feature, phase, owner) {
  // 1. ideation 박제 Read (CEO 결정 가져오기)
  const ideationDoc = readMd(`docs/${feature}/00-ideation/main.md`);
  const ceoDecision = parseFrontmatter(ideationDoc).artifactPlan;
  
  // 2. 현재 phase 의 artifact MD 들 스캔
  const artifactDir = `docs/${feature}/${NN-phase}/`;
  const artifactFiles = glob(`${artifactDir}*.md`).filter(f => !f.endsWith('main.md'));
  
  // 3. 각 artifact frontmatter 추출
  const artifactRows = artifactFiles.map(f => {
    const fm = parseFrontmatter(readMd(f));
    return {
      artifact: fm.artifact,
      owner: fm.owner,
      agent: fm.agent,
      source: fm.source || '—',
      summary: fm.summary,
      file: path.basename(f),
    };
  });
  
  // 4. 정렬 (alphabetical)
  artifactRows.sort((a, b) => a.artifact.localeCompare(b.artifact));
  
  // 5. 템플릿 채우기
  const main = renderTemplate('templates/main-md.template.md', {
    feature,
    phase,
    owner,
    artifactRows,
    ceoDecisionContext: ceoDecision.filter(p => p.phase === phase),
    nextPhase: getNextPhase(phase),
  });
  
  // 6. 박제
  writeMd(`${artifactDir}main.md`, main);
}
```

## Decision Record append-only 보장

기존 main.md 가 있으면 (재진입 시):

```javascript
function appendDecisionRecord(existingMain, newDecision) {
  const existingRecords = parseDecisionTable(existingMain);
  // 기존 행 수정 X
  existingRecords.push(newDecision);
  return renderDecisionTable(existingRecords);
}
```

## Artifacts 표 자동 갱신

phase 재진입 시 (sub-agent 추가 호출 후):

```javascript
function refreshArtifactsTable(feature, phase) {
  const fresh = scanArtifactFiles(feature, phase);
  return renderArtifactsTable(fresh); // 기존 행 덮어쓰기 (frontmatter 가 source-of-truth)
}
```

## 분량 검증

doc-validator 의 W-MAIN-SIZE = warn (refuse 아님). 200줄 초과 시 가이드 경고만.

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-02 | main-md.template.md 정본 + 자동 채우기 알고리즘 + Decision append-only + Artifacts 자동 갱신. |
