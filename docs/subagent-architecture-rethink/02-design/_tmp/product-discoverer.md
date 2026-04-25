---
agent: product-discoverer
phase: design
feature: subagent-architecture-rethink
created: 2026-04-25
---

> Author: product-discoverer
> Phase: 02-design
> Refs: docs/subagent-architecture-rethink/00-ideation/main.md, docs/subagent-architecture-rethink/01-plan/extended-scope.md, docs/subagent-architecture-rethink/01-plan/risk-and-yagni.md
> Summary: VAIS sub-agent 미성숙 통증을 OST로 분해. 8개 기회 노드 도출, 기회별 솔루션 후보 매핑, 5개 실험 설계, 8 risk category 가정 매핑, 통증/기회 발굴 중심 인터뷰 질문 5개 도출.

---

# Opportunity Solution Tree: VAIS Sub-agent 미성숙 해소

## 1. Desired Outcome (목표)

**"VAIS 사용자가 sub-agent를 호출할 때 Project Profile + 정책 게이트로 불필요한 산출물 생성이 차단되고, 정전(正典) 기반 검증된 프레임워크 산출물을 일관성 있게 전달받는다. — 측정 지표: default-execute 호출 비율 0%, 산출물 정책 준수율 95% 이상, 사용자가 의도하지 않은 파일 생성 건수 주 0회."**

Teresa Torres 기준으로, 이 Outcome은 **VAIS 플러그인의 비즈니스 결과(신뢰성)** 와 **사용자 결과(불필요한 작업 감소)** 를 동시에 포함한다. 하나의 Outcome이 두 레이어를 관통하는 것이 이 메타-피처의 특성이다.

---

## 2. Opportunities (기회 노드)

Opportunity Score = Importance × (1 − Satisfaction). 점수는 7점 척도(1~7) 기반 추정값. 사용자 인터뷰 전이므로 가설 점수로 표기.

---

### OPP-1. "sub-agent가 호출되면 항상 뭔가를 만들기 시작한다"

> 사용자 인용: "COO의 경우에는 쓸데없이 ci/cd를 만드는 등의 문제도 있었어." (ideation T6)

- **관찰 사실**: release-engineer는 CI/CD 필요 여부를 판단하는 단계 없이 무조건 파이프라인 설정 파일을 생성한다. infra-architect, test-engineer, seo-analyst, finops-analyst, compliance-auditor도 동일 패턴이 강하게 의심된다.
- **사용자 segment**: VAIS를 실제 프로젝트에 적용하는 모든 사용자 (MVP 단계 개인 개발자부터 소규모 팀까지)
- **빈도**: sub-agent를 호출할 때마다 발생 — **매회**
- **심각도**: 높음. 의도치 않은 파일이 생성되면 삭제·정리에 추가 비용 발생. 더 심각하게는 "AI가 잘못된 방향으로 달린다"는 신뢰 손상.
- **Opportunity Score 추정**: Importance 6/7 × (1 − Satisfaction 1/7) = **5.1**

---

### OPP-2. "이 sub-agent가 무엇을 만드는지 모르겠다"

> 관찰: product-discoverer는 OST를 만드는 에이전트인데, frontmatter description만 봐서는 산출물 형식이 무엇인지 파악 불가. release-engineer는 "CI/CD 설정"이라고만 나와 있어 GitHub Actions yaml인지, Dockerfile인지, 둘 다인지 알 수 없다.

- **사용자 segment**: VAIS를 처음 사용하는 외부 사용자, CEO/CPO 오케스트레이션 중 다음 sub-agent를 선택해야 하는 C-Level
- **빈도**: 처음 사용 시 매번, 새 sub-agent 추가 시마다
- **심각도**: 중간. 사용자가 직접 agent md를 읽어야 하는 추가 인지 부하. 잘못 선택하면 엉뚱한 산출물 생성.
- **Opportunity Score 추정**: Importance 5/7 × (1 − Satisfaction 2/7) = **3.6**

---

### OPP-3. "template이 없거나 빈 양식이라 AI가 멋대로 채운다"

> 관찰: ideation KP-9 — "template 없음"이 압도적. 44개 sub-agent 중 PRD 외 대부분 template 부재. AI가 template 없이 작동하면 매 호출마다 다른 포맷의 산출물이 생성된다.

- **사용자 segment**: VAIS 산출물을 팀원과 공유하거나 외부에 제출해야 하는 사용자
- **빈도**: template 없는 산출물이 필요한 매 호출 시
- **심각도**: 높음. 포맷 일관성 없는 산출물은 신뢰도 하락. 반복 사용 시 "어제 나온 포맷이랑 다르다"는 경험 누적 → 플러그인 포기.
- **Opportunity Score 추정**: Importance 6/7 × (1 − Satisfaction 1.5/7) = **4.7**

---

### OPP-4. "산출물이 이 프로젝트에 맞지 않는다"

> 관찰: ideation KP-11 — DPIA는 PII를 다루는 프로젝트에서만 의미 있고, SEO Audit은 SEO-independent한 internal tool에서는 낭비다. Project Profile이 없으면 모든 산출물이 모든 프로젝트에 동일하게 적용된다.

- **사용자 segment**: internal tool, OSS plugin, API-only 등 특수 유형 프로젝트 사용자
- **빈도**: 프로젝트 특성과 맞지 않는 sub-agent를 호출할 때마다
- **심각도**: 높음. 사용자가 "이거 필요 없는데"를 반복하면 산출물 관리 부담 증가.
- **Opportunity Score 추정**: Importance 5.5/7 × (1 − Satisfaction 1/7) = **4.7**

---

### OPP-5. "산출물이 잘못된 sub-agent에 매핑되어 있다"

> 관찰: ideation KP-9 — Value Proposition Canvas가 copy-writer에 매핑. VPC는 고객 가치 설계 도구이며 product-discoverer/product-strategist 영역이다. 잘못 매핑된 산출물은 wrong agent가 wrong context에서 생성한 낮은 품질 결과로 이어진다.

- **사용자 segment**: CPO 또는 CEO가 product-strategist를 호출했는데 VPC를 얻지 못하고, copy-writer를 호출했을 때 예상치 못한 VPC가 나오는 경험을 하는 사용자
- **빈도**: 잘못 매핑된 산출물이 호출될 때마다
- **심각도**: 중간. 일단 산출물은 나오지만 품질·맥락이 부적합.
- **Opportunity Score 추정**: Importance 4.5/7 × (1 − Satisfaction 2/7) = **3.2**

---

### OPP-6. "비슷한 산출물이 여러 sub-agent에 중복 배치되어 혼란스럽다"

> 관찰: ideation KP-1 — C-Level마다 분리 기준이 자의적. 결과적으로 SWOT 분석은 market-researcher에, 같은 성격의 경쟁 분석은 growth-analyst에도 부분 포함. 어디에 요청해야 하는지 판단이 어렵다.

- **사용자 segment**: 복수의 C-Level/sub-agent를 사용해 본 중급 이상 사용자
- **빈도**: 비슷한 요구를 다른 방식으로 표현할 때마다
- **심각도**: 중간. 명시적 오류는 없지만 중복 산출물 생성 → 저장소 비대화, 정보 충돌.
- **Opportunity Score 추정**: Importance 4/7 × (1 − Satisfaction 2.5/7) = **2.9**

---

### OPP-7. "Core/Why/What/How 단계 간 산출물이 정렬되지 않는다"

> 관찰: ideation KP-5 — "Core에서는 B2B 엔터프라이즈인데 Why 페르소나가 개인 개발자". 단계 간 alignment 검증 메커니즘이 없어 sub-agent들이 각자의 컨텍스트에서 독립 작동하면 모순된 산출물 묶음이 발생한다.

- **사용자 segment**: 전체 제품 개발 라이프사이클에 걸쳐 VAIS를 사용하는 사용자
- **빈도**: Core→Why→What→How 단계 전환 시마다
- **심각도**: 높음. 단계 간 미스매치는 후반부에 가서야 발견되고, 재작업 비용이 크다.
- **Opportunity Score 추정**: Importance 6/7 × (1 − Satisfaction 1/7) = **5.1**

---

### OPP-8. "sub-agent 분리 기준이 C-Level마다 달라서 통일된 예측이 안 된다"

> 관찰: ideation KP-1 — CBO는 도메인 기반, CTO는 기술 레이어 기반, CPO는 phase+산출물 혼합. 같은 플러그인에서 일관된 경험을 기대했는데 C-Level마다 다른 규칙이 작동한다.

- **사용자 segment**: 모든 VAIS 사용자, 특히 복수 C-Level을 순차 호출하는 전체 워크플로우 사용자
- **빈도**: C-Level 전환 시마다 (매 phase 전환)
- **심각도**: 높음. 예측 불가능한 시스템은 신뢰 손상의 직접 원인.
- **Opportunity Score 추정**: Importance 6.5/7 × (1 − Satisfaction 1/7) = **5.6**

---

### Opportunity 우선순위 요약

| 순위 | OPP | 통증 핵심 | Score |
|------|-----|----------|-------|
| 1 | OPP-8 | 분리 기준 비일관 | 5.6 |
| 2 | OPP-1 | Default-execute | 5.1 |
| 2 | OPP-7 | 단계 간 alignment 누락 | 5.1 |
| 4 | OPP-3 | Template 부재 | 4.7 |
| 4 | OPP-4 | 프로젝트 미적합 산출물 | 4.7 |
| 6 | OPP-2 | 정체성 모호 | 3.6 |
| 7 | OPP-5 | 잘못된 매핑 | 3.2 |
| 8 | OPP-6 | 중복 배치 | 2.9 |

---

## 3. Solutions (해법 후보 및 plan 채택 메커니즘 매핑)

각 opportunity당 2~3개 솔루션을 PM / Designer / Engineer 관점에서 도출하고, plan 채택 메커니즘과의 매핑을 명시한다.

---

### OPP-1 대응: Default-execute anti-pattern 해소

**Sol-1-A (채택 메커니즘: 정책 4분류 + Project Profile 게이트)**
> PM 관점: 모든 sub-agent frontmatter에 `execution.policy` 필드를 추가. 호출 전 Project Profile을 조회해 `policy: B(Scope)` 산출물은 Profile 조건을 자동 검증, 조건 불충족 시 생성 스킵.
- 장점: 자동화 → 매번 묻지 않음. Profile 1회 합의로 전 라이프사이클 통제.
- 단점: Profile schema가 잘못되면 silently skip하는 경우 발생.

**Sol-1-B (대안: 명시적 체크리스트 단계 삽입)**
> Engineer 관점: 각 sub-agent Execution Flow 첫 단계에 "필요성 체크리스트 — 다음 조건 중 하나라도 미충족 시 CPO/COO에게 반환" 명시. 자동화 아닌 explicit prompt instruction.
- 장점: 즉시 구현 가능.
- 단점: prompt 의존 → 일관성 보장 불확실.

**Sol-1-C (대안: 사용자에게 확인 후 실행)**
> Designer 관점: sub-agent 호출 시 "이 산출물을 생성할까요? [Y/n]" 한 줄 확인. 기본값 No.
- 장점: 명시적 제어.
- 단점: 옵션 피로 (ideation에서 거부됨 — R5).

**→ 채택: Sol-1-A (정책 4분류 + Profile 게이트). Sol-1-B를 A의 fallback으로 병행.**

---

### OPP-2 대응: 정체성 모호 해소

**Sol-2-A (채택 메커니즘: Template metadata schema + artifact 명시)**
> PM 관점: frontmatter에 `artifacts: [list of artifact names]` 필드 추가. 각 artifact는 카탈로그 참조명으로 연결. 사용자가 C-Level로부터 위임 계약(입력/산출물/검증)을 즉시 파악 가능.

**Sol-2-B (대안: agent 설명 리라이팅 — 산출물 중심으로)**
> Designer 관점: description을 "이 에이전트가 생성하는 것: [리스트]"로 재작성. 기능이 아닌 산출물로 정체성 정의.

**→ 채택: Sol-2-A를 주, Sol-2-B를 표현 가이드라인으로 병행. 메타-원칙 "산출물이 sub-agent를 정의한다" 직접 구현.**

---

### OPP-3 대응: Template 부재/부실 해소

**Sol-3-A (채택 메커니즘: Template depth (c) — sample+checklist+anti-pattern)**
> PM 관점: 우선순위 25개 산출물에 대해 (c) 깊이 template 작성. 각 template은 (1) 채워진 예시, (2) 섹션별 체크리스트, (3) anti-pattern 경고 3파트로 구성.

**Sol-3-B (대안: (b) 깊이 — 가이드라인+예시만)**
> Engineer 관점: 작업량 절감. 빈 포맷 + 작성 가이드만 제공.
- 단점: 사용자가 여전히 형식을 추측해야 함. ideation에서 거부됨.

**Sol-3-C (대안: 외부 정전 template 링크)**
> Designer 관점: Miro, FigJam 공개 template 링크로 대체. 자체 작성 없음.
- 단점: VAIS 컨텍스트 미반영. 외부 의존.

**→ 채택: Sol-3-A. (c) 깊이 template이 메타-원칙의 구체 구현물.**

---

### OPP-4 대응: 프로젝트 미적합 산출물 해소

**Sol-4-A (채택 메커니즘: Project Profile + Scope 정책)**
> PM 관점: ideation 종료 시 Project Profile (type/stage/geography/pii/sla 등 12변수) 1회 합의. policy:B 산출물은 Profile 조건 자동 평가 → 부적합 시 생성 생략.

**Sol-4-B (대안: 각 호출 시 scope 명시 파라미터)**
> Engineer 관점: sub-agent 호출 시 `scope: {project_type, stage}` 파라미터를 명시적으로 전달. Profile 불필요.
- 단점: 매 호출마다 파라미터 전달 부담. 실수 가능성.

**→ 채택: Sol-4-A. Profile 1회 합의로 반복 부담 제거.**

---

### OPP-5 대응: 잘못된 매핑 해소

**Sol-5-A (채택 메커니즘: 44 sub-agent 전체 점검 매트릭스 Q-D)**
> PM 관점: 각 sub-agent를 Q-D "산출물의 owner_agent가 실제 도메인과 맞는가?" 기준으로 점검. VPC → product-strategist 재매핑 등 즉시 수정.

**Sol-5-B (대안: 카탈로그 매트릭스에서 owner_agent를 역방향 조회)**
> Engineer 관점: 산출물 카탈로그를 정전으로 두고, 각 산출물의 owner_agent를 산출물 도메인 지식 기준으로 재선언. sub-agent를 카탈로그에 맞추는 방향.

**→ 채택: Sol-5-B가 메타-원칙("산출물이 sub-agent를 정의한다")에 더 부합. Sol-5-A는 검증 도구.**

---

### OPP-7 대응: 단계 간 alignment 누락 해소

**Sol-7-A (채택 메커니즘: α + β 조합 — auto-judge + alignment 산출물)**
> PM 관점: C-Level 전환 시 auto-judge가 이전 단계 키워드/엔티티 일치율 측정. 임계값 미달 시 `alignment-core-why.md` 등 alignment 산출물 신설 + 사용자 확인 요청.

**Sol-7-B (대안: γ — CEO 게이트)**
> Designer 관점: C-Level 전환 전 CEO가 항상 alignment 검토. 인간형 판단.
- 단점: CEO 부담 증가. 빠른 이터레이션 방해.

**→ 채택: Sol-7-A (α + β). γ는 임계값 이하의 심각한 misalignment 시에만 escalate.**

---

### OPP-8 대응: 분리 기준 비일관 해소

**Sol-8-A (채택 메커니즘: 4단계 프레임 + 메타-원칙 일관 적용)**
> PM 관점: *제품의 탄생* Core/Why/What/How를 모든 C-Level이 참조하는 단일 분류 메타-프레임으로 채택. 각 sub-agent frontmatter에 `phase: [core|why|what|how]` 필드 추가.

**Sol-8-B (대안: C-Level별 분류 원칙 문서화만)**
> Engineer 관점: 변경 없이 각 C-Level agent md에 "분리 기준: {X}" 를 설명 추가. 실제 재구성은 없음.
- 단점: 일관성 개선 없음. 근본 해결 불가.

**Sol-8-C (대안: 메타-원칙 없이 SRP만 적용)**
> Designer 관점: 단일 책임 원칙으로만 분리. "변화 이유가 하나인가?" 기준.
- 단점: SRP는 sub-agent 분리 기준 하나일 뿐. C-Level 간 통일 효과 제한적.

**→ 채택: Sol-8-A. 4단계 + 메타-원칙이 C-Level을 가로질러 일관된 예측 가능성 부여.**

---

## 4. Experiments (가설 검증 실험)

본 피처의 do/qa phase에서 실제로 돌릴 수 있는 실험. Teresa Torres의 "빠르고 저렴한 검증" 원칙 기반.

---

### EXP-1. Project Profile + 정책 게이트 동작 검증

**가설**: Project Profile schema를 입력받고 release-engineer (재정의 후 ci-cd-configurator)를 호출하면, `deployment.target: local-only` 프로파일에서는 CI/CD 파이프라인 생성이 생략된다.

**방법**:
- Profile: `{ type: "oss", stage: "idea", deployment.target: "local-only", sla_required: false }`
- ci-cd-configurator 호출 → 산출물 생성 여부 확인
- 동시에 Profile `{ deployment.target: "cloud", sla_required: true }` 로 동일 실험 → 생성 확인

**성공 지표**:
- local-only 프로파일: 파일 생성 0개 + "Profile 조건 미충족으로 생략" 메시지 출력
- cloud 프로파일: `.github/workflows/ci.yml` 또는 동급 파일 정상 생성

**비용/소요**: 30분 이내. template 1개 + Profile schema만 있으면 실행 가능.

---

### EXP-2. Template depth (c) 산출물 품질 비교

**가설**: depth (c) template (sample+checklist+anti-pattern)을 사용한 product-discoverer 호출이 template 없는 기존 호출보다 산출물 포맷 일관성이 높고 누락 섹션이 적다.

**방법**:
- 동일 인풋(비즈니스 목표 1개)으로 두 조건 호출
- 조건 A: 기존 product-discoverer (template 없음)
- 조건 B: depth (c) OST template 추가 후 동일 호출
- 체크리스트 항목 충족률, Opportunity Score 포함 여부, 인터뷰 질문 포함 여부 측정

**성공 지표**:
- 조건 B에서 필수 섹션(Outcome / Opportunities / Solutions / Experiments / Risk Assumptions) 5개 모두 포함
- 조건 A에서 1개 이상 섹션 누락 또는 비정형 포맷 확인
- 조건 B 산출물 길이: 200줄 이상 (충분한 깊이)

**비용/소요**: 1시간. OST template depth (c) 초안만 작성하면 즉시 실험 가능.

---

### EXP-3. 44 sub-agent Q-D 점검 — 잘못된 매핑 탐지율

**가설**: 44 sub-agent를 산출물 카탈로그 매트릭스와 교차 검증하면 잘못 매핑된 산출물이 3개 이상 발견된다.

**방법**:
- 확장 범위 점검 매트릭스(extended-scope.md 섹션 2) Q-D 기준 적용
- 각 sub-agent의 현재 description/Execution Flow에서 생성 산출물 추출
- 카탈로그 `owner_agent` 컬럼과 대조 → 불일치 집계

**성공 지표**:
- 불일치 3개 이상 발견 → 가설 확증 (VPC/copy-writer가 1개)
- 불일치 탐지 후 재매핑 결정 목록 도출 (디자인 산출물)
- Q-B (default-execute) 대상: 5개 이상 의심 sub-agent 확인

**비용/소요**: 2~3시간. 자동화 스크립트 없이 수작업 매트릭스 검토.

---

### EXP-4. alignment 자동 감지 (α 메커니즘) 프로토타입

**가설**: Core 단계 Vision Statement와 Why 단계 페르소나를 NLP 키워드 비교하면, 불일치 케이스를 70% 이상 감지할 수 있다.

**방법**:
- 의도적 misalignment 케이스 3개 생성:
  - (케이스 A) Core: "B2B 엔터프라이즈 HR 솔루션" / Why 페르소나: "개인 개발자"
  - (케이스 B) Core: "글로벌 소비자 앱" / Why 지역: "국내 한정"
  - (케이스 C) Core: "보안이 핵심 가치" / How: STRIDE template 누락
- 각 케이스에서 키워드 diff 알고리즘 실행 → 불일치 감지 여부 기록

**성공 지표**:
- 3개 케이스 중 2개 이상 감지 (70% 이상)
- False positive율 30% 미만 (정상 케이스 1개 추가 검증)
- 감지 결과를 `alignment-core-why.md` 형식 초안으로 자동 출력

**비용/소요**: 4~8시간. 간단한 keyword-matching 스크립트로 프로토타입.

---

### EXP-5. ux-researcher 외부 인터뷰 — "쓸데없이 만든다" 통증 보편성 확인

**가설**: VAIS 외부 사용자 5명 중 3명 이상이 "AI 에이전트가 자신의 프로젝트에 불필요한 산출물을 생성한 경험이 있다"고 진술한다.

**방법**:
- 5~7명 외부 VAIS 사용자 인터뷰 (아래 인터뷰 질문 섹션 참조)
- Teresa Torres 방식: 최근 경험 중심 오프닝 → 탐색 → 심화 → 닫기
- 통증 경험 여부 + 빈도 + 심각도 기록

**성공 지표**:
- 5명 중 3명 이상: "AI가 내 프로젝트에서 필요 없는 것을 만든 경험 있음" 진술
- 1개 이상 신규 통증 유형 발견 (OPP-1~8에 없는 것)
- Project Profile 12개 변수 중 "이 변수가 없으면 프로필이 불완전하다"는 지적 1개 이상

**비용/소요**: 2~3주 (모집·인터뷰·분석). ux-researcher와 분담.

---

## 5. Risk Assumptions (8 risk category 매핑)

ideation/plan의 리스크를 Teresa Torres + 확장 8카테고리로 재매핑. 각 가정의 **확신도(상/중/하)** + **리스크(상/중/하)** + **검증 방법** 명시.

---

### RA-1. User Value (사용자 가치)

| 가정 | Project Profile + 정책 게이트가 실제로 "쓸데없이 만든다" 통증을 해소한다 |
|------|------|
| **확신도** | 중 — ideation 사용자 1명의 진술 기반. 외부 사용자 미검증. |
| **리스크** | 상 — 이 가정이 틀리면 본 피처 핵심 가치 제안 붕괴 |
| **검증 방법** | EXP-1 (Profile 게이트 동작) + EXP-5 (외부 인터뷰 — 통증 보편성) |

| 가정 | Template depth (c)가 사용자에게 "검증된 프레임워크 산출물을 받는다"는 신뢰를 준다 |
|------|------|
| **확신도** | 중 — 정전 기반 template은 신뢰도 높지만 실제 사용자 반응 미검증 |
| **리스크** | 중 — 산출물이 너무 정형화되어 오히려 유연성 부족 느낄 수 있음 |
| **검증 방법** | EXP-2 (depth c 품질 비교) + 외부 인터뷰에서 "정형 포맷이 도움이 됐는가?" 질문 |

---

### RA-2. Usability (사용성)

| 가정 | Profile 1회 합의 UX가 사용자에게 직관적이다. 합의 직후 "이 설정이 무엇에 영향을 미치는지" 이해한다 |
|------|------|
| **확신도** | 하 — ideation 단계에서 설계 논의만. 실제 인터랙션 테스트 없음 |
| **리스크** | 상 — Profile 12개 변수가 한 번에 나타나면 인지 부하. 오히려 피로감 증가 가능 |
| **검증 방법** | 프로토타입 Profile 합의 스크립트 mock → 테스트 사용자 3명에게 think-aloud 수행 |

| 가정 | `policy: B` 자동 생략이 사용자에게 투명하게 전달된다 (silently skip이 아닌 명시적 skip 메시지) |
|------|------|
| **확신도** | 중 — 설계 의도는 명시적 skip 메시지 포함 |
| **리스크** | 중 — 메시지가 너무 기술적이면 사용자 이해 어려움 |
| **검증 방법** | EXP-1에서 skip 메시지 문구 A/B 2개 작성 → 3명 테스트 사용자에게 "무슨 뜻인지 말해보세요" |

---

### RA-3. Feasibility (실현가능성)

| 가정 | Claude Code sub-agent가 runtime에 Project Profile을 읽어 정책 조건을 평가할 수 있다 |
|------|------|
| **확신도** | 중 — agent가 Read tool로 파일 읽기 가능하므로 Profile yaml 읽기는 feasible. 조건 평가 로직은 prompt instruction으로 구현 |
| **리스크** | 중 — includes[] runtime 미통합(MEMORY.md 참조). Profile 경로 규칙·파싱 오류 가능성 |
| **검증 방법** | EXP-1 구현 전 spike: agent가 `project-profile.yaml`을 Read → 조건 평가 → 분기 결정하는 최소 프로토타입 |

| 가정 | 50+ template을 (c) 깊이로 작성하는 것이 이 팀 규모에서 14~22주 내 완료 가능하다 |
|------|------|
| **확신도** | 하 — R1 리스크(작업량 폭증)가 명시됨. 점진 누적 전략으로 완화 예정 |
| **리스크** | 상 — 전체 완료 기한 초과 → 일부 template 미완성 상태에서 사용자 노출 |
| **검증 방법** | 첫 sprint에서 5개 template (c) 작성 완료 시간 측정 → 전체 timeline 재추정 |

---

### RA-4. Viability (사업성/유지가능성)

| 가정 | 정전 기반 재정의가 VAIS의 외부 채택 가능성을 높인다 (플러그인 시장 경쟁력) |
|------|------|
| **확신도** | 중 — 정전 기반 산출물은 보편적 이해 가능. 단 외부 채택 데이터 없음 |
| **리스크** | 중 — 정전이 특정 문화권 편향일 수 있음 (예: 린 스타트업이 모든 기업에 맞지 않음) |
| **검증 방법** | 외부 인터뷰에서 "이 산출물 목록이 당신 조직에서 바로 사용 가능한가?" 질문 |

---

### RA-5. Ethical (윤리)

| 가정 | sub-agent가 산출물 생성을 자동 생략할 때, 사용자는 이 결정을 AI가 임의로 내린다고 느끼지 않는다 |
|------|------|
| **확신도** | 하 — 자동화된 skip이 사용자 자율성 침해로 느껴질 수 있음 |
| **리스크** | 중 — "AI가 내 대신 결정한다"는 불쾌감 → 신뢰 손상 |
| **검증 방법** | EXP-1에서 skip 발생 시 "재실행하려면 Profile을 수정하세요" + override 옵션 제공 여부 설계 검토 |

---

### RA-6. Compliance/Privacy (컴플라이언스/프라이버시)

| 가정 | Project Profile의 `handles_pii: bool` 변수 하나로 DPIA 생성 여부를 정확하게 판단할 수 있다 |
|------|------|
| **확신도** | 중 — PII 처리 여부가 DPIA의 1차 트리거이지만, GDPR은 처리 규모·민감도 등 추가 기준 존재 |
| **리스크** | 중 — 과소 감지(PII 처리하는데 DPIA 미생성)가 compliance 리스크 |
| **검증 방법** | GDPR 4단계 DPIA 판단 트리 vs. Profile 변수 대조. 누락 케이스 식별 후 schema 보완 |

---

### RA-7. Adoption (채택)

| 가정 | 기존 44개 sub-agent의 재정의·분해·신설이 VAIS 기존 사용자의 워크플로우를 파괴적으로 손상시키지 않는다 |
|------|------|
| **확신도** | 중 — R4 리스크로 명시됨. deprecate alias 1 phase 유지 완화책 있음 |
| **리스크** | 높음 — release-engineer 5분해 후 기존 COO 호출 패턴이 작동 안 할 수 있음 |
| **검증 방법** | 분해 전 회귀 테스트 케이스 작성 → 분해 후 동일 케이스 실행. alias 유지 기간 중 사용 패턴 모니터링 |

| 가정 | ux-researcher 외부 인터뷰 5명 모집이 2주 내 완료된다 |
|------|------|
| **확신도** | 하 — 외부 VAIS 사용자 풀이 현재 알려져 있지 않음 |
| **리스크** | 중 — 인터뷰 모집 실패 시 EXP-5 가설 미검증 → Plan 검증 gap |
| **검증 방법** | 인터뷰 시작 1주일 내 3명 이상 미모집 시 slack 커뮤니티/GitHub issues로 채널 전환 |

---

### RA-8. Technical Debt (기술 부채)

| 가정 | template metadata schema에 새 필드를 추가할 때 기존 agent md들과의 하위 호환이 유지된다 |
|------|------|
| **확신도** | 중 — YAML frontmatter는 선택 필드로 처리 가능하므로 기본 하위 호환 |
| **리스크** | 중 — schema validation이 강화되면 기존 agent md가 일괄 수정 필요 |
| **검증 방법** | schema 확정 후 `scripts/vais-validate-plugin.js` 실행 → 기존 agent md 위반 건수 집계 |

| 가정 | alignment 메커니즘 α(자동 감지)가 향후 LLM 업그레이드 시에도 작동한다 |
|------|------|
| **확신도** | 하 — 키워드 매칭 기반이면 LLM 버전 무관. embedding 기반이면 버전 의존 |
| **리스크** | 중 — LLM 버전 업그레이드 시 embedding 공간 변화 → 감지율 급변 |
| **검증 방법** | α 메커니즘 설계 시 "규칙 기반 keyword 매칭 vs. embedding 유사도" 트레이드오프를 EXP-4에서 명시적으로 결정 |

---

### Risk Assumptions 우선순위 요약 (Assumption Prioritization Canvas)

우상단 = 즉시 검증 필요 (리스크 높음 × 알 수 없음 많음)

| 순위 | 가정 | 리스크 | 알 수 없음 | 검증 실험 |
|------|------|:------:|:--------:|----------|
| 1 | Profile 게이트가 실제로 통증을 해소하는가 | 상 | 상 | EXP-1 + EXP-5 |
| 2 | Profile 합의 UX가 직관적인가 | 상 | 상 | think-aloud 테스트 |
| 3 | 50+ template 작업량이 실현 가능한가 | 상 | 중 | 5개 파일럿 sprint 측정 |
| 4 | 외부 사용자 통증이 보편적인가 | 중 | 상 | EXP-5 |
| 5 | sub-agent 재정의가 기존 워크플로우를 파괴하지 않는가 | 중 | 중 | 회귀 테스트 + alias |
| 6 | alignment α 메커니즘이 70% 이상 감지하는가 | 중 | 중 | EXP-4 |
| 7 | schema 하위 호환이 유지되는가 | 중 | 하 | plugin-validator 실행 |

---

## 6. 인터뷰 질문 (discoverer 담당 — 통증/기회 발굴 중심)

Teresa Torres 방식. 최근 경험 중심. 솔루션 가정 없이 탐색.

**ux-researcher와 분담 원칙**: discoverer는 "어떤 통증이 있었는가", "그 통증이 얼마나 중요한가"를 발굴하는 데 집중. ux-researcher는 "어떻게 해결하려 했는가", "기존 해결 방식의 usability"를 탐색.

---

**Q1. 최근 경험한 "AI가 내가 원하지 않는 것을 만든" 상황**

> "가장 최근에 AI 도구를 사용했을 때 '이건 내가 원한 게 아닌데'라고 느낀 경험을 말씀해 주세요. 어떤 상황이었나요?"

탐색 심화:
- "그때 어떤 감정이 들었나요?"
- "그 결과물을 어떻게 처리하셨나요? (삭제/무시/수정?)"
- "그 이후에도 같은 도구를 계속 쓰셨나요?"

목적: OPP-1 (default-execute) 통증의 실제 경험 탐색 + 심각도 측정.

---

**Q2. 프로젝트 특성에 따라 달랐으면 했던 산출물**

> "지금까지 사용해 본 AI 도구들 중에서, '이 기능은 내 프로젝트엔 필요 없는데'라고 생각한 경험이 있으신가요? 어떤 기능이었나요?"

탐색 심화:
- "그 기능이 왜 필요 없었나요? 프로젝트 특성이 어떤가요?"
- "도구가 그 상황을 스스로 판단해서 생략해 줬으면 좋았을까요, 아니면 물어봤으면 좋았을까요?"

목적: OPP-4 (프로젝트 미적합 산출물) 탐색 + Project Profile 12 변수의 적절성 간접 검증.

---

**Q3. "이 도구가 뭘 하는지 모르겠다"고 느낀 순간**

> "새 AI 기능이나 도구를 처음 쓸 때, '이게 뭘 해주는 건지 모르겠다'고 느낀 경험이 있나요? 어떻게 파악하려 하셨나요?"

탐색 심화:
- "파악하기까지 얼마나 걸렸나요?"
- "파악하지 못한 채로 그냥 써보셨나요? 그 결과는?"
- "어떤 정보가 처음부터 있었다면 도움이 됐을까요?"

목적: OPP-2 (정체성 모호) 탐색 + sub-agent description 개선 방향 수집.

---

**Q4. 산출물 포맷 일관성에 관한 경험**

> "AI 도구를 반복해서 사용했을 때, 같은 요청인데 결과물 형식이 달라서 당황한 경험이 있으신가요? 어떤 상황이었나요?"

탐색 심화:
- "그 불일치가 실제 업무에 어떤 영향을 미쳤나요?"
- "팀원과 공유하거나 고객에게 제출해야 할 때는 어떻게 처리하셨나요?"
- "포맷이 일관됐다면 어땠을 거라고 생각하세요?"

목적: OPP-3 (template 부재) 탐색 + depth (c) template 필요성 검증.

---

**Q5. 가장 중요하지만 아직 해결되지 않은 것**

> "AI 개발 도구 전반에서, 가장 자주 겪는 불편함인데 아직 어떤 도구도 잘 해결하지 못한 게 있다면 무엇인가요?"

탐색 심화:
- "왜 그게 해결이 안 된다고 생각하세요?"
- "만약 그 문제가 해결된다면 가장 크게 달라지는 것은 무엇인가요?"

목적: OPP-1~8에 없는 신규 기회 노드 발굴. 고객 관점에서 가장 중요한 opportunity 우선순위 재조정.

---

## 7. CPO에게 반환 요약

### 핵심 기회 영역 (OST)

- **Desired Outcome**: VAIS 사용자가 sub-agent 호출 시 Profile/정책 게이트로 불필요한 산출물 차단, 검증된 정전 기반 산출물 수령. 측정: default-execute 비율 0%, 산출물 정책 준수율 95%+.

| 기회 | Opportunity Score | 리스크 |
|------|:-----------------:|:------:|
| OPP-8: 분리 기준 비일관 | 5.6 | 상 |
| OPP-1: Default-execute | 5.1 | 상 |
| OPP-7: Alignment 누락 | 5.1 | 상 |
| OPP-3: Template 부재 | 4.7 | 중 |
| OPP-4: 프로젝트 미적합 산출물 | 4.7 | 중 |

### 최우선 검증 가정 (Top 3)

| 가정 | 카테고리 | 리스크 | 확신도 | 검증 방법 |
|------|---------|:------:|:------:|---------|
| Profile 게이트가 실제로 통증을 해소하는가 | User Value | 상 | 중 | EXP-1 + EXP-5 외부 인터뷰 |
| Profile 합의 UX가 사용자에게 직관적인가 | Usability | 상 | 하 | think-aloud 테스트 3명 |
| 50+ template 작업량이 현실적으로 가능한가 | Feasibility | 상 | 하 | 5개 파일럿 sprint 측정 |

### 권장 다음 단계

1. **EXP-1 즉시 실행** — Profile 게이트 동작 검증 (30분, 비용 최저)
2. **EXP-2 실행** — depth (c) template 품질 비교 (1시간)
3. **ux-researcher에 인터뷰 위임** — EXP-5 외부 인터뷰 5명 (2~3주)
4. **EXP-3 실행** — 44 sub-agent 매핑 점검 (2~3시간, 가장 즉시 가능한 전수 진단)
5. **EXP-4 스파이크** — alignment α 메커니즘 프로토타입 (4~8시간, do phase 전 검증)

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — design phase OST 전체 산출. 8개 기회, 16개 솔루션 후보, 5개 실험, 8 risk category 가정 매핑, 인터뷰 질문 5개. |
