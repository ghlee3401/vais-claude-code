# Runbook Template (COO)

runbook-author 가 작성하고, sre-engineer 가 alert/monitoring 관점에서 검토하거나 incident-runbook 으로 확장한다. 인시던트 발생 시 on-call 이 즉시 따라할 수 있는 절차서.

## 표준 구조

```markdown
# Runbook — {service-name}

## 1. 서비스 개요
- 책임: {what does it do}
- SLA: 가용성 99.9%, p99 < 3s
- on-call: {team/oncall rotation link}

## 2. 헬스체크
- Endpoint: GET /health
- 정상 응답: { status: "ok" }
- 대시보드: {grafana/datadog url}

## 3. 알림 → 대응 매핑
| Alert | Severity | First Action | Escalation |
|-------|----------|-------------|-----------|
| HighErrorRate | Critical | check logs → recent deploy | rollback if 5min unfixed |
| HighLatency | Warning | check DB queries | scale if sustained 30min |
| DiskFull | Critical | rotate logs / scale | escalate to infra team |

## 4. 일반 절차
- 재시작: `kubectl rollout restart deployment/{name}`
- 로그: `kubectl logs -l app={name} --tail=200`
- DB 접속: {bastion + connection string}

## 5. Rollback
- 트리거: 에러율 > 5% 또는 수동
- 절차: `/vais coo do {feature} --rollback` 또는 `kubectl rollout undo`
- DB 호환성: backward-compatible 검증

## 6. Postmortem 템플릿
- Timeline: when did each thing happen
- Root cause: 5 whys
- Impact: users affected, revenue lost
- Action items: 재발 방지 (P0/P1/P2)
```

## 작성 체크리스트

- [ ] 헬스체크 endpoint + 정상 응답 명시
- [ ] 모든 alert 에 first action 정의
- [ ] rollback 절차 단일 명령어로
- [ ] DB 호환성 검증 단계 포함
- [ ] postmortem 템플릿 포함

## artifact 박제

`docs/{feature}/03-do/runbook.md` (frontmatter: `owner: coo`, `agent: runbook-author`, `artifact: runbook`)

SRE 전용 인시던트 런북이 필요하면 별도 artifact 로 `docs/{feature}/03-do/incident-runbook.md` 를 작성한다.
