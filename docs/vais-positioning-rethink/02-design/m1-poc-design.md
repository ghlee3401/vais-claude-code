---
owner: cto
artifact: m1-poc-design
phase: design
feature: vais-positioning-rethink
---

# M1 PoC Design — Lazy-load Negative Test (v2.0 Lean)

> H4 가정 검증을 위한 negative test 절차 + manual @include fallback.

## §1. PoC Negative Test — 3 단계 절차

### Step 1 — Stub 박제 + signature 검색 (PASS A)

1. 파일 생성: `agents/ceo/knowledge/rumelt-strategy-kernel.md` (frontmatter 4 필드 + 본문 300 자 + signature comment `<!-- POC_SIGNATURE: RUMELT_KERNEL_LOADED -->`)
2. CEO agent 호출: `/vais ceo plan poc-test-feature` → 응답 본문 검색
3. signature 등장 → Step 2 진행 / 부재 → 즉시 FAIL → manual fallback

### Step 2 — 파일명 변경 + 재호출 (negative test 핵심)

1. 파일명 변경: `rumelt-strategy-kernel.md` → `rumelt-renamed.md` (본문/signature 동일)
2. 재호출: `/vais ceo plan poc-test-feature-2` → 응답 검색
3. signature 부재 → ✅ TRUE LAZY-LOAD / 등장 → ❌ static include — manual @include 필요

### Step 3 — 결과 매트릭스

| Step 1 | Step 2 | 판정 | Action |
|--------|--------|------|--------|
| PASS | PASS B (이름 변경 시 부재) | ✅ AUTONOMOUS | M1-A 박제 진행 (W1 D5 부터) |
| PASS | FAIL B (이름 변경에도 등장) | 🟡 STATIC | manual @include fallback 즉시 전환 |
| FAIL | — | ❌ NO LOAD | manual @include fallback 즉시 전환 |

### Cleanup (PoC 후)

`rumelt-renamed.md` 삭제. 정식 박제는 W1 D5 의 `rumelt-strategy-kernel.md` 작업으로 대체.

## §2. Manual @include Fallback (FAIL 시 전환)

각 C-Level agent .md 의 `Knowledge Index` 섹션을 *literal Read 지시* 형태로 변경:

```markdown
| Knowledge | 사용 조건 | 명시 행동 |
|-----------|---------|---------|
| Rumelt Strategy Kernel | phase=plan AND artifact 이 strategy/vision | **Read agents/ceo/knowledge/rumelt-strategy-kernel.md** 후 답변 |
```

sub-agent 가 phase 매칭 시 Read 도구로 명시 호출. 응답에 "Knowledge: rumelt-strategy-kernel.md 참조" 명시 (정직한 traceability).

> 콘텐츠 (OJT 4 요소) 동일, 형식만 다름. autonomous 보다 매끄럽지 못해도 동작 보장 + 디버깅 용이.

## §3. PoC 후 Sprint W1 분기

| 결과 | M1-A 박제 형식 | W1 D2~ |
|------|------------|--------|
| ✅ AUTONOMOUS | v0.65 Wisdom Split 그대로 | M0 hook 작업 (계획대로) |
| 🟡/❌ STATIC/NO LOAD | manual @include 형식 | M0 hook + 6 agent .md Knowledge Index 강화 (병행) |

두 경우 모두 W1 D5 의 CEO 정식 박제 진행. 콘텐츠 동일.

## §4. PoC 시간 추정

PASS ~1 시간 / FAIL (manual fallback 전환 — 6 agent .md 갱신 포함) ~2 시간. **W1 D1 4 시간 budget 내 충분**.

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-09 | 초기 작성 — 4 sub-section, 137 줄 |
| v2.0 | 2026-05-09 | **Lean Rewrite** — §1 절차 압축 (코드 블록 제거), §2 manual fallback Before/After + Trade-off 표 폐기 (5 줄로), §4 시간 1 줄. 137 → ~75 |
