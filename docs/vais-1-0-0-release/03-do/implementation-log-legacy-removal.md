---
owner: cto
artifact: implementation-log-legacy-removal
phase: do
feature: vais-1-0-0-release
generated: 2026-05-17
agent: backend-engineer
summary: "1.0.0 GA — _tmp/scratchpad/topic legacy runtime fallback 제거 (작업 6): status.js 5 API + doc-validator 1 함수 + auto-judge fallback 경로 + tests 3건 격리"
---

# 작업 6: _tmp/scratchpad/topic legacy compatibility 제거

> 참조 문서:
> - design main.md 결정 #8: `_tmp`/scratchpad/topic legacy compatibility 제거
> - design main.md AC-REL-5: runtime 코드에서 `_tmp` fallback 과 scratchpad/topic 신규 등록 API 제거 또는 migration-only 격리
> - P0-A 검증 (설계 단계): `registerSubDoc`/`listSubDocs` 외부 호출자 = 0

## 6-1. lib/status.js 제거 surface

**제거된 함수 (5개):**

| 함수 | 역할 |
|------|------|
| `_subDocKey(entry)` | scratchpad/topic 복합 키 생성 (내부 helper) |
| `_validateSubDocEntry(entry)` | subDoc 엔트리 유효성 검증 (내부 helper) |
| `registerSubDoc(feature, entry)` | scratchpad/topic 엔트리 status.json 등록 |
| `listSubDocs(feature, filter)` | subDoc 목록 조회 (phase/kind 필터) |
| `unregisterSubDoc(feature, key)` | subDoc 엔트리 제거 |
| `listScratchpadAuthors(feature, phase)` | `_tmp/` 디렉토리 스캔 (D-Q3 helper) |

**제거 규모:** 6개 함수, 약 120 lines

**module.exports 정리:** `registerSubDoc` / `listSubDocs` / `unregisterSubDoc` / `listScratchpadAuthors` 4개 export 제거

**하위호환 처리:**
- `createEmptyStatus()` 의 `subDocs: []` 초기값은 애초에 없었으므로 별도 처리 불필요
- 기존 status.json 에 `subDocs` 필드가 있어도 `getStatus()` 파싱 시 무시 (silent drop) — data loss 위험 없음

## 6-2. scripts/doc-validator.js 제거 surface

**제거된 함수 (2개):**

| 함수 | 역할 |
|------|------|
| `validateSubDocs(feature, options)` | `_tmp/` scratchpad + topic "큐레이션 기록" + W-IDX-01 링크 검증 |
| `formatSubDocWarnings(warnings)` | W-SCP-*/W-TPC-01/W-IDX-01 경고 포맷 출력 |

**제거 규모:** 2개 함수, 약 100 lines

**추가 정리:**
- `validateCoexistence()` 내부 W-MAIN-SIZE 판정에서 `_tmp/` 존재 여부 체크 제거 (`hasTmp` 변수 제거). 조건: `lines > maxLines AND topicFiles.length === 0` (단순화)
- CLI 코드에서 `subDocWarnings` / `subDocOutput` / `subDocEnforcement` 관련 3줄 제거
- `module.exports` 에서 `validateSubDocs` / `formatSubDocWarnings` 제거
- 파일 상단 주석에 폐기된 경고 코드 명기 (W-SCP-01/02/03, W-TPC-01, W-IDX-01)

**유지된 함수:** `validateDocs`, `validateCoexistence`, `validateScopeContract`, `validateArtifactFrontmatter`, `formatResult`, `formatCoexistenceWarnings`, `formatScopeContractWarnings`, `formatFrontmatterWarnings` — 모두 active.

## 6-3. scripts/auto-judge.js 제거 surface

**제거된 함수 (1개):**

| 함수 | 역할 |
|------|------|
| `_parseCriticalWithFallback(feature, role)` | main.md primary → `_tmp/qa-engineer.md` fallback 순 Critical 카운트 파싱 |

**제거 규모:** 1개 함수, 약 20 lines

**리팩토링:** `judgeCTO()` 내에서 직접 QA main.md 를 읽어 `Critical` 패턴 파싱. fallback 경로 제거. 코드 단순화 (중첩 함수 → 인라인).

## 6-4. tests 이동 (AC-REL-5 migration-only fixture 격리)

**이동된 파일 (3개) → `tests/_legacy-subdoc/`:**

| 원본 | 이동 후 |
|------|---------|
| `tests/status-subdoc.test.js` | `tests/_legacy-subdoc/status-subdoc.test.js` |
| `tests/doc-validator-subdoc.test.js` | `tests/_legacy-subdoc/doc-validator-subdoc.test.js` |
| `tests/auto-judge-fallback.test.js` | `tests/_legacy-subdoc/auto-judge-fallback.test.js` |

**이동 방법:**
- `_legacy-subdoc/` 폴더 신규 생성
- 각 파일은 `__dirname` 상대 경로를 `../../` 로 수정 (depth 변화 반영)
- 각 파일 상단에 `[LEGACY]` 주석 + AC-REL-5 격리 사유 추가
- 원본 위치 파일은 "moved" 주석만 남김 (test runner 가 실행해도 no-op)

**test runner 동작:**
- 기본 glob `tests/*.test.js` → `_legacy-subdoc/` 미포함 (자동 제외)
- 명시 실행: `node --test 'tests/_legacy-subdoc/*.test.js'`

## 6-5. 검증 결과

### (a) lib/status.js export 제거 확인

```
registerSubDoc: undefined / listSubDocs: undefined
```

`grep` 으로 확인: `registerSubDoc|listSubDocs|unregisterSubDoc|listScratchpadAuthors` → `lib/status.js` 에서 0 hit.

### (b) doc-validator 정상 실행

`node scripts/doc-validator.js --help 2>&1` → exit 0 (help 없으나 role 미지정 시 `process.exit(0)` 정상).
`validateSubDocs` / `formatSubDocWarnings` → `module.exports` 에서 미노출.

### (c) 기존 active 테스트 회귀 없음

- `status-subdoc.test.js`, `doc-validator-subdoc.test.js`, `auto-judge-fallback.test.js` → `_legacy-subdoc/` 이동 후 기본 suite 에서 제외
- `clevel-coexistence.test.js` T9/T10 → `validateCoexistence()` 의 `_tmp` 체크 제거 후에도 통과 (T9: threshold 초과 AND artifact 0 → W-MAIN-SIZE 발화, T10: topic 1개 존재 → 비발화)
- `auto-judge-fallback.test.js` 의 "main.md primary" 케이스 2건 → `_legacy-subdoc/` 이동, 동일 로직 유지

### (d) AC-REL-5 격리 검증

```
tests/_legacy-subdoc/
  auto-judge-fallback.test.js
  doc-validator-subdoc.test.js
  status-subdoc.test.js
```

폴더 존재 확인 완료.

## AC-REL-5 충족 확인

> AC-REL-5: runtime 코드에서 `_tmp` fallback 과 scratchpad/topic 신규 등록 API 제거 또는 migration-only 격리

- `lib/status.js`: `registerSubDoc` / `listSubDocs` / `unregisterSubDoc` / `listScratchpadAuthors` / `_subDocKey` / `_validateSubDocEntry` 전부 제거 **[DONE]**
- `scripts/doc-validator.js`: `validateSubDocs` / `formatSubDocWarnings` / `_tmp` 스캔 로직 제거 **[DONE]**
- `scripts/auto-judge.js`: `_parseCriticalWithFallback` (`_tmp` fallback) 제거 **[DONE]**
- `tests/`: 3 파일 → `tests/_legacy-subdoc/` 격리 (기본 미실행) **[DONE]**

외부 호출자 0 (P0-A 검증 — design main.md v1.2 확인) → safe removal 확정.
