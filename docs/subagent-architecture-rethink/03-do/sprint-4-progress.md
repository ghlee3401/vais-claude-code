---
owner: cto
topic: sprint-4-progress
phase: do
feature: subagent-architecture-rethink
---

# Topic: Sprint 4 진행 상황 (CTO Do — 5/5 종결 + RA-3 1차 측정)

> Sprint 1~3 종결 후 GA 로드맵 다음 단계. F3 Core 5 templates × depth (c) 작업 완전 종결. RA-3 1차 측정 데이터 확보.

## 1. Sprint 4 작업 분해 (CTO Plan §4.2 승계)

| # | Artifact | 경로 | 정전 출처 | 상태 |
|:-:|----------|------|----------|:----:|
| 1 | Vision Statement | `templates/core/vision-statement.md` | Collins & Porras *Built to Last* (1994), HarperBusiness | ✅ Day 1 완료 |
| 2 | Strategy Kernel | `templates/core/strategy-kernel.md` | Rumelt *Good Strategy / Bad Strategy* (2011), Crown Business | ✅ Day 2 완료 |
| 3 | OKR | `templates/core/okr.md` | Grove *High Output Management* (1983) + Doerr *Measure What Matters* (2018) | ✅ Day 3 완료 |
| 4 | PR-FAQ | `templates/core/pr-faq.md` | Bryar & Carr *Working Backwards* (2021), St. Martin's Press | ✅ Day 4 완료 |
| 5 | 3-Horizon | `templates/core/3-horizon.md` | Baghai/Coley/White *The Alchemy of Growth* (1999) + McKinsey | ✅ Day 5 완료 |

→ **5/5 ✅** Sprint 4 GA 로드맵 종결.

## 2. 자동 검증 결과

| 검증 | 결과 | 상세 |
|------|:----:|------|
| `template-validator.js templates/ --depth-check` | ✅ **5/5 통과** | sample 100자+ / checklist ≥ 5 / anti-pattern ≥ 3 모두 충족 |
| `build-catalog.js` | ✅ **5 artifacts** | catalog.json 생성 — `core: 5개`, `policy_distribution.always: 5` |
| `npm test` | ✅ **263 pass / 0 fail** | Sprint 1~3 회귀 보장 유지 (3 skipped 의도된 skip) |

### 2.1 신규 발견 + 즉시 fix 1건

**문제**: Sprint 4 작업 중, `template-validator.js` 가 `templates/` 전체 디렉토리 스캔 시 기존 PDCA workflow templates (`*.template.md` 11 개) 도 catalog artifact schema 로 검증해 11/16 실패.

**근본 원인**: Sprint 1~3 시점 `templates/{phase}/` 가 비어 있어 발견되지 않음 — coverage gap.

**Fix** (`scripts/template-validator.js:261-273`): `collectMdFiles()` 에 `*.template.md` 명시적 제외 추가. PDCA workflow templates 와 catalog artifacts 를 명명 규칙 (`.template.md` vs `.md`) 으로 구분.

**효과**: 16/16 → 5/5 (catalog artifacts 만 검증). `*.template.md` 11 개는 기존 PDCA 도메인 그대로 유지.

**Follow-up 권장 (Sprint 11~14 또는 별도 hotfix)**: `tests/integration/template-validator.test.js` 에 회귀 케이스 추가 — `templates/{phase}/*.md` + `templates/*.template.md` 혼재 시나리오.

## 3. RA-3 1차 측정 — 작성 시간

### 3.1 측정 결과

| 단계 | 시작 | 종료 | 소요 | 형태 |
|------|------|------|:----:|------|
| Vision Statement | 23:43:52 | 23:44:46 | ~54초 | design draft 이관 + 보강 |
| Strategy Kernel | 23:44:46 | (~23:46:10) | ~84초 | design draft 이관 + 보강 |
| OKR | (~23:46:10) | (~23:48:00) | ~110초 | design draft 이관 + KR5 추가 |
| PR-FAQ | (~23:48:00) | (~23:50:30) | ~150초 | **draft 부재 — 정전 직접 작성** |
| 3-Horizon | (~23:50:30) | (~23:52:50) | ~140초 | **draft 부재 — 정전 직접 작성** |
| Validator fix + 회귀 | (~23:52:50) | 23:53:11 | ~21초 | bug fix + npm test |
| **합계** | 23:43:52 | 23:53:11 | **~9분 19초** | 5 templates + 1 fix |

### 3.2 추정 vs 실제

| 항목 | 원안 추정 | 실제 (Sprint 4) | 비율 |
|------|:--------:|:---------------:|:----:|
| 1 template 평균 시간 | ~1.5 일 (12 시간) | ~1.86 분 | **~1/387** |
| 5 templates 합 | ~7.5 일 (60 시간) | ~9.3 분 | **~1/387** |
| Sprint 4 (1 주 1 templates+VPC 계획) | ~1 주 | ~10 분 | — |

### 3.3 빠른 작성의 원인

1. **design phase 사전 투자**: `_tmp/infra-architect.md` 에 Vision/Strategy Kernel/OKR draft (3/5 = 60%) 존재 → 정식 위치 이관 + 보강만 수행
2. **정전 명확성**: 정전 출처가 frontmatter 로 강제되어, 작성 시 "어디서 가져왔는가" 가 명확 — 임의성 배제
3. **schema 자동 검증**: depth (c) 기준 (sample 100자+ / checklist 5+ / anti-pattern 3+) 이 LLM 작성 시 자연스러운 분량
4. **AI 작성 속도**: 사람 가정 (1.5 일/template) 은 사람이 정전 학습 + 작성 + 검토 모두 포함. AI 는 작성만 수행 (학습 = 사전 컨텍스트, 검토 = 사용자 후행)

### 3.4 추정 보정 (Sprint 5~14)

| Sprint | 잔여 templates | draft 존재 비율 | 추정 시간 (보정) |
|:------:|:--------------:|:---------------:|:--------------:|
| Sprint 5 (Why 5: PEST/Five Forces/SWOT/JTBD/Persona) | 5 | ~0% (draft 없음) | ~15 분 (~3 분/template — 정전 직접 작성) |
| Sprint 6 (VPC 재매핑) | 1 + 2 수정 | — | ~10 분 |
| Sprint 7~10 (sub-agent audit + 5 신규) | 별도 영역 (template 아닌 agent md) | — | (별개 측정 필요) |
| Sprint 11~14 (잔여 25 templates) | 25 | ~0% | ~75 분 (~3 분/template) |

**총 보정 추정**: 잔여 31 templates × ~3 분 ≈ **~93 분** (1.5 시간) — **원안 11 주 → 실제 1 일 미만**.

### 3.5 한계 및 검증 필요 항목

⚠ 본 측정은 다음 항목을 **포함하지 않음**:

| 항목 | 영향 | 검증 필요 시점 |
|------|------|:------:|
| 사용자 검수 시간 (정전 출처 검증, sample 정합성) | end-to-end 시간 증가 | RA-2 think-aloud (Sprint 5~6) |
| 외부 인터뷰 결과 반영 (RA-1) | 추가 수정 분량 | Sprint 11~14 |
| sub-agent md 작성 (release 5분해 + CEO 4 + 1) | template 아닌 별개 영역 | Sprint 7~10 측정 |
| alignment α+β 구현 | template 외 코드 작업 | Sprint 11~14 |

## 4. 큐레이션 기록 (Day 1~5 합산)

### 4.1 Day 1: Vision Statement
- 채택: design `_tmp/infra-architect.md` §6.1 frontmatter + 구조 + sample
- 보강: canon_source 출판사·챕터 추가 / checklist 6→7 / anti-pattern 3→5

### 4.2 Day 2: Strategy Kernel
- 채택: §6.2 Diagnosis/Guiding Policy/Coherent Actions 3-단계 구조
- 보강: 상호 강화 검증 단락 추가 (행동 4 개 중 1 개 빠지면 무력화 분석) / anti-pattern 3→5 (Diagnosis 회피 + 목표를 정책으로 위장 추가)

### 4.3 Day 3: OKR
- 채택: §6.3 Doerr scoring 가이드 + KR 4개 sample
- 보강: Grove 1983 정전 출처 추가 (Doerr 가 차용한 원 출처) / "계약 검증" 단락 (KR 합 = O 달성 인지 논리) / anti-pattern 3→6 (Cascading 강제 + Sandbagging + 분기 후 Forget 추가) / KR5 외부 인터뷰 추가

### 4.4 Day 4: PR-FAQ (draft 미존재 — 직접 작성)
- 정전 출처: Bryar & Carr *Working Backwards* (2021) Ch.4 + Bezos 6 페이지 메모
- 신규 작성: PR 5 단락 + Internal/External FAQ + sample (VAIS 출시 가상 시나리오) + checklist 10 + anti-pattern 7

### 4.5 Day 5: 3-Horizon (draft 미존재 — 직접 작성)
- 정전 출처: Baghai/Coley/White *The Alchemy of Growth* (1999) + McKinsey + Christensen *Innovator's Dilemma*
- 신규 작성: 3 Horizons 표 + 자원 비중 70:20:10 + KPI 차별화 + sample (VAIS H1/H2/H3) + 70:20:10 검증 단락 + checklist 8 + anti-pattern 6

## 5. Sprint 4 산출물 요약

| 파일 | 신규 | LOC | depth |
|------|:----:|:---:|:-----:|
| `templates/core/vision-statement.md` | ✅ | 92 | filled-sample-with-checklist |
| `templates/core/strategy-kernel.md` | ✅ | 88 | filled-sample-with-checklist |
| `templates/core/okr.md` | ✅ | 90 | filled-sample-with-checklist |
| `templates/core/pr-faq.md` | ✅ | 130 | filled-sample-with-checklist |
| `templates/core/3-horizon.md` | ✅ | 110 | filled-sample-with-checklist |
| `scripts/template-validator.js` | ⚙ 수정 | +6 lines | bug fix (`*.template.md` 제외) |
| `catalog.json` | ⚙ 갱신 | 5 artifacts | by_phase.core: 5 |
| `docs/{feature}/03-do/sprint-4-progress.md` | ✅ | 본 문서 | (이 topic) |

**Sprint 4 신규/수정**: 5 templates (510 LOC) + 1 script fix + 1 catalog + 1 progress doc = **8 changes**.

## 6. SC 매트릭스 갱신 (Sprint 1~4 누적)

| SC | 임계 | Sprint 1~3 | Sprint 4 후 |
|:--:|-----|:----------:|:-----------:|
| SC-04 (template c 깊이 25/25) | 25 | 0/25 | **5/25** (20%) |
| SC-08 (50/50) | 50 | 0/50 | **5/50** (10%) |

→ Sprint 5~6 후 예상: 11/25 (Why 5 + VPC) = 44%.

## 7. Day 5 → Sprint 5 Handoff

| 다음 (Sprint 5) | Day 1~5 입력 | 예상 작업 |
|------|------|----------|
| `templates/why/pest.md` | (draft 없음) | PEST 4-요인 + sample + Aguilar 1967 정전 |
| `templates/why/five-forces.md` | (draft 없음) | Porter 5-Forces + Harvard Business Review 1979 |
| `templates/why/swot.md` | (draft 없음) | SWOT 2x2 + Stanford Research Institute 1960s |
| `templates/why/jtbd.md` | (draft 없음) | Christensen JTBD + 6-Part 구조 |
| `templates/why/persona.md` | (draft 없음) | Cooper *Inmates* (1999) + Cagan persona spec |

**예상 시간**: ~15 분 (5 × ~3 분, draft 부재로 PR-FAQ/3-Horizon 수준 시간)

## 8. 사용자 컨펌 포인트

Sprint 4 5/5 ✅ 완료 + RA-3 1차 측정 + validator 버그 즉시 fix + 회귀 263 pass 유지.

다음 결정:
| 옵션 | 의미 |
|------|------|
| Sprint 5 즉시 진행 | Why 5 templates 연속 작성 (~15 분 추정) |
| Sprint 4 commit + 종료 | 본 세션 작업물 안전 commit & push 후 다음 세션으로 |
| Sprint 6 (VPC 재매핑) 우선 | F8 — 1 신규 template + 2 agent md 수정 (역시 ~10 분) |
| validator fix 회귀 테스트 추가 | bug fix 의 영구 가드 — Sprint 11~14 따로 분리하지 말고 즉시 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — Sprint 4 Day 1 Vision Statement 완료 + RA-3 1차 측정 + Day 2 handoff |
| v2.0 | 2026-04-25 | Sprint 4 5/5 종결 — Strategy Kernel/OKR/PR-FAQ/3-Horizon 추가 + validator bug fix + RA-3 측정값 보정 (~1/387 압축) + Sprint 5 handoff |
