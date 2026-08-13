---
owner: cto
artifact: plan-review
phase: plan
feature: adaptive-workflow-kernel
summary: "v1.0 계획을 실제 상태 머신, gate, observability, hook 및 Codex 공식 계약과 재대조한 검토 결과"
---

# Adaptive Workflow Kernel Plan Review

## 1. 결론

v1.0의 핵심 방향인 `작업 규모 + 위험도` 2축, policy as code, progressive disclosure, evidence 중심 문서, Claude/Codex 공통 core는 유지할 가치가 있다.

다만 v1.0은 아래 차단 이슈 때문에 그대로 구현하면 안 된다. 본 검토의 보정 사항을 반영한 `development-plan.md` v1.1을 구현 정본으로 사용한다.

## 2. 구현 전 차단 이슈

### Critical - Profile별 phase graph와 현재 mandatory 계약 충돌

- v1.0의 `quick`은 Design과 Report를 생략하지만 `lib/core/state-machine.js`, `lib/status.js`, `vais.config.json`, `skills/vais/SKILL.md`는 CTO의 5단계 순차 실행을 강제한다.
- classifier만 먼저 구현해도 실제 실행과 연결하는 순간 상태, validator, outro, gate가 서로 다른 다음 phase를 계산한다.
- classifier 구현 전에 `profile -> requiredPhases/optionalPhases` 계약과 상태 migration을 먼저 확정해야 한다.

### High - 신규 kernel이 기존 core와 이중 체계를 만들 위험

- 저장소에는 이미 state machine, status store, gate manager, observability schema/logger, phase context가 존재한다.
- 별도 `lib/kernel/gate-runner.js`, 별도 state store를 추가하면 어느 쪽이 정본인지 다시 모호해진다.
- 신규 작업은 기존 모듈을 profile-aware compiler 아래에서 재사용·정리하고, 교체가 필요한 모듈만 단계적으로 대체한다.

### High - 현재 계측으로 실제 총 토큰 40%를 검증할 수 없음

- `context-baseline.js`는 고정 파일과 artifact bytes를 세며 provider billing token을 수집하지 않는다.
- 일반 Claude/Codex lifecycle hook payload가 전체 모델 usage를 안정적으로 제공한다는 계약이 없다.
- 실제 token, transcript proxy, 정적 context bytes를 서로 다른 metric으로 저장해야 한다.
- 12개 시나리오 3회 전체 실행보다 30개 이상 offline replay fixture와 소수 live E2E가 먼저다.

### High - 사용자 원문 영구 저장은 commercial workflow의 보안 위험

- 요청 원문에는 secret, 개인정보, 고객 데이터가 포함될 수 있다.
- `goalVerbatim`은 실행 중 ephemeral 값으로만 유지한다.
- 영구 evidence에는 redacted summary, request hash, 명시적 opt-in이 있을 때만 sanitized raw reference를 남긴다.

### High - git diff 기반 자동 문서는 실행 귀속성이 없음

- 기존 dirty worktree, 사용자 변경, 동시 sub-agent 변경이 전체 diff에 섞일 수 있다.
- 실행 시작 시 `HEAD`, dirty path hash, allowed paths를 snapshot하고 runId별 tool/test evidence로 변경을 귀속해야 한다.
- renderer는 전체 diff가 아니라 run-scoped evidence manifest만 읽어야 한다.

### Medium - 승인 1회의 범위가 불명확

- VAIS가 줄일 수 있는 것은 workflow checkpoint 승인이다.
- Claude/Codex의 shell·write permission과 Codex plugin hook trust는 host 보안 정책이며 별도 승인이 발생할 수 있다.
- KPI를 `workflowApprovalCount`, `hostPermissionCount`, `hookTrustCount`로 분리한다.

### Medium - Codex 검증 시점과 지원 surface가 불명확

- `.codex-plugin/plugin.json`, local marketplace, plugin hook은 현재 공식 지원 경로다.
- Codex CLI는 plugin을 지원하지만 IDE extension은 plugin을 지원하지 않고 standalone skill만 지원한다.
- full adapter 구현은 공통 core 이후가 맞지만 hook 입력, timeout, trust, skill discovery 차이를 확인하는 capability spike는 core schema 확정 전에 수행한다.

## 3. 보정 결정

1. profile 내부 코드는 `patch / feature / initiative`, 사용자 표시는 `작게 / 표준 / 전체`로 한다.
2. assurance는 profile과 독립적으로 `normal / high / regulated`를 유지한다.
3. `unknown` 분류를 허용하고 불확실하면 자동으로 한 단계 상향한다.
4. 기존 `lib/core`, `lib/status.js`, `lib/quality`, `lib/observability`를 먼저 정리·확장한다.
5. Phase 0을 계약·feasibility 단계와 baseline 단계로 분리한다.
6. actual token 목표는 수집 가능할 때만 적용하고 항상 proxy metric을 병기한다.
7. raw prompt와 전체 git diff는 영구 evidence의 기본 입력에서 제외한다.
8. Codex capability spike를 Phase 0으로 당기고 full packaging은 후반에 유지한다.

## 4. 구현 착수 조건

- profile별 phase graph ADR 승인
- 상태 schema와 migration/rollback fixture 통과
- metric source와 정확도 등급 정의
- privacy/redaction 정책 정의
- run-scoped evidence attribution 설계
- Claude/Codex capability matrix 작성
- 최소 30개 label fixture 준비

위 조건이 충족되기 전에는 기존 mandatory phase 규칙, agent 문서, artifact validator를 변경하지 않는다.

## 5. 참조

- `lib/core/state-machine.js`
- `lib/status.js`
- `lib/quality/gate-manager.js`
- `lib/observability/`
- `scripts/context-baseline.js`
- `hooks/hooks.json`
- OpenAI official: `https://learn.chatgpt.com/docs/build-plugins`
- OpenAI official: `https://learn.chatgpt.com/docs/hooks`
- OpenAI official: `https://learn.chatgpt.com/docs/build-skills`
- OpenAI official: `https://learn.chatgpt.com/docs/agent-configuration/agents-md`

## 변경 이력

| version | date | change |
|---|---|---|
| v1.0 | 2026-08-12 | v1.0 계획의 구현 전 차단 이슈 및 보정 결정 기록 |
