# Plan: pm-skills 흡수 — CPO 서브에이전트 신설 + C-Suite 강화

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | pm-skills-absorb |
| 작성일 | 2026-04-01 |
| 버전 | v1.0 |
| 목표 | `/home/claude/pm-skills` 폴더(8개 플러그인, 65개 스킬, 36개 체인 워크플로우)를 VAIS C-Suite 에이전트 구조로 흡수 |

### Value Delivered

| 관점 | 내용 |
|------|------|
| Problem | CPO 서브에이전트(pm-discovery, pm-strategy, pm-research, pm-prd)가 미구현 상태 — CPO가 PM 프레임워크 없이 오케스트레이션만 수행 |
| Solution | pm-skills의 Teresa Torres, Lean Canvas, JTBD, OST 등 검증된 PM 프레임워크를 CPO 서브에이전트로 흡수 |
| Function UX Effect | `/vais cpo {feature}` 실행 시 discovery→strategy→research→prd 4단계 PM 파이프라인 자동 실행 |
| Core Value | CMO/CFO/CTO/CSO도 각 도메인 관련 프레임워크를 보강 받아 산출물 품질 향상 |

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | CPO 서브에이전트가 plan 문서에는 정의되었으나 실제 agents/ 파일이 없어 오케스트레이션 불가 |
| WHO | CPO, CMO, CFO, CTO, CSO 에이전트 + VAIS 사용자 |
| RISK | pm-skills 스킬과 VAIS 에이전트 역할 경계 혼재 가능성. 에이전트 파일 수 증가로 관리 복잡도 상승 |
| SUCCESS | SC-01: CPO가 4개 서브에이전트 순차 호출로 PM 파이프라인 완성. SC-02: CMO가 GTM/ICP 프레임워크로 마케팅 전략 생성. SC-03: CSO가 privacy-policy/NDA 체크리스트 포함 보안 검토 수행 |
| SCOPE | `agents/pm-discovery.md`, `agents/pm-strategy.md`, `agents/pm-research.md`, `agents/pm-prd.md` 신규 생성 + `agents/cpo.md`, `agents/cmo.md`, `agents/cfo.md`, `agents/cto.md`, `agents/cso.md` 보강 |

## 흡수 소스 분석

### pm-skills 폴더 구조

| 플러그인 | 스킬 수 | 핵심 프레임워크 |
|---------|--------|--------------|
| pm-foundation | 14개 | Opportunity Solution Tree (Teresa Torres), Assumption Mapping, Experiment Design |
| pm-strategy | 12개 | Product Strategy Canvas 9섹션, Value Proposition JTBD 6-Part, Lean Canvas, SWOT, PESTLE, Porter's Five Forces, Ansoff Matrix |
| pm-research | 9개 | User Personas, Market Sizing TAM/SAM/SOM, Competitor Analysis, Customer Journey Map, Sentiment Analysis |
| pm-prd | 11개 | PRD 8섹션, OKR, Sprint Plan, Retro, Release Notes, Pre-mortem, Stakeholder Map, User Stories, Job Stories |
| pm-marketing | 8개 | GTM Strategy, ICP, North Star Metric, Growth Loops, Competitive Battlecard, Positioning |
| pm-analytics | 5개 | SQL Queries, Cohort Analysis, A/B Test Analysis |
| pm-legal | 4개 | Privacy Policy, NDA Draft, Terms of Service |
| pm-toolkit | 2개 | (제외) resume/grammar — VAIS 범위 밖 |

**제외 항목**: `pm-toolkit`의 resume, grammar-check, dummy-dataset

## 배분 맵

### CPO — 신규 서브에이전트 4개 생성

#### `agents/pm-discovery.md`

Teresa Torres의 Opportunity Solution Tree(OST) 기반 PM Discovery 에이전트.

| 서브태스크 | 기능 |
|----------|------|
| brainstorm-ideas | 기회/솔루션 아이디어 발산 |
| identify-assumptions | 핵심 가정 도출 |
| prioritize-assumptions | 가정 우선순위 결정 (리스크 × 알 수 없음) |
| brainstorm-experiments | 가정 검증 실험 설계 |
| interview-script | 사용자 인터뷰 스크립트 작성 |
| summarize-interview | 인터뷰 결과 요약 → 기회 맵 업데이트 |

#### `agents/pm-strategy.md`

Product Strategy Canvas 9섹션 기반 전략 에이전트.

| 서브태스크 | 기능 |
|----------|------|
| product-vision | 비전 문장 작성 |
| value-proposition | JTBD 6-Part 프레임워크로 가치 제안 |
| lean-canvas | Lean Canvas 작성 |
| business-model | 비즈니스 모델 설계 |
| monetization-strategy | 수익화 전략 (freemium, SaaS, marketplace 등) |
| pricing-strategy | 가격 책정 전략 |
| swot | SWOT 분석 |
| pestle | PESTLE 분석 |
| porters-five-forces | Porter's Five Forces |
| ansoff-matrix | Ansoff Matrix 성장 전략 |

#### `agents/pm-research.md`

시장/사용자 리서치 에이전트.

| 서브태스크 | 기능 |
|----------|------|
| user-personas | 사용자 페르소나 생성 |
| market-segments | 시장 세그먼트 분류 |
| user-segmentation | 사용자 세그멘테이션 분석 |
| customer-journey-map | 고객 여정 지도 작성 |
| market-sizing | TAM/SAM/SOM 시장 규모 산정 |
| competitor-analysis | 경쟁사 5개사 분석 |
| sentiment-analysis | 사용자 피드백 감성 분석 |

#### `agents/pm-prd.md`

PRD 생성 + 릴리즈 관리 에이전트.

| 서브태스크 | 기능 |
|----------|------|
| create-prd | PRD 8섹션 작성 (Overview, Goals, User Stories, Requirements, Tech Spec, Timeline, Metrics, Risks) |
| brainstorm-okrs | OKR 작성 |
| outcome-roadmap | 아웃컴 기반 로드맵 생성 |
| sprint-plan | 스프린트 계획 수립 |
| retro | 회고 진행 |
| release-notes | 릴리즈 노트 작성 |
| pre-mortem | Pre-mortem 분석 |
| stakeholder-map | 이해관계자 맵 작성 |
| user-stories | 사용자 스토리 작성 |
| job-stories | Job Stories 작성 (JTBD 포맷) |
| prioritization | MoSCoW / RICE / ICE 우선순위 결정 |

### CPO — `agents/cpo.md` 강화

| 변경 항목 | 내용 |
|---------|------|
| 서브에이전트 오케스트레이션 | pm-discovery → pm-strategy → pm-research → pm-prd 순차 실행 로직 추가 |
| PDCA Do 단계 | 4개 서브에이전트 Agent 도구 호출 명시 |
| Context Load | 각 서브에이전트 산출물을 다음 에이전트에 전달하는 방법 명시 |

### CMO — `agents/cmo.md` 강화

| 추가 항목 | 출처 |
|---------|------|
| GTM Strategy (Beachhead Segment → Early Majority 확장) | pm-marketing |
| ICP (Ideal Customer Profile) 정의 방법론 | pm-marketing |
| North Star Metric 설정 프레임워크 | pm-marketing |
| Growth Loops 설계 (viral, paid, content) | pm-marketing |
| GTM Motions (PLG, SLG, CLG) | pm-marketing |
| Competitive Battlecard 작성 | pm-marketing |
| Positioning Statement (Geoffrey Moore 포맷) | pm-marketing |

### CFO — `agents/cfo.md` 보강

| 추가 항목 | 출처 |
|---------|------|
| Monetization Strategy 프레임워크 참조 | pm-strategy |
| Pricing Strategy (Value-based, Cost-plus, Competitive) | pm-strategy |

### CTO — `agents/cto.md` 보강

| 추가 항목 | 출처 |
|---------|------|
| Data Analytics 역량 (QA/분석 단계 참조용) | pm-analytics |
| SQL Queries 패턴 | pm-analytics |
| Cohort Analysis 방법론 | pm-analytics |
| A/B Test Analysis 설계 | pm-analytics |

### CSO — `agents/cso.md` 보강

| 추가 항목 | 출처 |
|---------|------|
| Privacy Policy 체크리스트 (Gate A 법적 컴플라이언스) | pm-legal |
| NDA Draft 검토 항목 | pm-legal |
| Terms of Service 필수 조항 | pm-legal |

## 구현 순서

| 순서 | 작업 | 파일 |
|------|------|------|
| 1 | pm-discovery 에이전트 생성 | `agents/pm-discovery.md` |
| 2 | pm-strategy 에이전트 생성 | `agents/pm-strategy.md` |
| 3 | pm-research 에이전트 생성 | `agents/pm-research.md` |
| 4 | pm-prd 에이전트 생성 | `agents/pm-prd.md` |
| 5 | CPO 오케스트레이션 강화 | `agents/cpo.md` |
| 6 | CMO GTM/마케팅 보강 | `agents/cmo.md` |
| 7 | CFO 가격/수익화 보강 | `agents/cfo.md` |
| 8 | CTO 데이터 분석 보강 | `agents/cto.md` |
| 9 | CSO 법적 컴플라이언스 보강 | `agents/cso.md` |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-01 | 최초 작성 — pm-skills absorb 배분 맵 확정 |
