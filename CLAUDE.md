# VAIS - Claude Code Plugin

> **이 파일의 책임**: Claude Code 전용 프로젝트 지침 (세션 시작 시 자동 로드). 처음이면 `ONBOARDING.md` 5분 가이드 먼저.
>
> v2.0.0 — Claude Code marketplace plugin: `vais-code`

## What This Project Is

**개발 이력 + 일관성 도구.** `plan → do → review` 3단계 워크플로우로 피처마다 문서 3개(plan/notes/review)를 남기고, `guidelines/` 지침이 코드·문서 일관성을 잡는다. review 마다 교훈을 지침으로 승격하는 루프가 일관성의 엔진. 추가로 `design-system/brands/` 71종 브랜드 토큰 기반 **HTML 보고서/슬라이드 생성기** (`/vais report`, `/vais deck`)를 제공한다.

v1.x 의 C-Suite 조직 시뮬레이션(6 C-Level + sub-agent 47)은 v2.0 에서 제거됐다 — 근거: `docs/260730_vais_code_review/`.

## Structure

```
vais-claude-code/
├── skills/vais/       # /vais 진입점 — SKILL.md + phases/(plan|do|review) + utils/(status|init|commit|help)
├── skills/report/     # /vais report·deck·brand — SKILL.md + design-rules.md
├── agents/            # 실행 sub-agent 7: frontend/backend/test/qa-engineer, ui-designer, incident-responder, security-auditor
├── guidelines/        # 살아있는 지침 — code-conventions(≤3KB) + doc-conventions(≤2KB), 크기 예산제
├── knowledge/         # lazy-load 지식 2: architecture-decision, owasp-top10-checklist
├── hooks/             # SessionStart(상태 요약) + PreToolUse Bash(위험 명령 차단) + Stop(1줄 힌트)
├── lib/               # status / paths / io / fs-utils / core(migration)
├── scripts/           # bash-guard, stop-handler, vais-validate-plugin, import-awesome-design-md, check-legacy-paths
├── templates/         # plan / notes / review / design.slim / report.html / deck.html
├── design-system/     # brands/{slug}/DESIGN.md — 5 사전 박제 + 66 lazy import (MIT)
├── docs/              # docs/{feature}/plan.md + notes.md + review.md (+assets/) · 과거 산출물: docs/_archive/
└── vais.config.json   # 워크플로우·지침 예산·designSystem 설정 (~50줄)
```

## Workflow

```
/vais plan {feature}   범위·접근·완료 조건 → docs/{feature}/plan.md (30분 내 작업이면 "바로 실행" 제안)
/vais do {feature}     구현 — 필요 시 sub-agent 병렬 위임, 결정은 notes.md 한 줄 append (--design: UI 설계 선행)
/vais review {feature} 완료 조건 대조 + review.md + 지침 승격 루프
/vais report|deck      brand 스타일 자체 포함 HTML 보고서/슬라이드 (skills/report/design-rules.md 준수)
/vais status|init|commit|help
```

## Rules

1. **기획 없이 코드 금지** — `docs/{feature}/plan.md` 없이 구현하지 않는다 (scope probe 로 "바로 실행" 합의한 소규모 작업 제외)
2. **plan → do → review 순서** — plan 은 docs/ 만 작성 (프로덕트 코드 수정 금지), review 는 결함 교정만
3. **문서는 피처당 3파일** — plan/notes/review (형식·상한: `guidelines/doc-conventions.md`). 그 외 문서 생성 금지, 큰 산출물은 `assets/`
4. **지침 준수 + 승격** — 작업 전 `guidelines/` Read, review 마다 승격 루프 실행. 지침 크기 예산은 validator 가 강제
5. **위험 명령 금지** — `rm -rf`, `git push --force`, `DROP TABLE` (bash-guard 가 차단). 민감 정보는 환경 변수로만
6. **사용자 결정 존중** — 범위 확장은 사용자 승인 후. 결정이 갈리는 분기만 AskUserQuestion (확인 의식 금지)
7. **커밋은 `/vais commit`** — 메시지 생성 + 버전 동기화(아래 5곳) + 사용자 확인. 직접 git commit 금지

## Version Sync (5곳)

`package.json` · `vais.config.json` · `.claude-plugin/plugin.json` · `.claude-plugin/marketplace.json` (metadata + plugins[0]) · `CHANGELOG.md`

## Testing

```bash
npm test                              # node --test tests/*.test.js
node scripts/vais-validate-plugin.js  # 구조 + 버전 동기화 + 지침 예산 검증
```

## Do NOT

- `docs/_archive/` 는 읽기 전용 이력 — 수정·삭제 금지
- 레거시 top-level `docs/NN-` 경로 금지 (`.hooks/pre-commit` 이 차단, `--no-verify` 금지)
