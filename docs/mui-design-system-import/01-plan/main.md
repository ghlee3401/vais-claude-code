# mui-design-system-import — 기획서 v2.0 (Standard, 강행 모드)

> ⛔ Plan 단계 범위: 분석·결정만. 프로덕트 파일 생성·수정은 Do 단계.
> 📝 Standard 템플릿 + CTO 강행 모드 (PRD 부재 — CPO 생략 합의, ideation v1.1 컨텍스트로 대체).
> Phase: 📋 plan | Owner: CTO | Date: 2026-05-02 (v2.0)
>
> **v2.0 변경 사유**: 사용자 의도 재확인 (2026-05-02) — 본 피처는 **Figma 분석 결과를 MD 카탈로그로 박제하는 것**이지, ui-designer 가 런타임에 baseline 을 자동 참조하는 시스템을 만드는 것이 아님. v1.0/v1.1 의 hook 수정·MCP adapter·router·`_active.json` 라우팅은 모두 폐기.

## 요청 원문

> "/Users/ghlee/Downloads/Material UI for Figma (and MUI X) (Community).fig 여기의 피그마 파일을 읽어서 디자인 시스템을 구축해줘. 우리가 지금 ui designer가 실행을 할 때 디자인 시스템이 없기 때문에 일관된 제품을 만들지 못하는 것 같아."
>
> 추가 의도 확인 (2026-05-02): "figma파일을 분석한 다음에 그거를 design.md 파일로 만든다는거지 사용자가 쓸 때 부른다는 의미가 아니었어"

## In-scope

- Figma MUI 파일 분석 → 디자인 시스템 카탈로그 추출 (color/typography/spacing/radius/shadow + 19개 핵심 컴포넌트)
- 분석 결과를 **사람·agent 가 읽는 MD 카탈로그**로 박제 — `design-system/mui/MASTER.md` + tokens/ + components/
- multi-DS 디렉토리 컨벤션 (`design-system/{ds}/`) + 등록 인덱스 (`INDEX.md`) — 미래 다른 DS 추가 가능하도록 폴더 패턴만
- 재실행 가능한 분석 스크립트 + 멱등 + lockfile + CHANGELOG (Figma 갱신 시 같은 스크립트 재실행)
- (선택) `agents/cto/ui-designer.md` "## 문서 참조 규칙" 섹션에 카탈로그 위치 한 줄 추가
- 기술적 전제조건: Figma REST API 접근(Personal Access Token, free 계정 OK), MUI npm 패키지 (`@mui/material@^6` createTheme 디폴트 cross-check), Node.js 18+

> **본 피처에서 채우는 DS**: `mui` 만. 다른 DS(예: `nc`, `antd`)는 동일 패턴의 별도 피처로 추가.

## Out-of-scope

- **런타임 통합 일체 폐기 (v2.0)**: hook 수정 / MCP adapter / `lib/design-system-router.js` / `_active.json` 라우팅 / hookSpecificOutput.additionalContext 주입 — 본 피처 책임 아님
- React 컴포넌트 코드 라이브러리 빌드 — 별도 피처
- MUI X 고급 컴포넌트 (DataGrid, DatePicker, Charts, TreeView)
- 다크 모드 / 테마 토큰 / RTL
- ui-designer agent 의 본문 대규모 개편 (참고 문서 1줄 추가는 In-scope 의 선택 항목)
- 자발 감지 확장 후보는 `## 관찰 (후속 과제)` (Rule #9)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | ui-designer 가 design phase 에서 참조할 **잘 정리된 디자인 시스템 카탈로그가 없음**. 각 피처마다 즉흥 토큰/컴포넌트 사용 |
| **Solution** | Figma MUI 자료 + MUI npm 디폴트를 분석해 **MD 카탈로그**로 박제 (`design-system/mui/`). ui-designer 는 design phase 에서 이 카탈로그를 참조 문서로 사용 |
| **Effect** | 카탈로그가 single source of truth 로 존재 → ui-designer 산출물의 토큰/컴포넌트 어휘가 자연스럽게 일관 |
| **Core Value** | "**박제된 카탈로그 + 멱등 재생성**" — 단순한 1회 분석 산출물이 모든 피처의 일관성 기준이 됨 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | 일관성을 강제하는 카탈로그가 없음. 사용자는 자동화/런타임 통합을 원하지 않고 **카탈로그 박제** 자체가 목적 |
| WHO | ui-designer agent (참조 문서로 사용) + 사람 디자이너/개발자 (가이드로 읽음) |
| RISK | Figma free 계정 Variables 한도 / Figma Community 라이선스 / 분석 스크립트 멱등성 / MUI 메이저 버전 변경 |
| SUCCESS | (1) `design-system/mui/MASTER.md` 카탈로그 존재 (토큰 5종 + 컴포넌트 19개) (2) 재실행 시 lockfile diff 정확 (3) 라이선스/시크릿 통과 |
| SCOPE | Figma 분석 + MD 박제 + 멱등 재실행 + multi-DS 폴더 컨벤션 |

---

## Decision Record (multi-owner)

| # | Decision | Owner | Rationale | Source topic |
|---|----------|:-----:|-----------|--------------|
| 1 | 흡수 출처 = Figma REST API (free, file API) + MUI npm createTheme cross-check | cto | Variables 우회. 정확도 손실은 cross-check 로 보완 | `architecture-plan.md` |
| 2 | 카탈로그 위치 = `design-system/{ds-name}/` (DS별 서브폴더, multi-DS 지원) | cto | 사용자 명시 — 다른 DS 도 추가 가능해야 함. 폴더 컨벤션만 정함 | `architecture-plan.md` |
| 3 | ~~3-layer 모델~~ → **단일 카탈로그 모델 (v2.0)**. 카탈로그가 하나의 정적 자료, 런타임 라우팅·layer 합성 없음 | cto | (v2.0) 사용자 의도 = 박제. layer 합성·hook 주입은 본 피처 책임 외 | `architecture-plan.md` |
| 4 | 토큰 = MD (사람·agent 읽기) + (선택) JSON (기계 읽기, 후속 빌드 도구용) | cto | (v2.0) MD 우선. JSON 은 후속 피처에서 결정 가능 | `architecture-plan.md` |
| 5 | 재실행 = `scripts/import-{ds}-design-system.js` (DS별 독립 멱등). lockfile/CHANGELOG 도 `design-system/{ds}/` 하위 | cto | DS 별 출처/주기 다르므로 독립 스크립트. 본 피처는 `import-mui-design-system.js` 만 작성 | `architecture-plan.md` |
| 6 | ~~MCP adapter~~ → **MCP 변경 없음 (v2.0)**. design_search 는 vendor 기존 동작 그대로 | cto | (v2.0) 사용자 의도 = 박제. 카탈로그가 검색되어야 한다면 후속 피처로 처리 | — |
| 7 | ~~DS 라우팅 `_active.json`~~ → **INDEX.md 만 (v2.0)**. 어떤 DS 들이 등록됐는지 사람이 보는 인덱스. 라우팅 로직 없음 | cto | (v2.0) 라우팅은 런타임 통합 영역. 박제만 한다면 INDEX.md 로 충분 | `architecture-plan.md` |
| 8 | ui-designer.md 변경 = "## 문서 참조 규칙" 에 카탈로그 위치 한 줄 추가 (선택) | cto | (v2.0) 사용자 의도가 ui-designer 가 자동으로 부르는 게 아니라 단순 참조이므로, 안내문 추가만 | `impact-analysis.md` |

---

## 0. 아이디어 요약

| Key | Value |
|-----|-------|
| 한 줄 설명 | Figma MUI 자료를 분석해 MD 카탈로그로 박제. ui-designer 와 사람이 참조 문서로 사용 |
| 배경 | 카탈로그가 없어서 매 피처마다 즉흥 토큰/컴포넌트 사용 |
| 타겟 사용자 | ui-designer agent (참조) + 사람 디자이너/개발자 (가이드) |
| 핵심 시나리오 | (1) 본 피처 do 에서 분석 스크립트 1회 실행 → 카탈로그 박제. (2) Figma 갱신 시 같은 스크립트 재실행 → lockfile diff 산출 + CHANGELOG 갱신. (3) 다른 피처 design phase 에서 ui-designer 가 카탈로그 MD 를 참조 |

## 0.7 PRD 입력 (CTO 강행 체크)

| Key | Value |
|-----|-------|
| PRD 경로 | `docs/mui-design-system-import/03-do/main.md` (없음) |
| 완성도 | missing → 강행 모드 |
| 검사 시각 | 2026-04-30 (v1.0) / 2026-05-02 (v2.0 사용자 의도 재확인) |
| 컨텍스트 대체물 | `docs/mui-design-system-import/00-ideation/main.md` v1.1 + 사용자 명시 정정 (2026-05-02) |

### 강행 모드 사유 + 가정

- 사용자 선택: CP-0 에서 B (강행) 선택
- ideation 합의: CPO 생략 (internal infra)
- v2.0 가정한 요구사항: (1) MUI v6+, (2) Figma Community 라이선스 = OFL/MIT 호환 (CSO 검증 필요), (3) 카탈로그가 박제만 되어 있어도 ui-designer 가 자연스럽게 참조하면 일관성 향상 — qa SC-02 측정으로 검증

## 2. Plan-Plus 검증

### 2.1 의도 발견 (v2.0 갱신)

근본 문제는 "ui-designer 산출물이 피처마다 달라지는 현상" → 그 해결의 본질은 **카탈로그가 박제되어 있는 것** 자체. 런타임 자동 호출/주입은 **별도의 후속 가치 제안**이지, 본 피처의 책임이 아님. v1.0/v1.1 은 이 분리를 놓쳤음.

### 2.2 대안 탐색

| # | 대안 | 장점 | 단점 | 채택 |
|---|------|------|------|:----:|
| 1 | MUI npm 만 흡수 (Figma 무시) | 즉시 시작 | Figma 사내 커스텀 손실 | ❌ |
| 2 | Figma REST API + MUI npm cross-check | 정확도 ↑, free 계정 OK | API token 1회 설정 | ✅ |
| 3 | Figma plugin export 수동 | 정확도 최고 | 갱신마다 수동 | ❌ |
| 4 | ~~런타임 hook/MCP 통합~~ | 자동화 | (v2.0) 사용자 의도 외, 과잉 설계 | ❌ (v2.0 폐기) |

### 2.3 YAGNI 리뷰 (v2.0)

- [x] 현재 필요한 것만 (분석 + 박제 + 멱등). 런타임 통합 폐기
- [x] 미래 요구사항 과잉 설계 없음 (라우팅·테마 변형·토큰 편집 UI 모두 제외)
- [x] 제거된 항목 (v1.0 → v2.0): hook 수정, MCP adapter, `lib/design-system-router.js`, `_active.json`, hookSpecificOutput.additionalContext

## 4. 기능 요구사항 (요약, v2.0)

| # | 기능 | 설명 | 우선순위 | 관련 파일 |
|---|------|------|:-------:|-----------|
| 1 | Figma 파일 메타 추출 | file key + Personal Access Token → styles/components 노드 추출 | Must | `scripts/import-mui-design-system.js` |
| 2 | MUI npm 디폴트 cross-check | createTheme() 디폴트 토큰 추출 → Figma 와 비교 | Must | `scripts/import-mui-design-system.js` |
| 3 | 토큰 카탈로그 MD 생성 | color/typo/spacing/radius/shadow → 사람 읽는 MD | Must | `design-system/mui/tokens/*.md` |
| 4 | 컴포넌트 메타 MD 생성 | 19개 핵심 컴포넌트 — anatomy/variants/sizes/states/a11y/example | Must | `design-system/mui/components/*.md` |
| 5 | MASTER.md 합성 | 카탈로그 인덱스 + 출처/라이선스 + 사용 가이드 | Must | `design-system/mui/MASTER.md` |
| 6 | INDEX.md (DS 등록) | 등록된 DS 목록 (사람 읽음). 라우팅 로직 X | Must | `design-system/INDEX.md` |
| 7 | lockfile + CHANGELOG | 재실행 시 diff, semver, Keep a Changelog | Must | `design-system/mui/lockfile.json`, `CHANGELOG.md` |
| 8 | ui-designer.md 안내문 | "참조 카탈로그 위치" 한 줄 추가 | Nice | `agents/cto/ui-designer.md` |

> v1.0/v1.1 의 #6 "ui-designer 자동 참조 통합" / #7 "MCP indexing" / #10 "라우팅" 은 v2.0 에서 폐기.

## 5. 정책 (비즈니스 규칙, v2.0)

| # | 정책 | 규칙 |
|---|------|------|
| 1 | 토큰 ID 호환성 | ID 변경 시 `aliases` 로 호환 유지. 삭제는 1 minor 이후 |
| 2 | 재실행 멱등성 | 동일 입력 → 동일 출력. 비결정 source 금지. DS 별 독립 |
| 3 | API token 보안 | Figma PAT = 환경변수 `FIGMA_PAT`. 커밋 금지 |
| 4 | 라이선스 표기 | `{ds}/MASTER.md` 상단에 출처 + 라이선스 명시 (mui = Apache-2.0 + Figma Community) |
| 5 | DS 추가 패턴 | 새 DS 는 `import-{ds}-design-system.js` + `design-system/{ds}/` 동일 구조. INDEX.md 에 등록 |
| 6 | 카탈로그 = 박제 | 카탈로그는 정적 자료. 런타임 동작 없음 (v2.0) |

## 6. 비기능 요구사항

| 항목 | 요구사항 | 기준 |
|------|---------|------|
| 성능 | import 스크립트 < 60초 | 단일 실행 시간 |
| 보안 | API token 환경변수, secret-scanner 통과 | CSO Gate |
| 유지보수성 | DS 별 독립 — 새 DS 추가가 기존 DS 영향 없음 | 새 importer 추가 시 기존 파일 수정 0건 |
| 가독성 | MASTER.md / 컴포넌트 MD 가 사람이 읽고 바로 사용 가능 | qa 단계 visual review |

## Success Criteria (v2.0)

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-01 | `design-system/mui/MASTER.md` + tokens 5개 + components 19개 MD 존재 | 파일 수/구조 검증 |
| SC-02 | `import-mui-design-system.js` 재실행 시 (동일 입력) lockfile diff 0 / (변경 시) 정확한 diff | 동일 입력 2회 + 토큰 1개 변경 시나리오 |
| SC-03 | INDEX.md 에 mui DS entry 등록 + 라이선스/출처 명시 | grep |
| SC-04 | secret-scanner + dependency-analyzer 통과 (FIGMA_PAT 패턴 false positive 없음, MUI/axios 라이선스 호환) | CSO Gate |
| SC-05 | (선택) ui-designer.md 에 카탈로그 위치 안내문 1줄 추가 | grep |

> v1.0 의 SC-02 "ui-designer 가 baseline 을 100% Read" / SC-04 "MCP design_search 에 노출" 은 v2.0 에서 폐기 (런타임 통합 폐기).

## Impact Analysis (v2.0)

### Changed Resources

| Resource | Type | Change |
|----------|------|--------|
| `design-system/INDEX.md` | create | 등록된 DS 목록 (mui entry) |
| `design-system/mui/MASTER.md` | create | mui DS 카탈로그 인덱스 |
| `design-system/mui/tokens/{color,typography,spacing,radius,shadow}.md` | create | 토큰 5종 MD |
| `design-system/mui/components/{19개}.md` | create | 컴포넌트 19개 MD |
| `design-system/mui/lockfile.json` | create | source-of-truth |
| `design-system/mui/CHANGELOG.md` | create | 버전 이력 |
| `scripts/import-mui-design-system.js` | create | 분석 + 박제 파이프라인 |
| `scripts/import-mui-helpers/` | create | normalize/resolve/emit 모듈 |
| `tests/import-mui/*.test.js` | create | unit + integration |
| `agents/cto/ui-designer.md` | modify | (선택) "참조 카탈로그 위치" 1줄 추가 |
| `.env.example` | modify | `FIGMA_PAT=` 추가 |
| `package.json` | modify | dev dep `@mui/material@^6` (cross-check 용) + `axios` 또는 `node-fetch` |

> v1.0 의 변경 자원 중 폐기: `hooks/design-mcp-trigger.js` 수정 / `mcp/design-system-server-runner.js` 수정 / `lib/design-system-router.js` / `_active.json` / `vais.config.json` orchestration.designSystem 키. 모두 본 피처 책임 외.

### Verification

- [ ] 분석 스크립트 멱등성 테스트
- [ ] 라이선스 통과 (CSO compliance-auditor)
- [ ] 시크릿 패턴 통과 (secret-scanner)
- [ ] breaking change 없음 — 기존 파일 수정 영역이 매우 좁음 (ui-designer.md 1줄 + .env.example + package.json)

## 7. 기술 스택

| 영역 | 기술 | 이유 |
|------|------|------|
| import 파이프라인 | Node.js 18+ (CJS, lib/ 패턴 일치) | 프로젝트 표준 |
| Figma 연동 | `axios` 또는 `node-fetch` + Figma REST API | API 호출 표준 |
| MUI 토큰 | `@mui/material@^6` createTheme | npm 디폴트 cross-check |
| 토큰 출력 포맷 | Markdown (사람·agent 읽기 우선) + (선택) JSON | v2.0 — MD 우선, JSON 후속 |
| 검증 | Ajv (JSON 사용 시 schema 검증) | 토큰 일관성 |

## 관찰 (후속 과제)

> Rule #9: 자발 감지 확장 후보. In-scope 자동 승계 금지.

- ui-designer 가 카탈로그를 자동 참조하도록 hook/MCP 통합 — **별도 후속 피처** (예: `design-system-runtime-integration`). v2.0 에서 본 피처 책임에서 제외됨
- vendor/ui-ux-pro-max BM25 검색에 카탈로그 포함 — 후속 피처 후보
- MUI X (DataGrid, DatePicker) 흡수 — 후속 피처 (`mui-x-design-system-import`)
- 다크 모드 / RTL 토큰 변형 — 후속 피처
- Style Dictionary 기반 다중 출력 (CSS/JS/iOS) — 후속 피처
- 사내 커스텀 디자인 시스템 import — 동일 패턴으로 별도 피처

---

## Topic Documents (v0.57+)

| Topic | 파일 | Owner | 한 줄 요약 |
|-------|------|:-----:|-----------|
| Architecture Plan | `architecture-plan.md` | cto | Figma + MUI npm 분석 → MD 박제 4-stage 파이프라인 + 디렉토리 컨벤션 + lockfile 스키마 |
| Impact Analysis | `impact-analysis.md` | cto | v2.0 — 신규 자원 12개 + 수정 자원 3개 (모두 좁은 범위) + 회귀 시나리오 |
| Tech Risks | `tech-risks.md` | cto | v2.0 — 위험 6건 (런타임 통합 폐기로 R-4/R-7 등급 LOW 로 하향) |

## Scratchpads

| Agent | 경로 | 비고 |
|-------|------|-----|
| (none) | — | CTO 직접 작성 phase |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-30 | CTO plan 초기 작성 (Standard 템플릿, 강행 모드). |
| v1.1 | 2026-05-01 | CTO 재진입 — multi-DS 지원 채택. baseline 위치 = `design-system/{ds}/`, 3-layer 모델, Decision Record #2/#3 갱신 + #7 신규. |
| **v2.0** | **2026-05-02** | **CTO 재진입 (사용자 의도 재확인) — 런타임 통합 일체 폐기. 본 피처 = "Figma 분석 → MD 카탈로그 박제" 만. Decision Record #3/#6/#7 단순화, In-scope 축소, Out-of-scope 에 런타임 통합 전부 명시, 기능 #6/#7/#10 폐기, 정책 #1/#2 통폐합, SC-02/SC-04 폐기, Impact Analysis 자원 7개 폐기. v1.x 의 hook/MCP/router 결정은 모두 후속 피처 후보로 이관 (## 관찰).** |

<!-- template version: plan-standard v0.58.5 (강행 모드, sub-agent 미위임, v2.0 정정) -->
