---
name: ideation
phase: ideation
layer: phase-router
version: 0.50.0
description: Phase 0 — optional 자유 대화 모드. 산출물 강제 없이 아이디어 숙성 후 요약.
entrypoints:
  - /vais {c-level} ideation [topic]
  - /vais ideation [topic]
---

# Ideation Phase (Phase 0, optional)

`${CLAUDE_PLUGIN_ROOT}/agents/{role}/{role}.md`를 읽고 그 안의 지침에 따라 실행하세요.

**단, 현재 모드는 ideation입니다.** `${CLAUDE_PLUGIN_ROOT}/agents/_shared/ideation-guard.md`의 가드를 반드시 준수합니다.

## 인자 파싱

전달 인자 원본: `$1`

### 분리 규칙

`$1`의 **첫 단어**가 `ideation`인 경우:
- `/vais cpo ideation pricing-model` → role=`cpo`, phase=`ideation`, topic=`pricing-model`
- `/vais ideation pricing-model` → role=`ceo` (기본), phase=`ideation`, topic=`pricing-model`
- `/vais cpo ideation` → role=`cpo`, phase=`ideation`, topic=미지정 → "어떤 주제로 ideation 하시나요?" 질문

### topic이 없을 때

사용자에게 주제를 질문합니다. 첫 응답을 topic으로 사용.

## 진입 처리

1. **이벤트 발행**: `ideation_started` 기록 `{timestamp, feature: topic, initiator: 'user', role, topic}`
2. **기존 ideation 확인**: `ls docs/{topic}/ideation/main.md` → 파일 존재하면 "기존 ideation이 있습니다. 참고할까요?" 안내
3. **기존 plan 확인**: `docs/{topic}/plan/main.md` 존재하면 "이미 plan이 있습니다. 재기획이시면 진행, 참고만 하실거면 plan을 열어보시는 편이 나을 수 있어요" 안내
4. **ideation-guard 활성화**: 산출물 강제 금지, 사용자 주도 대화

## 대화 루프

- C-Level 페르소나로 응답 (role에 맞게)
- 산출물 템플릿 강제 금지 (ideation-guard §금지 동작)
- "plan 갈까요?" 반복 질문 금지 (CP-3c)
- 유사 ideation 파일 참조 가능

## 종료 키워드 감지

다음 중 하나가 사용자 입력에서 감지되면 종료 루틴 진입:

| 한국어 | 영어 |
|--------|------|
| plan 가자, ideation 종료, 끝, 정리해줘, 요약, plan으로 | ready for plan, wrap up, summarize, let's plan |

## 종료 루틴

1. 대화에서 핵심 추출:
   - `key_points` (3~7개)
   - `decisions` (확정된 결정)
   - `open_questions` (미해결)
   - `next_step` (추천 C-Level + phase)
2. `templates/ideation.template.md` 구조로 채움
3. `docs/{topic}/ideation/main.md` 저장
4. `ideation_ended` 이벤트 기록
5. 후속 제안:
   - CEO 라우팅: AskUserQuestion으로 다음 C-Level 추천
   - 일반 C-Level: "`/vais {role} plan {topic}`으로 진입하시겠어요?" 1회만 제안

## 중단 복원

세션 재개 시 진행 중 ideation 감지하면: "진행 중인 ideation이 있습니다. 계속하시겠어요? 요약하시겠어요?" 안내.
