---
owner: cto
artifact: gate-1-claude-review-result
phase: plan
feature: adaptive-workflow-kernel
agent: claude
generated: 2026-08-19
source: gate-1-claude-review.md
summary: "Claude 독립 검토 결과 — Phase 0A/0B 계약·label·baseline 판정: 수정 후 승인"
---

# Gate 1 Claude Review Result

> 검토자: Claude (claude-fable-5) · 검토일: 2026-08-19 · 입력 패킷: `gate-1-claude-review.md`
> 검토 대상 15개 파일 전부 직접 읽고 재현 명령 6종을 실행했다. validator 우회 경로는 malformed corpus 16종을 직접 만들어 JS validator와 JSON Schema 양쪽에 통과시켜 확인했다. Codex 자체 검증 결과(§5)의 수치는 모두 재현되었으나, 그 수치가 의미하는 바는 몇 군데 과장되어 있다.

## 판정

**수정 후 승인**

정책(Phase 0A)과 label 대부분은 보수적이며 방향은 맞다. 그러나 (1) corpus의 `phaseGraph`가 case별 compile 결과가 아니라 profile 템플릿 복사본이라 Phase 1 compiler를 평가할 ground truth가 되지 못하고, (2) trigger/check 어휘가 통제되지 않아 "unsafe assurance miss 0건"을 결정론적으로 판정할 수 없으며, (3) validator·schema가 정책 위반 corpus를 통과시키고, (4) baseline snapshot의 재현성 표기가 부정확하다. 구조적 중단 사유는 아니지만 Phase 1 착수 전 수정·재검증이 필요하다.

## Critical/Major Findings

- **[Critical]** `tests/fixtures/workflow-classification-corpus.json:22-36` + `tests/phase-0b-evaluation.test.js:39-53` — feature 15건 전부 `conditional:["design"]`로 동일하고, 테스트가 이를 *강제*한다. `phase-0a-contracts.md:43`은 "UI flow / API contract / data model / architecture / 외부 integration 중 하나가 바뀌면 design을 required로 compile"이라 명시하므로 f-02(new UI), f-03(settings flow), f-05(OAuth), f-06(authz contract), f-09(data model), f-10(외부 write), f-11(API contract), f-13, f-14(event contract), f-15(data model) 등은 compiled graph에서 design=required여야 한다. 현재 fixture는 "profile 기본값"이지 "이 case의 기대 결과"가 아니어서 Phase 1 compiler의 정오를 판정할 수 없다. **권장**: case별 `expectedCompiledPhaseGraph`(또는 `designRequired: bool`)를 추가하고, 테스트는 "profile 템플릿 일치"가 아니라 "compile 규칙 일치"를 검사.
- **[Critical]** `schemas/evaluation-corpus.schema.json:24`, `schemas/critical-risk-corpus.schema.json:23`, `lib/evaluation/corpus.js:54-69` — `riskTriggers`/`requiredTrigger`/`expectedChecks`가 자유 문자열. 실측: trigger 어휘 14종(`auth`, `permission`, `secret`, `external-input`, `health`, `cross-border` 등), check id 86종(threat-review/threat-model/security-review/security-audit, rollback-check/-test/-drill/-plan 등 동의어 다수). Phase 0A preview fixture는 같은 개념을 `"authentication","session"`으로 쓴다. 이 상태로는 classifier 출력과 corpus를 문자열 비교할 수 없어 Phase 1 완료 기준 "critical-risk unsafe miss 0건"이 결정 불가능하다. **권장**: trigger enum(정책 §5 8항목 + 아래 Missing Risk Cases 반영)과 check taxonomy(`execution-preview.schema.json:117`의 `kind` 8종에 매핑되는 canonical id 목록)를 schema `enum`으로 고정, 동의어 통합.
- **[Major]** `lib/evaluation/corpus.js` 전체 + 두 corpus schema — 아래 malformed corpus가 JS validator·schema 모두 통과함을 확인: patch의 `required:[]`(A), plan/qa를 notRequired로 이동(B), trigger 오타 `autth`(C), `high`를 trigger `lint`로 정당화(D), `regulated`를 trigger `typo`로(E), summary에 AWS key+email 삽입(G), critical `pii` case에 `requiredTrigger:"auth"`(M), `regulated` category에 `minimumAssurance:"high"`(N), category당 1건(9건)으로 축소(P). phase graph 정합성은 오직 test(`:39-53`)만 잡고 `npm run workflow:evaluate` CLI 게이트는 통과시킨다. 또한 `evaluation-corpus.schema.json`/`critical-risk-corpus.schema.json`은 어떤 테스트에서도 fixture에 대해 Ajv 실행되지 않는다(`phase-0b-evaluation.test.js:82-88`은 상수 값만 확인). **권장**: validator에 (i) profile→phase graph 규칙, (ii) assurance↔trigger 정합(regulated는 `regulated|health|cross-border|pii` 중 하나 필수 등), (iii) category↔requiredTrigger 일치, (iv) category당 ≥2, (v) 간단한 secret/PII regex 스캔 추가; 테스트에 Ajv 검증 추가.
- **[Major]** `tests/fixtures/legacy-baseline.json:6-8`, `tests/phase-0b-evaluation.test.js:131` — `headSha: 653074b`로 박제·테스트되지만, 측정된 byte는 dirty working tree 기준이다. 실측: `CLAUDE.md` HEAD 19,128B vs snapshot 19,104B; `agents/cto/cto.md` 11,958 vs 11,884; `contracts/workflow-contract.md`는 HEAD에 **존재하지 않음**(untracked). Phase 0B 산출물 전부(`schemas/*corpus*`, `lib/evaluation/`, `tests/fixtures/*`, `contracts/`)가 `??` 상태. SHA만으로는 재현 불가하며 "repository baseline"이라는 표현이 오해를 유발한다. **권장**: 커밋 후 재생성하여 headSha를 clean tree와 일치시키고, `repository.dirty=true`인 snapshot은 테스트에서 거부.
- **[Major]** `schemas/legacy-baseline.schema.json:364-419`, `lib/evaluation/legacy-baseline.js:175-183, 228-231` — `providerTokens/hostTokens/hostApprovals/workflowElapsedMs`가 `status: "unavailable"` **만** 표현 가능. live host 6회를 수행해도 값을 이 형식에 기록할 수 없고, `liveHostRuns.captured`(0~6)와 sample 내용의 교차 검증도 없다(`captured: 6`인데 전부 unavailable이어도 통과). **권장**: `oneOf[unavailable | captured{value, capturedAt, source, accuracy}]`로 확장하고 `captured` 수와 실제 sample 수를 대조.
- **[Major]** `docs/adaptive-workflow-kernel/01-plan/phase-0b-evaluation.md:88-96` — `development-plan.md:419-423` Phase 0B 완료 기준 4개 중 "baseline quality와 cost가 같은 runId로 연결됨"이 판정표에서 **누락**됨. snapshot에는 `qualityCommands` 목록만 있고 runId별 quality 결과(pass/fail, gate)가 없다. 또 "proxy metric 100% — 6 repository replay sample"은 결정론적 파일 inventory를 2회 복제한 것(rep1=rep2 byte 동일, `measurementElapsedMs`만 1~2ms 차이)이라 실질 3건이다. **권장**: 판정표에 누락 기준을 "미충족"으로 복원하고 "6 sample"을 "3 scenario × 2 반복(동일 값)"으로 정정.
- **[Major]** `lib/evaluation/legacy-baseline.js:8-64` — inventory 선정 규칙이 문서화되지 않은 hand-picked 목록. legacy CTO run이 실제 로드하는 `agents/_shared/{context-loading,clevel-main-guard,work-rules,subdoc-guard,checkpoint-policy}.md`, `agents/cto/knowledge/*`, `output-styles`, `vais.config.json`이 빠져 있고, patch 시나리오는 legacy가 design phase를 항상 실행함에도 `ui-designer.md`를 제외하면서 `design.template.md`는 포함(비일관). "lower bound"는 맞지만 하한이 얼마나 느슨한지 알 수 없어, adaptive 쪽이 다른 규칙으로 inventory를 세면 40%/25% 감소 KPI 비교가 무의미해진다. **권장**: 선정 규칙(예: "phase 진입 시 skill/agent frontmatter가 명시 참조하는 파일 전부")을 fixture `methodology`에 기록하고 양쪽에 동일 적용.
- **[Major]** `docs/adaptive-workflow-kernel/01-plan/phase-0a-contracts.md:68,73` vs `schemas/critical-risk-corpus.schema.json:21` — 정책 §5의 "역할과 권한", "secret"이 critical-risk category enum(9종)에 없다. corpus는 이미 `permission`(3건), `secret`(2건), `external-input`(2건)을 임의 trigger로 쓰고 있어 정책·enum·fixture 3자가 불일치. deterministic override 구현 시 이 항목들이 코드에서 빠질 위험. → Missing Risk Cases 참조.
- **[Major]** `tests/fixtures/workflow-classification-corpus.json:15` (p-10) vs `phase-0a-contracts.md:39` — patch 승격 조건에 "DB"가 있는데 p-10(index 추가 migration)은 patch. index DDL이 DB 변경이 아니라는 뜻이면 승격 조건을 "data model/schema shape 변경"으로 좁혀 명문화해야 하고, 아니면 p-10은 feature다. 현재는 label과 정책이 서로 반증한다.
- **[Major]** corpus 현실성 — 45건 전부 6~10 단어 영어 canonical 문장, 실제 요청 유래 0건(plan §0B "기존 요청/산출물을 redaction 후 replay 입력으로" 미이행), 한국어 0건(실제 VAIS 요청은 대부분 한국어), 모호/`unknown` 기대 case 0건(classifier의 `unknown`·conservative promotion을 검증할 표본 없음), 위험 키워드를 포함하지만 normal인 adversarial case 0건(예: "docs의 'password' 오타 수정"), patch×regulated 0건. 일부 summary는 label을 누설한다(p-05 "non-sensitive"). held-out F1 0.85가 이 corpus에서 나와도 실제 요청 일반화를 보증하지 못한다.
- **[Major]** `tests/adaptive-workflow-contracts.test.js:107-115` — "append-only hash chain 충족" 테스트는 `previousEventHash === 이전 eventHash` 링크만 확인하고 eventHash를 내용에서 재계산하지 않는다(fixture hash는 `bbbb…` placeholder). canonicalization(어느 필드를 어떤 순서로 직렬화해 sha256하는지)이 schema/문서 어디에도 없어 Phase 0A 완료 기준 "audit event chain 검증됨"은 과장이다. **권장**: 0A 문서 §6에 canonical form 명시 + 재계산 테스트.

## Label Corrections

| id | current | proposed | rationale |
|---|---|---|---|
| p-10 | patch/high | feature/high **또는** 승격 조건 문구 수정 | 정책 §3 patch 승격 조건 "DB"와 충돌 (위 finding) |
| f-01 | feature/normal, triggers=[] | feature/high, [pii] | orders 테이블은 통상 고객 성명·주소·연락처 포함; bulk export는 전형적 PII 유출 경로. normal 유지하려면 summary를 "non-personal aggregate table"로 명시 |
| f-14 | feature/normal, triggers=[] | feature/high, [pii] (+external-write if vendor 전송) | funnel event는 user/session id로 키잉되며 대개 외부 analytics로 전송. rationale "no identifying payload"는 가정이지 summary에서 도출되지 않음 |
| f-12 | feature/normal | 재검토(권장 high, [permission,infrastructure]) | feature flag는 프로덕션 동작 제어면; toggle 권한과 오설정 blast radius가 있음. normal 유지 시 "internal-only, no admin surface" 조건을 summary에 명시 |
| i-01 | initiative/normal | initiative/high, [auth,pii,permission] — 또는 summary 교체 | B2B SaaS 신제품은 계정·테넌트 데이터가 불가피. initiative/normal 표본은 필요하므로 "내부 design system/컴포넌트 라이브러리 전면 재구축" 같은 실제 normal initiative로 교체 권장 |
| i-08 | initiative/normal | initiative/high, [auth,pii] — 또는 summary 교체 | consumer 모바일 앱 = 계정·기기 데이터·스토어 배포. 위와 동일 |
| f-13, i-13 | trigger `external-input` | canonical `untrusted-input` (enum 신설) | 정책·enum에 없는 임의 어휘 |
| f-06, i-02, i-07 | trigger `permission` | `authorization` (enum 신설) 또는 `auth`로 통합 + 문서에 동의어 명시 | 정책 §5 "역할과 권한"이 enum에 부재 |
| p-11, f-10 | trigger `secret` | `secret` enum 신설 (critical category에도 추가) | 정책 §5에 있으나 critical corpus category 부재 |
| p-05 | summary "non-sensitive error log message" | label 단서 제거: "Clarify the wording of an existing parser error message" | summary가 assurance label을 누설 |
| f-02,f-03,f-05,f-06,f-09,f-10,f-11,f-13,f-14,f-15 | phaseGraph conditional=[design] | expectedCompiled: design **required** | 정책 §3 compile 규칙 적용 (Critical finding) |
| i-14 | checks 3종 | + `prompt-injection-test`, `tenant-isolation-test` | "private data and model boundary" rationale에 대응하는 검사가 없음 |
| risk-06 | pii / min=high | 유지하되 note: EU 사용자 포함 시 regulated 승격 조건 명시 | minimum이므로 오류는 아니나 classifier가 high에서 멈추는 것을 정답으로 학습할 위험 |

## Missing Risk Cases

| category | example | minimum assurance | required checks |
|---|---|---|---|
| `untrusted-input` (신설) | 파일 업로드·역직렬화·SSRF·템플릿/HTML 렌더링·shell 인자 조립 | high | input-validation-test, injection-test, size/type-limit-test |
| `secret` (정책 §5에 있으나 critical enum 부재) | 서명키 로테이션, 해시 알고리즘 교체, TLS 설정 변경, 커밋된 credential 제거 | high | secret-scan, rotation-check, crypto-review |
| `authorization` (정책 "역할과 권한") | 역할 매트릭스 변경, IDOR 수정, 관리자 impersonation | high | authorization-matrix-test, negative-test, threat-review |
| `agent-capability` (신설, VAIS 자체 위험) | `hooks/hooks.json`·agent tools 허용목록·MCP 서버·permission mode 변경 — AI 실행 권한 확대 | high | hook-diff-review, tool-allowlist-test, sandbox-test |
| patch × regulated | "건강기록 export의 날짜 포맷 버그 수정" | regulated | compliance-review, regression-test |
| adversarial normal | "README의 'password' 오타 수정", "테스트용 mock payment fixture 이름 변경" | normal (trigger 없음) | lint, relevant-test — keyword 기반 over-fire 검증용 |
| ambiguous / `unknown` | "성능 개선해줘", "로그인 쪽 좀 정리" | 기대 profile=`unknown`, assurance≥high(auth 언급 시) | conservative promotion 검증용 |
| 한국어 실요청 | 기존 `docs/*` 피처의 실제 요청을 redaction하여 ≥10건 | 개별 | 언어·형식 일반화 검증용 |

## Baseline Assessment

- **사용 가능 범위**: C등급 "고정 컨텍스트 고유 파일 inventory 하한"과 "템플릿 inventory"의 *상대 비교*(adaptive vs legacy가 동일 선정 규칙을 쓸 때)에만 사용 가능. 절대 토큰·비용·시간 판단, 승인 횟수 판단에는 사용 불가. 현재 working tree에서 `npm run workflow:baseline` 재실행 시 byte 단위로 재현됨(68,653 / 90,177 / 95,738)을 확인.
- **오해 가능 필드**: `repository.headSha`(dirty tree 측정치인데 commit SHA로 표기 — 가장 큰 오해 소지), `estimatedTokens`(bytes/4 산술값이 "token" 명칭), `agentCount.value`·`workflowApprovals.min/max`(정책 상수이지 관측치 아님 — source 명칭으로는 구분되나 표에서는 "agent proxy 4/6/8"로 실측처럼 읽힘), `samples[2]`(반복 측정처럼 보이나 동일 값 복제), `docsMarkdownFiles: 7`(용도 불명), `qualityCommands`(실행 결과 없음).
- **live host run의 blocker 여부**: **Phase 1 shadow 진입의 blocker는 아니다** — Phase 1 완료 기준(F1, unsafe miss, shadow 20건)은 baseline에 의존하지 않고, shadow는 runtime을 바꾸지 않는다. 다만 (a) shadow rollout 중 legacy가 실제로 실행되므로 그때 같은 runId로 host approval/elapsed/quality를 수집하는 것이 가장 자연스럽고, (b) **Phase 2 patch enforce 전에는 hard blocker**로 두어야 한다. 전제: 위 legacy-baseline schema를 지금 확장해 captured 값을 저장할 수 있게 해야 한다(현재는 저장 불가). host가 usage를 끝내 제공하지 않으면 A/B는 unavailable로 두고 KPI에서 제외하되, elapsed·approval count·quality는 B/C로 반드시 수집.

## Verified Commands

| command | result |
|---|---|
| `npm run workflow:evaluate` | exit 0 — classification valid 45 (15/15/15; normal 16 / high 22 / regulated 7; pending-external 45), critical-risk valid, 9 category |
| `node --test tests/adaptive-workflow-contracts.test.js tests/phase-0b-evaluation.test.js` | 20 pass / 0 fail (0A 7 + 0B 13) |
| `npm test` | 369 tests, 366 pass, 0 fail, 3 skip |
| `npm run lint` | pass (eslint, max-warnings=0) |
| `node scripts/vais-validate-plugin.js` | 오류 0 / 경고 0 / 정보 17 |
| `git diff --check` | pass (exit 0) |
| `npm run workflow:baseline` (추가) | 재현 성공, snapshot과 byte 동일; headSha 653074b + dirty=true |
| Ajv(6.14) fixture↔schema 3쌍 (추가) | 3쌍 모두 VALID; 0A schema 3종 compile OK — 단, 테스트 코드는 corpus 2쌍에 대해 Ajv를 실행하지 않음 |
| malformed corpus 16종 probe (추가) | 12종이 JS validator+schema 동시 통과 (A,B,C,D,E,F,G,H,K,M,N,O,P) |
| `git status` (추가) | Phase 0B 산출물 전부 untracked; `contracts/workflow-contract.md`는 HEAD에 없음 |

## Residual Risks

- **`feature`의 design conditional이 사실상 vacuous**: §3 compile 조건 5종 중 하나에 안 걸리는 feature는 거의 없어 feature ≈ legacy − report. "feature 총 입력 proxy 25% 감소" KPI는 report evidence view만으로 달성 가능한지 Phase 1 shadow에서 조기 확인 필요.
- **`dependency`를 무조건 high trigger로 두면** 일상적 버전 bump마다 보안 대화가 열려 비용 KPI를 잠식한다. "신규 publisher / major / crypto·auth 계열 / lockfile 외 변경"으로 좁히는 것을 Phase 1에서 검토.
- **initiative의 ideation이 conditional**: CEO 7차원 라우팅이 ideation에서 일어나므로 initiative(신제품)에서 ideation을 생략하면 CPO/CBO 활성 판단 근거가 사라진다. required로 올리거나 "CEO 알고리즘 결과가 이미 있을 때만 생략" 조건 명시 권장.
- **report `not-required` 상태와 evidence view의 관계**가 phaseStates enum에 없다. `not-required`로 표기되면서 evidence view가 생성되는 상태를 `derived` 등으로 구분하지 않으면 status/legacy rule 3(05-report)과 충돌한다 — Phase 2 이슈로 기록.
- **labeler = classifier 구현자 동일(Codex)**: 45건 label과 classifier를 같은 주체가 만들면 held-out이 있어도 순환 검증이다. Claude가 추가하는 case를 100% held-out에 배정하고, held-out id 목록의 hash를 classifier 코드 이전에 커밋.
- **Q10 권장 split**: 45건은 held-out F1 0.85를 유의하게 판정하기에 작다(class당 5건 → 오분류 1건 = F1 ±0.2). (i) schema에 `split: train|review|held-out` 필드 추가, profile×assurance 층화, seed 기록; (ii) 현재 45건은 60/20/20 → 27/9/9로 나누되 개발 중에는 train+review에 5-fold CV를 쓰고; (iii) Phase 1 acceptance 전에 profile당 30건(총 90+)으로 확장, 신규 case(특히 한국어·모호·adversarial)는 held-out 우선 배정; (iv) critical-risk corpus 18건은 학습에 전혀 쓰지 않는 100% held-out(deterministic override는 규칙이지 학습 대상이 아님).
- **redaction 검증 부재**: fixture에 secret/PII는 없음을 확인했으나(hash는 placeholder), validator가 이를 보장하지 않으므로 실요청 유래 case를 추가하는 순간 위험이 생긴다 (finding G).

## 요약 및 Phase 1 착수 전 최소 수정 항목

정책·label의 방향은 건전하고 자체 검증 수치는 모두 재현되었다. Phase 1 착수 전 최소 수정 항목:

1. feature phaseGraph를 case별 compile 결과로 재기록 (Critical)
2. trigger/check enum 고정 + 동의어 통합 (Critical)
3. validator 정합 규칙(profile→phase graph, assurance↔trigger, category↔trigger, category당 ≥2, secret/PII 스캔) + corpus fixture Ajv 테스트 추가
4. baseline snapshot을 clean commit에서 재생성 + legacy-baseline schema에 captured 표현 추가
5. Phase 0B 판정표에 누락 기준("quality와 cost 같은 runId") 복원, "6 sample" 표현 정정

이 5개가 반영되면 승인 가능하며, live host 6회는 shadow 중 수집하되 Phase 2 enforce의 hard gate로 둔다.

## 변경 이력

| version | date | change |
|---|---|---|
| v1.0 | 2026-08-19 | Claude Gate 1 독립 검토 결과 박제 — 판정 "수정 후 승인" |
