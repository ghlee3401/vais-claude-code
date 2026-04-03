# VAIS Code - Claude Code Plugin

> Virtual AI C-Suite for software development (v0.36.1)
> Claude Code marketplace plugin: `vais-code`

## What This Project Is

하네스 엔지니어링 시스템. Claude Code 위에서 C-Suite 에이전트 조직을 구성하여 5단계 개발 워크플로우를 자동 실행하는 플러그인.

## Project Structure

```
vais-claude-code/
├── agents/          # C-Suite + 실행 에이전트 정의 (20개)
├── skills/vais/     # SKILL.md + phases/ + utils/
├── hooks/           # hooks.json, events.json, session-start.js
├── lib/             # 핵심 라이브러리 (fs-utils, io, memory, paths, status, ui)
├── scripts/         # bash-guard, phase-transition, auditors 등
├── templates/       # PDCA 문서 템플릿 (plan, design, do, qa, report)
├── mcp/             # MCP 서버 설정
├── output-styles/   # 출력 스타일 정의
├── docs/            # 피처별 산출물 (01-plan ~ 05-report)
├── references/      # 참고 문서
├── basic/           # 하네스 엔지니어링 최소 참조 구조 (패턴 참고용, 프로덕션 코드 아님)
├── vendor/          # 외부 의존 (ui-ux-pro-max)
├── tests/           # 테스트
├── vais.config.json # 플러그인 전체 설정 (워크플로우, 게이트, C-Suite 역할)
├── package.json     # 플러그인 매니페스트
└── AGENTS.md        # 범용 에이전트 지침 (Cursor/Copilot 호환)
```

## Agent Architecture

### C-Suite (전략 레이어, Opus)
| Agent | Role |
|-------|------|
| CTO | 기술 총괄 오케스트레이터 (필수) |
| CEO | 비즈니스 전략 + absorb 오케스트레이터 |
| CPO | 제품 방향 + PRD + pm-* 서브에이전트 오케스트레이션 |
| CFO | 재무 분석, ROI, 가격 책정 |
| CMO | 마케팅 + SEO 감사 위임 |
| CSO | 보안 Gate A + 플러그인 배포 검증 Gate B |
| COO | 운영, CI/CD, 모니터링 |

### Execution (실행 레이어, Sonnet)
architect, backend, frontend, design, qa, security, seo, validate-plugin

### PM (제품 기획 레이어, CPO 서브)
pm-discovery, pm-strategy, pm-research, pm-prd

### Utility
absorb-analyzer (CEO 서브, 레퍼런스 흡수 분석)

## Development Workflow (5 Phases)

```
📋 plan → 🎨 design → 🔧 do (frontend + backend 병렬) → ✅ qa → 📊 report
```

- do 단계에서 frontend + backend은 병렬 실행
- 각 단계 간 Gate 체크포인트에서 완료 조건 검증
- Gate 동작은 `vais.config.json > orchestration.gateAction` 참조

## Key Configuration

- **vais.config.json**: 워크플로우 단계, C-Suite 역할, 게이트, gap 분석 기준(90%), 피처명 규칙 등 전체 설정
- **hooks/hooks.json**: Claude Code 훅 정의
- **package.json > claude-plugin**: 스킬/에이전트/훅 진입점

## Mandatory Rules

1. **기획 없이 코드 금지** — `docs/01-plan/` 기획서가 없으면 구현하지 않는다
2. **워크플로우 순서 준수** — plan → design → do → qa → report 순서를 건너뛰지 않는다
3. **산출물 경로** — `docs/{번호}-{단계}/{role}_{feature}.{phase}.md` 형식 준수 (모든 C-Level 공통)
4. **Gate 통과 필수** — 각 Gate의 체크리스트 항목을 모두 확인한 뒤 다음 단계로 진행
5. **위험 명령 금지** — `rm -rf`, `DROP TABLE`, `git push --force` 사용 금지
6. **환경 변수** — 민감 정보는 반드시 환경 변수로 관리
7. **참조 투명성** — 외부 문서 참고 시 `// @see {URL}` 주석 추가
8. **C-Suite 호출 규칙** — 실행 에이전트(architect, backend, frontend 등)는 직접 호출 금지, 반드시 CTO를 통해 호출

## Version Management

버전은 다음 파일에서 동기화 필요:
- `package.json` (version)
- `vais.config.json` (version)
- `CHANGELOG.md`

커밋 시 `/vais commit` 플로우를 사용할 것.

## File Conventions

- 피처 이름: kebab-case 영문 권장 (`login`, `user-profile`, `payment`)
- 에이전트 파일: `agents/{role}.md` (frontmatter + 마크다운)
- 스킬 파일: `skills/{name}/SKILL.md`
- 템플릿: `templates/{phase}.template.md`
- 라이브러리: `lib/*.js` (CJS)

## Testing

```bash
node scripts/vais-validate-plugin.js  # 플러그인 구조 검증
```

## Do NOT

- AGENTS.md를 삭제하거나 CLAUDE.md와 병합하지 말 것 (Cursor/Copilot 호환용으로 유지)
- `vendor/` 내 파일을 직접 수정하지 말 것
- 에이전트 frontmatter 형식을 임의로 변경하지 말 것
- `vais.config.json`의 키 구조를 사전 합의 없이 변경하지 말 것
- `basic/` 디렉토리는 패턴 참고용 — 코드 리뷰, QA, 보안 점검 대상에서 제외
