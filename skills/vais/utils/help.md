---
name: help
description: 대화형 사용법 안내. VAIS Code 커맨드 목록 및 튜토리얼 제공.
---

### help — 대화형 사용법 안내

AskUserQuestion을 단계별로 호출하는 **대화형 튜토리얼**입니다.

### Step 1: 경험 확인

AskUserQuestion:
- 질문: "VAIS Code에 오신 것을 환영합니다! 어떻게 도와드릴까요?"
- 선택지:
  1. "처음이에요, 튜토리얼로 알려주세요"
  2. "커맨드 목록만 보여주세요"

**-> "커맨드 목록" 선택 시**: 아래 요약을 출력하고 종료:

```
VAIS Code v0.25.0 — 커맨드 목록

C-Suite 에이전트:
  /vais cto {feature}    — 기술 전체 오케스트레이션 (가장 많이 씀)
  /vais ceo {feature}    — 비즈니스 전략 + C-Suite 조율
  /vais cpo {feature}    — 제품 방향 + PRD + 로드맵
  /vais cmo {feature}    — 마케팅 전략 + SEO
  /vais cso {feature}    — 보안 검토 + 플러그인 검증
  /vais cfo {feature}    — 재무/ROI (stub)
  /vais coo {feature}    — 운영/CI/CD (stub)

유틸리티:
  /vais status           — 진행 상태 확인
  /vais absorb {path}    — 외부 레퍼런스 흡수
  /vais commit           — git 변경사항 분석 + Conventional Commits
  /vais init {feature}   — 기존 프로젝트 VAIS 문서 역생성
  /vais help             — 이 도움말

핵심 원칙: 구현 단계(plan, design 등)는 직접 호출하지 않습니다. CTO가 알아서 합니다.
```

**-> "튜토리얼" 선택 시**: Step 2로 진행.

### Step 2: 상황 파악

AskUserQuestion:
- 질문: "지금 어떤 상황인가요?"
- 선택지:
  1. "아이디어가 있는데 뭘 만들지 정리하고 싶어요" -> `/vais cpo {feature}` 실행
  2. "만들 기능이 정해져 있어요" -> Step 3
  3. "기존 프로젝트에 기능을 추가하고 싶어요" -> Step 3

### Step 3: 기능 개발 시작

AskUserQuestion:
- 질문: "어떤 기능을 만들까요? (예: login, payment, chat)"
- 선택지: Other (자유 입력)

-> 입력 후: `/vais cto {feature}` 실행 (CTO가 plan -> design -> do -> qa -> report 전체 진행)
