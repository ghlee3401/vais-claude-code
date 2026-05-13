---
name: coo
version: 2.0.0
description: COO 에이전트 호출. 운영 프로세스, CI/CD 파이프라인, 모니터링. v2.0 Secondary — CEO 자동 라우팅 제외, 사용자 명시 호출만 활성. Mandatory phase 순서 미적용 (CTO PDCA 만 mandatory).
---

# COO Phase

`${CLAUDE_PLUGIN_ROOT}/agents/coo/coo.md`를 읽고 그 안의 지침에 따라 실행하세요.

## 인자 파싱

전달 인자 원본: `$1`

### Phase 분리 규칙

`$1`의 **첫 단어**가 아래 목록에 해당하면 phase로 분리합니다:

| 키워드 | phase |
|--------|-------|
| `plan` | plan |
| `do` | do |
| `qa` | qa |

- **Phase 명시**: `/vais coo plan my-feature` → phase=`plan`, feature=`my-feature`
- **Phase 생략**: `/vais coo my-feature` → phase=미지정, feature=`my-feature`

### Phase 미지정 시 동작 (v2.0 Secondary 정책)

COO 는 Secondary C-Level 입니다. CEO 자동 라우팅이 활성화하지 않으며, 사용자 명시 호출 시에만 실행합니다.

1. phase 가 없으면 AskUserQuestion 으로 `plan|do|qa` 중 하나를 선택받습니다.
2. `.vais/status.json` 은 참고만 합니다. mandatory phase 순서나 skip 경고는 적용하지 않습니다.
3. 사용자가 `design` 또는 `report` 를 요청하면 다음 중 하나로 재확인합니다.
   - `COO plan` — 운영/배포/모니터링 계획
   - `COO do` — CI/CD, container, migration, runbook 실행 산출물
   - `COO qa` — 운영 readiness / release 검증
   - `CTO phase 로 전환` — 기술 PDCA 가 필요한 경우

## 에이전트 전달

- action: `$0`
- phase: (위에서 결정된 phase)
- feature: (위에서 분리된 feature)

## 완료 후 처리

COO 완료 후에는 CEO 자동 라우팅을 새로 실행하지 않습니다. 결과 요약을 출력하고 AskUserQuestion 으로 다음 중 하나를 선택받습니다.

- CTO 로 전환 — `/vais cto {nextphase} {feature}`
- CPO/CSO 검토 요청 — 사용자가 명시 선택한 경우
- COO 다른 phase 실행 — `/vais coo plan|do|qa {feature}`
- 종료
