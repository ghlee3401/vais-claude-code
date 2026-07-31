# OWASP Top 10 Checklist (CSO)

Gate A 보안 검토 시 security-auditor 가 사용. PO 의 "절대 보존" 1순위 자산.

## OWASP Top 10 (2021)

| # | 카테고리 | 핵심 체크 |
|---|---------|----------|
| A01 | Broken Access Control | 권한 검사 누락, IDOR, 접근 제어 우회 |
| A02 | Cryptographic Failures | 약한 암호화, 평문 저장, 키 관리 부실 |
| A03 | Injection | SQLi, XSS, command injection, LDAP injection |
| A04 | Insecure Design | 위협 모델 부재, 안전 패턴 미적용 |
| A05 | Security Misconfiguration | 기본 설정 노출, 디버그 모드, 미사용 기능 |
| A06 | Vulnerable Components | CVE 있는 라이브러리, 미패치 버전 |
| A07 | Identification & Auth Failures | 약한 패스워드, session 고정, MFA 부재 |
| A08 | Software & Data Integrity | 미서명 의존성, untrusted CI/CD, deserialization |
| A09 | Security Logging Failures | 로그 부재, 모니터링 미수신, 알림 미설정 |
| A10 | SSRF | 외부 URL 요청 검증 부재 |

## Critical 판정 기준

각 카테고리에서 **하나라도 발견** 시 = Critical (gate verdict = `fail`)

## Score 계산

10개 중 미발견 카테고리 수 = OWASP Score (10 만점)

| Score | 등급 | 액션 |
|-------|------|------|
| 9-10 | Pass | 통과 + 권장사항 |
| 7-8 | Warning | 조건부 통과, Important 이슈 수정 권장 |
| 6 이하 | Fail | 배포 차단, CTO 수정 요청 |

threshold (vais.config.json > gates.defaults.owaspScore): **>= 8**

## Do 문서 작성 형식

```
## 보안 감사 요약
- Critical: 0
- OWASP: 9/10
```

auto-judge 파싱 패턴: `OWASP: N/10` 또는 `OWASP Score: N/10`. 숫자 명시 필수.

## 카테고리별 검사 도구 추천

| 카테고리 | 도구 |
|---------|------|
| A01/A07 | 수동 코드 리뷰 (인증/인가 로직) |
| A02 | bandit (Python), eslint-plugin-security |
| A03 | semgrep, snyk code |
| A06 | npm audit, snyk, dependabot |
| A09 | application logging audit (수동) |
