---
owner: cpo
topic: decision-and-risks
phase: do
feature: subagent-architecture-rethink
authors: [prd-writer]
---

# Topic: Decision Record + Risks + Out of Scope (통합)

> Source: ideation D-1~D-12, plan D-1~D-8, design D-D1~D-D13, RA Top 3 + R1~R7.

## 1. Decision Record (전체 통합 — 21건)

### Plan 단계 (D-1~D-8)

| # | Decision | 정전/근거 |
|:-:|----------|---------|
| D-1 | *제품의 탄생* 4단계(Core/Why/What/How) 1차 메타-프레임 채택 | 17 정전 cross-reference 충돌 없음 |
| D-2 | "산출물이 sub-agent 정의·경계·계약을 결정한다" 메타-원칙 | 휴리스틱 없는 귀납적 도출 |
| D-3 | 시나리오 역산(접근 C) 거부 | 사용자 지식 종속 → 근본 문제 우회 못함 |
| D-4 | 문헌 기반 뼈대(Literature-grounded) 채택 | 검증된 정전에서 분류 척도 추출 |
| D-5 | Template depth (c) = sample+checklist+anti-pattern | (b)/외부 정전 링크 거부 |
| D-6 | 산출물 실행 정책 4분류(A/B/C/D) | release-engineer 일반화 해법 |
| D-7 | Project Profile 신규 산출물 + ideation 종료 hook | 정책 B 판단 근거 |
| D-8 | **C. 확장 범위 채택** | 사용자 CP-1 명시 결정 — 50+ 전체 + 44 점검 + alignment + 외부 인터뷰 |

### Design 단계 (D-D1~D-D13)

| # | Decision | 확정 상태 |
|:-:|----------|:---------:|
| D-D1 | 4단계 프레임 + 메타-원칙 일관 적용 | 확정 |
| D-D2 | Profile + 정책 4분류 게이트 | 확정 |
| D-D3 | Template depth (c) | 확정 |
| D-D4 | release-engineer 5분해 + 의심 5 sub-agent 정책 | 확정 |
| D-D5 | Alignment α(auto-judge) + β(alignment 산출물) 조합 | 확정 |
| D-D6 | Profile schema v1 (12 변수) + ideation 종료 hook | 확정 |
| D-D7 | VPC → product-strategist 재매핑 | 확정 |
| D-D8 | CEO sub-agent 4개 신설 (vision-author/strategy-kernel-author/okr-author/pr-faq-author) | 확정 |
| D-D9 | roadmap-author 1개 신설 (CPO/What) | 확정 |
| D-D10 | OPP-6 (중복 배치)는 OPP-8 해소 시 자동 흡수 | 확정 |
| D-D11 | P1 솔로 빌더용 "경량화 정전 가이드" — do phase 결정 보류 | **검토 필요** |
| D-D12 | 인터뷰 전 즉시 적용 3가지: Profile 한 줄 예시 / 산출물 컨텍스트 컬럼 / `review_recommended` 메타필드 | 즉시 적용 |
| D-D13 | "Always" 9개 적정성 — 인터뷰 H-2 카드 정렬로 검증 | qa 검증 |

## 2. Risks (R1~R7) — Plan 매트릭스 승계

| ID | Risk | 가능성 | 영향 | 완화 전략 |
|:--:|------|:------:|:----:|---------|
| R1 | 50+ template 작업량 폭증 | 상 | 상 | MVP 25개 한정 → 자연 누적. sprint 분할. 5개 파일럿 측정 |
| R2 | *제품의 탄생* 단일 정박 → 편향 | 중 | 중 | 6 C-Level별 정전 cross-reference 병행 (D-7). 4단계는 1차 메타-프레임이지 유일 척도 아님 |
| R3 | Profile schema 과세분화/과소세분화 | 중 | 상 | 12 변수 MVP. 인터뷰 후 schema 진화 |
| R4 | 기존 44개 재구성이 기존 사용자에게 파괴적 | 중 | 상 | deprecate alias 1 phase 유지 + CHANGELOG BREAKING + absorb-analyzer 의존 분석 |
| R5 | 정책 게이트 UX가 매번 묻기로 회귀 → 옵션 피로 | 중 | 중 | (ii)+(iii) 조합 명문화. Profile 1회 합의 후 자동 게이트 |
| R6 | sub-agent 재정의 중 기존 워크플로우 작동 중단 | 하 | 상 | branch 분리 + canary feature flag로 점진 적용 |
| R7 | "Always" 정책이 일부 프로젝트에 부적합 | 하 | 중 | H-2 카드 정렬로 검증 (D-D13). 부적합 발견 시 정책 재분류 |

## 3. Top 3 검증 가정 (RA — 즉시 검증)

| RA | 가정 | 카테고리 | 리스크 | 확신도 | 검증 방법 |
|:--:|------|---------|:------:|:------:|---------|
| RA-1 | Profile 게이트가 실제 통증 해소 | User Value | **상** | 중 | EXP-1 (30분) + EXP-5 외부 인터뷰 (2~3주) |
| RA-2 | Profile 합의 UX 직관성 (12 변수 인지부하) | Usability | **상** | 하 | think-aloud 3명 + T1 시나리오 |
| RA-3 | 50+ template 14~22주 실현가능성 | Feasibility | **상** | 하 | 5개 파일럿 sprint 측정 |

전체 8 risk category × 15 가정 매핑은 `02-design/_tmp/product-discoverer.md` 섹션 5 참조.

## 4. Experiments (do/qa phase 검증)

| EXP | 가설 | 비용 | 우선순위 |
|:--:|------|------|:--------:|
| EXP-1 | Profile 게이트 동작 — local-only 프로파일에서 ci-cd-configurator skip | 30분 | 즉시 (Sprint 1) |
| EXP-2 | depth (c) template 품질 비교 — 필수 5섹션 충족률 | 1시간 | 즉시 (Sprint 4) |
| EXP-3 | 44 sub-agent Q-D 매핑 점검 — 불일치 ≥3건 발견 | 2~3시간 | Sprint 7 |
| EXP-4 | alignment α 메커니즘 프로토타입 — 70% 감지율 | 4~8시간 | Sprint 11 |
| EXP-5 | 외부 인터뷰 — "쓸데없이 만든다" 통증 보편성 (5명 중 3명+) | 2~3주 | Sprint 11~14 |

## 5. Out of Scope

### 여전히 OUT (확장 범위 C에서도 제외)

| OUT 항목 | 이유 | 후속 처리 |
|---------|------|----------|
| **Epistemic Contract** (`i_know` / `i_ask`) | 구조 정돈 후 얹는 레이어 — 별도 설계 필요 | H2 (1~2년) — 별도 피처 |
| **Uncertainty Reporting** (`confidence: 0~100`) | 위와 동일 | H2 |
| **Absorb 대화 강제** | absorb-analyzer 대대적 변경 필요 | 후속 피처 `absorb-conversational` |
| **시스템 게이트 매번 묻기 UX** (옵션 i) | 옵션 피로 — D-8 영구 거부 | **영구 거부** |

### IN으로 이동 (확장 범위 C 채택으로)

| 이전 OUT 항목 | 이동 | 근거 |
|---------|------|------|
| 단계 간 alignment 검증 메커니즘 | **IN** (F7) | 사용자 CP-1 채택 |
| 카탈로그 잔여 25개 (총 50+) | **IN** (F3 SHOULD) | 사용자 CP-1 채택 |
| 모든 44 sub-agent 재정의 | **IN** (F4 SC-09) | 사용자 CP-1 채택 |
| ux-researcher 외부 인터뷰 | **IN** (SC-10) | 사용자 CP-1 채택 |

## 6. CP-Q (검증) 사용자 응답 대기 항목

| 항목 | 결정 필요 시점 | 옵션 |
|------|-------------|------|
| D-D11 P1 경량화 정전 가이드 | qa phase 또는 H1 후반 | A. H1에 포함 / B. H2 이관 / C. 영구 거부 |
| D-D13 "Always" 9개 적정성 | qa H-2 카드 정렬 결과 후 | A. 그대로 유지 / B. 정책 재분류 / C. 일부만 재분류 |

## 큐레이션 기록

| Source | 채택 | 거절 | 병합 | 추가 | 이유 |
|----|:----:|:----:|:----:|:----:|------|
| Plan D-1~D-8 + Design D-D1~D-D13 | ✅ | | | | 그대로 통합 |
| R1~R7 매트릭스 | ✅ | | | | 그대로 |
| RA Top 3 | ✅ | | | | 검증 우선 |
| 5개 EXP | ✅ | | | | 우선순위 sprint 매핑 |
| OOS (선반 + IN 이동) | ✅ | | | | 명확 |
| **추가** CP-Q 응답 대기 항목 | | | | ✅ | qa 단계 사용자 결정 명시 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 통합 — D-1~D-D13 + R1~R7 + Top 3 RA + OOS + EXP |
