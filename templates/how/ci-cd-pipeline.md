---
artifact: ci-cd-pipeline
owner_agent: ci-cd-configurator
phase: how
canon_source: "Forsgren, Humble, Kim 'Accelerate' (2018), IT Revolution Press — DORA Four Key Metrics + Humble & Farley 'Continuous Delivery' (2010), Addison-Wesley + GitHub Actions Documentation (docs.github.com/actions)"
execution:
  policy: scope
  intent: ci-cd-automation
  prereq: [architecture-design]
  required_after: []
  trigger_events: []
  scope_conditions:
    - field: deployment.target
      operator: IN
      value: [cloud, hybrid]
    - field: users.target_scale
      operator: ">="
      value: pilot
template_depth: filled-sample-with-checklist
review_recommended: false
project_context_reason: "How 단계 — cloud/hybrid 배포 + scale ≥ pilot 일 때만. 1 인 OSS plugin / pre-PMF 는 skip (default-execute anti-pattern 회피)."
---

# CI/CD Pipeline

> **canon**: Forsgren et al. *Accelerate* (2018) — DORA Four Key Metrics (Deployment Frequency / Lead Time / Change Failure Rate / Time to Restore). Humble & Farley *Continuous Delivery* (2010) — deployment pipeline 표준. GitHub Actions Documentation.
>
> **목적**: 코드 변경 → 사용자 배포까지의 자동화. **DORA 4 metrics 측정 가능** 한 형식.

---

## 1. Pipeline Stages (Standard 4)

| Stage | 목적 | 시간 목표 | Gate |
|:-----:|------|:--------:|------|
| **Lint** | code style + static analysis | < 1 분 | block on error |
| **Test** | unit + integration + e2e | < 10 분 | block on fail |
| **Build** | compile + bundle + container | < 5 분 | artifact 생성 |
| **Deploy** | environment 별 (dev → staging → prod) | < 5 분 | manual approval (prod) |

## 2. Branch Strategy

| Branch | Trigger | 환경 |
|--------|---------|------|
| `feature/*` | PR open | (CI only — no deploy) |
| `main` | merge | dev (자동) → staging (자동) → prod (manual) |
| `hotfix/*` | PR open | (fast-track approval) |
| `release/*` | tag push | versioned release |

## 3. GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

permissions:
  contents: read
  pull-requests: write

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm test
      - run: npm run test:integration

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with: { name: dist, path: dist/ }
```

## 4. Deploy Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-dev:
    runs-on: ubuntu-latest
    environment: dev
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE }}
          aws-region: ap-northeast-2
      - run: ./scripts/deploy.sh dev

  deploy-prod:
    runs-on: ubuntu-latest
    environment: prod  # GitHub Environment — manual approval
    needs: [deploy-dev]
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
      - run: ./scripts/deploy.sh prod
      - run: ./scripts/canary-monitor.sh  # 5분 모니터링
```

## 5. DORA Four Key Metrics

| Metric | 정의 | Elite | High | Medium | Low |
|--------|------|:-----:|:----:|:------:|:---:|
| **Deployment Frequency** | per service per ... | on-demand | 주 1+ | 월 1~주 1 | 월 1 미만 |
| **Lead Time for Changes** | commit → prod | < 1 일 | < 1 주 | 1주~1월 | 1+ 월 |
| **Change Failure Rate** | 변경 후 장애 % | 0~15% | 16~30% | 31~45% | 46+% |
| **Time to Restore** | 장애 → 복구 | < 1 시간 | < 1 일 | 1일~1주 | 1+ 주 |

→ pipeline 결과를 본 4 metric 으로 추적.

## 6. Secrets Management

| Layer | 도구 |
|-------|------|
| **Repo Secrets** | GitHub Actions Secrets (encrypted at rest) |
| **Environment Secrets** | GitHub Environments (per env approval) |
| **Runtime Secrets** | AWS Secrets Manager / GCP Secret Manager / HashiCorp Vault |
| **Code 내 secrets** | ❌ 절대 X — secret-scanner 가 차단 |

## 7. Rollback Triggers

자동 rollback 조건:
- error rate > 1% (canary window 5분)
- P95 latency 증가 > 50%
- 5xx response > baseline 200%
- healthcheck 실패 3 연속

---

## (작성된 sample)

### VAIS Code Plugin CI/CD (Sprint 1~3 시점 검증 확인)

본 프로젝트는 OSS plugin — `cloud/hybrid` deployment X → 본 sub-agent **scope skip** 됨. 그러나 **CI 부분** 은 GitHub Actions 사용.

### .github/workflows/test.yml (현재)

```yaml
name: Test

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: node scripts/vais-validate-plugin.js
      - run: node scripts/template-validator.js templates/ --depth-check
      - run: node scripts/sub-agent-audit.js
```

### Deploy (수동 — marketplace publish)

본 프로젝트는 Anthropic marketplace 자동 re-index — pipeline 의 deploy stage 가 pull-based (Anthropic 이 fetch). 우리 측 작업: tag push + GitHub Release publish.

### DORA Metrics (예상)

| Metric | 본 프로젝트 (1인 OSS) | 카테고리 |
|--------|:--------------------:|:--------:|
| Deployment Frequency | 주 1~2회 (sprint 단위) | High |
| Lead Time | < 1 일 (commit→tag) | Elite |
| Change Failure Rate | < 5% (회귀 테스트로 차단) | Elite |
| Time to Restore | < 1 일 (1인 운영) | High |

---

## 작성 체크리스트

- [ ] Pipeline 4 stage (Lint / Test / Build / Deploy) 모두 정의?
- [ ] Branch Strategy (feature / main / hotfix / release) 명시?
- [ ] **자동 trigger** vs **manual approval** 구분 (prod 는 manual)?
- [ ] **Secrets** 가 GitHub Actions Secrets / Vault 등으로 관리, code 내 X?
- [ ] **Rollback Trigger** 자동화 (error rate / latency / healthcheck)?
- [ ] DORA 4 Metrics 측정 가능?
- [ ] Pipeline 시간 목표 (Lint <1m / Test <10m / Build <5m / Deploy <5m) 설정?
- [ ] **scope_conditions 평가** 로 default-execute 회피 (1인 OSS skip)?

---

## ⚠ Anti-pattern (Forsgren + Humble & Farley 명시)

- **scope 무시 default-execute**: Profile 미평가 + 모든 프로젝트에 CI/CD 생성 — 본 sub-agent 가 정확히 해소하려는 anti-pattern. v0.50~0.58 release-engineer 사례.
- **deploy without rollback**: rollback 자동화 부재 — 장애 시 수동 강제.
- **prod 자동 deploy without approval**: GitHub Environment 의 manual approval 없이 main → prod — 의도치 않은 변경.
- **Pipeline > 30분**: Lead Time 폭증 — DORA Elite 카테고리 이탈. **stage 시간 제한 필수**.
- **Pinned 부재**: GitHub Actions `@latest` — supply chain 공격 노출. SHA pinning (`@v4` not `@v4.x.y` 또는 `@<sha>`).
- **Secrets in code**: `.env.example` 외 .env 가 git 에 push — secret-scanner 차단.
- **Test flakiness 무시**: 가끔 fail 하는 test 재시도만 — flaky test 자체 fix 우선.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 12. Forsgren DORA + Humble & Farley + GitHub Actions 정전. Pipeline 4 stage + Branch Strategy + GHA workflow + DORA Metrics + Secrets + Rollback + sample (VAIS Code 현재 CI 분석) + checklist 8 + anti-pattern 7 |
