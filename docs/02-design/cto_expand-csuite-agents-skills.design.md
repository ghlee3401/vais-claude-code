# expand-csuite-agents-skills — 설계서

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | AI Company 확장을 위해 실무 에이전트·스킬 부족 문제 해결 |
| **WHO** | VAIS Code 사용자 (SaaS/소프트웨어 개발자) |
| **RISK** | 에이전트가 너무 많으면 오케스트레이션 복잡도 증가, 너무 적으면 커버리지 부족 |
| **SUCCESS** | 모든 C-Level이 최소 2개 이상의 실무 에이전트 보유, 핵심 SDLC 역할 100% 커버 |
| **SCOPE** | Phase 1+2 전체: 에이전트 16개 + 스킬 7개 + C-Level 개편 + 문서 동기화 |

---

## 1. Overview

### 1.1 설계 목표

Option B (Clean Architecture) 선택 — 에이전트 생성 + 모든 C-Level 오케스트레이터 PDCA 전면 재작성 + CLAUDE.md/AGENTS.md/vais.config.json 동기화 + Phase 스킬 리팩토링.

### 1.2 변경 범위 요약

| 카테고리 | 신규 | 수정 | 합계 |
|---------|------|------|------|
| 에이전트 `.md` | 16 | 6 (C-Level 오케스트레이터) | 22 |
| 스킬 `.md` | 7 | 0 | 7 |
| Phase 스킬 | 0 | 7 (C-Level phase 스킬) | 7 |
| 프로젝트 문서 | 0 | 3 (CLAUDE.md, AGENTS.md, vais.config.json) | 3 |
| **합계** | **23** | **16** | **39** |

---

## 2. 신규 에이전트 상세 설계 (16개)

> 모든 에이전트는 기존 패턴(frontmatter + 핵심역할 + 구현원칙 + Contract)을 따른다.

### 2.1 CTO 산하 (3개)

#### 2.1.1 `agents/cto/tester.md`

```yaml
name: tester
version: 1.0.0
description: |
  테스트 코드 작성 에이전트. unit/integration/e2e 테스트를 생성합니다.
  qa(Gap 분석)와 역할 분리 — tester는 코드 작성, qa는 검증.
  Triggers: (직접 호출 금지 — CTO를 통해 호출)
model: sonnet
tools: [Read, Write, Edit, Glob, Grep, Bash, TodoWrite]
memory: none
disallowedTools:
  - "Bash(rm -rf*)"
  - "Bash(git push*)"
  - "Bash(git reset --hard*)"
```

**핵심 역할:**
1. Plan/Design의 테스트 시나리오를 코드로 변환
2. Unit 테스트: 함수/컴포넌트 단위 (Vitest/Jest)
3. Integration 테스트: API 엔드포인트 통합 (supertest)
4. E2E 테스트: 사용자 시나리오 (Playwright)
5. 커버리지 리포트 생성

**입력 참조:**
- `docs/01-plan/cto_{feature}.plan.md` — 테스트 시나리오
- `docs/02-design/cto_{feature}.design.md` — API Contract, 컴포넌트 명세
- 구현 코드 — 테스트 대상 파일

**산출물:**
- `tests/unit/{feature}/*.test.ts`
- `tests/integration/{feature}/*.test.ts`
- `tests/e2e/{feature}/*.spec.ts`
- 커버리지 요약 → CTO에게 반환

**PDCA 위치:** Do 단계 — frontend + backend + tester 병렬 실행

---

#### 2.1.2 `agents/cto/devops.md`

```yaml
name: devops
version: 1.0.0
description: |
  CI/CD 파이프라인 및 배포 자동화 에이전트.
  GitHub Actions, Docker, 환경별 배포 설정을 담당합니다.
  architect(설계)와 역할 분리 — devops는 자동화 구현.
  Triggers: (직접 호출 금지 — CTO 또는 COO를 통해 호출)
model: sonnet
tools: [Read, Write, Edit, Glob, Grep, Bash, TodoWrite]
memory: none
disallowedTools:
  - "Bash(rm -rf*)"
  - "Bash(git push*)"
  - "Bash(git reset --hard*)"
```

**핵심 역할:**
1. GitHub Actions 워크플로우 작성 (CI/CD)
2. Dockerfile / docker-compose 작성
3. 환경별 배포 설정 (dev/staging/prod)
4. 빌드·테스트·린트 자동화 파이프라인
5. 환경 변수 관리 전략

**입력 참조:**
- `docs/02-design/cto_{feature}.design.md` — 기술 스택, 배포 전략
- 프로젝트 루트의 기존 CI/CD 설정
- architect 산출물 — 환경 구성

**산출물:**
- `.github/workflows/{feature}-ci.yml`
- `Dockerfile`, `docker-compose.yml`
- 배포 스크립트/설정 파일
- CI/CD 파이프라인 문서 → COO/CTO에게 반환

**PDCA 위치:**
- CTO Do 단계 (CTO 경유 시)
- COO Design+Do 단계 (COO 경유 시)

**크로스 호출:** COO가 주로 사용, CTO가 배포 자동화 필요 시 COO 경유 호출

---

#### 2.1.3 `agents/cto/database.md`

```yaml
name: database
version: 1.0.0
description: |
  DB 전문 에이전트. 스키마 최적화, 마이그레이션, 쿼리 튜닝, 인덱스 설계.
  architect에서 DB 전문 부분을 분리 — architect는 전체 인프라 설계, database는 DB 심화.
  Triggers: (직접 호출 금지 — CTO를 통해 호출)
model: sonnet
tools: [Read, Write, Edit, Glob, Grep, Bash, TodoWrite]
memory: none
disallowedTools:
  - "Bash(rm -rf*)"
  - "Bash(git push*)"
  - "Bash(git reset --hard*)"
  - "Bash(DROP *)"
```

**핵심 역할:**
1. 복잡 스키마 설계 (정규화/비정규화 판단)
2. 마이그레이션 전략 (zero-downtime migration)
3. 쿼리 최적화 (EXPLAIN 분석, N+1 감지)
4. 인덱스 설계 (composite, partial, covering)
5. 데이터 시드/픽스처 관리

**입력 참조:**
- `docs/01-plan/cto_{feature}.plan.md` — 데이터 모델
- architect 산출물 — ERD, 기본 스키마

**산출물:**
- 최적화된 마이그레이션 파일
- 쿼리 튜닝 리포트
- 인덱스 설계 문서

**PDCA 위치:** Design→Do 단계 (architect 이후 심화 필요 시)

---

### 2.2 CPO 산하 (2개)

#### 2.2.1 `agents/cpo/ux-researcher.md`

```yaml
name: ux-researcher
version: 1.0.0
description: |
  UX 리서치 에이전트. 사용자 인터뷰 스크립트, 사용성 테스트 설계, 페르소나 심화.
  pm-research에서 UX 전문 부분 분리.
  Triggers: (직접 호출 금지 — CPO를 통해 호출)
model: sonnet
tools: [Read, Write, Edit, Glob, Grep, TodoWrite]
memory: none
disallowedTools:
  - "Bash(rm -rf*)"
  - "Bash(git push*)"
```

**핵심 역할:**
1. 사용자 인터뷰 스크립트 작성 (Jobs-to-be-Done 기반)
2. 사용성 테스트 시나리오 설계
3. 페르소나 심화 (행동 패턴, 감정 맵)
4. 사용자 여정 맵 (Customer Journey Map) 세부화
5. 접근성 가이드라인 체크리스트

**산출물:**
- UX 리서치 리포트 (인터뷰 스크립트 + 페르소나 심화)
- 사용성 테스트 시나리오 문서

**PDCA 위치:** CPO Plan/Design 단계 (pm-research 병렬)

---

#### 2.2.2 `agents/cpo/data-analyst.md`

```yaml
name: data-analyst
version: 1.0.0
description: |
  데이터 분석 에이전트. 제품 지표 분석, A/B 테스트 설계, 퍼널 분석.
  데이터 기반 의사결정 지원.
  Triggers: (직접 호출 금지 — CPO를 통해 호출)
model: sonnet
tools: [Read, Write, Edit, Glob, Grep, Bash, TodoWrite]
memory: none
disallowedTools:
  - "Bash(rm -rf*)"
  - "Bash(git push*)"
  - "Bash(DROP *)"
```

**핵심 역할:**
1. 제품 지표 분석 (DAU/MAU, Retention, Funnel)
2. A/B 테스트 설계 (표본 크기 계산, 가설 설정)
3. 코호트 분석 (가입 시점별 행동 추적)
4. 성공 지표 측정 가능성 검증
5. 데이터 대시보드 명세

**산출물:**
- 지표 분석 리포트
- A/B 테스트 설계서
- 코호트 분석 결과

**PDCA 위치:**
- CPO Plan 단계: 데이터 기반 기회 발견
- CPO Check 단계: 성공 지표 측정 가능성 검증
- **크로스:** CTO Check (QA 지표 분석), CFO Plan (비용 데이터 분석)

---

### 2.3 CMO 산하 (2개)

#### 2.3.1 `agents/cmo/copywriter.md`

```yaml
name: copywriter
version: 1.0.0
description: |
  마케팅 카피 전문 에이전트. 랜딩페이지 카피, 이메일 템플릿, 앱스토어 설명문.
  seo(기술 최적화)와 역할 분리 — copywriter는 마케팅 텍스트 전문.
  Triggers: (직접 호출 금지 — CMO를 통해 호출)
model: sonnet
tools: [Read, Write, Edit, Glob, Grep, TodoWrite]
memory: none
disallowedTools:
  - "Bash(rm -rf*)"
  - "Bash(git push*)"
```

**핵심 역할:**
1. 랜딩페이지 카피 작성 (Hero, CTA, Features, Social Proof)
2. 이메일 마케팅 템플릿 (온보딩, 리텐션, 윈백)
3. 앱스토어 설명문 (ASO 최적화)
4. 제품 설명 (기능 페이지, FAQ)
5. 톤앤보이스 가이드 생성

**산출물:**
- 카피 콘텐츠 파일들
- 톤앤보이스 가이드

**PDCA 위치:** CMO Do 단계 — seo + copywriter 병렬

---

#### 2.3.2 `agents/cmo/growth.md`

```yaml
name: growth
version: 1.0.0
description: |
  그로스 전략 에이전트. 퍼널 최적화, 바이럴 루프 설계, 리텐션 분석.
  Triggers: (직접 호출 금지 — CMO를 통해 호출)
model: sonnet
tools: [Read, Write, Edit, Glob, Grep, TodoWrite]
memory: none
disallowedTools:
  - "Bash(rm -rf*)"
  - "Bash(git push*)"
```

**핵심 역할:**
1. 그로스 퍼널 분석 (AARRR: Acquisition→Activation→Retention→Revenue→Referral)
2. 바이럴 루프 설계 (K-factor 계산)
3. 리텐션 전략 (Day 1/7/30 리텐션 기준)
4. PLG (Product-Led Growth) 전략 수립
5. North Star Metric 정의 + 지원 지표

**산출물:**
- 그로스 전략서 (퍼널 + 바이럴 루프 + 리텐션)

**PDCA 위치:** CMO Plan 단계 — growth 전략 수립 후 SEO/copywriter 실행

---

### 2.4 COO 산하 (2개)

#### 2.4.1 `agents/coo/sre.md`

```yaml
name: sre
version: 1.0.0
description: |
  SRE/모니터링 에이전트. 모니터링 설정, 알림 규칙, 인시던트 대응 런북.
  canary(배포 직후 단기)와 역할 분리 — sre는 상시 운영 모니터링.
  Triggers: (직접 호출 금지 — COO를 통해 호출)
model: sonnet
tools: [Read, Write, Edit, Glob, Grep, Bash, TodoWrite]
memory: none
disallowedTools:
  - "Bash(rm -rf*)"
  - "Bash(git push*)"
  - "Bash(git reset --hard*)"
```

**핵심 역할:**
1. 모니터링 설정 (Prometheus/Grafana 또는 클라우드 네이티브)
2. 알림 규칙 정의 (PagerDuty/Slack integration)
3. 인시던트 대응 런북 작성
4. SLI/SLO/SLA 정의
5. Error Budget 관리 전략

**산출물:**
- 모니터링 설정 파일
- 알림 규칙 설정
- 인시던트 런북 (`docs/ops/runbook-{feature}.md`)

**PDCA 위치:** COO Do 단계 — sre + devops 병렬

---

#### 2.4.2 `agents/coo/docs-writer.md`

```yaml
name: docs-writer
version: 1.0.0
description: |
  기술 문서 전문 에이전트. API docs, README, 사용자 가이드, 온보딩 문서.
  Triggers: (직접 호출 금지 — COO를 통해 호출)
model: sonnet
tools: [Read, Write, Edit, Glob, Grep, Bash, TodoWrite]
memory: none
disallowedTools:
  - "Bash(rm -rf*)"
  - "Bash(git push*)"
```

**핵심 역할:**
1. API 문서 자동 생성 (OpenAPI/Swagger → Markdown)
2. README 생성/업데이트
3. 사용자 가이드 작성 (Getting Started, Tutorial)
4. 온보딩 문서 (신규 개발자용)
5. 변경 로그 (CHANGELOG) 정리

**산출물:**
- API docs (`docs/api/`)
- README.md 업데이트
- 사용자 가이드 (`docs/guides/`)

**PDCA 위치:** COO Report 단계

**크로스 호출:** CTO Report, CPO Report에서도 문서화 필요 시 COO 경유 호출

---

### 2.5 CSO 산하 (1개)

#### 2.5.1 `agents/cso/compliance.md`

```yaml
name: compliance
version: 1.0.0
description: |
  컴플라이언스 에이전트. GDPR/개인정보보호, 라이선스 검사, 감사 로그 검증.
  security(코드 취약점)와 역할 분리 — compliance는 규정 준수.
  Triggers: (직접 호출 금지 — CSO를 통해 호출)
model: sonnet
tools: [Read, Write, Edit, Glob, Grep, Bash, TodoWrite]
memory: none
disallowedTools:
  - "Bash(rm -rf*)"
  - "Bash(git push*)"
```

**핵심 역할:**
1. GDPR/CCPA 준수 체크리스트 검증
2. 오픈소스 라이선스 호환성 검사 (GPL, MIT, Apache 등)
3. 감사 로그 검증 (민감 데이터 접근 기록)
4. 개인정보 처리방침/이용약관 초안
5. SOC2/ISO27001 항목 체크

**산출물:**
- 컴플라이언스 리포트
- 라이선스 호환성 분석 결과
- 법적 문서 초안

**PDCA 위치:** CSO Check 단계 — security 검토 후 compliance 추가 검증

**크로스 호출:** CFO Check에서 비용 관련 규정 준수 시 CSO 경유

---

### 2.6 CFO 산하 (2개)

#### 2.6.1 `agents/cfo/cost-analyst.md`

```yaml
name: cost-analyst
version: 1.0.0
description: |
  비용 분석 에이전트. 클라우드 비용 추정, 인프라 비용 최적화, API 호출 비용 계산.
  Triggers: (직접 호출 금지 — CFO를 통해 호출)
model: sonnet
tools: [Read, Write, Edit, Glob, Grep, Bash, TodoWrite]
memory: none
disallowedTools:
  - "Bash(rm -rf*)"
  - "Bash(git push*)"
```

**핵심 역할:**
1. 클라우드 비용 추정 (AWS/GCP/Azure 가격표 기반)
2. 인프라 비용 최적화 제안 (Reserved vs On-demand, Spot 인스턴스)
3. API 호출 비용 계산 (외부 서비스 과금 분석)
4. 월간/연간 비용 예측 (트래픽 시나리오별)
5. 비용 절감 방안 제안

**산출물:**
- 비용 분석 리포트 (항목별 추정 + 최적화 제안)

**PDCA 위치:** CFO Do 단계

---

#### 2.6.2 `agents/cfo/pricing-modeler.md`

```yaml
name: pricing-modeler
version: 1.0.0
description: |
  가격 모델링 에이전트. 가격 책정 시뮬레이션, 경쟁사 벤치마크, 수익 예측.
  Triggers: (직접 호출 금지 — CFO를 통해 호출)
model: sonnet
tools: [Read, Write, Edit, Glob, Grep, TodoWrite]
memory: none
disallowedTools:
  - "Bash(rm -rf*)"
  - "Bash(git push*)"
```

**핵심 역할:**
1. 가격 모델 비교 (Freemium / Subscription / Usage-based / Transaction)
2. 경쟁사 가격 벤치마크
3. 수익 시뮬레이션 (낙관/중립/비관 시나리오)
4. Unit Economics 계산 (CAC, LTV, Payback Period)
5. 가격 탄력성 분석

**산출물:**
- 가격 모델링 리포트 (시나리오별 수익 예측)

**PDCA 위치:** CFO Plan 단계

---

## 3. 신규 스킬 상세 설계 (7개)

### 3.1 `skills/vais/utils/test.md` (확장)

> 기존 test 스킬을 테스트 실행 + 커버리지로 확장

**실행 순서:**
1. 프로젝트 테스트 프레임워크 감지 (Vitest/Jest/Playwright)
2. 테스트 실행 (`npm test` 또는 `npx vitest`)
3. 커버리지 리포트 생성
4. 실패 테스트 요약 출력
5. CTO에게 결과 반환

---

### 3.2 `skills/vais/utils/deploy.md` (신규)

**실행 순서:**
1. 배포 환경 확인 (dev/staging/prod)
2. 배포 전 체크리스트 (빌드 성공, 테스트 통과, 환경 변수)
3. 배포 명령 실행 (Vercel/Railway/Docker/수동)
4. 배포 후 헬스체크
5. 배포 결과 요약

---

### 3.3 `skills/vais/utils/analyze-cost.md` (신규)

**실행 순서:**
1. 프로젝트 인프라 구성 파악 (package.json, Dockerfile, 환경 변수)
2. 외부 API 사용 현황 분석
3. 클라우드 비용 추정
4. 최적화 제안 출력

---

### 3.4 `skills/vais/utils/write-docs.md` (신규)

**실행 순서:**
1. 코드 구조 분석 (API 라우트, 컴포넌트, 모듈)
2. API 문서 생성 (엔드포인트 목록 + 파라미터 + 응답)
3. README 업데이트 (프로젝트 소개 + 설치 + 사용법)
4. 산출물 저장 경로 안내

---

### 3.5 `skills/vais/utils/growth-audit.md` (신규)

**실행 순서:**
1. 제품 퍼널 구조 분석 (AARRR)
2. 각 단계별 전환율 추정
3. 병목 지점 식별
4. 개선 제안 출력

---

### 3.6 `skills/vais/utils/license-check.md` (신규)

**실행 순서:**
1. `package.json` / `package-lock.json` 읽기
2. 각 의존성 라이선스 확인
3. GPL/AGPL 등 전염성 라이선스 감지
4. 호환성 매트릭스 출력
5. 위험 의존성 경고

---

### 3.7 `skills/vais/utils/pricing.md` (신규)

**실행 순서:**
1. 프로젝트 비용 구조 파악
2. 가격 모델 3가지 시뮬레이션 (Freemium / Subscription / Usage-based)
3. 경쟁사 가격 참조 (수동 입력)
4. BEP(손익분기점) 계산
5. 권장 가격대 출력

---

## 4. C-Level 오케스트레이터 개편 설계

### 4.1 CTO 개편

**변경 파일:** `agents/cto/cto.md`

**PDCA 테이블 (수정 전 → 수정 후):**

```diff
- | Do | frontend + backend | 병렬 구현 (Agent 병렬 호출) |
+ | Do | frontend + backend + tester | 병렬 구현 + 테스트 코드 (Agent 병렬 호출) |
```

**에이전트 위임 규칙 추가:**

| 체이닝 | 에이전트 | 방식 |
|--------|---------|------|
| tester | tester | Agent 도구 |
| frontend + backend + tester | frontend, backend, tester | Agent 병렬 호출 |
| devops | devops | Agent 도구 (COO 경유 권장) |
| database | database | Agent 도구 (architect 이후 심화 시) |

**CP-2 수정:**
```
[CP-2] 다음 에이전트를 실행합니다:
- frontend 에이전트 (병렬)
- backend 에이전트 (병렬)
- tester 에이전트 (병렬)
전달 컨텍스트: Interface Contract + Design 산출물
```

**수정 유형별 체이닝 추가:**

| 수정 유형 | 체이닝 |
|----------|--------|
| 테스트 추가/수정 | `tester` |
| DB 스키마 최적화 | `database` |
| CI/CD 설정 | `devops` (COO 경유) |

---

### 4.2 CPO 개편

**변경 파일:** `agents/cpo/cpo.md`

**PDCA 테이블 수정:**

| 단계 | 실행자 (수정 후) | 내용 |
|------|-----------------|------|
| Plan | 직접 + **data-analyst** | 기회 발견 + 데이터 기반 분석 |
| Design | pm-discovery + pm-strategy + pm-research + **ux-researcher** (병렬) | 기회 분석 + UX 리서치 |
| Do | pm-prd | PRD 합성 |
| Check | 직접 + **data-analyst** | PRD 완성도 + 성공 지표 측정 가능성 |
| Report | 직접 | PRD 최종화 |

**에이전트 위임 규칙 추가:**

| 체이닝 | 에이전트 | 방식 |
|--------|---------|------|
| data-analyst | data-analyst | Agent 도구 |
| ux-researcher | ux-researcher | Agent 도구 |

**sub-agent 호출 순서 수정:**
```
1단계: pm-discovery + pm-strategy + pm-research + ux-researcher [병렬]
2단계: data-analyst [Plan/Check 단계에서 개별 호출]
3단계: pm-prd [합성]
```

---

### 4.3 CMO 개편

**변경 파일:** `agents/cmo/cmo.md`

**PDCA 테이블 수정:**

| 단계 | 실행자 (수정 후) | 내용 |
|------|-----------------|------|
| Plan | 직접 + **growth** | 마케팅 목표 + 그로스 퍼널 전략 |
| Design | 직접 | SEO 키워드 + 마케팅 전략 + 카피 톤 |
| Do | seo + **copywriter** (병렬) | SEO 감사 + 마케팅 카피 |
| Check | 직접 | SEO ≥ 80 + 카피 톤 일관성 + 그로스 KPI |
| Report | 직접 | 마케팅 최종 보고 |

**에이전트 위임 규칙 추가:**

| 체이닝 | 에이전트 | 방식 |
|--------|---------|------|
| growth | growth | Agent 도구 |
| copywriter | copywriter | Agent 도구 |
| seo + copywriter | seo, copywriter | Agent 병렬 호출 |

**CP-2 수정:**
```
[CP-2] 다음 에이전트를 실행합니다:
- seo 에이전트 (병렬)
- copywriter 에이전트 (병렬)
피처: {feature}
```

---

### 4.4 COO 개편

**변경 파일:** `agents/coo/coo.md`

**PDCA 테이블 수정:**

| 단계 | 실행자 (수정 후) | 내용 |
|------|-----------------|------|
| Plan | 직접 | 운영 현황 + 개선 범위 |
| Design | 직접 + **devops** | CI/CD 파이프라인 설계 |
| Do | **sre** + **devops** (병렬) | 모니터링 + 배포 자동화 |
| Check | canary + benchmark | 배포 검증 + 성능 벤치마크 |
| Report | **docs-writer** + 직접 | 기술 문서 + 운영 보고서 |

**에이전트 위임 규칙 추가:**

| 체이닝 | 에이전트 | 방식 |
|--------|---------|------|
| devops | devops | Agent 도구 |
| sre | sre | Agent 도구 |
| docs-writer | docs-writer | Agent 도구 |
| sre + devops | sre, devops | Agent 병렬 호출 |

**CP-1 수정 (범위 확인):**
```
[CP-1] 운영 개선 범위를 선택해주세요.
A. 최소 범위: CI/CD 파이프라인만
B. 표준 범위: CI/CD + 모니터링 설정 + 배포 전략 ← 권장
C. 확장 범위: 표준 + SRE 검토 + 운영 런북 + 기술 문서
```

**CP-2 수정:**
```
[CP-2] 다음 에이전트를 실행합니다:
- devops 에이전트 (CI/CD + Docker) (병렬)
- sre 에이전트 (모니터링 + 알림) (병렬)
```

---

### 4.5 CSO 개편

**변경 파일:** `agents/cso/cso.md`

**PDCA 테이블 — Gate A 수정:**

| 단계 | 실행자 (수정 후) | 내용 |
|------|-----------------|------|
| Plan | 직접 | 위협 범위 + OWASP 체크 대상 정의 |
| Design | 직접 | 위협 모델 + 보안 체크리스트 |
| Do | security / validate-plugin / code-review | 보안 스캔 실행 |
| Check | 직접 + **compliance** | Critical 판정 + 규정 준수 검증 |
| Report | 직접 | 보안 최종 보고 |

**에이전트 위임 규칙 추가:**

| 체이닝 | 에이전트 | 방식 |
|--------|---------|------|
| compliance | compliance | Agent 도구 |

**CP-Q 수정:**
```
[CP-Q] 보안·품질 판정 결과입니다.
- Gate A (보안 검토): {Pass/조건부/Fail}
- Gate B (플러그인 검증): {Pass/Fail/N/A}
- Gate C (독립 코드 리뷰): {Pass/조건부/Fail/N/A}
- Compliance 검토: {Pass/조건부/N/A}  ← 추가
```

---

### 4.6 CFO 개편

**변경 파일:** `agents/cfo/cfo.md`

**PDCA 테이블 수정:**

| 단계 | 실행자 (수정 후) | 내용 |
|------|-----------------|------|
| Plan | 직접 + **pricing-modeler** | 비용 구성 + 가격 모델 벤치마크 |
| Design | 직접 | 재무 모델 설계 |
| Do | **cost-analyst** + 직접 | 비용 추정 + ROI 계산 |
| Check | 직접 | 수치 완전성 + ROI 달성 여부 |
| Report | 직접 | 재무 최종 보고 |

**에이전트 위임 규칙 추가:**

| 체이닝 | 에이전트 | 방식 |
|--------|---------|------|
| cost-analyst | cost-analyst | Agent 도구 |
| pricing-modeler | pricing-modeler | Agent 도구 |

**CP-1 수정:**
```
[CP-1] 재무 분석 범위를 선택해주세요.
A. 최소 범위: ROI 계산만 (비용 vs 기대 수익)
B. 표준 범위: ROI + 가격 책정(pricing-modeler) + 예산 계획 ← 권장
C. 확장 범위: 표준 + 비용 최적화(cost-analyst) + 시나리오 분석
```

---

## 5. Phase 스킬 개편 설계

### 5.1 수정 대상 Phase 스킬 (7개)

| Phase 스킬 | 수정 내용 |
|-----------|----------|
| `skills/vais/phases/cto.md` | tester/devops/database 위임 규칙 추가 |
| `skills/vais/phases/cpo.md` | data-analyst/ux-researcher 위임 규칙 추가 |
| `skills/vais/phases/cmo.md` | growth/copywriter 위임 규칙 추가 |
| `skills/vais/phases/coo.md` | sre/devops/docs-writer 위임 규칙 추가 |
| `skills/vais/phases/cso.md` | compliance 위임 규칙 추가 |
| `skills/vais/phases/cfo.md` | cost-analyst/pricing-modeler 위임 규칙 추가 |
| `skills/vais/phases/qa.md` | tester와의 역할 분리 명시 |

### 5.2 수정 패턴

각 Phase 스킬의 `## 실행 순서`에서 해당 C-Level의 에이전트 위임 목록을 업데이트합니다. Phase 스킬은 C-Level 에이전트의 축약 버전이므로, 에이전트 `.md`의 PDCA 테이블 변경을 반영합니다.

---

## 6. 프로젝트 문서 동기화 설계

### 6.1 CLAUDE.md 수정

**Agent Architecture 테이블 업데이트:**

```markdown
### Execution (실행 레이어, Sonnet)
| Agent | Role |
|-------|------|
| architect | DB 스키마 + 환경 + 프로젝트 설정 |
| design | IA + 와이어프레임 + UI 설계 |
| frontend | 프론트엔드 구현 |
| backend | 백엔드 API 구현 |
| qa | Gap 분석 + 코드 리뷰 + QA 검증 |
| tester | 테스트 코드 작성 (unit/integration/e2e) |
| devops | CI/CD 파이프라인 + Docker + 배포 자동화 |
| database | DB 스키마 최적화 + 마이그레이션 + 쿼리 튜닝 |
| security | 보안 감사 (OWASP Top 10) |
| seo | SEO 감사 |
| copywriter | 마케팅 카피 (랜딩/이메일/앱스토어) |
| growth | 그로스 퍼널 전략 + 바이럴 루프 |
| sre | SRE/모니터링 + 인시던트 런북 |
| docs-writer | 기술 문서 (API docs/README/가이드) |
| compliance | 컴플라이언스 (GDPR/라이선스) |
| cost-analyst | 클라우드 비용 분석 + 최적화 |
| pricing-modeler | 가격 모델링 + 수익 시뮬레이션 |
| investigate | 체계적 디버깅 (4단계) |
| canary | 배포 후 카나리 모니터링 |
| benchmark | 성능 벤치마크 + 회귀 감지 |
| code-review | 독립 코드 리뷰 |
| validate-plugin | 플러그인 배포 검증 |

### PM (제품 기획 레이어, CPO 서브)
pm-discovery, pm-strategy, pm-research, pm-prd, ux-researcher, data-analyst
```

**에이전트 수 업데이트:** 21개 → 35개 (+14개 실무 에이전트, +2개 CPO 이동 반영)

---

### 6.2 AGENTS.md 수정

**Execution 테이블 전면 교체:**

```markdown
### Execution (실행 레이어, Sonnet)

| 에이전트 | 소속 | 역할 |
|---------|------|------|
| architect | CTO | DB 스키마 + 환경 + 프로젝트 설정 |
| design | CTO | IA + 와이어프레임 + UI 설계 |
| frontend | CTO | 프론트엔드 구현 |
| backend | CTO | 백엔드 API 구현 |
| qa | CTO | Gap 분석 + 코드 리뷰 + QA 검증 |
| tester | CTO | 테스트 코드 작성 (unit/integration/e2e) |
| devops | COO | CI/CD + Docker + 배포 자동화 |
| database | CTO | DB 스키마 최적화 + 쿼리 튜닝 |
| security | CSO | 보안 감사 (OWASP) |
| code-review | CSO | 독립 코드 리뷰 |
| validate-plugin | CSO | 플러그인 배포 검증 |
| compliance | CSO | GDPR/라이선스 컴플라이언스 |
| seo | CMO | SEO 감사 |
| copywriter | CMO | 마케팅 카피 전문 |
| growth | CMO | 그로스 퍼널 + 바이럴 전략 |
| sre | COO | SRE/모니터링 + 인시던트 런북 |
| docs-writer | COO | 기술 문서 (API docs/README) |
| canary | COO | 배포 후 카나리 모니터링 |
| benchmark | COO | 성능 벤치마크 |
| investigate | CTO | 체계적 디버깅 |
| cost-analyst | CFO | 클라우드 비용 분석 |
| pricing-modeler | CFO | 가격 모델링 + 수익 시뮬레이션 |

### PM (제품 기획 레이어, CPO 서브)

| 에이전트 | 역할 |
|---------|------|
| pm-discovery | Opportunity Solution Tree (Teresa Torres) |
| pm-strategy | Value Proposition + Lean Canvas |
| pm-research | 페르소나 + 경쟁사 + 시장 규모 |
| pm-prd | PRD 합성 |
| ux-researcher | UX 리서치 + 사용성 테스트 |
| data-analyst | 제품 지표 분석 + A/B 테스트 |
```

---

### 6.3 vais.config.json 수정

```json
"roles": {
  "ceo": { "required": true,  "model": "opus", "layer": "executive",        "agent": "agents/ceo/ceo.md", "subAgents": ["absorb-analyzer", "retro"] },
  "cpo": { "required": false, "model": "opus", "layer": "strategy-product", "agent": "agents/cpo/cpo.md", "subAgents": ["pm-discovery", "pm-strategy", "pm-research", "pm-prd", "ux-researcher", "data-analyst"] },
  "cto": { "required": true,  "model": "opus", "layer": "strategy-tech",    "agent": "agents/cto/cto.md", "subAgents": ["architect", "backend", "frontend", "design", "qa", "investigate", "tester", "devops", "database"] },
  "cso": { "required": false, "model": "opus", "layer": "quality",          "agent": "agents/cso/cso.md", "subAgents": ["security", "validate-plugin", "code-review", "compliance"] },
  "cmo": { "required": false, "model": "opus", "layer": "growth",           "agent": "agents/cmo/cmo.md", "subAgents": ["seo", "copywriter", "growth"] },
  "coo": { "required": false, "model": "opus", "layer": "ops",              "agent": "agents/coo/coo.md", "subAgents": ["canary", "benchmark", "sre", "devops", "docs-writer"] },
  "cfo": { "required": false, "model": "opus", "layer": "finance",          "agent": "agents/cfo/cfo.md", "subAgents": ["cost-analyst", "pricing-modeler"] }
}
```

> **참고**: devops는 COO 주 소속이지만 CTO에서도 크로스 호출 가능 → 양쪽 subAgents에 등록

---

## 7. TO-BE 조직도

```
CEO ─── absorb-analyzer, retro
│
├── CPO ─── pm-discovery, pm-strategy, pm-research, pm-prd
│           + ux-researcher, data-analyst
│
├── CTO ─── architect, design, frontend, backend, qa, investigate
│           + tester, devops, database
│
├── CSO ─── security, validate-plugin, code-review
│           + compliance
│
├── CMO ─── seo
│           + copywriter, growth
│
├── COO ─── canary, benchmark
│           + sre, devops, docs-writer
│
└── CFO ─── (신설)
            + cost-analyst, pricing-modeler
```

**총 에이전트: 7 C-Level + 28 실무 = 35개**
(devops는 COO 소속이지만 CTO 크로스 호출 가능)

---

## 8. TO-BE PDCA × Agent 매트릭스 (최종)

| C-Level | Plan | Design | Do | Check | Report |
|---------|------|--------|-----|-------|--------|
| **CEO** | 직접 | 직접 | C-Level 위임 | 직접 | 직접 + retro |
| **CPO** | 직접 + data-analyst | pm-discovery + pm-strategy + pm-research + ux-researcher | pm-prd | 직접 + data-analyst | 직접 |
| **CTO** | 직접 | design + architect | frontend + backend + tester | qa + investigate | 직접 |
| **CSO** | 직접 | 직접 | security / validate-plugin / code-review | 직접 + compliance | 직접 |
| **CMO** | 직접 + growth | 직접 | seo + copywriter | 직접 | 직접 |
| **COO** | 직접 | 직접 + devops | sre + devops | canary + benchmark | docs-writer + 직접 |
| **CFO** | 직접 + pricing-modeler | 직접 | cost-analyst + 직접 | 직접 | 직접 |

---

## 9. 크로스 C-Level 협업 매트릭스

| 에이전트 | 주 소속 | 크로스 호출 가능 | 시나리오 |
|---------|--------|----------------|---------|
| data-analyst | CPO | CTO(Check), CFO(Plan) | 제품 지표 분석, 비용 데이터 분석 |
| devops | COO | CTO(Do) | 배포 자동화 필요 시 |
| docs-writer | COO | CTO(Report), CPO(Report) | 기술 문서·PRD 문서화 |
| tester | CTO | CSO(Do) | 코드 리뷰 시 테스트 커버리지 확인 |
| compliance | CSO | CFO(Check) | 비용 관련 규정 준수 |

---

## 10. 파일 생성/수정 전체 목록

### 10.1 신규 파일 (23개)

| # | 파일 | 유형 |
|---|------|------|
| 1 | `agents/cto/tester.md` | 에이전트 |
| 2 | `agents/cto/devops.md` | 에이전트 |
| 3 | `agents/cto/database.md` | 에이전트 |
| 4 | `agents/cpo/ux-researcher.md` | 에이전트 |
| 5 | `agents/cpo/data-analyst.md` | 에이전트 |
| 6 | `agents/cmo/copywriter.md` | 에이전트 |
| 7 | `agents/cmo/growth.md` | 에이전트 |
| 8 | `agents/coo/sre.md` | 에이전트 |
| 9 | `agents/coo/docs-writer.md` | 에이전트 |
| 10 | `agents/cso/compliance.md` | 에이전트 |
| 11 | `agents/cfo/cost-analyst.md` | 에이전트 |
| 12 | `agents/cfo/pricing-modeler.md` | 에이전트 |
| 13 | `agents/cpo/ux-researcher.md` | 에이전트 |
| 14 | `agents/cpo/data-analyst.md` | 에이전트 |
| 15 | `skills/vais/utils/deploy.md` | 스킬 |
| 16 | `skills/vais/utils/analyze-cost.md` | 스킬 |
| 17 | `skills/vais/utils/write-docs.md` | 스킬 |
| 18 | `skills/vais/utils/growth-audit.md` | 스킬 |
| 19 | `skills/vais/utils/license-check.md` | 스킬 |
| 20 | `skills/vais/utils/pricing.md` | 스킬 |

> `skills/vais/utils/test.md` — 기존 파일 확장 (수정)

### 10.2 수정 파일 (16개)

| # | 파일 | 수정 내용 |
|---|------|----------|
| 1 | `agents/cto/cto.md` | PDCA 테이블 + 위임 규칙 + CP-2 |
| 2 | `agents/cpo/cpo.md` | PDCA 테이블 + 위임 규칙 + sub-agent 호출 순서 |
| 3 | `agents/cmo/cmo.md` | PDCA 테이블 + 위임 규칙 + CP-2 |
| 4 | `agents/coo/coo.md` | PDCA 테이블 + 위임 규칙 + CP-1/CP-2 |
| 5 | `agents/cso/cso.md` | PDCA 테이블 + 위임 규칙 + CP-Q |
| 6 | `agents/cfo/cfo.md` | PDCA 테이블 + 위임 규칙 + CP-1 |
| 7 | `skills/vais/phases/cto.md` | tester/devops/database 위임 반영 |
| 8 | `skills/vais/phases/cpo.md` | data-analyst/ux-researcher 위임 반영 |
| 9 | `skills/vais/phases/cmo.md` | growth/copywriter 위임 반영 |
| 10 | `skills/vais/phases/coo.md` | sre/devops/docs-writer 위임 반영 |
| 11 | `skills/vais/phases/cso.md` | compliance 위임 반영 |
| 12 | `skills/vais/phases/cfo.md` | cost-analyst/pricing-modeler 위임 반영 |
| 13 | `skills/vais/utils/test.md` | 테스트 실행 + 커버리지 확장 |
| 14 | `CLAUDE.md` | Agent Architecture 테이블 전면 업데이트 |
| 15 | `AGENTS.md` | Execution 테이블 전면 교체 |
| 16 | `vais.config.json` | roles.subAgents 필드 추가 |

---

## 11. Implementation Guide

### 11.1 구현 순서

```
Module 1: 에이전트 생성 (16개 .md 파일)
    ├── CTO: tester, devops, database
    ├── CPO: ux-researcher, data-analyst
    ├── CMO: copywriter, growth
    ├── COO: sre, docs-writer
    ├── CSO: compliance
    └── CFO: cost-analyst, pricing-modeler

Module 2: C-Level 오케스트레이터 개편 (6개 .md 수정)
    ├── cto.md — PDCA + 위임 + CP
    ├── cpo.md — PDCA + 위임
    ├── cmo.md — PDCA + 위임 + CP
    ├── coo.md — PDCA + 위임 + CP
    ├── cso.md — PDCA + 위임 + CP
    └── cfo.md — PDCA + 위임 + CP

Module 3: 스킬 생성/수정 (7개 신규 + 7개 수정)
    ├── 신규: deploy, analyze-cost, write-docs, growth-audit, license-check, pricing
    ├── 확장: test.md
    └── Phase 스킬 수정: cto/cpo/cmo/coo/cso/cfo/qa

Module 4: 문서 동기화 (3개 수정)
    ├── CLAUDE.md — Agent Architecture
    ├── AGENTS.md — Execution 테이블
    └── vais.config.json — roles.subAgents

Module 5: 검증
    └── node scripts/vais-validate-plugin.js
```

### 11.2 의존 관계

```
Module 1 (에이전트) ──→ Module 2 (C-Level 개편)
                   ──→ Module 3 (스킬)
Module 2 ──→ Module 4 (문서 동기화)
Module 3 ──→ Module 4
Module 4 ──→ Module 5 (검증)
```

Module 1과 Module 3은 병렬 가능.

### 11.3 Session Guide

| 세션 | 모듈 | 예상 파일 수 |
|------|------|-------------|
| Session 1 | Module 1 (에이전트 16개 생성) | 16 신규 |
| Session 2 | Module 2 (C-Level 6개 수정) | 6 수정 |
| Session 3 | Module 3 (스킬 7+7) | 6 신규 + 7 수정 |
| Session 4 | Module 4 + 5 (동기화 + 검증) | 3 수정 + 검증 |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-04 | 초기 설계 — Option B (Clean Architecture) 전면 개편 |
