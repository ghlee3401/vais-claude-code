---
artifact: security-audit-report
owner_agent: security-auditor
phase: how
canon_source: "OWASP Top 10 (2021), owasp.org + CWE/SANS Top 25 Most Dangerous Software Errors + STRIDE Threat Modeling (Microsoft) + NIST SP 800-53 Security Controls"
execution:
  policy: always
  intent: security-audit
  prereq: [architecture-design, api-implementation]
  required_after: []
  trigger_events: []
  scope_conditions: []
template_depth: filled-sample-with-checklist
review_recommended: false
project_context_reason: "How 단계 — 모든 프로젝트 보안 감사. OWASP Top 10 (2021) 기준 + STRIDE threat model + 발견 + 우선순위 + remediation."
---

# Security Audit Report

> **canon**: OWASP Top 10 (2021) — 가장 critical 한 10 web vulnerability. CWE/SANS Top 25 — 코드 차원 위험. STRIDE — Microsoft 의 threat modeling (Spoofing/Tampering/Repudiation/Information Disclosure/Denial of Service/Elevation of Privilege). NIST SP 800-53 — control catalog.
>
> **목적**: production 배포 전 + 분기 단위 보안 감사. 발견 → 우선순위 → remediation 추적성 확보.

---

## 1. Audit Scope

| 항목 | 내용 |
|------|------|
| **Service** | ______ |
| **Version** | ______ |
| **Audit Date** | YYYY-MM-DD |
| **Auditor** | ______ |
| **Scope** | (web / API / mobile / infra / specific endpoint) |
| **Out of Scope** | (3rd party SaaS / BYOD / etc.) |

## 2. OWASP Top 10 (2021) Checklist

| # | Vulnerability | Status | Evidence | Severity |
|:-:|--------------|:------:|----------|:--------:|
| **A01** | Broken Access Control | ☐ | ... | Critical/High/Med/Low |
| **A02** | Cryptographic Failures | ☐ | ... | ... |
| **A03** | Injection (SQL/NoSQL/Command/LDAP) | ☐ | ... | ... |
| **A04** | Insecure Design | ☐ | ... | ... |
| **A05** | Security Misconfiguration | ☐ | ... | ... |
| **A06** | Vulnerable & Outdated Components | ☐ | ... | ... |
| **A07** | Identification & Auth Failures | ☐ | ... | ... |
| **A08** | Software & Data Integrity Failures | ☐ | ... | ... |
| **A09** | Security Logging & Monitoring Failures | ☐ | ... | ... |
| **A10** | Server-Side Request Forgery (SSRF) | ☐ | ... | ... |

## 3. STRIDE Threat Model

| Threat | Asset | Attack Vector | Mitigation |
|--------|-------|---------------|-----------|
| **S**poofing | (인증 토큰) | (token theft / replay) | (short TTL + rotation) |
| **T**ampering | (request body) | (MITM / replay) | (HTTPS + signing + idempotency) |
| **R**epudiation | (audit log) | (log deletion) | (immutable log + WORM) |
| **I**nformation Disclosure | (PII) | (verbose error / 5xx stack) | (generic message + sanitization) |
| **D**enial of Service | (API endpoint) | (rate abuse / amplification) | (rate limit + circuit breaker) |
| **E**levation of Privilege | (admin endpoint) | (path traversal / role escalation) | (RBAC + least privilege) |

## 4. Findings + Remediation

| ID | Severity | Title | OWASP/CWE | Description | Remediation | Owner | Due |
|:--:|:--------:|------|-----------|-------------|-------------|:-----:|:---:|
| F-001 | Critical | ... | A01 / CWE-285 | ... | ... | ... | ... |
| F-002 | High | ... | A03 / CWE-89 | ... | ... | ... | ... |

**Severity Definition**:
- **Critical**: 즉시 수정 (24h)
- **High**: 1주 내
- **Med**: 분기 내
- **Low**: backlog

## 5. Compliance (해당 시)

- [ ] GDPR Art. 32 (Security of Processing)
- [ ] ISO 27001 Annex A
- [ ] SOC 2 Trust Service Criteria
- [ ] PCI-DSS (결제 처리 시)
- [ ] HIPAA (의료 데이터 시)

## 6. Sign-off

| Role | Name | Date |
|------|------|------|
| Auditor | ... | ... |
| Engineering Lead | ... | ... |
| Security Owner (CSO) | ... | ... |

---

## (작성된 sample)

### VAIS Code Plugin v0.59 — Security Audit (Sprint 1~3 시점)

| 항목 | 내용 |
|------|------|
| Service | vais-code Claude Code marketplace plugin |
| Version | 0.59.0 |
| Audit Date | 2026-04-25 (Sprint 1~3 종결 시점) |
| Auditor | (자가 감사 — security-auditor 위임 가능) |
| Scope | hooks/ + lib/project-profile.js + scripts/ |
| OOS | Anthropic Claude API (vendor) / 사용자 로컬 file system |

### OWASP Top 10 (Sprint 1~3 적용 영역)

| # | Vulnerability | Status | Evidence |
|:-:|--------------|:------:|----------|
| A01 Broken Access Control | ✅ | path traversal 방지 (`validateFeatureName`) — T-04 |
| A02 Cryptographic Failures | N/A | secrets 처리 없음 (로컬 plugin) |
| A03 Injection | ✅ | YAML FAILSAFE_SCHEMA — code execution 차단 |
| A04 Insecure Design | ✅ | feature flag profileGateEnabled: false default |
| A05 Security Misconfiguration | ✅ | profile.yaml secret 차단 (`detectSecrets`) — T-06 |
| A06 Vulnerable Components | ⏳ | dependency-analyzer 정기 실행 권장 |
| A07 Identification Failures | N/A | 로컬 plugin (인증 X) |
| A08 Data Integrity Failures | ✅ | atomicWriteSync (lib/fs-utils) |
| A09 Logging Failures | ✅ | hook 모든 동작 stderr 기록 |
| A10 SSRF | N/A | 외부 HTTP 호출 없음 (Claude API 만 — sandbox) |

### STRIDE (Sprint 1~3)

| Threat | Asset | Mitigation |
|--------|-------|-----------|
| Tampering | profile.yaml | YAML FAILSAFE_SCHEMA + 사용자 명시 보강 |
| Information Disclosure | profile.yaml | secret pattern 검증 (`SECRET_PATTERN` regex) — T-06 |
| Elevation of Privilege | feature_name | path traversal 차단 (`validateFeatureName`) — T-04 |

### Findings

| ID | Severity | Title | Remediation | Status |
|:--:|:--------:|------|-------------|:------:|
| F-S1 | Med | dependency-analyzer 정기 실행 미설정 | scripts/sub-agent-audit 처럼 CI 통합 권장 | open |
| F-S2 | Low | secret-scanner CI 자동 실행 부재 | CI 파이프라인 추가 권장 | open |

### Sign-off

| Role | Name | Date |
|------|------|------|
| security-auditor | (delegated by CSO) | 2026-04-25 |

---

## 작성 체크리스트

- [ ] **Audit Scope** (service / version / date / auditor / in-scope / out-of-scope) 명시?
- [ ] **OWASP Top 10 (2021)** 모두 평가? (N/A 인 경우 이유 명시)
- [ ] **STRIDE 6 categories** 모두 검토?
- [ ] Findings 의 **Severity (Critical/High/Med/Low)** + **OWASP/CWE 매핑** + **Remediation Owner + Due** 명시?
- [ ] Compliance 요구사항 (GDPR / SOC 2 / PCI-DSS) 검토?
- [ ] **Sign-off** (Auditor + Engineering Lead + Security Owner) 완료?
- [ ] post-audit **재감사 일정** (분기 단위) 명시?

---

## ⚠ Anti-pattern

- **OWASP 일부만**: 10 중 5 만 평가 — coverage gap. **모두 명시** (N/A 도 이유 포함).
- **Severity 추상**: "보통 / 심각" — 객관 기준 부재. **Critical/High/Med/Low + 시간 기준** (24h/1w/quarter/backlog).
- **Remediation 부재**: finding 만 적고 fix 절차 X — backlog 유지 무의미.
- **Owner 부재**: 누가 fix 하는가? 미명시 → 무책임 finding.
- **post-audit 무**: 1 회 감사 후 종결 — 환경 변화 시 stale. **분기 재감사**.
- **Compliance 무시**: GDPR/SOC 2 영역 평가 X — 사업 확장 시 비용 폭증.
- **Production 만 audit**: dev/staging 도 동일 시 audit — secret 노출 / 권한 잘못 설정 가능.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 12. OWASP Top 10 (2021) + CWE Top 25 + STRIDE + NIST 정전. Audit Scope + OWASP Checklist + STRIDE Threat Model + Findings + Compliance + Sign-off + sample (VAIS Code v0.59 감사 — Sprint 1~3 보안 측면) + checklist 7 + anti-pattern 7 |
