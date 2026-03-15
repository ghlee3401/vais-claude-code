### auto — Manager → Tech Lead 오케스트레이션

Agent 도구로 **manager** 에이전트를 호출하여 전체 워크플로우를 자동 실행합니다.
Manager가 memory를 기반으로 판단한 후 Tech Lead에게 실행을 지시합니다.

**전달할 정보:**
- 피처명: "$1"
- 실행 범위: research → review 전체 9단계
- 게이트 체크포인트: plan, design (AskUserQuestion으로 사용자 확인)
- `vais.config.json` 설정, 기존 문서 경로

**실행 흐름:**
```
Manager (판단)
  → memory 조회 → 피처 간 의존성 확인 → 방향 결정
  → Tech Lead (실행)
    → research → plan → ia → wireframe → design(UI+DB 병렬) → fe+be(병렬) → check → review
  → Manager (기록)
    → 의사결정, 의존성, 기술 부채를 memory에 기록
```

**병렬 구간:**
- **설계**: designer (UI 설계) + backend-dev (DB 설계) — Agent 병렬 호출
- **구현**: frontend-dev + backend-dev — Agent 병렬 호출

**게이트 체크포인트** 도달 시:
- AskUserQuestion으로 중간 결과 확인
- "계속", "수정 후 계속", "여기서 중단" 중 선택
- 사용자 피드백은 Manager가 memory에 feedback 타입으로 기록

**진행률**: TodoWrite로 시각화
**에러 처리**: 단계 실패 시 즉시 중단, 사용자에게 보고, Manager가 error 타입으로 memory에 기록

**manager 프롬프트:**
```
피처 "$1"의 전체 워크플로우를 실행합니다.

1. `.vais/memory.json`을 읽어 기존 프로젝트 컨텍스트를 파악하세요.
2. 기존 피처와의 의존성, 과거 의사결정을 확인하세요.
3. Tech Lead에게 다음을 지시하세요:
   - 피처명: "$1"
   - 실행 흐름: research → plan → ia → wireframe → design(병렬) → fe+be(병렬) → check → review
   - 게이트: plan, design
   - 관련 memory 컨텍스트를 함께 전달
4. Tech Lead 실행 완료 후 결과를 memory에 기록하세요:
   - 주요 의사결정 (decision)
   - 새로운 피처 간 의존성 (dependency)
   - 발견된 기술 부채 (debt)
```
