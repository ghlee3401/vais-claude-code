# 05. 실행 플랜 — vais-code v2.0 슬림 재편

> 작성: 2026-07-30. 근거: 01~04 분석 문서.
> 목표: **"단계마다 문서를 남겨 다음 개발이 참조 + 지침(코드·스타일 일관성)을 따르는 개발"** 을 최소 비용 구조로 재구축.
> 버전: v1.1.0 → **v2.0.0** (breaking). 작업 브랜치: `rewrite/v2-slim`, phase별 커밋(`/vais commit` 플로우 유지).

## 확정 결정 사항 (위임받아 결정)

| # | 항목 | 결정 | 이유 |
|---|------|------|------|
| D1 | 워크플로우 | **plan → do → review 3단계** (design은 `--design` 옵션) | 6 phase의 절반은 의식이었음. UI 작업일 때만 design 활성 |
| D2 | 피처 문서 | **plan.md / notes.md / review.md 3파일 고정** | 이력은 "다음 개발자가 30초 안에 맥락 파악"이 목적 |
| D3 | 지침 | `guidelines/` 신설 2파일 + 승격 루프 (review 마지막 스텝) | 이력→지침 승격이 일관성의 엔진 |
| D4 | C-Suite | **폐지.** 오케스트레이션은 SKILL.md가 직접 | 시뮬레이션 레이어가 비용의 본체 (P1) |
| D5 | sub-agent | **7종 유지**: frontend/backend/test/qa-engineer, ui-designer, security-auditor, incident-responder | 실사용 이력 + 실행 가치 있는 것만 |
| D6 | PRD 계열 (R3) | 제거 (아카이브). 요구사항은 plan.md 섹션으로 흡수 | 목적은 개발 이력·일관성이지 제품 기획 조직이 아님 |
| D7 | 보안 (R3) | security-auditor 1종 유지, review phase 옵션 호출 | 감사 자체는 가치, Gate 체계는 폐지 |
| D8 | ideation (R3) | phase 폐지. scope probe만 plan 지침에 1줄 | 기존 피드백("30분 내면 바로 실행")과 일치 |
| D9 | 기존 docs (R3) | `docs/_archive/` 이동 (`.hooks/pre-commit` 예외 목록에 추가) | 이력 보존 + 검색 오염 방지 |
| D10 | notes 자동화 | 모델이 작업 중 한 줄 append (hook LLM worker 미채택) | m0-record-turn은 API key 의존 — 취약. 지침으로 충분 |
| D11 | 브랜드 선택 | design-mcp-trigger hook 폐지 → ui-designer.md 지시로 이동 | hook 강제보다 지시가 유지보수 쉬움. brands 자산은 유지 |

## Phase 0 — 즉시 수정 (되돌리기 쉬움, 효과 즉시)

| 작업 | 내용 |
|------|------|
| 0-1 | `package.json > claude-plugin.agents`: `["agents/"]` → 실제 에이전트 파일 명시 목록 (knowledge/_shared 제외) → 매 세션 ~2.5k 토큰 회수 |
| 0-2 | `hooks/session-start.js`: output-style 전문 중복 주입 제거. 주입은 **상태 5줄 요약만** (ASCII 박스 2개 폐지) |
| 0-3 | `lib/mcp-validator.js` 삭제 + 참조 제거 (`hooks/design-mcp-trigger.js` 등) |

**검증**: `npm test` + `node scripts/vais-validate-plugin.js` + 새 세션에서 에이전트 목록/주입량 확인.

## Phase 1 — 지침 체계 신설 (additive, 기존과 충돌 없음)

| 작업 | 내용 |
|------|------|
| 1-1 | `guidelines/code-conventions.md` (≤3KB) 작성 — 기존 lib/ 코드에서 추출: CJS, 파일·함수 네이밍, 에러 처리(fail-safe silent vs throw 기준), 테스트 작성 기준, 의존성 최소화 원칙 |
| 1-2 | `guidelines/doc-conventions.md` (≤2KB) 작성 — 문서 3종의 목적·형식·**길이 상한**(plan ≤80줄, notes 제한 없음/한 줄 단위, review ≤60줄), frontmatter 2필드(`feature`, `updated`), 한국어 규칙, **승격 루프 절차** |
| 1-3 | 지침 메타 규칙 명문화: 크기 예산제(초과 시 1 추가 = 1 제거), 검증 가능한 규칙만, 중복 기술 금지(참조만 허용) |

## Phase 2 — 워크플로우 재작성 (신구 교체의 핵심)

| 작업 | 내용 |
|------|------|
| 2-1 | `skills/vais/SKILL.md` 재작성 (≤3KB): 액션 = `plan / do / review / status / init / commit / help / report / deck`. Trigger에서 범용 단어(리뷰·검토·시작·조사 등) 제거. 아웃트로/AskUserQuestion 강제 체인/박스 리포트 규칙 전부 삭제 |
| 2-2 | `skills/vais/phases/` 재작성: `plan.md`, `do.md`, `review.md` 각 ≤2KB. plan에 scope probe 1줄(D8), do에 "결정 시 notes.md 한 줄 append"(D10), review에 승격 루프 스텝(D3) + security-auditor 옵션(D7) |
| 2-3 | `templates/` 재구성: `plan.template.md`, `notes.template.md`, `review.template.md`, `design.template.md`(슬림) 4개 신규 작성 |
| 2-4 | `output-styles/vais-default.md` 재작성: 응답 상단 phase 아이콘 1줄만 유지. 하단 박스 리포트·아웃트로 폐지 |
| 2-5 | `.vais/status.json` 스키마 v5: `{feature, phase(plan|do|review), updated, brand}` 수준으로 단순화 + `lib/status.js` 축소 (brand helpers 유지, lock/ideation/agent-state 제거) |
| 2-6 | `hooks/hooks.json` 재작성: **SessionStart / PreToolUse(Bash) / Stop** 3개만. stop-handler는 status 갱신만 수행하도록 축소 |
| 2-7 | 유지 sub-agent 7종 md 정비: _shared 참조·가드 주입 블록·Contract 표 제거, 각 ≤4KB로 압축. ui-designer에 brand 선택 지시 통합(D11) |

## Phase 3 — 대량 제거 + 아카이브

> 순서: **아카이브 → 삭제 → 참조 정리 → 테스트 정리**. 전부 git으로 복원 가능.

| 대상 | 조치 | 규모 |
|------|------|------|
| `agents/` C-Level 6 + sub-agent 40 + `_shared/` 8 | 삭제 (7종만 잔류, `agents/` 평면 구조로 이동) | ~380KB |
| `agents/*/knowledge/` 19 | `knowledge/`(최상위) 이동, **유지 2종만**: `architecture-decision.md`, `owasp-top10-checklist.md`. 나머지 삭제 | ~50KB |
| `templates/` 기존 51 | 삭제 (2-3의 4개 + Phase 4의 2개로 대체) | ~300KB |
| `skills/vais/phases/` 구 7종, `utils/` 중 next/dashboard/mcp-builder/skill-creator/teams-*/schedule-* | 삭제. utils 잔류: status/init/commit/help | ~50KB |
| `scripts/` 29종 | 삭제: patch-* 3, doc-validator, template-validator, auto-judge, gate-check, cp-guard, cp-tracker, doc-tracker, sub-agent-audit, phase-transition, generate-dashboard, seo-* 3, auditors/ 7, advisor-call, agent-start, agent-stop, prompt-handler, get-context, migrate-status-v3-to-v4, check-cc-advisor-support, auto-select-template. **잔류 8**: bash-guard, stop-handler, build-catalog, import-awesome-design-md, vais-validate-plugin(축소), setup-dev.sh, check-legacy-paths.sh(규칙 갱신), skill_eval | ~220KB |
| `hooks/` ideation-guard, checkpoint-keyword, design-mcp-trigger, events.json | 삭제 | ~25KB |
| `lib/` | 삭제: project-profile, ceo-algorithm, llm-heuristic, m0-record-turn, patch-block, worktree-manager, absorb-evaluator, webhook, cc-version-detect, advisor/, control/, observability/, registry/, quality/, ui/(의존 확인 후). **잔류**: fs-utils, io, paths(축소), status(축소), memory, brand-validator, hook-logger, debug, core/(의존 확인 후) | ~110KB |
| Agent Teams 전체 (conversation-orchestrator, subagent-dispatcher, config 항목) | 삭제 + `vais.config.json > orchestration.agentTeams` 키 제거 | ~20KB |
| `vais.config.json` | 재작성 ≤100줄: version, workflow(3 phase + docPaths), designSystem, gapAnalysis(review용 축소), safety | 541→~100줄 |
| `docs/` 기존 피처 9폴더 | `docs/_archive/`로 이동 (260730_vais_code_review는 최상위 유지) | 639KB 이동 |
| `tests/` | 삭제 모듈의 테스트 제거, paths/status 테스트 새 스키마로 수정 | ~150KB |
| `catalog.json` | `build-catalog.js` 재실행으로 재생성 | — |

**검증**: `npm test` green + `grep -r` 로 삭제 모듈 잔여 참조 0 확인 + `/vais plan|do|review|status|commit` 수동 스모크.

## Phase 4 — 보고서/덱 생성기 신설 (04 문서 설계대로)

| 작업 | 내용 |
|------|------|
| 4-1 | `skills/report/SKILL.md` (≤4KB): 파이프라인 5단계 (소재→아웃라인 승인→브랜드→생성→디자인 QA) |
| 4-2 | `skills/report/design-rules.md`: AI-slop 금지 8항 + 타이포 스케일 + 차트 색상 규칙 + 국문 조판 |
| 4-3 | `templates/report.html` + `templates/deck.html`: 자체 포함, CSS 변수 토큰 슬롯, `@media print`, 인라인 SVG 차트 패턴 |
| 4-4 | `/vais report`, `/vais deck` 라우팅 (SKILL.md에 이미 예약, phases/report.md 작성) |
| 4-5 | **Dogfood 검증**: 본 리뷰(260730)를 `/vais report`로 HTML화 → 결과를 보고 스켈레톤 1회 다듬기 |
| 4-6 | `/vais brand new` — 커스텀 브랜드 생성 헬퍼: 색상/폰트/참고 URL 몇 가지 질문 → `design-system/brands/custom-{name}/DESIGN.md` 를 Google Stitch 포맷으로 자동 생성 (사내 CI·개인 스타일용) |

## Phase 5 — 문서·버전 정리 (마무리)

| 작업 | 내용 |
|------|------|
| 5-1 | `CLAUDE.md` 재작성 (≤4KB): 새 구조 + Mandatory Rules 15 → **7** (기획 없이 코드 금지 / 3단계 순서 / 문서 3파일 / 지침 준수+승격 / 위험 명령 금지 / 환경 변수 / 사용자 결정 존중) |
| 5-2 | `AGENTS.md` / `ONBOARDING.md` / `README.md` 동기 재작성 |
| 5-3 | `CHANGELOG.md` v2.0.0 entry (Removed 중심 — Keep a Changelog) |
| 5-4 | 버전 동기화 5곳: package.json / vais.config.json / plugin.json / marketplace.json ×2 |
| 5-5 | `.hooks/pre-commit` 규칙 갱신 (docs/_archive 예외, 새 문서 구조 반영) |
| 5-6 | 최종 검증: 전체 테스트 + validate + 새 세션 스모크 → `main` 머지 |

## 실행 규칙

1. **phase 단위 커밋** — 각 phase 완료 시 `/vais commit` (되돌림 단위 확보)
2. **삭제 전 참조 검색** — 파일 삭제 전 `grep -r "{filename}"` 으로 잔여 참조 확인
3. **기존 워크플로우와의 호환은 고려하지 않음** — v2.0 breaking, 진행 중 피처(plan-scope-contract)는 완료 상태이므로 영향 없음
4. 각 phase 종료 시 진행 상황을 이 폴더의 `notes.md`에 한 줄 append (새 규칙의 첫 dogfood)

## 예상 결과

| 지표 | 현재 | 완료 후 |
|------|------|--------|
| 소스 크기 | ~1.5MB | ~400KB |
| 세션 고정 오버헤드 | ~7.3k 토큰 | ~2k |
| phase 1회 로드 | ~15-20k | ~3-4k |
| 피처당 문서 | 17파일 | 3파일 |
| 등록 에이전트 | ~80 | 7 |
| hook 이벤트 | 8 | 3 |
| 신규 가치 | — | 지침 체계 + 승격 루프 + HTML 보고서/덱 생성기 |
