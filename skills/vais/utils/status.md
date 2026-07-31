---
name: status
description: 피처 진행 상태 확인. .vais/status.json 기반.
---

### status — 진행 상태 확인

`.vais/status.json`을 Read 하여 피처별 상태를 표시합니다:

```
{feature}  plan ✅ → do 🔄 → review ⬜   (docs/{feature}/)
```

- 각 피처의 `docs/{feature}/plan.md` 존재 여부·`notes.md` 마지막 항목 1줄도 함께 표시
- 활성 피처가 있으면 다음 액션 1줄 제안: `/vais {다음phase} {feature}` (강제 실행 체인 없음)
