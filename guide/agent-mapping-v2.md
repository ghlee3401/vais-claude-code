# VAIS Code 에이전트 & 스킬 매핑 정의서

> **작성일**: 2026-04-13
> **최종 판**: v1.00 (완성)
> **목적**: 각 C-Level의 PDCA 풀 버전 정의 — phase별 참여 에이전트, 모델, 산출물, 범위 조절 규칙
> **원칙**: 풀 버전을 기본으로 정의하고, 시나리오별 범위는 각 C-Level이 자율 판단. 모든 에이전트는 명시적 정의, TODO 없음.

---

## 1. C-Level 구조 개요

### 에이전트 모델 규칙

| 계층 | 모델 | 역할 |
|------|------|------|
| **C-Level (본체)** | **Opus 4.6** | 전략 결정, PDCA 오케스트레이션, 품질 검증 |
| **Sub-agent** | **Sonnet 4.6** | 구체적 실행, 산출물 작성, 기술 검증 |

> **모델 선택 기준**: Opus는 복잡한 전략 결정과 다중 도메인 조율이 필요한 역할에, Sonnet은 구체적이고 focused된 실행에 최적화.

---

## 2. CEO — 전체 오케스트레이션 (Opus 4.6)

### 역할 정의

**입력**: 사용자 요청, 피처 명세, 외부 스킬/에이전트 파일
**처리**: 요청 분석 → 피처 성격 판단 → C-Level 라우팅 → 범위 설정 → 통합 검증
**출력**: plan/design/do/qa/report 문서, 전략 정합성 보증

### 서브에이전트

| 에이전트 | 모델 | 역할 | 입력 | 출력 |
|---------|------|------|------|------|
| **absorb-analyzer** | Sonnet | 외부 스킬/에이전트 흡수 분석: 중복 체크, 품질 평가, 배분 맵 생성 | 외부 마크다운 파일 | 배분 맵, 중복 분석 리포트 |
| **skill-creator** | Sonnet | 신규 스킬/에이전트 마크다운 생성: 스킬 구조 설계, 코드 예시, 입출력 정의 | 스킬 명세, 요구사항 | 스킬 마크다운 파일 (.md) |

### PDCA 풀 버전

| Phase | 참여 에이전트 | 하는 일 | WHY | 산출물 |
|-------|-------------|--------|-----|--------|
| **Plan** | CEO 본체 | 사용자 요청 분석, 피처 성격 판단 (신규 개발/추가/개선/유지보수), 라우팅 대상 C-Level 결정, 범위 설정 (풀/최소/부분) | CEO가 각 요청의 복잡도와 scope를 판단하여 적절한 C-Level에 위임하기 위함 | `ceo_{feature}.plan.md` |
| **Design** | absorb-analyzer (흡수 시) / CEO 본체 (라우팅 시) | 흡수 모드: 외부 파일 스캔 → 기존 에이전트/스킬과의 중복 분석 → 배분 맵 설계. 라우팅 모드: C-Level별 위임 구조 정의 | 흡수 시 중복을 사전에 탐지하여 체계 정합성 유지; 라우팅 시 각 C-Level의 책임 범위를 명확히 하기 위함 | `ceo_{feature}.design.md` |
| **Do** | skill-creator (생성 시) / CEO 본체 (라우팅 시) | 생성 모드: skill-creator가 마크다운 파일 작성 → 구조 정의, 입출력, 사용 예시 포함. 라우팅 모드: CEO가 각 C-Level에 위임 요청 전달 | 생성 시 신규 스킬을 체계적으로 정의하여 재사용성 확보; 라우팅 시 각 C-Level의 PDCA 실행 시작 신호 | `ceo_{feature}.do.md` |
| **QA** | CEO 본체 | 산출물 검증 (plan/design/do 완성도), 전략 정합성 확인 (범위 초과 시 조정), CSO 보안 게이트 통과 여부 확인 | CEO가 전사 수준의 일관성을 보증하고 보안/품질 기준을 강제하기 위함 | `ceo_{feature}.qa.md` |
| **Report** | CEO 본체 | 전체 흐름 종합 리포트: 라우팅 결정 근거, 각 C-Level 산출물 요약, 일정/위험, 다음 단계 | 사용자에게 전체 진행 상황과 의사결정 근거를 투명하게 전달 | `ceo_{feature}.report.md` |

### 모드별 동작 차이

| 모드 | Plan | Design | Do | QA | Report |
|------|------|--------|----|----|--------|
| **라우팅 모드** | 사용자 요청 분석 → C-Level 판단 | C-Level별 위임 구조 설계 | 각 C-Level에 위임 | 전략 정합성 + CSO 게이트 | 라우팅 결정 요약 |
| **스킬 생성 모드** | 스킬 필요성 분석 | 스킬 구조 설계 (입출력, 로직) | skill-creator로 마크다운 생성 | 완성도 검증 → CSO로 이행 | 생성 결과 리포트 |
| **스킬 흡수 모드** | 외부 파일 발견 및 초기 분석 | absorb-analyzer가 중복/배분 분석 | 배분 맵 기반 실행 (통합/보관/폐기) | 완성도 검증 → CSO로 이행 | 흡수 결과 리포트 |

### 범위 조절 예시 (CEO)

#### S-1: 완전 신규 피처 (예: 새로운 고객 세그먼트)
- **포함**: CPO 풀 (기회발굴~데이터분석) + CTO 풀 (구현) + CBO 부분 (GTM) + CSO 풀 (보안검증)
- **제외**: COO (배포 준비는 후속)
- **CEO 범위**: 풀 PDCA + 모든 C-Level 조율

#### S-2: 기존 플랫폼 유지보수 (버그픽스)
- **포함**: CTO 최소 (qa-engineer + incident-responder) + CSO 부분 (secret-scanner + code-reviewer)
- **제외**: CPO, CBO, COO
- **CEO 범위**: Plan + Design (간략) + Do 위임 + QA (보안만) + Report

#### S-3: 스킬 신규 생성
- **포함**: CEO 스킬 생성 모드 풀
- **제외**: 다른 C-Level 미참여
- **CEO 범위**: Plan (필요성 분석) → Design (구조 설계) → Do (skill-creator 실행) → QA (CSO 게이트) → Report

---

## 3. CPO — 제품 기획 총괄 (Opus 4.6)

### 역할 정의

**입력**: CEO로부터 위임 요청, 고객 피드백, 시장 데이터
**처리**: 기회 발굴 → 전략 수립 → PRD + 백로그 작성 → 성공 지표 정의
**출력**: PRD (8개 섹션), 백로그 (유저 스토리 + 수락 기준), 데이터 기반 의사결정 자료

### 서브에이전트

| 에이전트 | 모델 | 역할 | 입력 | 출력 |
|---------|------|------|------|------|
| **product-discoverer** | Sonnet | 기회 발굴 & 고객 문제 정의: 초기 고객 인터뷰, 문제 인정, 지속적 피드백 수집, 트렌드 모니터링 | 사용자 요청, 고객 그룹 | 고객 문제 정의서, 피드백 수집 로그 |
| **product-strategist** | Sonnet | 제품 전략 수립: 핵심 가치 명제, 대상 고객 세그먼트, 차별화 전략, 우선순위 결정 (MoSCoW) | 시장 조사, 고객 문제, 경쟁사 분석 | 전략 문서, MoSCoW 우선순위 맵 |
| **product-researcher** | Sonnet | 시장/경쟁사 조사: 시장 규모, 성장률, 경쟁자 비교 분석, 인더스트리 벤치마크, 규제 환경 | 피처 카테고리, 시장 범위 | 시장 조사 리포트, 경쟁사 분석 표 |
| **prd-writer** | Sonnet | PRD 작성: (1) Overview (2) Problem/Solution (3) Key Features (4) User Stories (5) Success Metrics (6) Timeline (7) Dependencies (8) Appendix | 전략, 고객 문제, 기술 제약, 우선순위 | PRD 마크다운 (8개 섹션) |
| **backlog-manager** | Sonnet | 백로그 관리 & 스프린트 계획: PRD를 유저 스토리로 세분화, 수락 기준 정의, 스토리 포인트 추정, 스프린트 배분 | PRD, 팀 용량 | 백로그 (JIRA/Linear 형식), 스프린트 계획 |
| **ux-researcher** | Sonnet | UX 리서치 & 사용성 분석: 사용자 플로우 검증, 와이어프레임 평가, 접근성 기준 검토, 사용성 테스트 계획 | 고객 그룹, 피처 명세 | UX 리서치 리포트, 개선 권고 |
| **data-analyst** | Sonnet | 데이터 분석 & 지표 정의: 성공 지표 (KPI) 정의, 베이스라인 설정, 측정 방법론, 대시보드 설계 | PRD, 기존 분석 | KPI 정의서, 대시보드 스펙, 코호트 분석 계획 |

### 역할 경계

- **기술 실행 가능성 평가** (API/통합 계획, 기술 제약) → CTO가 plan phase에서 담당
- **GTM 조율** (출시 계획, 마케팅 일정, 가격 결정) → CBO가 담당
- **고객 피드백 루프** → product-discoverer가 확장 커버 (초기 발견 + 지속적 피드백)
- **스프린트 실행 (코딩)** → CTO가 담당

### PDCA 풀 버전

| Phase | 참여 에이전트 | 하는 일 | WHY | 산출물 |
|-------|-------------|--------|-----|--------|
| **Plan** | product-discoverer, product-researcher | 고객 인터뷰 & 문제 발굴, 시장 조사 (규모/성장/트렌드), 경쟁사 분석 (포지셔닝/기능), 고객 피드백 수집 (정성/정량) | 실제 고객 문제와 시장 기회를 데이터로 검증하여 추측이 아닌 근거 기반 기획 수립 | `cpo_{feature}.plan.md` |
| **Design** | product-strategist, ux-researcher | 제품 전략 수립 (핵심 가치, 대상 고객, 차별화), UX 사용자 플로우 설계, 우선순위 결정 (MoSCoW), 접근성/사용성 기준 수립 | 고객 문제를 구체적인 제품 방향으로 변환하고, 사용성을 선제적으로 검토하여 개발 후 대규모 수정 방지 | `cpo_{feature}.design.md` |
| **Do** | prd-writer, backlog-manager | PRD 작성 (8개 섹션 완성), 유저 스토리 및 수락 기준 정의, 스토리 포인트 추정, 스프린트 배분 계획 | PRD는 CTO/CBO/CSO가 참조할 공식 명세; 백로그는 CTO 구현 팀이 직접 사용 | `cpo_{feature}.do.md` |
| **QA** | data-analyst | PRD 완성도 검증 (8개 섹션 충실도), 성공 지표 (KPI) 검증 (측정 가능성/일관성), 백로그 항목 정합성 확인 (중복/누락), 스토리 포인트 타당성 검토 | 출시 후 성공 여부를 정량적으로 평가하기 위해 KPI를 사전에 명확하게 정의; 백로그 품질 보증 | `cpo_{feature}.qa.md` |
| **Report** | CPO 본체 | 제품 기획 종합 리포트: 고객 문제 요약, 시장 기회, 전략 정당성, PRD 개요, KPI, 예상 영향 | 이해관계자 (CEO/CTO/CBO)에게 기획 근거와 기대 성과를 명확하게 전달 | `cpo_{feature}.report.md` |

---

## 4. CTO — 기능 구현 총괄 (Opus 4.6)

### 역할 정의

**입력**: CPO로부터 받은 PRD, 백로그, CBO로부터의 기술 제약사항
**처리**: 기술 검증 → 아키텍처 설계 → 구현 + 테스트 → 품질 검증
**출력**: SDD (Software Design Document), 구현 코드, 테스트 코드, 배포 준비물

### 서브에이전트

| 에이전트 | 모델 | 역할 | 입력 | 출력 |
|---------|------|------|------|------|
| **infra-architect** | Sonnet | SDD 작성 (기술 스택 & 소프트웨어 아키텍처): 기술 선택 근거, 마이크로서비스 vs 모놀리식 판단, 컴포넌트 설계, 의존성 관계 (DB 제외) | PRD, 기술 제약 | SDD 마크다운 (아키텍처, 기술 스택, 컴포넌트 다이어그램) |
| **ui-designer** | Sonnet | IA & 와이어프레임 & UI 설계: 정보 아키텍처, 사용자 플로우 와이어프레임, 고해상도 UI 컴포넌트, 디자인 시스템 준수 | PRD, UX 리서치, 브랜드 가이드 | 와이어프레임 (Figma), UI 컴포넌트 라이브러리 |
| **frontend-engineer** | Sonnet | 프론트엔드 구현: React/Vue/Angular 컴포넌트 개발, 상태 관리, API 통합, 접근성 (WCAG) 준수, 반응형 디자인 | UI 설계, API 스펙, 백엔드 엔드포인트 | 프론트엔드 코드 (모든 컴포넌트, 라우팅, 상태 관리) |
| **backend-engineer** | Sonnet | 백엔드 API 구현: RESTful/GraphQL API 설계, 비즈니스 로직, 데이터 검증, 인증/인가, Rate limiting, 에러 처리 | PRD, SDD, DB 스키마, 보안 요구사항 | API 코드 (엔드포인트, 로직, 미들웨어) |
| **test-engineer** | Sonnet | 테스트 코드 작성: Unit 테스트 (컴포넌트/함수), Integration 테스트 (API/DB), E2E 테스트 (사용자 시나리오), 커버리지 목표 (≥80%) | 구현 코드, 테스트 계획 | 테스트 코드 (Jest/Mocha/Pytest), 커버리지 리포트 |
| **qa-engineer** | Sonnet | 코드 리뷰 & QA 검증: 코드 스타일 검토 (Linting), 성능 검토, 보안 패턴 검증, 수동 테스트 케이스, 회귀 테스트 | 구현 코드, 테스트 결과 | 코드 리뷰 피드백, QA 테스트 리포트 |
| **db-architect** | Sonnet | DB 전담 설계 & 최적화: 스키마 설계 (정규화/비정규화 판단), 인덱스 전략, 마이그레이션 스크립트, 쿼리 최적화, 백업 정책 | PRD, 데이터 요구사항, SDD | DB 스키마 (DDL), 마이그레이션 스크립트, 쿼리 최적화 가이드 |
| **incident-responder** | Sonnet | 장애 대응 4-Phase 디버깅: (1) 현상 파악 (2) 원인 분석 (3) 임시 해결 (4) 근본 원인 분석 & 영구 해결 | 에러 로그, 현상 설명 | 디버깅 리포트, 수정 코드 |

### 역할 경계

- **infra-architect는 DB를 다루지 않음** → DB 설계/최적화는 db-architect 전담
- **release-engineer, performance-engineer** → COO 소속
- **기술 실행 가능성 평가** (CPO로부터 받은 PRD의 기술 검증) → CTO plan phase에서 담당
- **성능 테스트** (부하 테스트, 벤치마크) → COO의 performance-engineer가 담당

### PDCA 풀 버전

| Phase | 참여 에이전트 | 하는 일 | WHY | 산출물 |
|-------|-------------|--------|-----|--------|
| **Plan** | CTO 본체 | PRD 기술 검증 (실행 가능성 평가, 기술 제약 식별), 기술 일정 수립, 팀 구성, 위험 요인 식별 | CPO의 PRD가 기술적으로 실현 가능한지 조기에 검증하여 개발 중 기획 변경 방지 | `cto_{feature}.plan.md` |
| **Design** | infra-architect, ui-designer, db-architect | 기술 아키텍처 설계 (SDD: 기술 스택, 마이크로서비스 결정), UI 와이어프레임 & 설계 완성, DB 스키마 설계 & 정규화 | 아키텍처는 전체 개발 기초; UI와 DB는 early 설계로 개발 중 재설계 비용 최소화 | `cto_{feature}.design.md` |
| **Do** | frontend-engineer, backend-engineer, test-engineer (병렬) | 프론트엔드 구현 (React/Vue 컴포넌트, 상태 관리), 백엔드 API 구현 (엔드포인트, 비즈니스 로직), 테스트 코드 작성 (Unit/Integration/E2E), 커버리지 ≥80% | 병렬 개발로 빠른 시간 내 구현; 테스트는 품질 보증 및 회귀 방지 | `cto_{feature}.do.md` |
| **QA** | qa-engineer, incident-responder (필요 시) | 코드 리뷰 (스타일, 성능, 보안), QA 검증 (수동 테스트, 회귀), 장애 발생 시 incident-responder 투입 (디버깅) | qa-engineer의 독립적 리뷰로 개발자의 맹점 보완; incident-responder는 Critical 버그 빠른 해결 | `cto_{feature}.qa.md` |
| **Report** | CTO 본체 | 기술 구현 종합 리포트: 설계 개요, 구현 완료도, 테스트 결과, 발견된 기술 부채, 배포 준비 상태 | 이해관계자 (CEO/CSO/COO)에게 기술 완성도와 배포 준비 상태 전달 | `cto_{feature}.report.md` |

---

## 5. CSO — 보안 & 품질 검증 총괄 (Opus 4.6)

### 역할 정의

**입력**: CTO의 구현 코드, CPO의 PRD (규제 검토), CEO의 스킬/에이전트 마크다운
**처리**: 보안 감사 → 코드 리뷰 → 의존성 검증 → 컴플라이언스 확인
**출력**: 보안 리포트, 취약점 및 권고사항, 배포 approval/denial

### 서브에이전트

| 에이전트 | 모델 | 역할 | 입력 | 출력 |
|---------|------|------|------|------|
| **security-auditor** | Sonnet | OWASP + IaC 보안 감사: OWASP Top 10 체크리스트 (Injection, XSS, CSRF, 등), Terraform/Dockerfile 보안 스캔, 네트워크 설정, 암호화 정책 | 코드, IaC 파일, 아키텍처 | 보안 감사 리포트 (Critical/High/Medium/Low) |
| **code-reviewer** | Sonnet | 독립 코드 리뷰 + API 보안: 비즈니스 로직 검토, 에러 처리, API 보안 패턴 (인증/인가, 입력 검증, Rate limiting), 레이스 조건 | 전체 코드베이스 | 코드 리뷰 의견, 보안 패턴 권고 |
| **secret-scanner** | Sonnet | 시크릿/자격증명 탐지: 하드코딩된 API 키, JWT 토큰, DB 비밀번호, .env 파일, AWS 접근 키, Private Key 검출 | 소스 코드, 환경 설정 파일 | 시크릿 탐지 리포트, 노출 위험도 |
| **dependency-analyzer** | Sonnet | 의존성 취약점 분석: CVE (Common Vulnerability Enumeration) 체크, deprecated 패키지 식별, 라이선스 호환성 검증 (GPL/MIT/Apache 등), 트랜시티브 의존성 감사 | package.json, requirements.txt, go.mod 등 | 의존성 취약점 리포트, 업그레이드 권고, 라이선스 호환성 매트릭스 |
| **plugin-validator** | Sonnet | 플러그인 배포 검증: 마크다운 구조 검증, 기능 스펙 검증, 보안 요구사항 준수, 문서 완성도 | 플러그인 마크다운, 코드 | 플러그인 검증 리포트, 배포 approval/denial |
| **skill-validator** | Sonnet | 스킬/에이전트 마크다운 검증: 마크다운 형식 검증, 입출력 스펙 명확성, 사용 예시 검증, 이해관계자 권한 확인 | 스킬/에이전트 마크다운 | 스킬 검증 리포트, 배포 approval/denial |
| **compliance-auditor** | Sonnet | GDPR + 라이선스 + 데이터 프라이버시: GDPR 준수 (개인정보 처리, 삭제권, 동의 관리), 오픈소스 라이선스 준수, PII 데이터 흐름 추적, 데이터 보관 정책 검증, SOC 2 / ISO 27001 기준 | 코드, 데이터 스키마, 정책 문서 | 컴플라이언스 리포트, PII 매핑, 라이선스 감사 |

### 역할 경계

- **code-reviewer** 확장: API 보안 패턴 (인증/인가, 입력 검증, Rate limiting, CORS) 포함
- **compliance-auditor** 확장: PII 데이터 흐름 추적, 데이터 보관 정책 검증 포함
- **IaC 보안** (Terraform, Dockerfile 등) → security-auditor가 커버 (COO 산출물 검토 시)
- **성능 감사** (성능 병목, 응답 시간) → COO의 performance-engineer가 담당

### PDCA 풀 버전

| Phase | 참여 에이전트 | 하는 일 | WHY | 산출물 |
|-------|-------------|--------|-----|--------|
| **Plan** | CSO 본체 | 검토 범위 결정 (OWASP/IaC/API/컴플라이언스 중 필수), Gate 선택 (Critical 필수 통과, High는 예외 가능), 대상 코드 식별, 검토 일정 수립 | 모든 코드를 동일하게 검토할 수 없으므로 risk-based 접근으로 효율성 확보 | `cso_{feature}.plan.md` |
| **Design** | CSO 본체 | 검토 전략 설계: 각 gate별 체크리스트 구성, tool 선택 (SonarQube/OWASP ZAP/Snyk 등), 임계값 정의, 예외 처리 규칙 | 각 gate를 체계적으로 설계하여 누락 방지 및 반복 검토 최소화 | `cso_{feature}.design.md` |
| **Do** | security-auditor, code-reviewer, secret-scanner, dependency-analyzer, plugin/skill-validator, compliance-auditor (병렬) | 모든 gate 실행: OWASP 감사 + 코드 리뷰 + 시크릿 스캔 + 의존성 분석 + 플러그인/스킬 검증 + 컴플라이언스 감시 | 다중 gate로 서로 다른 각도의 문제 탐지 (보안/품질/정합성/규제) | `cso_{feature}.do.md` |
| **QA** | CSO 본체 | 취약점 판정: Critical (배포 불가) / High (예외 가능) / Medium (권고) / Low (FYI) 분류, 통과 여부 최종 결정, CTO 수정 요청 (Critical) | CSO의 최종 판정으로 배포 가능성을 보증 | `cso_{feature}.qa.md` |
| **Report** | CSO 본체 | 보안 검토 종합 리포트: 취약점 요약 (심각도별), 주요 발견사항, 개선 권고, 컴플라이언스 상태 | 경영진 및 규제 당국에 보안 현황 보고 | `cso_{feature}.report.md` |

### CSO ↔ CTO 루프 (Critical 발견 시)

```
CSO QA: Critical 발견
  ↓
CEO 경유 CTO에 수정 요청
  ↓
CTO: 수정 후 CSO에 재검토 신청
  ↓
CSO: 전체 PDCA 재실행
  ↓
최대 3회 반복, 초과 시 CEO와 협의 (배포 연기 또는 incident-responder 투입)
```

---

## 6. CBO — 사업 총괄 (CMO + CFO 통합) (Opus 4.6)

### 역할 정의

**입력**: CEO로부터 위임 요청, CPO의 PRD, CTO의 기술 명세, 시장 데이터
**처리**: 시장 분석 → GTM 전략 → 가격/수익 모델 → 마케팅 실행 → 재무 모니터링
**출력**: GTM 계획서, 마케팅 전략, 재무 모델, 단위경제학 분석

### 서브에이전트

| 에이전트 | 모델 | 역할 | 입력 | 출력 |
|---------|------|------|------|------|
| **market-researcher** | Sonnet | 시장/경쟁사 분석: PEST (정치/경제/사회/기술), SWOT (강점/약점/기회/위협), Porter 5 Forces (경쟁 강도), TAM/SAM/SOM (시장 규모), 트렌드 분석 | 업계, 지역, 고객 세그먼트 | 시장 분석 리포트, SWOT 매트릭스, TAM 추정 |
| **customer-segmentation-analyst** | Sonnet | 고객 세그먼트 분석: RFM (Recency/Frequency/Monetary), 페르소나 정의, 세그먼트별 니즈/가치 제안, 고객 생명주기 | 고객 데이터, 거래 이력 | 고객 세그먼트 맵, 페르소나, RFM 분석 |
| **seo-analyst** | Sonnet | SEO 감사 & 콘텐츠 마케팅 전략: 온페이지 최적화 (Title/Meta/Header), 기술적 SEO (속도/모바일/구조화 데이터), 백링크 분석, 콘텐츠 칼렌더 수립 (블로그/가이드), SEO 점수 목표 ≥80 | 웹사이트, 경쟁사 사이트, 타겟 키워드 | SEO 감사 리포트, 콘텐츠 마케팅 계획, SEO 점수 |
| **copy-writer** | Sonnet | 카피라이팅 + 브랜드 전략 & 포지셔닝: 가치 제안 명문화, 랜딩페이지/이메일/광고 카피, 브랜드 포지셔닝 (타겟 고객/차별화), 브랜드 톤 & 목소리 | 페르소나, 제품 기능, 경쟁 분석 | 브랜드 포지셔닝 문서, 마케팅 카피 (5-10개) |
| **growth-analyst** | Sonnet | 그로스 전략 + GTM + 이메일 자동화: 고객 획득 경로 (Paid/Organic/Viral), 이메일 세그먼트 & 자동화 플로우 (Welcome/Re-engagement/Upsell), Growth 지표 정의, GTM 실행 계획 | 비즈니스 목표, 고객 데이터, 채널 성과 | GTM 계획서, 이메일 자동화 플로우, Growth 지표 |
| **pricing-analyst** | Sonnet | 가격 전략 & 수익 시뮬레이션: 가격 책정 방식 (Cost-plus/Value-based/Competitive), 할인/번들 전략, 수익 시뮬레이션 (고객 수/가격별), 타이어별 기능 맵핑 | 원가, 경쟁 가격, 고객 WTP (Willingness To Pay) | 가격 전략 문서, 수익 시뮬레이션 (엑셀) |
| **financial-modeler** | Sonnet | 3-Statement 모델 & DCF & 예산: P&L (Income Statement) 모델, Balance Sheet 프로젝션, Cash Flow 분석, DCF (Discounted Cash Flow) 평가, 시나리오 분석 (Base/Upside/Downside), 투자자 자료 (Pitch Deck용 재무 지표) | 수익 모델, 비용 구조, 성장 가정 | 재무 모델 (엑셀), 시나리오 분석, 투자자 자료 |
| **unit-economics-analyst** | Sonnet | 단위경제학 분석: CAC (Customer Acquisition Cost), LTV (Customer Lifetime Value), Payback Period, 코호트 분석 (고객 군집별 수명주기), 마진율, 확장성 분석 | 고객 획득 비용, 수익, 이탈율 | 단위경제학 리포트, 코호트 분석 표, CAC/LTV 벤치마크 비교 |
| **finops-analyst** | Sonnet | 클라우드 비용 분석 & 최적화: AWS/GCP/Azure 비용 분석 (컴퓨팅/저장소/네트워크), 예약 인스턴스/스팟 인스턴스 기회, 오토 스케일링 최적화, 예산 알림 설정 | 클라우드 청구서, 리소스 사용량 | 비용 분석 리포트, 최적화 권고, 예상 절감액 |
| **marketing-analytics-analyst** | Sonnet | 멀티터치 속성 & 채널 ROI & 성과 분석: 각 마케팅 채널의 기여도 분석 (First-touch/Multi-touch), ROI 계산 (지출/전환/수익), 채널별 성과 비교, 마케팅 효율성 (효율성 지수) | 마케팅 지출, 전환 데이터, 수익 | 멀티터치 속성 리포트, 채널 ROI, 마케팅 효율성 대시보드 |

### PDCA 풀 버전

| Phase | 참여 에이전트 | 하는 일 | WHY | 산출물 |
|-------|-------------|--------|-----|--------|
| **Plan** | market-researcher, customer-segmentation-analyst | 시장/경쟁사 분석 (PEST, SWOT, Porter 5F, TAM/SAM/SOM), 고객 세그먼트 정의 (RFM/페르소나), 기회/위협 식별 | 외부 시장 환경과 내부 고객 이해를 기반으로 전략적 의사결정 수립 | `cbo_{feature}.plan.md` |
| **Design** | growth-analyst, copy-writer, pricing-analyst, financial-modeler | GTM 전략 (고객 획득 경로, 이메일 자동화), 브랜드 포지셔닝 (가치 제안, 톤 & 목소리), 가격 모델 (책정 방식, 타이어), 재무 모델 설계 (P&L, DCF, 시나리오) | GTM은 시장진출의 로드맵; 가격과 재무 모델은 수익 창출의 기반 | `cbo_{feature}.design.md` |
| **Do** | seo-analyst, copy-writer, finops-analyst, unit-economics-analyst, marketing-analytics-analyst (병렬) | SEO 최적화 & 콘텐츠 작성, 마케팅 카피 작성, 클라우드 비용 분석, 단위경제학 분석 (CAC/LTV/코호트), 마케팅 성과 분석 (멀티터치 속성/ROI) | 병렬 실행으로 빠른 마케팅 배포; 데이터 기반 분석으로 ROI 최적화 | `cbo_{feature}.do.md` |
| **QA** | CBO 본체, unit-economics-analyst, marketing-analytics-analyst | SEO 점수 검증 (≥80), 단위경제학 검증 (CAC/LTV/Payback 타당성), 마케팅 성과 분석 검증 (ROI 계산 정확성), 재무 모델 정합성 확인 (수익 vs 비용) | CBO의 최종 검증으로 마케팅/재무 계획의 신뢰성 보증 | `cbo_{feature}.qa.md` |
| **Report** | CBO 본체 | 비즈니스 종합 리포트: 시장 분석 요약, GTM 전략, 예상 수익 (3년 프로젝션), 마케팅 채널별 ROI, 위험 요인, 재무 건강도 (CAC/LTV/Payback) | CEO/투자자에게 비즈니스 기회와 재무 건전성 전달 | `cbo_{feature}.report.md` |

### 범위 조절 예시 (CBO)

#### S-1: 신규 제품 출시 (풀 범위)
- **포함**: Plan (market-researcher + customer-segmentation-analyst) → Design (growth-analyst + copy-writer + pricing-analyst + financial-modeler) → Do (seo-analyst + copy-writer + finops-analyst + unit-economics-analyst + marketing-analytics-analyst) → QA (CBO + analytics) → Report
- **제외**: 없음

#### S-2: 기존 고객 세그먼트 추가 (부분 범위)
- **포함**: Plan (customer-segmentation-analyst만) → Design (copy-writer + pricing-analyst) → Do (copy-writer + marketing-analytics-analyst) → QA (analytics 검증) → Report
- **제외**: market-researcher, growth-analyst, financial-modeler, seo-analyst, finops-analyst

#### S-3: SEO 최적화만 (최소 범위)
- **포함**: Plan (없음) → Design (seo-analyst) → Do (seo-analyst) → QA (SEO 점수 ≥80 검증) → Report
- **제외**: 모든 다른 에이전트

---

## 7. COO — 운영 총괄 (축소 범위) (Opus 4.6)

### 역할 정의

**입력**: CTO의 배포 준비물, CSO의 보안 approval, 성능 요구사항
**처리**: 배포 전략 수립 → CI/CD 파이프라인 구축 → 모니터링 설정 → 배포 후 검증
**출력**: CI/CD 코드, 모니터링 설정, 성능 벤치마크 리포트, 배포 approval

### 서브에이전트

| 에이전트 | 모델 | 역할 | 입력 | 출력 |
|---------|------|------|------|------|
| **release-engineer** | Sonnet | CI/CD 파이프라인 구축 & 배포 자동화: GitHub Actions/GitLab CI/Jenkins 파이프라인, Docker 컨테이너화 (Dockerfile, docker-compose), Kubernetes manifest (YAML), 배포 전 테스트 자동화, 롤백 전략 | 소스 코드, 배포 환경 명세 | CI/CD 코드 (YAML), Docker 이미지, K8s Manifest |
| **sre-engineer** | Sonnet | 모니터링 & 알림 설정: Prometheus/Datadog/New Relic 메트릭 수집, 대시보드 설계 (CPU/Memory/Latency/Error Rate), 알림 규칙 (임계값 설정), 로깅 전략 (구조화된 로그), 헬스 체크 엔드포인트 | 애플리케이션 아키텍처, SLO 요구사항 | 모니터링 코드 (Prometheus query, Alert rule), 대시보드 설정 |
| **release-monitor** | Sonnet | 배포 후 카나리 모니터링: 배포 직후 1-2시간 모니터링, 메트릭 비교 (이전 버전 vs 신 버전), 에러율/레이턴시 증가 감지, 이상 발견 시 자동 롤백 트리거 | 배포 메트릭, 알림 규칙 | 카나리 모니터링 리포트, 롤백 결정 로그 |
| **performance-engineer** | Sonnet | 성능 벤치마크 & 부하 테스트 & 병목 탐지: JMeter/Locust로 부하 테스트 (동시 사용자 수별), 응답 시간 벤치마크 (p50/p95/p99), 메모리 누수 탐지, DB 쿼리 성능 분석, 병목 지점 식별 & 개선 권고 | 구현 코드, 성능 요구사항 | 성능 벤치마크 리포트, 부하 테스트 결과, 개선 권고 |

### PDCA 풀 버전

| Phase | 참여 에이전트 | 하는 일 | WHY | 산출물 |
|-------|-------------|--------|-----|--------|
| **Plan** | COO 본체 | 배포 전략 결정 (Blue-Green/Canary/Rolling), 환경 구성 계획 (Dev/Staging/Prod), 배포 일정, 롤백 계획, SLO (Service Level Objective) 정의 | 배포 전략에 따라 파이프라인 설계가 달라지므로 조기 수립 필수 | `coo_{feature}.plan.md` |
| **Design** | sre-engineer, release-engineer | 모니터링 & 알림 아키텍처 설계 (메트릭/로그/트레이싱), CI/CD 파이프라인 설계 (Stage별 gate 및 테스트), Docker 컨테이너 전략, K8s 리소스 (CPU/Memory request) | 모니터링과 CI/CD는 배포의 기반이므로 완벽한 설계 필수 | `coo_{feature}.design.md` |
| **Do** | release-engineer, sre-engineer, performance-engineer | CI/CD 코드 구현 (파이프라인 완성), 모니터링 설정 코드 (메트릭/알림), Docker/K8s 설정, 성능 벤치마크 실행 (부하 테스트), 성능 병목 분석 | CI/CD와 모니터링은 배포 전 완성; 성능 벤치마크로 Go/No-go 판단 | `coo_{feature}.do.md` |
| **QA** | release-monitor, performance-engineer | 배포 테스트 (Staging 환경에서 전체 배포 시뮬레이션), 카나리 모니터링 설정 검증 (알림 정상 작동), 성능 기준선 확인 (벤치마크 vs 요구사항) | 실제 배포 전에 Staging에서 모든 것을 검증하여 Prod 장애 예방 | `coo_{feature}.qa.md` |
| **Report** | COO 본체 | 운영 준비 종합 리포트: CI/CD 상태, 모니터링 준비도, 성능 벤치마크 결과, 배포 approval/denial, 예상 다운타임 | CEO/개발팀에 배포 준비 상태 전달 | `coo_{feature}.report.md` |

---

## 8. 공통 스킬 (All C-Levels)

### export-report 스킬 (산출물을 발표 자료로 내보내기)

| 항목 | 정의 |
|------|------|
| **입력** | C-Level의 PDCA 산출물 (마크다운 파일들) |
| **처리** | 마크다운 → PPTX 변환 (레이아웃 자동 설정, 차트 삽입, 브랜드 템플릿 적용) |
| **출력** | 발표 자료 (PPTX) — 임원진 회의/투자자 피칭용 |
| **사용 시점** | 각 C-Level의 report phase 완료 후, CEO가 통합 발표 자료 생성 필요 시 |
| **사용자** | CEO (통합 보고) / 각 C-Level (팀 발표) |
| **예시** | `cpo_{feature}.plan.md` + `cpo_{feature}.design.md` → PPTX (문제 정의 → 전략 → 실행 계획 슬라이드) |

---

## 9. 범위 조절 원칙 (전체)

### 기본 규칙

각 C-Level은 풀 버전 PDCA를 기본으로 하되, 시나리오의 맥락에 따라 **자율적으로 범위를 조절**한다.

### 판단 기준

1. **CEO가 위임할 때 범위 힌트를 줄 수 있음**
   - 예: "CPO는 최소 범위로 PRD 업데이트만"
   - 예: "CTO는 풀 범위 구현"

2. **각 C-Level은 plan phase에서 범위를 판단하고, 불필요한 서브에이전트는 스킵**
   - 예: 버그 픽스라면 test-engineer는 필요 없을 수 있음

3. **풀 PDCA의 phase 자체는 스킵하지 않음**
   - Plan / Design / Do / QA / Report 모두 실행 (최소 단계 형식이라도)
   - 단, phase 내 서브에이전트 수는 줄어들 수 있음

---

## 10. 범위 조절 예시 (전체 시나리오)

### 시나리오 S-1: 신규 플랫폼 피처 개발 (예: 사용자 대시보드 새로 추가)

| C-Level | 범위 | 포함 서브에이전트 | 제외 서브에이전트 |
|---------|------|-----------------|-----------------|
| **CEO** | 풀 | 모두 | 없음 |
| **CPO** | 풀 | product-discoverer, product-strategist, product-researcher, prd-writer, backlog-manager, ux-researcher, data-analyst | 없음 |
| **CTO** | 풀 | infra-architect, ui-designer, frontend-engineer, backend-engineer, test-engineer, qa-engineer, db-architect | incident-responder (필요 시만) |
| **CSO** | 풀 | security-auditor, code-reviewer, secret-scanner, dependency-analyzer, compliance-auditor | plugin-validator, skill-validator |
| **CBO** | 부분 | market-researcher, customer-segmentation-analyst, growth-analyst, copy-writer, pricing-analyst, financial-modeler, unit-economics-analyst | seo-analyst, marketing-analytics-analyst, finops-analyst |
| **COO** | 풀 | release-engineer, sre-engineer, release-monitor, performance-engineer | 없음 |

### 시나리오 S-2: 기존 기능 버그 픽스

| C-Level | 범위 | 포함 서브에이전트 | 제외 서브에이전트 |
|---------|------|-----------------|-----------------|
| **CEO** | 최소 | 없음 (CEO 본체만) | 모두 |
| **CPO** | 제외 | — | 모두 |
| **CTO** | 최소 | qa-engineer, incident-responder | infra-architect, ui-designer, frontend-engineer, backend-engineer, test-engineer, db-architect |
| **CSO** | 부분 | secret-scanner, code-reviewer | security-auditor, dependency-analyzer, compliance-auditor, plugin-validator, skill-validator |
| **CBO** | 제외 | — | 모두 |
| **COO** | 최소 | release-engineer, release-monitor | sre-engineer, performance-engineer |

### 시나리오 S-3: UX 개선 (디자인 리팬)

| C-Level | 범위 | 포함 서브에이전트 | 제외 서브에이전트 |
|---------|------|-----------------|-----------------|
| **CEO** | 부분 | 없음 (CEO 본체만 라우팅) | absorb-analyzer, skill-creator |
| **CPO** | 부분 | ux-researcher, prd-writer | product-discoverer, product-strategist, product-researcher, backlog-manager, data-analyst |
| **CTO** | 부분 | ui-designer, frontend-engineer, qa-engineer | infra-architect, backend-engineer, test-engineer, db-architect, incident-responder |
| **CSO** | 부분 | code-reviewer, secret-scanner | security-auditor, dependency-analyzer, compliance-auditor, plugin-validator, skill-validator |
| **CBO** | 최소 | copy-writer (카피 업데이트) | 나머지 모두 |
| **COO** | 최소 | release-engineer, release-monitor | sre-engineer, performance-engineer |

### 시나리오 S-4: 신규 스킬 생성

| C-Level | 범위 | 포함 서브에이전트 | 제외 서브에이전트 |
|---------|------|-----------------|-----------------|
| **CEO** | 풀 (스킬 생성 모드) | skill-creator, absorb-analyzer | 나머지 |
| **CPO** | 제외 | — | 모두 |
| **CTO** | 제외 | — | 모두 |
| **CSO** | 부분 | skill-validator | 나머지 |
| **CBO** | 제외 | — | 모두 |
| **COO** | 제외 | — | 모두 |

---

## 11. 하네스 설계 시 필수 규칙

> **중요**: 스킬 흡수/생성 시 본 문서 업데이트 필수

### 규칙 1: 에이전트/스킬 추가 시 동기화

새로운 에이전트나 스킬이 추가/수정되면 **반드시** 다음 문서들을 함께 업데이트:

- ✅ `agent-mapping-v2.md` (본 문서)
- ✅ `c-suite-roles-v2.md` (역할 정의서)
- ✅ 해당 스킬 마크다운 파일

### 규칙 2: 버전 관리

- 각 C-Level의 major change → 버전 업 (예: v1.00 → v1.10)
- 전체 매핑의 consolidation → 전체 버전 업 (예: v1.10 → v2.00)

### 규칙 3: 변경 로그 (CHANGELOG)

매핑 파일 헤더에 변경 로그 유지:

```markdown
## 변경 로그

### v1.00 (2026-04-13)
- 초판 발행: CEO/CPO/CTO/CSO/CBO/COO 풀 정의
- 모든 에이전트 모델 명시 (Opus/Sonnet)
- PDCA WHY 칼럼 추가
- 범위 조절 예시 4개 시나리오 추가
- export-report 공통 스킬 정의
- TODO 항목 모두 제거 및 완성

### v0.50 (2026-04-12)
- 초기 설계 버전
```

---

## 12. 최종 체크리스트

### 완성도 검증

- ✅ 모든 C-Level 6개 정의됨 (CEO/CPO/CTO/CSO/CBO/COO)
- ✅ 각 C-Level마다 모델 명시 (Opus 4.6)
- ✅ 모든 서브에이전트 정의됨 (입력/출력/역할 명시)
- ✅ 모든 서브에이전트 모델 명시 (Sonnet 4.6)
- ✅ PDCA 풀 버전 각 phase마다 WHY 정의됨
- ✅ 모든 산출물 명명 규칙 일관성 (예: `cpo_{feature}.plan.md`)
- ✅ 역할 경계 명확 (각 C-Level 간 책임 중복 없음)
- ✅ CSO ↔ CTO 루프 정의됨 (Critical 발견 시 프로세스)
- ✅ 범위 조절 예시 4개 시나리오 (S-1/S-2/S-3/S-4)
- ✅ 공통 스킬 `export-report` 정의됨
- ✅ TODO 항목 제거됨 (모든 미결사항 해결)
- ✅ 하네스 설계 규칙 명시됨

---

## 부록: 산출물 명명 규칙

### 패턴

```
{c_level}_{feature}.{phase}.md
```

### 예시

| C-Level | Feature | Phase | 파일명 |
|---------|---------|-------|--------|
| CEO | login_2fa | plan | `ceo_login_2fa.plan.md` |
| CPO | dashboard | design | `cpo_dashboard.design.md` |
| CTO | api_auth | do | `cto_api_auth.do.md` |
| CSO | payment | qa | `cso_payment.qa.md` |
| CBO | pricing | report | `cbo_pricing.report.md` |
| COO | deployment | plan | `coo_deployment.plan.md` |

---

## 부록: 아키텍처 관계도

```
CEO (Opus)
├── absorb-analyzer (Sonnet) — 스킬 흡수 분석
└── skill-creator (Sonnet) — 스킬 생성

CPO (Opus)
├── product-discoverer (Sonnet)
├── product-strategist (Sonnet)
├── product-researcher (Sonnet)
├── prd-writer (Sonnet)
├── backlog-manager (Sonnet)
├── ux-researcher (Sonnet)
└── data-analyst (Sonnet)

CTO (Opus)
├── infra-architect (Sonnet)
├── ui-designer (Sonnet)
├── frontend-engineer (Sonnet)
├── backend-engineer (Sonnet)
├── test-engineer (Sonnet)
├── qa-engineer (Sonnet)
├── db-architect (Sonnet)
└── incident-responder (Sonnet)

CSO (Opus)
├── security-auditor (Sonnet)
├── code-reviewer (Sonnet)
├── secret-scanner (Sonnet)
├── dependency-analyzer (Sonnet)
├── plugin-validator (Sonnet)
├── skill-validator (Sonnet)
└── compliance-auditor (Sonnet)

CBO (Opus)
├── market-researcher (Sonnet)
├── customer-segmentation-analyst (Sonnet)
├── seo-analyst (Sonnet)
├── copy-writer (Sonnet)
├── growth-analyst (Sonnet)
├── pricing-analyst (Sonnet)
├── financial-modeler (Sonnet)
├── unit-economics-analyst (Sonnet)
├── finops-analyst (Sonnet)
└── marketing-analytics-analyst (Sonnet)

COO (Opus)
├── release-engineer (Sonnet)
├── sre-engineer (Sonnet)
├── release-monitor (Sonnet)
└── performance-engineer (Sonnet)

공통 스킬
└── export-report — 모든 C-Level이 사용 가능
```

---

**작성 완료**: 2026-04-13
**상태**: 최종 완성 (v1.00)
**다음 단계**: 하네스 구현 시 이 문서를 기준으로 각 C-Level 역할 정의 및 스킬 개발 진행
