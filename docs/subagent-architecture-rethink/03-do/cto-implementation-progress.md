---
owner: cto
topic: cto-implementation-progress
phase: do
feature: subagent-architecture-rethink
authors: [backend-engineer]
---

# Topic: CTO 구현 진행 (Sprint 1~3 완료)

> Source: `_tmp/backend-engineer.md` (230 lines) → CTO 큐레이션. Sprint 1~3 핵심 코드 9 파일.

## 1. Sprint 1~3 산출물

### 1.1 신규 코드 (6 파일, ~2326 LOC)

#### `lib/project-profile.js` (590 LOC)

**8 함수 모두 구현**:
- `loadProfile(featurePath)` — js-yaml `FAILSAFE_SCHEMA`로 안전 파싱
- `validateProfile(profile)` — ALLOWED_VALUES enum + BOOLEAN_FIELDS type + secret 차단
- `evaluateScopeConditions(conditions, profile)` — 5 연산자 (IN/NOT_IN/==/!=/>=) + TARGET_SCALE_RANK 맵 + AND 결합
- `buildContextBlock(featurePath)` — Context Load 마크다운
- `isProfileGateEnabled()` — vais.config.json feature flag
- 보조: `loadProfileSchema()` / `applyDefaults(profile)` / `detectSecrets(value)`

**보안 (G-1) 구현**:
- `validateFeatureName()` path traversal 차단 (`..`, 절대경로 거부)
- `SECRET_PATTERN` + `HIGH_ENTROPY_PATTERN` (30자+ 영숫자) 패턴 검증
- FAILSAFE_SCHEMA로 임의 코드 실행 차단

#### `scripts/template-validator.js` (409 LOC)

CLI: `node scripts/template-validator.js [path] [--depth-check]`
- exit 0: pass
- exit 1: schema error (frontmatter)
- exit 2: depth error (`--depth-check` 시 sample/checklist/anti-pattern 미충족)

`checkDepthC()`: H2 섹션 경계 추출 방식으로 sample 100자+, checklist 5개+, anti-pattern 3개+ 검증

#### `scripts/build-catalog.js` (349 LOC)

CLI: `node scripts/build-catalog.js [--validate]`
- gray-matter scan `templates/{section}/*.md`
- `templateToArtifact()` 변환
- 정렬: phase → policy 우선순위 → artifact id (3-level)
- 출력: `catalog.json` (PROJECT_ROOT)
- schema: `nfr-and-data-model.md` 2.2 준수 (by_phase + by_policy + by_intent 인덱스)

#### `hooks/ideation-guard.js` (366 LOC)

PostToolUse Write 훅:
- `00-ideation/main.md` 감지 → profile.yaml 미존재 시 초안 추출
- `extractProfileDraft()`: ~30개 정규식 키워드 스캔 (type/stage/deployment/data/brand)
- additionalContext에 합의 안내 주입

### 1.2 테스트 (2 파일, ~812 LOC)

| 파일 | 테스트 케이스 |
|------|------------|
| `tests/integration/profile-gate.test.js` (398 LOC) | T-01~T-07 (cloud/local-only/enum/bool/secret/path-traversal/5 operators) |
| `tests/integration/template-validator.test.js` (414 LOC) | TV-01~TV-08 (frontmatter + depth check) |

### 1.3 수정 (3 파일)

- `package.json`: `dependencies: { gray-matter: "^4.0.3", js-yaml: "^4.1.0" }` + `test:integration` 스크립트
- `vais.config.json`: `orchestration.profileGateEnabled: false` (feature flag, 기본 OFF)
- `hooks/hooks.json`: ideation-guard PostToolUse 훅 등록

## 2. 검증 / 테스트

### 2.1 npm install 필요

backend-engineer가 명시 — `gray-matter`, `js-yaml`이 prod dependency 신규. 사용자가 직접 실행:

```bash
npm install
node --test tests/integration/profile-gate.test.js
node --test tests/integration/template-validator.test.js
```

### 2.2 graceful degradation

- `lib/project-profile.js`: js-yaml 미설치 시 크래시 없음, 기능 제한
- `hooks/ideation-guard.js`: 동일

### 2.3 EXP-1 검증 가능

profile-gate.test.js T-01 (`local-only` 프로파일 + ci-cd-configurator scope) → skip 발동 검증. **EXP-1 30분 즉시 실행 가능** (npm install 후).

### 2.4 RA-1 / RA-3 검증 시작

- **RA-1** (Profile 게이트 통증 해소): T-01 ~ T-07로 자동 검증 가능
- **RA-3** (50+ template 14~22주 실현): Sprint 1 완료 시점 측정 — backend-engineer 작업 시간 기준 5 파일럿 평균 산출 가능

## 3. Decision Record (CTO Do 추가)

| # | Decision | Owner | Source |
|:-:|----------|:-----:|--------|
| D-IM-01 | npm install 필요 — js-yaml + gray-matter 2개 신규 prod dependency | cto | `package.json` |
| D-IM-02 | 테스트: `npm install && npm run test:integration` (또는 `node --test`) | cto | `_tmp/backend-engineer.md` |
| D-IM-03 | feature flag OFF 기본 — 점진 활성화 (사용자 수동 변경) | cto | `vais.config.json` |
| D-IM-04 | Sprint 1~3 완료. EXP-1 즉시 실행 가능 — RA-1/RA-3 검증 시작 | cto | 본 topic |

## 4. Sprint 4~14 다음 작업 (권장)

### Sprint 4~6 (다음 권장)

- `templates/core/*.md` × 5 (Vision/Strategy Kernel/OKR/PR-FAQ/3-Horizon — design phase에서 3개 시범 작성됨)
- `templates/why/*.md` × 5 (PEST/Five Forces/SWOT/JTBD/Persona)
- VPC 재매핑 (3 파일 변경 — `agents/cbo/copy-writer.md` + `agents/cpo/product-strategist.md` + `templates/why/value-proposition-canvas.md` 신규)
- EXP-2 검증 (depth c 품질)

### Sprint 7~10

- release-engineer 5분해 (5 신규 agent md + deprecate notice)
- CEO 4 신설 + roadmap-author 신설
- vais.config.json `cSuite` 업데이트 (G-4)
- 44 audit 매트릭스 (`04-qa/subagent-audit-matrix.md` 44행)

### Sprint 11~14

- 잔여 25+ template
- alignment α (`lib/auto-judge.js` 수정) + β (`templates/alignment/*.md` × 3)
- 외부 인터뷰 5~7명 (CPO ux-researcher 위임)
- EXP-4, EXP-5

## 5. 가정 / 제약 / 이슈

### 5.1 가정

- 사용자가 `npm install` 직접 실행 (자동 X — 환경 의존)
- vais.config.json profileGateEnabled를 사용자가 명시 활성화 (점진 배포)
- TARGET_SCALE_RANK는 5단계 (proto/pilot/sub-1k/1k-100k/100k+) 고정

### 5.2 제약

- CJS 유지 (ESM 전환 OOS)
- 의존성 2개만 (js-yaml, gray-matter)
- CEL 파서 OUT (정규식 + dict 비교만)
- 단일 phase 단위 작업 (Sprint 4 이후는 별도 호출)

### 5.3 발견 이슈

- `hooks/hooks.json`이 새 훅 등록 시 graceful 처리 (없으면 skip)
- backend-engineer 가정: 모든 phase 디렉토리(00-ideation/01-plan 등)에 NN- 접두사 — `lib/paths.js` 와 정렬 ✅

## 6. CTO 큐레이션 기록

| Source (`_tmp/backend-engineer.md`) | 채택 | 거절 | 병합 | 추가 | 이유 |
|----|:----:|:----:|:----:|:----:|------|
| 9 파일 작업 (~2526 LOC) | ✅ | | | | 모두 design 인터페이스 그대로 |
| T-01~T-07 + TV-01~TV-08 테스트 | ✅ | | | | EXP-1 + EXP-2 검증 준비 |
| feature flag OFF 기본 | ✅ | | | | R6 완화 (점진 배포) |
| graceful degradation | ✅ | | | | npm install 안전성 |
| **추가** Sprint 4~14 권장 | | | | ✅ | 다음 세션 작업 분해 명시 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — Sprint 1~3 핵심 9 파일 ~2526 LOC + Sprint 4~14 권장 |
