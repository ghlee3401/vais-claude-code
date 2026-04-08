---
name: qa-engineer
description: CTO로 리다이렉트. 구현 단계는 직접 호출하지 않습니다.
---

## 이 커맨드는 CTO를 통해 실행됩니다

이 액션은 더 이상 직접 실행되지 않습니다.

**`/vais cto {feature}`** 를 실행하세요.

CTO가 다음 단계를 순서대로 오케스트레이션합니다:
  plan → design → do (frontend-engineer + backend-engineer + test-engineer 병렬) → qa → report

각 단계 완료 시 CTO가 확인을 요청합니다.

> **test-engineer vs qa-engineer 역할 분리**: test-builder는 Do 단계에서 테스트 코드를 작성하고, qa-validator는 Check 단계에서 Gap 분석/코드 리뷰/QA 검증을 수행합니다.
