---
owner: cto
artifact: synthesis
phase: plan
feature: vais-1-0-0-release
generated: 2026-05-16
synthesizer: cto
model-version: v2
summary: "0.68.0 → 1.0.0 GA plan 합성문 — 3 sub-agent (CTO/CSO/COO) Lazy Consensus 합의. 18 결정 + 18 AC + 5 T-위협. agent-teams dogfood — 분량 측정 AC5."
---

# vais-1-0-0-release — Plan (합성문, v2)

> Phase: 📋 plan | Synthesizer (도메인 리드): **CTO** | Date: 2026-05-16
> Lazy Consensus: consensus-reached
> 입력: [ideation main.md](../00-ideation/main.md) + 3 sub-agent artifact ([tech-plan](./tech-plan.md), [security-gate-plan](./security-gate-plan.md), [release-pipeline-plan](./release-pipeline-plan.md))

## 1. Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | vais-code 가 0.68.0 GA 직후 (커밋 `89141e3`, 2026-05-16) v0.x 실험 라벨 잔존 + status.json v3 schema + CHANGELOG narrative 미정렬. 1.0.0 정식 GA 라벨링 필요. |
| **Solution** | (a) 5 파일 version sync (b) status v3→v4 마이그레이션 (c) organization-in-a-box narrative 재정렬 (d) CHANGELOG `[1.0.0]` 6 섹션 (e) git tag v1.0.0 + 마켓플레이스 재배포. **agent-teams dogfood** (`enabled=true`) — 자기 GA 에 자기 신규 기능 적용. |
| **Effect** | 신규 기능 추가 0. 코드 변경 surface 최소. 사용자 체감 = (1) marketplace 1.0.0 라벨 + organization-in-a-box description (2) status.json 자동 마이그레이션 (3) v2 합성문 모델 실증. |
| **Core Value** | 1.0.0 = narrative GA. dogfood 합성문 분량 = lean 원칙 실증 (AC5). 자기 자신의 신규 기능을 자기 GA 작업에 적용 = self-consistent. |

## 2. 결정 (Synthesizer 합성, Lazy Consensus)

| # | Decision | 합성자 추론 / 근거 | Owner 제기 / 합의 |
|---|----------|--------------------|--------------------|
| 1 | 5 파일 version sync (package/vais.config/plugin.json/marketplace.json/CHANGELOG) | 마켓플레이스 재배포 hard 요구 | cto → cso → coo (✓) |
| 2 | status.json v3 → v4 마이그레이션 실행 | 0.68 에 박제된 idempotent 스크립트 + .v3.bak 백업 | cto → cso (Low/High 평가) ✓ |
| 3 | _legacy/v1/ archive 보존 | git history 증거 + dogfood 비교 기준 | cto → cso (보안 surface 0) ✓ |
| 4 | narrative 재정렬 (CLAUDE.md/ONBOARDING/marketplace description) | organization-in-a-box GA 일관화 | cto → cso (surface 0) → coo ✓ |
| 5 | CHANGELOG `[1.0.0]` Keep a Changelog 6 섹션 (Added/Changed/Deprecated/Removed/Fixed/Security + Migration Guide) | 누적 변경 정리 + 마이그레이션 가이드 분리 | coo → cto ✓ |
| 6 | git tag annotated `v1.0.0` + push 사용자 승인 후 | 외부 배포 = 명시 승인 (CLAUDE.md Rule #5) | coo → cto ✓ |
| 7 | SemVer Major 판정 | status v4 breaking + agent-teams 메이저 + GA narrative | coo ✓ (단독 도메인) |
| 8 | 3-Gate 체크리스트 (A 보안 / B 플러그인 / C 코드리뷰) | Gate B = 마켓플레이스 재배포 hard 의존 | cso → cto ✓ |
| 9 | agent-teams `enabled=true` dogfood 유지 (plan 작성 자체에 적용 — 본 문서) | ideation 6번째 결정 직접 승계 | cto → cso → coo ✓ |
| 10 | dogfood fallback: SendMessage 3회 timeout / FSM stuck / synthesizer 오류 → `enabled=false` 1줄 회귀 | T4 mitigation | cso → cto ✓ |
| 11 | _legacy 처리 결정 = Do phase implementation-log 에 단순 기록 후 종결 (삭제 X) | plan 단계 = 결정만, 실행 X | cto ✓ |
| 12 | README.md 존재 여부 Do phase 초입 확인 → 조건부 narrative 정렬 | top-level README 부재 가능성 (현재 미확인) | cto ✓ |
| 13 | T5 (tag 잘못 push) → rollback 명령 박제 (`git tag -d` + `git push :refs/tags/`) | 되돌리기 외부 배포 안전망 | coo → cso ✓ |
| 14 | T2 (1.0.0 GA 후 critical bug) → 24h SLA 1.0.1 hotfix 트리거 | release-monitor 24h 모니터링 연동 | cso → coo ✓ |
| 15 | post-release release-monitor 3 지표 (cache 갱신/smoke/agent-teams 사용) | 06 phase 박제 | coo ✓ |
| 16 | CPO/CBO 제외 — 내부 도구 (`feedback_internal_feature_no_persona`) | ideation 4번째 결정 승계 | ceo (ideation) → cto ✓ |
| 17 | Do phase 내부 순서: Gate B → version sync → migration → narrative → git tag | 보안 게이트 선행 의무 | cso → cto → coo ✓ |
| 18 | 본 plan main.md 분량 측정 = AC5 검증 대상. 결과에 따라 v2 synthesis.template 9→5 압축 follow-up 결정 | dogfood 실증 데이터 박제 | cto ✓ (PO 사전 합의) |

## 3. 핵심 알고리즘

본 phase 알고리즘 불필요 (release plan 은 절차적). Design phase 의 release pipeline 에서 sync 검증 스크립트 박제됨 (`release-pipeline-plan.md` §4).

## 4. State Machine

불필요. Phase 순서 = plan → design → do → qa → report 일반 PDCA.

## 5. 인터페이스 계약

config schema 변경 1 건:
- `vais.config.json > orchestration.agentTeams.enabled` = `false` (default) → **`true`** (본 피처 dogfood 적용 중)
- 1.0.0 GA 시 default 유지 (false) — 사용자가 dogfood 결과 검토 후 활성화 결정

## 6. Success Criteria — 합성 AC 매트릭스 (18 AC)

| ID | Criterion | Verification | Owner |
|----|-----------|--------------|-------|
| AC1 | 5 버전 파일 모두 `1.0.0` | grep | cto |
| AC2 | status.json `version=4` | node -e | cto |
| AC3 | validate-plugin 0 err / ≤1 warn | bash | cto |
| AC4 | CHANGELOG `[1.0.0]` 6 섹션 | grep -A 50 | cto |
| AC5 | **plan main.md 분량 측정** — `<150` 줄 = 9 섹션 유지 + lean 실증 / `≥200` 줄 = v2 압축 follow-up 박제 | `wc -l` | cto (dogfood) |
| AC6 | `git tag v1.0.0` annotated | git tag | cto/coo |
| AC7 | fallback 절차 박제 (3 트리거 + 회귀 1줄) | implementation-log | cto |
| AC8 | _legacy 결정 박제 (보존 권고) | implementation-log | cto |
| AC-CSO-1 | secret-scanner 0 hit | grep regex | cso |
| AC-CSO-2 | dependency CVE high/critical 0 + SPDX 호환 | npm audit | cso |
| AC-CSO-3 | plugin-validator pass | bash | cso |
| AC-CSO-4 | 5 파일 version 동기 (AC1 join) | diff | cso |
| AC-CSO-5 | code-reviewer 독립 리뷰 bug=0 | review report | cso |
| AC-COO-1 | CHANGELOG 6 섹션 (AC4 join) | grep -c | coo |
| AC-COO-2 | 5 파일 sync 검증 스크립트 PASS | node sync-check | coo |
| AC-COO-3 | git tag annotated (AC6 join) | git show | coo |
| AC-COO-4 | 마켓플레이스 재배포 (사용자 승인 후 push) | marketplace page | coo |
| AC-COO-5 | release-monitor 24h GREEN (3 지표) | report artifact | coo |

> QA 에서 ✅ Met / ⚠️ Partial / ❌ Not Met 평가. AC5 는 본 문서 박제 직후 측정.

## 7. 위협 / 위험 (CSO 도메인)

| ID | 위협 | 가능성/영향 | Mitigation |
|----|------|-----------|-----------|
| T1 | status 마이그레이션 중 실패 → 데이터 손실 | Low/High | .v3.bak + atomic rename 이미 구현 |
| T2 | 1.0.0 GA 후 critical bug | Med/High | 24h 내 1.0.1 hotfix 트리거 (release-monitor) |
| T3 | marketplace cache 미무효화 | Low/Low | 자연 TTL 만료. 능동 조치 불필요 |
| T4 | agent-teams dogfood 중 SendMessage 라우팅 오류 | Med/Med | `enabled=false` 1줄 fallback (AC7) |
| T5 | git tag 잘못 push | Low/Med | tag -d + rollback (release-pipeline §3) |

## 8. 관찰 (Out-of-scope 후속)

- v2 합성문 9→5 섹션 압축 = AC5 결과에 조건부. plan 단계 결정 X.
- agent-teams SC-06 wall-clock benchmark — 외부 측정 환경 필요.
- README.md top-level 부재 — Do phase 초입 재확인.
- CPO/CBO 산출물 — 내부 도구 GA 정책상 제외.

## 9. Do 작업 / Next Phase 매핑

| # | 작업 | 신규/수정 | 파일 | Owner sub-agent |
|---|------|----------|------|-----------------|
| 1 | CSO Gate A 실행 (secret + dependency + audit) | 신규 (artifact) | `docs/vais-1-0-0-release/03-do/security-audit.md` | security-auditor + secret-scanner + dependency-analyzer |
| 2 | 5 파일 version sync `0.68.0` → `1.0.0` | 수정 | package.json, vais.config.json, .claude-plugin/plugin.json, .claude-plugin/marketplace.json, CHANGELOG.md | infra-architect |
| 3 | status v3→v4 마이그레이션 실행 | 수정 (.vais/) | `.vais/status.json` (+ `.v3.bak` 자동) | infra-architect (bash) |
| 4 | narrative 재정렬 | 수정 | CLAUDE.md, ONBOARDING.md, .claude-plugin/marketplace.json description, .claude-plugin/plugin.json description, README.md (조건부) | infra-architect |
| 5 | CHANGELOG `[1.0.0]` 6 섹션 작성 | 수정 | CHANGELOG.md | release-notes-writer |
| 6 | _legacy 결정 박제 (보존) | 신규 | `docs/vais-1-0-0-release/03-do/implementation-log.md` | infra-architect |
| 7 | fallback 절차 박제 (3 트리거 + 회귀) | 신규 | implementation-log.md | infra-architect |
| 8 | CSO Gate B 실행 (plugin-validator) | 신규 (artifact) | `docs/vais-1-0-0-release/03-do/plugin-validation.md` | plugin-validator |
| 9 | git tag v1.0.0 annotated 생성 (push 보류) | 신규 (git) | `.git/refs/tags/v1.0.0` | release-notes-writer (bash) |
| 10 | 사용자 명시 승인 후 push origin v1.0.0 | 신규 | remote refs | release-notes-writer |
| 11 | post-release release-monitor 시작 | 신규 (artifact) | `docs/vais-1-0-0-release/05-report/release-monitor.md` | release-monitor |

> 본 11 작업이 다음 phase (design → do → qa → report) 작업 시퀀스. Do phase 진입은 CSO Gate A 통과 후.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-16 | 초기 작성 — 3 sub-agent 합성 (18 결정 + 18 AC + 5 T-위협) |

<!-- synthesis template version: v2.0 (model: 대화-합성, dogfood: vais-1-0-0-release) -->
