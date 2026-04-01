# csuite-context-architecture - 기획서

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | C레벨들이 bkit PDCA 사이클을 따르지 않고 제각각 동작한다. "각 C레벨이 PDCA 오케스트레이터이고, 각 단계마다 전담 서브에이전트를 부른다"는 핵심 구조가 코드에 반영되어 있지 않다. |
| **Solution** | CEO를 최상위 라우터로, 각 C레벨을 도메인별 PDCA 오케스트레이터로 재정의한다. 각 C레벨은 PDCA 단계마다 전담 서브에이전트를 호출하며, bkit 6-레이어 Context Engineering을 적용한다. |
| **Function/UX Effect** | 사용자가 CEO에게 어떤 업무든 요청하면 CEO가 담당 C레벨을 찾아 위임하고, 그 C레벨이 PDCA 사이클을 돌리며 각 단계에서 전담 에이전트를 부른다. |
| **Core Value** | vais-code = "C레벨이 여럿인 bkit" — bkit은 CTO 1명이 plan(직접)→design(에이전트)→do(에이전트)→check(에이전트)→report(직접)를 돌리는데, vais-code는 7개 도메인에서 동일한 구조가 돌아간다. |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 현재 각 C레벨 파일에 "PDCA 오케스트레이터 + 서브에이전트 위임" 구조가 없다. bkit의 핵심 패턴을 vais-code에 일관되게 적용해야 한다. |
| **WHO** | vais-claude-code 플러그인 사용자 (개발자) |
| **RISK** | 서브에이전트 위임 구조가 복잡해서 실제 실행 시 컨텍스트가 과도하게 커질 수 있음 |
| **SUCCESS** | 모든 agents/*.md에 PDCA 6단계 + 각 단계별 서브에이전트 위임 구조가 명시됨 |
| **SCOPE** | agents/*.md 7개 재작성 + phases/*.md 7개 Thin Entry Point + PDCA 컨벤션 문서 1개 |

---

## 0. 핵심 아키텍처

### bkit vs vais-code 비교

**bkit (CTO 1명):**
```
/pdca {feature}
  CTO (오케스트레이터)
    Plan   → CTO 직접 수행
    Design → design 에이전트 위임
    Do     → frontend + backend 에이전트 위임
    Check  → gap-detector 에이전트 위임
    Report → report-generator 에이전트 위임
```

**vais-code (C레벨 7명):**
```
User → CEO (최상위 라우터)
         ↓ 업무 파악 → 담당 C레벨 위임
         
  CTO (기술 오케스트레이터)
    Plan   → CTO 직접
    Design → design 에이전트 + architect 에이전트
    Do     → frontend 에이전트 + backend 에이전트 (병렬)
    Check  → qa 에이전트
    Report → CTO 직접

  CPO (제품 오케스트레이터)
    Plan   → CPO 직접
    Design → pm-discovery + pm-strategy + pm-research 에이전트
    Do     → pm-prd 에이전트
    Check  → CPO 직접 (PRD 정합성 검토)
    Report → CPO 직접

  CMO (마케팅 오케스트레이터)
    Plan   → CMO 직접
    Design → CMO 직접 (마케팅 전략)
    Do     → seo 에이전트 위임
    Check  → CMO 직접 (점수/KPI 검토)
    Report → CMO 직접

  CSO (보안 오케스트레이터)
    Plan   → CSO 직접
    Design → CSO 직접 (위협 모델)
    Do     → security 에이전트 + validate-plugin 에이전트
    Check  → CSO 직접 (Critical 잔존 여부)
    Report → CSO 직접

  CFO (재무 오케스트레이터)
    Plan   → CFO 직접
    Design → CFO 직접 (재무 모델)
    Do     → CFO 직접 (분석 실행)
    Check  → CFO 직접 (ROI 검토)
    Report → CFO 직접

  COO (운영 오케스트레이터)
    Plan   → COO 직접
    Design → COO 직접 (CI/CD 설계)
    Do     → COO 직접 (파이프라인 구축)
    Check  → COO 직접 (운영 지표)
    Report → COO 직접
```

### CEO 라우팅 규칙

CEO는 사용자 요청을 분석하여 담당 C레벨을 결정한다:

| 키워드/의도 | 담당 C레벨 |
|-----------|----------|
| 기술 구현, 개발, 코드, 아키텍처 | CTO |
| 제품 기획, PRD, 로드맵, 기능 우선순위 | CPO |
| 마케팅, SEO, 랜딩 페이지, 캠페인 | CMO |
| 보안 검토, 취약점, 플러그인 배포 | CSO |
| 비용, ROI, 예산, 가격 | CFO |
| CI/CD, 배포, 모니터링, 운영 | COO |
| 여러 도메인 걸침 | CEO가 직접 조율, 복수 C레벨 순차/병렬 위임 |

---

## 1. 기능 요구사항

### F1. CEO — 최상위 라우터 + absorb 오케스트레이터

CEO는 두 가지 모드로 직접 PDCA를 수행한다.

**라우팅 모드** (기본 — 사용자 요청을 담당 C레벨에 위임):
```
Plan   → CEO 직접 (요청 분석 → 담당 C레벨 + 범위 결정)
Design → CEO 직접 (어떤 C레벨에게 어떻게 위임할지 구조 설계)
Do     → 해당 C레벨 에이전트 위임 (Agent 도구)
Check  → C레벨 산출물 검토 + 전략 목표 정합성 확인
Report → CEO 직접 (전략 결정사항 기록)
```

**absorb 모드** (`/vais absorb {path}` — CEO의 핵심 고유 업무):

absorb는 외부 스킬/에이전트 파일을 읽어 **어떤 C레벨의 어떤 에이전트/단계에 어떤 내용을 배분할지** 결정하고 실행하는 작업이다.

```
Plan   → CEO 직접
         - 외부 파일 전체 스캔
         - 핵심 기능/지식 목록 추출
         - "이 내용이 vais에 필요한가?" 전략적 판단
         - 예: bkit pm 스킬 → "pm-discovery, pm-strategy, pm-research, pm-prd 4개 에이전트 확인.
                CPO 도메인과 일치. CPO의 Design/Do 단계에 배분 가능."

Design → absorb-analyzer 에이전트 위임
         - 기존 agents/*.md, skills/vais/phases/*.md와 중복 분석
         - 각 추출 항목을 어느 C레벨의 어느 PDCA 단계에 배분할지 매핑
         - 예: pm-discovery → CPO.Design 단계 서브에이전트
               pm-prd → CPO.Do 단계 서브에이전트
               gap-detector → CTO.Check 단계 서브에이전트 (이미 있으면 skip)
         - 배분 맵 반환: [{source, targetCLevel, targetPhase, action: absorb|skip|merge}]

Do     → CEO 직접 (absorb-analyzer 배분 맵 기반으로 실행)
         - absorb 결정된 항목: 해당 agents/*.md에 서브에이전트 추가 또는 내용 병합
         - skip 결정된 항목: 건너뜀
         - merge 결정된 항목: 기존 내용과 합침

Check  → CEO 직접
         - 수정된 agents/*.md에서 추가된 서브에이전트가 올바른 PDCA 단계에 있는지 확인
         - 중복/충돌 없는지 확인

Report → CEO 직접
         - .vais/absorption-ledger.jsonl에 기록
         - 각 항목: {source, targetCLevel, targetPhase, action, reason}
```

**absorb 예시 — bkit pm 스킬 흡수:**
```
외부 파일: /path/to/bkit/skills/pm/SKILL.md

Plan 결과:
  - pm-discovery (Teresa Torres OST) → CPO 도메인, 고품질
  - pm-strategy (JTBD + Lean Canvas) → CPO 도메인, 고품질
  - pm-research (Persona + 경쟁분석) → CPO 도메인, 고품질
  - pm-prd (PRD 합성) → CPO 도메인, 고품질

Design (absorb-analyzer) 결과:
  - 4개 모두 기존 agents/cpo.md에 없음 → absorb 승인
  - 배분 맵:
    pm-discovery → CPO.Design 단계 서브에이전트
    pm-strategy  → CPO.Design 단계 서브에이전트
    pm-research  → CPO.Design 단계 서브에이전트
    pm-prd       → CPO.Do 단계 서브에이전트

Do 결과:
  - agents/cpo.md 수정:
    Design 단계에 "pm-discovery + pm-strategy + pm-research 병렬 위임" 추가
    Do 단계에 "pm-prd 위임" 추가

Report:
  {"source": "bkit/pm", "targetCLevel": "CPO", "action": "absorbed",
   "targetPhase": "Design+Do", "reason": "PM 4-agent team CPO에 완전 통합"}
```

### F2. CTO — 기술 PDCA 오케스트레이터

```
Plan   → CTO 직접 (요구사항 탐색 → 범위 3옵션 → 기술 계획서)
Design → design 에이전트 + architect 에이전트 (병렬 가능)
Do     → frontend 에이전트 + backend 에이전트 (병렬)
Check  → qa 에이전트
Report → CTO 직접 (.vais/memory.json 기록 + 완료 보고서)
```

Gate 시스템 (기존 유지): Plan 완료 후 Gate 1, Design 완료 후 Gate 2 (Interface Contract 생성), 구현 완료 후 Gate 3+4.

### F3. CPO — 제품 PDCA 오케스트레이터

```
Plan   → CPO 직접 (기회 발견 범위 + PRD 목표 정의)
Design → pm-discovery + pm-strategy + pm-research 에이전트 (병렬)
Do     → pm-prd 에이전트 (PRD 합성)
Check  → CPO 직접 (PRD 완성도 + 로드맵 정합성)
Report → CPO 직접 (docs/00-pm/{feature}.prd.md 최종화)
```

### F4. CMO — 마케팅 PDCA 오케스트레이터

```
Plan   → CMO 직접 (마케팅 목표 + 채널 + 타깃 정의)
Design → CMO 직접 (마케팅 전략 + SEO 계획)
Do     → seo 에이전트 위임 (SEO 감사 실행)
Check  → CMO 직접 (SEO 점수 80+ 기준 + KPI 달성 여부)
Report → CMO 직접 (docs/05-marketing/{feature}.md)
```

### F5. CSO — 보안 PDCA 오케스트레이터

**Gate A (보안 검토)**:
```
Plan   → CSO 직접 (위협 범위 + OWASP 체크 대상)
Design → CSO 직접 (위협 모델 + 보안 체크리스트)
Do     → security 에이전트 위임 (스캔 실행)
Check  → CSO 직접 (Critical 잔존 여부 → 배포 차단 여부)
Report → CSO 직접 (docs/04-qa/{feature}-security.md)
```

**Gate B (플러그인 검증)**:
```
Plan   → CSO 직접 (검증 범위)
Design → CSO 직접 (검증 체크리스트)
Do     → validate-plugin 에이전트 위임
Check  → CSO 직접 (승인/거부 판정)
Report → CSO 직접
```

### F6. CFO — 재무 PDCA 오케스트레이터

```
Plan   → CFO 직접 (비용 구성 파악 + ROI 목표 설정)
Design → CFO 직접 (재무 모델 설계)
Do     → CFO 직접 (ROI 계산 + 가격 책정 + 예산 계획)
Check  → CFO 직접 (ROI 목표 달성 여부)
Report → CFO 직접 (docs/06-finance/{feature}-finance.md)
```

### F7. COO — 운영 PDCA 오케스트레이터

```
Plan   → COO 직접 (현재 운영 현황 + 개선 범위)
Design → COO 직접 (CI/CD + 모니터링 설계)
Do     → COO 직접 (파이프라인/모니터링 구축)
Check  → COO 직접 (운영 지표 달성 여부)
Report → COO 직접 (docs/07-ops/{feature}-ops.md)
```

### F8. 각 C레벨의 Checkpoint (사용자 확인 게이트)

bkit PDCA처럼, 각 C레벨은 **자동으로 진행하지 않는다.** 핵심 결정 지점마다 사용자 확인이 필요하다.

#### 공통 Checkpoint 규칙

모든 C레벨은 다음 두 지점에서 반드시 AskUserQuestion으로 대기한다:

**CP-1 (Plan 완료 후) — 범위/방향 확인:**
```
이해한 내용과 접근 방향을 제시하고 확인 요청.
옵션 형태 예시:
  A. 최소 범위: {설명} (빠르지만 제한적)
  B. 표준 범위: {설명} ← 권장
  C. 확장 범위: {설명} (포괄적이지만 시간 소요)
"어떤 방향으로 진행할까요? (A/B/C 또는 커스텀)"
```

**CP-2 (Do 시작 전) — 실행 승인:**
```
수행할 작업 목록을 구체적으로 나열 후:
"위 내용으로 실행해도 될까요?"
```

#### C레벨별 추가 Checkpoint

| C레벨 | 추가 CP | 시점 | 확인 내용 |
|-------|---------|------|---------|
| CEO | CP-R | 라우팅 후 | "이 업무를 {C레벨}에게 위임합니다. 맞나요?" |
| CEO (absorb) | CP-A | Design 후 | 배분 맵 전체 표시 → "이 배분으로 진행할까요?" |
| CTO | CP-G1~G4 | 각 Gate 후 | Gate 체크리스트 결과 → "계속/수정/중단" |
| CTO | CP-D | Design 후 | A/B/C 아키텍처 옵션 → 선택 확인 |
| CPO | CP-P | PRD 초안 후 | "이 PRD 방향이 맞나요? 수정할 부분이 있나요?" |
| CMO | CP-S | SEO 전략 수립 후 | "이 SEO 전략으로 감사를 진행할까요?" |
| CSO | CP-C | Critical 발견 시 | "Critical {N}건 발견. 배포 차단할까요?" |

#### 대화형 탐색 (Plan 단계)

Plan 단계에서 정보가 부족하면 C레벨이 먼저 대화로 탐색한다:

```
CTO Plan 예시:
  "이 기능으로 어떤 문제를 해결하려 하나요?"
  "기술 스택 제약이 있나요?"
  "참고할 기존 코드가 있나요?"
  ↓ 답변 수집 후 범위 옵션 A/B/C 제시
```

---

### F9. CEO 자율 실행 모드 (Full-Auto)

사용자가 CEO에게 전체 위임을 명시하면 (`/vais ceo --auto {feature}`, 또는 "알아서 해줘", "전체 진행해줘") CEO가 자율적으로 전체 PDCA를 완주하고 스스로 검토-재실행 루프를 돈다.

#### Full-Auto 흐름

```
1. CEO Plan
   → 업무 분석 → 담당 C레벨 + 권장 범위(B안) 자동 선택
   → (CP-1 생략 — 자율 모드이므로)

2. CEO Do: C레벨 순차 위임
   → 각 C레벨이 PDCA를 권장 옵션(B안)으로 실행
   → 각 C레벨 내부 CP에서도 권장안 자동 선택

3. CEO Check: 자가 검토 (Self-Review Loop)
   → 각 C레벨 산출물을 CEO가 직접 읽고 평가
   → 평가 기준:
      - 전략 목표와 정합성이 있는가?
      - 산출물이 충분히 구체적인가?
      - 다음 C레벨 입력으로 쓸 수 있는가?
   → 부족하면: 해당 C레벨 재실행 (최대 2회)
   → 충분하면: 다음 단계 진행

4. CEO Report
   → 전체 PDCA 결과 요약
   → 자동 선택한 결정들 목록
   → 사용자에게 최종 보고 (여기서만 사용자 확인)
```

#### Self-Review 판정 기준

CEO가 각 C레벨 산출물을 검토할 때 사용하는 기준:

| C레벨 | 통과 기준 | 재실행 트리거 |
|-------|---------|------------|
| CTO | Gate 4 통과 + Interface Contract 존재 | Gate 미통과 또는 빌드 실패 |
| CPO | PRD 8섹션 모두 작성 + 우선순위 정의 | 섹션 누락 또는 우선순위 미정 |
| CMO | SEO 점수 ≥ 80 | 점수 미달 |
| CSO | Critical 취약점 0개 | Critical 잔존 |
| CFO | ROI 계산값 존재 | 계산 불완전 |
| COO | CI/CD 파이프라인 설계 존재 | 설계 누락 |

#### Auto vs Interactive 비교

| 항목 | Interactive (기본) | Full-Auto (`--auto`) |
|------|-----------------|-------------------|
| CP-1 범위 선택 | 사용자 선택 | B안 자동 선택 |
| Do 실행 승인 | 사용자 확인 | 자동 진행 |
| C레벨 산출물 검토 | 사용자 검토 | CEO 자가 검토 |
| 재실행 결정 | 사용자 결정 | CEO 자동 결정 (최대 2회) |
| 최종 보고 | 매 단계 보고 | 완료 후 1회 보고 |

---

### F10. 6-레이어 Context Engineering

각 agents/*.md에 공통 "Context Load" 섹션 추가:

```
Layer 1: Global   → vais.config.json
Layer 2: Project  → .vais/memory.json (관련 엔트리 필터)
Layer 3: Feature  → .vais/status.json
Layer 4: C-Suite  → 이전 C레벨 산출물 (체이닝 시)
Layer 5: Agent    → 현재 실행 상태
Layer 6: Session  → 현재 대화 컨텍스트
```

각 C레벨은 세션 시작 시 L1-L3 로드, 체이닝 시 L4 추가 로드.

### F11. phases/*.md Thin Entry Point

모든 `skills/vais/phases/*.md`를 ≤15줄로 축소:

```markdown
---
name: {name}
description: {한 줄}
---

# {C레벨} Phase

`${CLAUDE_PLUGIN_ROOT}/agents/{name}.md`를 읽고 그 안의 지침에 따라 실행하세요.
```

---

## 2. 에이전트 맵 (전체)

```
CEO (라우터/전략)
├── absorb-analyzer  ← absorb Do 단계
└── [위임] → CPO / CTO / CMO / CSO / CFO / COO

CPO (제품)
├── pm-discovery
├── pm-strategy
├── pm-research
└── pm-prd

CTO (기술)
├── design
├── architect
├── frontend
├── backend
└── qa

CMO (마케팅)
└── seo

CSO (보안)
├── security
└── validate-plugin

CFO (재무)  ← 서브에이전트 없음, 직접 수행

COO (운영)  ← 서브에이전트 없음, 직접 수행
```

---

## 3. 구현 범위

### MVP (이번 작업)

| # | 항목 | 파일 수 |
|---|------|---------|
| 1 | F8: PDCA 컨벤션 문서 (에이전트 맵 + 공통 구조 표준) | 1 |
| 2 | F1~F7: agents/*.md 7개 재작성 | 7 |
| 3 | F9: phases/*.md 7개 Thin Entry Point | 7 |

**총 15개 파일** — 코드(lib/, scripts/) 변경 없음.

---

## 4. Success Criteria

| ID | 기준 | 검증 |
|----|------|------|
| SC-01 | 모든 agents/*.md에 Plan/Design/Do/Check/Report 섹션 + 각 단계 실행자(직접/에이전트명) 명시 | 파일 내 섹션 확인 |
| SC-02 | agents/cto.md의 Design 단계에 "design 에이전트 + architect 에이전트" 위임 명시 | 파일 내 확인 |
| SC-03 | agents/ceo.md에 라우팅 규칙 테이블 존재 | 파일 내 확인 |
| SC-04 | 모든 phases/*.md ≤ 15줄 | 라인 수 확인 |
| SC-05 | agents/cfo.md, agents/coo.md에 STUB 문구 없음 | 파일 내 검색 |
| SC-06 | 모든 agents/*.md에 "Context Load (L1-L3)" 섹션 존재 | 파일 내 확인 |
| SC-07 | 모든 agents/*.md에 CP-1(범위 확인)과 CP-2(실행 승인) Checkpoint 명시 | 파일 내 확인 |
| SC-08 | agents/ceo.md에 Full-Auto 모드(--auto) 섹션 + Self-Review Loop 판정 기준 존재 | 파일 내 확인 |
| SC-09 | agents/ceo.md absorb 섹션에 CP-A(배분 맵 확인) Checkpoint 명시 | 파일 내 확인 |

---

## 5. Impact Analysis

### 변경 파일

| 파일 | 변경 |
|------|------|
| `agents/ceo.md` | rewrite — 라우터 + absorb PDCA 추가 |
| `agents/cto.md` | rewrite — PDCA 6단계 + 서브에이전트 명시 |
| `agents/cpo.md` | rewrite — pm-* 에이전트 위임 구조 |
| `agents/cmo.md` | rewrite — seo 에이전트 위임 구조 |
| `agents/cso.md` | rewrite — security/validate-plugin 위임 구조 |
| `agents/cfo.md` | rewrite — STUB 제거, 재무 PDCA |
| `agents/coo.md` | rewrite — STUB 제거, 운영 PDCA |
| `skills/vais/phases/ceo.md` | Thin Entry Point |
| `skills/vais/phases/cto.md` | Thin Entry Point |
| `skills/vais/phases/cpo.md` | Thin Entry Point |
| `skills/vais/phases/cmo.md` | Thin Entry Point |
| `skills/vais/phases/cso.md` | Thin Entry Point |
| `skills/vais/phases/cfo.md` | Thin Entry Point (STUB 제거) |
| `skills/vais/phases/coo.md` | Thin Entry Point (STUB 제거) |
| `docs/architecture/vais-pdca-convention.md` | create |

### 변경 없음
`lib/`, `scripts/`, `skills/vais/utils/`, `templates/`, `tests/`

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-01 | 초기 작성 |
| v1.1 | 2026-04-01 | 방향 수정: 역할별 특화 → 동일 bkit PDCA |
| v1.2 | 2026-04-01 | 보강: C레벨 = PDCA 오케스트레이터 + 단계별 서브에이전트 위임 구조 추가 |
| v1.3 | 2026-04-01 | 보강: Checkpoint 시스템 + CEO Full-Auto 모드 + Self-Review Loop 추가 |
