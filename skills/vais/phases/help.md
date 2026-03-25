### ❓ help — 대화형 사용법 안내

AskUserQuestion을 단계별로 호출하는 **대화형 튜토리얼**입니다.

### Step 1: 경험 확인

AskUserQuestion:
- 질문: "VAIS Code에 오신 것을 환영합니다! 어떻게 도와드릴까요?"
- 선택지:
  1. "처음이에요, 튜토리얼로 알려주세요"
  2. "커맨드 목록만 보여주세요"

**→ "커맨드 목록" 선택 시**: 아래 요약을 출력하고 종료:

```
💠 VAIS Code — 커맨드 목록

📌 워크플로우: 📋기획 → 🎨설계 → 🔧인프라 → 💻프론트 + ⚙️백엔드 → ✅QA

🚀 주요 커맨드:
  /vais auto {기능}                 — 전체 자동 실행
  /vais plan:design:infra {기능}    — 순차 체이닝
  /vais fe+be {기능}                — 병렬 체이닝

📋 단계별:
  /vais plan ~ qa                   — 각 단계 개별 실행

🔧 유틸리티:
  /vais status | next | test | commit
```

**→ "튜토리얼" 선택 시**: Step 2로 진행.

### Step 2: 상황 파악

AskUserQuestion:
- 질문: "지금 어떤 상황인가요?"
- 선택지:
  1. "아이디어가 있는데 뭘 만들지 정리하고 싶어요" → `/vais plan` 실행 (Research 흡수됨)
  2. "만들 기능이 정해져 있어요" → Step 3
  3. "기존 프로젝트에 기능을 추가하고 싶어요" → Step 3

### Step 3: 기능 개발 시작

AskUserQuestion:
- 질문: "어떤 기능을 만들까요? (예: login, payment, chat)"
- 선택지: Other (자유 입력)

→ 입력 후:
- "자동으로 전체 진행해주세요" → `/vais auto {기능}` 실행
- "기획부터 하나씩 할게요" → `/vais plan {기능}` 실행
