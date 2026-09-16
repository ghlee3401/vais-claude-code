<p align="center">
  <img src="https://img.shields.io/badge/version-3.4.0-blue?style=flat-square" alt="version" />
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
| Claude Code | ≥ 2.1.32 | SessionStart / UserPromptSubmit / PreToolUse / PostToolUse / Stop hook, statusline |
| Python3 | ≥ 3.8 | design-system MCP (UI 설계 시에만) |
| Chrome / Chromium | 최근 버전 | `ui` 작업과 와이어프레임·시안 단계의 스크린샷 (헤드리스). 없으면 그림이 필요한 Gate 가 멈춘다. `VAIS_CHROME=<경로>` 로 지정 가능 |

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
| `/vais 이름: <kebab-case>` | 요청에 영어 단어가 없어 이름을 못 정했을 때 사용자가 Feature 이름을 확정 |
| `/vais status` (`상태`) | 현재 작업·단계·상태와 대기 요청 조회 (읽기 전용) |
| `/vais doctor` | 하네스 건강검진: 설정·hook 5종·버전·상태 파일·장부·stale·statusline 점검과 고치는 법 (읽기 전용) |
| `/vais 변경 없음 확인: F-003 ← REQ-002` | 상위 항목이 바뀌었지만 하위는 그대로임을 확인 (stale 해소) |
| `/vais N번` | 시안 Design 에서 안 고르기 (그 뒤 `/vais design 승인`) |
| `/vais 확인` · `/vais <수정 요청>` | 화면 확인 정지점: 확인하면 Review, 수정 문장이면 다시 고쳐 찍음 (최대 5회) |
| `/vais help` (`도움말`) | 명령 표 |
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

## 작업 종류(kind)와 제품 사슬

모든 작업은 `kind` 를 가진다. `feature`(기능), `ui`(화면 손보기), `bug`(버그), `harness`(플러그인 자체), 그리고 제품을 처음 세울 때 순서대로 거치는 **단계 kind** 10개다. 단계마다 정본 문서 하나가 `docs/product/` 에 생기고, 앞 단계가 승인되지 않으면 다음 단계는 시작할 수 없다.

| 순서 | kind | 정본 | 항목 ID | 부모 |
|---|---|---|---|---|
| 1 | `stage-requirements` | `01-requirements.md` | REQ | 없음 |
| 2 | `stage-features` | `02-features.md` | F | REQ |
| 3 | `stage-screens` | `03-screens.md` + `flows/` | S | F |
| 4 | `stage-wireframes` | `04-wireframes.md` + `wireframes/` | W | S |
| 5 | `stage-design-system` | `05-design-system.md` | DS | 없음 |
| 6 | `stage-mockups` | `06-mockups.md` + `mockups/` | V | W + DS |
| 7 | `stage-data` | `07-data.md` | D | F |
| 8 | `stage-api` | `08-api.md` | API | S 또는 F |
| 9 | `stage-architecture` | `09-architecture.md` | T | 없음 |
| 10 | `stage-test-plan` | `10-test-plan.md` | TC | F |

정본 문서의 항목은 `### F-003 ← REQ-002` 제목과 `| 항목 | 내용 |` 표로 쓴다. runtime 이 부모 존재·허용 접두·필수 항목·산출물 파일·커버리지를 검사하고, 상위 항목이 바뀌면 하위 항목을 stale 로 표시한다. stale 은 그 단계를 다시 승인하거나 사용자가 `/vais 변경 없음 확인: F-003 ← REQ-002` 로 해소한다. 상태는 `stage status` 로 본다.

## UI 루프 — 그림으로 고르고 그림으로 확인

화면을 고치는 작업(`ui` kind)은 말이 아니라 스크린샷으로 진행된다. 설치된 Chrome 을 헤드리스로 돌려 데스크톱(1280×800)·모바일(390×844) PNG 를 찍는다.

```text
/vais 로그인 버튼이 눈에 안 띔      → kind ui, Plan 한 줄 승인
Design: 시안 2안(앱 사본에 적용한 그림)  → /vais 2번 → /vais design 승인
Do: 적용 → 회차 1 화면(전/후) + diff 한 줄  → "더 크게" → 회차 2 → "색은 파랑" → 회차 3 → /vais 확인
Review: 검수 페이지(승인 시안 | 전 | 후) → 독립 QA → /vais 최종 승인 → 취향 장부 기록
```

- 앱 위치는 `vais.config.json > ui` (`appRoot`+`entry` 정적 파일, 또는 `url`). 앱을 띄우는 일은 하지 않는다.
- 시안 사본은 Work item 의 `02-design/options/N/` 안에만 둔다. 제품 코드는 Do 에서만 바뀐다.
- 회차마다 `03-do/evidence/screens/round-N/` 에 그림과 `diff.md`("`.primary padding: 15px 20px → 22px 30px`" 처럼 기계가 뽑은 변화)가 남고, Review 는 `04-review/evidence/review.html` 을 만든다.
- 수정 요청 원문은 장부 `preference` 로 남아 다음 UI·와이어·시안 작업의 Design 첫 줄에 뜬다. 6번째 수정은 막힌다.
- 와이어프레임(html)·시안(svg) 단계 산출물도 `do ready` 때 PNG 로 렌더된다.

## 제품 노트 · 장부 · 브리핑

승인·거절·QA FAIL·잔여 제한은 사람이 적지 않는다. 상태가 바뀌는 순간 runtime 이 `.vais/v2/ledger.jsonl`(append-only 장부)에 남기고, Report 가 끝날 때마다 `docs/product/` 에 세 면을 다시 그린다.

| 면 | 파일 | 내용 |
|---|---|---|
| 현재 | `docs/product/README.md` | 10단계 문서의 approved / stale / 미작성 상태와 승인일 |
| 다음 | `docs/product/roadmap.md` | 남은 단계, 다음 행동 제안 3개, `<!-- vais:user -->` 사이의 내 메모(보존) |
| 왜 | `docs/product/decisions.md` | 결정·피드백·취향·부채·리스크·이정표 |
| 과거 | `docs/README.md` | 작업 목록 (기존) |

새 세션이 열리면 SessionStart hook 이 첫 줄에 `[feature · phase · status] 지난 세션: … 열린 결정 n, 부채 n, stale n. 제안: ① … ② … ③ …` 를 넣는다. 터미널 상태 줄은 `scripts/vais-statusline.js` 를 `~/.claude/settings.json > statusLine` 에 등록하면 `VAIS · {feature} · {phase}/{status} · 다음: {행동}` 을 항상 보인다 (`/vais doctor` 가 설치법을 안내). 상태가 바뀌었는데 장부가 비었거나 기록되지 않은 파일 변경이 있으면 Stop hook 이 턴 종료를 한 번 막는다. 브리핑·제안·상태 줄은 모델을 부르지 않고 상태 파일 3개만 읽는다.

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
docs/product/NN-*.md              # 제품 사슬 정본 (단계 kind)
docs/product/{README,roadmap,decisions}.md   # 제품 노트 3면 (자동 생성)
.vais/v2/ledger.jsonl             # 장부 (append-only, 직접 편집 금지)
```

## 구조

```text
skills/vais/SKILL.md        /vais 진입 규칙
agents/v2-specialist.md     유일한 위임 Agent
hooks/                      session-start(브리핑) · prompt(라우팅·승인·지침) · write-guard · agent-handoff · drift · stop(기록 잠금)
lib/workflow/v2/            상태 머신 · 저장소 · transaction · gate · 문서 품질 · drift · 역할 · 사슬(chain-registry·id-chain) · 장부(ledger) · 노트(product-note) · 제안(proposal) · doctor ·
                            화면(screen-capture·diff-summary·review-page)
scripts/vais-workflow-v2.js 내부 CLI · scripts/vais-statusline.js 상태 줄 · scripts/vais-doctor.js
contracts/v2-role-cards.json  역할 정본
schemas/                    JSON 계약 (ajv 검증)
```

## 개발

```bash
npm test            # tests/v2-*.test.js
npm run regression  # tests/regression/ — 사용 장면 회귀 (장면 A·C·E·F; VAIS_SCREEN_RENDERER=stub 로 그림은 대체)
npm run lint
npm run validate    # 플러그인 구조 검증
npm run doctor      # 하네스 건강검진
```

`workflowV2.mode` 는 `enforce` 가 정본이다. 대소문자·공백은 무시되고, 그 밖의 잘못된 값은 **닫힘으로 실패**한다 (guard 는 계속 막고 매 프롬프트 첫 줄에 경고). 하네스를 끄는 길은 정확한 `disabled` 와 비상 스위치 `VAIS_HARNESS_OFF=1` 둘뿐이다. 하네스 자체를 고칠 때만 내리고, 끝나면 되돌린다. 실행 중인 플러그인은 마켓플레이스 캐시 사본이므로 repo 변경은 push · 버전 bump · 플러그인 업데이트 뒤에 반영된다.

## License

MIT
