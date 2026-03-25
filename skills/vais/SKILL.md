---
name: vais
description: >
  VAIS Code 통합 워크플로우 스킬. 6단계 개발 워크플로우를 관리합니다.
  Triggers: vais, help, 도움말, 사용법, 개발, 기획, 설계, 구현, 리뷰, 검토, plan, design, implement,
  상태, status, 다음, next, qa, QA, gap, test, commit, init, 초기화, 적용, 기존 프로젝트, 수정, 고쳐, 바꿔, 변경,
  아이디어, research, 조사, 뭐 만들, 만들고 싶, auto, 자동, 시작, 부터, 까지,
  wireframe, 와이어프레임, 화면설계, 목업, mockup, layout, 레이아웃, 화면 구성,
  infra, 인프라, DB, 환경설정, 마이그레이션, 스키마,
  manager, 매니저, 현황, 히스토리, 부채, 의존성, 브리핑.
  Do NOT use for: 단순 질문, 코드 없는 대화
argument-hint: "[action] [feature]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TodoWrite, AskUserQuestion
---

# VAIS Code — $0 $1

> 📋기획 → 🎨설계 → 🔧인프라 → 💻프론트 + ⚙️백엔드 → ✅QA

## 현재 상태

Read 도구로 `.vais/status.json`을 읽어 현재 피처 진행 상태를 파악하세요. 파일이 없으면 새 프로젝트입니다.

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
| `manager [질문/지시]` | 프로젝트 매니저 (히스토리 조회, 전략 판단, 영향 분석 기반 수정) |
| `auto [feature]` | 전체 자동 워크플로우 (Manager 직접 오케스트레이션) |
| `plan ~ qa` | 각 단계 개별 실행 |
| `report [feature]` | 완료 보고서 생성 (QA 후 → 회고 + Value Delivered) |
| `plan:design:infra` | 순차 체이닝 (`:` = 순차) |
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
| `fe+be` | frontend-dev | backend-dev |

## 실행 지침

1. Read 도구로 **`${CLAUDE_SKILL_DIR}/phases/$0.md`** 파일을 읽으세요.
2. 파일이 존재하면 그 안의 지침에 따라 실행하세요.
3. 파일이 없으면: "알 수 없는 액션: $0. `/vais help`로 사용법을 확인하세요."

## 완료 아웃로 (모든 액션 공통)

**모든 액션이 끝나면 반드시** 아래 형식의 완료 메시지를 출력하세요:

```
---
✅ **$0 완료** — {피처명}

📌 **이번 작업 요약**
- {수행한 핵심 작업 1~3줄}

📍 **다음 스텝**
- `/vais {다음액션} {피처명}` — {설명}

💡 **참고**: {주의사항이나 팁이 있으면 한 줄}
---
```

- `status`, `next`, `help`처럼 조회만 하는 유틸리티 액션은 아웃로 생략 가능
- 체이닝 실행 중간 단계는 아웃로 생략, **마지막 단계에서만** 출력
