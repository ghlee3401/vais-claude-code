---
owner: cto
artifact: main
phase: design
feature: agent-teams-sendmessage-real
generated: 2026-05-17
agent: infra-architect
summary: "Design phase 인덱스 — flag-detection 시그니처 + 분기 알고리즘 + T1~T3 mitigation 박제 위치 + onboarding 초안 설계"
---

# agent-teams-sendmessage-real — Design (인덱스, v1)

> Phase: 🎨 design | Owner: CTO | Mode: simulation (chicken-and-egg) | Date: 2026-05-17
> Model: v1 인덱스 (5 섹션, 본문 X) — `agentTeams.enabled=false` 정합

## 1. Executive Summary

| Perspective | Content |
|-------------|---------|
| **입력** | tech-plan §2 5 surface + security-gate-plan §4 T1~T3 mitigation 요구사항 |
| **설계 범위** | 2 surface 설계 집중 — (A) flag-detection (cc-version-detect 확장 + orchestrator 분기 알고리즘) / (B) onboarding (ONBOARDING.md 섹션 초안 + CLAUDE.md Rule #21) |
| **보안 통합** | T1/T2/T3 mitigation 을 flag-detection-design 의사코드에 직접 박제. T3 최우선 — sub→any SendMessage 차단 정책 알고리즘 레벨에서 명시 |
| **산출물** | 2 sub-doc (flag-detection-design.md, onboarding-doc-design.md) + decisions-log template 헤더 diff |
| **Do phase 목표** | 본 설계 문서를 따라 단순 구현만 하면 AC1~AC9 충족 가능한 수준의 세부 의사코드 제공 |

## 2. Decision Record (multi-owner, append-only)

| # | Decision | Owner | Rationale | Source |
|---|----------|:-----:|-----------|--------|
| D-12 | `detectExperimentalAgentTeamsFlag()` 를 별도 export 함수로 추가 (기존 함수 inline 수정 X) | cto | 단일 책임 + 기존 시그니처 non-breaking | flag-detection-design §2-A |
| D-13 | `checkAgentTeamsAllowed()` 반환에 `simulationMode: boolean` 추가 — version OK + enabled OK + flag missing → `allowed:true, simulationMode:true` | cto | plan Decision #3 구체화 — byte-compat graceful degradation | flag-detection-design §2-A |
| D-14 | 별도 `_flagCached` 캐시 변수 사용 (기존 `_cached` 와 분리) | cto | env 변수는 runtime 변경 가능 → session 내 1회만 체크하되 버전 캐시와 독립 | flag-detection-design §2-A |
| D-15 | T3 mitigation — orchestrator 진입 시 caller context 가 sub-agent 인 경우 SendMessage 호출 차단 (throw + log) | cso | T3 Risk High, 최우선 mitigation. plan Decision #10 구체화 | flag-detection-design §2-B |
| D-16 | T2 mitigation — actor 화이트리스트를 `parallelGroup` 배열 + `['main', synthesizer]` 의 합집합으로 런타임 구성 | cso | 하드코딩 배열 피함. 호출 시점에 parallelGroup 으로부터 동적 생성 | flag-detection-design §2-B |
| D-17 | T1 mitigation — 시크릿 grep regex 4 패턴 (password/secret/api_key/token) 을 orchestrator 내부 `_scanSecrets()` 헬퍼로 구현 | cso | security-gate-plan §4 T1 요구사항 직접 이행 | flag-detection-design §2-B |
| D-18 | decisions-log template 에 `mode` + `messageHash` 컬럼 추가 — 기존 행 backward-compat (빈 컬럼 허용) | cto | tech-plan §2-E 구체화. simulated 행은 `—` 표기 | flag-detection-design §2-E |
| D-19 | ONBOARDING.md 신규 H2 섹션 위치 = "Getting Started" 바로 다음 (anchor 기준) | cto | 발견 가능성 최대화 — 진입 직후 optional 섹션 | onboarding-doc-design §1 |
| D-20 | CLAUDE.md Rule 번호 = #21 (기존 #20 다음 sequential) | cto | 규칙 번호 충돌 방지. v0.69 releasenote 에서 동기화 | onboarding-doc-design §2 |

## 3. Artifacts

| Artifact | Owner | 한 줄 요약 | 파일 |
|----------|:-----:|-----------|------|
| ideation-decision | ceo | Research 결과 + 3 사용자 결정 + 5 surface | `../00-ideation/main.md` |
| tech-plan | cto | 5 surface 작업 분해 + 9 AC | `../01-plan/tech-plan.md` |
| security-gate-plan | cso | T1~T3 위협 모델 + 3 Gate + 5 AC | `../01-plan/security-gate-plan.md` |
| flag-detection-design | cto | cc-version-detect 확장 시그니처 + orchestrator 분기 알고리즘 + T1~T3 mitigation 의사코드 | `./flag-detection-design.md` |
| onboarding-doc-design | cto | ONBOARDING.md 섹션 초안 + CLAUDE.md Rule #21 — Do phase 복붙용 | `./onboarding-doc-design.md` |

## 4. CEO 판단 근거

algorithm baseline `[ceo, cpo, cto]` → LLM 보강 채택 `[ceo, cto, cso]`:

- **CSO 추가**: 보안 medium (T1/T2/T3). Design phase 에서 T1~T3 mitigation 알고리즘 직접 박제 완료.
- **CPO 제외**: 내부 인프라 (`feedback_internal_feature_no_persona` 정합).
- conversationMode = disabled (chicken-and-egg 유지).

Design 결정 D-12~D-20 은 plan Decision #1~#11 의 구체화이며 새로운 방향 전환 없음.

## 5. Next Phase

**추천**: `/vais cto do agent-teams-sendmessage-real`

- CTO do 에서 5 surface 구현: D-12~D-17 의 의사코드를 실제 JS 코드로 변환.
- CSO Gate A 진입 전 `security-auditor` + `secret-scanner` 실행 (Do 완료 후).
- onboarding-doc-design 의 텍스트를 ONBOARDING.md + CLAUDE.md 에 그대로 Write.

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-17 | 초기 작성 — D-12~D-20 + 2 sub-artifact 박제 완료 |
