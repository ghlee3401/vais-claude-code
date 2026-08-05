---
owner: cto
artifact: poc-result
phase: do
feature: vais-positioning-rethink
---

# H4 Lazy-load PoC 결과 — Manual @include 채택

> Sprint v2 W1 D1 — empirical finding 으로 즉시 결정. Step 2 negative test 불필요.

## §1. 검증 절차 (단축)

원래 계획 = 3 단계 negative test (stub 박제 → signature 검색 → 파일명 변경 재검증). 그러나 **source-of-truth empirical 증거** 로 Step 1 진행 전에 결과 결정 가능:

### 증거 1 — `vais.config.json` 명세

```json
{
  "knowledgePath": "agents/{role}/knowledge/",
  "_knowledgePath_description": "0.65.x — C-Level 도메인 지식 lazy-load 경로. C-Level 메인 .md 의 'Knowledge Index' 섹션이 이 경로 하위 MD 들을 참조. phase + artifact 매칭 시만 Read."
}
```

→ design intent 자체가 *"agent 가 명시 Read 한다"* — autonomous discovery 가 아닌 manual reference 구조.

### 증거 2 — Runtime 코드 부재

`lib/`, `hooks/`, `scripts/` 전체 grep:

```bash
grep -rn "knowledge.*load\|inject\|scan\|discover" lib/ hooks/ scripts/  # 결과 없음
grep -rn "agents.*knowledge" lib/ hooks/ scripts/                       # 결과 없음
```

→ knowledge 파일을 **자동 로드하는 runtime 코드 없음**. plugin 아키텍처 자체가 manual @include.

### 증거 3 — CEO ceo.md Knowledge Index 누락

현재 `agents/ceo/ceo.md` 의 Knowledge Index 표:

| Knowledge | 사용 시점 | 경로 |
|-----------|----------|------|
| 7 차원 동적 라우팅 알고리즘 | ideation phase | seven-dimension-routing.md |
| Absorb Rubric | absorb 모드 | absorb-rubric.md |

→ 본 PoC 의 `rumelt-strategy-kernel.md` 가 **Knowledge Index 에 등재되지 않음**. autonomous 라면 file system scan 으로 발견됐겠지만, 현재 모델은 ceo.md 의 Index 만 참조.

## §2. 결정 매트릭스 (m1-poc-design §1 Step 3)

| Step 1 결과 | Step 2 결과 | 판정 | Action |
|------------|------------|------|--------|
| ❌ Empirical 증거 (코드 부재) | — | **❌ NO LOAD** | **manual @include fallback 즉시 전환** |

## §3. Manual @include 적용 — Sprint W1 작업

### 즉시 적용 (W1 D1 잔여)

`agents/ceo/ceo.md` Knowledge Index 갱신 — Rumelt entry 추가 + 모든 entry 에 *literal Read 지시* 명시.

### W1 D5 + W2 (M1-A 정식 박제 시)

각 C-Level 의 정식 박제 후 해당 agent .md 의 Knowledge Index 동시 갱신:
- W1 D5: CEO `rumelt-strategy-kernel.md` 정식 (3000~5000 자) + ceo.md Index 갱신 (이미 W1 D1 에 placeholder 추가됨)
- W2 D1-2: CPO `prd-writing-ojt.md` + cpo.md Index 추가
- W2 D3: CTO `architecture-decision.md` + cto.md Index 추가

### Stub 처리

`agents/ceo/knowledge/rumelt-strategy-kernel.md` (PoC 시 작성한 ~300자 stub) → W1 D5 정식 박제로 *대체* (확장). 삭제 X.

## §4. 시간 절감

design §4 시간 추정: PASS ~1h / FAIL ~2h. 실제: **~30 분** (empirical evidence 단축).

→ W1 D1 잔여 시간 (~3.5h) 으로 M0 status.json 스키마 + working-notes hook 작업 시작 가능 (계획보다 앞당김).

## §5. PRD/Design 정합 영향

PRD v2.0 §5: *"PASS → 5 박제 GO. FAIL → manual `@include` fallback 즉시 전환."* — 이미 두 시나리오 모두 spec 됨. PRD 갱신 불필요.

m0-design.md / m1-poc-design.md: 변경 없음 (manual fallback 설계가 본 결과의 행동 설계).

cto-tech-plan.md §4 Sprint v2 W1: D1 의 작업이 30 분 단축 → D2~D3 작업 2 시간 일찍 시작.

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-09 | 초기 작성 — H4 PoC empirical 결정 (manual @include 채택). Step 1 진행 전 source-of-truth 로 결정 |
