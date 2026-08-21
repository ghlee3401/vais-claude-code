---
owner: cto
artifact: main
phase: plan
feature: adaptive-workflow-kernel
---

# Adaptive Workflow Kernel - Plan Index

## Executive Summary

VAIS Code의 문서 기반 오케스트레이션을 플랫폼 중립 실행 코어로 옮겨, 상용화 수준의 품질 통제와 의사결정 기록은 유지하면서 토큰, 대기 시간, 사용자 승인, 불필요한 산출물을 줄인다.

핵심 변경은 다음 세 가지다.

1. `patch / feature / initiative` 작업 프로파일과 `normal / high / regulated` assurance를 분리한다.
2. phase, gate, agent, artifact를 Markdown이 아니라 코드가 `TaskEnvelope`로 결정한다.
3. Claude Code와 Codex는 동일한 kernel을 사용하는 host adapter가 된다.

| 현재 상태 | 값 |
|---|---|
| Plan | Phase 0A/0B Gate 1 승인, Phase 1 shadow 활성 hook 연결 완료, 실제 요청 20건 검토 대기 |
| 평가 | 90건 corpus와 held-out 50건 macro F1 `1.0`, unsafe miss `0`, 전체 396 tests / 393 pass / 3 skip |
| 구현 | classifier/compiler/shadow runner와 silent `UserPromptSubmit` hook 연결, legacy/checkpoint 출력 불변 |
| 다음 작업 | 실제 shadow 요청 20건 검토와 live legacy E2E evidence 수집 |
| 전환 정책 | legacy 유지 + shadow mode 우선 |

새 세션에서는 본 문서를 먼저 읽고, 현재 작업에 필요한 경우에만 `development-plan.md`의 해당 phase를 읽는다. 과거 대화 전체를 다시 로드하지 않는다.

## Decision Record

| # | Decision | Owner | Rationale | Source artifact |
|---|---|---|---|---|
| 1 | 개발 크기를 문서 템플릿이 아니라 전체 실행 프로파일로 정의한다 | cto | agent, phase, gate, artifact 비용을 함께 제어해야 한다 | `development-plan.md` |
| 2 | 크기와 위험도를 별도 축으로 관리한다 | cto | 작은 인증 수정처럼 규모는 작지만 위험한 작업이 존재한다 | `development-plan.md` |
| 3 | 정상 흐름은 시작 시 한 번 승인하고, 경계 변경이나 실패 시에만 다시 확인한다 | cto | 사용자 주권과 낮은 클릭 수를 동시에 만족한다 | `development-plan.md` |
| 4 | Markdown은 제어면이 아니라 고가치 결정과 증거의 projection으로 사용한다 | cto | 규칙 반복과 sub-agent 원문 박제를 줄인다 | `development-plan.md` |
| 5 | Codex 포팅 전에 공통 kernel을 완성한다 | cto | 현재 비용 구조를 다른 플랫폼에 그대로 복제하지 않는다 | `development-plan.md` |
| 6 | 첫 적용은 기존 흐름을 유지하는 shadow mode로 시작한다 | cto | 품질 회귀와 잘못된 분류를 실제 데이터로 검증한다 | `development-plan.md` |
| 7 | 신규 병렬 kernel을 만들지 않고 기존 core/state/gate/observability를 profile-aware compiler로 확장한다 | cto | 이중 상태·게이트 체계를 방지한다 | `plan-review.md` |
| 8 | Codex 전체 adapter는 공통 core 이후 구현하되 capability spike는 core 계약 확정 전에 수행한다 | cto | host 차이를 늦게 발견해 core를 다시 설계하는 위험을 줄인다 | `plan-review.md` |
| 9 | 사용자 요청 원문은 실행 중에만 보존하고 기본 영구 저장은 redacted summary와 hash로 제한한다 | cto | secret·PII의 문서 및 event log 유출을 막는다 | `plan-review.md` |
| 10 | 승인 1회 목표는 VAIS workflow 승인에만 적용하고 host의 tool permission과 hook trust는 별도 측정한다 | cto | 플러그인이 통제할 수 없는 승인을 KPI에 섞지 않는다 | `plan-review.md` |
| 11 | 내부 profile 이름을 `patch / feature / initiative`로 사용하고 UI에는 `작게 / 표준 / 전체`로 표시한다 | cto | `quick`은 속도, `product`는 결과물 종류로 오해될 수 있다 | `plan-review.md` |
| 12 | 작은 작업은 실행 예고와 예시를 보여주고 한 번 승인받은 뒤 경계 안에서 자동 완료한다 | ceo | 자동 진행 전 사용자가 실제 변경 결과를 이해할 수 있어야 한다 | `workflow-policy-decisions.md` |
| 13 | high/regulated 작업은 대화형 보안 재확인과 명시적 승인 없이는 실행하지 않는다 | ceo | 비용보다 보안 사고 예방을 우선해야 하는 영역이다 | `workflow-policy-decisions.md` |
| 14 | AI의 모든 실행 행동은 runId 기반 append-only 감사 로그로 남긴다 | ceo | 자동화 수준이 높아질수록 완전한 추적성이 필요하다 | `workflow-policy-decisions.md` |
| 15 | 비용 절감을 기본값으로 두고 위험이 있는 부분만 검증 강도를 높인다 | ceo | 전체 절차를 무겁게 만들지 않고 상용 품질을 유지한다 | `workflow-policy-decisions.md` |
| 16 | Phase 0A에서는 기존 status runtime을 변경하지 않고 adaptive run 상세를 별도 계약으로 정의한다 | cto | v2/v3/v4 상태가 공존하는 상황에서 조기 migration으로 기존 실행을 깨뜨리지 않는다 | `phase-0a-contracts.md` |
| 17 | 감사 완전성은 kernel, host hook, structured agent result를 합쳐 계산하고 누락을 명시한다 | cto | host별 관찰 불가 영역을 성공으로 추정하지 않고 추적성의 한계를 드러낸다 | `phase-0a-contracts.md` |
| 18 | 공통 event policy에서 Claude/Codex별 hook 설정을 생성하고 raw hook 파일은 공유하지 않는다 | cto | 유사한 hook 형식 뒤에 있는 event coverage와 trust 차이를 adapter 경계에 가둔다 | `phase-0a-contracts.md` |
| 19 | `docs/`에는 현재 개발 산출물만 두고 runtime 정본은 소유 디렉터리의 `contracts/`, `design-system/specs/`, `agents/_shared/`로 분리한다 | ceo | 과거 문서 스캔과 잘못된 정본 선택을 줄이고 이력은 Git으로 보존한다 | 사용자 승인에 따른 repository cleanup |
| 20 | Phase 0B baseline은 A/B actual 부재를 C등급 고유 파일 inventory 하한으로 대체하되 actual token으로 표시하지 않는다 | cto | 반복 입력과 실제 생성 산출물을 관찰하지 못한 수치를 비용 실측으로 오해하지 않는다 | `phase-0b-evaluation.md` |
| 21 | 모든 classification label은 외부 reviewer가 승인하기 전 `pending-external`로 유지한다 | ceo | classifier가 자기 생성 label만으로 평가되는 순환 검증을 막는다 | `gate-1-claude-review.md` |
| 22 | risk trigger와 check ID는 `contracts/workflow-taxonomy.json`을 단일 정본으로 사용한다 | cto | 자유 문자열과 동의어 drift로 unsafe miss 판정이 불가능해지는 문제를 막는다 | `gate-1-remediation.md` |
| 23 | classification case는 compile signal과 기대 phase graph를 함께 저장하고 held-out ID hash를 classifier 전에 고정한다 | cto | profile 템플릿 암기와 평가 정답 사후 변경을 막는다 | `gate-1-remediation.md` |
| 24 | dirty baseline은 clean commit으로 표시하지 않고 파일별 SHA-256 manifest로 재현 범위를 명시한다 | cto | base head SHA와 working tree 측정치를 혼동하지 않는다 | `phase-0b-evaluation.md` |
| 25 | live legacy 6회는 Phase 1 shadow 진입을 막지 않지만 Phase 2 adaptive enforce 전 hard gate로 둔다 | cto | shadow 중 실제 legacy run으로 approval, elapsed, quality를 같은 runId에 수집한다 | `gate-1-remediation.md` |
| 26 | audit event hash는 eventHash만 제외한 canonical UTF-8 JSON의 SHA-256으로 계산한다 | cto | 링크 placeholder가 아니라 본문 변조를 검출한다 | `phase-0a-contracts.md` |
| 27 | Gate 1은 승인하며 working-tree manifest는 clean commit baseline 재생성을 조건으로 임시 수용한다 | cto | 32개 파일 hash와 scopeDigest가 재현됐고 Phase 1 shadow 착수 위험을 충분히 제한한다 | `gate-1-claude-rereview-result.md` |
| 28 | classifier 구현 전 held-out 13건과 hash를 고정하고 label correction 후에도 review 상태는 pending-external로 유지한다 | cto | 평가 정답 사후 변경과 자체 승인 순환을 막는다 | `gate-1-claude-rereview-result.md` |
| 29 | Phase 0 baseline은 commit `9698816`의 clean tree와 32개 scope file hash로 고정한다 | cto | Phase 1 이후 비용 비교 기준이 구현 변경과 섞이지 않게 한다 | `phase-0b-evaluation.md` |
| 30 | Phase 1 classifier/compiler는 legacy 결과를 변경하지 않는 shadow 경로로 먼저 구현한다 | cto | profile과 assurance 품질을 실데이터에서 검증한 뒤 enforce해야 한다 | `session-handoff-2026-08-21.md` |
| 31 | 구현 전 held-out 13건을 anchor로 보존하고 신규 사례는 held-out 우선으로 추가하되, 규칙 보정에 사용한 사례는 review로 이동한다 | cto | 평가 중 발견한 사례로 classifier를 보정한 뒤에도 순수 held-out 성능을 과장하지 않는다 | `session-handoff-2026-08-21.md` |
| 32 | 활성 `UserPromptSubmit` 연결과 실제 shadow 요청 검토 전에는 Phase 1을 완료 처리하지 않는다 | cto | 비활성 `prompt-handler.js`의 단위 테스트만으로 실제 host 연결을 증명할 수 없다 | `session-handoff-2026-08-21.md` |
| 33 | 실제 UserPromptSubmit shadow는 안내·additional context 없이 별도 hook에서 실행하고 모든 오류를 fail-open한다 | cto | 오분류·감사 로그 실패가 legacy 요청 처리와 checkpoint 출력을 바꾸지 않게 한다 | `hooks/workflow-shadow.js` |

### 변경 이력

| version | date | change |
|---|---|---|
| v1.0 | 2026-08-11 | 분석 결과와 개발 로드맵을 지속 참조 가능한 Plan 정본으로 저장 |
| v1.1 | 2026-08-12 | 상태 머신, 계측, 개인정보, evidence attribution, Codex 선행 spike 관점 재검토 |
| v1.2 | 2026-08-12 | 작은 작업 실행 예고 후 자동 진행, 고위험 보안 대화, 전체 감사 로그 정책 확정 |
| v1.3 | 2026-08-13 | Phase 0A 실행 계약, schema, host capability, 감사 완전성 규칙 확정 |
| v1.4 | 2026-08-13 | 과거 feature 문서를 제거하고 현재 runtime 계약을 소유 디렉터리로 분리 |
| v1.5 | 2026-08-13 | Phase 0B 평가 corpus와 legacy repository proxy를 구축하고 Claude Gate 1 검토 대기 상태로 전환 |
| v1.6 | 2026-08-20 | Claude Gate 1 수정 후 승인 판정 반영, taxonomy/corpus/baseline/audit 보완 후 재검토 대기 |
| v1.7 | 2026-08-21 | Claude Gate 1 승인 및 label correction 반영, clean-commit baseline 전환 대기 |
| v1.8 | 2026-08-21 | commit 9698816 clean-commit baseline 전환 완료, Phase 1 shadow 착수 상태로 이동 |
| v1.9 | 2026-08-21 | Phase 1 classifier와 90건 corpus 검증 상태, 실제 UserPromptSubmit hook 연결 중단점 박제 |
| v1.10 | 2026-08-21 | silent UserPromptSubmit shadow hook 연결과 redaction·disabled·fail-open·legacy 불변 회귀 검증 완료 |

## Artifacts

| Artifact | Owner | Agent | Source | Summary | File |
|---|---|---|---|---|---|
| development-plan | cto | cto-direct | repo 분석 + 사용자 결정 | adaptive workflow kernel 상세 개발 계획, 마이그레이션, 평가 기준 | `development-plan.md` |
| plan-review | cto | cto-direct | v1.0 계획 + 실제 core/hook/config 재대조 | 구현 전 차단 이슈와 v1.1 보정 결정 | `plan-review.md` |
| workflow-policy-decisions | cto | cto-direct | 대표 확정 정책 | 승인, 보안 재확인, 감사 로그, 위험 기반 검증의 운영 계약 | `workflow-policy-decisions.md` |
| phase-0a-contracts | cto | cto-direct | 대표 확정 정책 + repository/runtime 분석 + 공식 host 문서 | profile phase graph, 승인·보안 state, audit·계측 schema, Claude/Codex adapter 계약 | `phase-0a-contracts.md` |
| phase-0b-evaluation | cto | cto-direct | Phase 0A 계약 + Gate 1 findings | 49개 classification, 26개 critical-risk, manifest/captured 지원 baseline | `phase-0b-evaluation.md` |
| gate-1-claude-review | cto | cto-direct | Phase 0B 구현과 검증 결과 | 1차 외부 label 독립 검토 전달 패킷 | `gate-1-claude-review.md` |
| gate-1-claude-review-result | cto | claude | 1차 Gate 1 입력 15개 파일과 재현 명령 | 수정 후 승인 판정, Critical/Major finding과 최소 수정 항목 | `gate-1-claude-review-result.md` |
| gate-1-remediation | cto | cto-direct | Claude 1차 검토 finding | finding별 해결 근거, 부분 해결, 외부 실행 blocker | `gate-1-remediation.md` |
| gate-1-claude-rereview | cto | cto-direct | Gate 1 remediation 결과 | Claude 독립 재검토 입력, 질문, 명령, 출력 형식 | `gate-1-claude-rereview.md` |
| gate-1-claude-rereview-result | cto | claude | Gate 1 재검토 입력 17개 파일과 독립 probe | 승인 판정, label correction, clean-commit baseline 조건, Phase 1 완료 기준 | `gate-1-claude-rereview-result.md` |
| session-handoff-2026-08-21 | cto | cto-direct | Git 상태, 검증 재실행, 직전 세션 가시 로그 | Phase 1 완료 상태, 미커밋 변경, hook 연결 중단점, 새 세션 재개 지시문 | `session-handoff-2026-08-21.md` |

## CEO 판단 근거

본 계획은 `/vais ceo` 자동 라우팅이 아니라 사용자의 직접적인 구조 개선 계획 요청으로 작성했다. 기술 제어면, 비용 계측, workflow kernel, Claude/Codex adapter가 핵심이므로 CTO owner로 고정한다. 제품 UX 관점은 작업 프로파일 선택과 승인 모델에 반영하며, Codex 배포는 공통 kernel 이후에 수행한다.

## Next Phase

1. 활성 hook의 `classification.completed` 실제 요청 20건을 수집하고 profile, assurance, phase graph를 검토한다.
2. 실제 표본에서 unsafe assurance miss가 0건이고 잘못된 shadow 결과도 legacy 실행을 변경하지 않는지 확인한다.
3. Phase 2 enforce 전 hard gate인 live legacy E2E 3종 x 2회의 approval, elapsed, quality를 같은 runId로 연결한다.
4. 위 evidence를 남기기 전에는 Phase 1을 완료하거나 Phase 2 adaptive enforce로 이동하지 않는다.

구현 중 상태가 바뀌면 본 문서의 현재 상태와 Next Phase를 갱신하고, Decision Record는 기존 행을 수정하지 않고 append한다.
