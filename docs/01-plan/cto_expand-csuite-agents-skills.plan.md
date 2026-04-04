# expand-csuite-agents-skills - 기획서

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 현재 C-Level 7명 + 실무 에이전트 14명 + 스킬 7개로, 실제 SaaS 회사의 실무 조직 대비 핵심 역할이 빠져있어 AI Company 확장 시 병목 발생 |
| **Solution** | 실제 소프트웨어 회사 조직을 벤치마크하여 C-Level별 누락된 실무 에이전트와 전용 스킬을 식별·추가 |
| **Function/UX Effect** | `/vais cto`로 개발 시 테스트·DevOps·데이터 등 전문 역할이 자동 위임되어 산출물 품질 향상 |
| **Core Value** | AI Company로서 실제 회사 수준의 역할 분담 → 각 C-Level이 전문 인력 없이도 전체 SDLC 커버 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | AI Company 확장을 위해 실무 에이전트·스킬 부족 문제 해결 |
| **WHO** | VAIS Code 사용자 (SaaS/소프트웨어 개발자) |
| **RISK** | 에이전트가 너무 많으면 오케스트레이션 복잡도 증가, 너무 적으면 커버리지 부족 |
| **SUCCESS** | 모든 C-Level이 최소 2개 이상의 실무 에이전트 보유, 핵심 SDLC 역할 100% 커버 |
| **SCOPE** | Phase 1: 핵심 실무 에이전트 + 스킬 골격 추가 (디테일 구현은 후속) |

---

## 0. 아이디어 개요

### 아이디어 한 줄 설명
> C-Level별 실무 에이전트와 스킬을 실제 SaaS 회사 조직 수준으로 확장하여 AI Company 기반을 완성한다.

### 배경 (왜 필요한지)
- 현재 문제: CTO 산하에 편중(6개), CFO는 서브에이전트 0개, CMO는 seo 1개뿐
- 기존 해결책의 한계: 에이전트 없는 C-Level은 모든 것을 직접 수행 → 품질·전문성 부족
- 이 아이디어가 필요한 이유: AI Company로 확장하려면 실제 회사처럼 전문 실무자가 필요

### 타겟 사용자
- 주요 사용자: VAIS Code로 SaaS/소프트웨어를 개발하는 개인 개발자·소규모 팀
- 보조 사용자: AI Company 프레임워크를 활용하려는 조직
- 사용자의 현재 Pain Point: CEO로 서비스 런칭 시 마케팅·운영·재무 단계에서 전문성 부족

---

## 1. 현황 분석 (AS-IS)

### 1.1 현재 에이전트 인벤토리 (21개)

| C-Level | 오케스트레이터 | 실무 에이전트 | 수 |
|---------|-------------|-------------|---|
| CEO | ceo | absorb-analyzer, retro | 2 |
| CPO | cpo | pm-discovery, pm-strategy, pm-research, pm-prd | 4 |
| CTO | cto | architect, backend, frontend, design, qa, investigate | 6 |
| CSO | cso | security, validate-plugin, code-review | 3 |
| CMO | cmo | seo | 1 |
| COO | coo | canary, benchmark | 2 |
| CFO | cfo | *(없음)* | 0 |

### 1.2 현재 스킬 인벤토리 (7개 utils + 13개 phases)

**Utils**: commit, status, help, init, next, report, test
**Phases**: plan, design, architect, backend, frontend, qa, ceo, cpo, cto, cso, cmo, coo, cfo

### 1.3 문제점

1. **CFO 서브에이전트 0개** — 재무 분석을 혼자 수행
2. **CMO 서브에이전트 1개** — SEO 외 콘텐츠·그로스 영역 공백
3. **COO DevOps 부재** — canary/benchmark는 있지만 CI/CD·인프라 배포 전문가 없음
4. **CTO 테스트 전문가 부재** — qa는 Gap 분석만, 실제 테스트 코드 작성 역할 없음
5. **CPO 데이터 분석 부재** — 제품 결정을 위한 데이터 분석 역할 없음
6. **C-Level 전용 스킬 부재** — 마케팅 분석, 비용 분석 등의 독립 스킬 없음

---

## 2. 추가 대상 식별 (TO-BE)

### 2.1 실제 SaaS 회사 조직 벤치마크

실제 소프트웨어 회사에서 각 C-Level 산하에 필요한 실무 역할:

```
CEO ─── 전략기획, 회고, 외부 흡수
│
├── CPO ─── PM(기획), UX 리서처, 데이터 분석가
│
├── CTO ─── 아키텍트, 프론트엔드, 백엔드, DBA, 테스터, DevOps
│
├── CSO ─── 보안 엔지니어, 코드 리뷰어, 컴플라이언스
│
├── CMO ─── SEO, 콘텐츠 라이터, 그로스 해커
│
├── COO ─── SRE/인프라, 문서화, 배포 관리
│
└── CFO ─── 비용 분석가, 가격 모델러
```

### 2.2 신규 에이전트 목록 (14개)

#### CTO 산하 (+3)

| 에이전트 | 역할 | 위임 시점 | 우선순위 |
|---------|------|---------|---------|
| `tester` | 테스트 코드 작성 (unit/integration/e2e). qa의 Gap 분석과 분리 — qa는 검증, tester는 코드 작성 | Do 단계에서 frontend+backend와 병렬 | Must |
| `devops` | CI/CD 파이프라인, Docker, GitHub Actions 작성. architect와 분리 — architect는 설계, devops는 자동화 | Do 또는 COO 위임 시 | Must |
| `database` | DB 스키마 전문. 마이그레이션, 쿼리 최적화, 인덱스 설계. architect에서 DB 부분 분리 | Design→Do 단계 | Nice |

#### CPO 산하 (+2)

| 에이전트 | 역할 | 위임 시점 | 우선순위 |
|---------|------|---------|---------|
| `ux-researcher` | 사용자 인터뷰 스크립트, 사용성 테스트 설계, 페르소나 심화. pm-research에서 UX 부분 분리 | PM 단계 | Nice |
| `data-analyst` | 제품 지표 분석, A/B 테스트 설계, 퍼널 분석. 데이터 기반 의사결정 지원 | Plan/QA 단계 | Must |

#### CMO 산하 (+2)

| 에이전트 | 역할 | 위임 시점 | 우선순위 |
|---------|------|---------|---------|
| `copywriter` | 랜딩페이지 카피, 제품 설명, 이메일 템플릿, 앱스토어 설명문. 마케팅 텍스트 전문 | CMO Do 단계 | Must |
| `growth` | 그로스 전략, 퍼널 최적화, 바이럴 루프 설계, 리텐션 분석 | CMO Plan 단계 | Nice |

#### COO 산하 (+2)

| 에이전트 | 역할 | 위임 시점 | 우선순위 |
|---------|------|---------|---------|
| `sre` | 모니터링 설정 (Prometheus/Grafana), 알림 규칙, 인시던트 대응 런북. canary와 분리 — canary는 배포 직후, sre는 상시 운영 | COO Do 단계 | Must |
| `docs-writer` | 기술 문서 (API docs, README), 사용자 가이드, 온보딩 문서. 산출물 문서화 전문 | Report 단계 | Must |

#### CSO 산하 (+1)

| 에이전트 | 역할 | 위임 시점 | 우선순위 |
|---------|------|---------|---------|
| `compliance` | GDPR/개인정보보호, 라이선스 검사, 감사 로그 검증. security와 분리 — security는 코드 취약점, compliance는 규정 준수 | CSO Check 단계 | Nice |

#### CFO 산하 (+2)

| 에이전트 | 역할 | 위임 시점 | 우선순위 |
|---------|------|---------|---------|
| `cost-analyst` | 클라우드 비용 추정, 인프라 비용 최적화, API 호출 비용 계산 | CFO Do 단계 | Must |
| `pricing-modeler` | 가격 책정 모델링 (freemium/subscription/usage-based), 경쟁사 가격 벤치마크, 수익 시뮬레이션 | CFO Plan 단계 | Nice |

#### CEO 산하 (+0)

> CEO는 현재 absorb-analyzer + retro로 충분. 전략은 C-Level 위임으로 해결.

### 2.3 신규 스킬 목록 (7개)

| 스킬 | 소속 | 역할 | 우선순위 |
|------|------|------|---------|
| `test` (확장) | CTO | 테스트 실행 + 커버리지 리포트 (현재는 유틸리티 수준) | Must |
| `deploy` | COO | 배포 실행 (dev/staging/prod 환경별) | Must |
| `analyze-cost` | CFO | 클라우드 비용 분석 + 최적화 제안 | Must |
| `write-docs` | COO | API 문서/README/가이드 자동 생성 | Must |
| `growth-audit` | CMO | 그로스 퍼널 분석 + 개선 제안 | Nice |
| `license-check` | CSO | 오픈소스 라이선스 호환성 검사 | Nice |
| `pricing` | CFO | 가격 책정 시뮬레이션 | Nice |

---

## 3. 추가 후 조직도 (TO-BE)

```
CEO ─── absorb-analyzer, retro
│
├── CPO ─── pm-discovery, pm-strategy, pm-research, pm-prd
│           + ux-researcher, data-analyst
│
├── CTO ─── architect, backend, frontend, design, qa, investigate
│           + tester, devops, database
│
├── CSO ─── security, validate-plugin, code-review
│           + compliance
│
├── CMO ─── seo
│           + copywriter, growth
│
├── COO ─── canary, benchmark
│           + sre, docs-writer
│
└── CFO ─── (없음 → 신설)
            + cost-analyst, pricing-modeler
```

**변경 요약**:
- 에이전트: 21개 → 33개 (+12개 실무 에이전트)
- 스킬: 20개 → 27개 (+7개 전용 스킬)
- 모든 C-Level이 최소 1개 이상 실무 에이전트 보유

---

## 3.1 C-Level × PDCA 에이전트 매핑 매트릭스 (AS-IS → TO-BE)

> **핵심 원칙**: 각 C-Level은 동일한 PDCA 사이클(Plan→Design→Do→Check→Report)을 수행하지만, 각 단계에서 **위임하는 에이전트와 사용하는 스킬이 다르다**.

### AS-IS (현재)

| C-Level | Plan | Design | Do | Check | Report |
|---------|------|--------|-----|-------|--------|
| **CEO** | 직접 | 직접 | C-Level 위임 | 직접 | 직접 |
| **CPO** | 직접 | pm-discovery + pm-strategy + pm-research (병렬) | pm-prd | 직접 | 직접 |
| **CTO** | 직접 | design + architect (병렬) | frontend + backend (병렬) | qa | 직접 |
| **CSO** | 직접 | 직접 | security / validate-plugin / code-review | 직접 | 직접 |
| **CMO** | 직접 | 직접 | seo | 직접 | 직접 |
| **COO** | 직접 | 직접 | 직접 | canary / benchmark | 직접 |
| **CFO** | 직접 | 직접 | 직접 | 직접 | 직접 |

**문제**: CMO/COO/CFO는 Do에서 위임할 에이전트가 부족하여 직접 수행 비율이 높음.

### TO-BE (개편 후)

| C-Level | Plan | Design | Do | Check | Report |
|---------|------|--------|-----|-------|--------|
| **CEO** | 직접 | 직접 | C-Level 위임 | 직접 | 직접 + retro |
| **CPO** | 직접 + **data-analyst** | pm-discovery + pm-strategy + pm-research (병렬) | pm-prd | 직접 + **data-analyst** | 직접 |
| **CTO** | 직접 | design + architect (병렬) | frontend + backend + **tester** (병렬) | qa + investigate | 직접 |
| **CSO** | 직접 | 직접 | security / validate-plugin / code-review | 직접 + **compliance** | 직접 |
| **CMO** | 직접 + **growth** | 직접 | seo + **copywriter** (병렬) | 직접 | 직접 |
| **COO** | 직접 | 직접 + **devops** | **sre** + **devops** | canary + benchmark | **docs-writer** |
| **CFO** | 직접 + **pricing-modeler** | 직접 | **cost-analyst** | 직접 | 직접 |

### 상세 매핑 — 각 C-Level의 PDCA 단계별 에이전트 역할

#### CTO PDCA (기존 + 신규)

```
Plan ─── 직접 (요구사항 3문항 → A/B/C 범위)
  │
Design ── design (UI/UX) + architect (인프라) [병렬 Agent 호출]
  │
Do ───── frontend + backend + tester [병렬 Agent 호출]
  │       ├── frontend: React/Next.js 구현
  │       ├── backend: API/서버 구현
  │       └── tester (신규): unit/integration/e2e 테스트 코드 작성
  │
Check ── qa (Gap 분석 + 빌드 검증)
  │       └── investigate (디버깅 에스컬레이션)
  │
Report ─ 직접 (memory 기록 + 보고서)
```

**tester vs qa 역할 분리**:
- `tester`: 테스트 **코드를 작성**하는 에이전트 (Do 단계)
- `qa`: 설계 vs 구현 **Gap을 분석**하는 에이전트 (Check 단계)
- `investigate`: 반복 실패 시 **근본 원인 분석** (Check 에스컬레이션)

#### CPO PDCA (기존 + 신규)

```
Plan ─── 직접 (기회 발견 범위 정의)
  │       └── data-analyst (신규): 기존 제품 지표 분석 → 데이터 기반 기회 발견
  │
Design ── pm-discovery + pm-strategy + pm-research [병렬 Agent 호출]
  │
Do ───── pm-prd (PRD 합성)
  │
Check ── 직접 (PRD 완성도)
  │       └── data-analyst (신규): 성공 지표 측정 가능성 검증
  │
Report ─ 직접 (PRD 최종화 + CTO 핸드오프)
```

**data-analyst 역할**: Plan에서 데이터 기반 기회 발견, Check에서 성공 지표 검증 가능성 확인.

#### CMO PDCA (기존 + 신규)

```
Plan ─── 직접 (마케팅 목표·채널·타깃)
  │       └── growth (신규): 그로스 퍼널 전략 수립 + 바이럴 루프 설계
  │
Design ── 직접 (SEO 키워드 + 마케팅 전략)
  │
Do ───── seo + copywriter [병렬 Agent 호출]
  │       ├── seo: 기술 SEO 감사 (meta, 구조, 성능)
  │       └── copywriter (신규): 랜딩 카피 + 이메일 + 앱스토어 설명
  │
Check ── 직접 (SEO 점수 ≥ 80 + 카피 톤 일관성)
  │
Report ─ 직접 (마케팅 최종 보고)
```

**copywriter 역할**: Do에서 seo와 병렬 — seo는 기술적 최적화, copywriter는 마케팅 텍스트 전문.

#### COO PDCA (기존 + 신규)

```
Plan ─── 직접 (운영 현황 + 개선 범위)
  │
Design ── 직접 + devops (신규) [병렬 가능]
  │       └── devops: CI/CD 파이프라인 설계 + Docker/GitHub Actions
  │
Do ───── sre + devops [병렬 Agent 호출]
  │       ├── sre (신규): 모니터링 설정 + 알림 규칙 + 인시던트 런북
  │       └── devops (신규): 파이프라인 구현 + 배포 자동화
  │
Check ── canary + benchmark
  │       ├── canary: 배포 직후 헬스체크
  │       └── benchmark: 성능 기준선 비교
  │
Report ─ docs-writer (신규) + 직접
  │       └── docs-writer: API docs, README, 운영 가이드 자동 생성
```

**devops vs architect 역할 분리**:
- `architect` (CTO 산하): DB 스키마·ORM·환경 **설계**
- `devops` (COO 산하): CI/CD·Docker·배포 **자동화 구현**

**sre vs canary 역할 분리**:
- `canary`: 배포 **직후** 단기 헬스체크
- `sre`: **상시** 모니터링·알림·인시던트 대응

#### CSO PDCA (기존 + 신규)

```
Plan ─── 직접 (위협 범위 + Gate 선택)
  │
Design ── 직접 (위협 모델 + 체크리스트)
  │
Do ───── security / validate-plugin / code-review (Gate별 선택)
  │
Check ── 직접 + compliance (신규)
  │       ├── 직접: Critical 잔존 여부 판정
  │       └── compliance: GDPR·개인정보·라이선스 규정 준수 검증
  │
Report ─ 직접 (보안 최종 보고)
```

#### CFO PDCA (기존 → 전면 개편)

```
Plan ─── 직접 + pricing-modeler (신규)
  │       ├── 직접: 비용 구성 파악 + ROI 목표
  │       └── pricing-modeler: 가격 모델 벤치마크 + 수익 시뮬레이션
  │
Design ── 직접 (재무 모델 설계)
  │
Do ───── cost-analyst (신규) + 직접
  │       ├── cost-analyst: 클라우드 비용 추정 + 인프라 비용 최적화
  │       └── 직접: ROI 계산 + 예산 계획
  │
Check ── 직접 (수치 완전성 + ROI 달성 여부)
  │
Report ─ 직접 (재무 최종 보고)
```

### 3.2 크로스 C-Level 협업 매트릭스

일부 에이전트는 여러 C-Level이 공유하거나 크로스 호출할 수 있다:

| 에이전트 | 주 소속 | 크로스 호출 가능 | 시나리오 |
|---------|--------|----------------|---------|
| `data-analyst` | CPO | CTO(Check), CFO(Plan) | CTO: QA 지표 분석, CFO: 비용 데이터 분석 |
| `devops` | COO | CTO(Do) | CTO가 배포 자동화 필요 시 COO 경유 |
| `docs-writer` | COO | CTO(Report), CPO(Report) | 기술 문서·PRD 최종 문서화 |
| `tester` | CTO | CSO(Do) | CSO 코드 리뷰 시 테스트 커버리지 확인 |
| `compliance` | CSO | CFO(Check) | 비용 관련 규정 준수 (SOC2 등) |

### 3.3 스킬 × C-Level 매핑

| 스킬 | 주 사용 C-Level | 사용 PDCA 단계 | 역할 |
|------|----------------|---------------|------|
| `test` (확장) | CTO | Do→Check | 테스트 실행 + 커버리지 |
| `deploy` | COO | Do | 환경별 배포 |
| `analyze-cost` | CFO | Do→Check | 비용 분석 + 최적화 |
| `write-docs` | COO | Report | API docs/README 생성 |
| `growth-audit` | CMO | Plan→Check | 그로스 퍼널 분석 |
| `license-check` | CSO | Check | 라이선스 호환성 |
| `pricing` | CFO | Plan→Do | 가격 시뮬레이션 |

---

## 4. 구현 범위 (Phase 분류)

### Phase 1 — Must (이번 스프린트)

**에이전트 8개**: tester, devops, data-analyst, copywriter, sre, docs-writer, cost-analyst, pricing-modeler
**스킬 4개**: test(확장), deploy, analyze-cost, write-docs

### Phase 2 — Nice (후속)

**에이전트 4개**: database, ux-researcher, growth, compliance
**스킬 3개**: growth-audit, license-check, pricing

---

## 5. 기능 요구사항

### 5.1 에이전트 기본 골격 요구사항

모든 신규 에이전트는 기존 패턴을 따른다:

```markdown
---
name: {agent-name}
version: 1.0.0
description: |
  {한 줄 설명}
  Triggers: (직접 호출 금지 — {C-Level}를 통해 호출)
model: sonnet
tools: [Read, Write, Edit, Glob, Grep, Bash, TodoWrite]
memory: none
disallowedTools:
  - "Bash(rm -rf*)"
  - "Bash(git push*)"
  - "Bash(git reset --hard*)"
---

# {Agent Name} Agent

## 핵심 역할
1. ...

## 구현 원칙
- 기획서를 반드시 먼저 읽습니다
- CTO/CPO/CMO/COO/CFO 에이전트로부터 위임받은 작업만 수행

## Contract
### Input / Output / State Update
```

### 5.2 스킬 기본 골격 요구사항

```markdown
---
name: {skill-name}
description: {한 줄 설명}
---

# {Skill Name}
## 실행 순서
1. ...
```

### 5.3 등록 요구사항

- `vais.config.json` — 필요 시 roles 또는 workflow 업데이트
- `CLAUDE.md` — Agent Architecture 테이블 업데이트
- `AGENTS.md` — 에이전트 목록 동기화
- 각 C-Level 오케스트레이터 `.md` — 위임 규칙에 신규 에이전트 추가

---

## 6. 비기능 요구사항

| 항목 | 요구사항 | 기준 |
|------|---------|------|
| 일관성 | 모든 에이전트가 동일한 frontmatter 구조 | 기존 에이전트와 동일 패턴 |
| 문서 의무 | 모든 에이전트에 필수 문서 규칙 포함 | SubagentStop 훅 호환 |
| 체크포인트 | C-Level 오케스트레이터만 CP 보유, 실무 에이전트는 CP 없음 | 기존 패턴 유지 |
| disallowedTools | 위험 명령 차단 | rm -rf, git push, git reset --hard |

---

## Success Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-01 | Phase 1 에이전트 8개 `.md` 파일 생성 완료 | `ls agents/{c-level}/` 확인 |
| SC-02 | Phase 1 스킬 4개 `.md` 파일 생성 완료 | `ls skills/vais/` 확인 |
| SC-03 | 모든 C-Level이 최소 1개 실무 에이전트 보유 | 조직도 검증 |
| SC-04 | 기존 에이전트와 동일한 frontmatter 구조 | 패턴 비교 |
| SC-05 | CLAUDE.md, AGENTS.md 조직도 동기화 | 문서 내 에이전트 수 일치 |
| SC-06 | `node scripts/vais-validate-plugin.js` 통과 | 플러그인 구조 검증 |

---

## Impact Analysis

### Changed Resources

| Resource | Type | Change Description |
|----------|------|-------------------|
| `agents/cto/tester.md` | create | 테스트 전문 에이전트 |
| `agents/cto/devops.md` | create | CI/CD·인프라 자동화 에이전트 |
| `agents/cpo/data-analyst.md` | create | 데이터 분석 에이전트 |
| `agents/cmo/copywriter.md` | create | 마케팅 카피 전문 에이전트 |
| `agents/coo/sre.md` | create | SRE·모니터링 에이전트 |
| `agents/coo/docs-writer.md` | create | 기술 문서 전문 에이전트 |
| `agents/cfo/cost-analyst.md` | create | 비용 분석 에이전트 |
| `agents/cfo/pricing-modeler.md` | create | 가격 모델링 에이전트 |
| `agents/cto/cto.md` | modify | tester, devops 위임 규칙 추가 |
| `agents/cpo/cpo.md` | modify | data-analyst 위임 규칙 추가 |
| `agents/cmo/cmo.md` | modify | copywriter 위임 규칙 추가 |
| `agents/coo/coo.md` | modify | sre, docs-writer 위임 규칙 추가 |
| `agents/cfo/cfo.md` | modify | cost-analyst, pricing-modeler 위임 규칙 추가 |
| `CLAUDE.md` | modify | Agent Architecture 테이블 업데이트 |
| `AGENTS.md` | modify | 에이전트 목록 동기화 |
| `package.json` | modify | 신규 에이전트 등록 |

### Verification
- [ ] 모든 consumer 확인 완료
- [ ] breaking change 없음 확인

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-04 | 초기 작성 — 현황 분석 + 신규 에이전트 12개 + 스킬 7개 식별 |
| v1.1 | 2026-04-04 | C-Level × PDCA 에이전트 매핑 매트릭스 추가 (AS-IS→TO-BE), 크로스 협업·역할 분리 명시 |
