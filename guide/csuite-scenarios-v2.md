# VAIS Code 실무 시나리오 정의서

> **작성일**: 2026-04-13
> **대상 버전**: v0.50
> **목적**: 실무에서 맞닥뜨리는 상황 기반 시나리오 정의 + 각 시나리오별 C-Level 플로우의 완전한 단계별 명세
> **C-Suite 구성**: CEO, CPO, CTO, CSO, CBO, COO (6명)
> **모드**: Manual Mode (사용자 승인 필요) / Auto Mode (동일 플로우, 자동 승인)

---

## 시나리오 목록

| # | 시나리오 | 설명 |
|---|---------|------|
| S-1 | 신규 서비스 풀 개발 | 아이디어부터 런칭까지 전체 |
| S-2 | 기존 서비스에 기능 추가 | 신규 피처 개발 |
| S-3 | 기존 기능 수정/개선 | 버그 수정, UX 개선, 리팩토링 |
| S-4 | 프로덕션 장애 대응 | 긴급 이슈 해결 |
| S-5 | 성능/비용 최적화 | 느린 API, 클라우드 비용 절감 |
| S-6 | 보안 감사 & 컴플라이언스 | 정기 보안 점검, GDPR 등 |
| S-7 | 마케팅 캠페인 & GTM | 런칭 마케팅, SEO, 콘텐츠 |
| S-8 | 사업 분석 & 리포트 | 시장 분석, 경쟁사 분석, BM 설계, 투자자 보고 |
| S-9 | vais-code 내부 강화 | 스킬 생성, 스킬 흡수, 에이전트 추가 |
| S-10 | 정기 운영 | 기술부채 관리, 팀 프로세스 |

---

## 공통 원칙

1. **Full PDCA** — 모든 C-Level 위임 시 계획(Plan) → 설계(Design) → 실행(Do) → 검증(QA) 완전 실행
2. **CEO 중앙 라우팅** — 모든 위임, 핸드오프, 루프는 CEO를 경유
3. **CSO 최종 게이트** — 코드 수정이 발생한 모든 시나리오에서 CSO가 최종 검증 (QA phase)
4. **수동/자동 모드** — 동작 플로우는 동일, Manual Mode는 각 단계 완료 후 사용자 승인 필수
5. **범위 자율 조절** — 각 C-Level은 full PDCA를 기본으로 하되, 시나리오 맥락에 따라 서브에이전트 참여를 자율 판단
6. **CEO 판단 기준** — CEO가 필요한 C-Level을 라우팅할 때의 기준이 명시됨
7. **진입/완료 조건** — 각 시나리오의 시작 조건(entry condition)과 완료 조건(exit condition) 명시

---

## S-1: 신규 서비스 풀 개발

> **상황**: "온라인 서점 SaaS를 만들어줘" — 아이디어부터 런칭까지 전체 마케팅, 제품, 기술, 보안, 운영을 포함한 완전한 신규 서비스 개발

### 진입 조건 (Entry Condition)
- 사용자가 완전히 새로운 서비스 구축을 명시적으로 요청
- 서비스의 비즈니스 모델, 타겟 고객, 핵심 기능이 아직 정의되지 않음
- CEO 판단: 신규 풀 개발 = 시장 분석 + 제품 설계 + 기술 구현 + 마케팅 + 운영 구축

### 완료 조건 (Exit Condition)
- 신규 서비스가 프로덕션 환경에서 온전히 운영 가능한 상태
- 마케팅 캠페인이 준비되고 GTM 실행 계획 완료
- CSO의 최종 보안 검증 완료
- COO의 모니터링/CI-CD 구축 완료
- CEO가 최종 리뷰 및 보고 완료

### CEO 판단 기준
- 신규 서비스 풀 개발 여부: 시장 분석이 필요한가? → YES → CBO① 호출
- 마케팅 필요 여부: 론칭이 필요한가? → YES → CBO② 호출
- 운영 구축: 모든 신규 서비스 개발 후에는 필수적으로 COO 호출

---

### 단계별 플로우 (Step-by-Step Flow)

#### Phase 1: CEO Plan
**Actor**: CEO
**Input**: 사용자 요청 ("온라인 서점 SaaS를 만들어줘")
**Output**: 
  - 피처 분석 문서
  - 서비스 스코프 정의
  - C-Level 투입 계획 (CBO①, CPO, CTO, CSO, CBO②, COO)
**Action**:
  - 요청 내용 분석
  - 신규 풀 개발임을 확인
  - 다음 액터(CBO)로 위임 결정
**Next Actor**: CBO① (시장 분석)

---

#### Phase 2: CBO① Full PDCA (시장 분석 & 경쟁사 분석 & 가격 전략)
**Actor**: CBO (Chief Business Officer)
**Agents**: market-researcher, competitive-analyst, pricing-analyst, financial-modeler
**Input**: CEO의 피처 분석 + 서비스 스코프
**Output**:
  - 시장 분석 문서 (TAM/SAM/SOM, PEST, SWOT)
  - 경쟁사 분석 (Porter 5F, positioning map)
  - 가격 전략 + 수익 모델
  - 재무 예측 (5-year projection, break-even analysis)
  - CBO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: market-researcher가 시장 규모, 타겟 세그먼트 분석
  - **Design**: competitive-analyst + pricing-analyst가 경쟁 구도, 가격대 설계
  - **Do**: financial-modeler가 재무 모델 작성 (매출, COGS, 손익분기점)
  - **QA**: CBO가 모든 산출물 검증, 타당성 확인
  - **Approval Gate**: Manual Mode에서 사용자가 시장 분석 결과 승인
**Next Actor**: CPO

---

#### Phase 3: CPO Full PDCA (제품 기획 & PRD & 백로그)
**Actor**: CPO (Chief Product Officer)
**Agents**: prd-writer, backlog-manager, product-strategist
**Input**: CBO의 시장 분석 + 가격 전략
**Output**:
  - Product Requirements Document (PRD)
  - Feature 백로그 (우선순위별)
  - User Journey Map
  - 제품 로드맵 (Phase 1 MVP, Phase 2 expansion 등)
  - CPO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: 시장 분석 기반 고객 페르소나, JTBD (Jobs to Be Done) 정의
  - **Design**: prd-writer가 핵심 피처 상세 설계, acceptance criteria 작성
  - **Do**: backlog-manager가 feature list, story card, sprint 계획
  - **QA**: CPO가 PRD의 완전성 검증 (모호함 없음, 기술 구현 가능성)
  - **Approval Gate**: Manual Mode에서 사용자가 PRD 승인
**Next Actor**: CTO

---

#### Phase 4: CTO Full PDCA (기술 구현)
**Actor**: CTO (Chief Technology Officer)
**Agents**: architect, backend-engineer, frontend-engineer, database-specialist, devops-engineer, incident-responder
**Input**: CPO의 PRD + feature 백로그
**Output**:
  - 아키텍처 설계서 (system design, data models, API spec)
  - 구현된 소스 코드 (MVP)
  - Unit tests, integration tests
  - 배포 스크립트 (Docker, K8s 등)
  - CTO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: architect가 시스템 아키텍처 설계 (scalability, resilience 고려)
  - **Design**: backend-engineer + frontend-engineer + database-specialist가 모듈 설계
  - **Do**: 모든 엔지니어가 병렬로 구현 (백엔드 API, 프론트엔드 UI, DB schema)
  - **QA**: CTO가 코드 리뷰, 테스트 커버리지 > 80% 확인, 성능 벤치마크
  - **Approval Gate**: Manual Mode에서 사용자가 구현 완료 승인
**Next Actor**: CSO

---

#### Phase 5: CSO Full PDCA (보안 검증)
**Actor**: CSO (Chief Security Officer)
**Agents**: security-auditor, code-reviewer, secret-scanner, dependency-analyzer, compliance-auditor
**Input**: CTO의 구현 소스 코드 + 아키텍처 설계
**Output**:
  - 보안 감사 리포트 (OWASP Top 10, CWE 매핑)
  - 시크릿 스캔 결과 (AWS keys, API tokens 탐지)
  - 의존성 분석 (알려진 취약점 체크)
  - 컴플라이언스 검증 (GDPR, SOC2 준비도)
  - CSO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: security-auditor가 보안 감사 범위 정의 (authentication, authorization, data encryption 등)
  - **Design**: code-reviewer + secret-scanner + dependency-analyzer가 검사 기준 설정
  - **Do**: 병렬로 소스 코드 정적 분석, secret scan, 의존성 vulnerability 점검
  - **QA**: CSO가 모든 발견사항(finding) 검증, severity 분류
  - **Branch Condition**:
    - IF (critical/high severity 이슈 발견):
      - → CSO가 CTO에게 수정 요청
      - → CTO가 수정 후 재제출 (최대 3회 루프)
      - → 초과 시 CEO에게 incident-responder 호출 판단 위임
    - ELSE (low/info severity only):
      - → 통과, 다음 단계로
  - **Approval Gate**: Manual Mode에서 사용자가 보안 검증 통과 승인
**Loop Condition**: CSO ↔ CTO 루프 최대 3회
- IF (loop count > 3 AND critical 이슈 미해결):
  - → CEO에게 incident-responder 투입 여부 판단 위임
  - → 또는 서비스 런칭 지연 결정
**Next Actor**: CBO② (마케팅 실행)

---

#### Phase 6: CBO② Full PDCA (마케팅 실행)
**Actor**: CBO (Chief Business Officer)
**Agents**: seo-analyst, copy-writer, growth-analyst, marketing-analytics-analyst
**Input**: CSO의 보안 검증 완료 + CPO의 PRD
**Output**:
  - 마케팅 캠페인 계획
  - SEO 최적화 (organic search)
  - 마케팅 카피 (landing page, email sequence)
  - GTM (Go-To-Market) 실행 계획
  - Growth metrics 정의 및 초기값 캡처
  - CBO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: growth-analyst가 타겟 고객, 채널 선정 (organic, paid, viral)
  - **Design**: copy-writer가 메시징, landing page 카피, 이메일 템플릿 작성
  - **Do**: seo-analyst가 keyword research + on-page/off-page SEO 실행, marketing-analytics-analyst가 pixel/tracking 설정
  - **QA**: CBO가 캠페인 완성도 검증 (SEO score ≥ 80, conversion funnel clarity)
  - **Approval Gate**: Manual Mode에서 사용자가 마케팅 계획 승인
**Next Actor**: COO

---

#### Phase 7: COO Full PDCA (운영 구축 & 모니터링 & CI-CD)
**Actor**: COO (Chief Operations Officer)
**Agents**: devops-engineer, systems-architect, incident-responder, monitoring-specialist
**Input**: CTO의 구현 + CSO의 보안 검증 + CBO의 마케팅 계획
**Output**:
  - CI-CD 파이프라인 구축 (자동 배포)
  - Production 환경 설정 (서버, DNS, SSL 등)
  - 모니터링 대시보드 (Prometheus, Grafana, 알람 규칙)
  - Incident response 프로세스 정의
  - Runbook (장애 대응 매뉴얼)
  - COO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: systems-architect가 운영 환경 설계 (high availability, disaster recovery)
  - **Design**: devops-engineer가 CI-CD 파이프라인, 배포 전략 (canary, blue-green)
  - **Do**: 병렬로 인프라 구축, 모니터링 설정, runbook 작성
  - **QA**: COO가 배포 체크리스트 검증, incident response 시뮬레이션 테스트
  - **Approval Gate**: Manual Mode에서 사용자가 운영 구축 완료 승인
**Next Actor**: CEO (최종 리뷰)

---

#### Phase 8: CEO 최종 리뷰 & 보고 (Final Review & Report)
**Actor**: CEO
**Input**: CBO①, CPO, CTO, CSO, CBO②, COO의 모든 최종 리포트
**Output**: 신규 서비스 전체 통합 보고서 (Executive Summary 포함)
**Action**:
  - 각 C-Level의 리포트 검증 및 통합
  - 서비스 준비도 최종 확인
  - 런칭 GO/NO-GO 결정
  - 사용자에게 최종 결과 보고
**Completion**: 신규 서비스 풀 개발 시나리오 완료

---

## S-2: 기존 서비스에 기능 추가

> **상황**: "결제 페이지에 카카오페이 추가해줘" — 이미 존재하는 서비스에 신규 피처를 추가하는 경우

### 진입 조건 (Entry Condition)
- 기존 서비스가 이미 운영 중
- 새로운 피처 추가 요청 (기존 제품 범위 내)
- CEO 판단: 기존 서비스 + 피처 추가 = CPO, CTO, CSO, COO만 필요 (시장 분석 불필요)

### 완료 조건 (Exit Condition)
- 신규 피처가 개발 완료 및 테스트 통과
- CSO의 보안 검증 완료
- COO의 배포 완료
- CEO가 최종 리뷰 및 보고 완료

### CEO 판단 기준
- 기존 서비스 피처 추가 여부: PRD 업데이트 필요한가? → YES → CPO 호출
- CBO 필요 여부: 시장 분석 필요? → NO (스킵)
- 모든 기존 서비스 피처 추가는 필수: CPO → CTO → CSO → COO

---

### 단계별 플로우 (Step-by-Step Flow)

#### Phase 1: CEO Plan
**Actor**: CEO
**Input**: 사용자 요청 ("결제 페이지에 카카오페이 추가")
**Output**: 
  - 피처 분석 문서 (scope, priority, timeline)
  - C-Level 투입 계획 (CPO, CTO, CSO, COO / CBO 스킵)
**Action**:
  - 요청이 기존 서비스 범위 내인지 확인
  - CPO 호출 결정
**Next Actor**: CPO

---

#### Phase 2: CPO Full PDCA (기존 서비스 PRD 업데이트)
**Actor**: CPO
**Agents**: prd-writer, backlog-manager
**Input**: CEO의 피처 분석 + 기존 PRD
**Output**:
  - 업데이트된 PRD (카카오페이 통합 spec)
  - Feature 백로그 추가
  - CPO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: 기존 결제 시스템과 카카오페이 통합점 분석
  - **Design**: prd-writer가 kakaopay API spec, user flow 상세화
  - **Do**: backlog-manager가 task breakdown (backend, frontend, 테스트)
  - **QA**: CPO가 기존 기능과의 충돌 검증, scope creep 확인
**Next Actor**: CTO

---

#### Phase 3: CTO Full PDCA (구현)
**Actor**: CTO
**Agents**: backend-engineer, frontend-engineer, database-specialist
**Input**: CPO의 업데이트된 PRD
**Output**:
  - 카카오페이 통합 코드
  - Unit tests, integration tests
  - CTO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: 기존 결제 모듈과 카카오페이 API 통합 설계
  - **Design**: 결제 흐름 수정, 데이터 모델 (payment transaction log)
  - **Do**: backend-engineer가 kakaopay API 통합, frontend-engineer가 UI 추가
  - **QA**: CTO가 테스트 시나리오 (정상 결제, 실패 케이스, refund)
**Next Actor**: CSO

---

#### Phase 4: CSO Full PDCA (보안 검증)
**Actor**: CSO
**Agents**: security-auditor, code-reviewer, secret-scanner, dependency-analyzer
**Input**: CTO의 구현 코드
**Output**:
  - 보안 감사 리포트 (payment 민감도 높음)
  - API key/secret 관리 검증
  - CSO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: payment 시스템 보안 기준 정의 (PCI-DSS compliance)
  - **Design**: secret-scanner 규칙 설정 (kakaopay credentials 탐지)
  - **Do**: code-reviewer가 authorization logic 검증, dependency-analyzer가 라이브러리 vulnerability 점검
  - **QA**: CSO가 모든 결과 검증, payment flow 보안성 확인
  - **Branch Condition**:
    - IF (보안 이슈 발견):
      - → CSO가 CTO에게 수정 요청
      - → CTO 수정 후 재제출
    - ELSE:
      - → 통과
**Next Actor**: COO

---

#### Phase 5: COO Full PDCA (배포)
**Actor**: COO
**Agents**: devops-engineer, systems-architect, incident-responder
**Input**: CSO의 보안 검증 완료 코드
**Output**:
  - 배포 계획 (canary rollout)
  - 배포 완료 및 모니터링
  - COO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: payment 피처 배포 전략 (카나리 5%, 점진적 확대)
  - **Design**: 롤백 계획, incident response 준비
  - **Do**: devops-engineer가 배포 실행, monitoring 활성화
  - **QA**: COO가 배포 후 헬스 체크 (payment success rate, latency)
**Next Actor**: CEO (최종 리뷰)

---

#### Phase 6: CEO 최종 리뷰 & 보고
**Actor**: CEO
**Input**: CPO, CTO, CSO, COO의 최종 리포트
**Output**: 피처 추가 완료 보고서
**Completion**: 기존 서비스 피처 추가 시나리오 완료

---

## S-3: 기존 기능 수정/개선

> **상황**: "로그인 UX가 불편하다", "검색 속도가 느리다", "레거시 코드 리팩토링"
> 세 가지 수정 유형에 따라 다른 플로우를 가짐

### 진입 조건 (Entry Condition)
- 기존 서비스의 기존 기능 수정 요청
- CEO가 수정 유형(버그/UX/리팩토링) 판단

### 완료 조건 (Exit Condition)
- 수정 완료 및 테스트 통과
- CSO의 코드 리뷰 완료
- CEO가 최종 리뷰 및 보고 완료

### CEO 판단 기준
- 버그 수정: 이미 알려진 결함 → CTO (incident-responder) 호출
- UX 개선: 사용자 경험 개선 → CPO (ux-researcher) 호출
- 리팩토링: 코드 구조 개선, 기술부채 → CTO 호출
- 모든 유형: 코드 수정 후 CSO 필수 호출

---

### 단계별 플로우 (Step-by-Step Flow)

#### Branch A: 버그 수정

##### Phase 1: CEO Plan & Type Decision
**Actor**: CEO
**Input**: 사용자 요청 ("로그인에서 토큰 만료 오류 발생")
**Decision**: 이것은 버그 수정 → Branch A 선택
**Next Actor**: CTO (incident-responder 모드)

##### Phase 2: CTO Full PDCA (버그 분석 & 수정)
**Actor**: CTO
**Agents**: incident-responder, backend-engineer, database-specialist
**Input**: 버그 description
**Output**:
  - 버그 원인 분석 보고서
  - 수정된 코드
  - 테스트 케이스
  - CTO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: incident-responder가 버그 재현 시나리오 정의 (토큰 만료 시점, API 호출)
  - **Design**: 원인 분석 (4-phase debugging: logs → hypothesis → test → fix)
  - **Do**: backend-engineer가 코드 수정 (token refresh logic)
  - **QA**: CTO가 unit test 추가, regression test 실행
**Next Actor**: CSO

##### Phase 3: CSO Full PDCA (코드 리뷰)
**Actor**: CSO
**Agents**: code-reviewer, security-auditor
**Input**: CTO의 수정 코드
**Output**:
  - 코드 리뷰 보고서
  - CSO 최종 승인/반려
**PDCA Breakdown**:
  - **Plan**: 버그 수정 범위, 보안 영향도 분석
  - **Design**: code-reviewer 기준 설정 (token handling best practices)
  - **Do**: 정적 분석, 코드 품질 검증
  - **QA**: CSO가 최종 검증
**Next Actor**: CEO (최종 리뷰)

##### Phase 4: CEO 최종 리뷰 & 보고
**Completion**: 버그 수정 완료

---

#### Branch B: UX 개선

##### Phase 1: CEO Plan & Type Decision
**Actor**: CEO
**Input**: 사용자 요청 ("로그인 UX가 불편하다")
**Decision**: 이것은 UX 개선 → Branch B 선택
**Next Actor**: CPO (ux-researcher 모드)

##### Phase 2: CPO Full PDCA (UX 분석 & 개선안)
**Actor**: CPO
**Agents**: ux-researcher, product-strategist
**Input**: UX 개선 요청
**Output**:
  - UX 분석 보고서 (사용자 조사, pain point 식별)
  - 개선안 설계 (wireframe, prototype)
  - CPO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: ux-researcher가 사용자 인터뷰, A/B 테스트 계획
  - **Design**: 개선된 UI flow (단계 감소, 오류 메시지 개선)
  - **Do**: prototype 제작, user testing
  - **QA**: CPO가 conversion rate, bounce rate 개선 확인
**Next Actor**: CTO

##### Phase 3: CTO Full PDCA (UX 구현)
**Actor**: CTO
**Agents**: frontend-engineer, backend-engineer
**Input**: CPO의 UX 개선안
**Output**:
  - 구현된 UI 코드
  - E2E 테스트
  - CTO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: 개선안 구현 설계
  - **Design**: frontend 컴포넌트 수정, backend API 변경 (필요시)
  - **Do**: 코드 구현, 스타일 적용
  - **QA**: CTO가 모든 브라우저/기기에서 테스트
**Next Actor**: CSO

##### Phase 4: CSO Full PDCA (코드 리뷰)
**Actor**: CSO
**Agents**: code-reviewer
**Input**: CTO의 구현 코드
**Output**: 코드 리뷰 보고서, 승인
**PDCA Breakdown**:
  - **Plan**: 프론트엔드 코드 품질 기준 설정
  - **Design**: security review (XSS, CSRF 검증)
  - **Do**: 정적 분석
  - **QA**: CSO 최종 검증
**Next Actor**: CEO (최종 리뷰)

##### Phase 5: CEO 최종 리뷰 & 보고
**Completion**: UX 개선 완료

---

#### Branch C: 리팩토링

##### Phase 1: CEO Plan & Type Decision
**Actor**: CEO
**Input**: 사용자 요청 ("인증 모듈 레거시 코드 리팩토링")
**Decision**: 이것은 리팩토링 → Branch C 선택
**Next Actor**: CTO

##### Phase 2: CTO Full PDCA (리팩토링)
**Actor**: CTO
**Agents**: backend-engineer, architect, database-specialist
**Input**: 리팩토링 대상 모듈 정보
**Output**:
  - 리팩토링 계획 (기술부채 분류, priority)
  - 리팩토링된 코드
  - 회귀 테스트 결과
  - CTO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: architect가 코드 품질 분석 (cyclomatic complexity, duplication)
  - **Design**: 새로운 구조 설계 (design patterns, modularity)
  - **Do**: backend-engineer가 점진적 리팩토링 (한 번에 하나의 함수)
  - **QA**: CTO가 모든 단위 테스트 통과 확인, 기능 동치성 증명
**Next Actor**: CSO

##### Phase 3: CSO Full PDCA (코드 리뷰)
**Actor**: CSO
**Agents**: code-reviewer, security-auditor
**Input**: CTO의 리팩토링 코드
**Output**: 코드 리뷰 보고서, 승인
**PDCA Breakdown**:
  - **Plan**: 리팩토링 코드의 보안성 및 품질 기준
  - **Design**: 리뷰 포인트 설정 (성능 저하, 새로운 버그)
  - **Do**: 정적 분석, 성능 비교
  - **QA**: CSO 최종 검증
**Next Actor**: CEO (최종 리뷰)

##### Phase 4: CEO 최종 리뷰 & 보고
**Completion**: 리팩토링 완료

---

## S-4: 프로덕션 장애 대응

> **상황**: "프로덕션에서 500 에러 급증!", "DB 커넥션 풀 고갈" — 긴급 상황에서의 빠른 대응

### 진입 조건 (Entry Condition)
- 프로덕션 환경에서 서비스 장애 발생
- 사용자 영향도가 HIGH (수천 명 이상 영향)
- 즉각적인 대응 필요

### 완료 조건 (Exit Condition)
- 프로덕션 장애 해결 (서비스 정상화)
- CSO의 보안 검증 완료
- COO의 배포 완료
- CEO 최종 리뷰 및 포스트모템 완료

### CEO 판단 기준
- 장애 심각도: Critical (p1) → 즉시 CTO 호출
- 모든 장애 대응은 full PDCA 실행 (계획 비용 미미하기 때문)
- CSO 검증 필수 (수정 코드의 보안성)
- COO 배포 필수 (긴급 배포 관리)

---

### 단계별 플로우 (Step-by-Step Flow)

#### Phase 1: CEO Plan (긴급 위임)
**Actor**: CEO
**Input**: 장애 알림 (예: "500 error rate 95%")
**Output**: 
  - 긴급 위임 결정
  - CTO 호출
**Action**:
  - 장애의 심각도 확인 (p1 = Critical)
  - CTO에게 즉시 위임
**Next Actor**: CTO (incident-responder 전방위 투입)

---

#### Phase 2: CTO Full PDCA (장애 분석 & 수정)
**Actor**: CTO
**Agents**: incident-responder (primary), backend-engineer, database-specialist, devops-engineer
**Input**: 장애 description (에러 메시지, 시작 시간, 영향도)
**Output**:
  - 장애 원인 분석 보고서
  - 수정된 코드 또는 인프라 설정
  - Hotfix 구현
  - CTO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: incident-responder가 4-phase debugging 실행
    - Phase 1: Observe (로그, 메트릭 수집 — 마지막 배포 이후 변화)
    - Phase 2: Hypothesis (원인 추론 — DB 연결, API rate limit, 메모리 누수 등)
    - Phase 3: Test (가설 검증 — 부분적 롤백, 설정 변경 테스트)
    - Phase 4: Fix (근본 원인 해결)
  - **Design**: 원인별 수정 방안 설계 (코드 변경 vs 설정 변경 vs 용량 증설)
  - **Do**: 수정 구현, hotfix 준비 (최소 범위, 빠른 배포)
  - **QA**: CTO가 테스트 환경에서 재현 및 수정 검증
  - **Exit Condition**: 장애 재현 불가 + 모니터링 정상화
**Next Actor**: CSO

---

#### Phase 3: CSO Full PDCA (보안 검증)
**Actor**: CSO
**Agents**: code-reviewer, security-auditor
**Input**: CTO의 hotfix 코드
**Output**:
  - 보안 검증 보고서
  - CSO 승인/반려
**PDCA Breakdown**:
  - **Plan**: hotfix의 보안 영향도 분석
  - **Design**: 긴급 배포 전 보안 체크리스트 (secret 노출 여부, new vulnerability 도입 여부)
  - **Do**: secret-scanner, code-reviewer 빠른 검증
  - **QA**: CSO 최종 승인
  - **Time Constraint**: 가능한 한 빠르게 (이상적으로 < 30분)
**Next Actor**: COO (배포)

---

#### Phase 4: COO Full PDCA (긴급 배포)
**Actor**: COO
**Agents**: devops-engineer, systems-architect, incident-responder
**Input**: CSO의 보안 검증 완료 코드
**Output**:
  - 배포 완료
  - 배포 후 모니터링 결과
  - COO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: 긴급 배포 전략 (canary rollout 또는 blue-green, 빠른 롤백 준비)
  - **Design**: 배포 순서, 롤백 절차 확정
  - **Do**: 배포 실행, 실시간 모니터링
  - **QA**: 
    - 배포 후 에러율 감소 확인 (< 1%)
    - 응답시간 정상화 확인
    - 데이터 무결성 확인
  - **Branch Condition**:
    - IF (배포 후에도 장애 지속):
      - → 즉시 롤백
      - → CTO에게 재분석 위임
    - ELSE:
      - → 통과, 모니터링 강화
**Next Actor**: CEO (최종 리뷰 & 포스트모템)

---

#### Phase 5: CEO 최종 리뷰 & 포스트모템 (Post-Incident Review)
**Actor**: CEO
**Input**: CTO, CSO, COO의 최종 리포트
**Output**: 
  - 장애 대응 완료 보고서
  - 포스트모템 (근본 원인, 예방 조치)
**Action**:
  - 각 C-Level의 대응 평가
  - 근본 원인 분석 (why 5회 적용)
  - 예방 조치 (모니터링 개선, 테스트 강화)
  - 사용자 소통 (공식 입장 발표)
**Completion**: 프로덕션 장애 대응 완료

---

## S-5: 성능/비용 최적화

> **상황**: "AWS 비용 월 $5k → $2k로 줄이고 싶다", "API 응답시간 3초 → 500ms로 개선"
> 비용 최적화와 성능 최적화는 다른 플로우를 가짐

### 진입 조건 (Entry Condition)
- CEO가 최적화 요청 (비용 또는 성능)
- CEO가 최적화 유형 판단

### 완료 조건 (Exit Condition)
- 최적화 목표 달성 (비용 감소 또는 성능 개선)
- CSO의 코드 리뷰 완료
- 측정 가능한 메트릭으로 효과 입증
- CEO 최종 리뷰 완료

### CEO 판단 기준
- 비용 최적화: CBO①(진단) → CTO(구현) → CSO(리뷰) → CBO②(효과 검증)
- 성능 최적화: CTO(분석 & 구현) → CSO(리뷰)

---

### 단계별 플로우 (Step-by-Step Flow)

#### Branch A: 비용 최적화

##### Phase 1: CEO Plan
**Actor**: CEO
**Input**: 사용자 요청 ("AWS 비용 줄여줘")
**Decision**: 비용 최적화 → Branch A 선택
**Next Actor**: CBO①

##### Phase 2: CBO① Full PDCA (비용 진단 & 절감안)
**Actor**: CBO
**Agents**: finops-analyst, cost-accountant
**Input**: 현재 인프라 및 비용 데이터
**Output**:
  - 비용 분석 보고서 (서비스별, 리소스별 분해)
  - 절감 기회 식별 (reserved instances, spot instances, 아키텍처 최적화)
  - 절감안 (예상 절감액, 구현 effort)
  - CBO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: finops-analyst가 지난 6개월 AWS bill 분석 (EC2, RDS, S3, data transfer 등)
  - **Design**: 절감 기회 우선순위 매기기 (큰 비용 감소 vs 낮은 위험)
  - **Do**: 상세 절감 계획 수립 (예: reserved instances 1년 약정 → 연간 $30k 절감)
  - **QA**: CBO가 재무 임팩트 검증 (절감액, 구현 비용, payback period)
**Next Actor**: CTO

##### Phase 3: CTO Full PDCA (아키텍처 리팩터 & 구현)
**Actor**: CTO
**Agents**: architect, backend-engineer, database-specialist, devops-engineer
**Input**: CBO의 절감안
**Output**:
  - 아키텍처 최적화 설계서
  - 구현된 코드 (리소스 정리, 쿼리 최적화 등)
  - CTO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: architect가 절감안을 기술 구현으로 변환 (예: auto-scaling 정책 강화, unused resources 삭제)
  - **Design**: 
    - 모듈별 최적화 (database indexes, caching layer, CDN 활용)
    - 배포 전략 (점진적 적용, 롤백 계획)
  - **Do**: 
    - database-specialist가 slow query optimization
    - devops-engineer가 reserved instances 구매, auto-scaling 설정
  - **QA**: CTO가 비용 절감 시뮬레이션, 성능 저하 없음 확인
**Next Actor**: CSO

##### Phase 4: CSO Full PDCA (코드 리뷰)
**Actor**: CSO
**Agents**: code-reviewer, security-auditor
**Input**: CTO의 구현 코드
**Output**: 코드 리뷰 보고서, 승인
**PDCA Breakdown**:
  - **Plan**: 최적화 코드의 보안 영향도 분석
  - **Design**: 새로운 configuration의 보안성 검증 (공개 리소스 여부)
  - **Do**: 정적 분석, 설정 감시
  - **QA**: CSO 최종 승인
**Next Actor**: CBO②

##### Phase 5: CBO② Full PDCA (효과 검증)
**Actor**: CBO
**Agents**: finops-analyst, unit-economics-analyst
**Input**: CTO의 최적화 구현 + 배포 후 1주일 AWS bill
**Output**:
  - 비용 절감 효과 검증 보고서 (실제 절감액 vs 예상 절감액)
  - 향후 최적화 권고사항
  - CBO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: finops-analyst가 배포 후 1-2주 데이터 수집 계획
  - **Design**: 효과 측정 기준 설정 (예: monthly cost 기준, 계절성 제외)
  - **Do**: AWS bill 상세 분석, 절감액 계산
  - **QA**: 
    - CBO가 실제 절감액이 예상의 80% 이상 달성했는지 확인
    - unit-economics-analyst가 단위 경제에 미친 영향 분석
**Next Actor**: CEO (최종 리뷰)

##### Phase 6: CEO 최종 리뷰 & 보고
**Completion**: 비용 최적화 완료

---

#### Branch B: 성능 최적화

##### Phase 1: CEO Plan
**Actor**: CEO
**Input**: 사용자 요청 ("API 응답 시간 개선해줘")
**Decision**: 성능 최적화 → Branch B 선택
**Next Actor**: CTO

##### Phase 2: CTO Full PDCA (성능 분석 & 최적화)
**Actor**: CTO
**Agents**: architect, backend-engineer, frontend-engineer, database-specialist
**Input**: 성능 이슈 description (느린 API endpoint, high latency)
**Output**:
  - 성능 분석 보고서 (bottleneck 식별, flame graph)
  - 최적화된 코드
  - 성능 벤치마크 (before/after)
  - CTO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: architect + backend-engineer가 성능 프로파일링
    - 데이터베이스 쿼리 분석 (slow query log)
    - 애플리케이션 레벨 프로파일링 (flame graph, CPU/memory usage)
    - 네트워크 레이턴시 분석
  - **Design**: 최적화 계획 수립 (예: N+1 쿼리 해결, 캐싱 추가, 알고리즘 개선)
  - **Do**: 
    - database-specialist가 인덱스 추가/최적화
    - backend-engineer가 쿼리 리팩토링, 캐싱 로직 추가 (Redis)
    - frontend-engineer가 번들 크기 감소, lazy loading (해당시)
  - **QA**: 
    - CTO가 부하 테스트 (k6, Apache JMeter로 동시성 테스트)
    - 응답 시간 개선 검증 (p99 latency < 500ms)
    - 메모리/CPU 사용량 확인 (새로운 병목 없음)
**Next Actor**: CSO

##### Phase 3: CSO Full PDCA (코드 리뷰)
**Actor**: CSO
**Agents**: code-reviewer
**Input**: CTO의 최적화 코드
**Output**: 코드 리뷰 보고서, 승인
**PDCA Breakdown**:
  - **Plan**: 최적화 코드의 부작용 분석 (메모리 누수, race condition)
  - **Design**: 리뷰 체크리스트
  - **Do**: 정적 분석, 캐시 일관성 검증
  - **QA**: CSO 최종 승인
**Next Actor**: CEO (최종 리뷰)

##### Phase 4: CEO 최종 리뷰 & 보고
**Completion**: 성능 최적화 완료

---

## S-6: 보안 감사 & 컴플라이언스

> **상황**: "정기 보안 점검 해줘", "GDPR 준수 확인", "SOC 2 준비"

### 진입 조건 (Entry Condition)
- 정기 보안 감사 (분기별 또는 반기별)
- 컴플라이언스 감사 요청
- CEO가 감사 범위 정의

### 완료 조건 (Exit Condition)
- 보안 감사 완료 및 리포트 작성
- 발견 사항 분류 및 수정 계획 수립
- Critical/High 이슈는 최대 3회 루프로 해결
- 초과 시 incident-responder 투입 또는 수정 연기 결정
- CEO 최종 리뷰 및 보고 완료

### CEO 판단 기준
- 감사 범위: 전사(전체 코드) 또는 부분(특정 모듈)
- CSO가 주도, CTO가 보조 (이슈 수정)
- CSO ↔ CTO 루프 최대 3회

---

### 단계별 플로우 (Step-by-Step Flow)

#### Phase 1: CEO Plan (감사 범위 결정)
**Actor**: CEO
**Input**: 감사 요청 또는 정기 감사 트리거
**Output**: 
  - 감사 범위 정의 (전사, 모듈, framework 등)
  - CSO 호출
**Next Actor**: CSO

---

#### Phase 2: CSO Full PDCA (보안 감사 & 컴플라이언스 검증)
**Actor**: CSO
**Agents**: security-auditor, code-reviewer, secret-scanner, dependency-analyzer, compliance-auditor, plugin/skill-validator
**Input**: 감사 범위 정의
**Output**:
  - 보안 감사 리포트 (OWASP Top 10, CWE, CVSS scores)
  - 시크릿 스캔 결과
  - 의존성 vulnerability 리스트
  - 컴플라이언스 검증 결과 (GDPR checklist, SOC2 준비도)
  - 발견 사항 classification (Critical, High, Medium, Low, Info)
  - CSO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: security-auditor가 감사 framework 선정 (OWASP, NIST, CIS Benchmarks)
  - **Design**: 감사 체크리스트 준비
    - authentication/authorization
    - data encryption (at rest, in transit)
    - API security (rate limiting, input validation)
    - secrets management
    - dependency vulnerability
    - compliance checklist (GDPR, SOC2, PCI-DSS)
  - **Do**: 병렬 실행
    - code-reviewer: 정적 코드 분석 (OWASP Top 10)
    - secret-scanner: 민감 정보 탐지 (AWS keys, DB passwords, API tokens)
    - dependency-analyzer: 라이브러리 vulnerability 검사 (CVE database)
    - compliance-auditor: 정책/프로세스 준수 확인 (data retention, access logs)
    - plugin/skill-validator: 외부 스킬/플러그인 보안성 검증
  - **QA**: CSO가 모든 발견사항 종합, severity 분류
**Output from QA**: 발견사항 리스트 (예:)
  - Critical: Hardcoded DB password in source code
  - High: Missing HTTPS on customer data API
  - Medium: SQL injection vulnerability in search
  - Low: Missing security headers
  - Info: Outdated dependency (no active vulnerability)

---

#### Phase 3: CSO ↔ CTO 루프 (Issue Remediation Loop)

**Loop Initialization**:
- loop_count = 0
- max_loops = 3
- unresolved_critical = true

##### Loop Iteration (반복)

**Condition Check**:
```
IF (critical_or_high_issues_found AND loop_count < max_loops):
  → CTO에게 수정 위임
ELSE IF (loop_count >= max_loops AND critical_issues_unresolved):
  → CEO에게 incident-responder 투입 또는 수정 연기 결정 위임
ELSE IF (only_low_or_info_issues):
  → Phase 4 (CEO 리뷰)로 진행
```

##### Phase 3a: CTO Full PDCA (Issue Remediation)
**Actor**: CTO
**Agents**: incident-responder, backend-engineer, security-specialist
**Input**: CSO의 Critical/High 이슈 리스트
**Output**:
  - 수정된 코드
  - 테스트 케이스
  - CTO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: 이슈별 수정 계획 (severity, complexity 기반)
  - **Design**: 수정 방안 설계
  - **Do**: 코드 수정 구현
  - **QA**: CTO가 수정 검증 (unit test, 통합 테스트)
**Next Actor**: CSO (재검토)

##### Phase 3b: CSO Full PDCA (Issue Re-verification)
**Actor**: CSO
**Agents**: code-reviewer, security-auditor
**Input**: CTO의 수정 코드
**Output**: 이슈 해결 검증 보고서
**PDCA Breakdown**:
  - **Plan**: 수정된 코드 재검증 범위 정의
  - **Design**: 검증 체크리스트
  - **Do**: 정적 분석, 수동 리뷰
  - **QA**: CSO가 이슈 해결 여부 확인
**Output from QA**: 
```
FOR EACH issue:
  IF (resolved):
    → Issue status = CLOSED
  ELSE IF (partially resolved):
    → Issue status = IN PROGRESS, feedback 제공
  ELSE:
    → Issue status = UNRESOLVED
```

**Loop Count Update**:
```
loop_count += 1
```

**Next Step**:
```
IF (all critical_high_issues resolved OR loop_count >= max_loops):
  → Phase 4로 진행
ELSE:
  → Phase 3a로 돌아감 (다음 반복)
```

---

#### Phase 4: CEO 최종 리뷰 & 보고
**Actor**: CEO
**Input**: CSO의 최종 감사 리포트 + 루프 결과
**Output**: 보안 감사 완료 보고서
**Action**:
  - CSO ↔ CTO 루프 결과 검토
  - 미해결 이슈에 대한 결정:
    - remediation 연기 (타이밍 조정)
    - risk acceptance (경영진 의사결정)
    - incident-responder 추가 투입
  - 컴플라이언스 상태 최종 판정
  - 사용자에게 감사 결과 보고
**Completion**: 보안 감사 & 컴플라이언스 완료

---

## S-7: 마케팅 캠페인 & GTM

> **상황**: "런칭 이벤트 마케팅 해줘", "SEO 점수 올려줘", "랜딩 페이지 만들어줘"

### 진입 조건 (Entry Condition)
- 마케팅 캠페인 또는 GTM 요청
- CEO가 마케팅 유형 판단 (제품 마케팅, GTM, SEO 등)

### 완료 조건 (Exit Condition)
- 마케팅 캠페인 계획 및 실행 완료
- Core Web Vitals 이슈가 없거나 해결됨
- 마케팅 메트릭 (SEO score ≥ 80, conversion funnel clarity 확인)
- CEO 최종 리뷰 및 보고 완료

### CEO 판단 기준
- 모든 마케팅 요청: CPO (ICP, JTBD 정의) → CBO (마케팅 실행)
- Core Web Vitals 문제 발견 시: CTO 호출 (프론트엔드 최적화)

---

### 단계별 플로우 (Step-by-Step Flow)

#### Phase 1: CEO Plan (마케팅 유형 판단)
**Actor**: CEO
**Input**: 마케팅 요청 ("런칭 마케팅 해줘")
**Output**: 
  - 마케팅 유형 확인
  - CPO 호출
**Next Actor**: CPO

---

#### Phase 2: CPO Full PDCA (ICP & JTBD 정의)
**Actor**: CPO
**Agents**: product-strategist, ux-researcher
**Input**: 마케팅 요청
**Output**:
  - ICP (Ideal Customer Profile) 정의
  - JTBD (Jobs to Be Done) 매핑
  - 타깃 고객 세그먼트
  - CPO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: product-strategist가 고객 조사 계획 (인터뷰, 설문)
  - **Design**: ICP 프레임워크 (회사 규모, 산업, 예산 등)
  - **Do**: ux-researcher가 타깃 고객 인터뷰, JTBD 작성
  - **QA**: CPO가 세그먼트 타당성 검증
**Next Actor**: CBO

---

#### Phase 3: CBO Full PDCA (마케팅 전략 & 실행)
**Actor**: CBO
**Agents**: market-researcher, growth-analyst, copy-writer, seo-analyst, marketing-analytics-analyst
**Input**: CPO의 ICP/JTBD
**Output**:
  - 마케팅 캠페인 계획
  - SEO 최적화 (keywords, on-page, off-page)
  - 마케팅 카피 (landing page, email, ads)
  - GTM 실행 계획
  - Growth metrics 초기값
  - CBO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: market-researcher가 채널 선정 (organic, paid, viral)
  - **Design**: 
    - growth-analyst가 전환 funnel 설계
    - copy-writer가 메시징, creative brief
    - seo-analyst가 keyword research
  - **Do**: 병렬 실행
    - seo-analyst: on-page optimization (meta tags, content), off-page (backlinks)
    - copy-writer: landing page copy, email sequence
    - marketing-analytics-analyst: tracking 설정 (UTM, pixel, analytics)
  - **QA**: CBO가 QA
    - SEO score ≥ 80 확인 (Lighthouse, SEMrush)
    - Conversion funnel clarity (고객 여정이 명확한가)
    - Message-market fit (메시징이 타깃 고객 페인과 일치하는가)

**Branch Condition**:
```
IF (Core Web Vitals issues found):
  → CTO 호출 (프론트엔드 최적화)
ELSE:
  → CEO 리뷰로 진행
```

---

#### Phase 4: CTO Full PDCA (Core Web Vitals 최적화, 조건부)
**Actor**: CTO (CWV 이슈 발견 시에만)
**Agents**: frontend-engineer, architect
**Input**: CBO가 발견한 CWV 이슈 (LCP > 2.5s, FID > 100ms, CLS > 0.1)
**Output**:
  - 최적화된 코드
  - CWV 개선 결과
  - CTO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: 성능 프로파일링 (Lighthouse, Chrome DevTools)
  - **Design**: 최적화 계획 (이미지 최적화, 번들 분할, 캐싱)
  - **Do**: frontend-engineer가 코드 최적화 구현
  - **QA**: CTO가 CWV 개선 검증 (LCP < 2.5s, FID < 100ms, CLS < 0.1)
**Next Actor**: CSO (코드 리뷰, 조건부)

---

#### Phase 5: CSO Full PDCA (코드 리뷰, 조건부)
**Actor**: CSO (CWV 최적화 시에만)
**Agents**: code-reviewer
**Input**: CTO의 최적화 코드
**Output**: 코드 리뷰 보고서, 승인
**Next Actor**: CBO (재검증)

---

#### Phase 6: CBO 재검증 (CWV 최적화 후)
**Actor**: CBO
**Input**: CTO/CSO의 최적화 완료
**Output**: CWV 최종 검증, GTM 실행 준비 완료
**Next Actor**: CEO (최종 리뷰)

---

#### Phase 7: CEO 최종 리뷰 & 보고
**Actor**: CEO
**Input**: CPO, CBO, (선택적) CTO, (선택적) CSO의 리포트
**Output**: 마케팅 캠페인 완료 보고서
**Completion**: 마케팅 캠페인 & GTM 완료

---

## S-8: 사업 분석 & 리포트

> **상황**: "시장 분석해줘", "경쟁사 분석 리포트", "BM 설계해줘", "투자자 보고서"

### 진입 조건 (Entry Condition)
- 사업 분석 또는 리포트 요청
- CEO가 분석 유형 판단 (시장/경쟁사, BM 설계, 투자자 보고)

### 완료 조건 (Exit Condition)
- 분석 또는 리포트 완성
- CEO 최종 리뷰 및 보고

### CEO 판단 기준
- 시장/경쟁사 분석: CBO 단독 (market-researcher)
- BM 설계: CBO (재무 모델링) + CPO (제품 전략)
- 투자자 보고: CBO (financial-modeler, unit-economics-analyst)

---

### 단계별 플로우 (Step-by-Step Flow)

#### Branch A: 시장/경쟁사 분석

##### Phase 1: CEO Plan
**Actor**: CEO
**Input**: 사용자 요청 ("시장 분석해줘")
**Decision**: 시장/경쟁사 분석 → Branch A 선택
**Next Actor**: CBO

##### Phase 2: CBO Full PDCA (시장 분석)
**Actor**: CBO
**Agents**: market-researcher, competitive-analyst
**Input**: 분석 대상 시장 또는 경쟁사 정보
**Output**:
  - 시장 분석 리포트 (TAM/SAM/SOM, PEST, SWOT)
  - 경쟁사 분석 (Porter 5F, positioning map, benchmarking)
  - CBO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: market-researcher가 분석 범위 정의 (지역, 산업, 시간 기간)
  - **Design**: 분석 프레임워크 (TAM 추정 모델, SWOT 기준)
  - **Do**: 
    - market-researcher: 시장 규모, 성장률, 트렌드 분석
    - competitive-analyst: 경쟁사 벤치마킹, 포지셔닝
  - **QA**: CBO가 데이터 타당성 검증 (출처, 최신성)
**Next Actor**: CEO (최종 리뷰)

---

#### Branch B: BM 설계

##### Phase 1: CEO Plan
**Actor**: CEO
**Input**: 사용자 요청 ("비즈니스 모델 설계해줘")
**Decision**: BM 설계 → Branch B 선택
**Next Actor**: CBO

##### Phase 2: CBO Full PDCA (재무 모델 & BM 설계)
**Actor**: CBO
**Agents**: financial-modeler, pricing-analyst, unit-economics-analyst
**Input**: BM 대상 서비스 또는 사업 아이디어
**Output**:
  - BM 캔버스 (value proposition, revenue streams, cost structure)
  - 재무 모델 (3-statement: P&L, balance sheet, cash flow)
  - 단위 경제 분석 (unit economics, CAC, LTV)
  - pricing strategy
  - CBO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: financial-modeler가 BM 요소 식별 (customer segments, revenue model)
  - **Design**: 
    - 재무 모델 구조 (고정비, 변동비, 매출 시나리오)
    - unit-economics-analyst가 단위 경제 프레임워크
  - **Do**: 
    - financial-modeler: 5-year projection, break-even analysis, DCF valuation
    - pricing-analyst: 가격대 설정 (competitive, value-based, cost-plus)
  - **QA**: CBO가 모든 가정과 계산 검증
**Next Actor**: CPO

##### Phase 3: CPO Full PDCA (제품 전략 검증)
**Actor**: CPO
**Agents**: product-strategist
**Input**: CBO의 BM 및 재무 모델
**Output**:
  - BM과 제품 전략의 정렬성 검증
  - CPO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: BM의 가정이 제품 로드맵에 반영되는가 검증
  - **Design**: 제품 전략 조정 (필요시)
  - **Do**: 데이터 검증
  - **QA**: CPO 최종 검증
**Next Actor**: CEO (최종 리뷰)

---

#### Branch C: 투자자 보고

##### Phase 1: CEO Plan
**Actor**: CEO
**Input**: 사용자 요청 ("투자자 보고서 만들어줘")
**Decision**: 투자자 보고 → Branch C 선택
**Next Actor**: CBO

##### Phase 2: CBO Full PDCA (투자자 보고서)
**Actor**: CBO
**Agents**: financial-modeler, unit-economics-analyst, market-researcher
**Input**: 현재 회사 성과, 사업 계획
**Output**:
  - 투자자 보고서 (deck, 텍스트)
  - 3-statement (P&L, balance sheet, cash flow)
  - DCF valuation
  - 단위 경제 분석 (CAC, LTV, payback period)
  - CBO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: financial-modeler가 보고서 범위 정의 (기간, metrics)
  - **Design**: 
    - story telling (회사의 성장 이야기)
    - financial model 구조 (현재 + projection)
  - **Do**: 
    - financial-modeler: 3-statement, DCF modeling
    - unit-economics-analyst: CAC, LTV, payback period, magic number 계산
    - market-researcher: TAM, market opportunity 제시
  - **QA**: CBO가 모든 metrics 일관성 검증 (revenue 증가 가정이 CAC/LTV와 일치하는가)
**Next Actor**: CEO (최종 리뷰)

---

#### Phase 4: CEO 최종 리뷰 & 보고 (모든 Branch)
**Actor**: CEO
**Input**: 분석/리포트 완료물
**Output**: 사업 분석 최종 보고서
**Completion**: 사업 분석 & 리포트 완료

---

## S-9: vais-code 내부 강화

> **상황**: "새 스킬 만들어줘", "외부 스킬 흡수해줘", "에이전트 추가해줘"
> vais-code 자체를 강화하는 시나리오 — CEO + CSO만 참여

### 진입 조건 (Entry Condition)
- vais-code 자체의 기능 확장 요청 (스킬, 에이전트 추가)
- CEO가 작업 유형 판단 (스킬 생성, 스킬 흡수, 에이전트 추가)

### 완료 조건 (Exit Condition)
- 스킬/에이전트가 완성되고 테스트됨
- CSO의 코드 리뷰 완료
- 매핑 문서 업데이트 완료
- CEO 최종 리뷰 및 보고

### CEO 판단 기준
- 스킬 생성, 스킬 흡수, 에이전트 추가 모두 동일 플로우: CEO full PDCA → CSO 코드 리뷰

---

### 단계별 플로우 (Step-by-Step Flow)

#### Phase 1: CEO Full PDCA (스킬 생성/에이전트 추가)

##### Phase 1a: Plan
**Actor**: CEO
**Input**: 사용자 요청 (예: "고객 분석 스킬 만들어줘")
**Output**: 
  - 스킬 정의서 (목적, 입출력, 서브에이전트)
  - 구현 계획
**Action**: 
  - 스킬 이름, 목적 명확화
  - vais-code에 추가될 위치 결정

##### Phase 1b: Design
**Actor**: CEO
**Agents**: skill-creator (for design phase)
**Output**: 
  - 스킬 설계서 (interface, expected behavior, edge cases)
  - 에이전트 매핑
**Action**:
  - skill-creator가 스킬의 function signature, 예상 입출력 설계

##### Phase 1c: Do
**Actor**: CEO
**Agents**: skill-creator (for do phase)
**Input**: 스킬 설계서
**Output**: 
  - 구현된 스킬 (Python, JSON 등)
  - 통합 테스트
**Action**:
  - skill-creator가 스킬 구현 완성
  - 로컬 테스트 통과

##### Phase 1d: QA
**Actor**: CEO
**Input**: 구현된 스킬
**Output**: 
  - QA 테스트 결과 (유닛 테스트, E2E 테스트)
  - 피드백
**Action**:
  - CEO가 스킬이 요구사항을 만족하는지 검증
  - 엣지 케이스 테스트

---

#### Phase 2: CSO Full PDCA (코드 리뷰)
**Actor**: CSO
**Agents**: code-reviewer, security-auditor
**Input**: CEO가 완성한 스킬/에이전트 코드
**Output**:
  - 코드 리뷰 보고서
  - CSO 승인/피드백
**PDCA Breakdown**:
  - **Plan**: 스킬 코드의 보안 영향도 분석 (외부 API 호출? 로컬 파일 접근?)
  - **Design**: 리뷰 기준 설정 (보안, 성능, 에러 처리)
  - **Do**: 정적 분석, 보안 검토
  - **QA**: CSO 최종 승인
**Next Actor**: Phase 3

---

#### Phase 3: 매핑 문서 업데이트 (필수)
**Actor**: CEO
**Input**: CSO 승인
**Output**: 
  - 스킬/에이전트 매핑 문서 업데이트 (harness에서 강제)
  - README, documentation 업데이트
**Action**:
  - 새 스킬이 어느 C-Level(들)에 할당되는가 명시
  - 어느 시나리오에서 사용되는가 명시
  - 예제, 사용법 문서화

---

#### Phase 4: CEO 최종 리뷰 & 보고
**Actor**: CEO
**Input**: 모든 완성물 (스킬, 코드 리뷰, 매핑 문서)
**Output**: vais-code 강화 완료 보고서
**Completion**: vais-code 내부 강화 완료

---

#### Branch: 스킬 흡수 (Absorb External Skill)

##### Phase 1c 수정: Do (스킬 흡수)
**Actor**: CEO
**Agents**: absorb-analyzer (신규 에이전트)
**Input**: 외부 스킬 소스 (GitHub repo, package)
**Output**: 
  - 흡수 분석 결과 (compatibility, dependencies, modifications needed)
  - 통합된 스킬
**Action**:
  - absorb-analyzer가 외부 스킬 분석
  - 필요한 수정 사항 식별 (vais-code convention에 맞게)
  - 통합 진행

---

## S-10: 정기 운영

> **상황**: "기술부채 정리해줘", "팀 프로세스 개선"

### 진입 조건 (Entry Condition)
- 정기적인 운영 작업 요청 (스프린트 종료 후, 분기 말)
- CEO가 작업 유형 판단 (기술부채, 팀 프로세스)

### 완료 조건 (Exit Condition)
- 기술부채 목록화 및 우선순위 완료, 또는
- 팀 프로세스 설계 및 문서화 완료
- CEO 최종 리뷰 및 보고

### CEO 판단 기준
- 기술부채: CTO (분석) → CSO (리뷰) → backlog에 반영
- 팀 프로세스: COO (설계) → 문서화 및 교육

---

### 단계별 플로우 (Step-by-Step Flow)

#### Branch A: 기술부채 관리

##### Phase 1: CEO Plan
**Actor**: CEO
**Input**: 기술부채 정리 요청
**Output**: 부채 목록화 계획
**Next Actor**: CTO

##### Phase 2: CTO Full PDCA (부채 분석 & 리팩토링)
**Actor**: CTO
**Agents**: architect, backend-engineer, database-specialist
**Input**: 기술부채 대상 코드/모듈
**Output**:
  - 기술부채 분석 리포트 (complexity, maintenance cost)
  - 부채 우선순위 (payment, refactoring effort, impact)
  - 리팩토링된 코드
  - CTO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: architect가 부채 식별 및 분류 (코드 복잡도, 테스트 커버리지, 문서화 부족)
  - **Design**: 우선순위 매트릭스 (maintenance cost vs refactoring effort)
  - **Do**: 부채 리팩토링 (highest priority부터)
  - **QA**: CTO가 리팩토링 후 functional equivalence 검증
**Next Actor**: CSO

##### Phase 3: CSO Full PDCA (코드 리뷰)
**Actor**: CSO
**Agents**: code-reviewer
**Input**: CTO의 리팩토링 코드
**Output**: 코드 리뷰 보고서, 승인
**Next Actor**: CEO (최종 리뷰)

##### Phase 4: CEO 최종 리뷰 & 보고
**Action**:
  - 리팩토링 완료 확인
  - 나머지 부채는 backlog에 반영
**Completion**: 기술부채 관리 완료

---

#### Branch B: 팀 프로세스 개선

##### Phase 1: CEO Plan
**Actor**: CEO
**Input**: 팀 프로세스 개선 요청
**Output**: 프로세스 개선 범위 정의
**Next Actor**: COO

##### Phase 2: COO Full PDCA (프로세스 설계)
**Actor**: COO
**Agents**: operations-manager, documentation-specialist
**Input**: 개선할 프로세스 영역 (스프린트 계획, code review, deployment 등)
**Output**:
  - 프로세스 설계서 (step-by-step flow)
  - 문서화 (procedure manual, checklist)
  - 팀 교육 계획
  - COO 최종 리포트
**PDCA Breakdown**:
  - **Plan**: operations-manager가 현재 프로세스 분석 (병목, 개선 기회)
  - **Design**: 새로운 프로세스 설계 (효율성, quality assurance)
  - **Do**: documentation-specialist가 매뉴얼 작성, 교육 자료 준비
  - **QA**: COO가 프로세스의 실현 가능성 검증
**Next Actor**: CEO (최종 리뷰)

##### Phase 3: CEO 최종 리뷰 & 보고
**Action**:
  - 프로세스 개선안 승인
  - 팀 교육 및 적용 일정 수립
**Completion**: 팀 프로세스 개선 완료

---

## C-Level 참여 매트릭스

| 시나리오 | CEO | CPO | CTO | CSO | CBO | COO |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|
| S-1 신규 풀 개발 | ◉ | ◉ | ◉ | ◉ | ◉② | ◉ |
| S-2 기능 추가 | ◉ | ◉ | ◉ | ◉ | | ◉ |
| S-3 기능 수정/개선 | ◉ | △ | ◉ | ◉ | | |
| S-4 장애 대응 | ◉ | | ◉ | ◉ | | ◉ |
| S-5 성능/비용 최적화 | ◉ | | ◉ | ◉ | △② | |
| S-6 보안 감사 | ◉ | | △ | ◉ | | |
| S-7 마케팅 & GTM | ◉ | ◉ | △ | △ | ◉ | |
| S-8 사업 분석 | ◉ | △ | | | ◉ | |
| S-9 내부 강화 | ◉ | | | ◉ | | |
| S-10 정기 운영 | ◉ | | △ | △ | | △ |

> ◉ = 필수 참여 (full PDCA)
> △ = 상황에 따라 참여 (조건부)
> ② = 두 번 진입
> 빈칸 = 미참여

---

## 공통 플로우 규칙

### PDCA Full Cycle

각 C-Level의 **full PDCA**는 다음을 포함:

1. **Plan (계획)**
   - WHO: 해당 C-Level + primary agent
   - WHAT: 문제 분석, 목표 정의, 접근 전략
   - OUTPUT: 계획 문서, 리소스 할당
   - APPROVAL: Manual Mode에서 사용자 승인

2. **Design (설계)**
   - WHO: 해당 C-Level + technical agents
   - WHAT: 상세 설계, 모듈 분해, 인터페이스 정의
   - OUTPUT: 설계 문서, 아키텍처 다이어그램
   - APPROVAL: 자동 (plan 완료 후)

3. **Do (실행)**
   - WHO: 해당 C-Level + implementation agents (병렬 가능)
   - WHAT: 코드 작성, 테스트, 통합
   - OUTPUT: 구현물, 테스트 결과
   - APPROVAL: 자동 (design 완료 후)

4. **QA (검증)**
   - WHO: 해당 C-Level (primary) + agents (검증 담당)
   - WHAT: 품질 검증, 요구사항 충족 확인, 성능 테스트
   - OUTPUT: QA 리포트, 승인/반려
   - APPROVAL: Manual Mode에서 사용자 승인 (또는 CSO가 최종 게이트)

### Manual Mode vs Auto Mode

- **Manual Mode**: 각 C-Level의 QA phase 완료 후 사용자 승인 필수
- **Auto Mode**: 동일 플로우, 사용자 승인 없이 자동 진행 (신뢰도가 높은 운영)

### C-Level ↔ C-Level 핸드오프

모든 위임은 다음 규칙을 따름:

1. **CEO 경유**: 현재 C-Level이 완료 후 → CEO에게 리포트 → CEO가 다음 C-Level 호출
2. **Context 전달**: 이전 C-Level의 OUTPUT이 다음 C-Level의 INPUT이 됨
3. **Approval Gate**: 각 단계마다 명시적 승인 (Manual Mode)

### CSO 최종 게이트

코드 수정이 발생하는 모든 시나리오에서:
- **CSO가 QA phase에서 최종 검증**
- CSO가 approve하기 전까지 다음 단계 불가
- CSO 검증 내용: 보안, 코드 품질, 성능 영향

### Loop Condition (루프)

특정 시나리오에서 C-Level 간 루프 발생:
- **S-6 보안 감사**: CSO ↔ CTO 루프 최대 3회
  - 초과 시 CEO 판단 (incident-responder 투입 또는 수정 연기)
- **S-7 마케팅 & GTM**: CWV 이슈 발견 시 CTO → CSO → CBO 재검증

---

## Approval & Escalation Rules

### Manual Mode Approval Flow

```
User Request
  ↓
CEO Plan (사용자 승인)
  ↓
C-Level① Plan (사용자 승인) → Design → Do → QA (사용자 승인)
  ↓
C-Level② Plan (사용자 승인) → Design → Do → QA (사용자 승인)
  ↓
...
  ↓
CEO Final Review (사용자 승인)
  ↓
Complete
```

### Escalation Path

특정 조건에서 escalation 발생:

1. **CSO ↔ CTO 루프 초과 (> 3회)**
   - → CEO에게 판단 위임 (incident-responder 투입 or 수정 연기)

2. **Critical 이슈 미해결**
   - → CEO가 우선순위 재조정 or 타임라인 조정

3. **CTO 수정 불가능한 이슈**
   - → CEO가 external consultant 투입 or 기술 부채로 기록

---

## 매핑 문서 (Mapping Documentation)

**Requirements**: 각 시나리오마다 다음 문서 유지 필수

1. **SKILL_MAPPING.md** — 어느 C-Level의 어느 phase에서 어느 스킬이 사용되는가
2. **AGENT_MAPPING.md** — 어느 시나리오에서 어느 에이전트가 필요한가
3. **SCENARIO_RUNBOOK.md** — 각 시나리오별 step-by-step 실행 가이드
4. **APPROVAL_CHECKLIST.md** — Manual Mode에서의 승인 기준

---

## 완료
