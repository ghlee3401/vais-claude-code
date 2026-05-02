# mui-design-system-import — Ideation

> Phase: 💡 ideation (optional)
> Owner: CEO
> Date: 2026-04-29
> Status: completed

## [CEO] Ideation Summary

### 문제 (Problem)

- ui-designer agent가 design phase 진입 시 참조할 **공통 토큰/컴포넌트 카탈로그가 없음**
- 결과: phase마다 색/spacing/typography가 달라지고, 같은 컴포넌트(Button, Input 등)를 매번 다른 props/anatomy로 정의
- 사용자 관찰: "ui-designer가 일관된 제품을 만들지 못한다"
- 보유 자원: `Material UI for Figma (and MUI X) (Community).fig` (11MB, 로컬)
- 인프라: design-system MCP는 v0.61.0에서 활성화됨(`mcp/design-system-server-runner.js`)이나 **검색할 카탈로그가 비어 있음**

### 가설 (Hypothesis)

> Figma MUI 자료에서 토큰·컴포넌트 메타데이터를 추출해 `design-system/` 카탈로그를 구축하고, ui-designer agent가 design phase 진입 시 이를 자동 참조하도록 통합하면, 산출물 일관성이 일관성-측정-기준(예: 토큰 사용률)으로 측정 가능한 수준까지 향상된다.

### 핵심 제약 (Constraint)

- **`.fig`는 Figma desktop client 전용 바이너리** — Node.js로 직접 파싱 불가
- 우회 옵션 3가지 검토 후 **A. Figma REST API (free 계정)** 채택
  - file API(styles/components)는 free에서 가능
  - Variables API는 Enterprise 전용 → 필요 시 fills/effects 역공학으로 보완

### Lake 범위 (사용자 명시 승인 — Rule #9)

| # | 항목 | 산출물 위치 |
|---|------|------------|
| 1 | 토큰 카탈로그 (color/typo/spacing/radius/shadow) | `design-system/tokens/*.json` |
| 2 | MUI 핵심 컴포넌트 메타데이터 (Button/Input/Card/Modal/Tab/Dialog 등) | `design-system/components/*.md` |
| 3 | ui-designer agent 자동 참조 통합 | `agents/cto/ui-designer.md` 수정 + (필요 시) hook |
| 4 | design-system MCP indexing | `vais-design-system` MCP가 1·2를 search/stack_search로 색인 |
| 5 | **재실행 가능한 import 파이프라인 + 버전 관리** | `scripts/import-mui-design-system.js` + `design-system/lockfile.json` + `design-system/CHANGELOG.md` |

> 5개 항목은 분리 시 통합 비용이 더 큼 → 단일 피처로 묶되, plan phase에서 sub-doc 분리(`tokens-catalog`, `component-metadata`, `ui-designer-integration`, `mcp-indexing`, `import-pipeline-versioning`)로 점진 산출.

#### 지속 갱신 요구사항 (사용자 추가 합의 — 2026-04-29)

본 피처는 **1회성 import가 아닌 재실행 가능 파이프라인**으로 설계해야 한다. 갱신 시나리오:

| 시나리오 | 메커니즘 |
|---------|---------|
| Figma MUI 파일 업데이트 | 동일 `file key` 로 재실행 → `lockfile.json` diff 산출 → CHANGELOG entry |
| MUI npm 메이저 버전업 | `@mui/material/styles` createTheme 디폴트 재추출 + breaking change 경고 |
| 사내 커스텀 토큰 추가 | override layer (`design-system/tokens/_overrides.json`) 가 Figma 위에 적용 |
| 토큰 ID 변경/삭제 | migration 가이드 자동 생성 (deprecated 토큰은 `aliases` 로 호환 유지) |
| ui-designer 가 새 토큰 즉시 인식 | MCP indexing 이 lockfile 변경 시 자동 재색인 |

**플랜 단계 핵심 결정 포인트**: lockfile 포맷, 버전 정책(SemVer? 날짜 기반?), override 레이어 우선순위, breaking change 감지 알고리즘.

### Ocean (이번 피처 밖)

- 실제 React 컴포넌트 코드 라이브러리 빌드 → 별도 피처 `design-system-react-components`
- MUI X 고급 컴포넌트 (DataGrid, DatePicker, Charts 등)
- 다크 모드 / 테마 토큰 (1차 산출 후 별도 피처)
- Figma plugin 자체 개발

### 위험 (Risk)

| 위험 | 영향 | 완화 |
|------|------|------|
| Figma free 계정에서 Variables 추출 불가 | 토큰 정확도 ↓ | fills/effects 역공학 + MUI npm 패키지 createTheme 디폴트로 cross-check |
| `.fig` 클라우드 업로드(라이선스/저작권) | Community 라이선스 확인 필요 | CSO compliance-auditor 단계에서 검증 |
| 기존 design-system MCP 스키마 호환성 | Plan 단계 불확실성 | CTO infra-architect가 plan에서 MCP 스키마 매핑 명시 |
| 동시 진행 피처 컨텍스트 분산 | `subagent-architecture-rethink` 진행 중 | report 완료 확인 후 본 피처 plan 시작 권장 |

### 다음 단계 (CEO 추천 — 2026-04-29 갱신)

| 항목 | 결정 |
|------|------|
| 시나리오 | S-2 변형 (내부 인프라 피처 — product 정의가 표준에 종속) |
| 다음 C-Level | **CTO (CPO 생략)** — 본 피처는 ui-designer agent(내부) 대상이며 product 정의는 Material Design 3 spec + MUI npm 디폴트가 사실상 결정함. CPO 단계 90%가 "MUI 표준 따름"으로 귀결되어 의식적 작업이 거의 없음. 핵심 결정은 모두 technical (Figma API 추출, MCP 스키마, 갱신 파이프라인). |
| 그 다음 | CSO (Figma Community 파일 라이선스 검토 + .fig 클라우드 업로드 리스크) → COO (선택 — 자동 갱신 cron / CI 검증 단계) |

#### CPO 생략 판단 근거

| 기준 | 일반 신규 서비스 | 본 피처 |
|------|-----------------|---------|
| 최종 사용자 | 외부 고객 | ui-designer agent (내부) |
| Persona/JTBD | 필요 | 불필요 — agent 사용 패턴 정해짐 |
| "무엇을 만들지" | 불확실 | 명확 — MUI 토큰 + MD3 spec |
| 백로그/sprint plan | 필요 | plan 1회로 충분 |
| 핵심 결정 영역 | product | technical |

### 결정 요약 (Decision Record)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| 피처명 | `mui-design-system-import` | 출처(MUI) + 행위(import) 명확 |
| .fig 흡수 방식 | A. Figma REST API (free) | 자동화 + 외부 계정 1회만, Pro 불필요 |
| Lake 범위 | 토큰 + 컴포넌트 + ui-designer 통합 + MCP indexing + **재실행 파이프라인+버전관리** (5개 모두) | 분리 시 통합 비용이 더 큼 + 지속 갱신은 1회성 import로 불가 |
| 다음 C-Level | **CTO (CPO 생략)** | 본 피처는 internal infra이고 product 정의가 MUI/MD3 spec에 종속됨 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-29 | CEO ideation 초안 (피처명·흡수방식·Lake·다음단계 합의) |
| v1.1 | 2026-04-29 | Lake에 #5 "재실행 가능 import 파이프라인+버전관리" 추가 (지속 갱신 요구사항 반영). 다음 C-Level을 CPO→CTO로 변경 (CPO 생략 근거 명시). |
