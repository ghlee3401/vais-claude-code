---
owner: cto
agent: cto-direct
artifact: ceo-algorithm
phase: plan
feature: simplify-non-cto-workflow
generated: 2026-05-02
summary: "CEO 의 7 차원 체크리스트 + phase↔artifact 기본 매핑 + 사용자 인터페이스 흐름. 코드 개발 도우미 정체성 반영."
---

# CEO Algorithm — 7 차원 체크리스트 + 매핑

## 한 줄 요약

CEO 가 사용자 요청 받으면 7 차원 빠짐없이 체크 → 필요한 phase / artifact / C-Level 결정 → AskUserQuestion 1번으로 사용자 확인 → 자동 PDCA.

## 7 차원 체크리스트 (코드 개발 컨텍스트)

| # | 차원 | 결정 트리거 | 활성화 sub-agent |
|---|------|-----------|----------------|
| 1 | **보안 영향** | 인증 / 결제 / 개인정보 / 권한 → high | security-auditor / threat-model |
| 2 | **컴플라이언스** | PCI / GDPR / SOC2 / HIPAA 해당 | compliance-auditor |
| 3 | **UX 복잡도** | UI 화면 1+ / 사용자 입력 폼 → medium+ | ui-designer / ux-researcher / persona |
| 4 | **데이터 모델** | DB 스키마 변경 / 새 엔티티 | db-architect |
| 5 | **외부 API/통신** | 3rd-party API / webhook / dep 추가 | dependency-analyzer / secret-scanner |
| 6 | **성능 민감도** | 응답 < 500ms / 동시 N 사용자 / 큐 | performance-engineer / sre-engineer |
| 7 | **제품 정의 깊이** | 신규 기능 (PRD 필요) vs 작은 수정 | prd-writer / product-discoverer / product-researcher |

각 차원 등급: `none / low / medium / high`. medium 이상 → 활성화.

## CBO/COO 자동 라우팅 제외 (v2.3)

위 7 차원에 마케팅/GTM/SLA/비용 빠짐. 이유: vais-code = 코드 개발 도우미.

CBO/COO 활성 = 사용자 명시 호출 (`/vais cbo ...` / `/vais coo ...`):

| C-Level | 명시 활성 시나리오 |
|---------|------------------|
| CBO | SaaS 출시 / GTM 캠페인 / 가격 정책 / unit economics / SEO 감사 |
| COO | CI/CD 신규 구축 / 모니터링 시스템 / SRE / 배포 자동화 |

## Phase ↔ Artifact 기본 매핑

CEO 가 7 차원 결과로 다음 매핑 적용. 차원 등급에 따라 artifact 일부 활성/생략.

| Phase | Artifact (default) | 활성 조건 |
|-------|-------------------|---------|
| **00-ideation** | (CEO 결정 박제 — 모든 피처 필수) | 항상 |
| **01-plan** | prd | 차원 7 (제품 정의) ≥ medium |
| | persona | 차원 3 (UX) ≥ medium |
| | jtbd | 차원 7 ≥ high (큰 신규 기능) |
| | tam-sam-som | 차원 7 ≥ high (시장 검토 필요) |
| | opportunity-solution-tree | 차원 7 ≥ high (탐색 단계) |
| | threat-model | 차원 1 (보안) ≥ medium |
| **02-design** | architecture | 항상 (CTO 책임) |
| | data-model | 차원 4 (DB) ≥ medium |
| | api-contract | 차원 5 (외부 통신) ≥ medium |
| | ui-flow | 차원 3 (UX) ≥ medium |
| | value-proposition-canvas | 차원 7 ≥ high |
| **03-do** | implementation log | 항상 |
| | secret-scan | 차원 1 ≥ medium |
| | dependency-vulnerability | 차원 5 ≥ medium |
| **04-qa** | gap-analysis | 항상 |
| | security-audit (OWASP) | 차원 1 ≥ medium |
| | compliance-report | 차원 2 (컴플라이언스) 활성 시 |
| **05-report** | 종합 보고서 | 항상 |

## 사용자 인터페이스 (AskUserQuestion 클릭)

```
사용자: /vais ceo 결제 기능 만들고 싶어
   ↓
CEO 5~10초 분석 (사용자에게 안 보임):
  차원 1 보안:        high (PCI-DSS)
  차원 2 컴플라이언스: high (PCI 해당)
  차원 3 UX:          medium (결제 UI)
  차원 4 데이터모델:   medium (Payment 테이블)
  차원 5 외부 통신:    high (PG 연동)
  차원 6 성능:        medium (응답 속도)
  차원 7 제품 정의:    high (신규 기능)
   ↓
CEO 가 사용자에게 1단락 요약 + AskUserQuestion (옵션 2~3개):

   "결제 기능 분석:
    - 보안+컴플라이언스 high (PCI-DSS)
    - 외부 PG 통신 + UX 흐름 + 데이터 모델
    - 활성 sub-agent: prd-writer / persona / threat-model / architecture
      / data-model / api-contract / ui-flow / impl / secret-scan / dependency
      / security-audit / compliance / gap-analysis

    제외: marketing/GTM (코드 개발 컨텍스트), 풀 시장 분석 (스코프 외)"

   AskUserQuestion 옵션:
     - 진행 (CEO 결정 그대로)
     - 옵션 조정 (사용자 추가/제외 명시)
   ↓
사용자 클릭 1번 → 자동 PDCA
```

## CEO ideation 박제 (`docs/{feature}/00-ideation/main.md`)

```markdown
---
owner: ceo
agent: ceo-direct
artifact: ideation-decision
phase: ideation
feature: payment-flow
generated: 2026-05-02
summary: "결제 피처 — 보안+컴플라이언스 high, 외부 통신/UX/데이터모델 medium. 4 C-Suite (CEO+CPO+CTO+CSO) 사용. 13 artifact 박제 예정."
---

# Ideation Decision — payment-flow

## 7 차원 분석
| # | 차원 | 등급 | 활성 sub-agent |
|---|------|:----:|---------------|
| 1 | 보안 | high | security-auditor / threat-model / secret-scan / dependency |
| ...

## C-Suite 활성
- CEO: ideation 박제 (본 문서)
- CPO: prd, persona
- CTO: architecture, data-model, api-contract, ui-flow, impl, gap-analysis
- CSO: threat-model, security-audit, compliance, secret-scan, dependency
- CBO: 비활성 (코드 개발 컨텍스트)
- COO: 비활성

## Artifact 박제 계획 (13개)
| Phase | Artifact | Owner | Agent |
|-------|----------|:-----:|-------|
| plan | prd | cpo | prd-writer |
| plan | persona | cpo | ux-researcher |
| plan | threat-model | cso | security-auditor |
| design | architecture | cto | infra-architect |
| ... | ... | ... | ... |

## 사용자 합의
- 사용자가 클릭 1번으로 진행 결정 (2026-05-02 14:30)
```

## 사용자 override

사용자가 CEO 결정에 동의 안 하면 옵션 조정 가능:

```
CEO 추천: 13 artifact 박제
   ↓
AskUserQuestion: "옵션 조정"
   ↓
추가 옵션:
  - artifact 추가 (예: jtbd, tam-sam-som)
  - artifact 제외 (예: persona 빼기)
  - C-Level 추가 (예: CBO 명시 활성 — 가격 검토 필요 시)
```

오버라이드 시 `.vais/memory.json` 에 사용자 선호 박제. 다음 피처에서 같은 패턴 자동 적용.

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-02 | 7 차원 체크리스트 + phase↔artifact 매핑 + 사용자 인터페이스 흐름 + ideation 박제 형식 + override 정책. CBO/COO 자동 라우팅 제외 (v2.3). |
