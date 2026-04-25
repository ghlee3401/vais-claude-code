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
VAIS Code v0.59.0 — 커맨드 목록

C-Suite 에이전트:
  /vais cto [phase] {feature}  — 기술 전체 오케스트레이션 (가장 많이 씀)
  /vais ceo [phase] {feature}  — 비즈니스 전략 + C-Suite 동적 라우팅
  /vais cpo [phase] {feature}  — 제품 방향 + PRD + 로드맵 + 백로그
  /vais cso [phase] {feature}  — 보안 검토 + 시크릿 스캔 + 의존성 분석
  /vais cbo [phase] {feature}  — 마케팅/GTM + 재무/가격 + unit economics
  /vais coo [phase] {feature}  — 운영/CI/CD + 성능 벤치마크

  phase: ideation (optional) / plan / design / do / qa / report
  ideation: /vais {c-level} ideation [topic] — 자유 대화 모드

유틸리티:
  /vais status             — 진행 상태 확인
  /vais next               — 다음 실행할 단계 안내
  /vais commit             — git 변경사항 분석 + Conventional Commits
  /vais init {feature}     — 기존 프로젝트 VAIS 문서 역생성
  /vais mcp-builder        — MCP 서버 개발 가이드
  /vais help               — 이 도움말

사용 예시:
  /vais cto plan my-feature    → plan만 실행 후 멈춤
  /vais cto my-feature         → 다음 phase 자동 판별 → 확인 후 실행
  /vais ceo my-feature         → CEO가 라우팅 분석 → 적절한 C레벨 위임
```

**-> "튜토리얼" 선택 시**: Step 2로 진행.

### Step 2: 상황 파악

AskUserQuestion:
- 질문: "지금 어떤 상황인가요?"
- 선택지:
  1. "아이디어가 있는데 뭘 만들지 정리하고 싶어요" -> `/vais cpo plan {feature}` 안내
  2. "만들 기능이 정해져 있어요" -> Step 3
  3. "기존 프로젝트에 기능을 추가하고 싶어요" -> Step 3

### Step 3: 기능 개발 시작

AskUserQuestion:
- 질문: "어떤 기능을 만들까요? (예: user-login-flow, payment-retry-logic)"
- 선택지: Other (자유 입력)

-> 입력 후: `/vais cto plan {feature}` 실행 안내 (plan부터 단계별 진행)
