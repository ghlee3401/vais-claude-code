# 01. 현재 상태 정량 분석

> 측정일: 2026-07-30, 기준 커밋: `1f055cc` (v1.1.0)
> 토큰 추정: bytes ÷ 4 (한국어 혼합 문서라 실제로는 이보다 큼 — 보수적 추정치)

## 1. 저장소 전체 규모

| 디렉토리 | 파일 수 | 라인 수 | 크기 | 토큰 추정 | 성격 |
|----------|--------|--------|------|----------|------|
| agents/ | 83 | 11,781 | 450KB | ~115k | 6 C-Level + 47 sub-agent + knowledge 19 + _shared 8 |
| scripts/ | 37 | 7,791 | 283KB | ~72k | validator/patcher/auditor/judge — 대부분 자기 관리용 |
| templates/ | 51 | 7,618 | 313KB | ~80k | 6계층 (why/what/how/core/biz/alignment) |
| tests/ | 40 | 6,020 | 212KB | ~54k | |
| lib/ | 34 | 5,770 | 179KB | ~46k | status(29KB), project-profile(21KB), ceo-algorithm(11KB) 등 |
| design-system/ | 8 | 3,427 | 172KB | ~44k | brands 7개 사전 박제 (lazy import로 71개) |
| skills/ | 22 | 2,009 | 80KB | ~20k | SKILL.md + phases 7 + utils 13 |
| hooks/ | 6 | 1,161 | 40KB | ~10k | 8개 이벤트 등록 |
| docs/ | 101 | 11,330 | 639KB | ~163k | 자기 개발 이력 (dogfood 산출물) |
| **소스 합계 (docs/tests 제외)** | **241** | **~39,500** | **~1.5MB** | **~390k** | |

**핵심 관찰**: 실행 코드(lib+hooks+mcp)는 226KB인데, 그것을 지시·검증·관리하는 문서와 스크립트(agents+templates+scripts)가 1,046KB. **관리 대 실행 비율이 약 4.6 : 1.**

## 2. 세션 시작 고정 비용 (vais 사용 여부와 무관, 매 세션)

| 항목 | 크기 | 토큰 | 비고 |
|------|------|------|------|
| CLAUDE.md 자동 로드 | ~12KB | ~3k | 프로젝트 지침 |
| **에이전트 목록 시스템 프롬프트 주입** | ~10KB | **~2.5k** | ⚠️ `package.json > agents: ["agents/"]` 로 인해 knowledge/*.md, _shared/*.md 까지 **약 80개가 에이전트로 등록**됨. "Agent from vais-code plugin"으로 표시되는 무의미한 항목 27개 포함 |
| session-start.js 주입 | 6KB | ~1.5k | 워크플로우 ASCII 박스 2개 + 커맨드 표 + **응답 스타일 전문 (output-style 중복 주입)** |
| /vais 스킬 description | ~1.2KB | ~0.3k | Trigger 목록에 `리뷰, 검토, 시작, 조사` 등 과도하게 광범위한 단어 포함 → 무관한 요청에도 스킬 오발동 위험 |
| **합계** | | **~7.3k 토큰** | 이 프로젝트에서 Claude Code를 여는 것만으로 지불 |

추가로 출력 측: 응답 스타일이 **매 응답 하단에 박스 리포트** (~100 출력 토큰/turn) + 아웃트로 2블록 + AskUserQuestion 체인을 강제.

## 3. `/vais cto plan {feature}` 1회 실행 시 로드 체인 (실측 기반)

```
SKILL.md (9.5KB)
 └→ phases/cto.md (4.0KB)
     └→ agents/cto/cto.md (11.5KB)
         ├→ _shared/checkpoint-policy.md (4.3KB)   ← "따름" 지시로 Read 유도
         ├→ _shared/work-rules.md (5.8KB)
         ├→ _shared/outro-format.md (1.3KB)
         ├→ vais.config.json (20KB, L1 "항상")     ← 541줄 전체 Read
         ├→ .vais/memory.json + status.json
         ├→ docs/{feature}/01-plan/prd.md 검사 (CP-0)
         ├→ templates/plan-*.template.md (5~10KB)
         └→ (조건부) knowledge/*.md 1~2개 (6~12KB)
```

| 구분 | 토큰 |
|------|------|
| 프레임워크 로드 (위 체인) | **~15-20k** |
| 산출물 작성 의식 (frontmatter + main.md 인덱스 + Decision Record + 변경 이력 표 + 아웃트로 2블록 + 박스 리포트) | ~2-4k 출력 |
| **phase 1회 오버헤드 소계** | **~18-24k** |
| **피처 1개 (6 phase) 누적** | **~110-140k 토큰** — 실제 구현 작업과 무관한 비용 |

## 4. 문서 산출량 실측 — `vais-positioning-rethink` 사례

내부 포지셔닝 재정의 작업 1건의 산출물:

| phase | 파일 | 줄 수 |
|-------|------|------|
| 00-ideation | main.md + working-notes.md | 282 |
| 01-plan | main.md + cto-tech-plan.md + plan-rationale.md | 250 |
| 02-design | main.md + m0-design.md + m1-poc-design.md | 268 |
| 03-do | main.md + prd.md + poc-result.md + dogfood-ab-result.md + ac-check.md | 591 |
| 04-qa | main.md + qa-report.md + sprint-final-qa.md | 271 |
| 05-report | main.md | 39 |
| **합계** | **17 파일** | **1,701줄** |

특히 `03-do/main.md`는 "인덱스만 담는다"는 규칙에도 불구하고 **89줄 + Decision Record 30행** — 인덱스 유지 자체가 부담이 된 증거. 재진입 시마다 이 파일을 읽고 append 하는 비용도 누적된다.

## 5. Hook 체인 (8개 이벤트, 매 도구 호출마다 node 프로세스 spawn)

| 이벤트 | 핸들러 | 발동 빈도 |
|--------|--------|----------|
| SessionStart | session-start.js | 세션당 1회 |
| PreToolUse(Bash) | bash-guard.js | **모든 Bash 호출** |
| PreToolUse(Agent) | design-mcp-trigger.js (timeout 30s) | 모든 Agent 호출 |
| PostToolUse(Write\|Edit) | doc-tracker.js + ideation-guard.js (**2개**) | **모든 파일 쓰기** |
| PostToolUse(AskUserQuestion) | cp-tracker.js | 모든 질문 |
| Stop | stop-handler.js (→ 조건부 detached LLM worker spawn) | 모든 턴 종료 |
| UserPromptSubmit | checkpoint-keyword.js | **모든 사용자 입력** |
| SubagentStart / SubagentStop | agent-start.js / agent-stop.js | 모든 서브에이전트 |

파일 하나 수정 = node 프로세스 2개 spawn. 활발한 세션에서 턴당 5~10회 프로세스 기동. 기능적 문제는 아니지만 latency + 관리 표면적 비용.

또한 `SubagentStop`이 phase 산출물 미작성 시 `exit(1)` 차단 → **문서 작성을 물리적으로 강제**하는 구조가 문서 인플레이션의 직접 원인 중 하나.

## 6. 에이전트 계층 실측

| 계층 | 수 | 크기 | 비고 |
|------|-----|------|------|
| C-Level | 6 | 57KB | ceo/cto 각 10-11KB |
| sub-agent | 47 | 322KB (평균 6.8KB) | CBO 10, COO 8, CEO 유틸 6, CPO 9, CSO 7, CTO 8 |
| knowledge | 19 | 65KB | lazy-load (manual @include) — 설계는 좋음 |
| _shared 가드 | 8 | 28KB | 가드가 가드를 참조 (summary → full 2단 구조) |

sub-agent 47개 중 **최근 90일 내 실제 호출 이력이 확인되는 것은 소수** (docs/ 산출물 기준 — CTO 계열 + prd-writer + 일부 CSO). CBO 10종·CEO 전략 4종(vision/strategy-kernel/okr/pr-faq)·COO 8종은 대부분 "만들어 두었지만 쓰지 않는" 상태.
