---
artifact: alignment-what-how
owner_agent: infra-architect
phase: alignment
canon_source: "Cagan 'Inspired' Ch.13~16 — Engineering Spec + 'Empowered' product engineering alignment + Fowler 'Patterns of Enterprise Application Architecture' (2003) + Forsgren DORA"
execution:
  policy: always
  intent: alignment-what-how
  prereq: [prd, roadmap, architecture-design, api-implementation, db-schema]
  required_after: []
  trigger_events: []
  scope_conditions: []
template_depth: filled-sample-with-checklist
review_recommended: true
project_context_reason: "Alignment 단계 — What (PRD/Roadmap) ↔ How (Architecture/Implementation/Test/Operations) 정합성 매트릭스. 구현이 PRD 에 정확히 대응하는지 + 비기능 요구사항 (NFR) 충족하는지 검증."
---

# Alignment: What ↔ How

> **canon**: Cagan *Inspired* Ch.13~16 — engineering spec + outcome → implementation. *Empowered* — engineering team alignment with product strategy. Fowler PoEAA — architecture patterns. Forsgren DORA — delivery metrics.
>
> **목적**: What 산출물 (PRD / Roadmap) 이 How 산출물 (Architecture / API / DB / Test / Operations) 에 **빠짐없이 구현** 되었는가 검증.

---

## 1. Alignment Matrix

| What 산출물 | How 산출물 | 정합 점검 |
|------------|-----------|----------|
| PRD §4 Solution | architecture-design (Component) | Solution 의 핵심 메커니즘이 Architecture 컴포넌트로? |
| PRD §5 Must (F1~Fn) | api-implementation (endpoint) + db-schema (table) | 모든 Must 가 API + DB 에 매핑? |
| PRD §6 UX (Wireframe) | ui-implementation (component-library) | UX 가 component 로 구현? |
| PRD §7 Success Metric | monitoring-config (metric) | Metric 이 운영 모니터링 자동 측정? |
| PRD §8 Risks | runbook (rollback / incident playbook) | Risk 별 대응 절차 준비? |
| Roadmap Now Initiative | unit-test + integration-test coverage | Initiative 의 모든 feature 가 test cover? |
| Roadmap Next | architecture-design (확장성 / dependency) | Next 진입 시 변경 비용 평가? |
| OKR KR (측정) | monitoring-config + analytics | KR 자동 측정 가능? |
| Hypothesis 8 risk | security-audit-report + dependency-analyzer | Security/Regulatory risk 가 audit 에 반영? |

## 2. NFR (Non-Functional Requirements) 매트릭스

| NFR | PRD 명시 | How 구현 | 검증 |
|-----|:------:|----------|:----:|
| **Performance** (P95 latency) | ☐ | monitoring-config + load-test | ☐ |
| **Scalability** (concurrent users) | ☐ | architecture-design + DB index | ☐ |
| **Availability** (SLO) | ☐ | runbook + alert rules | ☐ |
| **Security** (OWASP) | ☐ | security-audit-report | ☐ |
| **Privacy** (GDPR / data residency) | ☐ | compliance-report | ☐ |
| **Maintainability** (code review) | ☐ | code-review-report | ☐ |
| **Observability** (3 pillars) | ☐ | monitoring-config | ☐ |
| **Reliability** (DORA) | ☐ | ci-cd-pipeline (DORA metrics) | ☐ |

## 3. Coherence Test (10 항목)

| # | 검증 질문 | Pass / Fail |
|:-:|---------|:---:|
| 1 | PRD §5 Must 모두 architecture 컴포넌트 매핑? | ☐ |
| 2 | PRD §5 Must 모두 unit test cover (80%+ statement)? | ☐ |
| 3 | PRD §7 Success Metric 모두 monitoring-config 측정? | ☐ |
| 4 | PRD §8 Risks 모두 runbook 의 rollback 또는 incident playbook 준비? | ☐ |
| 5 | Roadmap Now 의 모든 Initiative 가 architecture 변경 가능? | ☐ |
| 6 | NFR 8 항목 (Performance / Scalability / etc) 모두 구현 + 검증? | ☐ |
| 7 | Hypothesis Security/Regulatory risk 가 security-audit + compliance 에 반영? | ☐ |
| 8 | DORA 4 metrics (Deployment Frequency / Lead Time / Change Failure / Time to Restore) 측정? | ☐ |
| 9 | code review 통과 (CSO Gate C — code-review-report)? | ☐ |
| 10 | post-deploy monitoring 5분+ (release-monitor) 통과? | ☐ |

## 4. Implementation Coverage

| Coverage 종류 | 임계 | 현재 |
|--------------|:----:|:---:|
| **Statement coverage** | 80%+ | (Sprint 1~3: 263 pass) |
| **Branch coverage** | 70%+ | ... |
| **Integration test (T-XX)** | (PRD critical path) | T-01~T-07 통과 |
| **NFR test (load / chaos)** | (Tier 1 service) | (Sprint 14 권장) |

---

## (작성된 sample)

### VAIS Code Plugin What ↔ How Alignment (Sprint 1~14 GA)

| What | How | 정합 |
|------|-----|:---:|
| PRD §4 Solution (Profile + Catalog + clevel-coexistence) | architecture-design (Mermaid: Skill→CLevel→SubAgent→Profile→Catalog→Hooks) | ✅ |
| PRD §5 Must F1 (Profile schema) | api-implementation (Hook PostToolUse — ideation-guard) + lib/project-profile.js | ✅ |
| PRD §5 Must F2 (Template metadata) | scripts/template-validator.js + scripts/build-catalog.js | ✅ |
| PRD §5 Must F3 (50+ catalog) | templates/{core/why/what/how/biz/alignment}/*.md (34 templates by Sprint 13) | ✅ (catalog 34) |
| PRD §5 Must F4 (44 sub-agent audit) | scripts/sub-agent-audit.js + 매트릭스 | ✅ |
| PRD §5 Must F5 (release 5분해) | agents/coo/{release-notes-writer / ci-cd-configurator / etc} × 5 + deprecate alias | ✅ |
| PRD §5 Must F6 (CEO 4 + CPO 1 신규) | agents/ceo/{vision-author / strategy-kernel-author / okr-author / pr-faq-author}.md + agents/cpo/roadmap-author.md | ✅ |
| PRD §5 Must F7 (Alignment α + β) | templates/alignment/*.md × 3 + lib/auto-judge.js (β — Sprint 14 권장 구현) | ⚠ partial — α 자동 검증 lib 미구현 |
| PRD §5 Must F8 (VPC 재매핑) | copy-writer (CBO) → product-strategist (CPO) ownership 이관 | ✅ |
| PRD §7 Success Metric KR1~KR5 | sub-agent-audit + template-validator (자동) + 외부 인터뷰 (Sprint 14 manual) | ✅ 4/5 자동 / 1 manual |
| PRD §8 Risks R1~R7 | feature flag / deprecate alias / atomicWriteSync / FAILSAFE_SCHEMA | ✅ |

### NFR 검증

| NFR | PRD 명시 | How 구현 | 검증 |
|-----|:------:|----------|:----:|
| Performance | profile gate <50ms | (Sprint 4~6 측정 권장 — 미실측) | ⏳ |
| Security | secret 차단 + path traversal | T-04 + T-06 통합 테스트 | ✅ |
| Availability | (N/A — local plugin) | — | N/A |
| Maintainability | code review | (Sprint 13 sample 본 매트릭스) | ✅ |
| Observability | (N/A — local plugin) | — | N/A |

→ **10/11 aligned + 1 partial** (alignment α 자동 검증 lib 미구현). Sprint 14 후속 작업.

---

## 작성 체크리스트

- [ ] Alignment Matrix 9+ cell 모두 평가?
- [ ] **NFR 8 항목** 모두 PRD 명시 + How 구현 + 검증?
- [ ] **Coherence Test 10 항목** 모두 Pass / Fail?
- [ ] **75% 임계 (7+/10 cell aligned)** 충족?
- [ ] **Implementation Coverage** 80% statement / 70% branch?
- [ ] DORA 4 metrics 측정 가능?
- [ ] CSO Gate C (code-review-report) 통과?

---

## ⚠ Anti-pattern

- **Implementation gap**: PRD Must 가 모두 implementation 매핑되지 않음 — feature 누락.
- **NFR 무시**: PRD 에 functional 만 명시 + Performance / Security / Availability 부재 — production 에서 발견.
- **Test coverage 부재**: PRD critical path 가 test cover X — regression 위험.
- **Monitoring 부재**: PRD Success Metric 이 자동 측정 X — 사후 manual 측정 (oversight 위험).
- **DORA 무시**: 배포 빈도 / Lead Time 측정 X — engineering effectiveness 평가 불가.
- **Hypothesis Security/Regulatory 무반영**: 8 risk 중 일부만 audit 통과 — 사업 확장 시 비용 폭증.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 14. Cagan Inspired + Empowered + Fowler + Forsgren DORA 정전. Alignment Matrix 11 + NFR 8 + Coherence Test 10 + Coverage + sample (VAIS Sprint 1~13 — 10/11 aligned + 1 partial) + checklist 7 + anti-pattern 6 |
