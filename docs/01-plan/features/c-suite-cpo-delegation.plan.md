# Plan: C-Suite 확장 + 위임 패턴 정립 (CPO/CFO/COO)

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | c-suite-cpo-delegation |
| 작성일 | 2026-04-01 |
| 버전 | v1.1 |
| 목표 | CPO/CFO/COO 신설 + C-Suite → Sub-agent 위임 패턴 일관화 + 레거시 제거 |

### Value Delivered

| 관점 | 내용 |
|------|------|
| Problem | CPO/CFO/COO 부재로 PM/재무/운영 역할이 CTO·CEO에 혼재. CMO/CSO가 sub-task를 인라인 처리 — 역할 경계 불명확 |
| Solution | CPO(제품)/CFO(재무)/COO(운영) 신설. 각 C-level이 전문 sub-agent에게 위임하는 패턴으로 일관화 |
| Function UX Effect | `/vais cpo|cfo|coo {feature}` 로 각 역할 직접 호출. CEO가 전체 C-Suite 오케스트레이션 가능 |
| Core Value | C-Suite 각자의 책임이 명확해지고 sub-agent 독립 교체/확장 가능. CFO/COO는 스텁으로 우선 등록 |

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | PM 역할이 CTO에 혼재하면 plan 품질 저하 + 역할 추적 불가. 위임 패턴 미정착으로 CMO/CSO가 너무 많은 인라인 로직 보유 |
| WHO | vais 사용자, C-Suite 에이전트, sub-agent들 |
| RISK | CPO-CTO 경계 불명확 시 역할 중복 발생. sub-agent 파일 수 증가로 관리 복잡도 상승 |
| SUCCESS | SC-01: CPO가 PRD를 생성하고 CTO에게 컨텍스트로 전달. SC-02: CMO가 SEO agent를 Agent 도구로 호출. SC-03: CSO가 validate-plugin/security agent를 Agent 도구로 호출. SC-04: 레거시 manager/auto 완전 제거 |
| SCOPE | agents/, skills/vais/phases/, skills/vais/SKILL.md, skills/vais-seo/(삭제), skills/vais-validate-plugin/(삭제) |

---

## 1. 목표 아키텍처

### 1.1 C-Suite 계층 구조

```
사용자
  └─ /vais {action} {feature}
        │
        ▼
  CEO (최상위 오케스트레이터)
    ├─ CPO → pm-discovery, pm-strategy, pm-research, pm-prd (sub-agents)
    ├─ CTO → plan(직접), design, architect, frontend, backend, qa (sub-agents)
    ├─ CMO → 마케팅전략(직접), seo (sub-agent)
    └─ CSO → 보안검토(직접), validate-plugin, security (sub-agents)
```

### 1.2 CPO vs CTO 역할 경계

| 항목 | CPO | CTO |
|------|-----|-----|
| 담당 | 무엇을 만들 것인가 | 어떻게 만들 것인가 |
| 산출물 | PRD, 로드맵, 우선순위 | Plan doc, Design doc, 코드 |
| 입력 | 사용자 니즈, 시장, CEO 전략 | CPO PRD, 기술 제약 |
| sub-agents | pm-discovery, pm-strategy, pm-research, pm-prd | design, architect, frontend, backend, qa |

### 1.3 파일 구조 변경

**신규 추가:**
```
agents/
  cpo.md              ← CPO 에이전트 (신규, 완전 구현)
  cfo.md              ← CFO 에이전트 (신규, 스텁)
  coo.md              ← COO 에이전트 (신규, 스텁)
  seo.md              ← SEO sub-agent (CMO에서 분리)
  validate-plugin.md  ← Plugin 검증 sub-agent (CSO에서 분리)
  security.md         ← 보안 검토 sub-agent (CSO에서 분리)

skills/vais/phases/
  cpo.md              ← CPO phase (신규, 완전 구현)
  cfo.md              ← CFO phase (신규, 스텁)
  coo.md              ← COO phase (신규, 스텁)
```

**수정:**
```
agents/
  ceo.md    ← CPO 위임 추가
  cmo.md    ← SEO 인라인 로직 제거 → seo agent 위임으로 교체
  cso.md    ← validate-plugin/security 인라인 로직 제거 → sub-agent 위임

skills/vais/SKILL.md  ← cpo 액션 추가, deprecated manager/auto 제거
```

**삭제:**
```
skills/vais-seo/              ← 전체 폴더 삭제
skills/vais-validate-plugin/  ← 전체 폴더 삭제
skills/vais/phases/manager.md ← deprecated
skills/vais/phases/auto.md    ← deprecated
```

---

## 2. 요구사항

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-01 | CPO 에이전트 신설 — PRD + 로드맵 담당, pm sub-agents 호출 | Must |
| FR-02 | CEO가 CPO를 C-Suite 위임 목록에 추가 | Must |
| FR-03 | CMO에서 SEO 인라인 로직 제거 → seo.md sub-agent 위임 | Must |
| FR-04 | CSO에서 validate-plugin 인라인 로직 제거 → sub-agent 위임 | Must |
| FR-05 | CSO에서 보안 검토 로직 sub-agent로 분리 | Should |
| FR-06 | skills/vais-seo/, skills/vais-validate-plugin/ 폴더 삭제 | Must |
| FR-07 | phases/manager.md, phases/auto.md 삭제 | Must |
| FR-08 | SKILL.md에 cpo 액션 추가, deprecated 제거 | Must |
| FR-09 | /vais cpo {feature} 로 CPO 직접 호출 가능 | Must |
| FR-10 | /vais ceo:cpo:cto {feature} 체이닝 지원 | Should |
| FR-11 | CFO 에이전트 스텁 생성 — 재무/비용 분석, ROI 계산, 가격 책정 담당 | Should |
| FR-12 | COO 에이전트 스텁 생성 — 운영 프로세스, CI/CD, 모니터링 담당 | Should |
| FR-13 | CEO 위임 목록에 CFO/COO 추가 | Should |
| FR-14 | SKILL.md에 cfo/coo 액션 추가 | Should |

### 2.2 비기능 요구사항

| ID | 요구사항 |
|----|---------|
| NFR-01 | 기존 /vais cto, /vais ceo 등 기존 명령어 100% 호환 유지 |
| NFR-02 | CPO가 PRD 없을 때도 /vais cto 단독 실행 가능 (CPO optional) |
| NFR-03 | sub-agent 파일은 agents/ 폴더에서 독립적으로 호출 가능 |

---

## 3. CPO 에이전트 상세 설계

### 3.1 핵심 역할

1. **PRD 작성**: pm sub-agents를 호출하여 사용자 리서치 → 전략 → 시장조사 → PRD 생성
2. **로드맵 정의**: 피처 우선순위, 단계별 릴리즈 계획
3. **CTO 핸드오프**: 완성된 PRD를 컨텍스트로 CTO에게 전달

### 3.2 pm sub-agents 호출 순서

```
CPO
  1. pm-discovery  → Opportunity Solution Tree (Teresa Torres)
  2. pm-strategy   → Value Proposition (JTBD 6-Part) + Lean Canvas  [병렬 가능]
  3. pm-research   → Personas, 경쟁사, TAM/SAM/SOM               [병렬 가능]
  4. pm-prd        → 위 결과 합성 → PRD 문서 생성
```

### 3.3 산출물

```
docs/00-pm/{feature}.prd.md     ← PRD
docs/00-pm/{feature}-roadmap.md ← 로드맵 (선택)
```

---

## 4. Sub-agent 위임 패턴

### 4.1 CMO → SEO 위임

**변경 전** (인라인):
- CMO.md가 SEO 체크리스트 직접 실행

**변경 후** (위임):
```
CMO
  1. 마케팅 방향 분석 (직접)
  2. Agent 도구 → seo.md 호출
  3. SEO 결과 수신 + 통합 리포트 생성
```

`agents/seo.md` 내용: 기존 `agents/cmo.md`의 SEO 감사 로직 이동

### 4.2 CSO → validate-plugin / security 위임

**변경 전** (인라인):
- CSO.md가 OWASP 체크리스트 + 플러그인 검증 직접 실행

**변경 후** (위임):
```
CSO
  1. Gate A (보안 검토) → Agent 도구 → security.md 호출
  2. Gate B (플러그인 검증) → Agent 도구 → validate-plugin.md 호출
  3. 두 결과 수신 + 최종 판정
```

---

## 5. 레거시 제거 계획

### 5.1 삭제 대상 및 이유

| 대상 | 이유 | 대체 |
|------|------|------|
| `skills/vais-seo/` | CMO의 SEO 위임으로 직접 호출 불필요 | `agents/seo.md` |
| `skills/vais-validate-plugin/` | CSO의 위임으로 직접 호출 불필요 | `agents/validate-plugin.md` |
| `skills/vais/phases/manager.md` | v2.0에서 CTO로 대체 완료 | `/vais cto` |
| `skills/vais/phases/auto.md` | v2.0에서 CTO로 대체 완료 | `/vais cto` |

### 5.2 SKILL.md 정리

**제거할 내용:**
- 액션 테이블의 `manager`, `auto` 행
- `Deprecated 액션 처리` 실행 지침 분기

**추가할 내용:**
- 액션 테이블에 `cpo [feature]` 행

---

## 6. 구현 순서

| 순서 | 작업 | 파일 |
|------|------|------|
| 1 | 레거시 파일 삭제 | phases/manager.md, phases/auto.md |
| 2 | 독립 스킬 폴더 삭제 | skills/vais-seo/, skills/vais-validate-plugin/ |
| 3 | SEO sub-agent 생성 | agents/seo.md |
| 4 | validate-plugin sub-agent 생성 | agents/validate-plugin.md |
| 5 | security sub-agent 생성 | agents/security.md |
| 6 | CMO 경량화 (SEO 위임으로) | agents/cmo.md |
| 7 | CSO 경량화 (sub-agent 위임으로) | agents/cso.md |
| 8 | CPO 에이전트 신설 | agents/cpo.md |
| 9 | CPO phase 파일 신설 | skills/vais/phases/cpo.md |
| 10 | CEO에 CPO 위임 추가 | agents/ceo.md |
| 11 | CFO 스텁 생성 | agents/cfo.md, skills/vais/phases/cfo.md |
| 12 | COO 스텁 생성 | agents/coo.md, skills/vais/phases/coo.md |
| 13 | CEO에 CFO/COO 위임 추가 | agents/ceo.md |
| 14 | SKILL.md 정리 | skills/vais/SKILL.md |

---

## 7. 리스크

| 리스크 | 대응 |
|--------|------|
| CPO-CTO 역할 중복 (plan을 누가 쓰나?) | CPO = "무엇을" (PRD), CTO = "어떻게" (plan.md). plan.md는 CTO 전용 유지 |
| 기존 /vais ceo:cto 체이닝 깨짐 | CEO가 CPO를 추가로 받되 기존 ceo:cto는 그대로 동작 보장 |
| sub-agent 파일 증가로 혼란 | agents/ 폴더에 C-level vs sub-agent 구분 주석/README 추가 |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-01 | 초기 작성 |
| v1.1 | 2026-04-01 | CFO/COO 스텁 추가 |
