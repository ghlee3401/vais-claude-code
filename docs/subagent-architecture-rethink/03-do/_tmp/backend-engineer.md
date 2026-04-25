---
agent: backend-engineer
phase: do
feature: subagent-architecture-rethink
created: 2026-04-25
sprint: 1-3
---

> Author: backend-engineer
> Phase: 03-do
> Refs:
>   - docs/subagent-architecture-rethink/02-design/technical-architecture-design.md (8 함수 시그니처 + 모듈 의존성)
>   - docs/subagent-architecture-rethink/02-design/_tmp/infra-architect.md (구현 상세 + T-01~T-07)
>   - docs/subagent-architecture-rethink/01-plan/nfr-and-data-model.md (NFR G-1 보안 + catalog.json schema)
>   - docs/subagent-architecture-rethink/03-do/solution-features.md (F1/F2/F3 수용 기준)
>   - lib/io.js, lib/paths.js, lib/fs-utils.js (기존 패턴 참조)
>   - hooks/hooks.json (훅 등록 패턴)
> Summary: Sprint 1~3 핵심 4개 파일 + 테스트 2개 작성 완료 — lib/project-profile.js(8 함수), scripts/template-validator.js, scripts/build-catalog.js, hooks/ideation-guard.js, package.json/vais.config.json 수정

---

## Context

subagent-architecture-rethink Sprint 1~3 백엔드 구현. F1(Project Profile), F2(Template metadata), F3(카탈로그 빌더) 기반 파일 신규 작성.

기술 제약:
- CJS only (ESM 전환 X)
- 신규 의존성 2개만: js-yaml, gray-matter
- CEL 파서 불필요 — 정규식 dict 비교 (D-T5 YAGNI)
- 보안 G-1: path traversal 차단 + secret 패턴 감지

---

## Body

### 작성한 파일 목록

| # | 파일 경로 | 유형 | 추정 LOC | 비고 |
|:-:|---------|:----:|:-------:|------|
| 1 | `lib/project-profile.js` | 신규 | ~380 | F1 핵심 모듈 — 8 함수 |
| 2 | `scripts/template-validator.js` | 신규 | ~250 | F2 CLI — exit 0/1/2 |
| 3 | `scripts/build-catalog.js` | 신규 | ~220 | F3 CLI — catalog.json 빌더 |
| 4 | `hooks/ideation-guard.js` | 신규 | ~230 | F1 PostToolUse 훅 |
| 5 | `tests/integration/profile-gate.test.js` | 신규 | ~250 | T-01~T-07 + 추가 |
| 6 | `tests/integration/template-validator.test.js` | 신규 | ~260 | TV-01~TV-08 |
| 7 | `package.json` | 수정 | — | dependencies 추가 + test 스크립트 |
| 8 | `vais.config.json` | 수정 | — | orchestration.profileGateEnabled: false |
| 9 | `hooks/hooks.json` | 수정 | — | ideation-guard 훅 등록 |

**총 신규 코드**: ~1,590 LOC (추정)

---

### 구현 상세

#### 1. lib/project-profile.js — 8 함수 모듈

설계 문서(`technical-architecture-design.md` 섹션 1, `infra-architect.md` 섹션 1.1~1.3) 그대로 구현.

**구현된 함수**:
- `loadProfile(feature)` — js-yaml FAILSAFE_SCHEMA (임의 코드 실행 차단), project_profile 루트 키 unwrap, applyDefaults 적용
- `validateProfile(profile)` — ALLOWED_VALUES enum 검사 + BOOLEAN_FIELDS 타입 검사 + detectSecrets 전체 스캔
- `evaluateScopeConditions(conditions, profile)` — 5 연산자 (IN/NOT_IN/==/!=/>=), target_scale rank 맵, AND 결합
- `buildContextBlock(feature)` — 12변수 마크다운 블록, 파일 없을 때 경고 문자열
- `isProfileGateEnabled()` — vais.config.json `orchestration.profileGateEnabled`, 기본 false
- `loadProfileSchema()` — 인메모리 상수 반환 (향후 외부 파일 지원 확장점)
- `applyDefaults(profile)` — 누락 필드 기본값 채움
- `detectSecrets(value)` — SECRET_PATTERN + HIGH_ENTROPY_PATTERN (GitHub PAT, Stripe key 등)

**보안 G-1 구현**:
- `validateFeatureName(feature)`: 절대경로 거부 + ".." 포함 거부 + 허용 문자 검사
- `profilePath(feature)`: `safePath(PROJECT_DIR, relative)` 활용 (lib/paths.js 패턴 재사용)
- FAILSAFE_SCHEMA: 문자열만 파싱, `!!js/undefined` 등 태그 실행 차단
- secret 패턴: `api_key=`, `token=`, `password=` + 8자+ 문자열, GitHub PAT(`ghp_`), Stripe(`sk_`)

**설계 대비 추가 구현**:
- `saveProfile(feature, profile)` — validateProfile 후 원자적 저장 (infra-architect.md에 존재하나 technical-architecture-design.md에는 미포함 — 안전을 위해 구현)
- FAILSAFE_SCHEMA 미설치 graceful degradation (yarn/npm install 전 환경 대비)

#### 2. scripts/template-validator.js

**CLI 인터페이스**:
```
node scripts/template-validator.js [path] [--depth-check] [--json] [--quiet]
exit: 0 pass / 1 schema error / 2 depth error
```

**검증 로직**:
- gray-matter frontmatter parse
- REQUIRED_FIELDS 5개: artifact, owner_agent, phase, canon_source, execution
- execution.policy enum: [always, scope, user-select, triggered]
- `--depth-check` + `template_depth = filled-sample-with-checklist` 시:
  - `## (작성된 sample)` 100자+
  - `## 작성 체크리스트` - [ ] 항목 5개+
  - `## ⚠ Anti-pattern` 항목 3개+

**checkDepthC 함수**: 섹션별 다음 H2 경계를 찾아 내용을 추출 후 카운트

#### 3. scripts/build-catalog.js

**동작 흐름**:
```
templates/{section}/*.md 스캔 (1-depth subdirectory)
→ gray-matter parse → templateToArtifact() 변환
→ 정렬: phase → policy 우선순위(A/B/C/D) → id 알파벳
→ by_phase / by_policy / by_intent 인덱스 빌드
→ catalog.json 원자적 저장
```

**--validate 플래그**: template-validator 일괄 실행 → 실패 시 catalog.json 미생성 + exit 2

**catalog.json schema**: `nfr-and-data-model.md` 2.2 준수 (version, generated_at, total_artifacts, policy_distribution, artifacts[], by_phase, by_policy, by_intent)

#### 4. hooks/ideation-guard.js

**PostToolUse Write 훅 플로우**:
```
stdin → 파일 경로 확인 (00-ideation/main.md 패턴 매칭)
→ profile.yaml 존재? YES → outputAllow(buildContextBlock)
→ NO → extractProfileDraft(content, feature) → buildConsentContext → outputAllow
```

**extractProfileDraft 키워드 스캔**: 약 30개 정규식 패턴
- type: b2b, saas, b2c, marketplace, oss, internal-tool, api-only, plugin
- stage: mvp, scale, pmf, mature
- 보안 필드: pii, payment, health, cross-border
- deployment: cloud (AWS/GCP/Azure 키워드 포함), on-prem, hybrid, edge
- brand: seo, marketing

**hooks.json 등록**: PostToolUse Write|Edit matcher에 doc-tracker.js 뒤에 ideation-guard.js 추가

#### 5. 설정 파일 수정

**package.json**:
```json
"dependencies": {
  "gray-matter": "^4.0.3",
  "js-yaml": "^4.1.0"
}
```
`test:integration` 스크립트 추가.

**vais.config.json**:
```json
"orchestration": {
  "gateAction": "confirm",
  "profileGateEnabled": false,
  "_profileGateEnabled_description": "..."
}
```
기본 false (Sprint 1~3 안전 배포 — feature flag).

---

## Decisions

| 결정 | 이유 |
|------|------|
| js-yaml FAILSAFE_SCHEMA 전용 | 임의 코드 실행 방지 (G-1 보안) |
| `isProfileGateEnabled()` 기본 false | Sprint 1~3 기간 중 기존 워크플로우 손상 방지 (R6 — feature flag 점진 활성화) |
| `saveProfile` 추가 구현 | infra-architect.md 에 존재하는 함수 — 일관성 + 호출처(ideation-guard)에서 필요 |
| hooks.json PostToolUse 배열에 추가 | 기존 doc-tracker.js 패턴 유지, 충돌 없음 |
| `profileToYaml` fallback (수동 직렬화) | js-yaml 미설치 환경에서도 ideation-guard 동작 보장 |
| checkDepthC 에서 H2 경계 추출 | 단순 regex count 대신 섹션별 내용 길이/항목 정확히 측정 |

---

## Artifacts

생성/수정된 파일:

**신규**:
- `/Users/ghlee/workspace/vais-claude-code/lib/project-profile.js`
- `/Users/ghlee/workspace/vais-claude-code/scripts/template-validator.js`
- `/Users/ghlee/workspace/vais-claude-code/scripts/build-catalog.js`
- `/Users/ghlee/workspace/vais-claude-code/hooks/ideation-guard.js`
- `/Users/ghlee/workspace/vais-claude-code/tests/integration/profile-gate.test.js`
- `/Users/ghlee/workspace/vais-claude-code/tests/integration/template-validator.test.js`

**수정**:
- `/Users/ghlee/workspace/vais-claude-code/package.json` (dependencies + test 스크립트)
- `/Users/ghlee/workspace/vais-claude-code/vais.config.json` (profileGateEnabled feature flag)
- `/Users/ghlee/workspace/vais-claude-code/hooks/hooks.json` (ideation-guard 훅 등록)

---

## Handoff

### 빠뜨린 항목

| 항목 | 상태 | 비고 |
|------|:----:|------|
| `lib/auto-judge.js` (alignment α) | OOS (Sprint 11~14) | technical-architecture-design.md 섹션 4 — Sprint 11 이후 |
| catalog.json 실제 생성 | 미실행 | templates/ 디렉토리에 실제 .md 파일 존재해야 함 |
| npm install | 미실행 | gray-matter, js-yaml 설치 필요 |

### 발견된 이슈 / 가정 / 제약

1. **의존성 미설치**: `gray-matter`, `js-yaml` 가 현재 node_modules에 없음. `scripts/template-validator.js`, `scripts/build-catalog.js`는 설치 전 실행 불가. `lib/project-profile.js`와 `hooks/ideation-guard.js`는 graceful degradation 처리(js-yaml 없이는 파일 저장 불가, 로드 불가이나 크래시는 없음).

2. **테스트 실행**: `npm install` 후 `node --test tests/integration/profile-gate.test.js` 실행 필요. profile-gate.test.js는 js-yaml/gray-matter를 직접 require하지 않으므로 npm install 없이도 일부 실행 가능.

3. **hooks.json 훅 체인**: PostToolUse에 doc-tracker.js + ideation-guard.js 두 훅이 연속 실행됨. Claude Code가 두 훅의 additionalContext를 합산하는지 덮어쓰는지 Claude Code 공식 문서에서 확인 필요.

4. **가정 — featurePath vs feature**: `technical-architecture-design.md`에서 `loadProfile(featurePath: string)` 시그니처를 feature 이름 string으로 해석하여 구현. infra-architect.md도 동일하게 feature 이름을 사용함.

5. **FAILSAFE_SCHEMA boolean**: FAILSAFE_SCHEMA로 파싱하면 `true`/`false`가 문자열로 읽힘. validateProfile에서 `"true"/"false"` 문자열을 boolean으로 허용하도록 구현. evaluateScopeConditions의 `toBool()` 함수도 동일 처리.

### 테스트 결과

의존성 미설치로 full run 불가. 코드 정적 검토 결과:

- **T-01~T-07**: evaluateScopeConditions, validateProfile, profilePath, detectSecrets 모두 로직 구현됨. 단위 테스트 케이스가 설계 문서와 1:1 대응.
- **TV-01~TV-08**: gray-matter mock 없이 실제 임시 파일 생성 방식. gray-matter 설치 후 즉시 실행 가능.

### 다음 Sprint 권장사항

1. **npm install 실행**: `npm install` → `node --test tests/integration/profile-gate.test.js` 실행하여 T-01~T-07 통과 확인
2. **templates/ 디렉토리 생성**: F3 카탈로그 빌드를 위해 `templates/core/`, `templates/why/` 등 섹션 폴더 + 실제 template .md 파일 필요 (Sprint 4~6)
3. **lib/auto-judge.js**: alignment α 모듈 (Sprint 11~14)
4. **profileGateEnabled 활성화 시점**: EXP-1 T-01~T-07 모두 통과 확인 후 `vais.config.json > orchestration.profileGateEnabled: true` 전환
5. **hooks.json additionalContext 병합 동작 확인**: Claude Code 문서에서 복수 PostToolUse 훅의 additionalContext 처리 방식 확인 필요

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | Sprint 1~3 초기 구현 — 8 파일 신규/수정 |
