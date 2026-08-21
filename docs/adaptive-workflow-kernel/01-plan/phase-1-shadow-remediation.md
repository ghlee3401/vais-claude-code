---
owner: cto
artifact: phase-1-shadow-remediation
phase: plan
feature: adaptive-workflow-kernel
summary: "Phase 1 shadow 첫 실검토 finding F1~F6의 수정 내역, digest correlation trade-off, opt-in 정책, 기존 민감 로그 정리 방안"
---

# Phase 1 Shadow Remediation — 2026-08-21

## 목적

Phase 1 shadow 구현(commit `74b55ca`)에 대한 첫 실제 검토 요청에서 나온 finding F1~F6을 수정하고, 근거·trade-off·잔여 조치를 기록한다. F1(원문 영속)과 F2(opt-in 부재)는 Phase 1 blocking으로 판정되어 post-fix 표본 20건을 다시 수집하기 전에는 Phase 1을 완료 처리하지 않는다.

## Finding별 수정 내역

| # | 심각도 | Finding | 수정 |
|---|---|---|---|
| F1 | High | secret 미포함 240자 이하 프롬프트는 `requestSummary`에 원문 전문이 그대로 영속되어 `rawPersisted:false` 표기와 불일치 | `requestSummary`를 classifier 산출물 + 구조 메타데이터만으로 만드는 `[structural]` 요약으로 교체. 원문 토큰을 전혀 포함하지 않고 잘라내지도 않는다 (`buildStructuralSummary`) |
| F1-h | High | `requestHash`가 원문 unsalted SHA-256이라 짧은 프롬프트는 사전 공격으로 복원 가능 | 프로젝트별 random key 기반 HMAC-SHA-256 keyed digest로 교체 (`createRequestDigest` + `loadOrCreateDigestKey`). key는 event log에 저장하지 않는다 |
| F2 | Medium | 프로젝트에 `vais.config.json`이 없으면 PLUGIN_ROOT config로 폴백해 플러그인 설치 사용자 전체에 shadow 로깅이 자동 활성화 | PLUGIN_ROOT 폴백 제거. 프로젝트 자체 `vais.config.json`의 명시적 shadow 설정이 있을 때만 활성 (opt-in). config 없음/`off`/`shadow` 3-케이스 회귀 테스트 |
| F3 | Low | `EventLogger` payload 검증 실패 시 `console.error`가 stderr로 출력되어 output-free 계약 위반 | hook 진입 시 `silenceHookOutput()`이 stdout/stderr write와 console.* 전체를 무력화. exit code는 항상 0 유지 |
| F4 | Low | `input.cwd`가 하위 디렉터리면 `.vais/`가 엉뚱한 위치에 생성되고 feature가 `unscoped`로 기록 | `resolveProjectRoot()`가 cwd에서 상위로 걸어 올라가 `vais.config.json` 또는 `.vais/status.json`이 있는 실제 project root를 탐색. config/eventLog/feature/archive 기준을 root로 통일 |
| F5 | Low | shadow runner가 `EventLogger`에 rotation 설정을 전달하지 않아 `observability.maxEventLogSizeMB` 등 무시 | `buildRotationConfig()`가 `observability` 설정을 rotation 설정으로 변환해 전달. `archivePath` 상대경로는 project root 기준 절대경로로 해석 |
| F6 | Info | payment-card 패턴이 13자리 이상 일반 숫자열(epoch 타임스탬프 등)을 카드번호로 오탐 | Luhn 체크섬 검증 통과 시에만 `payment-card`를 sensitive field로 보고 (`passesLuhn`). 이제 detection-only 메타데이터라 안전한 변경 |

## requestSummary 설계 — 비축어적·비가역

저장되는 요약은 원문 텍스트를 일절 사용하지 않고 다음만 조합한다.

```
[structural] profile=feature<-feature@0.52 assurance=normal triggers=none signals=none graph=plan>do>qa size=s/62c/9w script=ko
```

- classifier 산출: profile(selected/recommended/confidence), assurance level, risk triggers, compile signals, phase graph
- 구조 메타데이터: 길이 버킷·문자수·단어수, 문자 체계(ko/en/ko+en/other)
- `redactionApplied`/`redactedFields`는 의미가 "원문에서 감지된 민감 패턴 종류"로 바뀌었다 (원문은 어떤 형태로도 저장되지 않음). schema 필드명은 유지

## requestHash 설계 — keyed digest와 correlation trade-off

- 방식: `HMAC-SHA-256(key, raw)` hex 64자. 기존 schema 패턴 `^[a-f0-9]{64}$` 그대로 만족
- key: 프로젝트별 32-byte random key를 `.vais/state/shadow-digest.key`(mode 0600, `.vais/`는 gitignored)에 영속. **key는 event log에 절대 기록하지 않는다**
- trade-off:
  - 같은 프로젝트 안에서는 동일 프롬프트 → 동일 digest이므로 중복 요청 상관관계(dedup·재요청 분석)가 유지된다
  - key가 다른 프로젝트·머신 간에는 상관관계가 없다 (의도된 격리)
  - key 파일 생성/읽기 실패 시 ephemeral key로 fail-open — digest는 여전히 불투명하지만 해당 이벤트의 cross-run 상관관계는 상실된다
  - key 파일에 접근 가능한 로컬 사용자는 후보 프롬프트 대입 검증이 가능하다. 단 그 사용자는 이미 event log 자체에 접근 가능하므로 위협 모델상 추가 노출이 아니다
- 테스트: unsalted sha256 불일치·key 의존성·프로젝트별 key 영속을 `tests/workflow-shadow.test.js`에서 고정

## Opt-in 정책

- shadow는 **사용자 프로젝트 root의 `vais.config.json`에 명시적 `engine: legacy` + `profile.mode: shadow` 설정이 있을 때만** 활성
- 플러그인 번들 config로의 폴백은 제거 — 플러그인 설치만으로는 어떤 프로젝트에서도 분류·로깅이 일어나지 않는다
- 본 저장소는 자체 `vais.config.json`에 설정이 있으므로 dogfooding 수집은 계속된다

## 기존 .vais/event-log.jsonl 민감 로그 정리 방안 (보고만, 미실행)

현재 event-log에는 수정 전 hook이 남긴 `classification.completed` 이벤트가 있고, `requestSummary`에 프롬프트 원문이, `requestHash`에 unsalted SHA-256이 포함되어 있다. 파일은 gitignored 로컬 전용이라 원격 유출은 없다. 지시에 따라 파일은 수정·삭제하지 않았으며, 사용자 승인 후 실행할 수 있는 선택지는 다음과 같다.

1. **권장 — 아카이브 후 신규 시작**: `.vais/event-log.jsonl`을 `.vais/archive/event-log-prefix-YYYY-MM-DD.jsonl`(mode 0600)로 이동하고 빈 로그로 재시작. Phase 1 acceptance는 post-fix 이벤트만 사용하므로 검토 무결성에도 부합
2. **선별 재작성**: 수정 전 `classification.completed` 이벤트의 `requestSummary`를 `[pre-remediation:removed]`로, `requestHash`를 새 keyed digest로 치환하는 1회성 스크립트 실행. 다른 이벤트 종류는 보존
3. **완전 삭제**: 로그 전체 삭제. append-only 감사 원칙과 충돌하므로 비권장

## 검증 결과 (2026-08-21)

| 명령 | 결과 |
|---|---|
| `npm run workflow:evaluate` | 통과 (errors 없음) |
| `npm run workflow:classify` | 통과 — critical-risk 26건 unsafe miss 0, trigger miss 0 |
| `node --test tests/workflow-shadow.test.js` | 26 tests / 26 pass (회귀 6종 신규 추가) |
| `npm test` | 405 tests / 402 pass / 3 skip / 0 fail |
| `npm run lint` | 통과 (`--max-warnings=0`) |
| `node scripts/vais-validate-plugin.js` | passed: true |
| `node scripts/doc-validator.js docs/adaptive-workflow-kernel` | 통과 |
| `git diff --check` | 통과 |

## 잔여 조치

1. 기존 event-log 정리 방안 중 하나를 사용자가 선택하면 실행한다
2. post-fix 상태에서 실제 workflow 요청 `classification.completed` 20건을 다시 수집한다
3. 20건 검토(profile/assurance/phaseGraph/redaction/unsafe miss/legacy 불변) 통과 전에는 Phase 1을 완료 처리하지 않고 Phase 2로 이동하지 않는다
