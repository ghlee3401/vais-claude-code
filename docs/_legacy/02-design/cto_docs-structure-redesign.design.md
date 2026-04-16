# docs-structure-redesign - 설계서

## 아키텍처: 실용적 균형

핵심 변경이 `resolveDocPath()` + `vais.config.json`에 집중되므로, 최소 코드 변경으로 최대 효과를 얻는 실용적 접근.

---

## 1. vais.config.json docPaths 변경

```json
"docPaths": {
  "ideation": "docs/{feature}/ideation/main.md",
  "plan":     "docs/{feature}/plan/main.md",
  "design":   "docs/{feature}/design/main.md",
  "do":       "docs/{feature}/do/main.md",
  "qa":       "docs/{feature}/qa/main.md",
  "report":   "docs/{feature}/report/main.md"
}
```

- `{role}` 변수 제거 — 문서 경로에서 role을 구분하지 않음 (문서 내용에서 role 명시)
- `{feature}` 가 디렉토리명으로 승격

## 2. lib/paths.js resolveDocPath() 수정

```javascript
function resolveDocPath(phase, feature, role) {
  const config = loadConfig();
  const template = config.workflow?.docPaths?.[phase];
  if (!template || !feature) return '';
  const effectiveRole = role || 'cto';
  const resolved = template
    .replace(/\{role\}/g, effectiveRole)
    .replace(/\{feature\}/g, feature);
  if (/\{.+\}/.test(resolved)) {
    debugLog('Paths', 'Unresolved template variable', { phase, template: resolved });
    return '';
  }
  try {
    const fullPath = safePath(PROJECT_DIR, resolved);
    // 새 구조: 중첩 디렉토리 자동 생성
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return fullPath;
  } catch (e) {
    process.stderr.write(`${e.message}\n`);
    return '';
  }
}
```

변경점: `path.dirname()` + `mkdirSync({ recursive: true })` 추가. 기존 `{role}` 치환은 하위 호환을 위해 유지 (새 템플릿에서는 미사용).

## 3. scripts/doc-tracker.js 수정

`filePath.endsWith(expected)` 매칭 로직은 그대로 동작 — 새 경로도 endsWith로 매칭 가능. 변경 불필요.

단, `checkPhaseOrder()`에서 `resolveDocPath()`로 선행 문서 존재 확인 시 새 경로로 자동 반영됨. 변경 불필요.

## 4. CLAUDE.md 경로 규칙 갱신

**Before:**
```
3. **산출물 경로** — `docs/{번호}-{단계}/{role}_{feature}.{phase}.md` 형식 준수
```

**After:**
```
3. **산출물 경로** — `docs/{feature}/{phase}/main.md` 형식 준수 (피처 중심 구조)
```

**Rule #1, #12 경로 참조도 갱신:**
- `docs/01-plan/` → `docs/{feature}/plan/`

## 5. 6개 C-Level agent .md 산출물 경로 갱신

모든 에이전트의 Contract + doc-checklist 섹션 경로 변경:

**패턴:**
```
Before: docs/01-plan/{role}_{feature}.plan.md
After:  docs/{feature}/plan/main.md
```

대상: `agents/ceo/ceo.md`, `agents/cto/cto.md`, `agents/cpo/cpo.md`, `agents/cso/cso.md`, `agents/cbo/cbo.md`, `agents/coo/coo.md`

## 6. templates/ 경로 참조 갱신

5개 템플릿 파일의 참조 경로 변경:

| 파일 | Before | After |
|------|--------|-------|
| `plan.template.md` | `docs/03-do/cpo_{feature}.do.md` | `docs/{feature}/do/main.md` |
| `design.template.md` | `docs/01-plan/{feature}.md` | `docs/{feature}/plan/main.md` |
| `do.template.md` | `docs/01-plan/`, `docs/02-design/` | `docs/{feature}/plan/`, `docs/{feature}/design/` |
| `qa.template.md` | `docs/01-plan/`, `docs/02-design/` | `docs/{feature}/plan/`, `docs/{feature}/design/` |
| `report.template.md` | 모든 phase 경로 | 새 구조로 갱신 |

## 7. tests/paths.test.js 갱신

기댓값을 새 경로 패턴으로 변경.

## 8. 기존 docs/ 마이그레이션

```bash
# 기존 docs/ 폴더를 _legacy/로 이동
mkdir -p docs/_legacy
mv docs/00-ideation docs/_legacy/
mv docs/01-plan docs/_legacy/
mv docs/02-design docs/_legacy/
mv docs/03-do docs/_legacy/
mv docs/04-qa docs/_legacy/
mv docs/05-report docs/_legacy/
```

새 피처 문서는 `docs/{feature}/` 구조로 자동 생성.

## 9. AGENTS.md 경로 참조

AGENTS.md에 docs 경로 참조가 있으면 갱신 필요. (Cursor/Copilot 호환용)

## 10. 문서 분할 규칙 (에이전트 규칙에 추가)

main.md가 항상 존재하며, 분할 시 sub-doc 생성:
- main.md = 요약 + sub-doc 인덱스 (`## Sub-documents` 섹션에 링크)
- sub-doc = `{descriptive-name}.md` (kebab-case)

분할 판단: 독립 sub-task 3+ / UI+infra 동시 / frontend+backend 병렬 / 200줄 초과

---

## 변경 파일 요약

| # | 파일 | 변경 |
|---|------|------|
| 1 | `vais.config.json` | docPaths 템플릿 |
| 2 | `lib/paths.js` | mkdirSync 추가 |
| 3 | `CLAUDE.md` | 산출물 경로 규칙 |
| 4-9 | `agents/{c-level}/{c-level}.md` x6 | Contract + doc-checklist |
| 10-14 | `templates/*.template.md` x5 | 경로 참조 |
| 15 | `tests/paths.test.js` | 기댓값 |
| 16 | `AGENTS.md` | 경로 참조 |
| - | `docs/` | 기존 → `_legacy/` 이동 |

합계: 16개 파일 수정 + 디렉토리 이동

---

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-16 | 초기 설계서 작성 |
