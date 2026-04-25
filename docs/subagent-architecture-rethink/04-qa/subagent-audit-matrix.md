---
owner: cto
topic: subagent-audit-matrix
phase: qa
feature: subagent-architecture-rethink
---

# Topic: 48 Sub-agent Audit Matrix (F4 SC-09)

> Sprint 8 — `scripts/sub-agent-audit.js` 자동 평가 결과 + 잔여 보강 권고. 4 기준 (Q-A/B/C/D) 평가.

## 1. Audit 기준 (Q-A/B/C/D)

| 기준 | 평가 | 의미 |
|:----:|------|------|
| **Q-A** | `canon_source` frontmatter 명시 | 정전 출처 (저자·제목·연도·출판사) 가 검증 가능한 형식으로 기록 |
| **Q-B** | `execution.policy` enum 명시 | 4 정책 (always / scope / user-select / triggered) 중 하나로 분류 |
| **Q-C** | scope/triggered 의 경우 조건 정의 | scope 면 `scope_conditions`, triggered 면 `trigger_events` 비어있지 않음 |
| **Q-D** | `artifacts` ↔ catalog `owner_agent` 1:1 매칭 | sub-agent 선언과 catalog.json 가 정합 |

## 2. 종합 결과 (실행: 2026-04-26)

| 기준 | 통과 / 총합 | 비율 |
|:----:|:----------:|:----:|
| Q-A canon_source | **14/48** | 29% |
| Q-B execution.policy | **14/48** | 29% |
| Q-C scope/trigger conditions | **48/48** | 100% |
| Q-D artifacts ↔ catalog | **41/48** | 85% |
| **전 4 기준 통과** | **7/48** | **15%** |
| (deprecated 면제) | 1/48 | release-engineer |

## 3. C-Level 별 통과율

| C-Level | 통과 / 등록 | 통과 sub-agent |
|---------|:-----------:|---------------|
| **CEO** | **4/6** | vision-author / strategy-kernel-author / okr-author / pr-faq-author (Sprint 7 신규). 미통과: absorb-analyzer / skill-creator |
| **CPO** | **0/8** | 없음. 미통과: backlog-manager / data-analyst / prd-writer / product-discoverer / product-researcher / product-strategist (Q-D 부분) / roadmap-author (Q-D 부분) / ux-researcher |
| **CTO** | **0/8** | 없음. 미통과 8: backend-engineer / db-architect / frontend-engineer / incident-responder / infra-architect / qa-engineer / test-engineer / ui-designer |
| **CSO** | **0/7** | 없음. 미통과 7: code-reviewer / compliance-auditor / dependency-analyzer / plugin-validator / secret-scanner / security-auditor / skill-validator |
| **CBO** | **2/10** | customer-segmentation-analyst (Sprint 8 hotfix) / market-researcher (Sprint 8 hotfix). 미통과 8: copy-writer / financial-modeler / finops-analyst / growth-analyst / marketing-analytics-analyst / pricing-analyst / seo-analyst / unit-economics-analyst |
| **COO** | **1/9** | release-notes-writer (Q-D 미통과지만 What/How template 부재 — false positive). 진짜 통과는 0 + release-engineer (deprecated 면제). 미통과: ci-cd-configurator / container-config-author / migration-planner / runbook-author / performance-engineer / release-monitor / sre-engineer |

## 4. Q-D 미통과 7건 분류

### 4.1 What/How template 부재 (false positive — Sprint 11~14 작성 후 자동 해소)

| sub-agent | agent 선언 artifacts | 미존재 catalog ID |
|-----------|---------------------|------------------|
| ci-cd-configurator | `[ci-cd-pipeline, github-actions-workflow]` | (`templates/how/` 미작성) |
| container-config-author | `[dockerfile, docker-compose]` | (`templates/how/` 미작성) |
| migration-planner | `[migration-plan, rollback-script]` | (`templates/how/` 미작성) |
| release-notes-writer | `[release-notes, changelog-entry]` | (`templates/how/` 미작성) |
| runbook-author | `[runbook, incident-playbook]` | (`templates/how/` 미작성) |

→ 5 개 모두 Sprint 11~14 (How template 작성) 후 자동 통과. Sprint 8 시점에선 partial 정상.

### 4.2 부분 매칭 (Sprint 9 보강 권고)

| sub-agent | agent 선언 | catalog 매칭 | 분석 |
|-----------|-----------|-------------|------|
| product-strategist | `[value-proposition-canvas, lean-canvas, product-strategy-canvas]` | 1 (VPC 만) | Sprint 11~14 lean-canvas + product-strategy-canvas template 작성 후 통과 |
| roadmap-author | `[roadmap, 3-horizon]` | 1 (3-horizon 만) | Sprint 11~14 roadmap template 작성 후 통과 |

→ Sprint 11~14 What template 영역에서 자연 해소.

## 5. SC-09 (44/44 통과) 평가

**현재 상태**: 7/48 (14.6%) 전 4 기준 통과 — SC-09 임계 미충족.

**SC-09 충족 경로**:
1. **Q-A/Q-B 마이그레이션** — 잔여 33 sub-agent 의 frontmatter 에 canon_source + execution.policy 추가 (Sprint 9~10 권고)
2. **Q-D 자동 해소** — Sprint 11~14 잔여 25 templates (What/How/Biz/Alignment) 작성 후 7 sub-agent 통과
3. 이후 SC-09 = 41/48+ 예상 (단, 일부 sub-agent 가 catalog artifact 와 무관한 utility agent 인 경우 면제 분류 필요)

## 6. 즉시 실행 가능한 Sprint 9 권고 — Q-A/Q-B 일괄 마이그레이션

잔여 33 sub-agent 의 frontmatter 보강 작업 분해:

| C-Level | 잔여 | 우선순위 | 정전 출처 후보 |
|---------|:---:|:------:|---------------|
| CTO 8 | infra-architect / backend-engineer / frontend-engineer / ui-designer / db-architect / qa-engineer / test-engineer / incident-responder | 높음 | Fowler PoEAA / DDIA / Refactoring / SRE Book / TDD by Beck / etc. |
| CSO 7 | security-auditor / code-reviewer / secret-scanner / dependency-analyzer / plugin-validator / skill-validator / compliance-auditor | 높음 | OWASP Top 10 / CWE / NIST / GDPR / SLSA |
| CPO 6 | product-discoverer / product-researcher / prd-writer / backlog-manager / ux-researcher / data-analyst | 높음 | Torres OST / Cagan INSPIRED / JTBD Christensen / Krug |
| CBO 8 | copy-writer / financial-modeler / finops-analyst / growth-analyst / marketing-analytics-analyst / pricing-analyst / seo-analyst / unit-economics-analyst | 중간 | PAS/AIDA/BAB / 3-Statement / FinOps Foundation / Sean Ellis Growth Framework |
| COO 4 | sre-engineer / release-monitor / performance-engineer | 중간 | SRE Book / DORA Four Key Metrics / OpenTelemetry |
| CEO 2 | absorb-analyzer / skill-creator | 낮음 | (utility — canon 없을 수 있음, 면제 가능) |

**예상 Sprint 9~10 시간**: 33 sub-agent × ~1분/sub-agent = ~33분 (Q-A/Q-B 일괄 보강).

## 7. 자동화 가드 (회귀 보장)

본 audit 는 `scripts/sub-agent-audit.js` 로 영구 자동화:

```bash
node scripts/sub-agent-audit.js          # 사람 읽기
node scripts/sub-agent-audit.js --json   # CI 파이프라인용
node scripts/sub-agent-audit.js --verbose # 미통과 상세
```

Exit codes:
- `0`: 모든 sub-agent 4 기준 통과 (목표)
- `1`: Q-A/Q-B 누락 (필수 — 현재 1)
- `2`: Q-C/Q-D 미흡 (보강 권고)

→ Sprint 9 후 exit code 1 → 2 (Q-A/Q-B 통과 + Q-D 잔여) → Sprint 14 후 0 (목표).

## 8. 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 8 audit 매트릭스 (48 sub-agent / 7 통과 / 14.6% / Q-A 14, Q-B 14, Q-C 48, Q-D 41) + Sprint 8 4 hotfix (customer-segmentation-analyst / market-researcher / product-strategist / roadmap-author artifacts 보강) + Sprint 9~14 보강 로드맵 |
