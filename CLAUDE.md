# VAIS Code — Claude Code 프로젝트 지침

> **이 파일의 책임**: Claude Code 전용 지침. 세션 시작 시 자동 로드된다. 처음 본 AI/사람은 `ONBOARDING.md`(5분), 사용법은 `README.md`.
>
> 상태: **2026-09-15 청소 완료.** Legacy(C-Suite 에이전트·템플릿·구 hook·구 lib·구 문서)를 전부 제거했고, 지금은 v2 runtime 커널 위에 "비개발자용 개발 하네스" 를 새로 설계·구현하는 단계다. 롤백은 git 태그 `v3.0.1-legacy`.

## 이 플러그인이 만드는 것

**비개발자가 개발자처럼 웹 앱을 만들게 해주는 Claude Code 하네스.** 사용자는 말로 시키고 결정만 한다. 플러그인은 Plan → Design → Do → Review → Report 를 runtime 으로 강제하고, 기록하고, 결과를 눈으로 확인시킨다.

설계 원칙 (모델이 바뀌어도 유지):

- **루프 하나**: 말하기 → 요청 확인 → 고르기 → 만들기(자동) → 확인(최대 5회) → 기록(자동)
- **모델을 못 믿는 부분만 코드로 강제** (승인 Gate, write scope, 기록, 증거, 고장 알림). 모델이 잘하는 부분은 데이터(역할 카드·양식·지시문)로 둔다.
- **단일 VAIS 목소리**. C-Level·specialist 이름은 내부 role id 일 뿐 사용자에게 노출하지 않는다.
- **정직**: 실행하지 않은 검사, 확인하지 못한 화면을 만들어내지 않는다.

## 현재 구조 (청소 후)

```
vais-claude-code/
├── skills/vais/SKILL.md      # /vais managed entry (enforce 전용)
├── skills/brief/             # /vais brief — 임원 보고서 (워크플로우 독립)
├── agents/v2-specialist.md   # 유일한 위임 대상 Agent
├── hooks/
│   ├── hooks.json            # UserPromptSubmit · PreToolUse · PostToolUse 만 등록
│   ├── workflow-v2-prompt.js         # 라우팅·승인 판정·단계 지침·drift·lease
│   ├── workflow-v2-write-guard.js    # write scope·셸 합성 차단 (fail-closed)
│   ├── workflow-v2-agent-handoff.js  # specialist handoff 자동 저장
│   ├── workflow-v2-drift.js          # 변경 경로 기록
│   ├── v2-project-context.js · run-node.sh
├── lib/workflow/v2/          # 23 모듈: state-machine · work-item-store · phase-transaction · gate-engine ·
│                             #   router · write-policy · tool-adapters · document-manager/quality · phase-check ·
│                             #   context-capsule/view · repo-drift · role-registry · agent-policy · automatic-handoff …
├── lib/core/state-store.js · lib/io.js · lib/context-metrics.js
├── scripts/vais-workflow-v2.js       # 내부 workflow CLI (hook 이 명령 형태를 지정)
├── scripts/checks/v2-secret-scan.js · scripts/vais-validate-plugin.js · scripts/setup-dev.sh
├── contracts/v2-role-cards.json      # 역할 정본 (23 role: c-level 7 · judgment 12 · implementation 4)
├── schemas/                  # work-item · specialist-assignment · specialist-handoff · check-result · gate-result ·
│                             #   phase-transaction-receipt · review-evidence-prepare · automatic-handoff-evidence
├── output-styles/vais-default.md
├── mcp/ · design-system/ · vendor/   # UI 설계용 design-system MCP (보류 — ui-loop 설계에서 결정)
├── tests/v2-*.test.js (10) + tests/fixtures/mini-booking
├── vais.config.json          # version · plugin · workflowV2 만
└── ONBOARDING.md · README.md · CLAUDE.md · CHANGELOG.md
```

## enforce 동작 규칙 (Mandatory)

`vais.config.json > workflowV2.mode = enforce` 일 때. 정본은 `skills/vais/SKILL.md` + `hooks/workflow-v2-prompt.js`.

1. **Hook 컨텍스트가 runtime 정본** — UserPromptSubmit hook 이 주입한 `[feature · phase · status]`, managed action, 단계 지침, owner 역할 카드를 그대로 따른다. 응답 첫 줄에 그 상태 한 줄을 쓴다.
2. **단일 VAIS voice** — C-Level·specialist 를 사용자에게 고르게 하지 않는다.
3. **Gate 우회 금지** — Plan·Design 은 사용자 명시 승인(`/vais plan 승인`, `/vais design 승인`) 후에만 다음으로. Ideation 은 Plan 안에.
4. **상태 변경은 내부 CLI 로만** — `plan present` / `design present` / `do ready` / `review prepare` / `review decide` / `report finalize` / `assignment` / `handoff`. `.vais/v2/` 직접 편집 금지. FAIL 이면 finding 만 고쳐 재실행.
5. **위임은 `v2-specialist` 만** — `assignment` receipt + runtime 역할 프롬프트. specialist 는 `specialist-handoff/v1` JSON 만 반환. Agent 결과가 나중에 task notification 으로 오면 raw JSON 을 phase 폴더 `handoff.json` 에 저장 후 `handoff --id … --assignment … --handoff-file …` 1회.
6. **Design 승인 후 자동 진행** — Do → Readiness → Review evidence → 독립 QA 결과 제시까지. BLOCKED·drift·QA FAIL 에서만 멈춘다.
7. **Review 는 read-only 독립 QA** — `independent-qa` clean-room, `--code-write false`, 정확히 1회. AI QA PASS 후에만 최종 승인 요청.
8. **write scope** — Do 는 Design 이 선언한 scope 안에서만. `.git`, `.vais`, `docs/work-items`, `docs/features`, `docs/README.md` 는 scope 불가.
9. **`/vais` 없는 대화는 읽기 전용.**
10. **산출물** — `docs/work-items/{feature}/{YYYY-MM-DD-slug}/01-plan|02-design|03-do|04-review|05-report/main.md`. Plan 초안은 `.vais/v2/drafts/plan.md`, 이후 초안은 phase 폴더 안에 두고 `--body-file` 로 넘긴다.
11. **ID** — `REQ-001`, `TC-001` 3자리. Design REQ 집합 = Plan REQ 집합, Review TC 집합 = Design TC 집합.
12. **문서 예산** — compact / standard / extended byte 한도 (`lib/workflow/v2/document-quality.js`). 이전 단계 문장(80자 이상) 복사 금지.
13. **check id 7종** — `test, e2e, build, lint, plugin-validator, dependency-scan, secret-scan`.
14. **Bash** — 한 번에 한 명령. `&&`, `|`, `;`, 리다이렉션, `$( )` 금지. 읽기는 Read/Grep 우선.
15. **위험 명령 금지** — `rm -rf`, `git push --force`, `git commit --no-verify`. 민감 정보는 환경 변수로만.

## mode 가 enforce 가 아닐 때

하네스가 꺼진 상태다. 첫 줄에 `[VAIS · 하네스 비활성]` 을 쓰고, 승인·범위·기록이 강제되지 않음을 알린다. 이 상태는 **하네스 자체를 고칠 때만** 쓴다. 작업이 끝나면 `enforce` 로 되돌린다.

## 자기 수정 시 주의

- 실행 중인 플러그인은 `~/.claude/plugins/cache/vais-marketplace/vais-code/{version}` 사본이다. 이 repo 를 고쳐도 push + 버전 bump + 플러그인 업데이트 전에는 반영되지 않는다.
- enforce 에서는 write guard 가 `vais.config.json`, `git commit`, repo 밖 쓰기까지 막는다. 하네스를 고칠 때는 사용자가 mode 를 `disabled` 로 내린 뒤 작업한다.

## Testing

```bash
npm test          # node --test tests/*.test.js
npm run lint      # eslint scripts/ lib/ hooks/ --max-warnings=0
npm run validate  # 플러그인 구조 검증
```

## Version Management

버전 동기화 파일: `package.json`, `vais.config.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (metadata.version + plugins[0].version), `CHANGELOG.md`, `README.md` 배지.

## Do NOT

- `.vais/v2/` 를 직접 편집하지 말 것
- `docs/README.md`, `docs/features/`, 완료된 Report 를 손으로 수정하지 말 것 (자동 생성·동결)
- `vendor/` 를 직접 수정하지 말 것
- `contracts/v2-role-cards.json`, `schemas/`, `vais.config.json` 키 구조를 사전 합의 없이 바꾸지 말 것
- 사용자 요청 없이 커밋하지 말 것
