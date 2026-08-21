---
owner: cto
artifact: session-handoff-2026-08-21
phase: plan
feature: adaptive-workflow-kernel
summary: "Phase 1 shadow classifier의 완료 상태, 미커밋 변경, 실제 hook 연결 중단점과 새 세션 재개 지시문"
---

# Adaptive Workflow Kernel Session Handoff — 2026-08-21

## 목적

세션 종료 시점의 작업 트리와 검증 결과를 보존하고, 새 세션이 과거 대화 전체를 다시 읽지 않고도 Phase 1 shadow 작업을 정확한 중단점부터 재개하도록 한다.

## 현재 Git 상태

- branch: `main`
- upstream: `origin/main`
- 상태: 로컬이 원격보다 3 commit 앞섬, push하지 않음
- 완료 commit:
  - `9698816` — Phase 0 계약·평가 산출물 고정
  - `ab11c94` — clean-commit legacy baseline 고정
  - `844ac62` — Phase 1 classifier/compiler/shadow runner 골격 구현
- 다음 6개 파일은 commit `844ac62` 이후의 의도된 미커밋 작업이다. 재생성, restore, reset하지 않는다.
  - `lib/evaluation/corpus.js`
  - `lib/workflow/profile-classifier.js`
  - `schemas/evaluation-corpus.schema.json`
  - `tests/fixtures/workflow-classification-corpus.json`
  - `tests/phase-0b-evaluation.test.js`
  - `tests/workflow-shadow.test.js`

미커밋 변경의 목적은 Phase 1 acceptance를 위해 classification corpus를 49건에서 90건으로 확장하고, provenance와 held-out 불변 계약을 강화하는 것이다.

## 완료된 작업과 검증 스냅샷

- classification corpus: 총 90건, `patch / feature / initiative` 각 30건
- provenance: 비식별 실제 요청 replay 13건, raw prompt 영구 저장 없음
- recommendation: `unknown` 5건
- split: train 27 / review 13 / held-out 50
- classifier 구현 전 원래 held-out 13건은 anchor로 보존
- anchor hash: `10fff5bd0fe1fcecb44d5a4d6ed8a2fb159d484188604f6f44bf3739b9d1e9eb`
- 신규 held-out의 복합 신규 제품 표현 4건은 결함 발견 후 review split으로 이동했고, `new payment platform`, `new health service` 같은 복합 수식어를 인식하도록 규칙을 보완함
- held-out profile macro F1: `1.0`
- critical-risk 26건 unsafe assurance miss: `0`
- phase graph mismatch: `0`
- `npm run workflow:evaluate`: 통과
- `npm test`: 391 tests / 388 pass / 3 skip / 0 fail
- `npm run lint`: 통과
- `node scripts/doc-validator.js docs/adaptive-workflow-kernel`: 통과
- `git diff --check`: 통과

## 정확한 중단점

`scripts/prompt-handler.js`는 `runShadowAnalysis()`를 호출하지만 현재 `hooks/hooks.json`에 등록된 활성 hook이 아니다. 기존 테스트에도 `prompt-handler removed from hooks (v0.31.0)` skip 근거가 남아 있다.

현재 활성 `UserPromptSubmit` hook은 `hooks/checkpoint-keyword.js`뿐이다. 따라서 classifier, compiler, shadow runner와 단위 테스트가 존재하더라도 실제 Claude Code 사용자 요청 경로에서는 shadow 분석이 실행되지 않는다. 이 연결이 끝나기 전에는 Phase 1 완료로 표시하지 않는다.

직전 세션은 다음 파일의 기존 계약을 읽고 전용 hook 구현을 시작하려던 시점에 종료됐다. 종료 직전 명령은 읽기 전용이었고 hook 관련 파일 편집은 적용되지 않았다.

- `hooks/checkpoint-keyword.js`
- `lib/io.js`
- `hooks/hooks.json`
- `scripts/vais-validate-plugin.js`
- hook 등록을 검사하는 기존 tests

## 다음 세션 구현 범위

1. 위 6개 미커밋 corpus 변경을 그대로 보존한다.
2. 실제 `UserPromptSubmit` 요청에서만 실행되는 전용 silent shadow hook을 추가한다.
3. 새 hook은 stdin payload의 prompt와 host/session/feature context를 안전하게 정규화해 `runShadowAnalysis()`에 전달한다.
4. raw prompt는 event log에 저장하지 않고 redacted summary와 request hash만 기록한다.
5. stdout으로 사용자 안내나 추가 context를 출력하지 않는다. 기존 legacy 실행, checkpoint keyword 동작, 상태 전이를 변경하지 않는다.
6. shadow 비활성, 입력 오류, event log 오류에서는 fail-open하고 기존 요청 처리를 막지 않는다.
7. `hooks/hooks.json`의 기존 `UserPromptSubmit` 목록에 별도 command로 등록한다.
8. hook 직접 실행, redaction, disabled mode, fail-open, legacy 출력 불변, manifest 등록을 회귀 테스트로 고정한다.
9. 아래 검증을 모두 통과시킨다.

```bash
npm run workflow:evaluate
npm run workflow:classify
node --test tests/workflow-shadow.test.js
npm test
npm run lint
node scripts/vais-validate-plugin.js
node scripts/doc-validator.js docs/adaptive-workflow-kernel
git diff --check
```

10. 검증 후 `main.md`의 현재 상태와 Next Phase를 갱신한다. 실제 shadow 요청 20건 검토가 끝나기 전에는 Phase 2 enforce로 이동하지 않는다.

## 새 세션에 그대로 전달할 지시문

```text
adaptive-workflow-kernel 작업을 이전 세션의 정확한 중단점부터 계속해줘.

먼저 다음 문서만 순서대로 읽어:
1. ONBOARDING.md
2. docs/adaptive-workflow-kernel/01-plan/main.md
3. docs/adaptive-workflow-kernel/01-plan/session-handoff-2026-08-21.md
4. docs/adaptive-workflow-kernel/01-plan/development-plan.md의 Phase 1 섹션

중요:
- main 브랜치는 origin/main보다 3 commit 앞서 있고 push되지 않았다.
- handoff 문서에 적힌 6개 미커밋 corpus 변경은 의도된 작업이므로 restore/reset/revert하거나 재생성하지 마라.
- 저장소 내부의 일반 편집과 비파괴 검증은 추가 질문 없이 계속 진행해라.
- destructive 명령, 기존 변경 복원, 외부 push는 하지 마라.

현재 미완료 작업은 실제 Claude Code 요청 경로의 shadow 연결이다. scripts/prompt-handler.js는 활성 hook이 아니므로 기존 안내 동작을 되살리지 말고, 출력 없이 분류와 감사 event만 수행하는 전용 UserPromptSubmit shadow hook을 추가해라. hooks/checkpoint-keyword.js, lib/io.js, hooks/hooks.json, scripts/vais-validate-plugin.js와 기존 hook 테스트 계약을 먼저 확인하고 구현해라.

legacy 실행과 checkpoint 동작은 바꾸지 말고, raw prompt를 저장하지 않으며 오류 시 fail-open해야 한다. hook 등록과 회귀 테스트를 추가한 뒤 handoff 문서의 검증 명령을 모두 실행해라. 모두 통과하면 main.md 상태와 Next Phase를 갱신하고 변경 파일, 검증 결과, 남은 Phase 1 조건을 보고해라. 커밋과 push는 하지 마라.
```

## Phase 1 잔여 완료 조건

- 실제 활성 hook을 통한 shadow 기록 연결
- shadow 실제 요청 20건 검토
- 잘못된 shadow 결과가 legacy 실행을 변경하지 않는다는 실제 경로 확인
- 위 조건과 전체 회귀 검증을 evidence로 남긴 뒤 Phase 2 진입 여부 결정
