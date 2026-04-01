# csuite-context-architecture - 설계서

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | C레벨들이 bkit PDCA를 따르지 않고 제각각 동작. agents/와 phases/ 중복 정의. bkit의 핵심 패턴을 vais-code에 일관되게 적용해야 한다. |
| **WHO** | vais-claude-code 플러그인 사용자 (개발자) |
| **RISK** | agents/*.md가 자기완결이라 공통 섹션 내용이 유사하게 반복됨 |
| **SUCCESS** | 모든 agents/*.md가 동일한 섹션 순서 + 각 C레벨 PDCA 구조 명시 |
| **SCOPE** | agents 7개 + phases 7개 + convention 문서 1개 (코드 변경 없음) |

---

## 1. 선택된 아키텍처: Option C — Layered / Hybrid

### 핵심 원칙

- `agents/*.md`: **런타임 자기완결** — Claude가 실행 시 다른 파일을 체인 로드하지 않아도 됨
- `docs/architecture/vais-pdca-convention.md`: **개발자 참고용** — 에이전트 맵, 파일 작성 표준
- `skills/vais/phases/*.md`: **5줄 Thin Entry Point** — agents/ 참조만 함

---

## 2. agents/*.md 표준 섹션 구조

모든 `agents/*.md`는 다음 섹션을 **이 순서로** 포함한다.

```markdown
---
[frontmatter: name, version, description, model, tools, hooks, disallowedTools]
---

# {C레벨} Agent

## 역할
{한 줄 요약}

## PDCA 사이클 — {도메인명}

### Plan
실행자: {직접 / 에이전트명}
내용: {Plan 단계에서 하는 일}
산출물: {파일 경로}

### Design
실행자: {직접 / 에이전트명 목록}
내용: {Design 단계에서 하는 일}
산출물: {파일 경로}

### Do
실행자: {직접 / 에이전트명 목록}
내용: {Do 단계에서 하는 일}

### Check
실행자: {직접 / 에이전트명}
통과 기준: {기준}

### Report
실행자: {직접}
산출물: {파일 경로}

## Checkpoint

### CP-1 — Plan 완료 후 (범위 확인)
[공통] A/B/C 옵션 제시 → 사용자 선택 대기
A. 최소 범위: ...
B. 표준 범위: ... ← 권장
C. 확장 범위: ...

### CP-2 — Do 시작 전 (실행 승인)
[공통] 할 작업 목록 나열 → "위 내용으로 실행해도 될까요?"

### {개별 CP} — {시점}
[C레벨 고유 Checkpoint]

## Context Load

### 세션 시작 시 (항상)
- L1: vais.config.json
- L2: .vais/memory.json (관련 엔트리 필터)
- L3: .vais/status.json

### 체이닝 시 추가 로드
- L4: {이전 C레벨 산출물 경로}

## {역할별 특수 섹션}
[CEO: 라우팅 규칙 + absorb + Full-Auto]
[CTO: Gate 시스템 + Interface Contract]
[기타: 해당 없으면 생략]

## 작업 원칙
[Push 규칙 등 공통 원칙]
```

---

## 3. C레벨별 설계 명세

### 3.1 CEO

**PDCA 사이클 — 전략/라우팅 도메인**

| 단계 | 실행자 | 내용 | 산출물 |
|------|--------|------|--------|
| Plan | 직접 | 요청 분석 → 담당 C레벨 + 범위 결정 | (없음, 메모리 기록) |
| Design | 직접 | 위임 구조 설계 (어떤 C레벨에게 어떻게) | (없음) |
| Do | 위임 | 해당 C레벨 에이전트 실행 (Agent 도구) | C레벨 산출물 |
| Check | 직접 | C레벨 산출물 전략 정합성 확인 | (없음) |
| Report | 직접 | 전략 결정사항 memory 기록 | .vais/memory.json |

**absorb 모드 PDCA — 외부 스킬 흡수 도메인**

| 단계 | 실행자 | 내용 | 산출물 |
|------|--------|------|--------|
| Plan | 직접 | 외부 파일 스캔 + 핵심 기능 추출 + 전략 판단 | (스캔 결과 메모) |
| Design | absorb-analyzer | 중복 분석 + C레벨별 배분 맵 생성 | 배분 맵 |
| Do | 직접 | 배분 맵 기반 agents/*.md 수정 | 수정된 agents 파일 |
| Check | 직접 | 추가된 서브에이전트 위치 검증 + 충돌 확인 | (없음) |
| Report | 직접 | absorption-ledger.jsonl 기록 | .vais/absorption-ledger.jsonl |

**Checkpoint:**
- CP-1: A/B/C 라우팅 범위 옵션 제시
- CP-R: "이 업무를 {C레벨}에게 위임합니다. 맞나요?"
- CP-A (absorb): 배분 맵 전체 표시 → "이 배분으로 진행할까요?"
- CP-2: 실행 승인

**특수 섹션:**
- 라우팅 규칙 테이블 (키워드 → C레벨)
- Full-Auto 모드 (`--auto`): Self-Review Loop + 판정 기준 테이블

---

### 3.2 CTO

**PDCA 사이클 — 기술 도메인**

| 단계 | 실행자 | 내용 | 산출물 |
|------|--------|------|--------|
| Plan | 직접 | 요구사항 탐색 → 범위 3옵션 → 기술 계획서 | docs/01-plan/{feature}.plan.md |
| Design | design + architect | 화면설계 + 인프라 설계 | docs/02-design/{feature}.design.md |
| Do | frontend + backend | 병렬 구현 | 구현 코드 |
| Check | qa | 빌드+테스트+갭 분석 | docs/04-qa/{feature}-qa.md |
| Report | 직접 | memory 기록 + 완료 보고서 | .vais/memory.json |

**Checkpoint:**
- CP-1: 요구사항 탐색 질문 3개 → 범위 A/B/C 제시
- CP-D (Design 후): A/B/C 아키텍처 옵션 → 선택 확인
- CP-G1~G4: 각 Gate 완료 후 체크리스트 → "계속/수정/중단"
- CP-2: 실행 승인

**특수 섹션:**
- Gate 시스템 (Gate 1~4 체크리스트)
- Interface Contract 생성 (Gate 2)
- QA 리턴 라우팅
- 크로스-피처 영향 분석

---

### 3.3 CPO

**PDCA 사이클 — 제품 도메인**

| 단계 | 실행자 | 내용 | 산출물 |
|------|--------|------|--------|
| Plan | 직접 | 기회 발견 범위 + PRD 목표 정의 | (없음) |
| Design | pm-discovery + pm-strategy + pm-research (병렬) | 기회 분석 + 전략 + 시장 조사 | 3개 분석 결과 |
| Do | pm-prd | PRD 합성 | docs/00-pm/{feature}.prd.md |
| Check | 직접 | PRD 완성도 + 섹션 누락 + 로드맵 정합성 | (없음) |
| Report | 직접 | PRD 최종화 + 로드맵 업데이트 | docs/00-pm/{feature}.prd.md |

**Checkpoint:**
- CP-1: 제품 발견 범위 A/B/C
- CP-P (PRD 초안 후): "이 PRD 방향이 맞나요?"
- CP-2: 실행 승인

---

### 3.4 CMO

**PDCA 사이클 — 마케팅 도메인**

| 단계 | 실행자 | 내용 | 산출물 |
|------|--------|------|--------|
| Plan | 직접 | 마케팅 목표 + 채널 + 타깃 정의 | (없음) |
| Design | 직접 | 마케팅 전략 + SEO 계획 | (없음) |
| Do | seo | SEO 감사 실행 | docs/05-marketing/{feature}-seo.md |
| Check | 직접 | SEO 점수 ≥ 80 + KPI 달성 여부 | (없음) |
| Report | 직접 | 마케팅 보고서 | docs/05-marketing/{feature}.md |

**Checkpoint:**
- CP-1: 마케팅 목표 A/B/C
- CP-S (전략 후): "이 SEO 전략으로 감사를 진행할까요?"
- CP-2: 실행 승인

**특수 섹션:**
- SEO 스코어링 기준표 (Title/Meta/Semantic/CWV/구조화데이터)
- vais seo 레거시 호환

---

### 3.5 CSO

**PDCA 사이클 — 보안 도메인 (Gate A + Gate B)**

**Gate A — 보안 검토:**

| 단계 | 실행자 | 내용 | 산출물 |
|------|--------|------|--------|
| Plan | 직접 | 위협 범위 + OWASP 체크 대상 | (없음) |
| Design | 직접 | 위협 모델 + 보안 체크리스트 | (없음) |
| Do | security | OWASP Top 10 스캔 | 스캔 결과 |
| Check | 직접 | Critical 잔존 여부 → 배포 차단 판정 | (없음) |
| Report | 직접 | 보안 보고서 | docs/04-qa/{feature}-security.md |

**Gate B — 플러그인 검증:**

| 단계 | 실행자 | 내용 | 산출물 |
|------|--------|------|--------|
| Plan | 직접 | 검증 범위 | (없음) |
| Design | 직접 | 검증 체크리스트 | (없음) |
| Do | validate-plugin | package.json/SKILL.md/agents 검증 | 검증 결과 |
| Check | 직접 | 승인/거부 판정 | (없음) |
| Report | 직접 | 검증 보고서 | docs/04-qa/{feature}-plugin-validation.md |

**Checkpoint:**
- CP-1: Gate A / Gate B / 둘 다 선택
- CP-C (Critical 발견 시): "Critical {N}건. 배포 차단할까요?"
- CP-2: 실행 승인

---

### 3.6 CFO

**PDCA 사이클 — 재무 도메인**

| 단계 | 실행자 | 내용 | 산출물 |
|------|--------|------|--------|
| Plan | 직접 | 비용 구성 파악 + ROI 목표 설정 | (없음) |
| Design | 직접 | 재무 모델 설계 | (없음) |
| Do | 직접 | ROI 계산 + 가격 책정 + 예산 계획 | 분석 결과 |
| Check | 직접 | ROI 목표 달성 여부 | (없음) |
| Report | 직접 | 재무 분석 보고서 | docs/06-finance/{feature}-finance.md |

**Checkpoint:**
- CP-1: 분석 범위 A/B/C
- CP-2: 실행 승인

**특수 섹션 없음** — 서브에이전트 없음, 직접 수행

---

### 3.7 COO

**PDCA 사이클 — 운영 도메인**

| 단계 | 실행자 | 내용 | 산출물 |
|------|--------|------|--------|
| Plan | 직접 | 운영 현황 파악 + 개선 범위 | (없음) |
| Design | 직접 | CI/CD + 모니터링 설계 | (없음) |
| Do | 직접 | 파이프라인/모니터링 구축 | 설정 파일 |
| Check | 직접 | 운영 지표 달성 여부 | (없음) |
| Report | 직접 | 운영 보고서 | docs/07-ops/{feature}-ops.md |

**Checkpoint:**
- CP-1: 운영 개선 범위 A/B/C
- CP-2: 실행 승인

**특수 섹션 없음** — 서브에이전트 없음, 직접 수행

---

## 4. phases/*.md 설계

모든 `skills/vais/phases/{name}.md`는 다음 패턴으로 통일 (≤15줄):

```markdown
---
name: {name}
description: {C레벨} 에이전트 호출. {한 줄 역할 설명}.
---

# {C레벨} Phase

`${CLAUDE_PLUGIN_ROOT}/agents/{name}.md`를 읽고 그 안의 지침에 따라 실행하세요.

전달 인자:
- action: `$0`
- feature: `$1`
```

**예외:** `absorb.md`는 phases/absorb.md → CEO로 라우팅 (기존 구조 유지)

---

## 5. docs/architecture/vais-pdca-convention.md 설계

개발자 참고용 문서. 다음 내용 포함:

1. **에이전트 전체 맵** (CEO → C레벨 → 서브에이전트 트리)
2. **agents/*.md 파일 작성 표준** (섹션 순서, 필수 섹션, 선택 섹션)
3. **공통 Checkpoint 규칙** (CP-1, CP-2 표준 문구)
4. **Context Load 표준** (L1-L6 레이어 설명)
5. **CEO Full-Auto 모드** 판정 기준 참고표
6. **산출물 경로 표** (C레벨별 docs/ 경로)

---

## 6. 구현 순서 (Session Guide)

### Module 1 — Convention 문서 (1개)
`docs/architecture/vais-pdca-convention.md` 신규 작성

### Module 2 — agents/*.md 재작성 (7개)
우선순위 순:
1. `agents/ceo.md` — 가장 복잡 (라우터 + absorb + Full-Auto)
2. `agents/cto.md` — 기존 내용 많아 구조 정리 위주
3. `agents/cpo.md` — pm-* 에이전트 위임 구조 추가
4. `agents/cmo.md` — seo 에이전트 위임 구조 추가
5. `agents/cso.md` — Gate A/B PDCA 구조화
6. `agents/cfo.md` — STUB 제거, 재무 PDCA 신규 작성
7. `agents/coo.md` — STUB 제거, 운영 PDCA 신규 작성

### Module 3 — phases/*.md Thin Entry Point (7개)
동일 패턴 반복이므로 일괄 처리:
`phases/ceo.md`, `phases/cto.md`, `phases/cpo.md`, `phases/cmo.md`, `phases/cso.md`, `phases/cfo.md`, `phases/coo.md`

---

## 7. 검증 방법

구현 완료 후 다음으로 SC 검증:

```bash
# SC-01: PDCA 섹션 존재
grep -l "### Plan" agents/*.md

# SC-04: phases 줄 수 확인
wc -l skills/vais/phases/*.md

# SC-05: STUB 제거 확인
grep -l "STUB" agents/cfo.md agents/coo.md

# SC-06: Context Load 섹션
grep -l "Context Load" agents/*.md

# SC-07: CP-1/CP-2 존재
grep -l "CP-1\|CP-2" agents/*.md

# SC-08: Full-Auto 섹션
grep -l "Full-Auto\|--auto" agents/ceo.md
```

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-01 | 초기 작성 — Option C (Layered/Hybrid) 선택 |
