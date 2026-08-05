---
owner: ceo
artifact: claude-repo-analysis
phase: ideation
feature: multimodel-repo-analysis
agent: claude-opus-4-7
generated: 2026-05-12
source: Codex 1차 분석 검증 + Claude 독자 발견
summary: "Codex P0/P1 6개 항목을 코드로 검증하고, Codex 가 놓친 5개 영역 (PO 온보딩 UX / 테스트 의미성 / Knowledge Pack 편차 / 하네스 자가검증 한계 / vendor 통합) 을 추가"
---

# Claude 2차 repo 분석

## 한 줄 결론

Codex 의 진단 ("뼈대 강함 + 0.65→0.66 전환 흔적") 은 사실로 검증된다. 다만 **더 무서운 문제는 정합성 드리프트가 아니라 자기검증 공백**이다 — vais-code 는 자기 자신을 dogfood 한 결과를 GA PASS 라고 선언했지만, 핵심 메커니즘 (CEO 7 차원 라우팅, M0 hook) 은 *코드 박제만 했고 운영 검증은 보류* (`04-qa/main.md:24` 명시). 그리고 그 검증을 막는 첫 번째 단서가 Codex P0 #1 — `analyzeCEO` 입력 필드 불일치다. 즉 **CEO 의 핵심 가치 (객관 알고리즘 라우팅) 가 문서대로 호출하면 동작하지 않는다**.

## 1. Codex P0/P1 검증 결과

| # | Codex 주장 | Verdict | 근거 |
|---|------------|---------|------|
| P0-1 | `analyzeCEO({input})` vs 코드 `{rawText}` 불일치 | ✓ **사실 (Critical)** | `lib/ceo-algorithm.js:167` = `const { rawText, feature } = request`. `agents/ceo/ceo.md:41` = `analyzeCEO({input: '<사용자 원문>', feature: ...})`. 문서대로 호출하면 `rawText = undefined` → `analyzeDimensions(undefined)` → 모든 7차원이 default 등급 → 라우팅 무력화. v0.65.3 가 "이 절차 없이 LLM 자체 판단으로 라우팅하면 vais-code 가 그냥 비싼 LLM 으로 퇴화한다" (`ceo.md:50`) 라고 단언한 그 절차가 깨져있음. |
| P0-2 | 버전 드리프트 (CLAUDE.md, marketplace) | ✓ **사실** | `package.json` / `vais.config.json` / `plugin.json` / `marketplace.json` / `CHANGELOG.md` 모두 `0.66.0` ✓. 단 `CLAUDE.md:5` 는 여전히 "v0.65.3" 명시, `marketplace.json` description 은 "frontmatter 8 fields" — v2.1 정책 (4 필드) 과 모순. |
| P1-3 | COO 가 release-engineer 참조 | △ **부분적 사실** | `vais.config.json` subAgents 에서는 분해 완료 (`release-engineer` 제거). 그러나 `agents/coo/coo.md:6,17,28` 마크다운에서 여전히 명시 → 문서/config 정합성 깨짐. |
| P1-4 | doc-validator vs v2.1 main.md 정책 미정렬 | △ **부분적** | 현재 `scripts/doc-validator.js` 는 frontmatter 검증만 수행 — 5섹션 인덱스 구조 검증 코드 없음. owner H2 강제는 미발견. 즉 정책은 있는데 *enforcement 부재* — Codex 진단보다 더 약한 상태. |
| P1-5 | SessionStart 명령 안내가 레거시 4토큰 미강제 | ✓ **사실** | `hooks/session-start.js:117-120` 가 `/vais auto {기능}` / `/vais plan {기능}` 만 안내. output style 은 `/vais {c-level} {phase} {feature}` 4-token strict. 첫 사용자가 가이드대로 치면 즉시 형식 오류. |
| P2-6 | design-system MCP 산출 위치 모호 | ✓ **사실** | `lib/mcp-validator.js:12,114` = plugin root 기준 `design-system/{feature}/MASTER.md`. 정책 문서 부재 — plugin cache vs target app artifact 구분 없음. |

**6/6 모두 verified** (4 fully, 2 partially). Codex 분석 신뢰성 높음.

## 2. Claude 독자 발견 (Codex 미언급)

### 2.1 PO 온보딩 마찰 — **P1**

- `ONBOARDING.md` 는 "5분 진입" 을 약속 + "시나리오 A: /vais ceo ideation" 권장.
- 그러나 `hooks/session-start.js:51-120` 는 첫 session 진입 시 진행 중 피처 복원 + Progress Bar + Workflow Map + 명령어 테이블 4개를 동시 렌더.
- 처음 본 PO 입장에서 "이 화면에서 뭘 해야 할지" 불명확. session-start 와 ONBOARDING 이 서로 다른 첫 행동을 유도.
- **위험**: vais-code 의 핵심 가치 약속 ("PO 가 C-Suite 를 운영") 이 첫 30 초 안에 전달되지 않으면 PO 가 이탈.

### 2.2 테스트 의미성 부족 — **P1 (QA Gate 신뢰도 직격)**

- 281 tests 통과는 사실이지만 **CEO 7 차원 라우팅 알고리즘을 검증하는 테스트 0 개** (`lib/ceo-algorithm.js` 의 `analyzeCEO` / `analyzeDimensions` 호출 테스트 grep 미발견).
- 즉 P0-1 의 `rawText`/`input` 불일치가 테스트 통과를 하면서 production 에서 깨지는 이유 — 테스트 자체가 그 경로를 안 탐.
- `tests/prompt-handler.test.js` 의 3 skip 은 "v0.31.0 에서 폐기" 인데 1.5 년간 살아있음.
- Gate 시스템 (`tests/gate-manager.test.js`) 의 "ideation always pass" 강제 자체는 검증되지만, CP-0/CP-G/CP-Q 실제 발동 시나리오 검증은 smoke 수준.
- **위험**: QA PASS 가 "코드 결함 없음" 이 아니라 "테스트 케이스가 결함을 못 봄" 일 수 있음.

### 2.3 Knowledge Pack 박제 품질 편차 — **P2 (Tier-1A 공약 부분 달성)**

- v0.66 의 핵심 마케팅 약속 = "부서장 OJT 매뉴얼 박제". 실측:
  - CPO `prd-writing-ojt.md` (215줄) / CTO `architecture-decision.md` (~11.7K) — OJT 4 요소 (framework + 단계 + 의사결정 패턴 + 산출 양식) 충실.
  - CEO 는 `absorb-rubric` + `seven-dimension-routing` + `rumelt-strategy-kernel` 분산 — grep 가능 단일 OJT flow 가 아님.
  - **CSO / CBO / COO knowledge 는 각각 2~3 K 규모 stub 수준** — 프레임워크 헤딩만 있고 실무 단계 minimal.
- **위험**: "Tier-1A 3/3 박제 PASS" (`04-qa/main.md:24`) 라고 선언했지만, 6 C-Level 중 3 만 충실. organization-in-a-box 라는 약속이 6 부서 중 3 부서만 작동 = 절반 약속.

### 2.4 자가 검증 한계 (self-dogfood) — **P1**

- `docs/vais-positioning-rethink/04-qa/main.md:24` 명문: "M0 4 메커니즘 코드 박제 **(운영 검증 보류)**".
- 즉 vais-code 가 자신을 dogfood 해서 만든 0.66.0 GA 의 핵심 메커니즘이 **운영 환경에서 실제로 작동하는지 검증되지 않은 상태로 PASS 선언**.
- 그리고 P0-1 이 정확히 그 검증을 안 한 결과 — 알고리즘이 잘못된 입력 필드로 호출되는데도 PASS.
- **이건 정렬 문제가 아니라 신뢰 문제** — 사용자에게 "GA PASS" 라고 광고할 수 없는 상태.

### 2.5 vendor 통합 brittleness — **P2 관찰**

- `vendor/ui-ux-pro-max/` (1.3 M, Python BM25 검색 + design-system import 스크립트).
- `mcp/design-system-server.json` 이 `${CLAUDE_PLUGIN_ROOT}` env var 의존하는데, 이 env 의 정의 위치 / 사용자에게 노출되는 지점 문서 없음.
- vendor update 정책 없음 ("수정 금지" 만 명시).
- **위험**: 외부 의존이 brittle 한 상태로 v0.62+ 핵심 기능 (design-system MCP) 의 한 다리를 차지.

## 3. Codex 우선순위에 Claude 가 더하는 권장

| 순위 | 항목 | 근거 |
|------|------|------|
| **P0-A** | `analyzeCEO` 입력 필드 통일 + 회귀 테스트 추가 | Codex P0-1 + Claude 2.2. 단순 typo 수정으로 끝나면 안 되고, **CEO 알고리즘 호출 회귀 테스트** 추가 (입력 → 7차원 등급 → activeCLevel 매핑). 이 테스트 없으면 또 깨짐. |
| **P0-B** | "운영 검증 보류" 메커니즘 4개 실제 검증 후 GA 선언 | Claude 2.4. M0 hook 신설/확장, status.json, append 로직이 진짜 동작하는지 e2e 시나리오 1개 — 예: `feature=test-feature` 로 ideation → plan → design 3 phase 진행 시 status, ideation continuity 가 실제로 작동하는가. |
| **P0-C** | 버전/메타/CLAUDE.md/marketplace description 일괄 정리 (`v0.66.0`/4 필드) | Codex P0-2. 기계적 정렬, 30 분 이내. |
| P1-D | `hooks/session-start.js` 첫 진입 안내 → `/vais ceo ideation {feature}` 권장 통일 + `auto` / `plan` 단축 alias 명시 | Codex P1-5 + Claude 2.1. 첫 사용자 마찰 제거. |
| P1-E | COO 마크다운 release-engineer 잔여 정리 | Codex P1-3. |
| P1-F | doc-validator 가 v2.1 5섹션 인덱스 enforcement 하도록 확장 | Codex P1-4. 정책 vs 코드 alignment. |
| P1-G | CSO / CBO / COO knowledge OJT 4 요소 보강 (각 2~3K → 8K 목표) | Claude 2.3. v0.66 공약 잔여분. |
| P2-H | design-system MCP 산출 위치 정책 명시 + vendor env 문서화 | Codex P2-6 + Claude 2.5. |

**핵심 메시지**: P0-A 와 P0-B 가 가장 우선. 정렬 문제는 나중에 풀어도 plugin 이 작동하지만, CEO 라우팅이 깨지면 vais-code 정체성 자체가 무너진다.

## 4. 논의용 질문 (Codex 와 다른 각도)

- **신뢰 vs 정렬**: Codex 는 정렬 문제로, Claude 는 신뢰 문제로 본다. 두 관점 중 어느 lens 로 우선순위 정렬할 것인가?
- **GA 선언의 의미**: v0.66.0 GA tag 가 이미 release commit (ee19090) 으로 나가 있다. P0-B 검증 전에 GA 선언한 것을 retro 로 dev/beta 로 강등할 것인가, 아니면 v0.66.1 hotfix 로 P0 만 빠르게 처리할 것인가?
- **Knowledge Pack 미달 3 C-Level**: Tier-1B 로 정식 다음 sprint 에 넘길 것인가, 아니면 v0.66.1 hotfix 에 포함할 것인가?
- **dogfood 의 정의**: vais-code 가 vais-code 를 만드는 시나리오가 진짜 dogfood 인가, 아니면 "외부 PO 가 외부 제품을 만드는" 시나리오를 1 개 만들어 검증해야 진짜 dogfood 인가?
- **테스트 strategy**: agent 동작 자체를 e2e 검증하기 어려운 LLM-as-orchestrator 시스템에서, 어떤 layer 까지를 unit test 로 강제할 것인가? (algorithm, hook, gate 까지? 그 이상은 dogfood log 로 대체?)

## 5. Gemini 에게 묻고 싶은 영역

Codex 와 Claude 가 모두 빠뜨렸을 가능성이 있는 각도 — Gemini 가 분석한다면 다음을 확인 부탁:

1. **외부 사용자 시점** — Claude Code marketplace 에서 plugin description / README 만 보고 "이게 뭐 하는 plugin 인지" 30 초 안에 전달되는가? messaging 명확성.
2. **경쟁 plugin 과의 포지셔닝** — Claude Code 생태계 내 다른 multi-agent orchestration plugin 과 vais-code 의 차별점이 marketplace 표면에서 식별 가능한가?
3. **국제화** — 한국어 마크다운 비중이 높다. 영어권 사용자 진입 장벽.
4. **plugin 성능** — hook 체인이 매 session 마다 실행되는 비용, MCP 서버 부하.
5. **legal / license** — vendor/ui-ux-pro-max 의 라이선스, design-system mui import 의 사용권.

## 6. Next Step 제안

1. **이 분석을 main.md 인덱스에 추가** (artifact 표 + Decision Record).
2. **Gemini 분석 받기** — 사용자가 별도 환경에서 Gemini 에 같은 repo 를 분석시켜 `gemini-repo-analysis.md` 로 박제.
3. **synthesis** — 3 모델 분석을 `synthesis.md` 로 통합 (공통 / 모델별 unique / 충돌 부분 정리).
4. **P0 만 분리 진행** — synthesis 기다리지 말고 P0-A (`analyzeCEO` typo + 회귀 테스트) 만 `/vais cto plan ceo-algorithm-input-fix` 로 즉시 출발 가능. 30 분~1 시간 작업.

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-12 | Codex 분석 검증 (6/6) + Claude 독자 발견 5개 + 우선순위 통합 권장 |
