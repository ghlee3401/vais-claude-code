---
name: schedule-cbo
description: CBO 주기 finops 분석 (`/schedule`) 설정 가이드. `agentTeams.schedule.cboFinopsCron` 활성 시 매월 자동 — finops-analyst + marketing-analytics 비용 영향.
---

# `/vais schedule cbo`

CBO 도메인 주기 finops 분석을 Claude Code `/schedule` 로 등록. 산출물은 `docs/_scheduled/{date}-cbo-finops.md`.

## 실행 지침

### 1. 현재 설정 확인

`vais.config.json > orchestration.agentTeams.schedule.cboFinopsCron`:
- `null` → 비활성
- cron 표현 → 다음 실행 시각 추정

### 2. 등록 / 비활성화

AskUserQuestion:
- "월 1회 1일 새벽 4시 등록 (`0 4 1 * *`)"
- "월 1회 5일 새벽 4시 등록 (`0 4 5 * *`)"
- "비활성화 (`null`)"
- "다른 cron 표현 입력 (Other)"

선택에 따라 `vais.config.json` 의 `cboFinopsCron` 값 업데이트.

### 3. Claude Code `/schedule` 연동

```
/schedule add "VAIS CBO monthly finops" \
  --cron "0 4 1 * *" \
  --command "/vais cbo do agent-teams-orchestration"
```

### 4. 산출물

`docs/_scheduled/{date}-cbo-finops.md` 박제. frontmatter:

```yaml
---
owner: cbo
artifact: scheduled-cbo-finops
phase: scheduled
feature: _scheduled
generated: YYYY-MM-DD
synthesizer: cbo
model-version: v2
summary: "CBO 월간 finops — 클라우드 비용 + 마케팅 ROI + 비용 최적화 권고"
---
```

## 위임 sub-agent

1. `finops-analyst` — 클라우드 비용 분석 + waste detection
2. `marketing-analytics-analyst` — 채널 ROI / 어트리뷰션 비용
3. (선택) `unit-economics-analyst` — CAC/LTV 변동 추적

결과는 합성문 형식 (v2) 으로 박제.

## Notes

- finops 는 도메인이 명확히 CBO 전용이라 다른 C-Level review 빈도 낮음 — Lazy Consensus `participants: []` 가능 → CBO 단독 합성
- 트렌드 추적: 이전 `docs/_scheduled/` 산출물을 input context 로 활용해 MoM 변화 분석
