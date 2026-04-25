---
owner: cpo
topic: market-personas
phase: design
feature: subagent-architecture-rethink
authors: [product-researcher]
---

# Topic: Market / Personas / Competition (CPO 큐레이션)

> Source: `_tmp/product-researcher.md` (527 lines) → CPO 큐레이션. 내부 진단 + 경쟁 5종 + TAM/SAM/SOM + 3 Personas + Reference Canon 검증 + Journey Map 합성.

## 1. 내부 진단 — VAIS 자체 관찰

### 1.1 44 sub-agent 분포 비대칭

| C-Level | 수 | 비율 | 분리 기준 |
|---------|:--:|:----:|---------|
| CBO | 10 | 22.7% | 도메인 |
| CTO | 8 | 18.2% | 기술 레이어 |
| CSO | 7 | 15.9% | 검사 유형 |
| CPO | 7 | 15.9% | Phase + 산출물 혼합 |
| COO | 4 | 9.1% | 시점 |
| **CEO** | **2** | **4.5%** | 메타 (가장 빈약) |

- 비대칭 극단: **CBO 10 vs CEO 2 = 5:1**
- "배 이상" 차이: CBO(10) vs COO(4) = 2.5배
- COO 과소 + 결함 (release-engineer가 "쓸데없이 만든다" 통증의 직접 원인)

### 1.2 Default-execute 의심 sub-agent 6개 — 정의 발췌 검증

| Agent | 검증 결과 | 핵심 |
|-------|---------|------|
| release-engineer | **명확한 default-execute** | "이미 CI/CD 있는가?" 판단 단계 전무 |
| infra-architect | 12단계 파이프라인 항상 전체 실행 | 기존 스키마 존재 확인 단계 없음 |
| test-engineer | 커버리지 기준 없이 항상 작성 | 1줄 유틸·순수 getter도 무조건 테스트 |
| seo-analyst | seo_dependent 변수 없음 | Internal tool/API-only도 keywords만 주면 실행 |
| finops-analyst | local-only 배포 early-exit 없음 | 클라우드 안 쓰는 프로젝트도 분석 |
| compliance-auditor | handles_pii 변수 없음 | OSS plugin도 GDPR 점검 단계 진입 |

**공통 패턴**: 6개 모두 Input 수신 → 조건 판단 없이 분석 파이프라인 진입. **"필요한가?" Discovery 단계 부재**.

### 1.3 frontmatter description 품질 (skill-validator 기준 6개 점검)

| Agent | 종합 |
|-------|:----:|
| release-engineer | WARN (Use when 조건 자명하지 않음) |
| infra-architect | WARN (조건 누락) |
| test-engineer | PASS |
| seo-analyst | WARN (한국어 서술 — D1 위반) |
| finops-analyst | WARN (한국어 — D1 위반) |
| compliance-auditor | PASS |

**6개 중 4개 WARN**. 전체 44개 미검증 상태. seo/finops는 absorb 시 한국어 description으로 작성됨 → 일관성 결여.

### 1.4 Template 부재 비율 — 88%

| 단계 | 산출물 | 부재 | 비율 |
|------|:------:|:----:|:----:|
| Core | 5 | 5 | **100%** |
| Why | 10 | 8 | 80% |
| What | 11 | 9 | ~82% |
| How | 14 | 12 | ~86% |
| 사업·재무 | 10 | 10 | **100%** |
| **합계** | **~50** | **~44** | **~88%** |

→ PRD 1개 외 사실상 전무. AI 환각으로 새 포맷 만드는 직접 원인.

## 2. 경쟁 분석 (5 framework)

| Framework | 핵심 강점 | 핵심 약점 | VAIS에게 주는 교훈 | 위협 |
|-----------|---------|---------|-----------------|:----:|
| **AutoGPT** | 자율 루프, 바이럴 | 예측 불가, 비표준 산출 | "예측 가능성 > 자율" — 산출물 표준화가 차별점 | 낮음 |
| **CrewAI** | Role-based, 멀티에이전트 | Backstory 자연어 의존, 산출물 비표준 | Backstory 대신 **Artifact 소유**로 경계 정의 | **중간** (구조 유사) |
| **LangGraph** | StateGraph 유연성, Checkpoint | 복잡성, 학습 장벽 | Human-in-the-loop = 게이트 철학 공유. Profile B 정책이 게이트 피로 완화 | 낮음 |
| **AutoGen** (Microsoft) | 멀티에이전트 대화 | 산출물이 대화 로그에 매몰 | 명시적 산출물 경로(_tmp/, main.md) 필요성 확인 | 낮음 |
| **Devin** (Cognition AI) | 코딩 task 자율 실행 | 코딩 외 범위 없음 | CTO phase 품질 = Devin 동등 + 앞뒤(CPO/CSO/COO) 가치 확장 | **중간** (CTO 잠식) |

**핵심 통찰**: 경쟁사는 모두 "agent 만드는 인프라" 또는 "단일 도메인 자동화". VAIS의 차별점은 (1) 도메인 특화(SW 제품 라이프사이클) + (2) 산출물 표준화(정전 기반) + (3) C-Suite 메타포 + Profile×정책 시스템.

## 3. TAM / SAM / SOM (확신도 낮음 — 방향성 확인 용도)

| 레이어 | 추정 | 산출 |
|--------|------|------|
| **TAM** | $1.5~3B | AI agent orchestration 전체. 하향식 $1.5~2B + 상향식 $3.1B 교차 |
| **SAM** | ~35K 설치 / ~1.7~3.4K 유료 | Claude Code 플러그인 사용자 |
| **SOM** | 25~200팀 (1년) | 한국 SaaS/스타트업 + 개인 빌더 집중 |

오차 범위 ±50%. 방향성: agent orchestration이 AI tool 시장 내 고성장 세그먼트.

## 4. 3 Personas (JTBD)

### P1. 솔로 빌더 (1차 타깃, 핵심)

| 항목 | 내용 |
|------|------|
| **역할** | 1인 풀스택 / Solo founder 개발자 |
| **통증** | 모르는 영역(마케팅·재무·보안·운영) 광범위. 팀원 없음. |
| **JTBD** | When 새 피처 시작 / I want 모르는 도메인도 검증된 산출물 / So I can 혼자서 전 영역 커버 |
| **기대** | "쓸데없는 것 안 만들기"가 "빠른 것"보다 우선 |
| **대체재** | ChatGPT / 스타트업 책 / 컨설턴트 / 안 함 |
| **B/C/D 정책 수혜** | **최대** — Profile 기반 자동 skip이 가장 큰 가치 |

**핵심 인사이트**: P1은 "AI가 더 똑똑하길"이 아니라 **"AI가 내 프로젝트에 안 맞는 건 안 만들길"** 원함.

### P2. 스타트업 CTO (2차)

| 항목 | 내용 |
|------|------|
| **역할** | 5~20명 팀 리더, CPO/CTO 겸임 |
| **통증** | 팀 표준화 도구 부재, alignment 검증 시간 부족 |
| **JTBD** | When 새 피처 / I want 팀에게 일관된 검증된 산출물 전달 / So I can 팀 공통어 형성 |
| **기대** | "더 많은 AI 기능"이 아닌 "팀 표준화 도구" |
| **B/C/D 정책 수혜** | A/B 정책 — 일관된 핵심 산출물 |

**핵심 인사이트**: 정전 기반 template이 **team knowledge standard** 역할. ADR/Runbook/PRD가 팀 자산.

### P3. 엔터프라이즈 PM (3차)

| 항목 | 내용 |
|------|------|
| **역할** | 컴플라이언스/문서화 요구 큰 조직의 PM |
| **통증** | "AI 판단에 서명할 근거" 필요. 감사 추적성 |
| **JTBD** | When 컴플라이언스 단계 / I want 정전 출처 명시된 산출물 / So I can 감사 통과 |
| **기대** | "AI가 더 똑똑하길"이 아닌 "AI 결정 근거 명시" |
| **B/C/D 정책 수혜** | B 정책 (DPIA / SLO / Threat Model 등) — 컴플라이언스 자동화 |

**핵심 인사이트**: `_tmp/` 추적성 + 정전 출처 명시(canon_source)가 감사 설득력 핵심.

## 5. Reference Canon 검증 (3 persona × 정전)

| 정전 | P1 (솔로) | P2 (스타트업 CTO) | P3 (엔터프라이즈 PM) |
|------|:---------:|:----------------:|:--------------------:|
| Cagan INSPIRED | ✅ | ✅ | ✅ |
| Torres OST | △ (경량화 필요) | ✅ | ✅ |
| Rumelt Strategy Kernel | ✅ | ✅ | ✅ |
| Christensen JTBD | ✅ | ✅ | ✅ |
| Osterwalder BMC/VPC | ✅ | ✅ | ✅ |
| Skelton Team Topologies | ❌ (1인 적용 불가) | ✅ | ✅ |
| DORA Four Key Metrics | △ | ✅ | ✅ |
| Google SRE Book | △ | ✅ | ✅ |
| Microsoft STRIDE | △ | ✅ | ✅ (B 정책으로 자동) |
| Lean Startup BML | ✅ | ✅ | △ |

**관찰**: 10/10 정전 모두 P2/P3에 유효. P1은 7/10 (Team Topologies/STRIDE/SRE는 직접 적용 어려움). → P1을 위한 **경량화 정전 가이드** 추가 필요 (예: OST → 1인용 Lean OST).

## 6. Customer Journey Map (현재 vs 목표)

### 현재 (As-Is)

```
[온보딩] /vais 첫 호출 → 기대 불명확
    ↓
[ideation] CEO 페르소나 대화 → 산출물 형식 추측
    ↓
[plan] CPO 호출 → PRD 8섹션 (template 있음)
    ↓
[design] sub-agent 위임 → 매번 다른 포맷 산출물 ⚠
    ↓
[do] release-engineer 호출 → CI/CD 자동 생성 ❌ "쓸데없이 만든다"
    ↓
[qa] gap 분석 → 잘못된 산출물 정리에 시간 소비
```

핵심 마찰: 온보딩 + default-execute.

### 목표 (To-Be)

```
[온보딩] /vais ceo ideation → Project Profile 12변수 합의 (1회)
    ↓
[ideation] 종료 시 profile.yaml 자동 생성 + 정책 매핑 미리보기
    ↓
[plan] CPO PRD (정전 출처 명시 — Cagan 기반)
    ↓
[design] sub-agent 위임 → depth(c) template으로 표준 포맷 산출물 ✅
    ↓
[do] release-engineer 호출 → Profile.deployment=local-only → ci-cd-configurator skip ✅
        Profile.deployment=cloud → 정책 B 통과 → 정전 기반 CI/CD 생성
    ↓
[qa] alignment α 자동 검증 → Core↔Why↔What↔How 일치율 리포트
```

3가지 핵심 전환:
1. **Project Profile 의무화** — ideation hook
2. **B/C/D 정책 scope gate** — 자동 skip + 명시적 메시지
3. **Template (c) 정전 출처 명시** — 환각 차단

## 7. CPO 큐레이션 기록

| Source (`_tmp/product-researcher.md`) | 채택 | 거절 | 병합 | 추가 | 이유 |
|----|:----:|:----:|:----:|:----:|------|
| 44 sub-agent 분포 정량화 | ✅ | | | | ideation 진단 검증 |
| 6개 default-execute 정의 발췌 | ✅ | | | | release-engineer 외 5개의 메커니즘 명확화 |
| description 품질 6개 점검 | | | ✅ | | 핵심만 (4/6 WARN), 상세는 _tmp/ 보존 |
| Template 부재 비율 88% | ✅ | | | | 작업량 가시화 |
| 경쟁 5 framework | | | ✅ | | 요약 표 + 핵심 통찰 — 상세 분석은 _tmp/ |
| TAM/SAM/SOM | | | ✅ | | 핵심 수치만, 산출 과정은 _tmp/ |
| 3 Personas | ✅ | | | | UX research 인터뷰 모집 기준에 직접 사용 |
| Reference Canon 검증 | ✅ | | | | P1 경량화 가이드 필요성 식별 |
| Journey Map (현재 vs 목표) | ✅ | | | | 본 피처 가치 가시화 |
| **추가 결정** | | | | ✅ | P1을 위한 "경량화 정전 가이드" 카탈로그에 추가 검토 (do phase 결정) |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 큐레이션 — _tmp/product-researcher.md(527줄) 핵심 추출 |
