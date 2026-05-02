---
owner: cto
topic: tech-risks
phase: plan
feature: mui-design-system-import
---

# Tech Risks — mui-design-system-import

> Owner: CTO | Phase: plan | Date: 2026-04-30

## 한 줄 요약 (v2.0)

핵심 위험 — Variables Enterprise 한도 / Figma Community 라이선스 / 동시 진행 / MUI 메이저 변경 — 와 완화 전략. **v2.0**: 런타임 통합 폐기로 R-3 (vendor 미수정 제약) / R-4 (hook breaking change) / R-7 (multi-DS 라우팅 복잡도) 모두 N/A 처리 (본 피처 책임 외).

---

## R-1 (HIGH) — Figma Variables API가 free 계정에서 미동작

### 영향

토큰의 정식 정의(name, alias, scope)에 직접 접근 불가. fills/effects/typography 노드에서 역추출해야 함 → 토큰 ID 추론 정확도 저하 가능.

### 시나리오

- Figma 디자이너가 `color/primary/main` 으로 명명한 Variable을 free 계정 API는 노출 안 함
- 대신 `Style: Primary / 500` 같은 Paint Style만 보임 → 이름 매칭으로 역추출

### 완화

| 단계 | 조치 |
|------|------|
| Stage 1 | Paint Styles + Text Styles + Effect Styles 이름에서 토큰 ID 추론 (`/` 구분자 정규식) |
| Stage 1 | MUI npm createTheme 디폴트와 cross-check — 색 hex/typography rem 일치 시 신뢰도 ↑ |
| Stage 3 | resolve 시 source 표기 — UI에서 "Figma 추출 vs MUI 디폴트 vs override" 가시화 |
| Stage 4 | lockfile에 `confidenceScore` 필드 — 두 source 일치 = 100, Figma만 = 70, MUI만 = 50 |

### 잔존 위험

낮음 — MUI Figma 파일은 community 표준이라 Paint Style 명명이 MUI palette key와 1:1 매핑됨이 확인됨 (예: `Primary/500` ↔ `palette.primary.main`).

---

## R-2 (MEDIUM) — Figma Community 파일 라이선스 / 클라우드 업로드

### 영향

- 사용자 로컬 `.fig` 파일을 Figma 클라우드에 업로드 = file key 발급 필요
- Material UI for Figma (Community) 라이선스 확인 필요 — 추출한 토큰을 본 프로젝트에 포함 가능 여부

### 사실 확인 (사전 조사)

- MUI 자체: Apache-2.0 (오픈소스)
- "Material UI for Figma" Community 파일: 일반적으로 Figma Community 라이선스 적용 — 무료 사용 + 수정 + 재배포 가능 (단, 어트리뷰션 권장)
- 확정 필요: 본 .fig 파일의 `Library Description` 에 명시된 라이선스 텍스트

### 완화

| 조치 | 책임 |
|------|------|
| .fig 파일을 Figma Community에서 다운로드 시 라이선스 페이지 캡처 | 사용자 |
| MASTER.md 상단에 "Source: Material UI for Figma (Community), MUI Apache-2.0" 표기 + 어트리뷰션 링크 | import 스크립트 자동 |
| CSO compliance-auditor 검토 | CSO phase |
| 클라우드 업로드 시 Figma 계정 보안 — Personal Access Token rotate, file 공유 권한 best practice | 사용자 가이드 (README) |

### 잔존 위험

중간 → 낮음 (CSO 검토 통과 시).

---

## R-3 (N/A in v2.0) — ~~vendor/ui-ux-pro-max 미수정 제약~~

> **v2.0**: 본 피처는 vendor 를 호출하거나 통합하지 않음. MCP adapter 폐기로 본 위험은 본 피처 범위 외. 런타임 통합 후속 피처에서 다시 검토.

<details><summary>v1.x 원문 (참고용)</summary>

### 영향

CLAUDE.md "Do NOT" 규칙: vendor/ 내 파일 직접 수정 금지. design-system/ 카탈로그를 vendor BM25 인덱스에 통합하려면 우회 필요.

### 완화

| 옵션 | 채택 |
|------|:----:|
| A. vendor/ui-ux-pro-max에 PR — 시간 비용 ↑, 외부 호환 깨짐 위험 | ❌ |
| B. mcp/design-system-server-runner.js에 adapter 레이어 추가 — vendor 호출 후 design-system/ grep 결과 머지 | ✅ |
| C. 별도 MCP 서버 추가 (vais-design-system-baseline) — 복잡도 ↑ | ❌ |

→ 채택: B. adapter 패턴.

### 구현 스케치

```javascript
// mcp/design-system-server-runner.js (수정)
async function designSearch(query) {
  const vendorResults = await callVendor(query);          // 기존
  const baselineResults = await searchBaseline(query);    // 신규: design-system/ grep
  return mergeResults(baselineResults, vendorResults);    // baseline 우선
}
```

### 잔존 위험

낮음 — adapter는 명시적 코드, 회귀 테스트 가능.

</details>

---

## R-4 (N/A in v2.0) — ~~hooks/design-mcp-trigger.js breaking change~~

> **v2.0**: hook 수정 본 피처 범위 외. 기존 hook 동작 그대로 유지 → breaking change 가능성 0. 런타임 통합 후속 피처에서 다시 검토.

<details><summary>v1.x 원문 (참고용)</summary>

### 영향

기존 피처(`clevel-doc-coexistence`, `subagent-architecture-rethink`, `design-system-mcp-activation`)가 design phase를 재실행하면 baseline 분기에 의해 동작이 달라질 수 있음. 산출물 회귀 가능성.

### 완화

| 단계 | 조치 |
|------|------|
| 분기 추가 정책 | baseline은 **추가만** (기존 피처별 MASTER 생성 동작 유지) |
| feature flag | `vais.config.json > orchestration.mcp.designSystemBaseline.enabled` (기본 `true`, 옵트아웃 가능) |
| 회귀 테스트 | `tests/hooks/design-mcp-trigger.test.js` — baseline 존재/부재 양쪽 시나리오 |
| 단계적 도입 | v0.62.0 minor — feature flag로 활성, 1 minor 후 디폴트 ON 유지 |
| 문서 | CHANGELOG.md 에 "design-system-baseline 도입" 명시 |

### 잔존 위험

낮음 → 매우 낮음 (옵트아웃 가능 + 회귀 테스트).

</details>

---

## R-5 (LOW) — 동시 진행 피처 컨텍스트 분산

### 영향

`subagent-architecture-rethink` 가 v0.61.x QA 완료 / 본 피처 plan 시작 — 동시 진행 시 코드베이스 충돌 가능성.

### 완화

- subagent-architecture-rethink는 status 기준 phase=qa(완료) → 충돌 면적 작음
- 본 피처 do phase 진입 전 subagent-architecture-rethink report 완료 확인
- 충돌 시 본 피처 plan 산출물 retry (Plan은 코드 변경 없음 — 충돌 없음)

### 잔존 위험

매우 낮음.

---

## R-6 (LOW) — MUI 메이저 버전 변경

### 영향

`@mui/material@7` 등 메이저 변경 시 createTheme 디폴트 변경 → import 결과 변화.

### 완화

- `package.json` 에 `^6.0.0` 핀 (caret minor 허용)
- 메이저 업그레이드는 별도 피처 (`mui-design-system-upgrade-v7` 등)로 처리
- lockfile에 `muiNpm.version` 명시 → 변경 감지 자동

### 잔존 위험

낮음 — 메이저 변경은 의도적 사건이므로 별도 PDCA로 처리.

---

---

## R-7 (N/A in v2.0) — ~~multi-DS 라우팅 복잡도~~

> **v2.0**: `_active.json` 라우팅 폐기 → INDEX.md 만 (등록 인덱스, 라우팅 로직 없음). 본 위험 자체가 본 피처 범위 외. 런타임 통합 후속 피처에서 다시 검토.

---

## 위험 매트릭스

| ID | 가능성 | 영향 | 등급 | 완화 후 |
|----|:-----:|:----:|:----:|:------:|
| R-1 | High | Medium | High | Low |
| R-2 | Medium | Medium | Medium | Low |
| R-3 | — (N/A v2.0) | — | — | — |
| R-4 | — (N/A v2.0) | — | — | — |
| R-5 | Low | Low | Low | Very Low |
| R-6 | Low | Medium | Low | Low |
| R-7 | — (N/A v2.0) | — | — | — |

## 큐레이션 기록

| Source | 채택 | 거절 | 병합 | 추가 | 이유 |
|--------|:----:|:----:|:----:|:----:|------|
| ideation v1.1 위험 4건 | ✓ | | | | R-1 ~ R-4 로 매핑 |
| ideation v1.1 위험 4건 | | | | ✓ | R-5 (동시 진행), R-6 (MUI 메이저 변경) 신규 추가 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-30 | CTO plan 초기 작성 (위험 6건 + 위험 매트릭스 + 완화 전략) |
| v1.1 | 2026-05-01 | multi-DS 채택에 따른 R-7 (라우팅 복잡도) 추가 + 한 줄 요약 갱신 + 매트릭스 업데이트 |
| **v2.0** | **2026-05-02** | **런타임 통합 폐기 — R-3 (vendor 미수정 제약) / R-4 (hook breaking change) / R-7 (multi-DS 라우팅) 모두 N/A 처리. v1.x 본문은 `<details>` 로 보존 (참고용). 매트릭스 — 등급 컬럼에서 N/A 표시. 활성 위험 = R-1, R-2, R-5, R-6 4건.** |
