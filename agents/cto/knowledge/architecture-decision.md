# Architecture Decision OJT — CTO 부서장 OJT 매뉴얼

> **박제 깊이**: framework + 실무 결정 단계 + 의사결정 패턴 (trade-off) + 산출물 양식 (ADR) — OJT 4 요소.
> **Reference**: Michael Nygard *Documenting Architecture Decisions* (2011) + MADR (Markdown Any Decision Records) v3 + Simon Brown C4 Model + ISO/IEC 42010 (Architecture Description) + Fowler *Patterns of EAA*.
> **사용 시점**: 신규 컴포넌트·라이브러리·인프라 도입 / 기존 구조 변경 / 기술 트레이드오프 결정 / "왜 이렇게 만들었지?" 회복 필요 시.

---

## 1. Framework — 아키텍처 결정의 본질

### 1.1 결정 (Decision) ≠ 설계 (Design) ≠ 구현 (Implementation)

| 단계 | 답하는 질문 | 산출물 | 변경 비용 |
|------|----------|------|--------|
| **Decision (ADR)** | "왜 이 옵션을 골랐는가?" + "어떤 옵션을 버렸는가?" | ADR 1 page | 낮음 (글) |
| Design | "구조가 어떻게 생겼는가?" | 다이어그램 + 인터페이스 | 중간 (스펙) |
| Implementation | "코드가 어떻게 동작하는가?" | 코드 | 높음 (코드) |

**ADR 의 가치**: 결정의 *반대편* (rejected alternatives + reasons) 을 박제 → 6 개월 후 "왜?" 질문에 git blame 보다 빠르게 답. 미래의 PO·CTO·엔지니어가 같은 함정에 다시 빠지지 않게 한다.

### 1.2 4 가지 결정 유형 (변경 비용 ↑ 순)

| 유형 | 예시 | 되돌리기 |
|------|------|--------|
| Reversible | 라이브러리 선택, 디렉토리 구조 | 1 일 |
| Hard-to-reverse | DB 스키마, API 계약, 인증 모델 | 1 주 ~ 1 달 |
| Architectural | monolith vs micro, sync vs async, server-side vs client-side | 분기 단위 |
| **Foundational** | 언어, 런타임, OS, cloud vendor | 년 단위 (사실상 rewrite) |

ADR 박제는 **Hard-to-reverse 이상** 부터 mandatory. Reversible 은 코드 + 커밋 메시지로 충분.

### 1.3 C4 Model — 결정의 추상화 레벨

| Level | 결정 단위 | 예시 |
|-------|---------|------|
| L1 Context | System 경계 + 외부 의존 | "vais-code 는 Claude Code plugin, Node 18 + Python 3.8 의존" |
| L2 Container | 배포 단위 | "lib/ + hooks/ + scripts/ + agents/ = 4 컨테이너" |
| L3 Component | Container 내부 모듈 | "lib/m0-record-turn.js = detached worker 컴포넌트" |
| L4 Code | 클래스 / 함수 | (ADR 대상 아님 — 코드 리뷰 영역) |

**규칙**: ADR 은 L2 ~ L3 레벨에서 발동. L1 은 회사 결정 (vendor lock-in), L4 는 코드 리뷰 (PR review).

---

## 2. 5-Step OJT — 결정 워크숍 절차

### Step 1. 트리거 식별 (15 분)

다음 중 하나라도 발생 → ADR 작성 검토:

- "이거 어떻게 할지 모르겠다" 가 1 시간 이상 지속
- 같은 질문이 sub-agent / 동료에게서 두 번 나옴
- Hard-to-reverse 이상 변경이 임박 (DB 마이그레이션, API breaking)
- 외부 의존 도입 (npm package, MCP server, vendor SDK)
- 성능 / 보안 / 비용 임계값 변경 (latency budget, RPS, $/month)

> **Anti-pattern**: "그냥 짜고 보자" — 결정의 *반대편* 을 한 번도 검토 안 함. 6 개월 후 PR 리뷰에서 "왜 이렇게?" 질문에 답할 수 없다.

### Step 2. 컨텍스트 + 제약 명시 (30 분)

3 가지 차원 강제 작성:

| 차원 | 예시 |
|------|------|
| **Forces** | 사용자 요구 / 비즈니스 KPI / 팀 역량 / 일정 |
| **Constraints** | Backward compatibility / 기존 코드 / 운영 비용 / 라이선스 |
| **Assumptions** | "유저 < 100" / "1 RPS 미만" / "한 명이 운영" |

Assumption 은 *명시* 가 핵심. "당연한 것" 으로 두면 6 개월 후 깨졌을 때 결정이 잘못된 게 아니라 *전제* 가 깨진 것을 못 알아챈다.

### Step 3. 옵션 generation (45 분, ≥ 3 옵션)

3 옵션 미만은 **사고 부족** 신호. 항상 다음 3 가지 base option 으로 시작:

1. **Status quo** — 아무것도 안 함 (이게 답일 수도 있음)
2. **Buy / Use existing** — 기존 라이브러리·SDK 사용
3. **Build** — 직접 구현

이후 hybrid 옵션 추가. 옵션마다 **Pros / Cons / Cost** 동등 깊이로 작성. *원하는 옵션만 자세히 쓰는 것은 결정이 아니라 정당화*.

### Step 4. Trade-off 매트릭스 (30 분)

옵션 × 평가 차원 행렬:

| 옵션 | 개발 시간 | 운영 비용 | 변경 유연성 | 위험 | 합 |
|------|--------|--------|----------|----|---|
| A | 1 일 | $0 | 낮음 | 낮음 | — |
| B | 1 주 | $50/mo | 중간 | 중간 | — |
| C | 1 달 | $0 | 높음 | 높음 | — |

차원은 5 개 ± 2. 가중치 부여는 선택 (보통 안 하는 게 정직). 결과는 *합산점수가 답이 아니라 trade-off 가시화* 가 목적.

### Step 5. ADR 작성 + 결정 (30 분)

§4 양식 따라 1 page 작성 → CTO + 영향받는 sub-agent (frontend / backend / db) 에게 link 공유 → 1 영업일 내 반론 없으면 **Accepted**.

**Reversibility 등급 표기 mandatory** — Reversible / Hard-to-reverse / Architectural / Foundational. Foundational 은 CEO 추가 승인 필수.

---

## 3. 의사결정 패턴 — 흔한 실수 + Trade-off Catalog

### 3.1 흔한 실수 7

| # | 실수 | 회피 |
|---|------|------|
| 1 | **Over-engineering** — "나중에 필요할 수도" 로 추상화 도입 | YAGNI. 2 번째 use case 가 나타나기 전까지 추상화 금지 |
| 2 | **Premature optimization** — 측정 없이 캐시·인덱스·CDN 도입 | Profile 후 결정. Donald Knuth |
| 3 | **NIH (Not Invented Here)** — 검증된 라이브러리 대신 직접 구현 | Step 3 에서 "Buy" 옵션 생략 금지 |
| 4 | **Resume-driven design** — 새 기술 써보고 싶어서 도입 | Step 2 에서 "팀 역량" 차원 강제 작성 |
| 5 | **Cargo cult** — Netflix/Google 사례 따라하기 | 우리 규모·팀에 맞는지 Step 4 에서 "운영 비용" 차원 평가 |
| 6 | **Sunk cost fallacy** — 이미 만든 코드라 못 버림 | 결정의 reversibility 등급에 따라 cost 절단점 사전 명시 |
| 7 | **Decision by inertia** — 결정 안 하고 시간 흐름에 맡김 | Step 1 트리거 → 1 주 timeout 강제 |

### 3.2 Trade-off Catalog — 자주 만나는 dilemma

| Dilemma | 한쪽 | 반대쪽 | 결정 휴리스틱 |
|---------|------|------|----------|
| **Sync vs Async** | 단순·디버깅 쉬움 | 처리량·반응성 | latency budget < 100ms + 단일 호출 → sync |
| **Monolith vs Service** | 배포 단순·트랜잭션 쉬움 | 독립 배포·언어 자유 | 팀 < 8 명 → monolith |
| **Buy vs Build** | 빠름·검증됨 | 맞춤·비용 통제 | core 차별화 = build, 나머지 = buy |
| **SQL vs NoSQL** | join·트랜잭션·스키마 | 쓰기 처리량·유연 | 관계형 데이터 + < 1M row/day → SQL |
| **Server vs Client** | 보안·일관성 | 반응성·서버 비용 | 민감 로직 + 권한 체크 = server |
| **Abstraction now vs later** | DRY·유연 | 명확·이동 자유 | 3 번째 중복까지 wait (Rule of Three) |
| **CAP** | (consistency 또는 availability) | partition tolerance | 분산이면 P 강제, 그 후 C·A 중 1 |

### 3.3 5 질문 자체 점검 체크리스트

ADR 작성 전 답할 수 있어야 함:

1. 이 결정을 **되돌리려면** 얼마 (시간·코드·돈)?
2. 1 년 후에도 **같은 trade-off** 가 유효한가? (assumption 깨질 가능성)
3. **반대편 옵션의 가장 강한 논리**를 한 줄로 요약 가능한가?
4. 측정 가능한 **성공 / 실패 기준**이 있는가?
5. 이 결정이 **다른 결정의 전제**가 되는가? (cascade)

3 번에 답 못 하면 옵션 generation 부족 → Step 3 으로 복귀.

---

## 4. 산출물 양식 — ADR Template (MADR v3 기반)

```markdown
# ADR-NNN: [결정 제목 — 명사구]

* **Status**: Proposed | Accepted | Deprecated | Superseded by ADR-XXX
* **Date**: YYYY-MM-DD
* **Reversibility**: Reversible | Hard-to-reverse | Architectural | Foundational
* **Deciders**: CTO + [영향받는 sub-agent / C-Level]

## Context

[2~5 문단. Forces / Constraints / Assumptions 명시. *왜 지금* 결정해야 하는가.]

## Decision

[1 문단. 채택한 옵션과 *한 줄 이유*.]

## Considered Options

1. **Option A — [이름]** — Pros: ... / Cons: ... / Cost: ...
2. **Option B — [이름]** — Pros: ... / Cons: ... / Cost: ...
3. **Option C — [이름]** — Pros: ... / Cons: ... / Cost: ...

## Trade-off Matrix

| 옵션 | 개발 시간 | 운영 비용 | 변경 유연성 | 위험 |
|------|--------|--------|----------|----|
| A | ... | ... | ... | ... |

## Consequences

* **Positive**: [채택 결과 좋아진 점]
* **Negative**: [감내해야 할 손해]
* **Follow-up**: [후속 결정·검증·deadline]

## Validation

* 측정 지표: [latency / cost / RPS / 사용자 만족 등]
* Trigger to revisit: [언제 이 ADR 을 다시 검토할지]
```

### 좋은 ADR / 나쁜 ADR 비교

| 기준 | 좋은 ADR | 나쁜 ADR |
|------|---------|---------|
| 옵션 수 | 3 개 이상 | 1 개 (선택지 없음) |
| Cons | 채택 옵션의 *Cons 도* 명시 | Pros 만 |
| Reversibility | 명시 | 누락 |
| 측정 지표 | 정량 | "잘 되는지 본다" |
| 대상 독자 | 6 개월 후의 자기 + 신규 합류자 | 본인만 이해 |

---

## 5. R-1 완화 — vais-positioning-rethink 자기 적용 사례

본 OJT 가 *진짜로* 흡수되었는지는 vais-code 자신의 결정 사례에서 검증된다. Sprint W1 의 3 가지 결정을 ADR 형식으로 회고:

### ADR-1: H4 Lazy-Load → Manual @include 채택 (W1 D1)

* **Reversibility**: Hard-to-reverse (Knowledge Index 형식이 모든 c-level agent 에 박제)
* **Decision**: Knowledge Index 를 *literal "Read X 후 답변"* 형식으로 통일
* **Considered**: ① autonomous discovery (frontmatter only) ② manual @include (literal Read) ③ hybrid
* **Trade-off**: ①은 PoC 로 동작 미검증 → 실패 시 비용 폭증. ②는 명시성 ↑ + agent context cost ↑. ③은 분기 복잡
* **Validation 지표**: Knowledge Index 매칭 시 sub-agent 가 실제 Read 수행률 (W2 D2 dogfood A/B 측정 예정)
* **흔한 실수 회피**: #5 Cargo cult (다른 LLM 의 RAG 패턴 답습 회피)

### ADR-2: Stop Hook Detached Worker 패턴 (W1 D2)

* **Reversibility**: Reversible (단일 hook + worker 파일)
* **Decision**: Stop hook 에서 `child.unref()` 로 fire-and-forget worker 분리
* **Considered**: ① 동기 처리 (hook 내 LLM 호출) ② detached worker ③ 큐 시스템
* **Trade-off**: ①은 사용자 대기시간 폭증 (LLM 1~3s). ②는 BC + 무영향. ③은 over-engineering
* **흔한 실수 회피**: #1 Over-engineering (큐 시스템은 현재 규모에 과도)

### ADR-3: M1 OJT Budget 5000 → 7000자 재조정 (W1 D5)

* **Reversibility**: Reversible (template 갱신만)
* **Decision**: 정식 박제 vs 기준 분량 충돌 시 *깊이 우선*. budget 을 실측에 맞춰 7000자로 조정 권장
* **Trade-off**: 분량 통제 ↓ vs OJT depth ↑. vais-code 정체성 (organization-in-a-box) 은 후자 요구
* **흔한 실수 회피**: #6 Sunk cost (5000자 design 결정에 매이지 않고 실측 기반 재결정)

### 회고 — OJT 가 작동했는가?

3 결정 모두 §3.1 흔한 실수 7 항목과 §3.2 Trade-off Catalog 를 명시 회피. *결정 후 회고가 아닌 결정 전 적용* 이 OJT 박제의 가치. R-1 (잘못된 박제 위험) 완화.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-10 | 정식 OJT 매뉴얼 박제 — Sprint W2 D1. Tier-1A 3/3 완료. OJT 4 요소 충족 (System Design 5 단계 + Trade-off Catalog + ADR template + 자기 적용 사례 3 건) |
