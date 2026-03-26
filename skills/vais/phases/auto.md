### 🤖 auto — Manager 직접 오케스트레이션

**실행 시작 시 반드시** 아래 인트로를 먼저 출력하세요:

```
---
📋 **VAIS Manager** 입니다.
"$1" 피처의 전체 워크플로우를 시작하겠습니다.
---
```

Agent 도구로 **manager** 에이전트를 호출하여 전체 워크플로우를 자동 실행합니다.
Manager가 Plan을 직접 수행하고, 나머지 단계는 전문 에이전트에게 직접 위임합니다.

**전달할 정보:**
- 피처명: "$1"
- 실행 범위: plan → qa 전체 6단계
- 게이트 체크포인트: plan, design, architect, frontend (AskUserQuestion으로 사용자 확인)
- `vais.config.json` 설정, 기존 문서 경로

**실행 흐름:**
```
Manager
  → Plan 직접 실행 → [Gate 1]
  → design 위임 (design) → [Gate 2: Interface Contract 생성]
  → architect 위임 (architect) → [Gate 3]
  → frontend + backend 병렬 위임 (frontend+backend) → [Gate 4]
  → review 위임 (review)
  → 결과를 memory에 기록
```

**병렬 구간:**
- **구현**: frontend + backend — Agent 병렬 호출

**게이트 체크포인트** 도달 시 (핑퐁 루프):
- 바이너리 체크리스트 검증 후 AskUserQuestion으로 중간 결과를 보여주고 확인
- "계속", "수정 요청", "여기서 중단" 중 선택
- "수정 요청" 선택 시 → 피드백 반영 → 수정 결과 요약 출력 → **다시 AskUserQuestion으로 확인** (계속/추가 수정/중단)
- 사용자가 "계속"을 명시적으로 선택할 때까지 다음 단계로 절대 넘어가지 않음
- 사용자 피드백은 Manager가 memory에 feedback 타입으로 기록

**Gate 2 특수 처리 — Interface Contract:**
- Design 완료 후 Gate 2 판정 시, Manager가 Plan의 데이터 모델 + Design의 화면-데이터 매핑을 합성
- Interface Contract (API 스펙) 생성 → `docs/02-design/{feature}-ic.md`에 저장
- 이후 FE/BE 모두 이 스펙을 참조

**진행률**: TodoWrite로 시각화
**에러 처리**: 단계 실패 시 즉시 중단, 사용자에게 보고, Manager가 error 타입으로 memory에 기록

**manager 프롬프트:**
```
피처 "$1"의 전체 워크플로우를 실행합니다.

1. `.vais/memory.json`에서 관련 엔트리만 필터하여 프로젝트 컨텍스트를 파악하세요.
2. 기존 피처와의 의존성, 과거 의사결정을 확인하세요.
3. 직접 실행 및 에이전트 위임:
   - Plan: 직접 실행
   - Design: design 에이전트에 위임
   - Architect: architect 에이전트에 위임
   - Frontend+Backend: frontend + backend 병렬 위임
   - Review: review 에이전트에 위임
4. 게이트: plan, design(IC 생성 포함), architect, frontend
5. 완료 후 결과를 memory에 기록:
   - 주요 의사결정 (decision)
   - 새로운 피처 간 의존성 (dependency)
   - 발견된 기술 부채 (debt)
```

**에이전트**: manager
