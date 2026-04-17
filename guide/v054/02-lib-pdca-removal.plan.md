# Sub-plan 02 — Dead Code Removal: `lib/pdca/`

> 선행: —
> 후행: 05 (docs 갱신)
> 담당 SC: SC-3, SC-7

---

## 0. 배경

`lib/pdca/`는 "피처 단위 상태 관리 + 세션 가이드 + 의사결정 기록" 목적으로 v0.50 직전에 추가됐다. 그러나 런타임 실행 경로 어디에서도 require되지 않는다.

| 파일 | LOC | runtime require | test require |
|------|-----|-----------------|--------------|
| `lib/pdca/automation.js` | 218 | 0 | 0 |
| `lib/pdca/decision-record.js` | 162 | 0 | 0 |
| `lib/pdca/feature-manager.js` | 273 | 0 | 0 |
| `lib/pdca/session-guide.js` | 142 | 0 | 0 |
| `lib/pdca/index.js` | 10 | 0 | 0 |

실제 피처 상태는 `lib/status.js`(555 LOC)에 모두 들어가 있고, session guide 기능은 `hooks/session-start.js`가 직접 lib/status + lib/ui/progress-bar/workflow-map만으로 처리. **pdca 디렉토리는 중복 구현**.

---

## 1. 조치

### 1.1 `lib/pdca/` 전체 삭제

```
rm -rf lib/pdca/
```

### 1.2 관련 테스트

- 없음 (tests/ 아래 pdca/* require하는 파일 0개)

### 1.3 문서/guide 참조 확인

```
grep -rn "lib/pdca" agents/ skills/ scripts/ hooks/ tests/ CLAUDE.md AGENTS.md README.md
```

현재 확인 결과 런타임 코드 참조 없음. `guide/*-v2.md`와 CHANGELOG는 역사 기록으로 유지.

### 1.4 `lib/status.js` 검토 (선택적)

`lib/status.js`(555 LOC)가 lib/pdca의 기능을 모두 흡수하고 있지만 너무 비대하다면 두 파일로 쪼갤 여지 있음. 그러나 본 sub-plan 범위 밖. 현재는 **유지** (런타임에서 잘 동작 중).

---

## 2. 검증

| # | 검증 | 방법 |
|---|------|------|
| V-1 | `lib/pdca/` 부재 | `ls lib/pdca` fail |
| V-2 | 런타임 코드에 `lib/pdca` 참조 0 | `grep -rn "lib/pdca\|require.*pdca/" scripts/ hooks/ lib/` → 0 |
| V-3 | `npm test` 통과 | `node --test tests/*.test.js` |

---

## 3. 리스크

| 리스크 | 완화 |
|--------|------|
| feature 상태를 분산 관리하고 싶은 미래 요구 | `lib/status.js`에 이미 모든 상태가 있음. 필요 시 쪼개기 |
| decision-record 기능(의사결정 이력)이 누군가에게 유용했을 수 있음 | 호출 경로 0. 사용자가 직접 docs/*.md에 기록 중 |

---

## 4. Carry-forward

**sub-plan 05에 전달**: CHANGELOG에 `lib/pdca/` 제거 + 대체 경로(lib/status.js) 명기.
