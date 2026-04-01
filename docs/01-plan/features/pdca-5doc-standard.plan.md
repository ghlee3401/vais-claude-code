# pdca-5doc-standard Planning Document

> **Summary**: VAIS Code PDCA 5문서 표준화 — Do 로그 문서 신설, docs/ 경로 재번호화, C레벨 도메인 문서를 Report 섹션으로 흡수
>
> **Project**: vais-code
> **Version**: 0.29.0
> **Author**: ghlee3401
> **Date**: 2026-04-01
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | PDCA 5단계(Plan/Design/Do/Check/Report) 중 Do만 문서가 없어 세션 간 구현 결정사항 유실. C레벨마다 다른 산출물 경로로 일관성 없음 |
| **Solution** | Do 로그 문서 신설 (`docs/03-do/`), docs/ 경로 재번호화 (5문서 체계), C레벨 도메인 경량 문서를 Report 섹션으로 흡수 |
| **Function/UX Effect** | 어떤 C레벨에 위임해도 동일한 5문서 구조 생성. Do 로그로 세션 간 컨텍스트 유지 가능 |
| **Core Value** | VAIS Code 전 C레벨이 bkit 표준 PDCA를 따르는 일관된 AI Native 개발 플로우 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | CTO만 표준 PDCA 문서를 만들고 CFO/CMO/CSO/COO는 각자 다른 경로에 경량 문서만 생성. Do 단계 문서 부재로 구현 결정사항 추적 불가 |
| **WHO** | vais-code 플러그인 사용자 (개발자) |
| **RISK** | docs/ 경로 재번호화로 기존 문서 참조 파괴 가능성. Do 문서가 과도하게 무거워지면 오히려 Do 단계 저항감 증가 |
| **SUCCESS** | (1) 모든 C레벨이 동일한 5문서 경로 사용, (2) Do 단계 완료 시 `.do.md` 생성, (3) Report 단일 문서에 전 도메인 결과 집약 |
| **SCOPE** | agents/ 7개 파일 수정 + docs/ 폴더 구조 변경 (기존 문서 마이그레이션 가이드 포함) |

---

## 1. Overview

### 1.1 Purpose

VAIS Code의 PDCA 문서 구조를 5단계(Plan/Design/Do/Analysis/Report)로 표준화한다.
현재 누락된 Do 로그 문서를 신설하고, C레벨별로 분산된 도메인 산출물을 Report 단일 문서로 통합한다.

### 1.2 Background

**현재 문제**:

| 이슈 | 현황 | 목표 |
|------|------|------|
| Do 문서 부재 | 구현 결정사항이 코드 주석에만 존재 | `docs/03-do/{feature}.do.md` 신설 |
| C레벨 산출물 비일관성 | CFO→`docs/06-finance/`, CMO→`docs/05-marketing/`, COO→`docs/07-ops/` | 전부 Report 섹션으로 흡수 |
| docs/ 번호 충돌 | 03-analysis, 04-report인데 Do 삽입 필요 | 03-do, 04-analysis, 05-report로 재번호화 |
| C레벨 PDCA 불완전 | CEO/CPO/CFO/CMO/CSO/COO 산출물 없는 단계 多 | 표준 5문서 + 도메인 섹션 방식으로 통일 |

### 1.3 Related Documents

| Document | Path | Purpose |
|----------|------|---------|
| CTO agent | `agents/cto.md` | 주요 수정 대상 — Do 문서 경로 추가 |
| CFO agent | `agents/cfo.md` | Report 섹션 흡수 |
| CMO agent | `agents/cmo.md` | Report 섹션 흡수 |
| CSO agent | `agents/cso.md` | Report 섹션 흡수 |
| COO agent | `agents/coo.md` | Report 섹션 흡수 |
| CEO agent | `agents/ceo.md` | PDCA 표준화 반영 |
| CPO agent | `agents/cpo.md` | PRD는 00-pm/ 독립 유지 확인 |

---

## 2. Requirements

### 2.1 Functional Requirements

#### Priority 1: Do 로그 문서 신설

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | `docs/03-do/{feature}.do.md` 경로 신설 | Critical |
| FR-02 | Do 문서 포함 항목: 구현 결정사항, 변경 파일 목록, Design 이탈 항목+이유, 미완료 항목, 발견한 기술 부채 | Critical |
| FR-03 | CTO agent의 PDCA 사이클 표에 Do 문서 산출물 경로 추가 | Critical |
| FR-04 | Do 단계 종료 시 `.do.md` 생성을 체크리스트 항목으로 강제 | Important |

#### Priority 2: docs/ 경로 재번호화

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-05 | 새 경로 체계: `01-plan / 02-design / 03-do / 04-analysis / 05-report` | Critical |
| FR-06 | 기존 `03-analysis` → `04-analysis`, `04-report` → `05-report`로 참조 경로 일괄 수정 | Critical |
| FR-07 | 기존 물리 폴더 rename (마이그레이션 가이드 제공) | Important |
| FR-08 | archive 경로도 새 번호 체계 반영 | Minor |

#### Priority 3: C레벨 Report 섹션 흡수

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-09 | Report 문서 구조에 도메인 섹션 추가: `## CFO Analysis`, `## Security Review`, `## Marketing Impact`, `## Operations Status` | Important |
| FR-10 | CFO agent의 PDCA Report 산출물을 `docs/05-report/{feature}.report.md`의 `## CFO Analysis` 섹션으로 변경 | Important |
| FR-11 | CMO agent의 PDCA Report 산출물을 `docs/05-report/{feature}.report.md`의 `## Marketing Impact` 섹션으로 변경 | Important |
| FR-12 | CSO agent의 PDCA Report 산출물을 `docs/05-report/{feature}.report.md`의 `## Security Review` 섹션으로 변경 | Important |
| FR-13 | COO agent의 PDCA Report 산출물을 `docs/05-report/{feature}.report.md`의 `## Operations Status` 섹션으로 변경 | Important |
| FR-14 | CPO의 PRD(`docs/00-pm/`)는 기획 단계 산출물로 독립 유지 (흡수 대상 아님) | Critical |

#### Priority 4: C레벨 PDCA 표 표준화

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-15 | CEO agent PDCA 표에 표준 문서 경로 명시 (현재 "없음"→표준 경로로) | Minor |
| FR-16 | 각 C레벨 agent의 docs/ 경로 참조가 새 번호 체계와 일치하는지 검증 | Important |

### 2.2 Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | 기존 `docs/03-analysis/`, `docs/04-report/` 물리 폴더는 마이그레이션 스크립트로 처리 (자동 삭제 안 함) |
| NFR-02 | Do 문서는 경량 유지 — 필수 5개 섹션만 (과도한 템플릿 지양) |
| NFR-03 | Report 도메인 섹션은 해당 C레벨이 실행된 경우에만 작성 (없으면 `N/A — 해당 없음`) |

---

## 3. Scope

### 3.1 In Scope

#### 수정 파일

| 파일 | 변경 내용 | Priority |
|------|-----------|----------|
| `agents/cto.md` | PDCA 사이클 표에 Do 문서 경로 추가, 03-analysis→04-analysis, 04-report→05-report 경로 수정 | P1 |
| `agents/cfo.md` | Report 산출물 경로를 `docs/05-report/` 섹션으로 변경, analysis/report 경로 번호 수정 | P3 |
| `agents/cmo.md` | Report 산출물 경로를 `docs/05-report/` 섹션으로 변경 | P3 |
| `agents/cso.md` | Report 산출물 경로를 `docs/05-report/` 섹션으로 변경 | P3 |
| `agents/coo.md` | Report 산출물 경로를 `docs/05-report/` 섹션으로 변경 | P3 |
| `agents/ceo.md` | PDCA 표 경로 수정 | P4 |
| `agents/cpo.md` | docs/ 경로 번호 확인 및 수정 | P4 |

#### 신규 파일/폴더

| 항목 | 내용 | Priority |
|------|------|----------|
| `docs/03-do/` 폴더 | Do 문서 저장 경로 | P1 |
| `docs/03-do/features/` 폴더 | feature별 Do 문서 | P1 |
| Do 문서 구조 정의 | agent 내 인라인으로 정의 (별도 template 파일 선택적) | P2 |

#### 마이그레이션

| 작업 | 방법 |
|------|------|
| `docs/03-analysis/` → `docs/04-analysis/` | 수동 rename 가이드 제공 |
| `docs/04-report/` → `docs/05-report/` | 수동 rename 가이드 제공 |

### 3.2 Out of Scope

- bkit의 PDCA 문서 구조 자체 변경 (bkit은 건드리지 않음)
- Do 문서 자동 생성 스크립트 (agent 지시로 대체)
- CFO/CMO/CSO/COO의 독립 도메인 문서 완전 폐기 (기존 문서는 유지, 신규 생성만 통합)
- PM Agent Team 도입

---

## 4. Technical Approach

### 4.1 Do 문서 구조

```markdown
# {feature} Do Log

> **Feature**: {feature}
> **Session**: {N}
> **Date**: YYYY-MM-DD
> **Status**: In Progress / Completed

## 구현 결정사항
| 결정 | 선택 | 이유 |
|------|------|------|
| {항목} | {선택값} | {Design 대비 변경 이유 또는 유지 이유} |

## 변경 파일 목록
| 파일 | 변경 유형 | 비고 |
|------|-----------|------|
| `path/to/file` | Create / Modify / Delete | |

## Design 이탈 항목
| 설계 내용 | 실제 구현 | 이유 |
|-----------|-----------|------|
| {Design §X 내용} | {실제 구현 내용} | {이탈 이유} |

## 미완료 항목 (다음 세션 인계)
- [ ] {항목}

## 발견한 기술 부채
- {부채 내용} — {우선순위: High/Medium/Low}
```

### 4.2 Report 도메인 섹션 구조

```markdown
# {feature}.report.md

## 1. Executive Summary (CTO)
## 2. Technical Results
## 3. CFO Analysis          ← CFO 실행 시 작성, 미실행 시 "N/A"
## 4. Security Review       ← CSO 실행 시 작성
## 5. Marketing Impact      ← CMO 실행 시 작성
## 6. Operations Status     ← COO 실행 시 작성
```

### 4.3 경로 재번호화 매핑

| 현재 | 변경 후 |
|------|---------|
| `docs/01-plan/` | `docs/01-plan/` (유지) |
| `docs/02-design/` | `docs/02-design/` (유지) |
| _(없음)_ | `docs/03-do/` (신설) |
| `docs/03-analysis/` | `docs/04-analysis/` |
| `docs/04-report/` | `docs/05-report/` |

---

## 5. Success Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-01 | CTO agent가 Do 단계에서 `docs/03-do/{feature}.do.md` 생성 지시 | agents/cto.md PDCA 표 확인 |
| SC-02 | CFO/CMO/CSO/COO agent의 Report 산출물이 `docs/05-report/` 경로를 가리킴 | 각 agent.md 경로 확인 |
| SC-03 | 모든 agent의 docs/ 경로가 새 번호 체계(01/02/03-do/04/05)를 사용 | grep으로 old 경로 잔존 여부 확인 |
| SC-04 | Do 문서 구조가 5개 필수 섹션을 포함 | Do 문서 템플릿 섹션 수 확인 |

---

## 6. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| 기존 docs/ 문서 경로 깨짐 | High | 마이그레이션 가이드 제공, 자동 삭제 금지 |
| Do 문서 템플릿 과도 | Medium | 5개 섹션으로 제한, 선택적 섹션 없음 |
| C레벨 Report 섹션이 강제성 없어 실제로 작성 안 됨 | Low | agent 지시에 "미실행 시 N/A 명시" 조건 추가 |

---

## 7. Implementation Order

1. `docs/03-do/` 폴더 신설 (물리 폴더 생성)
2. `docs/03-analysis/` → `docs/04-analysis/` rename
3. `docs/04-report/` → `docs/05-report/` rename
4. `agents/cto.md` — Do 문서 경로 + 경로 번호 수정 (P1)
5. `agents/cfo.md`, `cmo.md`, `cso.md`, `coo.md` — Report 섹션 흡수 (P3)
6. `agents/ceo.md`, `cpo.md` — 경로 번호 수정 (P4)
7. 검증: grep으로 old 경로 잔존 확인
