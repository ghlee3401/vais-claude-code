---
owner: cso
artifact: security-gate-plan
phase: plan
feature: agent-teams-sendmessage-real
generated: 2026-05-17
agent: security-auditor
summary: "CC SendMessage 통합 5 surface 보안 심사 — 3 Gate + T1~T3 위협 모델 + 5 AC (leak/위조/injection)"
---

# Security Gate Plan — agent-teams-sendmessage-real

> Phase: 📋 plan | Owner: CSO | Mode: simulation (chicken-and-egg) | Date: 2026-05-17
> 참조: [tech-plan.md](./tech-plan.md) §2 (5 surface) / [ideation main.md](../00-ideation/main.md) §2 (7차원 보안 medium)

## 1. Gate 체크리스트

| Gate | 도구 | 트리거 | 통과 조건 |
|------|------|--------|-----------|
| **Gate A** (보안) | security-auditor + secret-scanner + dependency-analyzer | Do phase 진입 전 | 신규 5 surface OWASP 해당 항목 N/A 또는 mitigation 박제 완료 / 하드코딩 시크릿 0 hit / 신규 CVE 0 |
| **Gate B** (플러그인) | plugin-validator | Do phase 완료 후 (marketplace 재배포는 vais-1-0-0-release 별도 피처) | `vais-validate-plugin.js` 0 err / ≤ 2 warn |
| **Gate C** (코드 리뷰) | code-reviewer | QA phase 직후 | 신규 5 surface bug pattern 0 / SendMessage 호출 경로 input validation 확인 / inter-agent whitelist 검증 |

> Gate A 는 CSO security-auditor 가 Do phase 진입 게이트 역할. Gate B/C 는 CTO QA 완료 후 CSO 재진입.

---

## 2. 보안 Surface 분석 (5 파일)

| # | 파일 | 변경 요지 | 보안 위험 | 위험도 |
|---|------|----------|-----------|--------|
| 1 | `lib/cc-version-detect.js` | `detectExperimentalAgentTeamsFlag()` — env 변수 + settings.json 읽기 | env 변수 오염 / path traversal (settings.json 경로 하드코딩 → user home) | **Low** — readonly, 외부 입력 처리 없음 |
| 2 | `skills/vais/utils/conversation-orchestrator.js` | SendMessage 호출 (real 모드) + event 객체 박제 | agent ID 검증 / 메시지 body 시크릿 포함 / messageHash 알고리즘 안전성 | **Medium** — 본 피처 핵심 위험 경로 |
| 3 | `hooks/session-start.js` | stderr 경고 출력 (env 변수 값 직접 미출력, 진단 메시지만) | log injection — 낮음 (진단 고정 문자열만 출력 설계) | **Low** |
| 4 | `ONBOARDING.md` | "Agent Teams 활성화" 섹션 — 가이드 문서 | 문서 — 보안 surface 없음 | **None** |
| 5 | `templates/decisions-log.template.md` | `mode` + `messageHash` 컬럼 추가 | 템플릿 — 보안 surface 없음 | **None** |

### Surface 2 심층: conversation-orchestrator.js

현재 구현(`dryRun` + `sendMessageFn` 외부 주입 패턴 기반)은 Do phase 에서 다음 변경이 추가된다.

- `simulationMode` 필드를 `checkAgentTeamsAllowed()` 로부터 수신 → 분기 결정
- real 모드: CC harness 의 SendMessage 도구 직접 호출 — **actor ID 검증 없음 시 T2 위험**
- event 객체에 `messageHash` 박제 — SHA-256 권장 (MD5/SHA-1 사용 시 충돌 위험)

mitigation 박제 위치: Do phase `implementation-log` + `work-rules.md` "SendMessage 메시지 보안 정책" 섹션

---

## 3. AC (CSO 관점)

| # | Acceptance Criteria | 검증 방법 |
|---|---------------------|-----------|
| AC-CSO-1 | 신규 5 surface 에서 하드코딩 시크릿 0 hit | `secret-scanner` — 기존 regex 패턴 재적용: `(password\|secret\|api_key\|token)\s*[:=]\s*["'][^"']{8,}` |
| AC-CSO-2 | 신규 의존성 추가 없음 (예상) 또는 추가 시 CVE 0 / SPDX 호환 | `dependency-analyzer` — `npm audit` + license check (현재 신규 의존성 없음) |
| AC-CSO-3 | `vais-validate-plugin.js` 0 err / ≤ 2 warn | Gate B 트리거 — `node scripts/vais-validate-plugin.js` |
| AC-CSO-4 | T1~T3 각 mitigation 이 코드 또는 문서에 박제됨 | Gate C 코드 리뷰 — 박제 위치별 grep 확인 (§4 위협 모델 참조) |
| AC-CSO-5 | `conversation-orchestrator.js` 신규 SendMessage 호출 경로에 actor whitelist 검증 존재 | `code-reviewer` — `parallelGroup` 화이트리스트 체크 로직 확인 |

---

## 4. 위협 모델 (T1~T3)

### T1 — inter-agent 메시지 leak

| 항목 | 내용 |
|------|------|
| 가능성 | **Low** — CC harness 가 agent 간 인증·격리 처리. vais-code 는 라이브러리 layer |
| 영향 | **Medium** — SendMessage body 에 민감 정보(예: 사용자 입력 그대로 relay, API 키 맥락) 포함 가능 |
| Mitigation 위치 | `conversation-orchestrator.js` — SendMessage 호출 직전 message body 를 secret-scanner 룰(regex) 로 grep. hit 시 throw + 경고 메시지 |
| 박제 문서 | `agents/_shared/work-rules.md` 에 "SendMessage 메시지에 시크릿 패턴 포함 금지" 규칙 추가 |

### T2 — agent ID 위조

| 항목 | 내용 |
|------|------|
| 가능성 | **Low** — CC harness 가 agent ID 신원 보장. vais-code 레벨 위조는 harness bypass 필요 |
| 영향 | **High** — 위조 성공 시 의사결정 라우팅 교란 (잘못된 synthesizer 가 합성문 작성) |
| Mitigation 위치 | `conversation-orchestrator.js` — SendMessage 수신 시 `actor` 필드를 `parallelGroup` C-Level 화이트리스트 + `main` 과 cross-check. 화이트리스트 외 actor → 이벤트 기록 후 무시 |
| 박제 문서 | `agents/_shared/work-rules.md` — "허용 actor: parallelGroup C-Level + main 만. 미인증 actor 메시지 무시 정책" |

### T3 — prompt injection 경유 sub-agent

| 항목 | 내용 |
|------|------|
| 가능성 | **Medium** — sub-agent 가 외부 파일 / 사용자 입력 처리 중 injection 발생 시 SendMessage 경로로 전파 가능 |
| 영향 | **High** — main 또는 다른 agent 에 악의적 지시 전달 → 파이프라인 전 단계 영향 가능 |
| Mitigation 위치 | 정책 강화: 0.68.0 `work-rules.md` v2.3 "sub→sub SendMessage 금지" + **main → sub 일방향 흐름** 명시. C-Level ↔ C-Level 허용, sub → 어디든 금지 |
| 박제 문서 | Gate C 코드 리뷰 체크리스트 — "cross-agent SendMessage grep": `grep -r "sendMessage\|SendMessage" lib/ skills/ hooks/` 결과에서 sub-agent 발신 경로 0 확인 |

### 위협 요약표

| ID | 위협 | 가능성 | 영향 | Risk Score | Mitigation |
|----|------|--------|------|-----------|------------|
| T1 | 메시지 leak | Low | Medium | Low | orchestrator body grep + work-rules 박제 |
| T2 | agent ID 위조 | Low | High | Medium | actor whitelist cross-check + work-rules 박제 |
| T3 | prompt injection 경유 | Medium | High | High | sub→any 금지 정책 강화 + Gate C grep 검증 |

> T3 = 본 피처 최우선 mitigation 대상 (Risk High).

---

## 5. Hand-off + 의존성

| 항목 | 내용 |
|------|------|
| **선행** | CTO `tech-plan.md` 5 surface 확정 — 완료 (박제됨) |
| **후행** | Gate A → CTO Do phase → Gate B → CTO QA → Gate C |
| **외부 의존** | 없음 — 모든 검증 도구 in-tree (`scripts/`, `agents/cso/`) |
| **CTO 협조** | T1 mitigation = `conversation-orchestrator.js` 내 시크릿 grep 추가 → Do phase `implementation-log` 반영 요청 |
| **CTO 협조** | T2 mitigation = actor whitelist 로직 → Do phase 구현 + Gate C 검증 |
| **CTO 협조** | T3 mitigation = `work-rules.md` v2.3 정책 신규 항목 추가 → Do phase 완료 전 박제 |

### 사전 grep 점검 결과 (2026-05-17 기준, 구현 전)

| 점검 항목 | 결과 |
|-----------|------|
| 하드코딩 시크릿 (5 surface 대상) | **0 hit** — `cc-version-detect.js`, `conversation-orchestrator.js`, `session-start.js` 모두 clean |
| 파괴적 명령 패턴 (`rm -rf`, `DROP TABLE`, `push --force`) | **0 hit** |
| `fs.writeFile.*settings.json` (자동 수정 금지) | **0 hit** — AC9 사전 충족 |
| `SendMessage` 발신 경로 현황 | `conversation-orchestrator.js` 1 경로만 — `dryRun=false` 조건부, `sendMessageFn` 외부 주입. Do phase 에서 real 모드 분기 추가 예정 |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-17 | 초기 작성 — 3 Gate + 5 surface 분석 + 5 AC + T1~T3 위협 모델 + 사전 grep 점검 |
