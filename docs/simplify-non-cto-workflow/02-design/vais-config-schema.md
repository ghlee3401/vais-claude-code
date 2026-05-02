---
owner: cto
agent: cto-direct
artifact: vais-config-schema
phase: design
feature: simplify-non-cto-workflow
generated: 2026-05-02
summary: "vais.config.json 의 v2.x schema 변경. cSuite primary/secondary 분리 + phaseArtifactMapping 신규 + 정책 enforcement 완화."
---

# vais.config.json — v2.x Schema

## 적용 위치

`vais.config.json`

## 변경 사항 요약

| 영역 | 변경 종류 |
|------|---------|
| `cSuite.roles` | primary (4) / secondary (2) 분리 |
| `cSuite.autoRouting` (신규) | CEO 자동 라우팅 대상 명시 |
| `workflow.phaseArtifactMapping` (신규) | CEO 알고리즘의 phase ↔ artifact 매핑 |
| `workflow.topicPresets` | 폐기 또는 deprecated 표시 |
| `workflow.docPaths` | CTO 폴더 구조 적용 |
| `cLevelCoexistencePolicy.mainMdMaxLinesAction` | "refuse" → "warn" |
| `scopeContractPolicy.enforcement` | "fail" → "warn" |
| `subDocPolicy.requireCurationRecord` | true → false (큐레이션 폐기) |
| `gates.cto.plan.requirePrd` | 그대로 (CTO 만 적용) |

## 신규 / 변경 schema

### cSuite.primary / secondary

```json
{
  "cSuite": {
    "_comment": "v2.x — 코드 개발 도우미 정체성. primary 4 = CEO 자동 라우팅 대상. secondary 2 = 사용자 명시 호출 시만 활성.",
    "primary": ["ceo", "cpo", "cto", "cso"],
    "secondary": ["cbo", "coo"],
    "autoRouting": {
      "_comment": "CEO 가 자동 라우팅 시 primary 만 대상. secondary 는 /vais cbo|coo {feature} 명시 호출 필요.",
      "default": "primary",
      "secondaryActivation": "explicit"
    },
    "roles": {
      "ceo": { ... 기존 그대로 ... },
      "cpo": { ... },
      "cto": { ... },
      "cso": { ... },
      "cbo": { 
        ...,
        "_v2_note": "secondary — 명시 호출 시만 활성 (SaaS 출시 / GTM / 가격 / unit economics / SEO)"
      },
      "coo": {
        ...,
        "_v2_note": "secondary — 명시 호출 시만 활성 (CI/CD / 모니터링 / SRE / 배포)"
      }
    }
  }
}
```

### workflow.phaseArtifactMapping (신규)

```json
{
  "workflow": {
    "phaseArtifactMapping": {
      "_comment": "v2.x — CEO 알고리즘의 phase ↔ artifact 활성화 기본 매핑. lib/ceo-algorithm.js 가 사용.",
      "00-ideation": {
        "always": ["ideation-decision"],
        "conditional": []
      },
      "01-plan": {
        "always": [],
        "conditional": [
          { "artifact": "prd", "owner": "cpo", "agent": "prd-writer", "trigger": "dim7 >= medium" },
          { "artifact": "persona", "owner": "cpo", "agent": "ux-researcher", "trigger": "dim3 >= medium" },
          { "artifact": "jtbd", "owner": "cpo", "agent": "product-researcher", "trigger": "dim7 == high" },
          { "artifact": "tam-sam-som", "owner": "cpo", "agent": "product-researcher", "trigger": "dim7 == high" },
          { "artifact": "opportunity-solution-tree", "owner": "cpo", "agent": "product-discoverer", "trigger": "dim7 == high" },
          { "artifact": "threat-model", "owner": "cso", "agent": "security-auditor", "trigger": "dim1 >= medium" }
        ]
      },
      "02-design": {
        "always": [
          { "artifact": "architecture", "owner": "cto", "agent": "infra-architect" }
        ],
        "conditional": [
          { "artifact": "data-model", "owner": "cto", "agent": "db-architect", "trigger": "dim4 >= medium" },
          { "artifact": "api-contract", "owner": "cto", "agent": "backend-engineer", "trigger": "dim5 >= medium" },
          { "artifact": "ui-flow", "owner": "cto", "agent": "ui-designer", "trigger": "dim3 >= medium" },
          { "artifact": "value-proposition-canvas", "owner": "cpo", "agent": "product-strategist", "trigger": "dim7 == high" },
          { "artifact": "lean-canvas", "owner": "cpo", "agent": "product-strategist", "trigger": "dim7 == high" },
          { "artifact": "product-strategy-canvas", "owner": "cpo", "agent": "product-strategist", "trigger": "dim7 == high" }
        ]
      },
      "03-do": {
        "always": [
          { "artifact": "implementation-log", "owner": "cto", "agent": "cto-direct" }
        ],
        "conditional": [
          { "artifact": "secret-scan", "owner": "cso", "agent": "secret-scanner", "trigger": "dim1 >= medium" },
          { "artifact": "dependency-vulnerability", "owner": "cso", "agent": "dependency-analyzer", "trigger": "dim5 >= medium" }
        ]
      },
      "04-qa": {
        "always": [
          { "artifact": "gap-analysis", "owner": "cto", "agent": "qa-engineer" }
        ],
        "conditional": [
          { "artifact": "security-audit", "owner": "cso", "agent": "security-auditor", "trigger": "dim1 >= medium" },
          { "artifact": "compliance-report", "owner": "cso", "agent": "compliance-auditor", "trigger": "dim2 != none" }
        ]
      },
      "05-report": {
        "always": [
          { "artifact": "completion-report", "owner": "cto", "agent": "cto-direct" }
        ],
        "conditional": []
      }
    }
  }
}
```

### workflow.topicPresets — Deprecated

```json
{
  "workflow": {
    "topicPresets": {
      "_v2_deprecated": "v0.57 모델. v2.x 에서는 phaseArtifactMapping 으로 대체. 기존 키는 backward-compat 위해 보존하되 신규 사용 X.",
      "00-ideation": { ... 기존 ... }
    }
  }
}
```

### workflow.docPaths — CTO 폴더 구조

```json
{
  "workflow": {
    "docPaths": {
      "feature": "docs/{feature}/",
      "phase": "docs/{feature}/{NN-phase}/",
      "phaseMain": "docs/{feature}/{NN-phase}/main.md",
      "artifact": "docs/{feature}/{NN-phase}/{artifact}.md",
      "_comment": "v2.x — sub-agent artifact 가 phase 폴더 안에 평면. _tmp 폴더 폐기."
    }
  }
}
```

### 정책 enforcement 완화

```json
{
  "cLevelCoexistencePolicy": {
    "mainMdMaxLinesAction": "warn",
    "_v1_was": "refuse"
  },
  "scopeContractPolicy": {
    "enforcement": "warn",
    "_v1_was": "fail"
  },
  "subDocPolicy": {
    "requireCurationRecord": false,
    "_v1_was": true,
    "scratchpadPreserve": false,
    "_v1_was_2": true
  }
}
```

### orchestration.legacyV1 (옵트아웃)

```json
{
  "orchestration": {
    "legacyV1": {
      "enabled": false,
      "_comment": "v0.6x 호환 모드. true 시 옛 _tmp 모델 + 큐레이션 + topicPresets 사용. 외부 사용자가 마이그레이션 부담 시 활용."
    }
  }
}
```

## Migration 영향

기존 vais.config.json 사용자:

| 영향 | 처리 |
|------|------|
| `cSuite.roles` 6 개 → primary/secondary 분리 | additive — 기존 키 보존 |
| `topicPresets` 사용자 | deprecated 표시, 작동 그대로 (legacyV1 enable 시) |
| `mainMdMaxLinesAction` 기존 refuse | "warn" 으로 자동 갱신 (외부 사용자 영향 0) |
| `scopeContractPolicy` 기존 fail | "warn" 으로 자동 갱신 |

→ **breaking change 없음**. additive + deprecated.

## JSON Schema 검증

`scripts/vais-validate-plugin.js` 에 v2.x schema 검증 추가:
- `cSuite.primary` 길이 = 4 (정확히 ceo+cpo+cto+cso)
- `cSuite.secondary` 길이 = 2 (cbo+coo)
- `workflow.phaseArtifactMapping` 6 phase 모두 존재

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-02 | v2.x schema — primary/secondary 분리 + phaseArtifactMapping 신규 + topicPresets deprecated + 정책 enforcement 완화 + legacyV1 옵트아웃. Migration 영향 + JSON Schema 검증. |
