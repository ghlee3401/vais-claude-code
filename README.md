<p align="center">
  <img src="https://img.shields.io/badge/version-3.0.1-blue?style=flat-square" alt="version" />
  <img src="https://img.shields.io/badge/Claude_Code-plugin-7C3AED?style=flat-square" alt="Claude Code Plugin" />
  <img src="https://img.shields.io/badge/license-MIT-brightgreen?style=flat-square" alt="license" />
</p>

<h1 align="center">VAIS Code</h1>

<p align="center">
  <strong>비개발자가 개발자처럼 웹 앱을 만들게 해주는 Claude Code 하네스</strong><br/>
  말로 시키고, 고르고, 확인한다. 나머지는 플러그인이 강제하고 기록한다.
</p>

---

> **현재 상태 (2026-09-15)**: Legacy 를 전부 걷어내고 v2 runtime 커널만 남긴 뒤, 새 하네스를 설계·구현하는 중이다. 아래 사용법은 지금 동작하는 커널 기준이며, 새 설계가 들어오면 갱신된다. 롤백: git 태그 `v3.0.1-legacy`.

## 무엇인가

개발은 한 번의 요청이 아니라 **한 루프의 반복**이다.

```text
말하기 → 요청 확인(한 줄) → 고르기 → [만들기: 자동] → 확인(최대 5회) → [기록: 자동]
```

사용자가 읽는 것은 "고르기" 와 "확인" 두 곳뿐이다. 플러그인은 그 사이의 기획·설계·구현·검증·보고를 runtime(hook + 상태 머신)으로 강제하고, 결정과 증거를 남긴다.

## 설치

| 의존성 | 버전 | 용도 |
|---|---|---|
| Node.js | ≥ 18 | plugin runtime, hook, 내부 CLI |
| Claude Code | ≥ 2.1.32 | UserPromptSubmit / PreToolUse / PostToolUse hook |
| Python3 | ≥ 3.8 | design-system MCP (UI 설계 시에만) |

```bash
git clone https://github.com/ghlee3401/vais-claude-code.git
cd vais-claude-code && npm install && bash scripts/setup-dev.sh
# Claude Code 에서
/reload-plugins
/vais status
```

## 사용법

### 명령

| 입력 | 동작 |
|---|---|
| `/vais <자연어 요청>` | 진행 중 작업이 없으면 새 작업 시작. 있으면 현재 단계의 지시·피드백 |
| `/vais status` (`상태`) | 현재 작업·단계·상태와 대기 요청 조회 (읽기 전용) |
| `/vais pause` (`일시정지`) / `resume` (`재개`) / `cancel` (`취소`) | 작업 슬롯 제어 |
| `/vais 새 작업: <요청>` | 진행 중 작업을 유지한 채 새 요청을 대기열에 보관 |
| `/vais brief <주제>` | 워크플로우와 무관한 임원 보고서 HTML (`--deck` 슬라이드) |

### 승인·거절

승인은 hook 이 정규식으로 판정한다. 아래 문구를 그대로 쓴다.

| 상황 | 입력 |
|---|---|
| Plan 제시 후 | `/vais plan 승인` 또는 `/vais 승인` |
| Design 제시 후 | `/vais design 승인` 또는 `/vais 승인` |
| AI QA PASS 후 | `/vais 최종 승인` |
| 수정 요청 | `/vais <수정 내용>` |
| 최종 거절 | `/vais 거절` |

`좋아`, `ok` 같은 모호한 답과 `조건부`, `대신` 이 섞인 문장은 승인으로 기록되지 않는다. `/vais` 가 없는 대화는 읽기 전용이다.

## 5단계

| 단계 | 산출 | 사용자 Gate |
|---|---|---|
| Plan | 문제·목표·범위·REQ-NNN·흐름·엣지 케이스·완료 조건·영향 | 승인 |
| Design | REQ별 동작·입출력·오류·TC-NNN, write scope, check, specialist 선택 | 승인 |
| Do | 승인된 write scope 안에서 구현 | 자동 |
| Review | read-only 독립 AI QA. PASS / FAIL / BLOCKED | AI PASS 후 최종 승인 |
| Report | 결과·증거·잔여 제한. 완료 시 동결 | — |

규모는 compact / standard / extended 로 자동 분류되며 문서 깊이·specialist 수만 달라진다. 복귀: Readiness NOT_READY 3회 → blocked, QA FAIL → Design (최대 3회), 최종 거절 → Design.

## 산출물

```text
docs/work-items/{feature}/{YYYY-MM-DD-slug}/
├── main.md                # 작업 상태
├── 01-plan/main.md … 05-report/main.md
└── */evidence/            # check 결과, handoff, 스크린샷
docs/features/{feature}/main.md   # 자동 생성 인덱스
docs/README.md                    # 자동 생성 Master 인덱스
```

## 구조

```text
skills/vais/SKILL.md        /vais 진입 규칙
agents/v2-specialist.md     유일한 위임 Agent
hooks/                      prompt(라우팅·승인·지침) · write-guard · agent-handoff · drift
lib/workflow/v2/            상태 머신 · 저장소 · transaction · gate · 문서 품질 · drift · 역할
scripts/vais-workflow-v2.js 내부 CLI
contracts/v2-role-cards.json  역할 정본
schemas/                    JSON 계약 (ajv 검증)
```

## 개발

```bash
npm test          # tests/v2-*.test.js
npm run lint
npm run validate  # 플러그인 구조 검증
```

`workflowV2.mode` 는 `enforce` 가 정본이다. 하네스 자체를 고칠 때만 `disabled` 로 내리고, 끝나면 되돌린다. 실행 중인 플러그인은 마켓플레이스 캐시 사본이므로 repo 변경은 push · 버전 bump · 플러그인 업데이트 뒤에 반영된다.

## License

MIT
