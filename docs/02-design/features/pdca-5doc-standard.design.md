# pdca-5doc-standard Design Document

> **Summary**: PDCA 5문서 표준화 — Option C (Pragmatic Balance) 설계
>
> **Plan Reference**: `docs/01-plan/features/pdca-5doc-standard.plan.md`
> **Date**: 2026-04-01
> **Status**: Draft

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | CTO만 표준 PDCA 문서를 만들고 다른 C레벨은 각자 다른 경로. Do 단계 문서 부재로 구현 결정 추적 불가 |
| **WHO** | vais-code 플러그인 사용자 (개발자) |
| **RISK** | 물리 폴더 rename 시 기존 문서 참조 파괴 가능성 |
| **SUCCESS** | 모든 C레벨이 동일한 5문서 경로 사용, Do 단계에서 `.do.md` 생성, Report 단일 문서에 전 도메인 집약 |
| **SCOPE** | agents/ 7개 파일 수정 + docs/03-do/ 폴더 신설 |

---

## Architecture: Option C — Pragmatic Balance

agents/ 파일 수정으로 즉시 표준 경로 반영. 물리 폴더 rename은 Do 단계에서 처리.

```
수정 파일 (7개):
  [P1] agents/cto.md      ← Do 문서 경로 추가, 경로 번호 수정 (03→04 analysis, 04→05 report)
  [P3] agents/cfo.md      ← Report 섹션 흡수, 경로 번호 수정
  [P3] agents/cmo.md      ← Report 섹션 흡수
  [P3] agents/cso.md      ← Report 섹션 흡수
  [P3] agents/coo.md      ← Report 섹션 흡수
  [P4] agents/ceo.md      ← 경로 번호 수정
  [P4] agents/cpo.md      ← 경로 번호 확인 및 수정

신규 폴더:
  docs/03-do/features/    ← Do 문서 저장 경로

마이그레이션 가이드 (Do 단계 수행):
  docs/03-analysis/ → docs/04-analysis/
  docs/04-report/   → docs/05-report/
```

---

## 1. File: `agents/cto.md` (FR-01, FR-03, FR-05, FR-06)

### 1.1 PDCA 사이클 표 수정

**현재**:
```markdown
| 단계 | 실행자 | 내용 | 산출물 |
| Plan | 직접 | ... | `docs/01-plan/{feature}.plan.md` |
| Design | design + architect | ... | `docs/02-design/{feature}.design.md` |
| Do | frontend + backend | ... | 구현 코드 |
| Check | qa | ... | `docs/04-qa/{feature}-qa.md` |
| Report | 직접 | ... | `.vais/memory.json` |
```

**변경 후**:
```markdown
| 단계 | 실행자 | 내용 | 산출물 |
| Plan | 직접 | 요구사항 탐색 → 범위 3옵션 → 기술 계획서 | `docs/01-plan/features/{feature}.plan.md` |
| Design | design + architect | 화면설계 + 인프라 설계 (Agent 병렬 호출) | `docs/02-design/features/{feature}.design.md` |
| Do | frontend + backend | 병렬 구현 (Agent 병렬 호출) | `docs/03-do/features/{feature}.do.md` + 구현 코드 |
| Check | qa | 빌드+테스트+갭 분석 | `docs/04-analysis/features/{feature}.analysis.md` |
| Report | 직접 | memory 기록 + 완료 보고서 | `docs/05-report/features/{feature}.report.md` |
```

### 1.2 Do 문서 생성 지시 추가

frontend+backend 에이전트 위임 완료 후 추가할 지시:

```markdown
### Do 문서 생성 (구현 완료 후 필수)

구현 완료 후 `docs/03-do/features/{feature}.do.md`를 생성:

| 섹션 | 내용 |
|------|------|
| 구현 결정사항 | 주요 결정과 이유 (Design 대비 변경 포함) |
| 변경 파일 목록 | 생성/수정/삭제된 파일 경로 |
| Design 이탈 항목 | 설계 대비 달라진 부분 + 이유 |
| 미완료 항목 | 다음 세션 인계 항목 |
| 발견한 기술 부채 | 우선순위(High/Medium/Low) 포함 |
```

### 1.3 기존 경로 참조 수정

`agents/cto.md` 내 모든 `docs/03-analysis/` → `docs/04-analysis/`  
`agents/cto.md` 내 모든 `docs/04-qa/` → `docs/04-analysis/`  
`agents/cto.md` 내 모든 `docs/04-report/` → `docs/05-report/`

---

## 2. File: `agents/cfo.md` (FR-10, FR-16)

### 2.1 PDCA 사이클 표 수정

**현재**:
```markdown
| Report | 직접 | 재무 분석 보고서 저장 | `docs/06-finance/{feature}-finance.md` |
```

**변경 후**:
```markdown
| Report | 직접 | 재무 분석 결과를 통합 보고서에 기록 | `docs/05-report/features/{feature}.report.md` 의 `## CFO Analysis` 섹션 |
```

### 2.2 Report 섹션 작성 지시 추가

```markdown
### CFO Report 섹션 작성

`docs/05-report/features/{feature}.report.md` 파일이 존재하면 해당 파일의
`## CFO Analysis` 섹션에 재무 분석을 추가. 파일이 없으면 생성 후 작성.

**섹션 구조**:
```markdown
## CFO Analysis

### 비용-편익 요약
| 항목 | 금액/수치 | 비고 |
|------|-----------|------|

### ROI 분석
- 예상 투자 비용: ...
- 예상 수익/절감: ...
- 회수 기간: ...

### 재무 리스크
- ...
```
```

### 2.3 경로 수정

`agents/cfo.md` 내 `docs/06-finance/` 경로는 deprecated 주석 추가:
```markdown
<!-- deprecated: docs/06-finance/ → docs/05-report/ 섹션으로 통합됨 -->
```

---

## 3. File: `agents/cmo.md` (FR-11)

### 3.1 PDCA 사이클 표 수정

**현재**:
```markdown
| Report | 직접 | 통합 마케팅 전략 문서 저장 | `docs/05-marketing/{feature}.md` |
```

**변경 후**:
```markdown
| Report | 직접 | 마케팅 분석 결과를 통합 보고서에 기록 | `docs/05-report/features/{feature}.report.md` 의 `## Marketing Impact` 섹션 |
```

### 3.2 Report 섹션 작성 지시 추가

```markdown
### Marketing Report 섹션 작성

`docs/05-report/features/{feature}.report.md`의 `## Marketing Impact` 섹션에 작성.

**섹션 구조**:
```markdown
## Marketing Impact

### SEO 점수
- 현재: {점수} / 목표: {점수}

### 주요 개선 항목
| 항목 | 현재 | 개선 후 |
|------|------|---------|

### KPI 달성 여부
- ...
```
```

---

## 4. File: `agents/cso.md` (FR-12)

### 4.1 PDCA 사이클 표 수정

**현재**:
```markdown
| Report | 직접 | 보안 보고서 최종화 | `docs/04-qa/{feature}-security.md` |
```

**변경 후**:
```markdown
| Report | 직접 | 보안 검토 결과를 통합 보고서에 기록 | `docs/05-report/features/{feature}.report.md` 의 `## Security Review` 섹션 |
```

### 4.2 Report 섹션 작성 지시 추가

```markdown
### Security Report 섹션 작성

`docs/05-report/features/{feature}.report.md`의 `## Security Review` 섹션에 작성.

**섹션 구조**:
```markdown
## Security Review

### Gate 결과
- Gate A (보안 검토): PASS / FAIL
- Gate B (플러그인 배포): PASS / FAIL / N/A

### 발견된 취약점
| 심각도 | 항목 | 조치 |
|--------|------|------|

### 배포 승인 여부
- [ ] 승인 / [ ] 조건부 승인 / [ ] 차단
```
```

---

## 5. File: `agents/coo.md` (FR-13)

### 5.1 PDCA 사이클 표 수정

**현재**:
```markdown
| Report | 직접 | 운영 보고서 저장 | `docs/07-ops/{feature}-ops.md` |
```

**변경 후**:
```markdown
| Report | 직접 | 운영 분석 결과를 통합 보고서에 기록 | `docs/05-report/features/{feature}.report.md` 의 `## Operations Status` 섹션 |
```

### 5.2 Report 섹션 작성 지시 추가

```markdown
### Operations Report 섹션 작성

`docs/05-report/features/{feature}.report.md`의 `## Operations Status` 섹션에 작성.

**섹션 구조**:
```markdown
## Operations Status

### CI/CD 파이프라인 상태
- 배포 상태: ...
- 빌드 성공률: ...

### 모니터링 지표
| 지표 | 현재 | 목표 |
|------|------|------|

### 운영 이슈
- ...
```
```

---

## 6. File: `agents/ceo.md` (FR-15)

### PDCA 표 경로 수정

CEO agent의 PDCA 표 내 경로 참조 확인 후 새 번호 체계 반영.  
현재 CEO PDCA 산출물은 주로 `.vais/memory.json`이므로 경로 변경 최소.

---

## 7. File: `agents/cpo.md` (FR-14, FR-16)

### PRD 경로 유지 확인

CPO의 `docs/00-pm/{feature}.prd.md`는 기획 단계 산출물로 **변경 없음**.  
내부 참조 경로 중 `docs/03-analysis/` → `docs/04-analysis/` 수정.

---

## 8. Do 문서 구조 (FR-01, FR-02)

### `docs/03-do/features/{feature}.do.md` 표준 구조

```markdown
# {feature} Do Log

> **Feature**: {feature}
> **Session**: {N}
> **Date**: YYYY-MM-DD
> **Status**: In Progress | Completed

---

## 1. 구현 결정사항

| 결정 항목 | 선택 | 이유 |
|-----------|------|------|
| {항목} | {선택값} | {Design 대비 변경 이유 또는 유지 이유} |

## 2. 변경 파일 목록

| 파일 | 변경 유형 | 비고 |
|------|-----------|------|
| `path/to/file` | Create / Modify / Delete | |

## 3. Design 이탈 항목

| Design §섹션 | 설계 내용 | 실제 구현 | 이유 |
|--------------|-----------|-----------|------|
| (없으면 "없음") | | | |

## 4. 미완료 항목 (다음 세션 인계)

- [ ] {항목} — {이유}

## 5. 발견한 기술 부채

| 항목 | 우선순위 | 관련 파일 |
|------|----------|-----------|
| (없으면 "없음") | | |
```

---

## 9. Report 통합 구조 (FR-09)

### `docs/05-report/features/{feature}.report.md` 표준 섹션 순서

```markdown
# {feature} Report

## 1. Executive Summary (CTO)
## 2. Technical Results
## 3. CFO Analysis          ← CFO 실행 시 작성, 미실행 시 "N/A — CFO 검토 미수행"
## 4. Security Review       ← CSO 실행 시 작성, 미실행 시 "N/A"
## 5. Marketing Impact      ← CMO 실행 시 작성, 미실행 시 "N/A"
## 6. Operations Status     ← COO 실행 시 작성, 미실행 시 "N/A"
```

---

## 10. 마이그레이션 가이드 (FR-07)

Do 단계에서 다음 명령 실행:

```bash
# 물리 폴더 rename
mv docs/03-analysis docs/04-analysis
mv docs/04-report docs/05-report

# docs/03-do 폴더 신설
mkdir -p docs/03-do/features
```

---

## 11. Implementation Guide

### 11.1 Implementation Order

| 순서 | 파일 | 작업 | 우선순위 |
|------|------|------|----------|
| 1 | `docs/03-do/features/` | 폴더 신설 | P1 |
| 2 | `agents/cto.md` | PDCA 표 수정 + Do 문서 지시 추가 + 경로 번호 수정 | P1 |
| 3 | `agents/cfo.md` | Report 섹션 흡수 + 경로 deprecated 처리 | P3 |
| 4 | `agents/cmo.md` | Report 섹션 흡수 | P3 |
| 5 | `agents/cso.md` | Report 섹션 흡수 | P3 |
| 6 | `agents/coo.md` | Report 섹션 흡수 | P3 |
| 7 | `agents/ceo.md` | 경로 번호 수정 | P4 |
| 8 | `agents/cpo.md` | 경로 번호 수정 (PRD 경로 유지) | P4 |
| 9 | 마이그레이션 | docs/ 폴더 rename + 신설 | P2 |

### 11.2 Verification Checklist

- [ ] SC-01: `agents/cto.md` PDCA 표에 `docs/03-do/features/` 경로 존재
- [ ] SC-02: CFO/CMO/CSO/COO 산출물이 `docs/05-report/` 섹션 가리킴
- [ ] SC-03: old 경로 잔존 여부 — `grep -r "docs/03-analysis\|docs/04-report\|docs/06-finance\|docs/07-ops" agents/`
- [ ] SC-04: `docs/03-do/features/` 폴더 존재

### 11.3 Session Guide

**Module Map**:
| 모듈 | 파일 | 예상 작업량 |
|------|------|-------------|
| M1: CTO Do 추가 | `agents/cto.md` | Small (PDCA 표 + 지시 블록 추가) |
| M2: 폴더 신설 + 마이그레이션 | `docs/` | XSmall (mkdir + mv) |
| M3: CFO/CMO/CSO/COO 흡수 | 4개 agent 파일 | Medium (각 파일 Report 섹션 추가) |
| M4: CEO/CPO 경로 수정 | 2개 agent 파일 | XSmall |

**권장 세션 분할**: 단일 세션으로 처리 가능 (전체 ~50줄 수정)
