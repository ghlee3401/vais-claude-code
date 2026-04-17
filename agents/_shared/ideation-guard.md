## IDEATION MODE GUARD (active for C-Level agents in ideation phase)

현재 모드: **ideation (Phase 0, optional)**

### 허용 동작

- 자유 대화 — 산출물 포맷(PRD / 요구사항 템플릿 등) 강제 금지
- 사용자 아이디어에 대해 질문 / 선명화 / 프레임 제안
- **Scope 판단 (첫 turn 필수)** — 요청이 30분 이내 직접 편집(Edit/Write/Bash)으로 해결 가능하면(rename / typo / config 조정 / 작은 규약 변경 등) AI가 먼저 제안: "이건 `/vais` 규모 아닙니다. 바로 실행해드릴까요?" → 사용자 승인 시 **직접 실행 모드**로 전환 (아래 §종료 루틴 참조)
- 유사 사례 / 선행 사례 참고 제시
- 이미 저장된 다른 `docs/*/00-ideation/main.md` 있으면 참조 가능

### 금지 동작

- "plan 갈까요?", "이제 시작할까요?" 반복 질문 — 사용자 명시 종료까지 대기 (CP-3c)
- 임의 산출물 생성 (예: PRD 템플릿에 자동 채움)
- mandatory phase 체크 (Rule #2) 발동 — ideation은 예외
- 사용자가 종료 키워드 없이 멈춘 상태에서 AI가 "요약할까요?" 자체 판단으로 제안

### 종료 트리거 (사용자 명시 키워드)

두 가지 종료 분기:

**A. 요약 → plan 전환** (기존 트리거):
- "plan 가자" / "ideation 종료" / "정리해줘" / "요약"
- → 아래 "종료 루틴 A" 실행

**B. 직접 실행 (문서 없이 종료)** (신규 트리거):
- "그냥 해줘" / "바로 실행" / "skip vais" / "끝" / "바로 하자"
- 또는 §허용 동작의 "Scope 판단" 제안에 사용자가 승인한 경우
- → 아래 "종료 루틴 B" 실행

### 종료 루틴 A (요약 + plan 경로)

1. 현재까지 대화에서 핵심 추출 → `templates/ideation.template.md` 구조 채움
2. `docs/{topic}/00-ideation/main.md` 저장 (topic = feature name, NN- 규약 준수)
3. `ideation_ended` 이벤트 기록 `{status: "summarized"}`
4. CEO 라우팅 모드일 때: 다음 C-Level 추천 + AskUserQuestion
5. 기타: "`/vais {c-level} plan {topic}` 으로 진입하시겠어요?" 1회만 제안

### 종료 루틴 B (직접 실행)

1. 산출물 생성 **금지** — `docs/{topic}/00-ideation/main.md` 작성하지 않음
2. `ideation_skipped` 이벤트 기록 `{reason: "direct_execution", topic, turns}`
3. PDCA phase rail 이탈 — 이후 요청은 **일반 Claude Code 도구(Edit/Write/Bash)로 직접 처리**, `/vais` 재호출 금지
4. 사용자에게 한 줄 확인: "직접 실행 모드로 진행합니다. `/vais` 없이 바로 작업해드릴게요."

### 요약 템플릿 필드

- `key_points` — 3~7개 핵심 주제
- `decisions` — 확정된 결정 (있다면)
- `open_questions` — 미해결 질문
- `next_step` — 제안된 다음 phase / C-Level
