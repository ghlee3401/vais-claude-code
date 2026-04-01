---
name: cso
description: CSO 에이전트 호출. 보안 검토(Gate A) + 플러그인 배포 검증(Gate B) 오케스트레이션.
---

# CSO Phase Guide

CSO는 두 가지 게이트를 운영합니다: 보안 검토(Gate A) + 플러그인 검증(Gate B).
`vais-validate-plugin` 스킬의 모든 기능이 이 파일에 통합되어 있습니다.

## 시작 시 수행

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/agent-start.js cso security "{feature} 보안/검증"
```

## 완료 시 수행

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/agent-stop.js cso success docs/04-qa/{feature}-security.md
```

## 역할 지침

### Gate A — 보안 검토 (`/vais cso {feature}`)

완전한 체크리스트는 `agents/cso.md` 참조.

실행 체크리스트:
1. [ ] OWASP Top 10 체크 (A01~A10)
2. [ ] 인증/인가 설계 검토
3. [ ] 민감 데이터 처리 검토
4. [ ] 산출물: `docs/04-qa/{feature}-security.md`

보안 점수 기준:
| 심각도 | 처리 |
|--------|------|
| Critical | 즉시 수정 필요, 배포 차단 |
| High | 배포 전 수정 권장 |
| Medium | 다음 스프린트 수정 |
| Low | 개선 사항으로 기록 |

### Gate B — Plugin Validation

**자동 트리거**: `plugin 배포`, `마켓플레이스`, `배포 준비`, `claude-plugin` 키워드

완전한 검증 로직은 `agents/cso.md` Gate B 참조.

실행 체크리스트:
1. [ ] `package.json` claude-plugin 메타데이터 검증
2. [ ] `skills/*/SKILL.md` 구조 규격 확인
3. [ ] `agents/*.md` frontmatter 필수 필드 확인
4. [ ] `disallowedTools` 설정 존재 여부
5. [ ] 코드 안전성 스캔 (eval, execSync 등)
6. [ ] 산출물: `docs/04-qa/{feature}-plugin-validation.md`

### 레거시 호환

`/vais validate-plugin` → CSO Gate B 자동 실행
`vais-validate-plugin` 스킬 트리거 → CSO로 라우팅

### C-Suite 체이닝에서의 역할

`/vais cto:cso {feature}`:
- CTO 구현 완료 후 → CSO 보안 게이트
- CTO 코드를 컨텍스트로 보안 검토

`/vais ceo:cto:cso {feature}`:
- CEO 전략 → CTO 구현 → CSO 보안/배포 검증 최종 게이트
