---
owner: cto
agent: cto-direct
artifact: roi-analysis
phase: report
feature: simplify-non-cto-workflow
generated: 2026-05-03
summary: "v2.0 ROI 정성+추정. 토큰 ~50% 절감 / 사용자 부담 ~60% 감소 / 일관성 개선. 다음 피처부터 실측 비교 baseline 수립."
---

# ROI Analysis — v2.0 정량/정성 효과 추정

> 본 문서 = 추정치 (baseline). 실측은 다음 1~3 피처 누적 후 비교 분석 권장.

## 메트릭 1: 토큰 사용량 (per phase 추정)

### Before (v0.62 — `_tmp` + 큐레이션 모델)

```
[per phase 토큰 흐름]
sub-agent → _tmp/{slug}.md 작성 (full 본문)              ~3000 tokens
C-Level → _tmp/*.md 모두 Read                          ~3000 tokens (재읽기)
C-Level → topic 별 합성 + 큐레이션                       ~2000 tokens (압축 작성)
main.md 작성 (Topic Documents + Scratchpads + 큐레이션)  ~1500 tokens
─────────────────────────────────────────────────
                                              합계 ~9500 tokens
```

### After (v2.0 — 직접 박제)

```
[per phase 토큰 흐름]
sub-agent → docs/{feature}/{phase}/{artifact}.md 직접 박제  ~3000 tokens
C-Level → frontmatter 만 읽고 main.md 인덱스 생성             ~1500 tokens
─────────────────────────────────────────────────
                                              합계 ~4500 tokens
```

**절감**: ~5000 tokens / phase = **~52%**

> 근사치. 실측은 다음 피처에서 `tokens.metric.json` 추적 (TODO follow-up).

## 메트릭 2: 사용자 클릭 횟수 (per phase 추정)

### Before (v0.62)

| 시점 | 클릭 | 누적 |
|------|:----:|:----:|
| Plan 시작 (CP-1 범위 선택) | 1 | 1 |
| Plan 끝 - 다음 C-Level (자연어 안내 + AskUserQuestion 혼용) | 2~3 | 3~4 |
| Design CP-D | 1 | 4~5 |
| Do CP-2 | 1 | 5~6 |
| Do 진행 중 디버깅 / 미세 결정 | 2~3 | 7~9 |
| QA CP-Q | 1 | 8~10 |
| **per phase 평균** | — | **~8~10 클릭** |

### After (v2.0 — AskUserQuestion 클릭만)

| 시점 | 클릭 | 누적 |
|------|:----:|:----:|
| CEO 7 차원 분석 → 활성 C-Level 자동 결정 | 1 | 1 |
| Plan CP-1 | 1 | 2 |
| Design CP-D (자동 판정 통과 시 스킵 가능) | 0~1 | 2~3 |
| Do 자동 진행 (개입 필요 시만 클릭) | 1~2 | 3~5 |
| QA 결과 (PASS 시 자동 통과) | 0~1 | 3~6 |
| **per phase 평균** | — | **<5 클릭** |

**감소**: ~50%. 자가 점검 블록이 자연어 안내를 차단하여 클릭 흐름 단순화.

## 메트릭 3: 일관성 (정성)

### Before
- 매 피처마다 사용자/AI 가 "어떤 C-Level 호출할까?" "어떤 분석 frame 쓸까?" 매번 결정
- 같은 피처를 다른 시점에 다시 작업하면 다른 C-Level 활성화 가능
- 사용자가 "왜 이 분석은 안 했어?" 자주 질문

### After
- CEO 7 차원 알고리즘이 결정적 (deterministic) → 같은 입력 → 같은 출력
- 매 피처 같은 알고리즘 → 사용자가 "다음에는 어떻게 될까?" 예측 가능
- AskUserQuestion 자가 점검 블록 → 응답 형식 일관성 ↑

**효과**: 사용자 학습 곡선 ↓, 결과 예측 가능성 ↑

## 메트릭 4: 정보 손실 (정량)

### Before
- sub-agent _tmp 본문 → C-Level 큐레이션 시 압축 + 채택/거절/병합 → 일부 분석 누락 위험
- 각 main.md 의 Topic Documents 가 "왜 채택" 만 기록 — 거절 이유는 _tmp 에만

### After
- sub-agent 가 작성한 artifact MD = 산출물 그대로 (큐레이션 X)
- 정보 손실 = **0 lines**
- main.md 인덱스가 frontmatter `summary` 자동 추출 → 압축은 frontmatter 에 한정 (≤200자)

**효과**: 본문 정보 100% 보존 + 인덱스 토큰 효율 동시 달성

## 메트릭 5: 외부 사용자 마이그레이션 비용

### Before (v0.61.x → v0.62)
- design-system MCP 활성화 시 Python 3.8+ 필수 → Hard fail 가능
- vendor/ 의존 추가

### After (v0.62 → v2.0)
- **Breaking change 0** (impact-analysis 6 영역 ❌, qa 6/6 입증)
- 외부 사용자 즉시 사용 가능
- 옛 `_tmp/` 모델도 보존 (git 잔존)

**효과**: 마이그레이션 비용 ≈ **0** (re-install 만 필요)

## 종합 ROI 표

| 영역 | Before | After | 효과 |
|------|--------|-------|:----:|
| 토큰/phase | ~9500 | ~4500 | -52% |
| 클릭/phase | 8~10 | <5 | -50% |
| 일관성 | 매번 결정 | 결정적 알고리즘 | 정성 ↑↑ |
| 정보 손실 | 일부 | 0 | 100% 보존 |
| 마이그레이션 비용 | 변동 | ~0 | breaking 0 |

## 다음 단계 (실측 baseline)

1. 다음 1~3 피처 마치면 실제 토큰/클릭 측정
2. 본 문서의 추정치와 비교 분석
3. 차이가 ±10% 이상이면 ROI Analysis v2.0 으로 갱신

> 측정 instrumentation 은 follow-up 피처 (`token-metric-tracker`) 로 분리 권장.

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-03 | 5 메트릭 추정 (토큰 -52%, 클릭 -50%, 일관성 ↑, 정보 손실 0, 마이그레이션 ~0). 다음 1~3 피처에서 실측 baseline 비교 권장. |
