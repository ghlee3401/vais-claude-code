# v0.57 Sub-plan 05 — Tests, Docs, Version Bump

> 선행: 00~04
> 후행: 릴리즈

## 1. 목적

v0.57 의 최종 단계로 (a) 신규 테스트 추가, (b) 문서 (CLAUDE/AGENTS/README/CHANGELOG) 동기화, (c) 4 파일 버전 0.56.2 → 0.57.0 승격.

## 2. 테스트 추가

### 2.1 신규 테스트 파일

| 파일 | 범위 | 대상 sub-plan |
|------|------|--------------|
| `tests/subdoc-convention.test.js` | 경로 패턴, 슬러그 규칙, 예외 리스트 | 00 |
| `tests/clevel-index-format.test.js` | 6 C-Level main.md 포맷 fixture 검증 | 01 |
| `tests/subdoc-guard-include.test.js` | `_shared/subdoc-guard.md` 가 35 sub-agent 에 include 됨 | 02 |
| `tests/subdoc-templates.test.js` | 6 템플릿 파일 존재 + 공통 메타 헤더 | 03 |
| `tests/doc-validator-subdoc.test.js` | sub-doc 메타/크기/섹션 경고 | 04 |
| `tests/status-subdoc.test.js` | `registerSubDoc` / `listSubDocs` | 04 |
| `tests/auto-judge-fallback.test.js` | main.md → sub-doc fallback 파싱 | 04 |

### 2.2 Fixture 파일

| 파일 | 용도 |
|------|------|
| `tests/fixtures/subdoc-index.sample.md` | C-Level main.md 인덱스 포맷 샘플 |
| `tests/fixtures/subdoc-engineer.sample.md` | engineer 템플릿으로 작성된 sub-doc 샘플 |
| `tests/fixtures/subdoc-auditor.sample.md` | auditor 템플릿 샘플 (gate 파싱 호환성 검증) |

### 2.3 기존 테스트 회귀 체크

- `tests/paths.test.js` — `docs/{feature}/{NN-phase}/main.md` 회귀 가드 (Rule #13). Sub-doc 경로도 유효 (top-level `docs/NN-` 아님) 이지만 **본 테스트 수정 금지** (회귀 가드 유지)
- `tests/gate-manager.test.js` — sub-doc fallback 추가 후에도 기존 6 케이스 통과
- `tests/gate-activation.test.js` — 동일

### 2.4 테스트 통과 목표

- **기준**: v0.56.2 = 162 pass / 0 fail / 3 skipped
- **목표**: 162 + 7 (신규) = **169 pass / 0 fail / 3 skipped**

## 3. 문서 업데이트

### 3.1 `CLAUDE.md`

**Rule #3 확장** (기존 문구에 예시 추가):

```markdown
3. **산출물 경로** — `docs/{feature}/{NN-phase}/main.md` 형식 준수.
   Phase↔Folder 매핑: (기존 유지)
   
   **Sub-doc (v0.57+)**: sub-agent 는 `docs/{feature}/{NN-phase}/{agent-slug}.md` 에 자기 분야 상세를 기록.
   복수 산출물은 qualifier (`{slug}.{qualifier}.md`).
   main.md 는 Executive Summary + Decision Record + Sub-documents 인덱스 포맷.
   상세 컨벤션: `vais.config.json > workflow.subDocPolicy`, `agents/_shared/subdoc-guard.md`.
```

**Mandatory Rules 에 추가** (Rule #14 신설):

```markdown
14. **Sub-doc 보존 원칙 (v0.57+)** — sub-agent 는 자기 분석/설계/구현 결과를 축약 없이 `docs/{feature}/{NN-phase}/{agent-slug}.md` 에 기록.
    C-Level main.md 는 인덱스 + Decision Record 만 유지.
    병렬 실행 sub-agent 가 main.md 를 직접 편집하는 것은 금지 (C-Level 이 sub-doc 수집 후 작성).
```

### 3.2 `AGENTS.md`

CLAUDE.md 동기화 (동일 내용, Cursor/Copilot 호환 포맷).

### 3.3 `README.md`

다음 섹션 추가/업데이트:

- **"What's New in v0.57"** — sub-doc preservation 한 단락 설명
- **"Project Structure"** — `docs/{feature}/{NN-phase}/` 아래 `main.md + {agent-slug}.md` 구조 도식화
- **"Agent Architecture"** 표 옆 메모 — "각 sub-agent 는 자기 sub-doc 을 보존"

### 3.4 `CHANGELOG.md`

v0.57.0 단락 신설:

```markdown
## [0.57.0] - 2026-04-XX — Sub-doc Preservation

C-Level main.md 에 축약되어 사라지던 sub-agent 원본 분석을 `docs/{feature}/{NN-phase}/{agent-slug}.md` 로 개별 보존. sub-plan 00~05 전부 포함.

### Added

- **컨벤션 (sub-plan 00)**:
  - `docs/{feature}/{NN-phase}/{agent-slug}.md` 경로 표준화
  - qualifier (`.review`, `.audit`, `.bench` 등) 사전 정의
  - 시스템 산출물 예외 리스트 (`interface-contract.md`)

- **C-Level main.md 인덱스 포맷 (sub-plan 01)**:
  - 6 C-Level agent markdown 의 PDCA 표 + Contract Output 업데이트
  - Executive Summary + Decision Record + Sub-documents 인덱스 표준화
  - 6 phases/*.md 완료 출력 포맷 동기화

- **sub-agent doc generation (sub-plan 02)**:
  - `agents/_shared/subdoc-guard.md` 신설 (include 방식, 기존 `advisor-guard.md` 선례 활용)
  - 35 sub-agent markdown frontmatter 에 `includes: [_shared/subdoc-guard.md]` 추가
  - 특수 케이스 (ui-designer.review / performance-engineer rename / qa-engineer gate 연동 / incident-responder 조건부 / CBO phase 분산) 개별 처리

- **템플릿 (sub-plan 03)**:
  - `templates/subdoc.template.md` (공통)
  - `templates/subdoc-{engineer,analyst,auditor,designer,researcher}.template.md` (특화 5종)

- **validators & trackers (sub-plan 04)**:
  - `scripts/doc-validator.js` 에 sub-doc 경로/메타/크기/섹션 검증 추가
  - `lib/status.js` 에 `registerSubDoc` / `listSubDocs` 함수 추가
  - `.vais/status.json > features.{feature}.docs.subDocs[]` 스키마 확장
  - `scripts/auto-judge.js` 에 main.md → sub-doc fallback 파싱 추가
  - observability 이벤트 `subdoc.write / validate / missing-link` 3종 추가
  - `VAIS_SUBDOC_MODE` 환경변수 (off/warn/strict, 기본 warn)

### Changed

- `vais.config.json > workflow.docPaths` 확장 (subDoc / subDocQualified / systemArtifacts)
- `vais.config.json > workflow.subDocPolicy` 신설 (enforcement=warn, autoIndex=true, reportPhase=single, minSizeBytes=500)
- `CLAUDE.md` Rule #3 확장 + Rule #14 신설 (Sub-doc 보존 원칙)

### Migration

- 기존 ad-hoc sub-doc 5건 rename:
  - `02-design/infra.md` → `02-design/infra-architect.md`
  - `02-design/review.md` → `02-design/ui-designer.review.md`
  - `03-do/strategy.md` → `03-do/product-strategist.md`
  - `04-qa/performance.md` → `04-qa/performance-engineer.md`
  - `02-design/interface-contract.md` — 유지 (시스템 산출물 예외)
- 기존 피처 (v0.56 이전) 의 main.md 단독 구조는 **그대로 허용**. sub-doc 부재가 차단 사유 아님 (warn only).

### Removed

- 없음

### Test stats

목표: 162 pass → **169 pass** / 0 fail / 3 skipped (+7 신규)
```

### 3.5 기존 phase 템플릿 업데이트

`templates/{plan,design,do,qa,report,ideation}.template.md` 에 "Sub-documents" 섹션 추가 (C-Level 이 main.md 작성 시 참고):

```markdown
## Sub-documents

| Agent | 역할 | 경로 | 한 줄 요약 |
|-------|------|------|-----------|
| {slug} | {role} | `{slug}.md` | {summary} |

<!-- v0.57+: sub-agent 의 상세 산출물 인덱스. 자동 주입 가능 (`workflow.subDocPolicy.autoIndex=true`). -->
```

## 4. 버전 동기화

4 파일에서 0.56.2 → 0.57.0:

| 파일 | 위치 |
|------|------|
| `package.json` | `version` |
| `vais.config.json` | `version` |
| `.claude-plugin/plugin.json` | `version` |
| `.claude-plugin/marketplace.json` | `metadata.version` + `plugins[0].version` |

## 5. 성공 기준

| # | Criteria | 검증 |
|---|----------|------|
| SC-05-1 | 7 신규 테스트 추가 + 3 fixture | ls tests/ |
| SC-05-2 | `npm test` = 169 pass / 0 fail / 3 skipped | 명령어 |
| SC-05-3 | `npm run lint` pass | 명령어 |
| SC-05-4 | CLAUDE.md Rule #3 확장 + Rule #14 신설 | diff |
| SC-05-5 | AGENTS.md 동기화 | diff |
| SC-05-6 | README.md v0.57 섹션 추가 | diff |
| SC-05-7 | CHANGELOG.md v0.57.0 단락 | diff |
| SC-05-8 | 4 파일 버전 0.57.0 | diff |
| SC-05-9 | 기존 phase 템플릿 6개에 "Sub-documents" 섹션 추가 | diff |
| SC-05-10 | `node scripts/vais-validate-plugin.js` 통과 | 명령어 |

## 6. 릴리즈 체크리스트

- [ ] sub-plan 00~04 완료
- [ ] 신규 테스트 7건 작성 + pass
- [ ] Fixture 3건 작성
- [ ] CLAUDE.md / AGENTS.md / README.md / CHANGELOG.md 업데이트
- [ ] 4 파일 버전 0.57.0
- [ ] `npm test` 169 pass
- [ ] `npm run lint` 0 warning
- [ ] `scripts/vais-validate-plugin.js` 통과
- [ ] `git diff` 리뷰 (민감 파일 미포함)
- [ ] PR 생성 (사용자 명시 요청 시에만)

## 7. 리스크

| 리스크 | 완화 |
|--------|------|
| `_shared/subdoc-guard.md` include 가 실제 런타임에서 미작동 | sub-plan 02 smoke test. 문제 시 각 sub-agent 에 블록 직접 삽입 (fallback) |
| 35 sub-agent 일괄 변경 시 PR diff 과대 | sub-plan 단위로 분리 커밋 권장 (00→01→02→03→04→05) |
| 버전 동기화 누락 | `scripts/check-version-sync.js` (존재 시) 실행 |

## 8. 다음

v0.57 릴리즈 후 관측 가능한 항목:
- sub-doc 작성률 (피처 중 몇 % 가 sub-doc 남기는가)
- main.md 평균 길이 변화 (축약 vs 인덱스)
- doc-validator 경고 빈도

→ v0.58 에서 enforcement=retry/fail 전환 여부 재결정.
