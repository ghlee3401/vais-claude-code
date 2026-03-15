---
name: vais
description: VAIS Code 통합 워크플로우 스킬. 9단계 개발 워크플로우를 관리합니다.

  Triggers: vais, help, 도움말, 사용법, 개발, 기획, 설계, 구현, 리뷰, 검토, plan, design, implement, review,
  상태, status, 다음, next, check, gap, test, commit, init, 초기화, 적용, 기존 프로젝트, fix, 수정, 고쳐, 바꿔, 변경,
  아이디어, research, 조사·탐색, 뭐 만들, 만들고 싶, auto, 자동, 시작, 부터, 까지,
  wireframe, 와이어프레임, 화면설계, 목업, mockup, layout, 레이아웃, 화면 구성, 스케치, sketch, prototype, 프로토타입,
  manager, 매니저, 현황, 히스토리, 부채, 의존성, 브리핑

  Do NOT use for: 단순 질문, 코드 없는 대화
argument-hint: "[action] [feature]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TodoWrite, AskUserQuestion
---

# VAIS Code — $0 $1

> 📋Manager → 🔭조사·탐색 → 📋기획 → 🗺IA → 🖼와이어프레임 → 🎨설계(UI+DB) → 💻프론트 → ⚙️백엔드 → 🔎Gap분석 → 🔍검토

## 현재 상태

!`node "${CLAUDE_SKILL_DIR}/../../scripts/get-context.js" "$1" 2>/dev/null`

## 공통 규칙

- 모든 문서(`docs/`)는 **한국어**로 작성 (기술 용어는 원어)
- 피처명은 **영어** (kebab-case: `login`, `payment`, `chat`)
- 피처명 생략 시 → `.vais/status.json`에서 기존 피처 선택 또는 AskUserQuestion으로 입력
- 피처 선택 후 → AskUserQuestion: "추가 지시사항이 있으면 알려주세요" (옵션: "바로 실행", Other)
- 모든 문서 하단에 **변경 이력** 표 포함: `| version | date | change |` — 초기 작성 시 v1.0, 이후 수정마다 버전 증가

## 액션 목록

| 액션 | 설명 |
|------|------|
| `init [feature]` | 기존 프로젝트 분석 → VAIS 문서 역생성 |
| `manager [질문/지시]` | 프로젝트 매니저 (히스토리 조회, 전략 판단, Tech Lead 지시) |
| `auto [feature]` | 전체 자동 워크플로우 (Manager → Tech Lead 오케스트레이션) |
| `research ~ review` | 각 단계 개별 실행 |
| `fix [feature]` | 영향 분석 기반 수정 (Manager → Tech Lead → 팀) |
| `plan:ia:wireframe` | 순차 체이닝 (`:` = 순차) |
| `fe+be` | 병렬 체이닝 (`+` = 병렬) |
| `status` / `next` / `test` / `commit` / `help` | 유틸리티 |

## 체이닝 파싱

1. `:` split → 순차 실행 큐
2. `+` 포함 → Agent 도구로 병렬 호출
3. 각 단계 전 이전 단계 문서 자동 참조
4. 실패 시 즉시 중단

## 병렬 에이전트 매핑

| 체이닝 | 에이전트 A | 에이전트 B |
|--------|-----------|-----------|
| `design` | designer → UI | backend-dev → DB |
| `fe+be` | frontend-dev | backend-dev |

## 실행 지침

!`cat "${CLAUDE_SKILL_DIR}/phases/$0.md" 2>/dev/null || echo "알 수 없는 액션: $0. /vais help 로 사용법을 확인하세요."`
