# Work Rules (shared, v2.3)

모든 C-Level 공통 작업 원칙. 각 C-Level 메인 .md 는 자기 도메인 특이 규칙만 짧게 추가한다.

workflow contract: `docs/workflow-contract-alignment/01-plan/workflow-contract-matrix.md`.

## 일반 원칙

- memory 는 관련 엔트리만 필터하여 읽음 (전체 로드 지양)
- 컨텍스트 포화 방지: 단계 완료 후 상세 내용 컨텍스트에서 제거
- Query 모드(질의)에서는 실행 지시 내리지 않음
- 과거 결정 뒤집을 때 반드시 이유 기록
- 판단 불확실 시 AskUserQuestion 으로 확인

## 위임 vs 직접 작성

- C-Level 메인은 orchestrator. 도메인 산출물(코드/PRD/threat-model 등)은 sub-agent 위임.
- 위임 결과를 받으면 sub-agent artifact 의 frontmatter `summary` 만 main.md Artifacts 표에 인덱싱.
- 도메인 지식 (`agents/{owner}/knowledge/*.md`) 은 phase + artifact 매칭 시만 lazy-load.

## Activation Contract

- CEO 는 ideation/routing owner. `lib/ceo-algorithm.js` 의 7 차원 분석 결과를 baseline 으로 쓴다.
- CTO 만 plan → design → do → qa → report mandatory 흐름을 가진다.
- CPO/CSO 는 CEO 알고리즘이 활성화한 phase/artifact 만 실행한다. 자체 mandatory phase 없음.
- CBO/COO 는 secondary 이며 사용자 명시 호출 시에만 실행한다. CEO primary routing 이 자동 활성화하지 않는다.
- 실행 sub-agent 직접 호출 금지. C-Level 이 artifact 단위로 위임한다.

## Knowledge Cross-Reference 표기 (v0.65)

다른 C-Level 의 `knowledge/` 파일을 참조할 때:

- **항상 풀 prefix 사용**: `agents/{owner}/knowledge/{file}.md` (예: `agents/cpo/knowledge/prd-eight-sections.md`)
- **owner 가 자명하지 않은 경우** owner 명시: `(owner: cpo)` 같은 짧은 주석
- **자기 owner 의 knowledge 도** 풀 prefix 권장 (일관성). 예외: 같은 단락 내 반복 시 stem 만 사용 가능
- **frontmatter `knowledge_refs`**: 항상 풀 prefix (`agents/cpo/knowledge/prd-eight-sections.md`)

## CEO 알고리즘 인용 규칙 (v0.65.3)

CEO 가 라우팅 결정을 내릴 때 (그리고 다른 C-Level / sub-agent 가 그 결정을 받을 때):

- **정본**: `lib/ceo-algorithm.js` 의 `analyzeCEO(request)` 결과 (7 차원 등급 + activeCLevel + artifactPlan)
- **CEO 응답**: 7 차원 등급 표를 반드시 응답에 직접 출력 (LLM 자체 라우팅 금지). 절차: `agents/ceo/ceo.md` "CEO 진입 절차"
- **main.md 인용**: 위임 받은 C-Level 이 main.md "CEO 판단 근거" 섹션에 7 차원 등급 표를 인용 (algorithm 결과 그대로)
- **LLM 보강**: algorithm 결과를 baseline 으로 인용한 후에만 보강 가능. 차이 발생 시 **사유 1 줄** 기록 필수
- **변경 시**: `lib/ceo-algorithm.js` 의 7 차원 정의·등급 로직 변경 시 본 컨벤션도 함께 갱신

## Push 규칙

- `git push` 는 `/vais commit` 을 통해서만 수행.
- 작업 완료 후 `git add` + 사용자에게 `/vais commit` 안내 (AskUserQuestion 으로 확인).
- 직접 push 금지. `--force` push 금지 (disallowedTools 로 차단).

## 산출물 경로

- `docs/{feature}/{NN-phase}/main.md` (인덱스, 5섹션 표준)
- `docs/{feature}/{NN-phase}/{artifact}.md` (sub-agent 직접 박제, frontmatter 4 필수)
- `main.md` 는 본문을 흡수하지 않는다. PRD, architecture, QA, audit, financial model, runbook 등은 개별 artifact 로 유지한다.

## Plan ≠ Do

Plan 단계에서 프로덕트 파일(skills/, agents/, lib/, src/, mcp/) 생성·수정·삭제 금지.
`docs/{feature}/01-plan/` 산출물 작성과 기존 코드 Read/Grep 만 허용.
"단순 md 라 바로 할 수 있다" 는 이유로 앞당기지 않는다.

## 필수 문서

현재 phase 산출물을 반드시 작성. 문서 없이 종료 시 SubagentStop 훅이 `exit(1)` 차단.
"대화로 합의했으니 문서 불필요" 판단 금지.

## SendMessage 정책 (v0.68+ — agent-teams-orchestration 도입)

`orchestration.agentTeams.enabled=true` 시 활성. false 일 때는 0.67.0 sequential 동작 (SendMessage 미사용).

**ALLOWED**:
- C-Level → C-Level (대화 모드, v2 Conversation Orchestrator 가 관리)
- C-Level → sub-agent (위임 — 항상 허용)

**FORBIDDEN**:
- sub-agent → sub-agent (같은 C-Level 하위든 다른 C-Level 하위든 모두 금지 — T8 위협, security-review.md 참조)
- sub-agent → C-Level (응답만 허용, request 금지)

**Enforcement**:
- v2 design `interface-contract.md` §10.2 ALLOWED/FORBIDDEN 표 박제
- QA Gate CSO-G7: `grep -n "sub-agent → sub-agent" agents/_shared/work-rules.md` 매치 확인
- 선택적 PreToolUse hook 으로 SendMessage `to:` 타깃 검증 (v2.1 후보)

## Lazy Consensus 정책 (v0.68+ — agent-teams-orchestration)

`orchestration.agentTeams.enabled=true` 시 phase 진입마다 적용.

**State Machine (5 states)**: draft → review-window → (consensus-reached | objection-raised → revision → review-window) → consensus-reached (또는 timeout)

**규칙**:
- 도메인 리드 (synthesizer) 가 draft 작성 → SendMessage 로 다른 C-Level (participants) review 요청
- N=`consensusTurns` (기본 2) 턴 내 이의 없으면 자동 합의
- 이의 1건 이상 시 synthesizer 가 revision → 재 review 라운드
- consensusTurns 초과 시 timeout — synthesizer 단독 강행 + decisions-log 에 `timeout` event 박제 (unresolvedObjections 보존)

**박제 의무**:
- main.md = 합성문 (synthesizer 단독 작성)
- decisions-log.md = timeline (모든 SendMessage event)
- frontmatter `synthesizer` 필드 = 합성문/timeline 일관성 (Do 작업 test C1~C2)

**호환성**: `agentTeams.enabled=false` 인 기존 워크플로우 (5섹션 인덱스 + append-only Decision Record) 와 직교 — 둘은 mutually exclusive.
