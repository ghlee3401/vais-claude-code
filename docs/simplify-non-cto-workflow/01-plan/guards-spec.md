---
owner: cto
agent: cto-direct
artifact: guards-spec
phase: plan
feature: simplify-non-cto-workflow
generated: 2026-05-02
summary: "4 가드 (advisor/clevel-main/subdoc/ideation) 의 정확한 변경 spec. advisor 무변경, clevel-main 50% 단순화, subdoc 100% 재작성, ideation 30% 갱신."
---

# Guards Spec — 4 가드 변경 spec

## 한 줄 요약

`agents/_shared/` 의 4 가드 변경 정도 + 정확한 변경 항목.

## 1. `advisor-guard.md` — 무변경

**판단**: 새 모델과 직접 충돌 없음. sub-agent 가 직접 박제 시에도 advisor (Opus 4.6, ttl 5m, max_uses 3) 검토 가치 동일.

**유지 항목**:
- frontmatter `advisor:` 블록 (enabled / model / max_uses / caching)
- patch-advisor-frontmatter.js 스크립트
- 일부 sub-agent (ui-designer 등) 의 advisor 활성

**변경 X**.

## 2. `clevel-main-guard.md` — 50% 단순화

**판단**: main.md 가 인덱스만 갖게 되어 size budget / topic 분리 / 큐레이션 룰 무관. 핵심 (Decision Record append-only / owner / 다른 C-Level 섹션 미수정) 만 유지.

### 유지 항목 (5)

1. 진입 프로토콜 (main.md Read 필수)
2. Decision Record multi-owner (Owner 컬럼 필수, append-only)
3. 다른 C-Level 섹션 / Decision Record 행 / Artifacts 표 엔트리 수정·삭제 금지
4. owner frontmatter 필수 (enum: ceo/cpo/cto/cso/cbo/coo)
5. 재진입 (자기 섹션 교체 + `## 변경 이력` entry 필수)

### 변경 항목 (4)

| 옛 | 새 |
|----|----|
| Topic Documents 인덱스 | **Artifacts 표** (artifact / owner / agent / source / summary / 파일) |
| Topic 문서 frontmatter (owner/topic/phase) | artifact 문서 frontmatter (frontmatter-spec.md 8 필드) |
| Topic 프리셋 (vais.config.json > workflow.topicPresets) | **CEO 알고리즘 phase↔artifact 매핑** 으로 대체 |
| Size budget 200 lines + W-MAIN-SIZE refuse | **자연 충족** (인덱스만이라 200 안 넘음). W-MAIN-SIZE 룰 폐기 또는 warn |

### 폐기 항목 (1)

- `mainMdMaxLinesAction: "refuse"` enforcement → 폐기

## 3. `subdoc-guard.md` — 100% 재작성

**판단**: `_tmp` 모델 폐기 + 큐레이션 폐기 → 본문 거의 전체 재작성.

### 옛 spec (폐기)

- `_tmp/{slug}.md` scratchpad 박제
- 메타 헤더 3줄 (Author/Phase/Refs)
- templates/subdoc.template.md
- 한 줄 요약 첫 단락
- qualifier (.review/.audit/.draft)
- 큐레이션 기록 (✅/❌/✓)
- 영속성 (_tmp 보존 + git 커밋)

### 새 spec

```markdown
# SUB-DOC RULES (v2.x, sub-agent 직접 박제)

## 박제 위치

`docs/{feature}/{NN-phase}/{artifact}.md` (phase 폴더 안에 평면)

## 필수 (frontmatter 8 필드)

owner / agent / artifact / phase / feature / source / generated / summary
(자세한 형식은 frontmatter-spec.md)

## 박제 규약

- 1 sub-agent N artifact = N MD 파일 (예: market-researcher → pest.md / five-forces.md / swot.md)
- 본문 = sub-agent 결과 그대로 (압축 X)
- 파일 stem = `artifact` 필드 값

## 금지

- ❌ `_tmp/` 폴더 사용
- ❌ C-Level main.md 직접 Write/Edit
- ❌ 다른 sub-agent artifact 수정
- ❌ 큐레이션 기록 섹션 (`✅ 채택 / ❌ 거절 / ✓ 병합`)
- ❌ 한 파일에 N artifact 통합

## Handoff (C-Level 에 반환)

{
  "artifacts": [
    "docs/{feature}/{phase}/{name}.md",
    ...
  ]
}

## 영속성

artifact MD = 영구 보존 + git 커밋 (옛 _tmp 와 동일 추적성).
```

### patch 스크립트 영향

- `scripts/patch-subdoc-block.js` — sub-agent md 본문에 새 spec inline 주입
- 모든 sub-agent (37개) 본문의 옛 SUB-DOC RULES 블록 → 새 블록으로 교체

## 4. `ideation-guard.md` — 30% 갱신

### 유지 항목

- ideation phase 진입 시 가드
- 사용자 요청 정의
- 위험 분석 섹션

### 갱신 항목

| 옛 | 새 |
|----|----|
| Lake 명시 (사용자 명시) | **CEO 7 차원 알고리즘 자동 적용** (ceo-algorithm.md) |
| 사용자 phase/artifact 결정 | **CEO 가 결정 + AskUserQuestion 클릭 1번으로 사용자 확인** |
| 6 C-Suite 모두 검토 | **4 C-Suite 자동 + 2 선택** (CBO/COO 자동 라우팅 제외) |

## 적용 순서 (의존)

```
1. advisor-guard.md           무변경 — 가장 먼저 확인 (다른 항목 영향 없음)
2. clevel-main-guard.md       단순화 (size budget / topic 룰 폐기)
3. subdoc-guard.md            재작성 (frontmatter-spec / subdoc-spec 의존)
4. ideation-guard.md          갱신 (ceo-algorithm 의존)

5. patch 스크립트 실행:
   - patch-clevel-guard.js → 6 C-Level md 본문 갱신
   - patch-subdoc-block.js → 37 sub-agent md 본문 갱신
```

## 검증

- 각 가드 md 갱신 후 patch 스크립트 실행
- 6 C-Level md / 37 sub-agent md 본문에 새 spec 블록 주입 확인 (`grep "vais:subdoc-guard:begin"`)
- doc-validator 가 새 룰 (W-IDX-01 = Artifacts 표 / W-OWN = artifact frontmatter / W-MAIN-SIZE 폐기) 적용 확인

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-02 | 4 가드 변경 spec — advisor 무변경 / clevel-main 50% / subdoc 100% / ideation 30%. patch 스크립트 영향 + 적용 순서. |
