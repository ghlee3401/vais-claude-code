---
name: schedule-cso
description: CSO 주기 보안 감사 (`/schedule`) 설정 가이드. `agentTeams.schedule.csoAuditCron` 활성 시 매주 자동 실행 — dependency-analyzer + secret-scanner.
---

# `/vais schedule cso`

CSO 도메인 주기 보안 감사를 Claude Code `/schedule` 로 등록한다. 산출물은 `docs/_scheduled/{date}-cso-audit.md`.

## 실행 지침

### 1. 현재 설정 확인

`vais.config.json > orchestration.agentTeams.schedule.csoAuditCron` 값 표시:
- `null` → 비활성 안내
- cron 표현 → 다음 실행 시각 추정 (`croniter` 미설치 시 표현만 표시)

### 2. 등록 / 비활성화

AskUserQuestion:
- "주 1회 월요일 새벽 3시 등록 (`0 3 * * 1`)"
- "월 1회 1일 새벽 3시 등록 (`0 3 1 * *`)"
- "비활성화 (`null`)"
- "다른 cron 표현 입력 (Other)"

선택에 따라 `vais.config.json` 의 `csoAuditCron` 값 업데이트 (Edit 도구).

### 3. Claude Code `/schedule` 연동

사용자에게 다음 명령 안내 (자연어 슬래시 — 직접 실행 도구는 호출자 PO 권한):

```
/schedule add "VAIS CSO weekly audit" \
  --cron "0 3 * * 1" \
  --command "/vais cso do agent-teams-orchestration"
```

> ⚠️ Anthropic 인프라에서 동작 — 머신 꺼져도 OK. 자세한 동작은 Claude Code `/schedule` 문서.

### 4. 산출물 경로 설정

`docs/_scheduled/` 폴더 사용. 각 실행 시 `{date}-cso-audit.md` 박제. frontmatter:

```yaml
---
owner: cso
artifact: scheduled-cso-audit
phase: scheduled
feature: _scheduled
generated: YYYY-MM-DD
synthesizer: cso
model-version: v2
summary: "CSO 주간 보안 감사 — dependency-analyzer + secret-scanner 결과"
---
```

## 위임 sub-agent

스케줄 작업이 트리거되면 CSO 가 다음 sub-agent 들을 위임 호출:
1. `dependency-analyzer` — CVE / license / supply chain
2. `secret-scanner` — 소스 내 시크릿 탐지

결과는 합성문 형식 (v2) 으로 `docs/_scheduled/{date}-cso-audit.md` 박제.

## Notes

- `agentTeams.enabled=false` 면 본 스케줄은 sequential 모드로도 실행 가능 (CSO 가 단독 합성)
- `agentTeams.enabled=true` 면 Conversation Orchestrator 가 다른 C-Level (예: CTO 가 supply chain 영향 의견 제공) 과 협업 가능
