---
owner: cto
agent: cto-direct
artifact: subdoc-guard-canonical
phase: design
feature: simplify-non-cto-workflow
generated: 2026-05-02
summary: "subdoc-guard.md 의 새 정본 본문. patch-subdoc-block.js 가 37 sub-agent md 본문에 inline 주입."
---

# subdoc-guard.md Canonical Body

## 적용 위치

- 정본: `agents/_shared/subdoc-guard.md` (canonical)
- inline 주입: 37 sub-agent md 본문의 `<!-- vais:subdoc-guard:begin -->` ~ `<!-- vais:subdoc-guard:end -->` 사이
- 주입 스크립트: `scripts/patch-subdoc-block.js`

## 정본 본문 (canonical, copy-paste)

````markdown
<!-- vais:subdoc-guard:begin — injected by scripts/patch-subdoc-block.js. Do not edit inline; update agents/_shared/subdoc-guard.md and re-run the script. -->
## SUB-DOC RULES (v2.x, sub-agent 직접 박제)

canonical: `agents/_shared/subdoc-guard.md`. `scripts/patch-subdoc-block.js` 로 본문 inline 주입.

### 박제 위치

`docs/{feature}/{NN-phase}/{artifact}.md` (phase 폴더 안에 평면, slug = frontmatter `artifact` 필드)

### 필수 — frontmatter 8 필드

```yaml
---
owner: {c-level}            # ceo|cpo|cto|cso|cbo|coo
agent: {sub-agent-slug}      # 예: prd-writer
artifact: {artifact-name}    # 파일 stem 과 일치
phase: {ideation|plan|design|do|qa|report}
feature: {feature-name}      # kebab-case
source: "{외부 거장 source}" # 외부 자료 흡수 sub-agent 만, 자체 작성 시 생략
generated: YYYY-MM-DD
summary: "{≤200자 한 줄 요약}"
---
```

### 박제 규약

1. 1 sub-agent 의 N artifact = N MD 파일
   - 예: `market-researcher` → `pest.md` + `five-forces.md` + `swot.md`
2. 본문 = sub-agent 결과 그대로. 압축 X. 큐레이션 X.
3. 파일 stem = `artifact` 필드 값
4. 위치 = `docs/{feature}/{NN-phase}/{artifact}.md`
5. **Phase 폴더 매핑**: ideation→00-ideation / plan→01-plan / design→02-design / do→03-do / qa→04-qa / report→05-report

### 금지

- ❌ `_tmp/` 폴더 사용 (v0.57 모델 폐기)
- ❌ C-Level main.md 직접 Write/Edit (C-Level 단독)
- ❌ 다른 sub-agent artifact 수정 (race 방지)
- ❌ 큐레이션 기록 섹션 (`✅ 채택 / ❌ 거절 / ✓ 병합`) (폐기)
- ❌ 한 파일에 N artifact 통합 (거장 framework 분리 원칙)
- ❌ 빈 파일 / 500B 미만 (정보 부족)

### Handoff (C-Level 에 반환)

```json
{
  "artifacts": [
    "docs/{feature}/{phase}/{name}.md",
    ...
  ]
}
```

`scratchpadPath` 필드는 v0.57 호환용으로 빈 문자열 반환 가능. v2.x 클라이언트는 무시.

### 영속성

artifact MD = 영구 보존 + git 커밋 (옛 _tmp 와 동일 추적성). 거장 framework 별로 1 파일이라 grep 쉬움.

<!-- subdoc-guard version: v2.0 -->
<!-- vais:subdoc-guard:end -->
````

## v0.57 → v2.0 변경 비교

| 항목 | v0.57 (옛) | v2.0 (새) |
|------|----------|----------|
| 박제 위치 | `_tmp/{slug}.md` | `docs/{feature}/{phase}/{artifact}.md` |
| 메타 헤더 | `> Author:` / `> Phase:` / `> Refs:` | frontmatter 8 필드 |
| 본문 형식 | `templates/subdoc.template.md` | 자유 (sub-agent 결과 그대로) |
| 최소 크기 | 500B | (제거) |
| Qualifier | `.review` / `.audit` / `.draft` | (제거 — 별도 artifact 로 분리) |
| 큐레이션 | 필수 | 폐기 |
| Handoff | scratchpadPath + summary + artifacts | artifacts 배열만 (scratchpathPath 빈 문자열 호환) |

## patch-subdoc-block.js 적용 흐름

```bash
1. node scripts/patch-subdoc-block.js --dry-run
   → 37 sub-agent md 의 <!-- vais:subdoc-guard:* --> 블록 미리보기
2. node scripts/patch-subdoc-block.js
   → 일괄 교체
3. git diff agents/ — 검증
4. 회귀 테스트 — 1 sub-agent 호출 → 새 위치 박제 확인
```

## Rollback

```bash
node scripts/patch-subdoc-block.js --legacy
   → v0.57 블록 복원 (rollback 시나리오)
```

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-02 | subdoc-guard 새 정본 본문 (copy-paste 가능). v0.57 → v2.0 비교 + patch 스크립트 흐름 + rollback. |
