# Rumelt Strategy Kernel — CEO 부서장 OJT 매뉴얼

> **박제 깊이**: framework 정의 + 실무 운영 단계 + 의사결정 패턴 + 산출물 양식 (OJT 4 요소).
> **출처**: Richard Rumelt *Good Strategy Bad Strategy* (2011, Crown Business).
> **사용 시점**: 신규 서비스 전략 / 재포지셔닝 / 위기 대응 / 정체성 재정의 결정 시.
> **현재 상태**: 정식 박제 v2.0 (W1 D5, vais-positioning-rethink Sprint).

---

## 1. Framework 정의

### 1.1 Strategy Kernel 의 핵심

전략 = **Diagnosis + Guiding Policy + Coherent Actions** 의 인과 사슬. 한 줄 정의:

> *"전략은 도전을 단순화한 진단(Diagnosis) → 진단에 응답하는 trade-off 명시 정책(Guiding Policy) → 정책을 실행하는 상호 강화 행동(Coherent Actions)의 사슬이다."*

3 요소가 빠지면 *전략* 이 아니라 wish-list. 즉, *비전·OKR·SWOT* 만 있고 Strategy Kernel 이 부재하면 단순 목표 선언에 그친다.

### 1.2 Strategy Kernel ≠ Vision/OKR/SWOT

| 도구 | 답하는 질문 | Strategy Kernel 과의 관계 |
|------|-----------|------------------------|
| Vision (BHAG) | "10~30 년 후 어디에?" | Kernel 의 *입력* (방향성). Kernel 없으면 wish |
| OKR | "이번 분기 측정?" | Kernel 의 *출력* (Coherent Actions 의 정량화). OKR 만은 전략 X |
| SWOT | "현재 상태?" | Kernel 의 Diagnosis 보조. SWOT 단독은 분석 |
| **Strategy Kernel** | **"어떻게 도전을 풀 것인가?"** | **인과 사슬** — 전략의 본질 |

### 1.3 Bad Strategy 의 4 함정 (Rumelt §1)

전략 결정 시 자기 검증용 체크리스트:

| # | 함정 | 증상 | 회피 방법 |
|---|------|------|---------|
| 1 | **Fluff** (모호한 슬로건) | "고객 중심", "혁신 주도" 같은 buzzword 만 | Diagnosis 가 *측정 가능한 도전* 명시했는지 확인 |
| 2 | **Failure to face the challenge** | 진짜 도전 회피, 표면 이슈만 다룸 | "어떤 도전을 *왜 풀기 어려운가*" 명시 |
| 3 | **Mistaking goals for strategy** | "매출 2배" = 전략? 아니다 — 그건 결과 | Goal vs Strategy 분리. Strategy 는 *어떻게* 의 답 |
| 4 | **Bad strategic objectives** | 100 가지 우선순위 = 0 우선순위 | Coherent Actions 3~7 개로 압축. trade-off 명시 |

---

## 2. 실무 운영 단계 (5 Step 워크숍)

### Step 1 — Diagnosis 작성 (현실 단순화)

**목표**: "핵심 도전은 X 이다. 왜냐하면 Y 이기 때문이다." 한 문장으로 단순화.

**절차**:
1. **사내 stakeholder 인터뷰 5+ 명**: PO/PM/엔지니어/세일즈/지원. "지금 가장 큰 도전이 무엇인가?" 개방형 질문
2. **경쟁사 deep dive 3 개**: 직접 경쟁 / 우회 경쟁 / 미래 경쟁. 각 사의 *어떤 행동* 이 우리에게 위협인지 명시
3. **데이터 검증**: 인터뷰·경쟁 분석에서 도출된 가설을 *측정 가능한 수치* 로 뒷받침. e.g., "이탈률 20% (업계 평균 8% 대비 2.5x)"
4. **단순화 한 문장 작성**: "핵심 도전은 *X 이다*. 왜냐하면 *Y* 이기 때문." 30 단어 이내

**Bad example**: "고객 만족도가 낮다." (Fluff — 측정 불가)
**Good example**: "Power user retention 이 6 개월 내 60% 이탈 — 일일 사용 frequency 가 3 회 이하인 cohort 가 95% 이탈하기 때문." (측정 가능 + 인과)

### Step 2 — Guiding Policy 작성 (trade-off 명시)

**목표**: Diagnosis 에 대응하는 1 ~ 3 페이지 narrative. **trade-off 명시 의무**.

**절차**:
1. Diagnosis 의 X (도전) 와 Y (원인) 를 **공격할 지점** 결정
2. "*A 를 선택* 하면 *B 를 포기*" 형식으로 trade-off 1 ~ 3 개 명시
3. narrative 작성: "우리는 *A* 에 집중한다. 왜냐하면 Diagnosis 가 *X* 이고 *A* 가 *Y* 를 직접 공격하기 때문. 대신 *B* 는 후순위로 미룬다."

**Bad example**: "고객·매출·기술·운영 모두 강화." (trade-off 부재 — Bad Strategy 4)
**Good example**: "Power user 의 일일 frequency 향상에 집중. 신규 user acquisition 은 v0.67 까지 보류. 이유: 60% 이탈 cohort 의 frequency 가 ARR 의 80% 결정."

### Step 3 — Coherent Actions 작성 (3 ~ 7 actions)

**목표**: Guiding Policy 를 실행하는 상호 강화 행동.

**절차**:
1. Guiding Policy 의 *A* 를 실행할 행동 brainstorm (10 ~ 20 개)
2. **상호 강화** 검증: 각 action 이 다른 action 을 약화하지 않는지
3. 3 ~ 7 개로 압축. 우선순위 명시 (Must / Should / Could)
4. 각 action 의 *측정 가능한 결과* 명시 (Coherent Action 이 OKR 의 KR 로 변환됨)

**Self-check 질문**:
- 이 action 이 빠지면 Guiding Policy 가 약화되는가? (Yes → 유지)
- 다른 action 과 충돌하지 않는가? (No → 재설계)
- 측정 가능한가? (Yes → KR 후보)

### Step 4 — Causal Cascade 검증

Diagnosis → Guiding Policy → Coherent Actions 의 인과 사슬 일관성 점검:

| 검증 | 질문 |
|------|------|
| Diagnosis ↔ Policy | Policy 가 Diagnosis 의 X 를 직접 공격하는가? 우회하지 않는가? |
| Policy ↔ Actions | 각 action 이 Policy 의 trade-off (A 선택, B 포기) 를 준수하는가? |
| Actions 상호 | 한 action 의 결과가 다른 action 의 전제를 약화하지 않는가? |

**FAIL 시**: 가장 약한 고리 재작성. 보통 Diagnosis 가 부정확하면 cascade 전체 다시.

### Step 5 — Self-Deception 체크 (Bad Strategy 4 함정)

| 함정 | 자가 점검 |
|------|---------|
| Fluff | Diagnosis/Policy 에서 *모호한 단어* 5+ 사용? (예: "혁신", "최고", "고객 중심") |
| Failure to face | Diagnosis 가 *진짜 도전* 인가? "이게 진짜 어려운 이유" 답변 가능? |
| Mistaking goals | Policy 가 *결과* 만 적었나? *어떻게* 가 빠졌나? |
| Bad objectives | Actions 가 5+ 개? Trade-off 부재? |

→ 한 함정이라도 걸리면 해당 단계 재작성.

---

## 3. 의사결정 패턴

### 3.1 Diagnosis 가 부정확할 때 — Causal Cascade 깨짐

가장 흔한 실패 모드. Diagnosis 가 *진짜 도전* 이 아닌 *증상* 만 명시 → Policy/Actions 도 표면적. 결과: 자원 낭비, 같은 도전 재발.

**분기 결정**:
- 사내 모두 "Diagnosis OK" 라 하지만 6 개월 후 같은 도전 재발 → **Diagnosis 다시** (외부 시각 / 신규 인터뷰)
- 새 데이터 등장 → Diagnosis 갱신 → cascade 재작성

### 3.2 Trade-off 명시의 정형 표현

전략 결정 시 *반드시* 한 문장 trade-off 작성:

```
우리는 [A] 를 [언제까지] 까지 [어떤 결과] 를 위해 집중한다.
대신 [B] 는 [후순위 시점] 으로 미룬다.
이유: [Diagnosis 의 X] 가 [Y] 이기 때문에 [A] 가 우선이다.
```

이 정형이 채워지지 않으면 **trade-off 부재 = Bad Strategy 함정 4**.

### 3.3 의사결정 시 묻는 5 질문

| # | 질문 | 답이 NO 면 |
|---|------|---------|
| 1 | Diagnosis 가 30 단어 이내 한 문장인가? | 단순화 부족 → Step 1 재작성 |
| 2 | Trade-off 가 명시됐는가? | Bad Strategy 4 → Step 2 재작성 |
| 3 | Actions 가 3~7 개인가? | 100 우선순위 = 0 → Step 3 압축 |
| 4 | 인과 사슬이 일관되는가? | Cascade 깨짐 → Step 4 검증 |
| 5 | Bad Strategy 4 함정 모두 회피? | self-deception → Step 5 재작성 |

---

## 4. 산출물 양식

### 4.1 Strategy Kernel ADR Template (1 page)

```markdown
# Strategy Kernel — {feature/initiative}

## Diagnosis (현실 단순화)

핵심 도전: **{X 한 문장 30 단어 이내}**.
왜냐하면 **{Y 인과 명시}**.

증거: {수치 1~3 개, 인터뷰 인용 1~2 개}.

## Guiding Policy (trade-off 명시)

우리는 **{A}** 에 **{언제까지}** 집중한다.
대신 **{B}** 는 **{후순위 시점}** 으로 미룬다.
이유: {Diagnosis 의 X 가 Y 이기 때문에 A 가 우선}.

## Coherent Actions

| # | Action | 우선순위 | 측정 (KR 후보) |
|---|--------|--------|--------------|
| 1 | {action 1} | Must | {수치} |
| 2 | {action 2} | Must | {수치} |
| 3 | {action 3} | Should | {수치} |

## Causal Cascade 검증

- [ ] Diagnosis 가 30 단어 이내
- [ ] Policy 의 trade-off 명시
- [ ] Actions 3~7 개
- [ ] 인과 일관성 (Step 4)
- [ ] Bad Strategy 4 함정 회피 (Step 5)
```

### 4.2 Decision Record entry 형식

main.md 의 Decision Record 표에 1 줄로 박제:

```
| {date} | Strategy Kernel 적용: Diagnosis=*{X}*, Policy=*{A 우선, B 후순위}*, Actions={action 수} 개 | CEO | docs/{feature}/{phase}/strategy-kernel.md |
```

---

## 5. 사용자 적용 사례 — vais-positioning-rethink (R-1 완화)

> *"내가 막혔던 실제 경험"* — Sprint v2 의 정체성 결정에 Rumelt Kernel 자기 적용.

### 5.1 자기 적용 결과

- **Diagnosis**: 1 PO 가 부서장 7 영역 결정 시 다학제 도메인 지식 부재. CC native 진화로 코드 영역 redundancy + doc 폭증으로 화두 자체 위반.
- **Guiding Policy**: vais-code = *부서장 매뉴얼 (organization-in-a-box)*. CTO 슬림화 + 비-코드 C-Level 박제 깊이로 차별화. **Tier-1B (CSO/CBO/COO) 는 사용자 도메인 부재 → v0.67+ 미룬다** (trade-off 명시).
- **Coherent Actions**: M0 4 메커니즘 + M1-A 3 framework + CLAUDE.md 정체성. *Not-doing*: Tier-1B 박제, README 대외화.

### 5.2 Lean Rewrite = Step 5 self-deception 체크의 실증

turn 14 검토에서 7 critical 이슈 노출 → 1 차 Lean Rewrite (-49%, Fluff 제거) → 2 차 Lean Rewrite (-37%, Cascade 일관성 회복). 한 번에 완벽한 Kernel 보다 *작성 → Step 5 → 재작성* 루프가 현실적이라는 교훈. vais-code 가 *재귀적 자기 비판 + 행동* 가능함을 입증.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-09 | PoC stub (~25 줄) — H4 lazy-load negative test 용 임시 |
| v2.0 | 2026-05-10 | **정식 박제** — OJT 4 요소 (framework 정의 / 5 Step 워크숍 / 의사결정 패턴 / ADR 양식) + R-1 완화 (vais-positioning-rethink 자기 적용 사례). 6,819 자 (5000자 budget +36% — OJT depth 우선) |
