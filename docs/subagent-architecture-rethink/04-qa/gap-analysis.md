---
owner: cpo
topic: gap-analysis
phase: qa
feature: subagent-architecture-rethink
---

# Topic: Gap Analysis (4건 — CTO plan 보완 권장)

## 1. Gap 식별

PRD가 8섹션 designCompleteness 100%이고 21/21 결정 일치하지만, **CTO 기술 plan에서 보완 권장** 4건 식별.

### G-1. 비기능 요구사항 (Non-functional Requirements) 부재

**현황**: PRD가 기능(F1~F8)에 집중. 성능/보안/접근성/확장성 등 비기능 요구사항 미명시.

**영향**: 중. CTO가 plan에서 명시적으로 결정해야 구현 검증 가능.

**보완 후보**:

| 비기능 | 후보 임계값 | 정전 |
|--------|-----------|------|
| 성능 — Profile 게이트 평가 latency | < 50ms | (Google PageSpeed 기준 |
| 성능 — template-validator 실행 시간 | < 1s (25개 일괄) | — |
| 성능 — alignment α 키워드 일치율 측정 | < 5s (산출물 페어당) | — |
| 보안 — project-profile.yaml 유효성 | path traversal 차단 + secret 입력 거부 | OWASP ASVS |
| 보안 — sub-agent frontmatter 검증 | secret-scanner / dependency-analyzer 자동 | CSO 위임 |
| 접근성 | N/A (CLI 플러그인) | — |
| 확장성 — 카탈로그 50→100+ | schema 호환 (frontmatter 후방 호환) | — |
| 확장성 — Profile 변수 추가 | breaking change 없이 추가 가능 | — |

**권장**: CTO plan에서 위 후보를 채택·확정 + Success Criteria 추가 (예: "SC-tech-01: Profile 게이트 latency < 50ms").

### G-2. 산출물 카탈로그 데이터 모델 부재

**현황**: 50+ 산출물 카탈로그가 frontmatter metadata schema는 있지만, **카탈로그 자체의 data model**(어떻게 저장·조회·인덱싱?)이 부재.

**영향**: 낮음. 단, 카탈로그가 50→100+ 확장 시 issue.

**보완 후보**:

```
카탈로그 저장 방식 후보:
A. 단순 templates/*.md (현재) — frontmatter scan으로 카탈로그 생성
B. catalog.json 인덱스 파일 — `scripts/build-catalog.js` 가 templates/*.md 스캔 후 생성
C. SQLite + scripts/catalog-cli.js — 검색·필터·정렬 기능

권장: B (현재 templates/*.md 유지 + 인덱스 자동 생성). C는 50→100+ 시 검토.
```

**권장**: CTO infra-architect plan에서 결정.

### G-3. API 엔드포인트 N/A 명시 부재 — ✅ **해소됨 (v1.1)**

**현황**: PRD에 API 섹션 없음. 본 피처는 Claude Code 플러그인이라 실제 N/A지만 PRD에서 explicit 하지 않음.

**영향**: 낮음. 단순히 "API: N/A (Claude Code 플러그인이라 외부 API 없음)" 한 줄 추가하면 충분.

**권장**: PRD에 한 줄 추가하거나 CTO plan에서 명시.

**해소 (qa CP-Q 사용자 선택)**: `03-do/main.md` v1.1에서 섹션 7 Solution에 한 줄 추가됨 — "API Endpoints: N/A (Claude Code 플러그인 — 외부 HTTP API 없음). Data Model: catalog.json 인덱스 자동 생성".

### G-4. vais.config.json `cSuite` 섹션 업데이트 명시 부재

**현황**: PRD F5 (release 5분해) + F6 (CEO 4 신설 + roadmap-author)이 신규 sub-agent 7개를 추가하지만, `vais.config.json` 의 `cSuite.{c-level}.subAgents` 배열 업데이트 작업 명시 부재.

**영향**: 중. vais.config.json은 워크플로우 결정에 사용됨. 이 파일 업데이트 누락 시 신규 sub-agent가 작동 안 함.

**보완 사항**:

```json
{
  "cSuite": {
    "ceo": {
      "subAgents": [
        "absorb-analyzer",
        "skill-creator",
        "vision-author",       // 신규
        "strategy-kernel-author",  // 신규
        "okr-author",          // 신규
        "pr-faq-author"        // 신규
      ]
    },
    "cpo": {
      "subAgents": [
        // ... 기존
        "roadmap-author"       // 신규
      ]
    },
    "coo": {
      "subAgents": [
        "release-notes-writer",     // 신규 (release-engineer 분해)
        "ci-cd-configurator",       // 신규
        "container-config-author",  // 신규
        "migration-planner",        // 신규
        "runbook-author",           // 신규
        // release-engineer는 deprecate alias로 1 phase 유지
        "release-engineer",
        "sre-engineer",
        "release-monitor",
        "performance-engineer"
      ]
    }
  }
}
```

**권장**: CTO infra-architect plan 작업 항목에 명시. 또한 `package.json > claude-plugin > agents` 배열도 업데이트.

## 2. Gap 보완 결정 매트릭스

| Gap | 보완 위치 | 보완 시점 | 책임자 |
|-----|---------|---------|------|
| G-1 (비기능 요구사항) | CTO plan (`docs/.../01-plan/` CTO 진입 시) | Sprint 1 시작 전 | CTO |
| G-2 (카탈로그 data model) | CTO plan + infra-architect | Sprint 4 (template 작성 전) | CTO + infra-architect |
| G-3 (API N/A 명시) | PRD 한 줄 추가 또는 CTO plan 명시 | 즉시 | CPO 또는 CTO |
| G-4 (cSuite 업데이트) | CTO infra-architect plan | Sprint 7 (sub-agent 신설 시) | CTO + infra-architect |

## 3. CP-Q 결정 영향

CP-Q 권장: **B. 그대로 CTO 전달** (Gap을 CTO 핸드오프 컨텍스트에 명시).

근거:
- Gap 4건 모두 **CTO 영역 (기술 비기능 / data model / 설정 / 인프라 작업)**
- CPO에서 보완하면 PRD가 비대해지고 (G-1 비기능요구사항만 추가해도 200줄+) CTO plan 단계에서 어차피 다시 결정해야 함
- "Plan ≠ Do" 원칙(Rule #12)과 정합 — CTO plan에서 자연스럽게 결정

다만 G-3은 한 줄로 즉시 추가 가능 → PRD 보완 검토 가능.

## 4. 큐레이션 기록

| 항목 | 채택 |
|------|:----:|
| Gap 4건 식별 | ✅ |
| CTO 핸드오프 시 명시 권장 | ✅ |
| G-3만 PRD 즉시 보완 검토 | 사용자 결정 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — Gap 4건 + 보완 결정 매트릭스 |
| v1.1 | 2026-04-25 | CPO 재진입: G-3 해소 (PRD v1.1에서 한 줄 추가) — 잔여 Gap 3건 (G-1/G-2/G-4) |
