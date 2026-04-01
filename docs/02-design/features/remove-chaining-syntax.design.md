# Design: remove-chaining-syntax

**Feature**: remove-chaining-syntax  
**Created**: 2026-04-01  
**Phase**: design  
**Status**: active

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 체이닝 문법은 오케스트레이터 에이전트 자율성 제약. DSL 없이 에이전트 추론이 워크플로우를 대체함 |
| **WHO** | vais 플러그인 사용자 및 C-Suite 에이전트 |
| **RISK** | phases/*.md 실수로 수정/삭제 시 에이전트 역할 명세 손실 |
| **SUCCESS** | SKILL.md에서 체이닝 파싱 로직 제거, phases 파일 전체 보존 |
| **SCOPE** | `skills/vais/SKILL.md` 1개 파일만 수정 |

---

## 1. 변경 대상 분석

### 1.1 수정 파일

**`skills/vais/SKILL.md`**

| 위치 | 내용 | 처리 |
|------|------|------|
| 액션 목록 — `ceo:cpo:cto` 행 | C-Suite 순차 체이닝 | 제거 |
| 액션 목록 — `ceo:cto` 행 | C-Suite 순차 체이닝 | 제거 |
| 액션 목록 — `plan:design:architect` 행 | 순차 체이닝 예시 | 제거 |
| 액션 목록 — `frontend+backend` 행 | 병렬 체이닝 예시 | 제거 |
| `## 체이닝 파싱` 섹션 | `:` / `+` 파싱 로직 4줄 | 섹션 전체 제거 |
| `## 병렬 에이전트 매핑` 섹션 | 병렬 매핑 테이블 | 섹션 전체 제거 |
| 완료 아웃로 — "체이닝 중간 단계" 문구 | 체이닝 관련 주석 | 제거 |

### 1.2 보존 파일 (변경 없음)

| 파일 | 이유 |
|------|------|
| `skills/vais/phases/*.md` (21개) | 에이전트 역할 명세 — 핵심 보존 대상 |
| `agents/*.md` (15개) | C-Suite 에이전트 명세 |
| `skills/vais/SKILL.md` 나머지 | 개별 액션, 실행 지침, 완료 아웃로 구조 |

---

## 2. 구현 결과 (완료)

수정 후 `skills/vais/SKILL.md` 액션 목록:

```
| init        | 기존 프로젝트 분석 → VAIS 문서 역생성             |
| ceo         | CEO 에이전트 — 비즈니스 전략 + C-Suite 오케스트레이션 |
| cpo         | CPO 에이전트 — 제품 방향 + PRD 생성 + 로드맵        |
| cto         | CTO 에이전트 — 기술 방향 설정 + 전체 오케스트레이션    |
| cmo         | CMO 에이전트 — 마케팅 전략                       |
| cso         | CSO 에이전트 — 보안/검증 오케스트레이션              |
| cfo         | CFO 에이전트 — 재무/ROI 분석                     |
| coo         | COO 에이전트 — 운영/CI/CD                       |
| absorb      | 외부 레퍼런스 평가 및 흡수                        |
| plan ~ qa   | 각 단계 개별 실행                               |
| report      | 완료 보고서 생성                                |
| status/next/test/commit/help | 유틸리티                    |
```

제거된 섹션:
- `## 체이닝 파싱` (4줄)
- `## 병렬 에이전트 매핑` (3줄)

---

## 3. 검증 기준

| 기준 | 확인 방법 |
|------|----------|
| `:` 체이닝 파싱 로직 없음 | `grep "split" SKILL.md` → 결과 없음 |
| `+` 병렬 파싱 로직 없음 | `grep "병렬 호출" SKILL.md` → 결과 없음 |
| phases/ 파일 21개 보존 | `ls phases/ \| wc -l` = 21 |
| 개별 액션 존재 | ceo, cto, plan 등 액션 목록 확인 |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-01 | 초기 작성 (구현 완료 기록) |
