---
artifact: roadmap
owner_agent: roadmap-author
phase: what
canon_source: "ProductPlan 'Now-Next-Later Roadmap' (2019), productplan.com + Bruce McCarthy 'Product Roadmaps Relaunched' (2017), O'Reilly + Cagan 'Inspired' (2017) outcome-based roadmap"
execution:
  policy: always
  intent: outcome-roadmap
  prereq: [okr, strategy-kernel]
  required_after: [prd]
  trigger_events: []
  scope_conditions: []
template_depth: filled-sample-with-checklist
review_recommended: false
project_context_reason: "What 단계 — OKR + Strategy Kernel 을 product 시간축으로 변환. 기능 목록이 아닌 **결과 (outcome) 중심**. Backlog 의 prereq."
---

# Now-Next-Later Roadmap

> **canon**: ProductPlan "Now-Next-Later Roadmap" (2019) — 시간 절대성 X 의 outcome 기반 형식. McCarthy *Product Roadmaps Relaunched* (2017) — 6 가지 roadmap pattern (theme/timeline/now-next-later/etc) 중 best practice. Cagan *Inspired* (2017) — feature roadmap → outcome roadmap 전환.
>
> **핵심**: roadmap 은 일정 (Gantt) 이 아니다. **outcome 의 우선순위 + 의존성** 가시화 도구. Now/Next/Later 는 시간이 아닌 **commitment level**.

---

## 3 Horizons (Now-Next-Later)

| Horizon | 정의 | 시간 가이드 | Commitment |
|:-------:|------|:----------:|:---------:|
| **Now** | 현재 진행 중 + 다음 분기 시작 | 0~3 개월 | 강 — 변경 시 영향 큼 |
| **Next** | 검증·discovery 완료 후 시작 예정 | 3~9 개월 | 중 — 우선순위 변경 가능 |
| **Later** | Discovery 단계 / 가능성 탐색 | 9 개월+ | 약 — 시점·범위 모두 미확정 |

→ **Cagan**: Now 만 commitment, Next/Later 는 directional intent.

---

## 구조

### Now (0~3 개월)

| Initiative | Outcome (목표) | 매핑 KR | 의존성 | 리스크 |
|------------|---------------|---------|--------|--------|
| ... | ... | KR1 | ... | ... |

### Next (3~9 개월)

| Initiative | Outcome | 매핑 KR | 진입 조건 (Discovery 완료) |
|------------|---------|---------|---------------------------|
| ... | ... | KR2 | ... |

### Later (9 개월+)

| Initiative | 가능성 (Why) | 매핑 KR (예상) |
|------------|-------------|---------------|
| ... | ... | ... |

---

## (작성된 sample)

**Product**: VAIS Code | **작성**: 2026-04-26 | **OKR 기간**: 2026-Q2~Q4

### Now (2026-Q2 ~ Q3 — 현재 진행 + 다음 분기)

| Initiative | Outcome | KR | 의존성 | 리스크 |
|-----------|---------|:--:|--------|--------|
| Sprint 10~11 audit 보강 + What 7 templates | Q-D 100% + What 카탈로그 14% → 28% | KR2, KR3 | catalog.json 빌드 도구 | RA-3 사용자 검수 시간 미포함 |
| Sprint 12 How 11 templates | catalog 25% → 50% | KR2 | 정전 매칭 (DDIA / SRE Book / Docker) | (low) — 패턴 학습 효과 |
| Sprint 13~14 Alignment α + 외부 인터뷰 | EXP-4 70% + RA-1 100% | KR4, KR5 | 외부 인터뷰 모집 | RA-1 모집 어려움 |
| GA Release v1.0 (2026-Q3 말) | OSS 마켓플레이스 공개 | KR1~KR5 합 | Sprint 14 완료 | (배포 절차 정합) |

### Next (2026-Q4 ~ 2027-Q1 — 분기 후 시작)

| Initiative | Outcome | KR | 진입 조건 |
|-----------|---------|:--:|----------|
| Beta-2 (NCSOFT 음성기술팀 사내 도입) | 사내 1팀 정착 → 사례 publish | (Q3 OKR) | GA v1.0 완료 + 사내 인터뷰 5명 |
| OSS 컨트리뷰션 가이드 + PR contributor 모집 | 50+ contributor 확보 | (Q4 OKR) | GA + 한국어/영어 카탈로그 |
| Enterprise 버전 가설 검증 (사내 정전 + 회사별 카탈로그) | 1 enterprise PoC | (H2 OKR) | NCSOFT 사례 publish |

### Later (2027 H2 ~ 2028+)

| Initiative | 가능성 (Why) | 매핑 KR (예상) |
|-----------|-------------|---------------|
| 다른 LLM 호환 (OpenAI/Gemini) | LLM commoditization | (예정 — adoption 확대) |
| 산업별 specialization (게임/헬스케어/핀테크) | 도메인 카탈로그 확장 | (예정 — H3 옵션) |
| MCP 표준 확장 (외부 도구 통합) | Anthropic 의존 완화 | (예정 — 공급자 risk 완화) |

---

## 작성 체크리스트

- [ ] Now / Next / Later **3 horizon** 모두 작성?
- [ ] 각 Initiative 가 **Outcome (결과)** 중심인가? (기능 list X)
- [ ] 각 Outcome 이 **KR 과 매핑** 되어 있는가?
- [ ] **의존성** 이 명시되어 있는가? (initiative 간 prerequisite)
- [ ] **리스크** 가 식별되어 있는가? (Now 는 필수, Next 는 권장)
- [ ] Now 는 **0~3개월** + 강 commitment 이고, Next 는 **3~9개월** + 중, Later 는 **9개월+** + 약 인가?
- [ ] Strategy Kernel (`prereq`) 의 Coherent Actions 가 Initiative 로 흐르고 있는가?
- [ ] **분기 단위 review 주기** 명시? (분기마다 갱신 권장)

---

## ⚠ Anti-pattern (ProductPlan + McCarthy 명시)

- **Feature Roadmap**: "기능 X / Y / Z" 나열 — outcome 부재. ProductPlan 명시 경고.
- **Gantt Chart**: 시간 absolute commitment — Discovery 결과 무관. roadmap 은 outcome priority.
- **Now 과부하**: Now 에 모든 것 — focused 부재. **Now 는 2~3 initiative** 가 적정.
- **Later 무시**: Later 빈칸 — 미래 옵션 가시화 부재. **최소 1~3 initiative** 명시.
- **Internal-only roadmap**: 고객·이해관계자에게 공개 X — 정렬·신뢰 상실. McCarthy: external-friendly version 별도 작성 권장.
- **갱신 부재**: 1 회 작성 후 stale — 분기마다 review + 재정렬 필수.
- **OKR 무관**: KR 매핑 없음 — 전략-실행 단절.
- **확정 일정**: "2026-09-15 출시" — Now 외에는 시간 변동성 인정 필요.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 11. ProductPlan + McCarthy + Cagan 정전. Now-Next-Later 3 horizon + sample (VAIS Code 2026-Q2~Q4) + checklist 8 + anti-pattern 8 |
