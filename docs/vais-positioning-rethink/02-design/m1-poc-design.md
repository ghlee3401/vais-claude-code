---
owner: cto
artifact: m1-poc-design
phase: design
feature: vais-positioning-rethink
---

# M1 PoC Design — Lazy-load Negative Test

> H4 가정 검증을 위한 negative test 절차 + manual @include fallback 설계.

## §1. PoC Negative Test — 3 단계 절차

### Step 1 — Stub 박제 + signature 검색 (PASS A)

```
1. 파일 생성: agents/ceo/knowledge/rumelt-strategy-kernel.md
   frontmatter: owner=ceo, artifact=rumelt-strategy-kernel, phase=knowledge, feature=v0.66-poc
   본문 (300 자 minimal):
     # Rumelt Strategy Kernel
     Diagnosis + Guiding Policy + Coherent Actions 인과 사슬.
     <!-- POC_SIGNATURE: RUMELT_KERNEL_LOADED -->

2. 일반 vais 컨텍스트에서 CEO agent 호출:
   /vais ceo plan poc-test-feature
   → CEO 응답 본문 검색

3. 결과 평가:
   - signature "RUMELT_KERNEL_LOADED" 응답에 등장 → Step 2 진행
   - 부재 → 즉시 FAIL → manual fallback
```

### Step 2 — 파일명 변경 + 재호출 (PASS B = negative test 핵심)

```
1. 파일명 변경: rumelt-strategy-kernel.md → rumelt-renamed.md
   (본문은 동일, signature 그대로 유지)

2. 재호출: /vais ceo plan poc-test-feature-2 (다른 feature)
   → CEO 응답 검색

3. 결과 평가:
   - signature 부재 → ✅ TRUE LAZY-LOAD (autonomous discovery 동작)
   - signature 등장 → ❌ agent 가 다른 경로로 접근 (manual @include 필요)
```

### Step 3 — 결과 매트릭스 + 의사 결정

| Step 1 | Step 2 | 판정 | Action |
|--------|--------|------|--------|
| PASS (signature 등장) | PASS B (이름 변경 시 부재) | ✅ AUTONOMOUS DISCOVERY | M1-A 5 박제 진행 (W1 D5 부터) |
| PASS | FAIL B (이름 변경에도 등장) | 🟡 STATIC INCLUDE | manual @include fallback 즉시 전환 |
| FAIL | — | ❌ NO LOAD | manual @include fallback 즉시 전환 |

### Cleanup (PoC 후)

- `rumelt-renamed.md` 삭제 (PoC 잔재)
- 정식 박제 시 W1 D5 의 `rumelt-strategy-kernel.md` 작업으로 대체

## §2. Manual @include Fallback 설계

### 적용 시나리오

PoC FAIL (Step 1 또는 Step 2-FAIL) 시 즉시 전환.

### 구조 변경

각 C-Level agent .md 의 `Knowledge Index` 섹션 강화:

#### Before (v0.65 Wisdom Split — autonomous 가정)

```markdown
## Knowledge Index (v0.65, lazy-load)

| Knowledge | 사용 시점 | 경로 |
|-----------|----------|------|
| Rumelt Strategy Kernel | strategy 결정 시 | agents/ceo/knowledge/rumelt-strategy-kernel.md |
```

#### After (manual @include — 명시 Read 지시)

```markdown
## Knowledge Index (v0.66, manual @include fallback)

| Knowledge | 사용 조건 | 명시 행동 |
|-----------|---------|---------|
| Rumelt Strategy Kernel | phase=plan AND artifact 이 strategy/vision 관련 | **Read agents/ceo/knowledge/rumelt-strategy-kernel.md 먼저** 그 후 답변 작성 |
| OKR (Doerr) | phase=design AND OKR 작성 시 | **Read agents/ceo/knowledge/okr.md** |

### 사용 절차 (manual fallback 시)

1. CEO agent 호출 시 frontmatter 의 phase + artifact 확인
2. 위 표에서 매칭되는 knowledge 가 있으면 **즉시 Read**
3. 컨텍스트로 통합 후 답변 작성
4. 답변에 "Knowledge: rumelt-strategy-kernel.md 참조" 명시
```

### Trade-off

| 항목 | autonomous | manual |
|------|----------|--------|
| 정확성 | 자동 매칭 (phase/artifact 휴리스틱 신뢰) | 명시 (정확) |
| 효율성 | 자동 — agent 부담 X | agent 가 매번 매칭 표 검사 |
| 디버깅 | 안 됐을 때 원인 추적 어려움 | "Read 했나?" 즉시 확인 가능 |
| 사용자 경험 | 매끄러움 | 응답에 "Knowledge: X 참조" 노출 (정직한 traceability) |

### 결론

manual fallback 은 **정직한 차선책** — autonomous 보다 매끄럽지 못해도 동작 보장 + 디버깅 용이. M1-A 박제의 효용 (OJT 깊이) 자체는 동일.

## §3. 검증 후 결정 분기

| PoC 결과 | M1-A 박제 형식 | Sprint W1 D2 부터 |
|---------|------------|------------------|
| ✅ AUTONOMOUS | v0.65 Wisdom Split 그대로 | M0 hook 작업 진행 (계획대로) |
| 🟡/❌ STATIC/NO LOAD | manual @include 형식 | M0 hook 작업 + 각 C-Level agent .md 의 Knowledge Index 명시 강화 (병행) |

> 두 경우 모두 W1 D5 의 CEO `rumelt-strategy-kernel.md` 정식 박제는 진행. 차이는 *형식* 만 (autonomous vs manual). 콘텐츠 (OJT 4 요소) 는 동일.

## §4. PoC 시간 추정

| Step | 작업 | 시간 |
|------|------|------|
| Setup | stub 작성 (300 자) + frontmatter | 15 분 |
| Step 1 | CEO agent 호출 + signature 검색 | 5 분 |
| Step 2 | 파일명 변경 + 재호출 + 결과 평가 | 10 분 |
| Cleanup | renamed 파일 삭제 | 2 분 |
| 결과 박제 | poc-result.md (Do phase) | 30 분 |
| Fallback 전환 (FAIL 시) | 6 agent .md 의 Knowledge Index 갱신 | 60 분 |

**Total**: PASS = ~1 시간, FAIL = ~2 시간 (W1 D1 4 시간 budget 내).

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-09 | 초기 작성 — 3 단계 negative test 절차 + manual @include fallback 설계 + 시간 추정 |
