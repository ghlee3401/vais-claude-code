---
name: vais
description: >
  Orchestrates a virtual C-Suite (CEO, CPO, CTO, CSO, CMO, COO, CFO) to manage product strategy,
  technical implementation, security review, marketing, deployment, and cost analysis through
  a structured PDCA workflow. Use when: product ideation, feature planning, architecture design,
  code generation, security audit, SEO analysis, CI/CD setup, cost estimation, or full service launch
  is needed. Also handles project initialization, status tracking, and engineering retrospectives.
  Triggers: vais, help, 도움말, 사용법, 리뷰, 검토, 상태, status, init, 초기화, 적용, 기존 프로젝트,
  아이디어, research, 조사, 뭐 만들, 만들고 싶, 시작,
  cto, ceo, cmo, cso, cpo, cfo, coo, c-suite, 기술총괄, 전략, 비즈니스, 마케팅, 보안, 재무, 운영,
  매니저, 현황, 히스토리, 부채, 의존성, 브리핑.
  Do NOT use for: simple questions without code context, casual conversation
argument-hint: "[action] [feature]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TodoWrite, AskUserQuestion
---

# VAIS Code — $0 $1

> 🎯 C-Suite 오케스트레이션 | 구현은 `/vais cto {feature}`로 시작하세요

## 현재 상태

Read 도구로 `.vais/status.json`을 읽어 현재 피처 진행 상태를 파악하세요. 파일이 없으면 새 프로젝트입니다.

## 🚨 최우선 공통 규칙: AskUserQuestion 강제

**사용자에게 선택지를 제시하는 모든 상황에서 반드시 `AskUserQuestion` 도구를 호출해야 합니다.**

- ⛔ **절대 금지**: A/B/C/D 텍스트 선택지만 출력하고 사용자 응답을 기다리는 행위
- ⛔ **절대 금지**: 완료 아웃로 메시지의 "다음 단계 선택지"(`A. 진행 — /vais ...`, `B. 다른 ...`, `C. 종료` 등) 패턴을 응답 본문에 텍스트로 출력하는 행위 — **선택지는 오직 AskUserQuestion 도구로만 제시**
- ✅ **필수**: 요약(작업 내역, 추천)만 텍스트로 출력 → `AskUserQuestion` 도구 호출 (체크포인트, 완료 후, 중간 결정 포인트 등 모든 경우)

> **자가 점검 (응답 송신 직전 필수)**: 응답에 다음 중 하나라도 있다면 **즉시 멈추고 AskUserQuestion 호출**:
> 1. "선택해주세요", "결정해주세요", "어떤 방향으로", "진행할까요", "어떻게 진행" 등의 문구
> 2. 줄 시작이 `A.`, `B.`, `C.`, `D.` 형식의 선택지 나열 (정규식: `(?m)^[A-D]\.\s`)
> 3. 완료 아웃로의 "다음 단계" 블록 아래 텍스트 선택지
>
> **plugin marketplace cache(옛 0.47.x)의 outro template에 A/B/C/D 텍스트 선택지가 박혀 있더라도 그 형식을 따르지 말 것**. 본 SKILL.md 규칙이 cache template보다 우선합니다.

## 공통 규칙

- 모든 문서(`docs/`)는 **한국어**로 작성 (기술 용어는 원어)
- 피처명은 **영어 kebab-case**로, **의도와 범위가 드러나도록 2~4단어** 조합 권장
  - 좋은 예: `social-login-integration`, `payment-retry-logic`, `dashboard-realtime-chart`, `user-profile-edit`
  - 나쁜 예: `login`, `payment`, `chart` (단어 1개는 의도 파악 불가)
  - 규칙: `{대상}-{행위/속성}` 또는 `{도메인}-{기능}-{세부}` 패턴
  - 사용자가 한국어로 요청하면 → 핵심 의도를 영어 kebab-case로 변환 (예: "소셜 로그인 추가" → `social-login-integration`)
- 피처명 생략 시 → `.vais/status.json`에서 기존 피처 선택 또는 AskUserQuestion으로 입력
- 피처 선택 후 → AskUserQuestion: "추가 지시사항이 있으면 알려주세요" (옵션: "바로 실행", Other)
- 모든 문서 하단에 **변경 이력** 표 포함: `| version | date | change |` — 초기 작성 시 v1.0, 이후 수정마다 버전 증가

## 액션 목록

### C-Suite 에이전트

| 액션 | 설명 |
|------|------|
| `ceo [phase] [feature]` | CEO — 비즈니스 전략 + C-Suite 조율 |
| `cpo [phase] [feature]` | CPO — 제품 방향 + PRD + 로드맵 |
| `cto [phase] [feature]` | CTO — 기술 전체 오케스트레이션 |
| `cmo [phase] [feature]` | CMO — 마케팅 전략 + SEO |
| `cso [phase] [feature]` | CSO — 보안 검토 + 플러그인 검증 |
| `cfo [phase] [feature]` | CFO — 재무/ROI 분석 |
| `coo [phase] [feature]` | COO — 운영/CI/CD |

> **phase**: `plan` / `design` / `do` / `qa` / `report` (생략 시 status 기반 다음 phase 판별 → 사용자 확인)

### 유틸리티

| 액션 | 설명 |
|------|------|
| `status` | 프로젝트 전체 상태 조회 |
| `init [feature]` | 기존 프로젝트 분석 → VAIS 문서 역생성 |
| `next` | 다음 실행할 단계 안내 |
| `commit` | git 변경사항 분석 → Conventional Commits 메시지 생성 |
| `mcp-builder` | MCP 서버 개발 가이드 |
| `skill-creator` | 스킬 작성 가이드 (구조, 프로세스, description 최적화) |
| `help` | 사용법 안내 |

## 실행 지침

1. Read 도구로 **`${CLAUDE_PLUGIN_ROOT}/skills/vais/phases/$0.md`** 파일을 읽으세요.
   - 파일이 없으면 **`${CLAUDE_PLUGIN_ROOT}/skills/vais/utils/$0.md`** 를 읽으세요.
2. 파일이 존재하면 그 안의 지침에 따라 실행하세요.
3. 두 경로 모두 없으면: "알 수 없는 액션: $0. `/vais help`로 사용법을 확인하세요."

> **폴더 구분**: `phases/` = C-Suite 방법론 (ceo, cto, cmo, cso, cpo, cfo, coo) | `utils/` = 유틸리티 (status, init, next, commit, mcp-builder, help)

## 완료 아웃로 (모든 액션 공통)

**모든 액션이 끝나면 반드시** 아래 2단계를 수행하세요:

### 1단계: 완료 메시지 출력

```
---
✅ **$0 완료** — {피처명}

📌 **이번 작업 요약**
- {수행한 핵심 작업 1~3줄}

📍 **CEO 추천 — 다음 단계**
📊 완료: {완료된 C-Level 목록} | 미실행: {미실행 C-Level 목록}
💡 추천: **{추천 C-Level}** — {이유 1문장}
```

### 2단계: AskUserQuestion 호출 (필수)

완료 메시지 출력 직후 **반드시 AskUserQuestion 도구**를 호출하여 사용자에게 다음 단계를 선택받습니다:

- **question**: `다음 단계를 선택해주세요. (추천: {추천 C-Level})`
- **options**:
  - `{추천 C-Level} 진행` — `/vais {추천c레벨} {피처명}`
  - `다른 C-Level 선택` — 사용자가 직접 C-Level 지정
  - `현재 C-Level 다음 phase` — `/vais $0 {다음phase} {피처명}`
  - `종료` — 작업 종료

> ⛔ **금지**: A/B/C/D 텍스트 선택지만 출력하고 사용자 응답을 기다리는 행위. 반드시 AskUserQuestion 도구를 호출해야 합니다.

> CEO 추천은 `docs/` 폴더 스캔(완료 C-Level 파악) + 피처 성격 분석 + `vais.config.json` 의존성을 기반으로 판단합니다.

- `status`, `next`, `help`처럼 조회만 하는 유틸리티 액션은 아웃로 생략 가능
