---
name: cto
description: CTO 에이전트 호출. 기술 도메인 전체 오케스트레이션 (plan→design→do→qa→report). test-builder/deploy-ops/db-architect 위임 가능.
---

# CTO Phase

`${CLAUDE_PLUGIN_ROOT}/agents/cto/cto.md`를 읽고 그 안의 지침에 따라 실행하세요.

## 인자 파싱

전달 인자 원본: `$1`

### Phase 분리 규칙

`$1`의 **첫 단어**가 아래 목록에 해당하면 phase로 분리합니다:

| 키워드 | phase |
|--------|-------|
| `plan` | plan |
| `design` | design |
| `do` | do |
| `qa` | qa |
| `report` | report |

- **Phase 명시**: `/vais cto plan my-feature` → phase=`plan`, feature=`my-feature`
- **Phase 생략**: `/vais cto my-feature` → phase=미지정, feature=`my-feature`

### Phase 미지정 시 동작

1. `.vais/status.json`에서 해당 feature의 현재 진행 상태를 확인합니다
2. 다음에 실행할 phase를 판별합니다 (순서: plan → design → do → qa → report)
   - status 파일이 없거나 feature가 없으면 → `plan`부터
   - 이전 phase가 완료되어 있으면 → 다음 phase
   - **mandatory phase 스킵 금지**: plan, design, do, qa는 반드시 순서대로 실행. 이전 mandatory phase가 미완료면 해당 phase부터 실행 (예: plan 완료 후 design 미완료 → design부터)
3. **AskUserQuestion으로 사용자에게 확인**합니다:
   ```
   "{feature}"의 다음 단계는 [{phase}]입니다. 실행할까요?
   ```
   선택지: `실행` / `다른 단계 선택` / `중단`
4. 사용자가 "다른 단계 선택"을 고르면 phase 목록을 보여주고 선택받습니다
5. 사용자가 mandatory phase를 건너뛰려는 경우, 경고를 표시합니다:
   ```
   ⚠️ [{스킵하려는 phase}]는 필수 단계입니다. 이전 단계를 먼저 완료해주세요.
   ```

## 에이전트 전달

- action: `$0`
- phase: (위에서 결정된 phase)
- feature: (위에서 분리된 feature)
