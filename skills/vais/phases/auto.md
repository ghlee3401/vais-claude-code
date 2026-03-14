### auto — tech-lead 오케스트레이션

Agent 도구로 **tech-lead** 에이전트를 호출하여 전체 워크플로우를 자동 실행합니다.

**전달할 정보:**
- 피처명: "$1"
- 실행 범위: research → review 전체 9단계
- 게이트 체크포인트: plan, design (AskUserQuestion으로 사용자 확인)
- `vais.config.json` 설정, 기존 문서 경로

**실행 흐름:**
```
research → plan → ia → wireframe → design(UI+DB 병렬) → fe+be(병렬) → check → review
```

**병렬 구간:**
- **설계**: designer (UI 설계) + backend-dev (DB 설계) — Agent 병렬 호출
- **구현**: frontend-dev + backend-dev — Agent 병렬 호출

**게이트 체크포인트** 도달 시:
- AskUserQuestion으로 중간 결과 확인
- "계속", "수정 후 계속", "여기서 중단" 중 선택

**진행률**: TodoWrite로 시각화
**에러 처리**: 단계 실패 시 즉시 중단, 사용자에게 보고

**tech-lead 프롬프트:**
```
피처 "$1"의 워크플로우를 자동 실행합니다.
실행 흐름: research → plan → ia → wireframe → design(병렬) → fe+be(병렬) → check → review
게이트: plan, design
각 단계: 지침에 따라 작업 → 문서 저장 → 게이트면 사용자 확인 → 다음 단계
```
