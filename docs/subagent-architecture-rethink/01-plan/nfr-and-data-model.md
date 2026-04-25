---
owner: cto
topic: nfr-and-data-model
phase: plan
feature: subagent-architecture-rethink
---

# Topic: NFR (G-1) + Data Model (G-2) 보완

> qa Gap G-1 (비기능 요구사항) + G-2 (카탈로그 data model) 보완.

## 1. NFR — 비기능 요구사항 (G-1 / D-T1)

### 1.1 성능 (Performance)

| 지표 | 임계값 (P95) | 측정 방법 | 정전 |
|------|-----------:|---------|------|
| Profile 게이트 평가 latency | < 50ms | `tests/perf/profile-gate.bench.js` (신규) | Doherty Threshold (Modeled at 400ms) |
| template-validator 25개 일괄 검증 | < 1s | `time scripts/template-validator.js` | — |
| template-validator 50개 일괄 | < 2s | 동일 | (선형 확장) |
| alignment α 키워드 일치율 측정 (산출물 페어당) | < 5s | EXP-4 측정 | — |
| ideation-guard hook (Profile 합의 prompt) | UI 응답 < 200ms | hook 스크립트 자체 시간 | — |

### 1.2 보안 (Security)

| 항목 | 요구사항 | 측정 |
|------|---------|------|
| project-profile.yaml 입력 유효성 | path traversal 차단 (`../`, 절대경로 거부) | `lib/project-profile.js` 단위 테스트 |
| profile.yaml secret 입력 차단 | `secret-scanner` 룰셋 호환 — API key/token/password 패턴 거부 | secret-scanner 위임 |
| sub-agent frontmatter | dependency-analyzer 자동 점검 (CSO 위임) | CSO Gate A |
| template 파일 권한 | git 추적 + write-protected (frontmatter 변조 방지) | git-blame |
| `vais.config.json` 변경 | git diff + 사용자 승인 (CTO 외 수정 차단) | code-reviewer |

### 1.3 접근성 (Accessibility)

| 항목 | 요구사항 |
|------|---------|
| CLI 응답 메시지 | 한국어 + 영어 키워드 병기 (i18n 부분 지원) |
| AskUserQuestion 옵션 라벨 | 명확한 한국어 + 영문 식별자 |
| 색약 대응 | 텍스트 prefix(✅⚠️❌) 사용 — 색상 단독 의미 부여 X |
| 화면 리더 | N/A (CLI/Claude Code) |

### 1.4 확장성 (Scalability)

| 항목 | 임계 | 검증 |
|------|------|-----|
| 카탈로그 50→100+ 확장 | schema 후방 호환 (frontmatter optional 필드만 추가) | template-validator 호환 모드 |
| Profile 변수 12→20+ 확장 | breaking change 없이 추가 가능 (default value 정의) | profile schema versioning |
| sub-agent 44→52 (+10) | vais.config.json `cSuite` 배열 길이 한계 없음 | manual scan |
| 신규 phase 추가 | (현재 5 phase) docPaths schema 확장 가능 | `vais.config.json > workflow.docPaths` 키 추가 |

### 1.5 신뢰성 (Reliability)

| 항목 | 요구사항 |
|------|---------|
| Profile 게이트 false positive (skip이 잘못 발동) | < 5% (EXP-1 + EXP-5에서 측정) |
| Profile 게이트 false negative (skip이 안 발동) | < 5% |
| alignment α 감지율 | 70%+ (EXP-4 — RA-2 검증) |
| sub-agent 재정의로 기존 워크플로우 손상 | 0건 (R6 — feature flag로 점진 활성화) |

## 2. Data Model — 산출물 카탈로그 (G-2 / D-T2)

### 2.1 저장 방식 결정 (Approach B 채택)

| 후보 | 설명 | 채택 |
|------|------|:----:|
| A | 단순 templates/*.md (현재) — frontmatter scan으로 카탈로그 생성 | (기본) |
| **B** | catalog.json 인덱스 자동 빌드 — `scripts/build-catalog.js` 가 templates/*.md 스캔 후 생성 | ✅ |
| C | SQLite + scripts/catalog-cli.js — 검색·필터·정렬 | 미래 (50→100+ 시) |

### 2.2 catalog.json schema

```json
{
  "version": "1.0",
  "generated_at": "2026-04-25T00:00:00Z",
  "total_artifacts": 50,
  "policy_distribution": {
    "always": 17,
    "scope": 14,
    "user-select": 17,
    "triggered": 2
  },
  "artifacts": [
    {
      "id": "lean-canvas",
      "phase": "what",
      "owner_agent": "product-strategist",
      "canon_source": "Maurya 'Running Lean'",
      "execution": {
        "policy": "user-select",
        "scope_conditions": [],
        "intent": "business-model-design",
        "alternates": ["business-model-canvas", "value-proposition-canvas"],
        "trigger_events": [],
        "prereq": ["pest-analysis"],
        "required_after": ["prd"],
        "review_recommended": false
      },
      "template_depth": "filled-sample-with-checklist",
      "template_path": "templates/what/lean-canvas.md",
      "project_context_reason": "What 단계 BM 결정의 1차 산출물"
    }
  ],
  "by_phase": {
    "core": ["vision-statement", "strategy-kernel", "okr", "pr-faq", "3-horizon"],
    "why": ["pest", "five-forces", "swot", "..."],
    "what": ["lean-canvas", "bmc", "..."],
    "how": ["adr", "c4", "..."],
    "biz": ["3-statement", "..."]
  },
  "by_intent": {
    "business-model-design": ["lean-canvas", "business-model-canvas", "value-proposition-canvas"],
    "market-analysis": ["pest", "five-forces", "swot"],
    "prioritization": ["rice", "moscow", "ice"]
  }
}
```

### 2.3 catalog 빌더 동작

```
scripts/build-catalog.js
  ↓
for each `templates/{section}/*.md`:
  ↓
gray-matter parse (frontmatter)
  ↓ (validate against template metadata schema)
template-validator
  ↓ (collect)
in-memory catalog
  ↓
write `catalog.json` (정렬: phase → policy → id)
```

### 2.4 사용 위치

- `lib/project-profile.js` — Profile 평가 시 `catalog.json > artifacts[].execution.scope_conditions` 조회
- `agents/_shared` — sub-agent 가 자기 산출물 metadata 조회 시
- `scripts/template-validator.js` — 일괄 검증 시
- 향후 (H2): community template registry 가 catalog 형식 그대로 호환

### 2.5 테스트

- `tests/integration/catalog-build.test.js` — 25 / 50 template scan 성공 + JSON schema 통과
- `tests/integration/catalog-policy-evaluation.test.js` — Profile × policy 조합 48+ 케이스

## 3. CTO 큐레이션 기록

| 항목 | 채택 |
|------|:----:|
| NFR 5 영역 (perf/sec/access/scale/reliability) | ✅ |
| 임계값 표 (D-T1) | ✅ — 수치 명시 |
| catalog.json schema (Approach B) | ✅ |
| SQLite (Approach C) 보류 | OOS (50→100+ 시 재검토) |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — G-1 NFR 5 영역 + G-2 catalog.json schema |
