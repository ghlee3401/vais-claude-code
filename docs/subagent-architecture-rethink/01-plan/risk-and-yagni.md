---
owner: cpo
topic: risk-and-yagni
phase: plan
feature: subagent-architecture-rethink
---

# Topic: 리스크 + YAGNI 리뷰 + OUT-OF-SCOPE

## 1. 리스크 매트릭스

| ID | Risk | Likelihood | Impact | 완화책 |
|----|------|:----------:|:------:|--------|
| R1 | 50+ template 작성 작업량 폭증 | High | High | MVP 25개로 한정 (mvp-scope.md). 나머지는 후속 phase 자연 누적 |
| R2 | 단일 책 *제품의 탄생* 정박 → 편향 | Medium | Medium | 6 C-Level별 정전 cross-reference 병행 (D-7). 4단계는 1차 메타-프레임이지 유일 척도 아님 |
| R3 | Project Profile schema 과세분화/과소세분화 | Medium | High | MVP schema는 12개 변수로 한정. 사용 데이터 누적 후 후속 phase에서 schema 진화 |
| R4 | 기존 44개 sub-agent 재구성이 기존 사용자/외부 의존자에게 파괴적 | Medium | High | (a) deprecate alias 1 phase 유지 (SC-05) + (b) CHANGELOG에 BREAKING 명시 + (c) absorb-analyzer로 외부 의존 분석 |
| R5 | 정책 게이트 UX가 매번 묻기로 회귀 → 옵션 피로감 | Medium | Medium | (ii)+(iii) 조합 명문화 (D-8). Profile 1회 합의 후 자동 게이트. 추천+승인은 사용자가 명시 요청 시만 |
| R6 | sub-agent 재정의가 진행되는 동안 기존 워크플로우 작동 중단 | Low | High | branch 분리 작업 + canary feature flag로 새 sub-agent 점진 적용 |
| R7 | "Always" 정책 산출물이 모든 프로젝트에서 의미 있다는 가정의 깨짐 | Low | Medium | Always 9개를 Q-3로 ideation 검증 완료. 그래도 1개라도 부적합 사례 발견 시 정책 재분류 |

## 2. YAGNI 리뷰

### 2.1 현재 필요한 기능만 포함했는가?

| 영역 | 포함됨 | YAGNI 검증 |
|------|--------|-----------|
| Project Profile schema | ✅ | release-engineer "쓸데없이 만든다" 직접 해소 — 즉시 필요 |
| Template metadata schema | ✅ | 정책 4분류 작동의 전제 — 즉시 필요 |
| 25개 template (c) 깊이 | ✅ | 메타-원칙 검증의 최소 N — 즉시 필요 |
| release-engineer 5분해 | ✅ | 사용자가 명시한 통증 — 즉시 필요 |
| 의심 5 sub-agent 점검 | ✅ | release-engineer 일반화 검증 — 즉시 필요 |

### 2.2 미래 요구사항을 위한 과잉 설계가 없는가?

| 영역 | 검토 | 결론 |
|------|------|------|
| 단계 간 alignment 메커니즘 (책 6.4/7.5/8.4) | 매력적이지만 별도 메커니즘 필요 | **OUT-OF-SCOPE** — 별도 피처 `subagent-alignment-protocol` |
| epistemic contract / uncertainty reporting | 구조 정돈 후 얹는 레이어 | **OUT-OF-SCOPE** — 선반 보관 (D-11 / D-6) |
| absorb 대화 강제 (자동화 → 대화) | 매력적이지만 absorb-analyzer 대대적 변경 필요 | **OUT-OF-SCOPE** — 후속 phase |
| 시스템 게이트 UX 풀세트 | (ii)+(iii)만으로 충분 | **OUT-OF-SCOPE** — (i) 매번 묻기는 회피 결정 |
| 50+ 카탈로그 전체 | 25개로 메타-원칙 검증 충분 | **OUT-OF-SCOPE** — 자연 누적 |
| 모든 44 sub-agent 재정의 | 6개 시범으로 패턴 검증 우선 | **OUT-OF-SCOPE** — 후속 |

### 2.3 제거할 수 있는 기능이 있는가?

| 후보 | 제거 결정 | 이유 |
|------|:---------:|------|
| Working Backwards PR/FAQ (Core 04) | 유지 | Core 신설 4개 중 하나 — Amazon 정전급 산출물 |
| 3-Horizon Strategy (Core 05) | **제거 후보** | optional + Strategy Kernel과 중복 가능. 25개에서 제외하고 24개로 축소 가능. 단 25개 균형 고려해 유지 |
| sub-agent 신설 4개 (vision-author / strategy-kernel-author / okr-author / pr-faq-author / roadmap-author) | 유지 | CEO 빈약 + Core/What 신설 후보 — 메타-원칙 적용 사례 |

→ 25개 유지 결정. 단 design phase에서 사용자 피드백에 따라 24개로 축소 가능.

## 3. OUT-OF-SCOPE 명시 (확장 범위 C 채택 후 갱신)

> v1.1: 사용자 CP-1에서 **C. 확장 범위** 채택 → 이전 OUT 일부가 IN으로 이동.

### 3.1 IN으로 이동 (C 채택)

| 이전 OUT 항목 | 이동 | 근거 |
|---------|------|------|
| 단계 간 alignment 검증 메커니즘 | **IN** | C 채택 — `extended-scope.md` 섹션 3, SC-10 |
| 카탈로그 잔여 25개 (총 50+) | **IN** | C 채택 — `extended-scope.md` 섹션 1, SC-08 |
| 모든 44 sub-agent 재정의 | **IN** | C 채택 — `extended-scope.md` 섹션 2, SC-09 |
| ux-researcher 외부 인터뷰 | **IN** | C 채택 — `extended-scope.md` 섹션 4, SC-10 |

### 3.2 여전히 OUT (확장 범위에서도 제외 유지)

| OUT 항목 | 이유 | 후속 처리 |
|---------|------|----------|
| epistemic contract (`i_know` / `i_ask`) | 구조 정돈 후 얹는 레이어 | 선반 보관, 본 phase 완료 후 별도 피처 |
| Uncertainty reporting protocol | 위와 동일 | 선반 보관 |
| Absorb 대화 강제 | absorb-analyzer 대대적 변경 | 후속 피처 `absorb-conversational` |
| 시스템 게이트 매번 묻기 UX (옵션 i) | 옵션 피로감 — D-8 결정 | 영구 거부 |

## 4. Plan-Plus 의도 발견

### 이 피처가 정말 해결하려는 근본 문제는 무엇인가?

표면 문제: "release-engineer가 쓸데없이 CI/CD 만든다"
중간 문제: "sub-agent들이 자동으로 나눠졌고 skill·template이 부실하다"
근본 문제: **"AI 에이전트가 호출되면 자기 임무를 무조건 수행하는 기본 행동 패턴"이 시스템 차원의 anti-pattern. 사용자의 모름·범위 부재를 시스템에 내재화하는 프로토콜이 없음.**

→ 본 피처는 release-engineer만 고치는 게 아니라 **VAIS의 sub-agent 일반의 행동 모델**을 바꾼다.

### 대안 탐색

| # | 대안 | 장점 | 단점 | 채택 |
|---|------|------|------|:----:|
| 1 | sub-agent마다 prompt에 "필요한지 먼저 물어라" 명령 추가 | 단순 | prompt 의존 — 일관성 보장 X | ❌ |
| 2 | 시스템 레벨 게이트 (호출 전 사용자 confirmation) | 강제력 | 매번 묻기 옵션 피로 | ❌ |
| 3 | Project Profile + 산출물 메타데이터 정책 (본 plan 채택) | Profile 1회 합의로 자동 게이트 + 검증 가능 + 카탈로그 표준화 동시 | 작업량 큼 (25개 template) | ✅ |
| 4 | sub-agent 갯수 감축 (44→20개) | 단순화 | 산출물 누락 위험 + 분류 척도 부재 시 자의적 | ❌ |
| 5 | 외부 Reference (Linear/Stripe 등) 그대로 복제 | 빠름 | 회사별 편향 + VAIS 맥락 어긋남 | ❌ |

→ 대안 3 채택 — ideation에서 도출된 메커니즘과 일치.

## 5. 큐레이션 기록

| Source | 채택 | 거절 | 병합 | 추가 | 이유 |
|--------|:----:|:----:|:----:|:----:|------|
| ideation Risk 언급들 | | | ✅ | | R1~R7로 통합 정리 |
| ideation D-11 | ✅ | | | | OUT-OF-SCOPE 명시 (epistemic contract 등) |
| Open Question Q-2~Q-10 | | | ✅ | | 일부는 SC로, 일부는 OUT-OF-SCOPE로, 일부는 후속 phase로 분배 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — 리스크/YAGNI/OUT-OF-SCOPE |
| v1.1 | 2026-04-25 | CPO 재진입: C 확장 범위 채택 → 4개 OUT 항목 IN으로 이동, R1 리스크 명시 감수 |
