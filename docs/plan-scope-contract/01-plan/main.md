# plan-scope-contract - 기획서

> ⛔ **Plan 단계 범위**: 이 문서는 분석과 결정만 기록합니다. 프로덕트 파일 생성·수정은 Do 단계에서 수행합니다.
> <!-- size budget: main.md ≤ 200 lines. -->

## Executive Summary

| Perspective | Content | Contributing C-Levels |
|-------------|---------|-----------------------|
| **Problem** | plan phase 에서 agent 가 사용자 요청 범위를 자발적으로 확장하여 "다시 짜" 재작업 사이클 발생 (비용의 본질) | cpo |
| **Solution** | 4개 저비용 개입(Minimum Viable Plan default + Scope Contract 3섹션 + Rule #9 재기술 + 공통 헤더 승격)으로 plan/design/do 의 scope 계약 명시화 | cpo |
| **Function/UX Effect** | 사용자가 plan 검토 시 "요청 원문 vs In-scope" 대비로 1초 내 scope 이탈 감지 가능. 재지시 사이클 감소 | cpo |
| **Core Value** | VAIS 사용 비용의 체감 병목 해소 — 작은 수정에 작은 rail, Rule #11 (User Sovereignty) 실질 강화 | cpo |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | "작은 수정에 큰 코스트" 불만의 실제 원인이 토큰이 아니라 plan time scope creep 이라는 ideation 진단 |
| **WHO** | VAIS 플러그인 사용자(내부 개발자) — 반복적으로 `/vais {clevel} plan` 호출하는 세션 주체 |
| **RISK** | (1) plan template 변경이 기존 피처 문서의 역호환 깨뜨릴 가능성 (2) Scope Contract 섹션이 형식으로만 채워져 효과 무력화 (3) 타 C-Level 로 규약 확산 시 탐색형 agent(research 등) 과잉 제약 |
| **SUCCESS** | plan 재작성 요청률 감소 + Scope Contract 3섹션 누락 경고율 0 수렴 |
| **SCOPE** | plan phase 의 scope 계약 + Rule #9 명문화. CEO triage gate 와 관찰 섹션 자동 승계는 별도 피처 |

---

## 요청 원문

> "현재 vais-code를 쓰면 작은 부분 고치는데도 너무 큰 코스트가 들어가는 것 같아"
>
> 구체 사례: "CTO한테 GA 이벤트 2개에 대해서 데이터 긁어와서 메뉴 만들라고 했는데 GA 이벤트 전체 스캔 + 문제점 확인 + 수정까지 plan 을 짜서 다시 짜라 했다"

## In-scope

- F1. CTO plan agent prompt 에 Minimum Viable Plan default 주입
- F2. plan/main.md 에 `요청 원문 / In-scope / Out-of-scope` 3섹션 의무화 (template + validator 경고)
- F3. CLAUDE.md Rule #9 재기술 — "Lake 는 사용자가 지정. AI 는 확장하지 않음. Ocean 후보는 기록만"
- F4. (권장) plan/design/do 공통 헤더 템플릿 승격 — 각 phase 재발 방지

## Out-of-scope

- CEO triage gate (trivial/small/feature/launch 라벨링) — 1+2+a 효과 관찰 후 재검토
- "관찰/후속 과제" 섹션 자동 승계 차단 규약 — 지연된 scope creep 관찰 후 도입
- 타 C-Level (CPO prd-writer, CBO market-researcher 등) 로의 규약 확산 — CTO 시범 적용 후 단계적
- event-log `plan_completed` / `plan_rewrite_requested` 의 **자동 발화 훅** — 스키마 추가만 본 피처에서, 실 발화 로직은 별도 observability 피처로 분기 (Rule #9 dog-fooding)

---

## Decision Record (multi-owner)

| # | Decision | Owner | Rationale | Source topic |
|---|----------|:-----:|-----------|--------------|
| 1 | CEO triage gate 도입 보류 — rail 중첩 역효과 | cpo | 사용자 원문 불만("비용 크다")과 역방향. 1+2+a 효과 관찰 후 재검토 | `../00-ideation/main.md` |
| 2 | F1+F2+F3 을 MVP 로, F4 를 권장으로 분리 | cpo | F1~F3 은 prompt/markdown 편집만, F4 는 템플릿 구조 재설계라 난이도 차이 | `../00-ideation/main.md` |
| 3 | CTO 에 우선 적용, 타 C-Level 은 시범 관찰 후 | cpo | 탐색형 agent(research 등) 과잉 제약 리스크 회피 | `../00-ideation/main.md` |
| 4 | F3 → F2 → F1 순서로 구현 (Rule → template → prompt) | cto | 문서적 기반을 먼저 깔고 prompt 는 최종 | `./tech-sketch.md` |
| 5 | F4 (공통 헤더) 는 본 피처 MVP 제외 — 별도 피처로 분기 | cto | template include 메커니즘 부재로 난이도 ↑ | `./tech-sketch.md` |
| 6 | event-log 신규 타입(`plan_rewrite_requested`) 추가 | cto | SC-01 정량 검증 위한 관찰성 훅 | `./tech-sketch.md` |

---

## [CPO] 제품 정의

이 피처는 "VAIS 사용 비용 = 재작업 사이클" 이라는 근본 진단에 기반한다. 재작업을 만들어내는 가장 빈번한 지점이 plan phase 의 scope creep 이며, 이를 **prompt default 변경 + 문서 규약 추가 + CLAUDE.md 1줄 수정** 세 가지의 저비용 개입으로 잡는다. 테스트 가능한 성공 지표는 scope creep 재발률이며, 측정은 `event-log.jsonl` 에 plan 재작성 이벤트를 기록하는 방식으로 수행 가능하다. 내부 도구 개선이라 시장/경쟁 분석은 N/A.

---

## 0. 아이디어 개요

### 아이디어 한 줄
> CTO plan agent 의 scope 자발 확장을 **prompt default + 문서 섹션 + Rule 문구** 3개 지렛대로 막는다.

### 배경
- 현재 문제: Rule #9 Boil the Lake 가 agent 에게 "확장 허가"로 오독됨. plan 에 "요청 원문" 대비 섹션이 없어 사용자 검토 속도 저하.
- 기존 해결책 한계: 사용자가 "다시 짜"로 사후 수정 가능하지만, 이것이 매번 필요한 재작업 = 비용.
- 필요성: 확장 default 를 축소 default 로 뒤집으면 재작업 0 수렴 가능.

### 타겟 사용자
- 주요: VAIS 플러그인 내부 사용자 (플러그인 개발 자신 + 배포 대상 사용자)
- 사용자 Pain Point: "작은 수정도 큰 rail 통과해야 하는 체감" — 구체적으로는 재작업 사이클

### 사용자 시나리오
1. 상황: 사용자가 `/vais cto plan {feature}` 호출, 사용자 요청은 명확히 좁음
2. 행동: CTO plan agent 가 요청 원문을 그대로 인용하고, In-scope/Out-of-scope 로 범위 경계를 먼저 선언, 품질 리스크는 "관찰" 섹션에 기록
3. 결과: 사용자는 plan 상단 3섹션만 1초 scan 으로 scope 정합성 확인. 재지시 불필요

## 0.5 MVP 범위

| 기능 | 중요도 | 난이도 | MVP 포함 |
|------|:----:|:----:|:-------:|
| F1. Minimum Viable Plan default prompt 주입 (CTO) | 5 | 2 | Y |
| F2. plan/main.md Scope Contract 3섹션 의무화 | 5 | 2 | Y |
| F3. Rule #9 재기술 (CLAUDE.md 1줄 추가) | 4 | 1 | Y |
| F4. plan/design/do 공통 헤더 템플릿 승격 | 3 | 4 | N (권장, 후속) |

### MVP 포함 기능
- F1, F2, F3 — 전부 prompt/markdown 편집만. 코드 변경 0 (validator 경고 추가 제외)

### 이후 버전
- F4 — 템플릿 구조 재설계 필요, 효과 관찰 후 수행
- CEO triage gate / 관찰 섹션 자동 승계 차단 — Out-of-scope 참조

## 0.6 경쟁/참고 분석

N/A — 내부 도구 개선 피처. 참고 모델은 Anthropic 의 "explicit scope contracts in long-horizon agents" 문헌과 유사.

## 0.7 PRD 입력

N/A — CPO 자체가 PRD 생성 주체.

## 1. 개요

### 1.1 기능 설명
CTO plan agent 의 scope 자발 확장을 막는 3지점 개입(prompt default, 문서 섹션, CLAUDE.md Rule 문구).

### 1.2 목적
- 해결 문제: plan time scope creep → 재작업 사이클
- 기대 효과: 재작업률 감소, 사용자 검토 시간 단축
- 대상: VAIS 내부 사용자 + 배포 후 플러그인 사용자

## 2. Plan-Plus 검증

### 2.1 의도 발견
근본 문제는 "비용이 크다"가 아니라 "**예상과 다른 output 을 받아서 다시 요청하는 횟수**"가 체감 비용을 결정한다는 것. scope 가 계약으로 명시되면 차이가 즉시 발견되어 사이클이 단축된다.

### 2.2 대안 탐색

| # | 대안 | 장점 | 단점 | 채택 |
|---|------|------|------|:---:|
| 1 | CEO triage gate 의무화 | 구조적 해결 | rail 중첩 역효과 | N |
| 2 | Prompt default + 문서 섹션 (본 MVP) | 저비용, 효과 즉시 관찰 | agent drift 시 장기 약화 가능 | **Y** |
| 3 | Auto-rewrite (agent 가 사용자 요청을 자동 축약) | 자동 | 사용자 의도 왜곡 위험 | N |

### 2.3 YAGNI 리뷰
- [x] 현재 필요 기능만: F1~F3 각각 재작업 감소 효과 예상
- [x] 과잉 설계 없음: F4 는 권장, CEO gate 는 Out-of-scope
- [x] 제거 후보: 없음 (이미 MVP 3개로 축약)

## 3. 사용자 스토리

| # | As a... | I want to... | So that... |
|---|---------|-------------|------------|
| 1 | VAIS 사용자 | `/vais cto plan` 결과 상단에서 내 요청 원문을 그대로 확인하고 싶다 | agent 가 내 범위를 유지했는지 1초에 판단 |
| 2 | VAIS 사용자 | agent 가 품질 리스크를 발견해도 그것이 내 plan 에 포함되지 않도록 한다 | 내가 의도한 scope 밖 작업으로 시간 쓰이지 않도록 |
| 3 | 플러그인 유지관리자 | Scope Contract 3섹션이 누락된 plan 을 validator 가 경고하게 한다 | 규약 drift 방지 |

## 4. 기능 요구사항

| # | 기능 | 설명 | 관련 파일 (예상) | 우선순위 |
|---|------|------|----------------|:-------:|
| F1 | Minimum Viable Plan default | CTO plan agent prompt 에 "사용자 명시 + 전제조건만, 품질 리스크는 관찰 섹션" 규약 추가 | `agents/cto/cto.md` | Must |
| F2 | Scope Contract 3섹션 의무화 | plan template 에 `## 요청 원문` / `## In-scope` / `## Out-of-scope` 고정 + validator 경고 추가 | `templates/plan.template.md`, `scripts/doc-validator.js` | Must |
| F3 | Rule #9 재기술 | CLAUDE.md Rule #9 에 "Lake 는 사용자 지정, AI 는 확장 안 함" 한 문장 추가 | `CLAUDE.md` | Must |
| F4 | 공통 헤더 승격 | plan/design/do 공통 Scope Contract 템플릿 파편화 해소 | `templates/*.template.md` | Nice |

## 5. 정책 정의

N/A — 사용자 데이터 없음, 권한 구분 없음.

## 6. 비기능 요구사항

| 항목 | 요구사항 | 기준 |
|------|---------|------|
| 관찰성 | scope 재작성 이벤트 측정 가능 | `.vais/event-log.jsonl` 에 `plan_rewrite_requested` 이벤트 기록 |
| 역호환 | 기존 피처의 01-plan/main.md 마이그레이션 불필요 | validator 는 신규 피처부터 경고 적용 |

## Success Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-01 | F1+F2+F3 도입 후 plan 재작성 요청률 50% 감소 | event-log `plan_rewrite_requested` 전후 2주 비교 |
| SC-02 | Scope Contract 3섹션 누락률 10% 이하 | validator `W-SCOPE-*` 경고 카운트 |
| SC-03 | 사용자 plan 검토 시간 체감 개선 | 내부 사용자 주관 피드백 (정성) |
| SC-04 | 타 C-Level 로의 부작용 0건 | CPO/CBO/CSO plan 산출물 품질 관찰 (2주) |

## Impact Analysis

### Changed Resources

| Resource | Type | Change Description |
|----------|------|-------------------|
| `agents/cto/cto.md` | modify | Minimum Viable Plan default 블록 추가 |
| `templates/plan.template.md` | modify | Scope Contract 3섹션 상단 삽입 |
| `scripts/doc-validator.js` | modify | `W-SCOPE-01/02/03` 경고 규칙 추가 |
| `CLAUDE.md` | modify | Rule #9 한 줄 추가 |

### Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| `agents/cto/cto.md` | read by CTO orchestrator | phases/cto.md | prompt 길이 약간 증가 |
| `templates/plan.template.md` | read by CTO plan phase | cto plan Do 단계 | 신규 피처만 영향, 기존 문서 무영향 |
| `CLAUDE.md` | session context | 전 세션 | 모든 C-Level 에 문구 1줄 노출 |

### Verification
- [ ] 기존 피처의 01-plan/main.md 가 validator 실행 시 경고만 (fail 아님) 확인
- [ ] breaking change 없음 확인

## 7. 기술 스택

N/A — prompt 및 markdown 편집만. 런타임 의존 변경 없음.

## 8. 화면 목록

N/A — UI 없음.

## 데이터 모델 개요

N/A — 데이터 없음. `event-log.jsonl` 의 신규 이벤트 타입 1종 추가 예정 (F1 의 관찰성 목적).

## API 엔드포인트 개요

N/A.

## 9. 일정 (예상)

| 단계 | 산출물 |
|------|--------|
| 기획 (본 plan) | `docs/plan-scope-contract/01-plan/main.md` |
| 설계 | CTO design — prompt diff + template diff + validator 규칙 상세 |
| Do | CTO do — F1+F2+F3 편집, validator 코드 추가 |
| QA | 기존 피처 regression + scope creep 재현 시나리오 |
| Report | event-log 기반 SC-01 초기 관측 |

> 다음 단계 (CPO 권고): `/vais cto design plan-scope-contract`

---

## [CTO] 기술 스케치

CPO plan 의 F1~F4 를 기술 구현 관점에서 상세화. **4개 파일 편집 + 신규 이벤트 타입 1종** 이 범위 전부. 상세는 [`./tech-sketch.md`](./tech-sketch.md) 참조.

**핵심 구현 결정**
- 실행 순서: F3 (CLAUDE.md Rule #9 재기술) → F2 (template + validator) → F1 (CTO prompt 블록) → event-log 훅. 문서적 기반이 먼저 깔려야 prompt 변경이 의미 있음.
- F2 validator 규칙 `W-SCOPE-01/02/03` 은 **severity=warn**. 기존 피처 역호환 무영향 (exit 0).
- F4 (공통 헤더 승격) 는 `lib/templates.js` 내 include 메커니즘 부재로 별도 피처 분기 — Out-of-scope 유지.

**대상 파일 (Do phase 예상)**

| # | 파일 | 변경 유형 | 내용 |
|:-:|------|:---------:|------|
| 1 | `CLAUDE.md` | modify | Rule #9 한 줄 부연 추가 |
| 2 | `templates/plan.template.md` | modify | 요청 원문 / In-scope / Out-of-scope 3섹션 상단 삽입 |
| 3 | `scripts/doc-validator.js` | modify | W-SCOPE-01/02/03 규칙 3건 추가 |
| 4 | `tests/doc-validator.test.js` | modify | 7 assertion 추가 |
| 5 | `agents/cto/cto.md` | modify | Plan Scope Default 블록 추가 |
| 6 | `lib/events.js` 또는 `scripts/phase-transition.js` | modify | `plan_rewrite_requested` 이벤트 타입 |

**예상 변경량**: 생성 0 / 수정 6 / ~80 lines.

**리스크 요약**
- 기존 plan/main.md 의 W-SCOPE 경고 노이즈 → severity=warn 으로 유예 (2주)
- CTO prompt 길이 증가 → `## 작업 원칙` 직전 배치하여 상단 규칙 비중 유지
- 상세 리스크·완화책 `./tech-sketch.md § 6` 참조

> 다음 단계 (CTO 권고): `/vais cto design plan-scope-contract` — 본 tech-sketch 를 기반으로 validator 규칙 정확한 regex 및 event-log 스키마 확정

---

## Topic Documents (v0.57+)

> 이 plan 은 규모가 작아 topic 분리 없이 main.md 단일 문서로 유지 (200줄 내).

| Topic | 파일 | Owner | 한 줄 요약 | 참조 scratchpad |
|-------|------|:-----:|-----------|----------------|
| tech-sketch | [`./tech-sketch.md`](./tech-sketch.md) | cto | F1~F4 구현 상세 + 6 Step 구현 순서 + 리스크 | — |

## Scratchpads (v0.57+)

| Agent | 경로 | 크기 | 갱신 |
|-------|------|:----:|-----|
| (없음) | `_tmp/` 비어 있음 | — | — |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-22 | 초기 작성 — CPO, ideation 근거, Scope Contract dog-fooding 적용 |
| v1.1 | 2026-04-22 | CTO 진입: 기술 스케치 topic 추가, Decision Record 3건(#4~#6) append, 대상 파일 6건 확정 |

<!-- template version: v0.58.0 -->
