# PRD Writing OJT — CPO 부서장 OJT 매뉴얼

> **박제 깊이**: framework + 실무 작성 단계 + 의사결정 패턴 + 산출물 양식 (OJT 4 요소).
> **Reference**: `agents/cpo/knowledge/prd-eight-sections.md` (8 섹션 자동 판정 spec) +
> Cagan *Inspired* (2017) + Lenny Rachitsky PRD Template + Wagenaar PRD Best Practices.
> **사용 시점**: 신규 피처 PRD 작성 / 기존 PRD 갱신 / Lean Rewrite 검토.

---

## 1. Framework — PRD 의 역할

### 1.1 PRD ≠ Spec / Plan / Brief

| 도구 | 답하는 질문 | 분량 | 독자 |
|------|----------|------|------|
| Project Brief | "왜 시작?" 1 문단 | 1 page | Sponsor |
| **PRD** | **"무엇·왜·누구·어떻게·언제?"** | **2~10 pages** | **Stakeholder + 엔지니어 + 디자이너 모두** |
| Engineering Spec | "구현 detail?" | 5+ pages | 엔지니어 |
| Decision Record (ADR) | "이 결정 했음" | 1 page | 미래의 자기 |

PRD 의 자리는 *전략 → 구현* 사이의 **공통 합의 문서**. 모든 stakeholder 가 *같은 것* 을 보고 합의하는 single source of truth.

### 1.2 8 섹션의 의미 (Cagan 기반)

| # | 섹션 | 역할 | 빠지면 |
|---|------|------|------|
| 1 | Summary | 한 페이지 요약 — 시간 없는 사람도 읽을 수 있는 진입점 | 30 분 회의에서 컨텍스트 회복 불가 |
| 2 | Contacts | 누가 무엇을 결정하는지 명시 | 책임 분산 → 결정 지연 |
| 3 | Background | "왜 *지금*?" 의 답. 변화 / 신규 가능성 / 압박 | 우선순위 정당화 부재 |
| 4 | Objective + KR | SMART 목표 + 측정 가능 KR | 성공 정의 모호 → 끝없는 PRD |
| 5 | Market Segment | 타깃 페르소나 + 제약 | "모두를 위해" = "아무도 위해" |
| 6 | Value Proposition | JTBD + 차별점 | 차별화 부재 → 구현 후 사용자 zero |
| 7 | Solution | 기능 + 수용 기준 + 우선순위 | 엔지니어 맘대로 → 스코프 폭주 |
| 8 | Release | 출시 단계 + Go/No-Go | "언제?" 답 없음 |

### 1.3 부록 7 종 (선택)

- **OKR**: §4 의 KR 을 stretch 목표로 변환
- **Sprint Plan**: §7 의 Solution 을 Week/Day 단위로 분해
- **Pre-mortem**: 실패 가정 + 완화 (Risk + Mitigation)
- **Stakeholder Map**: §2 의 확장 (관심사 + 영향력 + 참여 수준)
- **User Stories**: §7 을 "As a..., I want..., So that..." 형식
- **Job Stories**: JTBD 형식 ("When..., I want..., So I can...")
- **MoSCoW**: Must/Should/Could/Won't 우선순위

부록 적용 여부는 §3.2 의사결정 패턴에서 판정.

---

## 2. 실무 작성 OJT (5 Step)

### Step 1 — JTBD 인터뷰 5+ 명 (1~2 일)

**목표**: §3 Background + §6 Value Proposition 의 1차 자료 확보.

**인터뷰 스크립트** (Bob Moesta JTBD framework 기반):
1. *(상황)* "이 도구·해결책을 처음 찾기 시작한 *순간* 이 언제였나요? 어디 있었고, 무엇을 하고 있었나요?"
2. *(모티베이션)* "그 순간 *왜* 이 해결책이 필요하다 느꼈나요?"
3. *(기존 대안)* "지금까지 *어떻게* 해결해왔나요? 왜 그 방법으로는 부족했나요?"
4. *(이상적 결과)* "이 해결책이 완벽히 동작하면 *어떤 결과* 를 기대하나요?"
5. *(망설임 / 위험)* "이 해결책을 채택할 때 *주저하는 부분* 은 무엇인가요?"

**결과 정리**: 5+ 인터뷰 → 공통 패턴 추출 → JTBD 한 문장: *"When [상황], I want to [모티베이션], So I can [이상적 결과]."*

### Step 2 — Working Backward 작성 (Amazon 방식)

§4 Objective 와 §1 Summary 를 *최종 결과를 가정* 한 시점에서 거꾸로 작성. 순서:

1. **Press Release** 가상 작성 — *"이 PRD 가 6 개월 후 출시되었다면" 의 한 페이지 보도자료*
2. **§4 Objective** — Press Release 의 핵심을 SMART OKR 로 변환
3. **§1 Summary** — Press Release 의 한 페이지 → 2~3 문단 압축

이 순서가 *"§4 부터 작성"* 보다 정확. 이유: 결과 기준으로 거슬러 올라가야 *진짜 가치* 가 드러남.

### Step 3 — 8 섹션 채우기 (작성 순서 권장)

| 작성 순서 | 섹션 | 시간 |
|---------|------|------|
| 1 | §3 Background | 30 분 (Step 1 자료 활용) |
| 2 | §5 Market Segment | 30 분 (Step 1 페르소나 정리) |
| 3 | §4 Objective + KR | 1 시간 (Step 2 결과 활용) |
| 4 | §6 Value Proposition | 30 분 (Step 1 JTBD 한 문장) |
| 5 | §7 Solution | 2~3 시간 (가장 긴 섹션) |
| 6 | §8 Release | 30 분 |
| 7 | §2 Contacts | 15 분 |
| 8 | §1 Summary | 30 분 (모든 섹션 작성 후 마지막) |

**왜 §1 Summary 를 마지막?** 다른 섹션 작성 중 진짜 핵심이 변하기 때문. 작성 후 압축이 정확.

### Step 4 — 부록 적용 결정 (§3.2 분기)

§7 작성 직후 부록 적용 여부 결정. 모든 부록 의무 X — *상황 별* 선택.

### Step 5 — Lean Review + 합의 (Step 1~4 후)

1. **자가 점검**: §3 Background 가 *왜 지금* 답하는가? §4 KR 이 측정 가능한가? §5~6 이 페르소나 일관되는가?
2. **stakeholder review**: §2 Contacts 의 5+ 명에게 비동기 review 요청 (1 주)
3. **Lean Rewrite**: review 후 reduandcy/ceremony 압축 (필요시)

---

## 3. 의사결정 패턴

### 3.1 흔한 실수 7

| # | 실수 | 증상 | 회피 |
|---|------|------|------|
| 1 | §1 Summary 부터 작성 | 끝까지 핵심 안 잡힘 | Step 2 Working Backward 후 마지막 |
| 2 | §3 Background 에 데이터 부재 | "왜 지금?" 답 부정확 | Step 1 인터뷰 5+ 의무 |
| 3 | §4 KR 이 결과만 (e.g., "매출 2배") | 측정 가능하지만 *어떻게* 부재 | leading + lagging KR 혼합 |
| 4 | §5 페르소나 "everyone" | 차별화 부재 | 1~3 페르소나 명시 + 제약 |
| 5 | §6 Value Proposition "모두 좋음" | trade-off 부재 (Bad Strategy 4) | "*X* 에 집중, *Y* 후순위" 명시 |
| 6 | §7 Solution Must Have 10+ 개 | 스코프 폭주 | MoSCoW 적용, Must Have 3~5 |
| 7 | §8 Release "Q3 출시" | Go/No-Go 부재 | 단계 별 (Alpha/Beta/GA) + 기준 |

### 3.2 부록 적용 결정 매트릭스

| 부록 | 추천 시점 | 생략 가능 |
|------|---------|---------|
| OKR | 분기 단위 KR 필요 시 | §4 KR 만으로 충분 시 |
| Sprint Plan | 4+ 주 sprint 시 | 1~2 주 quick win 시 |
| Pre-mortem | 신규 기술 / 의존성 多 | 기존 패턴 반복 시 |
| Stakeholder Map | 5+ stakeholder | 1 PO / 소규모 팀 시 |
| User Stories | UX 디자인 필요 시 | 백엔드 only 시 |
| Job Stories | JTBD 인터뷰 풍부 시 | Step 1 인터뷰 부족 시 |
| MoSCoW | §7 기능 5+ 개 | §7 ≤ 3 기능 시 |

### 3.3 작성 시 5 질문 체크리스트

| # | 질문 | NO 면 |
|---|------|-----|
| 1 | §3 가 *왜 지금* 답하는가? | Step 1 인터뷰 부족 |
| 2 | §4 KR 이 측정 가능 + leading/lagging 혼합? | KR 재작성 |
| 3 | §6 가 trade-off 명시? | Bad Strategy 4 — VP 재작성 |
| 4 | §7 Must Have 가 3~5 개? | MoSCoW 압축 |
| 5 | §8 Go/No-Go 기준 명시? | Release 재작성 |

---

## 4. 산출물 양식

### 4.1 PRD Template (8 섹션)

```markdown
# PRD — {feature/initiative}

## 1. Summary
한 줄 핵심 + 3 bullet (Problem / Solution / Effect)

## 2. Contacts
| 이름 | 역할 | 담당 영역 |

## 3. Background
- 컨텍스트: 무엇에 관한가
- 왜 *지금*? (변화 / 가능성 / 압박)
- 데이터: 인터뷰 인용 + 수치

## 4. Objective + KR
- 목표 (한 줄)
- 왜 중요한가 (회사·고객·비전 정렬)
- KR1~5 (SMART, leading + lagging 혼합)

## 5. Market Segment
- 1~3 페르소나 (JTBD 기반)
- 제약 (지역 / 채널 / 규모)

## 6. Value Proposition
- JTBD: When..., I want to..., So I can...
- Gains (얻는 것) / Pains (피하는 것)
- 경쟁 대비 차별화 (trade-off 명시)

## 7. Solution
### 7.1 UX/Prototypes (선택)
### 7.2 Key Features (Must/Should/Could)
### 7.3 Technology (선택)
### 7.4 Assumptions (검증 필요 가정 + 검증 방법)

## 8. Release
- Alpha/Beta/GA 단계 + 각 Go/No-Go 기준
- 상대 기간 (절대 날짜 X)
```

### 4.2 좋은 / 나쁜 예 — Section 별

**§3 Background**:
- ❌ "고객 만족도가 낮다." (Fluff)
- ✅ "Power user retention 60% 이탈 (업계 평균 8% 의 7.5x). 일일 사용 frequency 3 회 이하 cohort 가 95% 이탈." (측정 가능 + 인과)

**§6 Value Proposition**:
- ❌ "사용자가 더 빨리 일할 수 있게 합니다." (모호)
- ✅ "When 1 PO 가 부서장 7 영역 결정 시, I want to 옆에 다학제 도메인 친구 시뮬레이션, So I can 결정 시간 단축 + 추적성 확보." (JTBD + 차별화)

---

## 5. 사용자 적용 사례 — vais-positioning-rethink (R-1 완화)

### 5.1 PRD v1 → v2.0 Lean Rewrite 경험

본 sprint 의 PRD 작성에서 *3.1 흔한 실수* 1, 5, 6 모두 발생:

- **실수 1 (§1 Summary 부터 시작)**: PRD v1 의 §1 가 ceremony 만 (실수 1). v2.0 lean 에서 Step 2 Working Backward 후 마지막 작성으로 수정 → 핵심 응축
- **실수 5 (§6 trade-off 부재)**: v1 은 "Tier-1 6 개 박제" 만 명시. v2.0 에서 Tier-1B v0.67 이동 trade-off 명시 (Critical Issue #3 Lean Rewrite)
- **실수 6 (Must Have 폭주)**: v1 의 MoSCoW Must Have 10+. v2.0 에서 Tier-1A 3 + M0 핵심 으로 압축

### 5.2 교훈

PRD 가 "한 번에 완벽" 보다 *작성 → Step 5 Lean Review → 재작성* 루프가 현실적. 본 sprint 가 그 루프의 실증 — 1,759 → 893 줄 (-49%).

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-10 | 정식 박제 — OJT 4 요소 (PRD framework + 5 Step 작성 OJT + 의사결정 패턴 + 양식) + R-1 완화 (vais-positioning-rethink PRD v1→v2 회고) |
