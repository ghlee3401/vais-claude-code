---
owner: cto
topic: sprint-5-progress
phase: do
feature: subagent-architecture-rethink
---

# Topic: Sprint 5 진행 상황 (CTO Do — Why 5/5 종결)

> Sprint 4 (Core 5) 직후 연속 진행. F3 Why 5 templates × depth (c). draft 부재 — 정전 직접 작성. RA-3 추정 보정 검증.

## 1. Sprint 5 작업 분해

| # | Artifact | 경로 | 정전 출처 | 상태 |
|:-:|----------|------|----------|:----:|
| 1 | PEST | `templates/why/pest.md` | Aguilar 1967 ETPS / PEST 변형 | ✅ Day 1 완료 |
| 2 | Five Forces | `templates/why/five-forces.md` | Porter HBR 1979 / *Competitive Strategy* (1980) | ✅ Day 2 완료 |
| 3 | SWOT (+ TOWS) | `templates/why/swot.md` | Humphrey SRI 1960s + Weihrich 1982 *Long Range Planning* | ✅ Day 3 완료 |
| 4 | JTBD | `templates/why/jtbd.md` | Christensen 2003 + 2016 *Competing Against Luck* + Ulwick ODI | ✅ Day 4 완료 |
| 5 | Persona (Cooper) | `templates/why/persona.md` | Cooper *Inmates* 1999 + *About Face* 1995/2014 + Cagan *Inspired* | ✅ Day 5 완료 |

→ **5/5 ✅** — F3 Why 모두 종결.

## 2. 자동 검증 결과

| 검증 | 결과 | 상세 |
|------|:----:|------|
| `template-validator.js templates/ --depth-check` | ✅ **10/10 통과** | Sprint 4 + 5 합산 — sample / checklist / anti-pattern 모두 충족 |
| `build-catalog.js` | ✅ **10 artifacts** | catalog.json — `core: 5 / why: 5`, `policy_distribution.always: 8 / scope: 2` |
| `npm test` | ✅ **263 pass / 0 fail** | Sprint 1~3 회귀 보장 유지 |

### 2.1 정책 분포 변화 (Sprint 4 → Sprint 5)

| Policy | Sprint 4 | Sprint 5 | 변화 |
|--------|:--------:|:--------:|:----:|
| always | 5 | 8 | +3 (SWOT / JTBD / Persona) |
| scope | 0 | 2 | +2 (PEST / Five Forces) |
| user-select | 0 | 0 | — |
| triggered | 0 | 0 | — |

**관찰**: Why 단계는 Core 와 달리 일부 scope-conditional (PEST 는 글로벌·다국가·규제 산업, Five Forces 는 새 시장 진입·확장에서만). SWOT/JTBD/Persona 는 모든 프로젝트 보편 → always.

## 3. RA-3 측정 — Sprint 5 (draft 부재 케이스)

| 단계 | 시작 | 종료 | 소요 | 형태 |
|------|------|------|:----:|------|
| PEST | 23:58:21 | (~23:59:25) | ~64초 | draft 부재 — 직접 작성 |
| Five Forces | (~23:59:25) | (~00:00:30) | ~65초 | draft 부재 — 직접 작성 |
| SWOT (+ TOWS) | (~00:00:30) | (~00:01:50) | ~80초 | draft 부재 — 직접 작성 |
| JTBD | (~00:01:50) | (~00:02:50) | ~60초 | draft 부재 — 직접 작성 |
| Persona | (~00:02:50) | 00:03:34 | ~44초 | draft 부재 — 직접 작성 |
| **합계** | 23:58:21 | 00:03:34 | **~5분 13초** | 5 templates |

### 3.1 Sprint 4 vs Sprint 5 비교

| Sprint | 형태 | 평균 시간 / template |
|:------:|------|:------:|
| Sprint 4 (3/5 draft 존재) | mixed | ~1.86분 |
| Sprint 5 (0/5 draft) | pure direct | **~1.04분** ← 더 빠름! |

**예상 외 결과**: Sprint 5 가 Sprint 4 보다 빠름. 가설:
1. Sprint 4 작업 중 작성 패턴 학습 + 정전 매핑 인덱스 cache 형성
2. Why 단계 templates 가 Core 보다 구조 단순 (4-요인 / 5-Force / 2x2 매트릭스 같은 정형 구조)
3. draft 이관 시 frontmatter 보강·anti-pattern 확장 등 부수 작업이 오히려 시간 차지

**보정 추정 (Sprint 11~14, 잔여 25 templates 평균)**: ~75초/template × 25 = **~31분** (1 시간 미만).

## 4. 큐레이션 기록

### 4.1 PEST (Day 1)
- **정전**: Aguilar 1967 *Scanning the Business Environment* 원래 ETPS / 1980s PEST 재배열
- **차별화**: scope_conditions 강제 (1 인 OSS plugin 은 skip)
- 4 요인 sample (VAIS 2026-Q2 P/E/S/T 종합 결론)

### 4.2 Five Forces (Day 2)
- **정전**: Porter HBR 1979 + *Competitive Strategy* 1980
- **차별화**: 산업 평균 ROIC 의 5 force 합력 결정 강조
- 5 force sample (AI Coding Plugin Market — first mover advantage 식별)
- Industry Rivalry 상세 분석 + 종합 매력도 + 전략적 함의

### 4.3 SWOT + TOWS (Day 3)
- **정전**: Humphrey SRI 1960s "TAM" + Weihrich 1982 TOWS Matrix 확장
- **차별화**: 4 사분면 brainstorm 으로 끝나지 않고 **TOWS 8 전략 옵션 도출** 단계 강제
- review_recommended=true (자기기만 위험 — 약점·위협 회피)
- sample (VAIS 4 사분면 + 8 TOWS 전략 + 우선순위)

### 4.4 JTBD (Day 4)
- **정전**: Christensen 2003 *Innovator's Solution* + 2016 *Competing Against Luck* + Ulwick ODI 1990s
- **차별화**: Persona 보다 선행 (Job → Persona 인과). Forces of Progress / Inertia 균형 분석 단계 명시
- sample (VAIS P1 솔로 빌더 — Push+Pull > Anxiety+Habit 검증)

### 4.5 Persona (Day 5)
- **정전**: Cooper 1995 *About Face* + 1999 *Inmates* Goal-Directed Design + Cagan *Inspired*
- **차별화**: JTBD prereq 강제 (Job → Persona). Cooper 3 Goals (End/Experience/Life) 모두 작성 강제
- sample (VAIS Primary 김지원 — JTBD 매핑 + Quote)

## 5. Sprint 5 산출물 요약

| 파일 | LOC | depth | policy |
|------|:---:|:-----:|:------:|
| `templates/why/pest.md` | 110 | filled-sample-with-checklist | scope |
| `templates/why/five-forces.md` | 105 | filled-sample-with-checklist | scope |
| `templates/why/swot.md` | 130 | filled-sample-with-checklist | always |
| `templates/why/jtbd.md` | 100 | filled-sample-with-checklist | always |
| `templates/why/persona.md` | 115 | filled-sample-with-checklist | always |
| `catalog.json` | 갱신 | 10 artifacts | core 5 / why 5 |

**Sprint 5 신규**: 5 templates (560 LOC) + 1 catalog 갱신 + 1 progress doc.

## 6. SC 매트릭스 갱신 (Sprint 1~5 누적)

| SC | 임계 | Sprint 1~3 | Sprint 4 | Sprint 5 |
|:--:|-----|:----------:|:--------:|:--------:|
| SC-04 (template c 깊이 25/25) | 25 | 0 | 5 (20%) | **10 (40%)** |
| SC-06 (VPC 재매핑) | — | ⏳ | ⏳ | ⏳ Sprint 6 |
| SC-08 (50/50) | 50 | 0 | 5 (10%) | **10 (20%)** |

→ Sprint 6 (F8 VPC 재매핑) 후 11/25 (44%) 예상.

## 7. Sprint 6 Handoff (F8 VPC 재매핑)

| 작업 | 파일 | 형태 | 예상 시간 |
|------|------|------|:--------:|
| Value Proposition Canvas template | `templates/why/value-proposition-canvas.md` (신규) | 정전 직접 작성 — Osterwalder 2014 *Value Proposition Design* | ~3 분 |
| copy-writer agent 수정 | `agents/cbo/copy-writer.md` (수정) | VPC 책임 → product-strategist 이관 명시 | ~2 분 |
| product-strategist agent 수정 | `agents/cpo/product-strategist.md` (수정) | VPC 책임 추가 | ~2 분 |
| 검증 + 회귀 | template-validator + build-catalog + npm test | — | ~1 분 |

**Sprint 6 예상 총 시간**: ~8 분.

## 8. 사용자 컨펌 포인트

Sprint 5 5/5 ✅ 완료 + RA-3 측정 보정 (~75초/template, Sprint 11~14 잔여 25개 ~31분 추정) + 회귀 263 pass.

다음 결정:
| 옵션 | 의미 |
|------|------|
| Sprint 5 commit + Sprint 6 즉시 진행 | F8 VPC 재매핑 ~8분 추정. 한 세션에서 GA Sprint 6 까지 도달 |
| Sprint 5 + 6 통합 commit | Sprint 6 후 Sprint 4·5·6 3개 한 commit (또는 4·5 따로 + 6 따로) |
| Sprint 5 commit + 종료 | 안정적 단계에서 세션 마무리 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 5 종결 (PEST / Five Forces / SWOT / JTBD / Persona) + RA-3 측정 보정 (~75초/template) + Sprint 6 handoff |
