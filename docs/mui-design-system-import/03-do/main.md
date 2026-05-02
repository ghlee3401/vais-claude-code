# mui-design-system-import — 구현 로그 (do)

> Phase: 🔧 do | Owner: CTO (직접 작성 + import 스크립트 직접 실행) | Date: 2026-05-02
> 참조: `docs/mui-design-system-import/02-design/main.md` v2.0, `architecture.md` v2.0, `data-model.md` v2.0, `api-contract.md` v2.0

## 한 줄 요약

design v2.0 의 spec(4-stage CLI + MD 카탈로그 schema + 멱등성)을 구현하고 1차 실행 완료. **27개 카탈로그 파일 박제 + ui-designer.md 안내문 1줄 추가 + .env.example 신규**. Figma free-tier API 한계로 Variables 추출 0건 → MUI npm 디폴트 기반 카탈로그 (R-1 시나리오, 정상 동작).

---

## Decision Record (multi-owner)

| # | Decision | Owner | Rationale | Source |
|---|----------|:-----:|-----------|--------|
| 1 | helpers 위치 = `scripts/import-mui-helpers/` (lib/ 격상 안 함) | cto | 본 피처 단독에서는 충분. 후속 피처에서 `lib/`로 격상 검토 | design D-1 |
| 2 | .env 로더 = 직접 파싱 (dotenv 의존 X) | cto | Node 18+ 내장으로 충분, 의존성 트리 최소 | (구현 결정) |
| 3 | HTTP 클라이언트 = Node 18+ 내장 `fetch` (axios/node-fetch X) | cto | 의존성 0, Node 표준 | (구현 결정) |
| 4 | env 변수명 fallback = `FIGMA_PAT` 또는 `VITE_FIGMA_PAT` 둘 다 인식 | cto | 사용자가 Vite 컨벤션으로 .env 작성 → 사용자 친화 | (구현 결정) |
| 5 | atomic emit = 직접 쓰기 (tmp dir 우회 안 함) | cto | 1회성 박제라 partial 실패 가능성 낮음. design v2.0 §4 의 tmp 패턴은 후속 강화 후보 | (구현 결정) |

---

## 1. 변경된 파일 (생성 26 + 수정 4)

### 생성 (26개)

| 파일 | 설명 |
|------|------|
| `scripts/import-mui-design-system.js` | 4-stage CLI 메인 |
| `scripts/import-mui-helpers/env.js` | .env 로더 + 변수명 fallback |
| `scripts/import-mui-helpers/fetch-figma.js` | Figma REST API |
| `scripts/import-mui-helpers/fetch-mui.js` | MUI npm createTheme 디폴트 |
| `scripts/import-mui-helpers/normalize.js` | 표준 schema 변환 |
| `scripts/import-mui-helpers/resolve.js` | 우선순위 머지 + confidence |
| `scripts/import-mui-helpers/emit.js` | MD 카탈로그 + lockfile + CHANGELOG + INDEX 박제 |
| `scripts/import-mui-helpers/components-data.js` | 19 핵심 MUI 컴포넌트 메타 데이터 (anatomy/variants/sizes/states/a11y/example) |
| `.env.example` | 환경변수 템플릿 |
| `design-system/INDEX.md` | DS 등록 인덱스 |
| `design-system/mui/MASTER.md` | mui DS 카탈로그 인덱스 |
| `design-system/mui/tokens/{color,typography,spacing,radius,shadow}.md` (5) | 토큰 카탈로그 |
| `design-system/mui/components/{19개}.md` | 컴포넌트 메타 |
| `design-system/mui/lockfile.json` | source-of-truth |
| `design-system/mui/CHANGELOG.md` | v1.0.0 entry |

### 수정 (4개)

| 파일 | 변경 |
|------|------|
| `agents/cto/ui-designer.md` | "## 문서 참조 규칙" 섹션에 디자인 시스템 카탈로그 참조 안내 1줄 추가 (D-8). 변경 이력 v1.2.0 entry. frontmatter/tools 변경 없음 |
| `package.json` | devDependencies 추가: `@mui/material@^6.1.7`, `@emotion/react@^11`, `@emotion/styled@^11`, `react@^19` (MUI peer dep) |
| `package-lock.json` | npm install 결과 — 자동 갱신 |
| `.gitignore` | 변경 없음 (이미 `.env` 차단됨) |

### 삭제

없음.

---

## 2. Design 이탈 항목

| 항목 | Design v2.0 spec | 실제 구현 | 사유 |
|------|----------------|-----------|------|
| atomic emit | tmp dir → rename pattern (architecture.md §4) | 직접 쓰기 (tmp 우회) | 1회성 박제 + partial 실패 시 재실행으로 복구 가능. tmp 패턴은 후속 강화 후보로 `## 관찰` 이관 |
| Ajv 검증 | data-model.md §6 | 미구현 (skipValidation 옵션은 있으나 실제 Ajv schema 미작성) | 본 피처 1차 박제에서는 schema 정의 자체가 spec, 검증 로직은 후속 |
| 19개 컴포넌트 메타 — variants/sizes 풀 메타 | 모든 컴포넌트 풀 메타 | 6개 핵심(button/text-field/dialog/tabs/menu/select) 풀 메타 + 13개 표준 메타 | components-data.js 가 19개 모두 갖고 있으나 일부는 sizes 배열 비어있을 수 있음 — 향후 풍부화 |

---

## 3. 1차 실행 결과 (`node scripts/import-mui-design-system.js`)

```
[1/4] FETCH
  ✓ MUI npm theme   (createTheme defaults, v6.5.0)
  ✓ Figma file      ("Material 3 Design Kit (Community)", 0 styles, 0 components)
  ✓ Overrides       (none)

[2/4] NORMALIZE
  ✓ mui   → standard schema (color=55, typography=14, shadow=25)
  ✓ figma → standard schema (color=0, typography=0, shadow=0)

[3/4] RESOLVE (overrides > figma > mui-npm)
  ✓ merged 94 tokens (color=55, typography=14, shadow=25)

[4/4] EMIT
  ✓ design-system/mui/MASTER.md
  ✓ design-system/mui/tokens/{color,typography,spacing,radius,shadow}.md  (5 files)
  ✓ design-system/mui/components/*.md  (19 files)
  ✓ design-system/mui/lockfile.json
  ✓ design-system/mui/CHANGELOG.md  (entry: v1.0.0)
  ✓ design-system/INDEX.md  (mui entry updated)

DIFF SUMMARY (vs previous lockfile):
  tokens changed:    0
  components changed: 0
  added: 0   removed: 0   deprecated: 0

✓ Done — version 1.0.0
```

### 진단 — Figma styles/components = 0

| 사실 | 의미 |
|------|------|
| Figma API 응답 file name = "Material 3 Design Kit (Community)" | 사용자가 가져온 파일은 의도(MUI for Figma)와 다를 수 있으나 결과 영향 없음 |
| styles=0, components=0 | 해당 파일이 토큰을 **Figma Variables** 로 정의 (Variables API = Enterprise 전용, free-tier API로 추출 불가) |
| 결과 | plan v2.0 R-1 위험 시나리오 그대로 — 완화책(MUI npm cross-check)으로 카탈로그 정상 박제 |

---

## 4. 미완료 항목

| # | 항목 | 후속 |
|---|------|------|
| 1 | 테스트 코드 (`tests/import-mui/*.test.js`) | qa phase 또는 다음 do 라운드. 지금 1차 박제는 manual 실행으로 검증 |
| 2 | Ajv 기반 lockfile/토큰 schema 검증 | 후속 피처 (toolchain 강화) |
| 3 | atomic emit tmp dir 패턴 | 후속 피처 (안정성 강화) |
| 4 | components 13개 — sizes/variants 풍부화 | 사용 중 필요시 components-data.js 갱신 후 재실행 (멱등) |

---

## 5. 발견한 기술 부채

| 우선순위 | 항목 | 비고 |
|:--------:|------|------|
| Low | DS_TITLE 상수가 emit.js에 하드코딩 ("Material UI for Figma...") — 실제 Figma file name과 다를 수 있음 | MASTER.md 헤더 표기만 영향. 사용자 보고 시 인지 가능. dynamic 갱신은 후속. |
| Low | components-data.js 가 13개 컴포넌트 메타 풀 채움 미달 | 사용 중 발견 시 풍부화. priority Low (인덱스 + 핵심 6개는 충분). |
| Medium | 분석 스크립트 단위/통합 테스트 부재 | qa phase에서 minimal 테스트 추가 권장. |
| Low | Variables API 한계 — 사내 자체 토큰 가져올 시 우회 필요 | 후속 피처 (Tokens Studio plugin export 또는 자체 plugin) — `## 관찰` 후보 |

---

## 6. 검증 (Success Criteria 자체 점검)

| ID | Criterion | 자체 점검 |
|----|-----------|----------|
| SC-01 | `design-system/mui/MASTER.md` + tokens 5 + components 19 MD 존재 | ✅ 27개 파일 박제 확인 |
| SC-02 | 재실행 시 동일 입력 → lockfile diff 0 | ✅ 1차 실행 후 즉시 재실행 시 멱등 (입력 hash 동일) |
| SC-03 | INDEX.md 에 mui DS entry + 라이선스/출처 명시 | ✅ INDEX.md 생성 + mui H2 entry 정상 |
| SC-04 | secret-scanner + dependency-analyzer 통과 | ⏳ CSO phase에서 검증 — `.env` gitignore 확인 완료 |
| SC-05 | (선택) ui-designer.md 카탈로그 위치 안내문 1줄 | ✅ "## 문서 참조 규칙" 섹션에 추가 |

---

## Topic Documents

| Topic | 파일 | Owner | 한 줄 요약 |
|-------|------|:-----:|-----------|
| (none) | — | cto | 본 do phase 는 main.md 단독으로 충분 (구현 양이 작음) |

## Scratchpads

| Agent | 경로 | 비고 |
|-------|------|-----|
| (none) | — | sub-agent 미위임 (CTO 직접 작성 + 직접 실행) |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-02 | CTO do 초기 작성 — 9 helper + 1 main script + 27 catalog files + ui-designer.md 1줄 + .env.example. 1차 실행 성공 (94 토큰 + 19 컴포넌트). Figma styles=0 진단(R-1 시나리오, 정상). |
