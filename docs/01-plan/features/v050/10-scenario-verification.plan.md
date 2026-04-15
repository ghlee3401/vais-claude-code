# Sub-plan 10 — Scenario Verification

> 상위: `../v050-full-overhaul.plan.md`
> 선행: 09
> 후행: 없음 (최종)

---

## 0. 목적

csuite-scenarios-v2.md에 정의된 **10+1 시나리오**가 v0.50 구현 위에서 정상 동작함을 **수동** 검증한다. 자동 테스트가 잡지 못하는 라우팅 판단, UX 흐름, 체크포인트 승인 경험을 확인.

필수 4개는 반드시: **S-1, S-2, S-9, S-0(ideation)**. 나머지는 샘플링 1~2회.

---

## 1. 시나리오 체크리스트 포맷

각 시나리오 검증 시 다음을 기록:

```markdown
### S-N: {name}
- [ ] 입력 명령: `...`
- [ ] CEO 라우터가 예상 C-Level 선택
- [ ] Phase 순서가 기대치와 일치
- [ ] 각 phase에서 예상 sub-agent 호출
- [ ] 체크포인트 AskUserQuestion 발동
- [ ] Gate 통과 (또는 의도된 실패 → retry)
- [ ] 최종 산출물 경로/내용 유효
- [ ] 이벤트 로그 (`.vais/observability/events.jsonl`) 기록
- [ ] 소요 시간/비용 기록
- [ ] 이슈/놀라움 기록
```

---

## 2. 시나리오 별 기대 흐름 (csuite-scenarios-v2.md §)

### 2.1 S-0 Ideation (필수)

- 입력: `/vais ceo ideation ai-voice-assistant`
- 기대 흐름:
  1. CEO ideation 모드 진입 (산출물 강제 없음)
  2. 5~10 turn 대화 (사용자가 아이디어 설명)
  3. 사용자 "정리해줘" 입력 → 종료 루틴
  4. `docs/00-ideation/ceo_ai-voice-assistant.md` 생성 (4 섹션)
  5. AskUserQuestion: "추천 경로: CBO(market) 또는 CPO(product). 어느 쪽?"
  6. 승인 → 자동 전환 → `/vais {선택} plan ai-voice-assistant`
- 검증: SC-8, SC-9, SC-11

### 2.2 S-1 신규 서비스 풀 개발 (필수)

- 입력: `/vais ceo plan new-saas-tool`
- 기대 흐름: CBO①(market) → CPO(PRD) → CTO(구현) → CSO(보안) → CBO②(GTM) → COO(배포) → CEO 최종
- 세부:
  - CBO①: market-researcher(TAM/PEST/Porter5) + financial-modeler(재무 시뮬)
  - CPO: prd-writer + backlog-manager
  - CTO: infra-architect → backend/frontend-engineer 병렬 → qa-engineer + test-engineer
  - CSO: security-auditor + secret-scanner + dependency-analyzer + code-reviewer (최대 3회 loop)
  - CBO②: seo-analyst + copy-writer + growth-analyst + marketing-analytics-analyst
  - COO: release-engineer (CI/CD) + sre-engineer (모니터링) + release-monitor (canary)
- Gate: 각 phase 종료 시 agent-stop 4-step 통과
- 검증: SC-21

### 2.3 S-2 기존 서비스 기능 추가 (필수)

- 입력: `/vais cpo plan kakaopay-checkout` (CEO 생략 가능 — 단순 추가)
- 기대 흐름: CPO → CTO → CSO(PCI-DSS) → COO(canary 5% → 100%) → CEO 최종
- 이슈 체크: secret-scanner가 Kakaopay API 키 탐지하는지

### 2.4 S-3 버그/UX/리팩터 (선택)

- Branch A (버그): `/vais cto do token-expiration-bug`
  - incident-responder 발동 → CSO 코드 리뷰 → CEO
- Branch B (UX): `/vais cpo design login-redesign`
  - ux-researcher → CTO → CSO → CEO
- Branch C (리팩터): `/vais cto design legacy-auth-refactor`
  - infra-architect → CSO → CEO

### 2.5 S-4 프로덕션 장애 (선택)

- 입력: `/vais cto do prod-outage-2026-04-15`
- 흐름: CTO(incident-responder RCA) → CSO(if 코드) → COO(hot deploy) → CEO 포스트모템
- 특이: hot deploy는 canary skip
- SLA 체크: RCA 2h, fix 4h, 포스트모템 24h

### 2.6 S-5 최적화 (선택)

- Branch A (perf): `/vais cto design api-latency-fix`
  - performance-engineer → CSO → COO
- Branch B (cost): `/vais cbo plan aws-cost-reduction`
  - finops-analyst → (CTO if arch change) → CEO

### 2.7 S-6 보안 감사 (선택)

- 입력: `/vais cso plan quarterly-audit-2026q2`
- 흐름: CSO 전수 감사 (security-auditor + code-reviewer + secret-scanner + dependency-analyzer + compliance-auditor)
- Critical finding → CTO iteration (max 3) → CEO

### 2.8 S-7 마케팅 GTM (선택)

- 입력: `/vais cbo plan product-launch-gtm`
- 흐름: CPO (옵션) → CBO (marketing-analytics/seo/copy/growth) → CTO (CWV 수정, 조건부) → CEO
- 검증: SEO ≥80, CWV (LCP<2.5s, FID<100ms, CLS<0.1)

### 2.9 S-8 사업 분석 (선택)

- Branch A (시장): `/vais cbo plan market-expansion-kr`
  - market-researcher → CEO
- Branch B (BM): `/vais cbo design bm-pivot-to-b2b`
  - financial-modeler + pricing-analyst + CPO(product-strategist) → CEO
- Branch C (IR): `/vais cbo report series-a-deck`
  - financial-modeler + unit-economics-analyst + market-researcher → CEO

### 2.10 S-9 vais-code 내부 강화 (필수)

- 입력: `/vais ceo plan add-agent-for-linting`
- 흐름: CEO (skill-creator) → CSO (code review) → CEO 최종 (mapping 업데이트)
- 변형: "absorb external skill" → absorb-analyzer → skill-creator → CSO
- 검증: 새 agent `.md` 생성 + AgentRegistry 인식

### 2.11 S-10 정기 운영 (선택)

- Branch A (tech debt): `/vais cto plan q2-tech-debt`
  - architect → CSO → CEO
- Branch B (team process): `/vais coo plan sprint-process-update`
  - COO 분석 + 문서화 → CEO

---

## 3. C-Level 참여 매트릭스 (csuite-scenarios-v2.md)

| Scenario | CEO | CPO | CTO | CSO | CBO | COO |
|----------|:---:|:---:|:---:|:---:|:---:|:---:|
| S-1 Full Dev | ◉ | ◉ | ◉ | ◉ | ◉② | ◉ |
| S-2 Feature Add | ◉ | ◉ | ◉ | ◉ | — | ◉ |
| S-3 Fix/Improve | ◉ | △ | ◉ | ◉ | — | — |
| S-4 Incident | ◉ | — | ◉ | ◉ | — | ◉ |
| S-5 Optimize | ◉ | — | ◉ | ◉ | △ | — |
| S-6 Security Audit | ◉ | — | △ | ◉ | — | — |
| S-7 Marketing GTM | ◉ | ◉ | △ | △ | ◉ | — |
| S-8 Business Analysis | ◉ | △ | — | — | ◉ | — |
| S-9 Internal Enhance | ◉ | — | — | ◉ | — | — |
| S-10 Operations | ◉ | — | △ | △ | — | △ |

범례: ◉ full PDCA / △ 조건부 / ② 두 번 참여 / — 미참여

실제 라우팅이 이 매트릭스와 일치하는지 각 시나리오 검증 시 체크.

---

## 4. 진입 시 신경 쓸 점

### 4.1 선행에서 보장됨
- 09 완료: 문서 4종 + 테스트 6+종 통과
- 전체 플러그인이 v0.50 상태

### 4.2 실행 팁
- **실제 LLM 호출 비용**: 각 시나리오 S-1 풀 실행은 10~30분 + 수달러. 필수 4개만 풀 실행, 나머지는 "CEO 라우터가 첫 C-Level 올바르게 선택"까지만 smoke check.
- **`npm test`로 대체 불가**: 테스트는 mock 기반이라 실제 LLM 판단 검증 안 됨. 이 sub-plan은 **사람이 직접** 실행.
- **advisor 이벤트 샘플링**: 시나리오 중 `.vais/advisor-spend.json` 증가 확인 → advisor 실제 동작 검증 (SC-19).
- **gate 실패 유도**: 의도적으로 plan 파일 1개 비워두고 실행 → retry_phase 가이드 정상 출력 확인.

### 4.3 함정
- **자동화 레벨**: L2(default)에서 검증. L3/L4는 별도 세션.
- **기존 `.vais/` 상태 간섭**: 시나리오마다 `feature` 이름을 고유하게 — 기존 상태와 충돌 시 예상과 다르게 동작.
- **CEO 라우터 매핑이 확률적**: LLM이 시나리오 키워드를 다르게 해석하면 매트릭스와 어긋날 수 있음. 이 경우 "사용자 승인 화면에서 수정 가능" 경로가 살아 있는지 확인.
- **비용 상한**: 시나리오 전체 풀 실행 시 advisor 호출 많이 발생 → 월 예산 초과 주의. 테스트 환경에서는 `advisor.monthly_budget_usd`를 낮게 설정.

---

## 5. 검증 산출물

시나리오 검증 리포트를 `docs/05-qa/scenarios-v050.md`에 작성:

```markdown
# v0.50 Scenario Verification Report

Date: 2026-04-16
Tester: {이름}
Environment: local / dev / staging

## Summary
- Total scenarios: 11
- Passed: N
- Failed: M
- Skipped (sampled): K

## Details
(시나리오별 체크리스트 결과)

## Issues Found
(발견된 이슈, GitHub issue 링크)

## Recommendations
(v0.50.1 후속 조치 제안)
```

---

## 6. 검증

- [ ] S-0, S-1, S-2, S-9 수동 walkthrough 체크리스트 완전 기록
- [ ] 시나리오별 C-Level 참여 매트릭스 100% 일치
- [ ] 이벤트 로그에 시나리오별 gate_judgment / phase_transition_auto 기록
- [ ] `.vais/advisor-spend.json`에 advisor 호출 흔적 존재
- [ ] `docs/05-qa/scenarios-v050.md` 리포트 생성

연결 SC: **SC-6, SC-21**

---

## 7. 다음 단계

- v0.50 배포 준비 완료
- 후속 이슈 트래킹: `docs/05-qa/scenarios-v050.md`의 Issues Found 섹션 → GitHub issue 전환
- v0.50.1 hotfix 대상 식별 (만약 critical issue 발견)
