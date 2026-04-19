# v0.57 Sub-plan 00 — Sub-doc Convention & Path Policy

> 선행: 없음 (모든 sub-plan 의 기반)
> 후행: 01, 02, 03, 04

## 1. 목적

sub-agent 가 자기 분야 산출물을 저장할 **표준 경로·파일명·스키마** 를 확정한다. 이 플랜은 컨벤션만 정의하고, 실제 agent markdown 수정은 sub-plan 01/02 에서 수행.

## 2. 결정 항목

### 2.1 경로 패턴

```
docs/{feature}/{NN-phase}/{slug}.md
```

| 토큰 | 값 | 근거 |
|------|-----|-----|
| `{feature}` | kebab-case 영문 2~4 단어 | CLAUDE.md File Conventions |
| `{NN-phase}` | `00-ideation` / `01-plan` / `02-design` / `03-do` / `04-qa` / `05-report` | CLAUDE.md Rule #3 |
| `{slug}` | sub-agent frontmatter `name` (kebab-case) 또는 `main` (C-Level 인덱스) 또는 의미명 (시스템 산출물) | 본 플랜 §2.3 |

### 2.2 파일 타입 분류

| Type | 예시 | 작성자 | 금지 사항 |
|------|------|--------|-----------|
| `main.md` | `01-plan/main.md` | C-Level | sub-agent 가 직접 수정 금지 (race 방지) |
| `{agent-slug}.md` | `02-design/ui-designer.md` | 해당 sub-agent 1명 | 다른 agent 가 수정 금지 |
| `{agent-slug}.{qualifier}.md` | `02-design/ui-designer.review.md` | 동일 agent, 다른 맥락 | qualifier 는 kebab-case 1~2단어 |
| `{system-name}.md` | `02-design/interface-contract.md` | 시스템/C-Level 자동 생성 | 사전 예외 리스트 (§2.4) |

### 2.3 슬러그 규칙

1. **primary slug** = sub-agent 의 `frontmatter.name` (kebab-case)
2. 같은 agent 가 같은 phase 에서 **복수 산출물** 남길 시 `.{qualifier}` 추가
   - 예: `ui-designer.md` (화면 설계 본체) + `ui-designer.review.md` (디자인 크리틱)
3. qualifier 는 **최대 2개** 권장. 3개 이상이면 산출물이 과분화 — 리뷰 필요.
4. 대소문자 / 공백 / 한글 금지. `_` 대신 `-`.

### 2.4 시스템 산출물 예외 리스트

아래 파일은 sub-agent 슬러그가 아닌 **의미명** 으로 유지 (rename 하지 않음):

| 경로 | 이유 | 생성 주체 |
|------|------|-----------|
| `docs/{feature}/02-design/interface-contract.md` | Gate 2 시스템 합성물, 여러 agent 입력 혼합 | CTO 자동 |
| `docs/dashboard.html` | 플러그인 유틸리티 출력, feature-scope 아님 | `/vais dashboard` |

추가 예외는 PR 리뷰에서 합의.

### 2.5 마이그레이션 매핑 (기존 ad-hoc → 표준)

| 기존 경로 | 신규 경로 | 처리 |
|-----------|-----------|------|
| `02-design/infra.md` | `02-design/infra-architect.md` | rename + agent markdown 업데이트 |
| `02-design/review.md` | `02-design/ui-designer.review.md` | rename |
| `03-do/strategy.md` | `03-do/product-strategist.md` | rename |
| `04-qa/performance.md` | `04-qa/performance-engineer.md` | rename |
| `02-design/interface-contract.md` | 유지 (예외) | 변경 없음 |

> ⚠️ 레거시 경로 사용 중인 기존 피처 문서가 있으면 `docs/_legacy/` 로 이동하지 않고 **현 위치 유지** (회귀 방지). 신규 피처부터 적용.

## 3. `vais.config.json` 스키마 확장

기존 `workflow.docPaths` 를 확장 (CP-6 결정 반영):

```jsonc
{
  "workflow": {
    "docPaths": {
      "main": "docs/{feature}/{phase}/main.md",
      "subDoc": "docs/{feature}/{phase}/{slug}.md",            // 신규
      "subDocQualified": "docs/{feature}/{phase}/{slug}.{qualifier}.md",  // 신규
      "systemArtifacts": [                                      // 신규 (예외 리스트)
        "docs/{feature}/02-design/interface-contract.md"
      ]
    },
    "phaseFolders": {
      "ideation": "00-ideation",
      "plan": "01-plan",
      "design": "02-design",
      "do": "03-do",
      "qa": "04-qa",
      "report": "05-report"
    },
    "subDocPolicy": {                                           // 신규
      "enforcement": "warn",      // warn | retry | fail (v0.57 은 warn)
      "autoIndex": true,          // main.md 에 sub-doc 링크 자동 주입 여부 (CP-3=C)
      "reportPhase": "single"     // 05-report 는 sub-doc 없이 main.md 단일 (CP-5=B)
    }
  }
}
```

**소비자**:
- `scripts/doc-validator.js` — 경로 검증
- `lib/status.js` — sub-doc 인벤토리
- `scripts/auto-judge.js` — fallback 파싱 소스

## 4. 파일 상단 메타 헤더 (권장, 필수 아님)

각 sub-doc 상단 1~3 줄에 표준 헤더를 권장:

```markdown
> Author: {agent-slug}
> Phase: {NN-phase}
> Refs: docs/{feature}/01-plan/main.md, docs/{feature}/02-design/main.md
```

이유: (1) 사용자가 파일 열자마자 맥락 확인, (2) 미래에 doc-validator 가 메타 파싱 가능.

## 5. 병렬 에이전트 충돌 방지 (CP-4=A 반영)

| 시나리오 | 규칙 |
|----------|------|
| Do 단계 frontend + backend + test-engineer 병렬 | 각자 `{slug}.md` Write. **main.md 는 C-Level 이 세 sub-doc 수집 후 작성** |
| Design 단계 ui-designer + infra-architect 병렬 | 각자 `{slug}.md` Write. main.md 는 CTO 작성 |
| Gate 2 interface-contract.md | CTO 가 두 sub-doc 읽고 합성 — sub-agent 수정 금지 |
| qa-engineer → incident-responder 순차 | 각자 `{slug}.md` Write. main.md 업데이트는 CTO |

## 6. 변경 범위 (이 sub-plan 내 직접 변경)

**이 sub-plan 에서 바뀌는 파일은 0개**. 다만 아래를 합의:

- [ ] `vais.config.json` 스키마 확장안 (§3) → sub-plan 05 에서 실제 반영
- [ ] 마이그레이션 매핑표 (§2.5) → sub-plan 02 에서 agent markdown 업데이트
- [ ] 예외 리스트 (§2.4) → 신규 추가는 PR 리뷰

## 7. 성공 기준

| # | Criteria | 검증 |
|---|----------|------|
| SC-00-1 | 경로 패턴 3종 (main / sub-doc / qualified sub-doc) + 예외 리스트 확정 | 본 문서 §2 |
| SC-00-2 | 마이그레이션 매핑표 5건 확정 | §2.5 |
| SC-00-3 | `vais.config.json` 스키마 확장안 제시 | §3 |
| SC-00-4 | 병렬 쓰기 충돌 방지 규칙 4건 정의 | §5 |

## 8. 리스크 & 완화

| 리스크 | 완화 |
|--------|------|
| 기존 피처 문서가 레거시 경로 유지 → 혼란 | subDocPolicy.enforcement=warn 으로 도입, 기존 피처는 그대로 |
| 슬러그 충돌 (두 agent 가 같은 이름) | frontmatter.name 은 전역 유니크 (v0.56 검증 완료). 향후 agent 추가 시 skill-validator 가 체크 |
| qualifier 남발 | sub-plan 03 에서 `.review` / `.audit` / `.bench` 등 권장 qualifier 사전 정의 |

## 9. 다음

- sub-plan 01: 위 컨벤션을 C-Level agent markdown 에 반영
- sub-plan 02: 각 sub-agent markdown 에 자기 sub-doc 작성 규칙 반영
- sub-plan 03: 템플릿 생성
