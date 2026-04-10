# VAIS Code C-Suite 관계·역할·시나리오 가이드

> **작성일**: 2026-04-09
> **대상 버전**: v0.49.2
> **목적**: 7개 C-Level의 관계·역할을 시각화하고, 상황별 시나리오로 협업 방식 이해

## 🗺️ Part 1. 관계 맵 (누가 누구와 협업하는가)

```mermaid
flowchart TD
    User([👤 사용자])

    CEO[🎯 CEO<br/>Product Owner<br/>동적 라우팅]

    CPO[📋 CPO<br/>제품 기획·PRD]
    CTO[⚙️ CTO<br/>기술 구현]
    CSO[🔒 CSO<br/>보안·품질]
    CMO[📢 CMO<br/>마케팅·SEO]
    COO[🚀 COO<br/>배포·운영]
    CFO[💰 CFO<br/>재무·가격]

    User <==>|요청·승인| CEO

    CEO -->|위임| CPO
    CEO -->|위임| CTO
    CEO -->|위임| CSO
    CEO -->|위임| CMO
    CEO -->|위임| COO
    CEO -->|위임| CFO

    CPO -.PRD 전달.-> CTO
    CPO -.ICP·JTBD.-> CMO
    CTO <-.보안 루프.-> CSO
    CTO -.배포 핸드오프.-> COO
    CTO -.아키 비용.-> CFO
    CMO -.성능 개선 요청.-> CTO

    style CEO fill:#ffd700,stroke:#333,stroke-width:3px
    style User fill:#e0f0ff,stroke:#333,stroke-width:2px
```

**읽는 법**
- **굵은 양방향 화살표 (`<==>`)**: 사용자↔CEO의 주요 대화 채널
- **실선 화살표 (`-->`)**: CEO의 공식 위임
- **점선 화살표 (`-.->`)**: C-Level 간 직접 협업/핸드오프

---

## 👥 Part 2. 각 C-Level의 역할 카드

```mermaid
flowchart LR
    subgraph CEO_Card[🎯 CEO - 전체 지휘]
        CEO1[Product Owner]
        CEO2[동적 라우팅]
        CEO3[최종 의사결정]
        CEO4[사용자 체크포인트]
    end

    subgraph CPO_Card[📋 CPO - 무엇을 만들지]
        CPO1[제품 기획]
        CPO2[PRD 작성]
        CPO3[UX 리서치]
        CPO4[시장 조사]
    end

    subgraph CTO_Card[⚙️ CTO - 어떻게 만들지]
        CTO1[아키텍처 설계]
        CTO2[Frontend/Backend]
        CTO3[DB·인프라]
        CTO4[QA·장애 대응]
    end

    subgraph CSO_Card[🔒 CSO - 안전한가]
        CSO1[OWASP 보안 감사]
        CSO2[플러그인 검증]
        CSO3[독립 코드 리뷰]
        CSO4[GDPR·컴플라이언스]
    end

    subgraph CMO_Card[📢 CMO - 어떻게 알릴지]
        CMO1[SEO 감사]
        CMO2[카피라이팅]
        CMO3[그로스 펀넬]
        CMO4[랜딩 페이지]
    end

    subgraph COO_Card[🚀 COO - 어떻게 돌릴지]
        COO1[CI/CD]
        COO2[모니터링·SRE]
        COO3[배포 자동화]
        COO4[성능 관리]
    end

    subgraph CFO_Card[💰 CFO - 얼마에 팔지]
        CFO1[클라우드 비용]
        CFO2[ROI 계산]
        CFO3[가격 전략]
        CFO4[Unit Economics]
    end
```

---

## 🎬 Part 3. 상황별 시나리오

### 📖 시나리오 1: 신규 SaaS 서비스 풀 런칭 (6개 C-Level 전부)

> **상황**: "온라인 서점 서비스를 런칭해줘"

```mermaid
sequenceDiagram
    actor U as 👤 사용자
    participant CEO
    participant CPO
    participant CTO
    participant CSO
    participant COO
    participant CMO
    participant CFO

    U->>CEO: "온라인 서점 서비스 런칭"
    CEO->>CEO: 피처 분석
    CEO->>U: CP-1 범위? (최소/표준/확장)
    U-->>CEO: "표준"
    CEO->>U: CP-R 다음 C-Level? (CPO 추천)
    U-->>CEO: 승인

    rect rgb(240, 248, 255)
        Note over CPO: 무엇을 만들까?
        CEO->>CPO: 제품 기획 위임
        CPO->>CPO: discoverer → strategist + researcher → prd-writer
        CPO-->>CEO: PRD 완성 📋
    end

    CEO->>U: CP-L2 다음은 CTO?
    U-->>CEO: 승인

    rect rgb(255, 248, 240)
        Note over CTO: 어떻게 만들까?
        CEO->>CTO: 기술 구현 위임
        CTO->>CTO: CP-0 PRD 검사 ✅
        CTO->>CTO: plan → design(UI+Infra 병렬)
        CTO->>CTO: do(FE+BE+Test 병렬) → qa
        CTO-->>CEO: 구현 완료 ⚙️
    end

    rect rgb(255, 240, 240)
        Note over CSO: 안전한가?
        CEO->>CSO: 보안 검토 위임
        CSO->>CSO: Gate A(OWASP) + Gate C(code-review)
        CSO-->>CEO: ✅ 통과 🔒
    end

    rect rgb(240, 255, 240)
        Note over COO: 어떻게 돌릴까?
        CEO->>COO: 배포 위임
        COO->>COO: CI/CD + 모니터링 설정
        COO-->>CEO: 배포 준비 🚀
    end

    rect rgb(255, 240, 255)
        Note over CMO: 어떻게 알릴까?
        CEO->>CMO: 마케팅 위임
        CMO->>CMO: SEO + 카피 + 그로스 펀넬
        CMO-->>CEO: ✅ SEO 87점 📢
    end

    rect rgb(255, 255, 220)
        Note over CFO: 얼마에 팔까?
        CEO->>CFO: 가격 위임
        CFO->>CFO: 비용 분석 + 가격 모델
        CFO-->>CEO: $19/mo 추천 💰
    end

    CEO->>U: CP-L3 최종 리뷰
    U-->>CEO: 승인
    CEO->>U: ✅ 런칭 완료
```

---

### 🔄 시나리오 2: 보안 이슈 발견 → CSO↔CTO 수정 루프

> **상황**: CSO가 SQL Injection을 발견하면 어떻게 흐르는가

```mermaid
sequenceDiagram
    participant CEO
    participant CSO
    participant CTO
    participant IR as 🚨 incident-responder

    CEO->>CSO: 보안 검토
    CSO->>CSO: Gate A(security-auditor)

    Note over CSO: ⚠️ SQL Injection 2건<br/>⚠️ XSS 1건 발견

    CSO->>CEO: Critical 3건 보고
    CEO->>CTO: 수정 요청 (이슈 목록)

    rect rgb(255, 240, 240)
        Note over CTO: 1차 수정
        CTO->>CTO: backend-engineer 수정
        CTO-->>CSO: 수정 완료
        CSO->>CSO: 재검토
        Note over CSO: ⚠️ 1건 미해결
    end

    rect rgb(255, 230, 230)
        Note over CTO: 2차 수정
        CSO->>CTO: 재수정 요청
        CTO->>CTO: backend-engineer 재수정
        CTO-->>CSO: 수정 완료
        CSO->>CSO: 재검토
        Note over CSO: ⚠️ 여전히 미해결<br/>(3회 초과)
    end

    rect rgb(255, 220, 220)
        Note over IR: incident-responder 호출
        CSO->>IR: systematic debugging 요청
        IR->>IR: Phase 1 Investigate
        IR->>IR: Phase 2 Analyze
        IR->>IR: Phase 3 Hypothesize
        IR->>IR: Phase 4 Implement
        IR-->>CTO: Root cause + 근본 해결책
    end

    CTO->>CTO: 근본 수정
    CTO-->>CSO: 완료
    CSO->>CSO: 최종 검토
    CSO->>CEO: ✅ 모든 Gate 통과
```

---

### ➕ 시나리오 3: 기존 서비스에 작은 피처 추가

> **상황**: "결제 페이지에 카카오페이 추가해줘"

```mermaid
sequenceDiagram
    actor U as 👤 사용자
    participant CEO
    participant CPO
    participant CTO
    participant CSO
    participant COO

    U->>CEO: "카카오페이 추가"
    CEO->>CEO: 분석: 작은 피처 + payment 키워드
    Note over CEO: payment 키워드 감지<br/>→ CSO 필수

    CEO->>U: CP-R: CPO→CTO→CSO→COO 추천
    U-->>CEO: 승인

    CEO->>CPO: 간략 PRD 업데이트 (최소 범위)
    CPO-->>CEO: ✅ 기존 PRD에 섹션 추가

    CEO->>CTO: 구현
    CTO->>CTO: backend(API) + frontend(UI) 병렬
    CTO-->>CEO: ✅

    CEO->>CSO: 보안 검토 (payment → 필수)
    CSO->>CSO: Gate A OWASP 집중 검사
    CSO-->>CEO: ✅ 통과

    CEO->>COO: 배포
    COO->>COO: staging → canary → production
    COO-->>CEO: ✅ 배포 완료

    CEO->>U: ✅ 완료 (CMO/CFO 스킵 - 기존 서비스)
```

---

### 🚨 시나리오 4: 프로덕션 장애 대응

> **상황**: "프로덕션에서 500 에러 급증"

```mermaid
sequenceDiagram
    actor U as 👤 사용자
    participant CEO
    participant CTO
    participant IR as 🚨 incident-responder
    participant QA as qa-engineer
    participant COO

    U->>CEO: "500 에러 급증!"
    CEO->>CTO: 긴급 위임
    CTO->>IR: 즉시 호출 (production incident)

    rect rgb(255, 220, 220)
        Note over IR: 4-Phase Systematic Debugging

        IR->>IR: Phase 1 Investigate<br/>(로그·trace·metric 수집)
        Note over IR: DB connection pool<br/>exhaustion 의심

        IR->>IR: Phase 2 Analyze<br/>(패턴·블래스트 반경)
        Note over IR: 특정 쿼리가<br/>연결 점유 중

        IR->>IR: Phase 3 Hypothesize<br/>(3개 가설)
        Note over IR: H1 slow query<br/>H2 leak<br/>H3 traffic spike

        IR->>IR: Phase 4 Implement<br/>(최소 변경 수정)
        Note over IR: H2 확정 → connection<br/>leak fix
    end

    IR-->>CTO: Root cause + hotfix
    CTO->>QA: 회귀 테스트
    QA-->>CTO: ✅
    CTO->>COO: 긴급 배포
    COO->>COO: canary rollout
    COO-->>CTO: ✅ 정상화
    CTO->>CEO: 장애 복구 완료
    CEO->>U: ✅ + 포스트모템 예정
```

---

### 💸 시나리오 5: 클라우드 비용 최적화

> **상황**: "AWS 비용이 월 $5k → $2k로 줄이고 싶다"

```mermaid
sequenceDiagram
    actor U as 👤 사용자
    participant CEO
    participant CFO
    participant CTO

    U->>CEO: "AWS 비용 60% 절감"
    CEO->>U: CP-R: CFO→CTO 순 추천
    U-->>CEO: 승인

    rect rgb(255, 255, 220)
        Note over CFO: 비용 진단
        CEO->>CFO: 비용 분석
        CFO->>CFO: finops-analyst
        Note over CFO: RDS $2k<br/>EC2 $2k<br/>S3 $500<br/>CloudFront $500
        CFO->>CFO: 절감안 3가지 작성
        CFO-->>CEO: 💡 제안<br/>① Aurora Serverless<br/>② EC2 → Fargate<br/>③ S3 IA
    end

    CEO->>U: 어떤 안?
    U-->>CEO: "①+③ 채택"

    rect rgb(255, 248, 240)
        Note over CTO: 아키텍처 리팩터
        CEO->>CTO: 마이그레이션 위임
        CTO->>CTO: db-architect + infra-architect
        CTO->>CTO: plan → design → do → qa
        CTO-->>CEO: ✅ 마이그레이션 완료
    end

    rect rgb(255, 255, 220)
        Note over CFO: 효과 검증
        CEO->>CFO: 절감 효과 검증
        CFO-->>CEO: ✅ 월 $5k → $2.3k<br/>(54% 절감 달성)
    end

    CEO->>U: 완료
```

---

### 📣 시나리오 6: 마케팅 캠페인 (CMO→CTO 역방향 요청)

> **상황**: "런칭 이벤트 마케팅을 하고 싶다"

```mermaid
sequenceDiagram
    actor U as 👤 사용자
    participant CEO
    participant CPO
    participant CMO
    participant CTO

    U->>CEO: "런칭 이벤트 마케팅"
    CEO->>U: CP-R: CPO→CMO→(CTO 필요시)
    U-->>CEO: 승인

    rect rgb(240, 248, 255)
        Note over CPO: 타깃 정의
        CEO->>CPO: 타깃 고객
        CPO->>CPO: ux-researcher + data-analyst
        CPO-->>CEO: ICP + JTBD 정의
    end

    rect rgb(255, 240, 255)
        Note over CMO: 마케팅 전략
        CEO->>CMO: 캠페인 실행
        CMO->>CMO: growth-analyst<br/>+ seo-analyst<br/>+ copy-writer<br/>(병렬)
        CMO->>CMO: QA - SEO 점수 체크
        Note over CMO: ⚠️ 73점 (< 80)<br/>LCP 3.2s 문제
    end

    CMO->>CEO: Core Web Vitals 개선 필요
    CEO->>U: CMO가 CTO 도움 요청, 진행?
    U-->>CEO: 승인

    rect rgb(255, 248, 240)
        Note over CTO: 성능 개선
        CEO->>CTO: 프론트엔드 최적화
        CTO->>CTO: frontend-engineer<br/>(image optim + code split)
        CTO-->>CEO: ✅ LCP 1.8s
    end

    CEO->>CMO: 재검증 요청
    CMO->>CMO: SEO 재측정
    CMO-->>CEO: ✅ 89점 통과

    CEO->>U: ✅ 캠페인 런치 준비 완료
```

---

## 🎯 Part 4. 어떤 시나리오에 어떤 C-Level이 참여하는가 (요약)

```mermaid
flowchart LR
    S1[1. 신규 서비스<br/>풀 런칭]
    S2[2. 보안 이슈<br/>수정 루프]
    S3[3. 작은 피처<br/>추가]
    S4[4. 프로덕션<br/>장애]
    S5[5. 비용<br/>최적화]
    S6[6. 마케팅<br/>캠페인]

    S1 --> ALL[CEO+CPO+CTO+CSO+COO+CMO+CFO<br/>전원]
    S2 --> C1[CEO+CSO↔CTO+IR]
    S3 --> C2[CEO+CPO+CTO+CSO+COO]
    S4 --> C3[CEO+CTO+IR+COO]
    S5 --> C4[CEO+CFO+CTO]
    S6 --> C5[CEO+CPO+CMO+CTO]

    style ALL fill:#ffd700
    style C1 fill:#ffcccc
    style C2 fill:#ccffcc
    style C3 fill:#ffaaaa
    style C4 fill:#ffffcc
    style C5 fill:#ffccff
```

---

## 💡 핵심 이해 포인트

1. **CEO는 지휘자, 아닌 실행자** — 직접 코드를 쓰지 않음. 항상 "다음 누구?"를 판단하고 사용자에게 묻는다
2. **CTO가 중심 허브** — 거의 모든 시나리오에서 CTO가 등장. 다른 C-Level의 요청을 실행으로 전환
3. **CSO는 독립 감시자** — CTO가 만든 것을 독립적으로 검증. 발견 시 CTO로 루프 백
4. **CPO → CTO 단방향** — 기획이 구현보다 먼저 (CP-0 게이트)
5. **CMO → CTO 역방향 가능** — SEO/성능 문제는 CTO 수정 필요
6. **CFO는 수치 검증자** — 비용·ROI·가격의 최종 수치 책임
7. **incident-responder는 비상 에스컬레이션** — 3회 실패 또는 production 장애 시 자동 호출
