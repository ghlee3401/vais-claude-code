# output-style Design Document

> **Summary**: output-style 미적용 문제 수정 — Option C (Pragmatic Balance) 설계
>
> **Plan Reference**: `docs/01-plan/features/output-style.plan.md`
> **Date**: 2026-03-25
> **Status**: Draft

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | output-style 파일은 존재하지만 plugin.json 등록 누락으로 Claude Code가 인식 못 함 |
| **WHO** | vais-code 플러그인 사용자 |
| **RISK** | plugin.json 포맷 호환성, hook 출력 포맷 오류 |
| **SUCCESS** | `/output-style` 메뉴에 vais-default 표시 + 매 응답에 하단 리포트 표시 + 기존 테스트 통과 |
| **SCOPE** | plugin.json 1필드 + session-start.js 인라인 규칙 + vais-default.md 현행화 |

---

## Architecture: Option C — Pragmatic Balance

기존 파일 구조를 유지하면서 3개 파일만 수정. 별도 모듈 생성 없이 session-start.js에 인라인 함수 추가.

```
변경 파일:
  .claude-plugin/plugin.json     ← outputStyles 필드 복원
  hooks/session-start.js         ← buildReportRule() 인라인 함수 추가
  output-styles/vais-default.md  ← frontmatter 보강, 변경이력 추가
```

---

## 1. File: `.claude-plugin/plugin.json` (FR-01)

### Before

```json
{
  "name": "vais-code",
  "description": "...",
  "version": "0.17.0",
  "author": { ... },
  "repository": "...",
  "homepage": "...",
  "documentation": "...",
  "bugs": "...",
  "license": "MIT",
  "engines": { "claude-code": ">=2.1.32" },
  "keywords": [...]
}
```

### After

```json
{
  "name": "vais-code",
  "description": "...",
  "version": "0.17.0",
  "author": { ... },
  "repository": "...",
  "homepage": "...",
  "documentation": "...",
  "bugs": "...",
  "license": "MIT",
  "engines": { "claude-code": ">=2.1.32" },
  "outputStyles": "./output-styles/",
  "keywords": [...]
}
```

### 변경 사항

- `"outputStyles": "./output-styles/"` 필드를 `engines` 뒤, `keywords` 앞에 추가
- Claude Code plugin loader가 이 필드를 읽어 `output-styles/` 디렉토리의 `.md` 파일을 자동 등록

---

## 2. File: `hooks/session-start.js` (FR-02)

### 변경 개요

`main()` 함수 내에서 `additionalContext`에 VAIS 하단 리포트 규칙 섹션을 추가.

### 추가할 함수

```javascript
/**
 * VAIS 하단 리포트 규칙 생성
 * bkit의 buildFeatureUsageRule() 패턴 참고
 * @param {string} version - 현재 버전
 * @returns {string} additionalContext에 추가할 규칙 텍스트
 */
function buildReportRule(version) {
  return `
## VAIS 하단 리포트 (Required for all responses)

**Rule: 매 응답 마지막에 아래 형식의 하단 리포트를 반드시 포함하세요.**

\`\`\`
────────────────────────────
💠 VAIS Code v${version}
────────────────────────────
🎯 피처: {현재 피처명 또는 "없음"}
📍 단계: {현재 단계 아이콘+이름}
📊 진행: [{n}/6] {진행바}
💡 다음: /vais {다음액션} {피처명}
────────────────────────────
\`\`\`

### 리포트 규칙:
1. **필수**: 모든 응답 끝에 반드시 포함 (미포함 시 불완전 응답)
2. 진행 중 피처가 없으면 "피처: 없음"만 표시하고 단계/진행/다음은 생략
3. 진행바: ✅=완료, 🔄=현재, ⬜=대기 (항상 6칸)
4. 단계 아이콘: 📋기획, 🎨설계, 🔧인프라, 💻프론트, ⚙️백엔드, ✅QA
`;
}
```

### main() 함수 변경

```javascript
function main() {
  // ... 기존 코드 ...

  // 빠른 시작 안내 뒤에 추가
  ctx += buildReportRule(VERSION);

  const response = {
    additionalContext: ctx,
  };
  // ... 기존 코드 ...
}
```

### 삽입 위치

`ctx`에 "빠른 시작 안내" 테이블을 추가한 직후, `response` 객체 생성 직전.

---

## 3. File: `output-styles/vais-default.md` (FR-03)

### 변경 사항

#### 3.1 Frontmatter 보강

```yaml
---
name: vais-default
description: VAIS Code 기본 응답 스타일. 구조화된 개발 워크플로우에 맞는 깔끔한 응답 형식.
keep-coding-instructions: true
---
```

- `keep-coding-instructions: true` 추가 (bkit 패턴 — 코딩 시스템 프롬프트 유지)

#### 3.2 하단 리포트 섹션

session-start.js의 `buildReportRule()`과 동일한 포맷을 유지하되, output-style 파일에서는 예시로만 제공 (hook이 실제 강제).

현재 vais-default.md의 하단 리포트 섹션은 이미 6단계 반영 완료 — 포맷 일관성만 확인.

#### 3.3 변경 이력 추가

```markdown
| v0.17.0 | 2026-03-25 | outputStyles plugin.json 복원, keep-coding-instructions 추가, SessionStart hook 연동 |
```

---

## 4. File: `lib/paths.js` (FR-04)

### 판단: 유지

`loadOutputStyle()` 함수는 현재 미사용이지만, 향후 다른 hook이나 스킬에서 output-style 파일을 읽어야 할 수 있으므로 유지. 변경 없음.

---

## 5. Implementation Guide

### 5.1 Implementation Order

| Step | File | 작업 | 의존성 |
|------|------|------|--------|
| 1 | `.claude-plugin/plugin.json` | `outputStyles` 필드 추가 | 없음 |
| 2 | `hooks/session-start.js` | `buildReportRule()` 함수 추가 + main()에서 호출 | 없음 |
| 3 | `output-styles/vais-default.md` | frontmatter 보강, 변경이력 추가 | 없음 |
| 4 | 테스트 | `npm test` 실행 + `node hooks/session-start.js` 출력 확인 | Step 1-3 |

### 5.2 Module Map

| Module | Files | Description |
|--------|-------|-------------|
| module-1 | plugin.json | Plugin registration 복원 |
| module-2 | session-start.js | 하단 리포트 규칙 주입 |
| module-3 | vais-default.md | Output style 현행화 |

### 5.3 Session Guide

변경 범위가 작으므로 **단일 세션**에서 전체 구현 가능.

---

## 6. Test Strategy

| Test | Method | Expected |
|------|--------|----------|
| plugin.json 유효성 | `node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json'))"` | 파싱 성공 + outputStyles 필드 존재 |
| session-start.js 출력 | `node hooks/session-start.js` | additionalContext에 "VAIS 하단 리포트" 섹션 포함 |
| 기존 테스트 | `npm test` | 전체 통과 |
| vais-default.md frontmatter | YAML 파싱 확인 | `keep-coding-instructions: true` 존재 |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-03-25 | 초기 작성 — Option C (Pragmatic Balance) 선택 |
