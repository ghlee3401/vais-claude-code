# code-quality-fix Design Document

> **Summary**: Code Review 이슈 수정을 위한 파일별 상세 변경 설계
>
> **Plan Reference**: `docs/01-plan/features/code-quality-fix.plan.md`
> **Date**: 2026-03-25
> **Status**: Draft

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | Code Review 점수 74/100 — Critical 보안 취약점 및 데이터 무결성 버그 존재 |
| **SUCCESS** | Critical 0건, Major 0건, 테스트 커버리지 70%+, 코드 리뷰 점수 90+ |

---

## 1. New File: `lib/fs-utils.js`

> FR-01 (C1), FR-07 (M4), FR-10 (M7)

### 목적
`atomicWriteSync`와 `fileExists`를 한 곳에 모아 중복 제거.

### 설계

```javascript
/**
 * VAIS Code - File System Utilities
 * 공유 파일 시스템 유틸리티
 */
const fs = require('fs');
const path = require('path');

/**
 * 원자적 파일 쓰기 (임시 파일 -> rename)
 * 동시 접근 시 데이터 손실 방지
 * FR-10: try/finally로 orphan tmp 파일 정리
 */
function atomicWriteSync(filePath, data) {
  const dir = path.dirname(filePath);
  const tmpFile = path.join(dir, `.tmp-${process.pid}-${Date.now()}`);
  try {
    fs.writeFileSync(tmpFile, data, 'utf8');
    fs.renameSync(tmpFile, filePath);
  } finally {
    // orphan tmp 파일 정리
    try { fs.unlinkSync(tmpFile); } catch (_) { /* already renamed or doesn't exist */ }
  }
}

/**
 * 파일 존재 여부 확인 (통일된 구현)
 * seo-audit.js, vais-validate-plugin.js에서 공유
 */
function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

module.exports = { atomicWriteSync, fileExists };
```

### Consumer 변경

| File | Before | After |
|------|--------|-------|
| `lib/status.js` | 로컬 `atomicWriteSync` 정의 (L28-33) | `const { atomicWriteSync } = require('./fs-utils');` |
| `lib/memory.js` | 로컬 `atomicWriteSync` 정의 (L14-19) | `const { atomicWriteSync } = require('./fs-utils');` |
| `scripts/seo-audit.js` | 로컬 `fileExists` 정의 | `const { fileExists } = require('../lib/fs-utils');` |
| `scripts/vais-validate-plugin.js` | 로컬 `fileExists` 정의 | `const { fileExists } = require('../lib/fs-utils');` |

---

## 2. `lib/status.js` 변경

> FR-01 (C1), FR-05 (M1), FR-08 (M5), FR-09 (M6)

### 2.1 미사용 import 제거 (FR-05)

```diff
- const os = require('os');
```

### 2.2 atomicWriteSync 교체 (FR-01)

```diff
+ const { atomicWriteSync } = require('./fs-utils');

- /**
-  * 원자적 파일 쓰기 (임시 파일 → rename)
-  * 동시 접근 시 데이터 손실 방지
-  */
- function atomicWriteSync(filePath, data) {
-   const dir = path.dirname(filePath);
-   const tmpFile = path.join(dir, `.tmp-${process.pid}-${Date.now()}`);
-   fs.writeFileSync(tmpFile, data, 'utf8');
-   fs.renameSync(tmpFile, filePath);
- }
```

### 2.3 `setRunRange` stale-status 수정 (FR-08)

**현재** (L140-163): `initFeature()` 호출 후 stale `status` 사용

```diff
  function setRunRange(featureName, from, to) {
-   const status = getStatus();
+   let status = getStatus();
    if (!status.features[featureName]) {
      initFeature(featureName);
+     status = getStatus();  // initFeature가 저장한 최신 상태 재로드
    }
```

### 2.4 `saveGapAnalysis` stale-status 수정 (FR-09)

**현재** (L188-207): `initFeature()` 호출 후 stale `status` 사용

```diff
  function saveGapAnalysis(featureName, result) {
-   const status = getStatus();
+   let status = getStatus();
    if (!status.features[featureName]) {
      initFeature(featureName);
+     status = getStatus();  // initFeature가 저장한 최신 상태 재로드
    }
```

---

## 3. `lib/memory.js` 변경

> FR-01 (C1)

### atomicWriteSync 교체

```diff
+ const { atomicWriteSync } = require('./fs-utils');

- /**
-  * 원자적 파일 쓰기 (임시 파일 → rename)
-  */
- function atomicWriteSync(filePath, data) {
-   const dir = path.dirname(filePath);
-   const tmpFile = path.join(dir, `.tmp-${process.pid}-${Date.now()}`);
-   fs.writeFileSync(tmpFile, data, 'utf8');
-   fs.renameSync(tmpFile, filePath);
- }
```

---

## 4. `scripts/generate-dashboard.js` 변경

> FR-02 (C2), FR-03 (C3), FR-04 (C4), FR-11 (M8)

### 4.1 XSS 수정: onclick 속성 이스케이프 (FR-02)

**현재** (L179-180): 피처명이 직접 JS 문자열에 삽입

```diff
  const featuresNav = featureData.map((f, i) =>
-   `<button class="nav-feature ${i === 0 ? 'active' : ''}" onclick="showFeature('${f.name}')">${f.name}</button>`
+   `<button class="nav-feature ${i === 0 ? 'active' : ''}" data-feature="${escapeHtml(f.name)}" onclick="showFeature(this.dataset.feature)">${escapeHtml(f.name)}</button>`
  ).join('\n');
```

**동일 패턴을 모든 onclick에 적용**:
- L188: phase-tab 버튼 → `data-feature` + `data-phase` 사용 (이미 data 속성 있음, onclick만 수정)
- L193: phase-content div id → `escapeHtml` 적용
- L217: registry table → 이미 `escapeHtml(r.name)` 사용 중, `r.id`와 `r.priority`에도 적용

```diff
  // L217 registry table
- ${f.registry.features.map(r => `<tr><td>${r.id || ''}</td><td>${escapeHtml(r.name || '')}</td><td>${r.priority || ''}</td><td>${statusBadge(r.status)}</td></tr>`).join('')}
+ ${f.registry.features.map(r => `<tr><td>${escapeHtml(r.id || '')}</td><td>${escapeHtml(r.name || '')}</td><td>${escapeHtml(r.priority || '')}</td><td>${statusBadge(r.status)}</td></tr>`).join('')}
```

### 4.2 Mermaid securityLevel 변경 (FR-03)

```diff
- mermaid.initialize({ startOnLoad: true, theme: 'neutral', securityLevel: 'loose' });
+ mermaid.initialize({ startOnLoad: true, theme: 'neutral', securityLevel: 'strict' });
```

### 4.3 테이블 구분자 정규식 수정 (FR-04)

**현재** (L97-100): no-op `.replace()`와 이중 검사

```diff
    rows.forEach((row, i) => {
-     // skip separator row (|---|---|)
-     if (/^\|[\s\-:]+\|$/.test(row.replace(/\|/g, m => m))) {
-       if (/^[\s|:-]+$/.test(row)) return;
-     }
+     // skip separator row (|---|---|)
+     if (/^[\s|:\-]+$/.test(row)) return;
```

### 4.4 md2html 이중 이스케이프 수정 (FR-11)

**문제**: `escapeHtml(md)` 먼저 호출 → 이후 마크다운 처리에서 `<`, `>` 매칭 불가

**해결**: `escapeHtml`을 전체에 먼저 적용하지 않고, 최종 텍스트 노드에만 적용

```diff
  function md2html(md) {
    if (!md) return '';
-   let html = escapeHtml(md);
+   let html = md;

    // code blocks (``` ... ```)
-   html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
-     `<pre class="code-block"><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`
+   html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
+     `<pre class="code-block"><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`
    );

    // inline code
-   html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
+   html = html.replace(/`([^`]+)`/g, (_, code) => `<code class="inline-code">${escapeHtml(code)}</code>`);
```

나머지 텍스트(header 내용, list 내용, table 셀 등)에 대해서도 개별적으로 `escapeHtml` 적용:

```diff
    // headers — 텍스트를 이스케이프
-   html = html.replace(/^#{4}\s+(.+)$/gm, '<h4>$1</h4>');
+   html = html.replace(/^#{4}\s+(.+)$/gm, (_, t) => `<h4>${escapeHtml(t)}</h4>`);
    // (h3, h2, h1도 동일)

    // table cells — 이미 escapeHtml 적용
    // bold/italic — 마크다운 구문 내부는 이스케이프 불필요 (이미 텍스트)
```

---

## 5. `lib/webhook.js` 변경

> FR-12 (M9)

### data spread 순서 변경

```diff
  const payload = JSON.stringify({
+   ...data,
    event,
    timestamp: new Date().toISOString(),
-   ...data,
  });
```

`event`와 `timestamp`가 `data` 내 동명 키보다 우선하도록 순서 변경.

---

## 6. Scripts: `require.main === module` 가드 추가

> FR-06 (M3)

### 대상 파일 (5개)

| File | 현재 구조 | 변경 후 |
|------|----------|---------|
| `scripts/prompt-handler.js` | 즉시 실행 | 함수 export + `if (require.main === module)` 가드 |
| `scripts/doc-tracker.js` | 즉시 실행 | 함수 export + 가드 |
| `scripts/stop-handler.js` | 즉시 실행 | 함수 export + 가드 |
| `scripts/get-context.js` | 즉시 실행 | 함수 export + 가드 |
| `hooks/session-start.js` | 즉시 실행 | 함수 export + 가드 |

### 변경 패턴 (bash-guard.js 참고)

```javascript
// 기존: 모든 로직이 top-level에서 즉시 실행
const { readStdin } = require('../lib/io');
// ... 전체 로직 ...
process.exit(0);

// 변경 후:
const { readStdin } = require('../lib/io');

function main() {
  // ... 기존 전체 로직 이동 ...
}

// 테스트에서 import 가능하도록 export
module.exports = { main, /* 테스트 대상 함수들 */ };

if (require.main === module) {
  main();
}
```

---

## 7. `lib/debug.js` 변경

> Minor: JSON.stringify 안전 처리

```diff
  function debugLog(source, message, data) {
    if (!process.env.VAIS_DEBUG) return;
    try {
-     const entry = `[${new Date().toISOString()}] [${source}] ${message}${data ? ' ' + JSON.stringify(data) : ''}\n`;
+     let dataStr = '';
+     if (data) {
+       try { dataStr = ' ' + JSON.stringify(data); }
+       catch { dataStr = ' [circular or non-serializable]'; }
+     }
+     const entry = `[${new Date().toISOString()}] [${source}] ${message}${dataStr}\n`;
      fs.appendFileSync(LOG_PATH, entry);
```

---

## 8. `scripts/seo-audit.js` + `scripts/vais-validate-plugin.js` 변경

> FR-07 (M4): fileExists 중복 제거

### seo-audit.js

```diff
+ const { fileExists } = require('../lib/fs-utils');

- function fileExists(filePath) {
-   return fs.existsSync(filePath);
- }
```

### vais-validate-plugin.js

```diff
+ const { fileExists } = require('../lib/fs-utils');

- function fileExists(filePath) {
-   try { fs.accessSync(filePath, fs.constants.R_OK); return true; }
-   catch { return false; }
- }
```

---

## 9. Minor: `scripts/bash-guard.js`

> 주석 추가

```diff
  // git push --force (의도적으로 --force-with-lease는 제외: 안전한 force push)
  /git\s+push\s+.*--force(?!-with-lease)/i,
```

---

## 10. Minor: `scripts/stop-handler.js`

> 함수 순서 정리

`buildProgressBar` 함수를 main 로직 위로 이동 (FR-06 가드 추가 시 자연스럽게 해결됨).

---

## 11. 테스트 추가 계획

> FR-13 (M10)

### 11.1 `tests/fs-utils.test.js` (신규)

| Test Case | Description |
|-----------|-------------|
| `atomicWriteSync` 정상 쓰기 | 파일 생성 및 내용 확인 |
| `atomicWriteSync` 덮어쓰기 | 기존 파일 원자적 교체 |
| `atomicWriteSync` 에러 시 tmp 정리 | 잘못된 경로에서 orphan 확인 |
| `fileExists` 존재 파일 | true 반환 |
| `fileExists` 미존재 파일 | false 반환 |

### 11.2 `tests/debug.test.js` (신규)

| Test Case | Description |
|-----------|-------------|
| VAIS_DEBUG 미설정 시 no-op | 로그 파일 미생성 |
| VAIS_DEBUG=1 시 로그 기록 | 엔트리 형식 확인 |
| circular reference 안전 처리 | 에러 없이 fallback 문자열 |

### 11.3 `tests/status.test.js` (기존 확장)

| Test Case | Description |
|-----------|-------------|
| `saveFeatureRegistry` | 레지스트리 저장 및 조회 |
| `updateFeatureStatus` | 개별 기능 상태 업데이트 |
| `setRunRange` 후 status 일관성 | stale-status 버그 부재 확인 |
| `saveGapAnalysis` 후 status 일관성 | stale-status 버그 부재 확인 |

---

## 12. 구현 순서 및 의존성

```
[1] lib/fs-utils.js 생성
  ↓
[2] lib/status.js 수정 (import 변경 + os 제거 + stale-status 수정)
[3] lib/memory.js 수정 (import 변경)         ← [1] 이후
  ↓
[4] scripts/generate-dashboard.js 수정 (XSS + mermaid + 정규식 + md2html)
  ↓
[5] lib/webhook.js 수정 (spread 순서)
[6] lib/debug.js 수정 (safe stringify)
  ↓
[7] scripts 5개: require.main 가드 추가
[8] scripts 2개: fileExists import 변경       ← [1] 이후
  ↓
[9] tests 추가 (fs-utils, debug, status 확장)
  ↓
[10] npm test 실행 및 전체 검증
  ↓
[11] 버전 업데이트 (0.16.1 → 0.17.0)
```

---

## 13. Verification Checklist

- [ ] `npm test` — 기존 7개 스위트 + 신규 2개 스위트 통과
- [ ] hooks 정상 동작 (각 스크립트가 `require.main === module` 하에서도 정상 실행)
- [ ] `node scripts/generate-dashboard.js` — 대시보드 생성 성공
- [ ] 대시보드에서 XSS 이스케이프 확인 (특수문자 피처명 테스트)
- [ ] `atomicWriteSync` — orphan tmp 파일 없음 확인
- [ ] stale-status 패턴 — `setRunRange`, `saveGapAnalysis` 후 데이터 일관성 확인

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-25 | Initial design based on Plan + code analysis | ghlee0304 |
