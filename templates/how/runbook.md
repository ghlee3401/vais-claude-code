---
artifact: runbook
owner_agent: runbook-author
phase: how
canon_source: "Beyer, Jones, Petoff, Murphy 'Site Reliability Engineering' (Google, 2016), O'Reilly + 'The Site Reliability Workbook' (2018) Ch.3 'Risk' + Ch.9 'Implementing SLOs'"
execution:
  policy: scope
  intent: operational-runbook
  prereq: [architecture-design]
  required_after: []
  trigger_events: []
  scope_conditions:
    - field: deployment.sla_required
      operator: ==
      value: true
template_depth: filled-sample-with-checklist
review_recommended: false
project_context_reason: "How 단계 — 배포 절차 + 인시던트 대응 절차의 living document. SLA 가 필요한 시스템에서만 작성 (1인 OSS plugin skip)."
---

# Operational Runbook

> **canon**: Google *SRE Book* (2016) Ch.13~14 — Emergency Response + Postmortem. *SRE Workbook* (2018) Ch.9 — SLO Implementation. Allspaw "Web Operations" (2010).
>
> **목적**: 배포 절차 + 인시던트 대응 + on-call 핸드오프 의 단일 source. 새 on-call 이 5 분 내 행동 가능한 형식.

---

## 1. Service Identity

| 항목 | 내용 |
|------|------|
| **Service Name** | ______ |
| **Owner Team** | ______ |
| **Tier** | (Tier 1 = 사용자 영향 / Tier 2 = 내부) |
| **SLO** | (예: 99.9% availability / P95 latency 200ms) |
| **Dependencies** | (외부 API / DB / queue) |
| **Repo** | (URL) |
| **Dashboard** | (Grafana / Datadog / etc.) |

## 2. Deployment Procedure

### 2.1 Pre-deploy Checklist

- [ ] CI green (lint / test / build)
- [ ] Code review approved
- [ ] DB migration 검토 (있는 경우)
- [ ] Feature flag 결정
- [ ] Staging 검증 통과
- [ ] On-call 알림

### 2.2 Deploy Steps

1. Tag release: `git tag v1.x.y && git push --tags`
2. CI/CD 자동 trigger 또는 수동 trigger
3. Canary deploy (10% traffic)
4. Smoke test (5 분 모니터링)
5. Full rollout (gradual 25% → 50% → 100%)
6. **Post-deploy 5분 모니터링** (release-monitor 호출)

### 2.3 Rollback Trigger

- Error rate > 임계 (예: 1%)
- P95 latency 증가 > 50%
- 5xx response > baseline 200%
- 사용자 alert (support ticket spike)

### 2.4 Rollback Steps

1. Revert deploy: `kubectl rollout undo` 또는 marketplace re-publish 이전 버전
2. Incident 선언 (Sev 분류)
3. Postmortem 일정 (Sev 1~2 의 경우 24h 내)

## 3. Incident Severity Tree

| Sev | 정의 | SLA (응답) | Escalation |
|:---:|------|:--------:|-----------|
| **Sev 1** | 서비스 완전 다운 / 데이터 손실 | 15 분 | on-call → manager → CEO |
| **Sev 2** | 기능 일부 다운 / 큰 사용자 영향 | 1 시간 | on-call → manager |
| **Sev 3** | UX 영향 / workaround 가능 | 4 시간 | on-call |
| **Sev 4** | cosmetic / minor | 1 일 | next business day |

## 4. On-Call Handoff Checklist

- [ ] **현재 인시던트** (open Sev 1~2 — 진행 상황 + 다음 액션)
- [ ] **미해결 alert** (suppressed / acknowledged 상태)
- [ ] **24 시간 예정 배포** (impact / window)
- [ ] **Known issues** (workaround 명시)
- [ ] **PagerDuty / Opsgenie** rotation 확인

## 5. Common Operations

### 재시작
```bash
kubectl rollout restart deployment/{service-name}
```

### Log 확인
```bash
kubectl logs -f deployment/{service-name} --since=1h
```

### Metrics 조회
- Dashboard: ______
- Query example: `rate(http_requests_total{status=~"5.."}[5m])`

---

## (작성된 sample)

### Service: VAIS Code Plugin v0.59

| 항목 | 내용 |
|------|------|
| **Service Name** | vais-code (Claude Code marketplace plugin) |
| **Owner** | 이근호 (1인) |
| **Tier** | Tier 2 (developer tooling — non-critical) |
| **SLO** | 마켓플레이스 install 성공률 99% / 명령어 응답 < 5분 |
| **Dependencies** | Anthropic Claude API + git + npm registry |
| **Repo** | https://github.com/ghlee3401/vais-claude-code |

### Deploy

#### Pre-deploy
- [ ] `npm test` 263 pass
- [ ] `vais-validate-plugin` 0 errors
- [ ] `template-validator templates/ --depth-check` all pass
- [ ] `sub-agent-audit` 전 4기준 pass
- [ ] CHANGELOG.md 갱신

#### Deploy Steps
1. version bump (`package.json` + `vais.config.json` + `plugin.json` + `marketplace.json` 동기화)
2. `git tag v0.x.y && git push --tags`
3. GitHub Release publish
4. Anthropic marketplace re-index (자동, ~24h)

#### Rollback
- 마켓플레이스: 사용자가 `--version` 옵션으로 이전 버전 install 가능
- Critical bug: GitHub release 노트 + CHANGELOG 에 known issue 표기
- Major regression: revert commit + 새 patch release

### Incident Severity (1인 운영)

| Sev | 예시 | 응답 |
|:---:|------|------|
| Sev 1 | 마켓플레이스 install 실패 100% | 즉시 (15분) |
| Sev 2 | 특정 sub-agent 호출 실패 | 1 일 |
| Sev 3 | docs/_tmp/ 자동 정리 안됨 | 다음 patch |
| Sev 4 | typo / cosmetic | 다음 release |

---

## 작성 체크리스트

- [ ] Service Identity 6 항목 (Name / Owner / Tier / SLO / Dependencies / Repo) 모두 작성?
- [ ] Pre-deploy Checklist + Deploy Steps + Rollback Trigger + Rollback Steps 4 단계 모두 명시?
- [ ] Incident Severity Tree (Sev 1~4) + 응답 SLA + Escalation path 명시?
- [ ] On-call Handoff Checklist 5 항목 작성?
- [ ] Common Operations (재시작 / log / metrics) 의 **실행 가능한 명령어** 포함?
- [ ] Dashboard / Monitoring tool 링크 명시?
- [ ] Post-deploy 모니터링 (5 분~) 절차 정의?
- [ ] **새 on-call 이 5 분 내 사용 가능** 한 형식인가?

---

## ⚠ Anti-pattern (Google SRE Book 명시)

- **이론적 runbook**: 실제 인시던트 경험 없이 작성 — 작동 X. **post-mortem 기반** 반복 갱신.
- **Rollback 절차 부재**: 배포 절차에 rollback 빠짐 — 장애 시 수동 대응 강제.
- **Escalation path 미명시**: 누구에게 알리는가? — 권한·responsibility 모호 시 SLA 초과.
- **SLA 단일**: 모든 인시던트 동일 응답 — Sev 1 과 Sev 4 구분 없음.
- **Stale runbook**: 1 회 작성 후 업데이트 X — 환경 변화 시 무용. **분기마다 review**.
- **Tribal knowledge**: 특정 인물만 아는 절차 — runbook 의 정의 위반. 모든 절차 명시화.
- **Command 부재**: "확인하라" / "조사하라" 만 적고 실행 가능 명령어 X — on-call 이 헤맴.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 12. Google SRE Book + SRE Workbook 정전. Service Identity + Deploy + Rollback + Incident Severity + Handoff + Common Ops + sample (VAIS Code v0.59) + checklist 8 + anti-pattern 7 |
