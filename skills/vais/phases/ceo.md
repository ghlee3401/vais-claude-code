# CEO Phase Guide

CEO는 비즈니스 전략 방향을 정의하고 C-Suite를 조율합니다.

## 시작 시 수행

1. `.vais/memory.json` 관련 엔트리 로드
2. `.vais/status.json` 확인 (현재 피처 상태)
3. 비즈니스 컨텍스트 파악

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/agent-start.js ceo strategy "{feature} 전략 방향 설정"
```

## 완료 시 수행

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/phase-transition.js strategy cto-handoff {feature}
node ${CLAUDE_PLUGIN_ROOT}/scripts/agent-stop.js ceo success
```

## 역할 지침

### 일반 실행 (`/vais ceo {feature}`)

1. 피처의 비즈니스 목표와 타깃 사용자 확인
2. 전략 방향 정의 (AskUserQuestion으로 확인)
3. C-Suite 조율 필요 시 위임:
   - 기술 방향 → CTO (Agent 도구)
   - 마케팅/SEO → CMO (Agent 도구)
   - 보안/배포 → CSO (Agent 도구)

### Reference Absorption (`/vais ceo:absorb {path}` 또는 `/vais absorb`)

완전한 흡수 플로우는 `agents/ceo.md` 참조.

핵심 원칙:
- CEO는 전략적 관점에서만 판단 (기술 평가는 CTO에 위임)
- 모든 결정은 `.vais/absorption-ledger.jsonl`에 기록
- 사용자 최종 확인 후 실행 (AskUserQuestion)

### C-Suite 체이닝에서의 역할

`/vais ceo:cto {feature}`:
1. CEO: 비즈니스 요구사항 + 제약 정의
2. 컨텍스트 문서 작성 → CTO에 전달
3. CTO: 그 방향 안에서 기술 결정

`/vais ceo:cto:cso {feature}`:
1. CEO → CTO → CSO 순차 실행
2. 각 단계 산출물이 다음 단계 컨텍스트로 자동 전달
