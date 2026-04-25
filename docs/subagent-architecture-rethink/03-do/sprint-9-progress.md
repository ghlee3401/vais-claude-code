---
owner: cto
topic: sprint-9-progress
phase: do
feature: subagent-architecture-rethink
---

# Topic: Sprint 9 진행 상황 (CTO Do — 34 sub-agent Q-A/Q-B 일괄 마이그레이션)

> Sprint 8 audit 결과 (Q-A 14/48 / Q-B 14/48) → 잔여 34 sub-agent frontmatter 마이그레이션. 각 sub-agent 에 canon_source + execution.policy + artifacts 일괄 추가.

## 1. 작업 결과

| C-Level | sub-agent | 정전 출처 (요약) |
|---------|-----------|------------------|
| **CPO 6** | product-discoverer / product-researcher / prd-writer / backlog-manager / ux-researcher / data-analyst | Torres (2021) / Cagan (2017) / Lenny PRD / Cohn Agile (2005) / Nielsen + Krug / Croll & Yoskovitz (2013) |
| **CTO 8** | infra-architect / backend-engineer / frontend-engineer / ui-designer / db-architect / qa-engineer / test-engineer / incident-responder | Fowler PoEAA (2003) / Kleppmann DDIA (2017) / Cagan / Norman (2013) / DDIA + Date / ISTQB / Beck TDD (2002) / SRE Book Ch.13 |
| **CSO 7** | security-auditor / code-reviewer / secret-scanner / dependency-analyzer / plugin-validator / skill-validator / compliance-auditor | OWASP Top 10 / Martin Clean Code (2008) / CWE-798 + gitleaks / SLSA + SPDX / Anthropic Plugin Spec / Anthropic Skill Spec / GDPR + ISO 27001 |
| **CBO 8** | copy-writer / financial-modeler / finops-analyst / growth-analyst / marketing-analytics-analyst / pricing-analyst / seo-analyst / unit-economics-analyst | Sugarman + Bly + Moore / Damodaran (2012) / FinOps Foundation / Sean Ellis (2017) / Avinash Kaushik (2009) / Nagle (2017) / Google SQEG + Web Vitals / David Skok SaaS Metrics |
| **COO 3** | sre-engineer / release-monitor / performance-engineer | SRE Book (2016) + Workbook (2018) / Forsgren DORA (2018) / OpenTelemetry + Web Vitals + Brendan Gregg |
| **CEO 2** | absorb-analyzer / skill-creator | VAIS Code Absorption Protocol (utility) + Anthropic Skill Spec (utility) |

→ **34 sub-agent 마이그레이션 완료** (CEO 2 도 utility 정전 명시).

## 2. Audit 결과 비교 (Sprint 8 → Sprint 9)

| 기준 | Sprint 8 | Sprint 9 | 변화 |
|:----:|:--------:|:--------:|:----:|
| Q-A canon_source | 14/48 (29%) | **48/48 (100%)** | +34 ✅ |
| Q-B execution.policy | 14/48 (29%) | **48/48 (100%)** | +34 ✅ |
| Q-C scope/trigger conditions | 48/48 (100%) | **48/48 (100%)** | — |
| Q-D artifacts ↔ catalog | 41/48 (85%) | **7/48 (15%)** | -34 ⚠ |
| **전 4 기준 통과** | **7/48 (15%)** | **7/48 (15%)** | — |

### 2.1 Q-D 감소 이유 (의도된 결과)

Sprint 8 시점 Q-D 41/48 통과는 **"artifacts 미선언 + catalog 매칭 없음"** 으로 인한 default 통과 (정합한 부재). Sprint 9 에서 모든 sub-agent 가 artifacts 선언 → 그 중 catalog 에 owner_agent 매칭이 있는 7 만 통과.

**해소 경로**:
- Sprint 11~14 What/How/Biz/Alignment template 25+ 작성
- 각 template 의 owner_agent 가 sub-agent 의 artifacts 와 매칭
- audit 자동 재실행 시 7 → 41+ 통과 (전체 4기준 통과 = SC-09 충족)

### 2.2 audit script 정확성 검증

본 결과는 **버그가 아닌 의도된 측정**:
1. Sprint 9 전: artifacts 미선언 = "정합한 부재" (default 통과)
2. Sprint 9 후: artifacts 선언 = catalog 매칭 강제 (template 미작성 시 미통과)
3. Sprint 11~14 후: 모든 artifacts 가 catalog 와 매칭 (목표 상태)

→ Q-D 메트릭이 **template 작성 진행도** 를 정확히 추적.

## 3. 정전 출처 분류 (~30 종 누적)

본 sprint 추가 정전 출처:

| 영역 | 정전 |
|------|------|
| **Discovery** | Torres OST (2021) / Cagan INSPIRED (2017) / Steve Blank Customer Discovery (2005) |
| **Backend/Infra** | Fowler PoEAA (2003) / Kleppmann DDIA (2017) / Sam Newman Microservices (2021) / Roy Fielding REST (2000) |
| **Frontend/UX** | Don Norman (2013) / Nielsen Heuristics (1994) / Krug 'Don't Make Me Think' (2014) / Steve Portigal (2013) |
| **Testing** | Beck TDD (2002) / Meszaros xUnit Patterns (2007) / ISTQB (2018) / Cem Kaner (2002) |
| **Security** | OWASP Top 10 (2021) / CWE/SANS / STRIDE / NIST SP 800-53 / SLSA / GDPR / ISO 27001 |
| **Operations** | SRE Book (2016) + Workbook (2018) / Allspaw Blameless Postmortems (2012) / Forsgren DORA (2018) / OpenTelemetry / Brendan Gregg (2020) |
| **Business** | Sugarman Adweek (2007) / Damodaran Investment Valuation (2012) / FinOps Foundation / Sean Ellis Hacking Growth (2017) / Avinash Kaushik (2009) / Nagle Pricing (2017) / Google SQEG / David Skok SaaS Metrics |
| **Product** | Lenny Rachitsky PRD / Wagenaar / Cohn Agile (2005) / RICE / INVEST / MoSCoW |
| **Data** | Croll & Yoskovitz Lean Analytics (2013) / McClure AARRR / Kohavi Trustworthy Experiments (2020) |

**총 정전 출처 약 30+** — 산업 표준 핵심 거의 모두 cross-reference 완료.

## 4. 자동 검증

| 검증 | 결과 |
|------|:----:|
| `vais-validate-plugin` | ✅ 0 errors / 0 warnings (58 agents) |
| `npm test` | ✅ 263 pass / 0 fail |
| `sub-agent-audit` | exit 2 (Q-A/Q-B 통과 + Q-D 미흡 — Sprint 11~14 후 자동 해소) |
| `template-validator templates/ --depth-check` | ✅ 11/11 |

## 5. RA-3 측정 — Sprint 9

| 단계 | 시간 |
|------|:----:|
| CPO 6 마이그레이션 | ~1.5 분 |
| CTO 8 마이그레이션 | ~2 분 |
| CSO 7 마이그레이션 | ~1.5 분 |
| CBO 8 마이그레이션 | ~2 분 |
| COO 3 + CEO 2 마이그레이션 | ~1.5 분 |
| 검증 (audit + plugin-validate + npm test) | ~1 분 |
| 매트릭스 + 진행 문서 작성 | ~3 분 |
| **합계** | **~12 분 30 초** |

→ Sprint 9 원안 (33분 추정) → 실제 ~12.5분. 40% 단축 (frontmatter 패턴 단순 + Edit 일관 패턴).

## 6. SC 매트릭스 갱신 (Sprint 1~9 누적)

| SC | 임계 | Sprint 8 | Sprint 9 |
|:--:|-----|:--------:|:--------:|
| SC-04 (template c 깊이 25/25) | 25 | 11 (44%) | 11 (44%) |
| **SC-09** (44 audit 4기준 통과) | 44/44 | 7/48 (Q-A/B 미흡) | **7/48** (Q-A/B 100%, Q-D template 의존) |
| SC-08 (50/50) | 50 | 11 (22%) | 11 (22%) |

**SC-09 진행도**:
- Q-A canon_source: ✅ 100%
- Q-B execution.policy: ✅ 100%
- Q-C scope/trigger conditions: ✅ 100%
- Q-D artifacts ↔ catalog: 7/48 — Sprint 11~14 후 41+/48 예상

→ **SC-09 임계 (44/44 통과) 달성 경로**: Sprint 11~14 What 7 + How 11 + Biz 5 + Alignment 3 = 25+ template 작성 + Q-D 자동 통과 → 41+/48 → 잔여 7 (release-engineer deprecated + 진짜 utility 일부) 면제 분류 추가 → SC-09 충족.

## 7. Sprint 10 권고 — audit script 보강

- `utility=true` frontmatter 필드 도입 — utility agent (absorb-analyzer / skill-creator / plugin-validator / skill-validator) 면제 처리
- audit script Q-D 평가 시 `utility=true` 또는 catalog 미존재 phase (예: how/biz/alignment) 의 경우 warning (exit 2) 으로 격하

또는 Sprint 10 생략 + Sprint 11~14 진행으로 자연 해소. 본 권고는 optional.

## 8. 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 9 (34 sub-agent Q-A/Q-B 일괄 마이그레이션) + Q-A/Q-B 14/48 → 48/48 (100%) + Q-D 41/48 → 7/48 (의도된 변동, Sprint 11~14 후 자동 해소) + 정전 출처 ~30종 누적 + 회귀 263 pass |
