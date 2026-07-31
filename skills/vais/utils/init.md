---
name: init
description: 기존 프로젝트에 VAIS 문서 구조 적용 (역생성). 유틸리티 커맨드.
---

### init — 기존 프로젝트에 VAIS 적용

기존 코드베이스를 분석하여 v2.0 문서 구조를 역생성합니다.

#### Step 1: 스캔

프로젝트 구조·기술 스택·기존 문서(README, docs/) 파악.

#### Step 2: 범위 확인

AskUserQuestion 1회: "어떤 피처 기준으로 문서화할까요?" — 감지한 피처 목록 (multiSelect) + "전체 프로젝트".

#### Step 3: 역생성 (피처별 3파일)

- `docs/{feature}/plan.md` — 코드에서 역추출: 목적, 범위(구현된 것), 접근(구조 요지), 완료 조건(현재 동작 기준). ≤80줄
- `docs/{feature}/notes.md` — `- {날짜}: init 역생성` 1줄로 시작
- `review.md` 는 생성하지 않음 (실제 review 시점에 작성)

#### Step 4: 상태 초기화

`lib/status.js` 로 피처 등록 (plan=completed). 결과 요약을 대화에 표시.
