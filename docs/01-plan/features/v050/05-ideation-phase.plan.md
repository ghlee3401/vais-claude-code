# Sub-plan 05 — Ideation Phase (Phase 0)

> 상위: `../v050-full-overhaul.plan.md`
> 선행: 00
> 후행: 06

---

## 0. 목적

PDCA 앞단에 **optional Phase 0 — Ideation**을 신설한다. 사용자 아이디어가 아직 말랑한 상태에서 산출물 강제 없이 자유 대화로 숙성시킬 공간을 만든다. 종료 시 요약을 `docs/00-ideation/`에 저장하고 plan 단계 진입 시 자동 참조되도록 한다.

Rule #2 mandatory 목록에 포함되지 않는다 (CP-3a). 사용자가 `/vais cpo plan {topic}`으로 ideation 건너뛰면 기존과 동일하게 동작한다 (SC-12).

---

## 1. 산출물

```
skills/vais/phases/ideation.md      # 신규 (phase 라우터)
templates/ideation.template.md      # 신규
docs/00-ideation/                   # 신규 디렉토리 + .gitkeep
lib/observability/schema.js         # ideation_started, ideation_ended 이벤트 추가
```

이미 00에서:
- `vais.config.json.workflow.phases`에 `{id: "ideation", optional: true}` 추가됨
- `lib/paths.js`의 `ideationPath(role, topic)` 규칙 추가됨
- `lib/core/state-machine-v050.js`의 `PHASE_MACHINE.ideation` 정의됨

---

## 2. `skills/vais/phases/ideation.md`

### 2.1 Frontmatter
```yaml
---
name: ideation
phase: ideation
layer: phase-router
version: 0.50.0
description: Phase 0 — optional 자유 대화 모드. 산출물 강제 없이 아이디어 숙성 후 요약.
entrypoints:
  - /vais {c-level} ideation [topic]
  - /vais ideation [topic]  # CEO 기본 라우팅
---
```

### 2.2 본문 구조

1. **모드 선언** — 현재 ideation 모드임을 LLM에 선언. `_shared/ideation-guard.md`는 C-Level 본체에 include되므로 여기서도 가드 블록 링크.

2. **입력 파싱**
   - 명령: `/vais cpo ideation pricing-model`
   - role = `cpo`, topic = `pricing-model`
   - topic이 없으면 "어떤 주제로 ideation 하시나요?" 사용자 질문

3. **이벤트 발행**
   - 진입 시: `ideation_started` 이벤트 기록 `{timestamp, feature: topic, initiator, role}`
   - 상태 업데이트: `.vais/features/{topic}/status.json`에 `{phase: "ideation", role, startedAt}`

4. **대화 루프**
   - 산출물 템플릿 **강제 금지** (ideation-guard 준수)
   - 사용자 입력에 대해 C-Level 페르소나로 응답
   - 반복 "plan 갈까요?" **금지** (CP-3c)
   - 유사 ideation 파일 있으면 `ls docs/00-ideation/` 확인 → 참고 제안

5. **종료 키워드 감지** (화이트리스트):
   - 한국어: `plan 가자`, `ideation 종료`, `끝`, `정리해줘`, `요약`, `plan으로`
   - 영어: `ready for plan`, `wrap up`, `summarize`, `let's plan`
   - 위 중 하나 매칭 시 종료 루틴 진입

6. **종료 루틴**
   - 지난 대화에서 추출:
     - key_points (3~7)
     - decisions (확정된 결정, 없으면 빈 배열)
     - open_questions (미해결)
     - next_step (추천: 어떤 C-Level/phase)
   - `templates/ideation.template.md` 구조로 채움
   - `docs/00-ideation/{role}_{topic}.md` 저장
   - `ideation_ended` 이벤트 기록 `{timestamp, output_path, status: 'ready_for_design'|'abandoned'}`
   - 후속 제안:
     - CEO 라우팅: AskUserQuestion으로 다음 C-Level + phase 승인 요청 (CP-3b)
     - 일반 C-Level: "`/vais {role} plan {topic}` 로 진입하시겠어요?" 1회 제안

7. **중단 처리**
   - 사용자가 종료 없이 자리 비움 → 세션 재개 시 "진행 중인 ideation이 있습니다. 계속하시겠어요? 요약하시겠어요?" 로 복원 가능
   - 복원 정보: `.vais/features/{topic}/resume/{timestamp}.json`

---

## 3. `templates/ideation.template.md`

```markdown
# Ideation Summary: {role} / {topic}

> 진행일: {date}
> 진행자 C-Level: {role}
> 소요 대화 turns: {turn_count}
> Status: {status}  # ready_for_plan | abandoned

---

## Key Points

(대화에서 도출된 핵심 주제 3~7개)

- ...

## Decisions

(확정된 결정. 없으면 빈 리스트)

- ...

## Open Questions

(미해결 질문 — plan 단계에서 다룰 것)

- ...

## Next Step

(추천된 다음 단계 — 어떤 C-Level의 어떤 phase로 갈지)

- C-Level: {recommended-clevel}
- Phase: {recommended-phase}
- 이유: {rationale}

---

## Raw Context (optional)

(원 대화에서 중요했던 인용. LLM이 plan에서 참조)
```

**필드 규약**:
- 4개 섹션(Key Points / Decisions / Open Questions / Next Step)은 **무조건 존재** (비어 있을 수 있음)
- plan 스킬이 이 파일을 파싱할 때 이 4 섹션을 기대

---

## 4. CEO Ideation 라우팅 (예고)

실제 CEO 라우팅 로직은 sub-plan 06에서 구현하지만, 본 sub-plan에서 **계약**을 명시:

- `/vais ceo ideation {topic}` 진입 시:
  1. CEO가 ideation 모드로 대화
  2. 종료 트리거 시: 대화 내용 기반으로 다음 C-Level 추천 (CPO/CTO/CBO 등)
  3. AskUserQuestion: "[topic] 은 {추천 role}의 {추천 phase} 단계로 진행을 권장합니다. 진행하시겠어요?"
  4. 사용자 승인 시 자동 전환 → `/vais {추천 role} {추천 phase} {topic}` 실행 (또는 그에 해당하는 skill 호출)
  5. 거절 시: "직접 명령을 입력해주세요" 안내

---

## 5. 이벤트 스키마

`lib/observability/schema.js`에 추가:

```js
ideation_started: {
  fields: ['timestamp','feature','initiator','role','topic']
},
ideation_ended: {
  fields: ['timestamp','feature','output_path','status','turn_count','duration_sec']
}
```

`hooks/events.json`에도 두 이벤트 타입 등록 (07에서 일괄 처리 예정이지만 여기서 명세를 준비).

---

## 6. 진입 시 신경 쓸 점

### 6.1 선행에서 보장됨
- `vais.config.json.workflow.phases` ideation 포함
- `lib/paths.ideationPath()` 정의
- PHASE_MACHINE에 ideation 전이 포함

### 6.2 다음으로 넘길 보증
- `skills/vais/phases/ideation.md` 존재 + 진입점 2종 등록 (`/vais ceo ideation`, `/vais {c-level} ideation`)
- `templates/ideation.template.md` 존재 + 4 섹션 구조 확정
- `docs/00-ideation/` 디렉토리 존재 (.gitkeep)
- 이벤트 스키마에 2종 추가
- plan 스킬의 자동 참조 로직은 **06에서** 구현 (본 sub-plan은 "요약 파일이 특정 경로에 존재할 것"만 보장)

### 6.3 함정
- **산출물 강제 금지 vs 요약 강제**: ideation 진행 중엔 금지, 종료 시엔 요약 필수. LLM이 두 모드를 혼동하지 않도록 guard에 명확히 구분.
- **종료 키워드 오탐**: "끝" 같은 짧은 단어는 대화 맥락에서 오탐 가능 ("이건 끝이 안 보여"). 단독 단문(≤10자) + 직전 3 turn에 "ideation" 언급 있을 때만 인정하는 heuristic 추가.
- **세션 중단 복원**: 복원 시 기존 대화 컨텍스트를 얼마나 다시 주입할지. 전체 주입은 토큰 폭증 → 최근 20 turn + 모든 Key Points candidate만 선택.
- **plan 없이 ideation만 반복**: 사용자가 주제 바꿔가며 ideation을 10번 해도 plan 진입이 없으면 자원 낭비. observability에 `ideation_without_plan_ratio` 메트릭 수집(하드블록 X, 관찰만).
- **이미 plan.md가 있는 주제로 ideation 진입**: 허용하되 "이미 `docs/01-plan/features/{topic}.plan.md`가 존재합니다. 재기획이시면 진행, 단순 참고면 plan 열어보시는 편이 나을 수 있어요" 안내.

---

## 7. 검증

- [ ] `skills/vais/phases/ideation.md` 존재 + frontmatter 유효
- [ ] `templates/ideation.template.md` 존재 + 4 섹션
- [ ] `docs/00-ideation/` 디렉토리 존재 + `.gitkeep`
- [ ] 이벤트 스키마 2종 export
- [ ] 수동: `/vais cpo ideation pricing-test`
  - 산출물 강제 프롬프트 없음
  - "plan 가자" 입력 시 `docs/00-ideation/cpo_pricing-test.md` 생성
  - 파일에 4 섹션 존재
- [ ] 수동: ideation 없이 `/vais cpo plan pricing-test2`
  - 기존 plan 흐름 동일 실행 (SC-12)

연결 SC: **SC-8, SC-9, SC-12**

---

## 8. 다음 단계

- **06** Phase Routers — plan 스킬이 `docs/00-ideation/` 자동 참조, CEO 라우터가 ideation 분기 구현
