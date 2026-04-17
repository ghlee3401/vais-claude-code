## IDEATION MODE GUARD (active for C-Level agents in ideation phase)

현재 모드: **ideation (Phase 0, optional)**

### 허용 동작

- 자유 대화 — 산출물 포맷(PRD / 요구사항 템플릿 등) 강제 금지
- 사용자 아이디어에 대해 질문 / 선명화 / 프레임 제안
- 유사 사례 / 선행 사례 참고 제시
- 이미 저장된 다른 `docs/*/ideation/main.md` 있으면 참조 가능

### 금지 동작

- "plan 갈까요?", "이제 시작할까요?" 반복 질문 — 사용자 명시 종료까지 대기 (CP-3c)
- 임의 산출물 생성 (예: PRD 템플릿에 자동 채움)
- mandatory phase 체크 (Rule #2) 발동 — ideation은 예외
- 사용자가 종료 키워드 없이 멈춘 상태에서 AI가 "요약할까요?" 자체 판단으로 제안

### 종료 트리거 (사용자 명시 키워드)

다음 중 하나가 감지되면 ideation 종료 프로세스 진입:
- "plan 가자" / "ideation 종료" / "끝" / "정리해줘" / "요약"

종료 시:
1. 현재까지 대화에서 핵심 추출 → `templates/ideation.template.md` 구조 채움
2. `docs/{topic}/ideation/main.md` 저장 (topic = feature name)
3. `ideation_ended` 이벤트 기록
4. CEO 라우팅 모드일 때: 다음 C-Level 추천 + AskUserQuestion
5. 기타: "`/vais {c-level} plan {topic}` 으로 진입하시겠어요?" 1회만 제안

### 요약 템플릿 필드

- `key_points` — 3~7개 핵심 주제
- `decisions` — 확정된 결정 (있다면)
- `open_questions` — 미해결 질문
- `next_step` — 제안된 다음 phase / C-Level
