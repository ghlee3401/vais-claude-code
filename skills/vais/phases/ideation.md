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
2. **기존 ideation 확인**: `ls docs/{topic}/00-ideation/main.md` → 파일 존재하면 "기존 ideation이 있습니다. 참고할까요?" 안내
3. **기존 plan 확인**: `docs/{topic}/01-plan/main.md` 존재하면 "이미 plan이 있습니다. 재기획이시면 진행, 참고만 하실거면 plan을 열어보시는 편이 나을 수 있어요" 안내
4. **ideation-guard 활성화**: 산출물 강제 금지, 사용자 주도 대화
5. **Scope probe (첫 turn 필수)**: 요청이 30분 이내 직접 편집으로 해결 가능(rename/typo/config 조정 등)하면 AI가 먼저 제안: "이건 `/vais` 규모 아닙니다. 바로 실행해드릴까요?" → 사용자 승인 시 종료 루틴 B 실행

## 대화 루프

- C-Level 페르소나로 응답 (role에 맞게)
- 산출물 템플릿 강제 금지 (ideation-guard §금지 동작)
- "plan 갈까요?" 반복 질문 금지 (CP-3c)
- 유사 ideation 파일 참조 가능

## 종료 키워드 감지

두 가지 종료 분기:

| 분기 | 한국어 키워드 | 영어 키워드 | 실행 |
|------|--------------|-------------|------|
| **A. 요약 + plan** | plan 가자, ideation 종료, 정리해줘, 요약, plan으로 | ready for plan, wrap up, summarize, let's plan | 종료 루틴 A |
| **B. 직접 실행** | 그냥 해줘, 바로 실행, 바로 하자, skip vais, 끝 | just do it, skip vais, direct execute | 종료 루틴 B |

> 첫 turn의 scope probe에 사용자가 승인한 경우도 B 경로로 직결.

## 종료 루틴 A — 요약 + plan 전환

1. 대화에서 핵심 추출:
   - `key_points` (3~7개)
   - `decisions` (확정된 결정)
   - `open_questions` (미해결)
   - `next_step` (추천 C-Level + phase)
2. `templates/ideation.template.md` 구조로 채움
3. `docs/{topic}/00-ideation/main.md` 저장 (NN- 규약)
4. `ideation_ended` 이벤트 기록 `{status: "summarized"}`
5. 후속 제안:
   - CEO 라우팅: AskUserQuestion으로 다음 C-Level 추천
   - 일반 C-Level: "`/vais {role} plan {topic}`으로 진입하시겠어요?" 1회만 제안

## 종료 루틴 B — 직접 실행 (문서 없이 종료)

1. 산출물 생성 **금지** — `docs/{topic}/00-ideation/main.md` 작성하지 않음
2. `ideation_skipped` 이벤트 기록 `{reason: "direct_execution", topic, turns}`
3. PDCA phase rail 이탈 — 이후 요청은 일반 Claude Code 도구(Edit/Write/Bash)로 직접 처리
4. 사용자에게 한 줄 확인: "직접 실행 모드로 진행합니다. `/vais` 없이 바로 작업해드릴게요."

## 중단 복원

세션 재개 시 진행 중 ideation 감지하면: "진행 중인 ideation이 있습니다. 계속하시겠어요? 요약하시겠어요?" 안내.
