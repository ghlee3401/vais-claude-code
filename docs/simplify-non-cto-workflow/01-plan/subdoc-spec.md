---
owner: cto
agent: cto-direct
artifact: subdoc-spec
phase: plan
feature: simplify-non-cto-workflow
generated: 2026-05-02
summary: "sub-agent 가 phase 폴더에 직접 artifact MD 박제하는 규약. _tmp 폐기, 큐레이션 폐기, frontmatter 표준 의존."
---

# Subdoc Spec — sub-agent 직접 박제 규약

## 한 줄 요약

sub-agent 가 `docs/{feature}/{NN-phase}/{artifact}.md` 직접 작성. `_tmp` 폐기. 큐레이션 (채택/거절/병합) 폐기. 압축 0, 정보 손실 0.

## 박제 위치

| sub-agent N artifact | 파일 N개 |
|--------------------|--------|
| 1 artifact (예: `prd-writer` → prd) | 1 파일 (`docs/{feature}/01-plan/prd.md`) |
| N artifact (예: `market-researcher` → PEST + Five Forces + SWOT) | N 파일 (`pest.md` + `five-forces.md` + `swot.md`) |

각 artifact = 별도 MD. 한 파일 통합 금지 (거장 framework 분리 원칙).

## sub-agent 동작 흐름

```
C-Level 이 sub-agent 위임 (예: market-researcher 호출)
   ↓
sub-agent 가 자기 artifacts (예: PEST/Five Forces/SWOT) 각각 별도 MD 작성:
  - docs/{feature}/01-plan/pest.md (frontmatter + 본문)
  - docs/{feature}/01-plan/five-forces.md
  - docs/{feature}/01-plan/swot.md
   ↓
sub-agent → C-Level 에 handoff 반환:
  {
    artifacts: [
      "docs/{feature}/01-plan/pest.md",
      "docs/{feature}/01-plan/five-forces.md",
      "docs/{feature}/01-plan/swot.md"
    ]
  }
   ↓
C-Level 이 다른 sub-agent 도 위임 (예: prd-writer)
   ↓
모든 sub-agent 완료 후
   ↓
C-Level 이 main.md 작성 — 각 artifact md 의 frontmatter `summary` 만 읽고 인덱스 생성
```

## 박제 규약

### 필수

1. **frontmatter 8 필드 보유** (`frontmatter-spec.md` 참조)
2. **파일 stem = `artifact` 필드 값**
3. **본문 압축 X** — sub-agent 결과 그대로
4. **위치 = `docs/{feature}/{NN-phase}/{artifact}.md`** (phase 폴더 안에 평면)

### 금지

- ❌ `_tmp/` 폴더 사용 (폐기)
- ❌ C-Level main.md 직접 Write/Edit (C-Level 단독)
- ❌ 다른 sub-agent artifact 수정 (race 방지)
- ❌ 큐레이션 기록 섹션 (`✅ 채택 / ❌ 거절 / ✓ 병합`) (폐기)
- ❌ 한 파일에 N artifact 통합 (거장 분리 원칙)

## C-Level 의 main.md 작성 (sub-agent 결과 종합)

```
C-Level 이 phase 의 모든 sub-agent 완료 받음
   ↓
docs/{feature}/{NN-phase}/ 폴더 스캔
   ↓
각 artifact md 의 frontmatter 만 Read (본문 X)
   ↓
main.md 작성:
  - Executive Summary
  - Decision Record (multi-owner)
  - Artifacts 표 (artifact / owner / agent / source / summary 컬럼) ← frontmatter 만으로 작성
  - Next Phase
```

→ C-Level 이 본문 N×1500자 다 읽지 않고 frontmatter 8 필드만 → 토큰 ↓ 약 50%.

## 큐레이션 폐기의 의미

옛 모델 (`_tmp` + 큐레이션):
- C-Level 이 sub-agent 결과를 "채택/거절/병합" 판단
- 거절 시 일부 정보 손실
- 병합 시 압축 (토큰 ↓ but 정보 ↓)

새 모델:
- sub-agent artifact = **그 자체로 산출물** (인용 가치)
- C-Level 이 sub-agent 결과 부정확하다고 판단하면 → **sub-agent 재호출** (요약 X)
- artifact md 자체에 "왜 이 결과인지" 본문 보존

## sub-agent md 영향

기존 `agents/{c-level}/{sub-agent}.md` 의 `includes: _shared/subdoc-guard.md` 는 그대로 유지. 단 subdoc-guard.md 본문이 새 모델 spec 로 갱신됨 (parameter `artifact` / `phase` / 박제 위치 등).

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-02 | sub-agent 직접 박제 규약 정의. _tmp/큐레이션 폐기. 박제 위치 / 흐름 / 규약 / C-Level 의 main.md 작성 방식. |
