---
name: auto
description: ⚠️ DEPRECATED — v2.0.0부터 /vais cto로 대체되었습니다.
---

# ⚠️ Deprecated: /vais auto

> **v2.0.0부터 `/vais auto`는 `/vais cto`로 대체되었습니다.**

## 자동 리다이렉트

```
/vais auto {feature}  →  /vais cto {feature}
```

이 명령어를 실행하면 자동으로 CTO 에이전트가 실행됩니다.
`/vais cto {feature}`를 직접 사용하세요.

## CTO로 이전된 이유

v2.0.0 C-Suite 아키텍처에서 오케스트레이터 역할이 명확히 분리되었습니다:
- **CTO**: 기술 오케스트레이션 (구 manager/auto 역할)
- **CEO**: 비즈니스 전략 방향
- **CMO**: 마케팅/SEO
- **CSO**: 보안/플러그인 검증

## 사용법

```bash
/vais cto {feature}          # 기술 구현 전체 오케스트레이션
/vais ceo:cto {feature}      # CEO 전략 → CTO 실행
/vais ceo:cto:cso {feature}  # 전체 C-Suite 체이닝
```

완전한 가이드: `skills/vais/phases/cto.md`
