---
owner: ceo
artifact: ideation-decision
phase: ideation
feature: vais-1-0-0-release
generated: 2026-05-16
agent: ceo-direct
summary: "vais-code 0.68.0 → 1.0.0 GA. organization-in-a-box 정체성 정식 GA + legacy cleanup (status v3→v4, _legacy 정리, CHANGELOG narrative 재정렬) + 마켓플레이스 재배포 + git tag v1.0.0. 활성 = CEO+CTO+CSO+COO."
---

# vais-1-0-0-release — Ideation (CEO 결정)

> Phase: 💡 ideation | Owner: CEO | Date: 2026-05-16
> 출력: ideation-decision (PDCA 진입 결재 1장)

## 1. Executive Summary

| Perspective | Content |
|-------------|---------|
| **요청** | "vais-claude-code 1.0.0 GA. 코드 리뷰로 이전 버전 잔재 제거 + git tag + 마켓플레이스 릴리즈." |
| **현황** | 0.68.0 (agent-teams-orchestration GA, 커밋 `89141e3` 2026-05-16) 직후. 모든 in-flight 피처 완료. DEPRECATED/TODO 마커 = 0. 실측 legacy = `status.json v3`, `_legacy/v1/` archive, CHANGELOG 111 entries 누적, v0.x narrative. |
| **결정** | (a) **organization-in-a-box 정체성 GA** narrative (CLAUDE.md/ONBOARDING/README/marketplace description 일관화) (b) `scripts/migrate-status-v3-to-v4.js` 실행 → v4 (c) git tag `v1.0.0` + 마켓플레이스 재배포 (d) CSO Gate B 통과 필수. |
| **활성 C-Level** | CEO + CTO + CSO + COO. CPO/CBO 제외 (내부 도구 GA — `feedback_internal_feature_no_persona`). |

## 2. CEO 판단 근거 (algorithm + LLM 보강)

### 7 차원 등급 표 (analyzeCEO baseline)

| # | 차원 | 등급 | 사유 |
|---|------|------|------|
| 1 | 보안 | low | default 휴리스틱 (LLM 보강 → **medium** : 마켓플레이스 재배포 = CSO Gate B 필수) |
| 2 | 컴플라이언스 | none | default 휴리스틱 |
| 3 | UX | low | default 휴리스틱 |
| 4 | 데이터모델 | low | default 휴리스틱 |
| 5 | 외부통신 | low | default 휴리스틱 |
| 6 | 성능 | low | default 휴리스틱 |
| 7 | 제품정의 | medium | default 휴리스틱 (LLM 인용: 정체성 GA narrative 정렬은 product-definition 작업) |

### activeCLevel — algorithm 결과 vs LLM 보강

| Source | activeCLevel | 사유 |
|--------|--------------|------|
| Algorithm baseline | `ceo + cpo + cto` | productDefinition=medium → CPO PRD trigger |
| **LLM 보강 (채택)** | `ceo + cto + cso + coo` | (1) 내부 도구 GA = CPO 제외 (memory `feedback_internal_feature_no_persona`) (2) 마켓플레이스 재배포 = CSO Gate B 필수 (3) git tag + CHANGELOG 1.0.0 narrative = COO release-notes-writer 영역 |

> 보강 차이 1줄: **CPO 제외, CSO/COO 추가** — 내부 도구 GA 의 본질 (보안 게이트 + 릴리즈 노트) 이 CPO PRD 보다 중요.

## 3. 사용자 결정 기록 (4 클릭)

| # | 질문 | 선택 | 사유 |
|---|------|------|------|
| 1 | GA 목표 정의 | **전체 재정렬** (organization-in-a-box 정체성 GA) | narrative 일관화가 1.0.0 의 가장 큰 가치 |
| 2 | Legacy cleanup 범위 | **Full reset** (feature backlog 종결 포함) | 1.0.0 = 완전한 새 출발점 |
| 3 | agent-teams 처리 | (사실관계 확인) | 이미 0.68.0 = `89141e3` 에 완료. 메모리 stale 정정 완료 |
| 4 | 활성 C-Level | **CEO+CTO+CSO+COO** | 내부 도구 GA — CPO 축소, CSO/COO 추가 |

## 4. Artifacts (Phase 별 산출물 계획)

| Phase | Artifact | Owner | Agent | 비고 |
|-------|----------|-------|-------|------|
| 00-ideation | ideation-decision (본 문서) | CEO | ceo-direct | ✅ 완료 |
| 01-plan | release-plan | CTO | infra-architect | 1.0.0 scope + 작업 분해 + 의존성 |
| 01-plan | security-gate-plan | CSO | security-auditor | Gate A/B/C 체크리스트 |
| 02-design | release-pipeline | COO | release-notes-writer | CHANGELOG 1.0.0 + git tag + 마켓플레이스 재배포 절차 |
| 03-do | implementation-log | CTO | cto-direct | status v3→v4 마이그레이션 + 버전 동기화 5 파일 + narrative 재정렬 |
| 03-do | plugin-validation | CSO | plugin-validator | 마켓플레이스 재배포 전 Gate B |
| 03-do | secret-dependency-scan | CSO | secret-scanner + dependency-analyzer | 병렬 |
| 03-do | release-notes-v1 | COO | release-notes-writer | CHANGELOG 1.0.0 섹션 작성 |
| 04-qa | gap-analysis | CTO | qa-engineer | 1.0.0 AC 매트릭스 |
| 04-qa | code-review-independent | CSO | code-reviewer | Gate C |
| 05-report | completion-report | CTO | cto-direct | 합성문 |
| 05-report | release-monitor | COO | release-monitor | 배포 후 health check |

## 5. 메타 결정 — Dogfood + main.md 분량 정책

**6 번째 사용자 결정** (ideation 막바지 토론):

| 항목 | 결정 | 사유 |
|------|------|------|
| Agent Teams dogfood | **ON** (`agentTeams.enabled=true`) | 1.0.0 = organization-in-a-box GA narrative — 자기 GA 에 자기 신규 기능 활용 = self-consistent. 마켓플레이스 release notes 의 증거. |
| main.md 모델 | v2 합성문 + **lean 압축 검토** | 9 섹션 합성문이 lean 원칙과 충돌 우려. 추측 말고 plan 진행 중 실제 분량 실측 → AC 로 판정. |
| 비파괴 fallback | 명시 (plan AC) | agent-teams enabled=true 첫 실전 dogfood. 라우팅 버그 발생 시 sequential 회귀 1줄. |

**Plan AC 에 박제할 측정 기준**:
- AC: `docs/vais-1-0-0-release/01-plan/main.md` 분량 측정
- 판정: ≥ 200 줄 → v2 synthesis.template 9 → 5~6 섹션 압축 별도 작업 추가. < 150 줄 → 9 섹션 유지 + lean 충족 실증으로 정당화.
- Fallback: dogfood 중 SC-09 FSM 또는 SendMessage 라우팅 이상 시 `agentTeams.enabled=false` 토글 1줄로 즉시 회귀.

## 6. Next Phase

**추천**: `/vais cto plan vais-1-0-0-release` (agent-teams dogfood)

- CTO 가 mandatory PDCA 진입점.
- `agentTeams.enabled=true` 활성 후 CEO 알고리즘이 `parallelGroup=[cto,cso,coo]` + `synthesizer=cto` 산출 → 3 C-Level 대화-합성.
- main.md = 합성문 (templates/synthesis.template.md), `decisions-log.md` = SendMessage timeline.
- CBO 제외 (내부 도구), CPO 제외 (`feedback_internal_feature_no_persona`).

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-16 | 초기 작성 — 4 사용자 결정 + 7 차원 표 + 활성 C-Level 4개 (CEO+CTO+CSO+COO) + 12 artifact 계획 |
| v1.1 | 2026-05-16 | §5 추가 — 6 번째 결정 (dogfood ON + lean 압축 검토 + 비파괴 fallback). §6 으로 Next Phase 이동 |
