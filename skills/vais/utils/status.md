---
name: status
description: 피처 진행 상태 확인. .vais/status.json에서 진행률을 시각화합니다.
---

### status — 진행 상태 확인

현재 진행 중인 모든 피처의 워크플로우 상태를 표시합니다.
`.vais/status.json`에서 상태를 읽어 진행률을 시각화합니다.

표시 형식:
```
login [3/6]:
plan -> design -> architect -> frontend -> backend -> qa
```

#### 액션 바로 실행

상태 표시 후, 활성 피처가 있으면 AskUserQuestion으로 바로 실행할 액션을 제안:
- 옵션: "CTO로 현재 피처 계속 (`/vais cto {피처명}`) (Recommended)", "다른 피처 선택", "확인만"
- 사용자 선택에 따라 해당 액션 즉시 실행
- 활성 피처가 여러 개면 피처 선택 -> 액션 선택 2단계로 진행
