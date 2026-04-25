---
artifact: monitoring-config
owner_agent: sre-engineer
phase: how
canon_source: "Beyer et al. 'Site Reliability Engineering' (Google, 2016) Ch.6 'Monitoring' + 'SRE Workbook' (2018) Ch.5 'Alerting on SLOs' + OpenTelemetry Specification (opentelemetry.io) + Brendan Gregg 'Systems Performance' (2020)"
execution:
  policy: scope
  intent: observability
  prereq: [architecture-design]
  required_after: [alert-rules]
  trigger_events: []
  scope_conditions:
    - field: deployment.sla_required
      operator: ==
      value: true
template_depth: filled-sample-with-checklist
review_recommended: false
project_context_reason: "How 단계 — SLA 가 필요한 시스템의 observability 인프라. Metrics + Logs + Traces 3 pillars + SLO/SLI 정의."
---

# Monitoring Configuration

> **canon**: Google *SRE Book* (2016) Ch.6 — Four Golden Signals (Latency / Traffic / Errors / Saturation). *SRE Workbook* (2018) Ch.5 — Alerting on SLOs. OpenTelemetry Specification — vendor-neutral observability. Brendan Gregg *Systems Performance* (2020) — USE method.
>
> **목적**: production system 의 health 가시화 + SLO 기반 alerting. 3 pillars (Metrics / Logs / Traces) 표준화.

---

## 1. Three Pillars of Observability

| Pillar | 도구 (예) | 용도 |
|--------|----------|------|
| **Metrics** | Prometheus / Datadog / CloudWatch | 시계열 지표 (CPU / mem / req rate / latency) |
| **Logs** | Loki / ELK / CloudWatch Logs | 이벤트 기록 (debug / audit) |
| **Traces** | Jaeger / Tempo / X-Ray | request 흐름 추적 (distributed) |

→ 모든 3 pillar 가 **OpenTelemetry SDK** 로 instrumentation 권장 (vendor lock-in 회피).

## 2. Four Golden Signals (Google SRE Book)

> 모든 user-facing service 가 **반드시** 측정.

| Signal | 정의 | 측정 |
|--------|------|------|
| **Latency** | 요청 처리 시간 | P50 / P95 / P99 (성공/실패 분리) |
| **Traffic** | 시스템 부하 | requests/sec (HTTP) / queries/sec (DB) |
| **Errors** | 실패한 요청 비율 | 5xx % / 4xx % / 명시적 error |
| **Saturation** | 리소스 포화도 | CPU / memory / disk / queue depth (% of max) |

## 3. SLI / SLO / SLA

| 개념 | 정의 | 예시 |
|------|------|------|
| **SLI** (Indicator) | 측정 가능한 지표 | "P95 latency" |
| **SLO** (Objective) | 목표 임계 (내부) | "P95 latency < 200ms over 30d, 99.9%" |
| **SLA** (Agreement) | 외부 계약 (penalty) | "P95 < 300ms, 99% — 미달 시 credit" |

**SLO Burn Rate Alert** (Workbook Ch.5):
- 1h burn 14.4x = 즉시 page (1.5h 내 monthly budget 소진)
- 6h burn 6x = page (5d 내 소진)
- 3d burn 1x = ticket (정상)

## 4. USE Method (Brendan Gregg)

> 리소스 분석 — **U**tilization / **S**aturation / **E**rrors

| Resource | Utilization | Saturation | Errors |
|----------|------------|-----------|--------|
| CPU | %busy | runqueue length | hard errors |
| Memory | %used | swapping rate | OOM kills |
| Disk | %busy | queue depth | I/O errors |
| Network | %bandwidth | drops/queue | TX/RX errors |

## 5. OpenTelemetry Setup (예시)

```javascript
// instrumentation.js
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/traces',
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/metrics',
    }),
    exportIntervalMillis: 30000,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

## 6. Dashboard Spec (Grafana)

### Service Overview

| Panel | Query (PromQL) | Threshold |
|-------|---------------|-----------|
| Request Rate | `sum(rate(http_requests_total[5m]))` | (informational) |
| Error Rate | `sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))` | < 1% |
| P95 Latency | `histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))` | < 200ms |
| CPU | `avg(rate(process_cpu_seconds_total[5m])) by (instance)` | < 70% |

---

## (작성된 sample)

### VAIS Code Plugin (Monitoring N/A — local plugin)

본 프로젝트는 plugin (서버 X) → monitoring 인프라 직접 적용 X. 그러나 **유사 메트릭** (audit 결과 / test 결과 / template count) 을 dashboard 형태로 추적 가능.

### vais-dashboard.html (Sprint 14 후 권장)

| Panel | Source | Threshold |
|-------|--------|-----------|
| Test pass count | `npm test` JSON output | 263+ |
| Plugin validate errors | `vais-validate-plugin --json` | 0 |
| Sub-agent audit pass rate | `sub-agent-audit --json` summary.all_pass | 48/48 |
| Template count by phase | `catalog.json` by_phase | core 5+ / why 5+ / what 7+ / how 11+ / biz 5+ / alignment 3+ |
| Catalog total artifacts | `catalog.json` total_artifacts | 50+ |
| RA-3 measurement (template 작성 시간) | `sprint-N-progress.md` parse | (참고용) |

본 dashboard 는 **Beta-3 (외부 OSS) 진입 전** 작성 권장 (사용자 가시성).

---

## 작성 체크리스트

- [ ] Three Pillars (Metrics / Logs / Traces) 모두 instrumentation?
- [ ] **Four Golden Signals** (Latency / Traffic / Errors / Saturation) 모두 추적?
- [ ] **SLI / SLO** 명시 + monthly error budget 계산?
- [ ] **USE Method** 으로 리소스 (CPU / Memory / Disk / Network) 모니터링?
- [ ] **OpenTelemetry** SDK 사용 (vendor lock-in 회피)?
- [ ] Dashboard 가 **새 on-call 이 5 분 내 health 확인** 가능?
- [ ] **Burn Rate Alert** (1h/6h/3d) 구성?
- [ ] **alert rules** 별도 작성? (`alert-rules.md` 참조)

---

## ⚠ Anti-pattern (SRE Book 명시)

- **Vanity Metrics**: page view / signup count 만 모니터링 — actionable X. Golden Signals 가 우선.
- **Threshold Alerting (no SLO)**: "CPU > 80% 면 알림" — 비즈니스 영향 무관. **SLO burn rate alerting** 이 더 effective.
- **Alert Fatigue**: 모든 metric 에 alert — 신호 / 노이즈 비율 폭락. on-call 이 알림 무시. **deflectable / actionable** 만 alert.
- **Logs only**: traces / metrics 부재 → distributed system 의 cascading failure 추적 불가.
- **Dashboard 부재**: metric 만 수집 + 시각화 X — incident 대응 시 헤맴.
- **vendor lock-in**: Datadog/New Relic 전용 SDK — migration 비용 폭증. **OpenTelemetry** 표준.
- **Sample rate 100%**: 모든 trace 저장 — 비용 폭증. **head-based sampling** (10%) + tail-based on errors.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 12. SRE Book + SRE Workbook + OpenTelemetry + Brendan Gregg 정전. Three Pillars + Four Golden Signals + SLI/SLO/SLA + USE Method + OTel sample + Dashboard + sample (VAIS dashboard 권장) + checklist 8 + anti-pattern 7 |
