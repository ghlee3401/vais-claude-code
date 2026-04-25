---
owner: cpo
topic: strategy-canvas
phase: design
feature: subagent-architecture-rethink
authors: [product-strategist]
---

# Topic: Strategy Canvas (CPO 큐레이션)

> Source: `_tmp/product-strategist.md` (516 lines) → CPO 큐레이션. Lean Canvas + JTBD + Strategy Kernel + 4단계 프레임 시각화 + SWOT + 3-Year Vision 합성.

## 1. Lean Canvas (Maurya 9 블록)

### Problem (Top 3)

1. **Default-execute anti-pattern** — release-engineer 외 5개 sub-agent 동일 패턴. "쓸데없이 CI/CD 만든다"가 살아있는 증거.
2. **분리 기준 자의성** — C-Level마다 다른 렌즈(도메인/레이어/시점/검사유형/Phase). 외부 사용자가 "이 에이전트가 뭘 하는지" 답할 수 없음.
3. **Template·Skill 공백** — PRD 외 50+ 산출물의 88%에 (c) 깊이 template 없음. AI가 매 호출마다 포맷 발명.

**현재 불만족 대안**: 사용자 직접 프롬프트 / 범용 AI(ChatGPT) / 외부 노코드 툴 — 모두 "맥락 없음 + 비표준 + 워크플로우 단절".

### Customer Segments

- **1차**: 솔로 빌더 / 1인 기술 창업자 — 풀스택, 모르는 영역 넓음, AI C-Suite 가장 적합
- **2차**: 소규모 팀 PM / Lead Developer — CPO·CTO 겸임, 검증된 프레임워크가 팀 공통어 역할
- **얼리어답터**: Claude Code 마켓플레이스 채택자 + AI 워크플로우 자동화 개방적 사용자

### Unique Value Proposition

> **헤드라인**: "AI C-Suite가 당신의 지식 격차를 메우는 의수(prosthesis)가 된다. 모르는 영역도 검증된 프레임워크 기반 산출물로 결정한다."
>
> **서브헤드**: 어떤 sub-agent를 호출해도 프로젝트 특성(Project Profile)과 실행 정책(A/B/C/D)에 맞는 산출물만 생성한다. "쓸데없이 만드는" AI는 더 이상 없다.

### Solution (Top 3)

- **S-1**: Project Profile + 실행 정책 게이트 (핵심 메커니즘)
- **S-2**: 메타-원칙 "산출물이 sub-agent를 정의한다" — 50+ 카탈로그를 4단계에 매핑, 정전 출처 명시
- **S-3**: Template depth (c) — sample + checklist + anti-pattern

### Channels / Revenue / Cost

- **Channels**: Claude Code Marketplace (1차) + GitHub OSS + 콘텐츠/커뮤니티
- **Revenue**: 현재 OSS, monetization_active=false. 가설 경로: 마켓플레이스 프리미엄 / Enterprise 커스터마이징 / Advisor Tool pass-through
- **Cost**: Anthropic API (Advisor 월 $200) + 설계 시간 + Claude API 호출 (opus C-Level / sonnet sub-agent)

### Key Metrics — North Star

> **NSM = "유해 산출물 차단율"** — Profile 정책으로 skip된 sub-agent 비율. 목표 30%+.

AARRR 분해:
| Funnel | 지표 |
|--------|------|
| Acquisition | GitHub Star / Marketplace 설치 |
| Activation | 최초 `/vais ceo` → `project-profile.yaml` 생성 완료율 |
| Retention | 7일 내 2회 이상 `/vais` 호출 비율 |
| Referral | OSS PR 기여자 / 블로그 공유 |
| Revenue | (현재 없음) skip 덕분에 미발생 토큰 비용 절감액 |

### Unfair Advantage

1. **정전 기반 산출물 카탈로그** — Rumelt/Cagan/Torres/Osterwalder/SRE Book/DORA 1:1 매핑은 단순 "template 추가"로 복제 불가
2. **Profile × 정책 48개 교차 판단 규칙** — 실제 통증에서 역산됨
3. **C-Level 3계층 아키텍처 + PDCA + 게이트** — 단일/flat agent와 구조적 차이
4. **Mirror→Prosthesis 전환 개념** — 사용자 모름을 채우면서 모름을 드러내는 구조

## 2. JTBD 6-Part Statement (Ulwick / Christensen)

| Part | 내용 |
|------|------|
| **When** | 새 피처 시작 / 기존 서비스 영역(보안·배포·비용) 점검 시 |
| **I want to** | 모르는 영역(마케팅·재무·보안·운영)도 검증된 프레임워크 산출물을 빠르게 |
| **So I can** | 혼자서도 팀처럼 전 영역 커버 + 정전 수준 근거로 이해관계자 설득 |
| **Better than** | 범용 AI에 "SWOT 분석해줘" — 매번 포맷 다름, 히스토리 단절 |
| **Available alternatives** | 범용 AI 직접 / Notion AI / 외부 컨설턴트 / 책 정독 후 직접 작성 |
| **Constraints** | 빠른 속도 (스타트업 피벗) + 비용 통제 (개인/소규모) + 모든 정전 학습 불가 |

**Geoffrey Moore Positioning**: For solo founders & small-team PMs needing full product coverage without a full team, VAIS Code is the AI C-Suite plugin that delivers canon-grounded deliverables matched to project profile — unlike generic AI tools generating arbitrary formats with no workflow continuity, VAIS knows what to build, what to skip, and why.

## 3. Strategy Kernel (Rumelt — Diagnosis / Guiding Policy / Coherent Actions)

### Diagnosis

> "VAIS Code의 44 sub-agent는 분리 기준이 자의적, 실행 판단 메커니즘 부재, 산출물 포맷 표준 부재. **사용자 지식 부족이 아닌, 모름을 시스템에 내재화하는 프로토콜의 부재**가 원인."

### Guiding Policy (2개)

1. **산출물 우선** — sub-agent를 먼저 정의하고 산출물 붙이는 게 아니라, 정전에서 산출물을 먼저 정의하고 그 산출물을 만드는 sub-agent를 역산
2. **Profile 기반 실행 제어** — "무엇을 만들 것인가"는 Project Profile + 4분류 정책이 결정. sub-agent는 실행 여부를 스스로 판단하지 않음

### Coherent Actions (CA-1~7)

| # | 행동 | 지도 정책 |
|---|------|---------|
| CA-1 | *제품의 탄생* 4단계로 50+ 카탈로그 재구성 | 산출물 우선 |
| CA-2 | 산출물 frontmatter에 정전 출처/owner/정책/대안 명시 | 산출물 우선 + Profile 제어 |
| CA-3 | Project Profile schema 확정 + ideation 종료 hook | Profile 제어 |
| CA-4 | release-engineer 5분해 + 의심 5 sub-agent 정책 적용 | Profile 제어 |
| CA-5 | Template depth (c) 작성 | 산출물 우선 |
| CA-6 | 44 전체 sub-agent anti-pattern 점검 매트릭스 (확장 C) | 두 정책 모두 |
| CA-7 | alignment 메커니즘 (α + β) 설계 | 산출물 우선 |

## 4. SWOT (VAIS Code 자체)

### Strengths
- S1. C-Suite 레이어 아키텍처 (Opus 전략 + Sonnet 실행)
- S2. PDCA 게이트 워크플로우 — "기획 없이 코드 금지"
- S3. Claude Code 네이티브 통합 — `/vais` 단일 진입
- S4. 산출물 추적성 — `docs/{feature}/{phase}/main.md` + `_tmp/{slug}.md`
- S5. CEO 동적 라우팅
- S6. 정전 기반 설계 의도 (Reference Canon 명시)

### Weaknesses (본 피처 해소 대상)
- **W1. Default-execute anti-pattern** — 핵심 통증
- **W2. 분리 기준 자의성** — 5 C-Level 다른 렌즈
- **W3. Template·Skill 공백** — 88% 부재
- **W4. CEO sub-agent 빈약** — absorb-analyzer + skill-creator 2개뿐
- W5. includes[] 런타임 미통합 (project memory 참조)
- W6. 지식 거울 구조 — 사용자 모름 영역에 sub-agent도 미성숙 (COO 4개 대표)

### Opportunities
- O1. Claude Code Marketplace 성장 / O2. AI-native 워크플로우 수요 / O3. 정전 기반 차별화
- O4. Enterprise 수요 (사내 ADR·Runbook·DPIA 자동화) / O5. OSS 커뮤니티 / O6. Advisor Tool 확장

### Threats
- T1. 범용 AI 진화 (ChatGPT/Claude.ai) / T2. Devin/Copilot Workspace 직접 경쟁 (CTO 잠식)
- T3. Anthropic 플랫폼 정책 변경 / T4. Sub-agent proliferation 피로 (44→48+) / T5. 정전 단일 정박 (D-7로 완화)

## 5. 4단계 메타-프레임 × 정전 cross-reference

`_tmp/product-strategist.md` 섹션 3에서 17개 정전을 4단계에 매핑한 상세표 제공. 핵심 매핑만 발췌:

| 단계 | 핵심 정전 |
|------|---------|
| **Core** | Rumelt (Strategy Kernel) / Doerr (OKR) / Collins (BHAG) / Amazon (PR/FAQ) / McKinsey (3-Horizon) |
| **Why** | Cagan / Torres (OST) / Christensen (JTBD) / Osterwalder (VPC) / Steve Blank (TAM) / Cooper (Persona) |
| **What** | Maurya (Lean Canvas) / Osterwalder (BMC) / Ellis (NSM) / McClure (AARRR) / Cohn (User Story) |
| **How** | Skelton (Team Topologies) / DORA / Google SRE / Microsoft STRIDE / OWASP / ISTQB / Nygard (ADR) / Brown (C4) |

## 6. 3-Year Vision (3-Horizon)

### H1 (now — 2026 Q2~Q3): VAIS v1.0 stable
- 50+ 카탈로그 4단계 분류 완료
- Project Profile schema v1 + ideation hook 작동
- Template (c) 25개 우선 / 점진 50개
- release-engineer 5분해 + 의심 5 정책 적용
- CEO 7개 / COO 9개 sub-agent

### H2 (1~2년 — 2027~2028): VAIS v2.0 — 모름의 시스템 처리 레이어
- **Epistemic Contract** (선반 보관, D-11) — C-Level이 자기 지식 한계 명시
- **Uncertainty Reporting** — 산출물에 `confidence:` 필드 (0~100)
- **Absorb 대화 강제** — 외부 reference 흡수 시 사용자 1:1 강제
- **Alignment 검증** — α (auto-judge) + β (alignment 산출물) 운영화

### H3 (3년+ — 2029+): VAIS Ecosystem
- Community Template Registry (peer-review + canon_source 검증)
- Project Profile Marketplace (업종별 preset)
- VAIS Federation (cross-project 산출물 검색)
- Enterprise VAIS (사내 template 레지스트리 + 사내 Profile preset)

## 7. 경쟁 포지셔닝 (요약)

| vs | 핵심 차이 |
|----|---------|
| **AutoGPT/CrewAI** | 도메인 특화 vs 범용. VAIS는 SW 제품 라이프사이클에 사전 정의된 6 C-Level + 산출물 계약 |
| **LangGraph** | "사용 주체" 차이 — 개발자 인프라 vs (비)개발자 제품. VAIS의 가치는 구현 스택 아닌 C-Suite 모델 + 카탈로그 + 정책 조합 |
| **Devin/Copilot Workspace** | "코드 작성"만 vs 전체 라이프사이클. CTO phase 품질을 Devin 수준 + 그 앞뒤(CPO/CSO/COO/CBO)로 가치 확장 |
| **일반 Claude Code Plugin** | "개발자의 손 확장" vs "개발자의 팀 확장" |

## 8. CPO 큐레이션 기록

| Source (`_tmp/product-strategist.md`) | 채택 | 거절 | 병합 | 추가 | 이유 |
|----|:----:|:----:|:----:|:----:|------|
| Lean Canvas 9 블록 | ✅ | | | | UVP·Solution·UA·NSM 모두 적합 |
| JTBD 6-Part + Positioning Statement | ✅ | | | | 명확 — design 후 PRD에 직접 활용 |
| 4단계 프레임 시각화 (17 정전 매핑) | | | ✅ | | 핵심 매핑만 발췌, 상세표는 _tmp/ 보존 |
| SWOT (S1~6, W1~6, O1~6, T1~5) | ✅ | | | | 본 피처 해소 대상(W1~4) 명시 가치 |
| Strategy Kernel (CA-1~7) | ✅ | | | | Rumelt 표준 — Plan Decision Record와 정렬 |
| 3-Year Vision (H1/H2/H3) | ✅ | | | | 선반 보관 항목(epistemic contract 등)의 도입 시점 명확화 |
| 경쟁 포지셔닝 (4 비교) | | | ✅ | | 요약만 채택, 상세는 _tmp/ 보존 |
| Cost/Revenue/Channel | | | ✅ | | 핵심만 채택 (현재 OSS) |
| 메타-메모 (design 결정 4건) | | | | ✅ | `key-design-decisions.md`로 통합 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 큐레이션 — _tmp/product-strategist.md(516줄) 핵심 추출 |
