# 03. 권고안 — 유지 / 제거 / 추가

> 원칙: **"이력 + 일관성 + 완성도"를 지키는 최소 구조**로 재편.
> 판단 기준 3문항 — ① 이 요소가 없으면 이력/일관성/완성도가 실제로 나빠지는가? ② 이 요소가 소모하는 토큰이 산출 가치보다 작은가? ③ 모델 지시 대신 하네스(hook/코드)로 대체 가능한가?

## 1. 유지 (KEEP) — 핵심 가치 자산

| 자산 | 이유 | 조정 |
|------|------|------|
| `/vais` 스킬 진입점 | 워크플로우 일관성의 앵커 | SKILL.md 9.5KB → **3KB 이하**로 압축. Trigger 목록에서 `리뷰, 검토, 시작, 조사` 등 범용 단어 제거 |
| plan → do → review 루프 | 완성도(목적 2)의 핵심. "기획 없이 코드 금지"는 유지 가치 있음 | 6 phase → **3 phase** (plan / do / review). design·report는 옵션 플래그 |
| `docs/{feature}/` 이력 | 목적 1의 본체 | 피처당 **최대 3파일**: `plan.md`, `notes.md`(결정 로그 append), `review.md` |
| `.vais/status.json` + session-start 복원 | 세션 간 맥락 연결 — 잘 만든 부분 | session-start 주입을 **5줄 요약**으로 축소 (현 6KB → ~0.5KB). output-style 중복 주입 제거 |
| `design-system/brands/` (71 brand) | 신규 보고서 기능의 스타일 정본으로 직결. 최근 투자 중 가장 재사용성 높음 | 유지 |
| `mcp/` design-system 서버 | brands 검색/생성 — 보고서 기능이 그대로 사용 | 유지 |
| `/vais commit` 플로우 | 버전 동기화 실수 방지 실효성 입증됨 | 유지 |
| `bash-guard.js` (위험 명령 차단) | 안전 하네스 — 저비용 고가치 | 유지 |
| CTO 실행 계층 sub-agent 일부 | 실제 병렬 구현에 사용됨 | frontend / backend / test / qa / ui-designer / security ~6종만 |
| knowledge lazy-load (manual @include) 패턴 | H4 PoC로 검증된 좋은 설계 | 패턴 유지, 대상 문서는 정리 |

## 2. 제거 (REMOVE) — 우선순위순

### R1. 즉시 (버그성, 1일 이내)

| 대상 | 조치 |
|------|------|
| `package.json > agents: ["agents/"]` | 에이전트 파일만 명시 등록 또는 `_shared/`·`knowledge/`를 `agents/` 밖으로 이동 → **매 세션 ~2.5k 토큰 즉시 회수** |
| session-start의 output-style 전문 중복 주입 | additionalContext에서 응답 스타일 제거 (outputStyles 등록만 유지) |
| `lib/mcp-validator.js` | 이미 deprecated — 삭제 |

### R2. 구조 축소 (핵심 결정)

| 대상 | 조치 | 회수 효과 |
|------|------|----------|
| **C-Suite 6 → 1 오케스트레이터** | CEO/CPO/CSO/CBO/COO 롤플레이 폐지. CTO 오케스트레이션 로직만 `/vais`의 본체로 승격. 보안 리뷰는 `review` phase의 체크 항목으로 흡수 | 에이전트 57KB + 라우팅 로직 + 승인 turn 다수 |
| sub-agent 47 → ~6 | CBO 10, COO 8, CEO 유틸 6, CPO PM 5, CSO 5 제거·아카이브 | ~280KB, 목록 오염 해소 |
| CEO 7차원 알고리즘 + `ceo-algorithm.js` + seven-dimension-routing | 폐지. "다음에 뭘 할지"는 모델의 기본 판단 + 사용자 결정으로 충분 | 11.5KB + 판단 turn |
| Agent Teams v2 전체 (conversation-orchestrator, worktree-manager, lock, teams-* utils) | 실험 완료 → `docs/_archive/` 또는 별도 브랜치로 박제 후 제거. 서브에이전트 병렬은 CC 기본 Agent 도구로 충분 | ~30KB + hook 2종 |
| 템플릿 51 → ~6 | plan / notes / review / (옵션) design / report + 신규 보고서 스켈레톤. why/what/how/core/biz/alignment 6계층 폐지 | ~280KB |
| 가드 8종 → 0 | main.md 인덱스 규칙, Decision Record, Owner 컬럼, subdoc frontmatter 8필드, 아웃트로 포맷 전부 폐지. 남길 규칙은 새 SKILL.md 안에 10줄 이내로 | 28KB + 중복 기술 3~4곳 |
| 문서 의식 | frontmatter → `date + feature` 2필드, 변경 이력 표 폐지 (git이 이력), main.md 인덱스 폐지, Decision Record → notes.md에 한 줄 append | 피처당 17파일 → 3파일 |
| SubagentStop `exit(1)` 문서 강제 | 차단 → 경고로 완화 또는 제거 | 문서 인플레이션 근절 |
| 아웃트로 2블록 + AskUserQuestion 강제 체인 + 박스 하단 리포트 | 폐지. 상태 표시가 필요하면 statusline(하네스)으로 | turn당 ~150 출력 토큰 |
| hook 8 → 3 | 유지: SessionStart, PreToolUse(Bash), Stop(상태 기록만). 제거: doc-tracker, ideation-guard, cp-tracker, checkpoint-keyword, agent-start/stop, design-mcp-trigger(→ ui-designer 지시로 이동) | 프로세스 spawn 5종 |
| scripts 37 → ~8 | 유지: build-catalog, import-awesome-design-md, vais-validate-plugin(축소판), setup-dev. 제거: patch-* 3종, doc-validator, template-validator, auto-judge, gate-check, sub-agent-audit, cp-guard, phase-transition, seo-* 4종(→ 제거되는 seo-analyst 소속), auditors/ 7종, generate-dashboard | ~200KB |
| `lib/` God-module 해체 | status.js 29KB에서 brand/lock/ideation 분리 후 미사용 제거. project-profile.js(21KB), observability/, advisor/, registry/, quality/gate-manager 등 사용처 없는 모듈 제거 | ~100KB |

### R3. 결정 필요 (사용자 판단 항목)

| 대상 | 쟁점 |
|------|------|
| CPO/PRD 계열 (prd-writer 등 5종) | 실사용 이력 있음. "기획 문서 품질"을 유지하고 싶으면 prd-writer 1종만 남기는 절충 가능 |
| CSO 보안 계열 (security-auditor, secret-scanner) | 독립 에이전트 대신 review phase 체크리스트로 흡수하는 게 기본 권고. 단, 보안 감사를 자주 쓴다면 2종 유지 |
| ideation phase | "30분 내 직접 편집 가능하면 바로 실행" 피드백이 이미 있음 → scope probe만 남기고 phase 자체는 폐지 권고 |
| docs/ 기존 산출물 (639KB) | `docs/_archive/`로 이동 권고 (이력 보존 + 검색 오염 방지) |

## 3. 추가 (ADD)

| 신규 | 내용 | 상세 |
|------|------|------|
| **HTML 보고서 생성기** `/vais report` | brands DESIGN.md 기반 스타일링 + 안티-AI-slop 디자인 규칙 | [04-report-generator-proposal.md](04-report-generator-proposal.md) |
| **슬라이드 덱 생성기** `/vais deck` | 16:9 HTML 슬라이드 (print-to-PDF), 옵션 pptx 내보내기 | 동상 |
| `notes.md` 자동 append hook | Stop hook이 그 턴의 결정 1줄을 notes.md에 기록 (모델 지시가 아니라 하네스가 수행 — P3 교훈 적용) | 기존 m0-record-turn.js 재활용 가능 |
| statusline 진행 표시 | 박스 리포트 대신 CC statusline에 `feature [2/3] do` 표시 | 출력 토큰 0 |

## 4. 목표 아키텍처

```
vais-claude-code/  (목표: 소스 ~1.5MB → ~400KB)
├── skills/vais/
│   ├── SKILL.md          # ≤3KB — 라우팅 + 핵심 규칙 10줄
│   ├── phases/           # plan.md / do.md / review.md (각 ≤2KB)
│   └── utils/            # status / init / commit / help
├── skills/report/        # 신규 — 보고서/덱 생성기
├── agents/               # orchestrator 1 + 실행 6 (frontend/backend/test/qa/ui-designer/security)
├── knowledge/            # agents/ 밖으로 이동 (등록 오염 해소)
├── hooks/                # session-start / bash-guard / stop(notes append)
├── lib/                  # status / paths / io / fs-utils / memory
├── templates/            # plan / notes / review / report-html / deck-html / design
├── design-system/brands/ # 유지 — 보고서 기능의 스타일 정본
├── mcp/                  # 유지
└── docs/                 # 피처당 plan.md + notes.md + review.md
```

### 비용 비교 (추정)

| 지표 | 현재 | 목표 | 절감 |
|------|------|------|------|
| 세션 고정 오버헤드 | ~7.3k 토큰 | ~2k | -73% |
| phase 1회 프레임워크 로드 | ~15-20k | ~3-4k | -80% |
| 피처 1개 문서 | 17파일/1,701줄 | 3파일/~200줄 | -88% |
| 등록 에이전트 | ~80 | ~8 | -90% |
| 유지보수 소스 | ~1.5MB | ~400KB | -73% |

## 5. 이행 순서 제안

1. **Phase 0 (1일)**: R1 즉시 수정 3건 — 되돌리기 쉬움, 효과 즉시
2. **Phase 1**: 새 SKILL.md + 3-phase 루프 + 문서 규칙 교체 (기존 레이어와 병행 가능하게 작성 후 스위치)
3. **Phase 2**: 에이전트/템플릿/스크립트/lib 대량 제거 + `docs/_archive/` 이동
4. **Phase 3**: 보고서/덱 생성기 추가 (04 문서)
5. 각 Phase 종료 시 `node scripts/vais-validate-plugin.js`(축소판) + 수동 스모크 (`/vais plan`, `/vais status`, `/vais commit`)
