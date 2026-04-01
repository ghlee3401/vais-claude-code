# VAIS PDCA Convention — 개발자 참고 문서

> 이 문서는 **개발자용 참고 문서**입니다. 에이전트 런타임에는 로드되지 않습니다.
> 에이전트 파일(`agents/*.md`) 작성 표준, 공통 규칙, 전체 에이전트 맵을 정의합니다.

---

## 1. 에이전트 전체 맵

```
CEO (라우터 + absorb + Full-Auto)
 ├── CPO — 제품 도메인
 │    ├── pm-discovery
 │    ├── pm-strategy
 │    ├── pm-research
 │    └── pm-prd
 ├── CTO — 기술 도메인
 │    ├── design
 │    ├── architect
 │    ├── frontend
 │    ├── backend
 │    └── qa
 ├── CMO — 마케팅 도메인
 │    └── seo
 ├── CSO — 보안 도메인
 │    ├── security        (Gate A)
 │    └── validate-plugin (Gate B)
 ├── CFO — 재무 도메인 (서브에이전트 없음, 직접 수행)
 └── COO — 운영 도메인 (서브에이전트 없음, 직접 수행)

absorb 전용:
 └── absorb-analyzer (CEO absorb 모드에서만 호출)
```

---

## 2. agents/*.md 파일 작성 표준

### 2.1 Frontmatter 필수 필드

```yaml
---
name: {영문 소문자}
version: 1.0.0
description: |
  {한 줄 역할 설명}
  Triggers: {키워드 목록}
model: opus | sonnet
tools: [Read, Write, Edit, Glob, Grep, Bash, Agent, TodoWrite, AskUserQuestion]
memory: project | user | none
hooks:
  Stop:
    - type: command
      command: "node ${CLAUDE_PLUGIN_ROOT:-$(pwd)}/scripts/agent-stop.js {name} success"
      timeout: 5000
disallowedTools:
  - "Bash(rm -rf*)"
  - "Bash(git push --force*)"
---
```

### 2.2 섹션 순서 (7섹션, 이 순서로 작성)

| 순번 | 섹션명 | 설명 | 필수 여부 |
|------|--------|------|-----------|
| 1 | `## 역할` | 한 줄 요약 | 필수 |
| 2 | `## PDCA 사이클 — {도메인명}` | 단계별 실행자/내용/산출물 | 필수 |
| 3 | `## Checkpoint` | CP-1, CP-2 + 개별 CP | 필수 |
| 4 | `## Context Load` | L1-L4 로드 규칙 | 필수 |
| 5 | `## {역할별 특수 섹션}` | C레벨 고유 내용 | 선택 |
| 6 | `## 작업 원칙` | Push 규칙 등 공통 | 필수 |

> **선택 섹션**: CFO, COO처럼 서브에이전트가 없으면 특수 섹션 생략 가능.

---

## 3. 공통 Checkpoint 규칙

### CP-1 — Plan 완료 후 (범위 확인)

AskUserQuestion으로 A/B/C 옵션 제시. 반드시 B(표준)를 기본 권장으로 표시.

```
[CP-1] 실행 범위를 선택해주세요.
A. 최소 범위: {최소로 할 수 있는 것}
B. 표준 범위: {권장 — 일반적으로 이것} ← 권장
C. 확장 범위: {추가적으로 할 수 있는 것}
```

### CP-2 — Do 시작 전 (실행 승인)

AskUserQuestion으로 할 작업 목록을 나열 후 확인.

```
[CP-2] 다음 작업을 실행합니다:
- {작업 항목 1}
- {작업 항목 2}
- ...

위 내용으로 실행할까요?
```

### 개별 CP (C레벨 고유)

각 C레벨 agents/*.md의 `## Checkpoint` 섹션에 정의. 예:
- CEO: CP-R (라우팅 확인), CP-A (absorb 배분 확인)
- CTO: CP-D (Design 아키텍처 선택), CP-G1~G4 (각 Gate 완료 확인)
- CSO: CP-C (Critical 발견 시 배포 차단 확인)

---

## 4. Context Load 표준 (L1-L6 레이어)

| 레이어 | 파일 | 로드 시점 | 설명 |
|--------|------|-----------|------|
| L1 | `vais.config.json` | 항상 | 전역 설정 |
| L2 | `.vais/memory.json` | 항상 | 프로젝트 메모리 (관련 엔트리 필터) |
| L3 | `.vais/status.json` | 항상 | 피처 진행 상태 |
| L4 | 이전 C레벨 산출물 | 체이닝 시 | 상위 C레벨 결과 (예: CEO→CTO 전달 컨텍스트) |
| L5 | 에이전트 상태 | 서브에이전트 호출 시 | 위임 결과 저장 |
| L6 | 세션 입력 | 항상 | 현재 요청 ($0, $1, arguments) |

---

## 5. CEO Full-Auto 모드 (`--auto`) 판정 기준

CEO가 C레벨 산출물을 자체 검토할 때 사용하는 기준표.

| C레벨 | Check 대상 | 통과 기준 | 재실행 조건 |
|-------|----------|-----------|------------|
| CPO | PRD 섹션 완성도 | 8개 섹션 모두 존재, 빈 섹션 없음 | 섹션 누락 또는 내용 50자 미만 |
| CTO | Plan/Design/구현 정합성 | 요구사항 항목 vs 구현 파일 일치 | 미구현 항목 존재 |
| CMO | SEO 점수 | ≥ 80 | 점수 80 미만 |
| CSO | Critical 취약점 | 0개 | Critical 1개 이상 |
| CFO | ROI 계산 완성도 | 비용/수익/ROI 수치 모두 존재 | 수치 누락 |
| COO | 파이프라인 상태 | CI/CD 모든 단계 정의 | 단계 누락 |

**Self-Review Loop:**
1. C레벨 실행 완료
2. CEO가 판정 기준으로 산출물 검토
3. 미통과 → 해당 C레벨 재실행 (최대 2회)
4. 2회 후에도 미통과 → 사용자에게 이슈 보고
5. 전체 통과 → Report 1회 출력

---

## 6. 산출물 경로 표

| C레벨 | Plan | Design | Do | Check | Report |
|-------|------|--------|-----|-------|--------|
| CPO | — | — | `docs/00-pm/{feature}.prd.md` | — | (PRD 최종화) |
| CTO | `docs/01-plan/{feature}.plan.md` | `docs/02-design/{feature}.design.md` | 구현 코드 | `docs/04-qa/{feature}-qa.md` | memory 기록 |
| CMO | — | — | `docs/05-marketing/{feature}-seo.md` | — | `docs/05-marketing/{feature}.md` |
| CSO | — | — | 스캔 결과 | — | `docs/04-qa/{feature}-security.md` (Gate A), `docs/04-qa/{feature}-plugin-validation.md` (Gate B) |
| CFO | — | — | 분석 결과 | — | `docs/06-finance/{feature}-finance.md` |
| COO | — | — | 설정 파일 | — | `docs/07-ops/{feature}-ops.md` |
| CEO | — | — | — | — | `.vais/memory.json` (전략 기록) |
| CEO (absorb) | — | 배분 맵 | 수정된 agents | — | `.vais/absorption-ledger.jsonl` |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-01 | 초기 작성 — csuite-context-architecture 설계서 기반 |
