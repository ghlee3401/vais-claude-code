# Design: SessionStart 강화 + Output Style 자동 주입

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | vais-code SessionStart가 bkit 대비 가시성이 낮아 사용자에게 플러그인 존재감을 제대로 전달하지 못함 |
| WHO | vais-code 플러그인 사용자 (개발자) |
| RISK | SessionStart 출력이 너무 길어지면 bkit과 합쳐져 context 낭비. 5초 타임아웃 내 완료 필수 |
| SUCCESS | SC-01: Progress Bar, SC-02: Workflow Map, SC-03: output-style 자동 주입, SC-04: 5초 이내 |
| SCOPE | SessionStart hook 모듈화 + output-style 자동 주입. 새 스킬/에이전트 추가 없음 |

---

## 1. Overview

### 1.1 선택된 아키텍처: Option C — Pragmatic Balance

`lib/ui/` 하위에 2개 렌더링 모듈을 신규 생성하고, `hooks/session-start.js`를 thin orchestrator로 리팩토링. `lib/paths.js`의 기존 `loadOutputStyle()` 함수를 활용하여 output-style 자동 주입.

### 1.2 파일 구조

```
hooks/
  session-start.js          ← 리팩토링 (thin orchestrator)
lib/
  ui/
    progress-bar.js         ← 신규
    workflow-map.js          ← 신규
  paths.js                  ← 기존 (loadOutputStyle 활용)
  status.js                 ← 기존 (getProgressSummary 활용)
output-styles/
  vais-default.md           ← 변경 없음
```

---

## 2. 모듈 상세 설계

### 2.1 `lib/ui/progress-bar.js`

**책임**: 피처의 6단계 진행 상황을 시각적 바로 렌더링

**인터페이스**:

```javascript
/**
 * @param {object} summary - getProgressSummary() 반환값
 * @param {object} [options]
 * @param {number} [options.width=50] - 전체 너비 (문자 수)
 * @returns {string} 렌더링된 Progress Bar 문자열 (멀티라인)
 */
function renderProgressBar(summary, options = {})
```

**렌더링 규칙**:

1. 피처명 + 퍼센트를 상단 프레임에 표시
2. 6단계 아이콘 + 블록 진행바를 중앙에 표시
3. 현재 단계명 + 마지막 활동 시간을 하단에 표시

**출력 형식**:

```
┌─── {feature} ──────────────────────────── {percent}% ─┐
│  📋✓  🎨✓  🔧▶  💻·  ⚙️·  ✅·  ██████░░░░░░░░░░░░░░  │
└─ {phaseIcon}{phaseName} • {featureCount} features      ┘
```

**구현 상세**:

```javascript
const PHASE_ICONS = {
  plan: '📋', design: '🎨', infra: '🔧',
  fe: '💻', be: '⚙️', qa: '✅'
};

const STATUS_MARKS = {
  completed: '✓',
  'in-progress': '▶',
  pending: '·'
};

function renderProgressBar(summary, options = {}) {
  if (!summary) return '';

  const { feature, currentPhaseName, phases } = summary;
  const config = require('../paths').loadConfig();
  const phaseList = config.workflow?.phases || [];
  const width = options.width || 50;

  // 퍼센트 계산
  const completed = phaseList.filter(p => phases[p]?.status === 'completed').length;
  const percent = Math.round((completed / phaseList.length) * 100);

  // 단계 아이콘 + 상태 마크
  const phaseMarks = phaseList.map(p => {
    const icon = PHASE_ICONS[p] || '?';
    const mark = STATUS_MARKS[phases[p]?.status] || '·';
    return `${icon}${mark}`;
  }).join('  ');

  // 블록 진행바
  const barLen = 20;
  const filled = Math.round((completed / phaseList.length) * barLen);
  const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled);

  // 현재 단계 아이콘
  const currentPhaseKey = Object.keys(PHASE_ICONS).find(
    k => config.workflow?.phaseNames?.[k] === currentPhaseName
  ) || phaseList[completed] || phaseList[0];
  const currentIcon = PHASE_ICONS[currentPhaseKey] || '📋';

  // 프레임 조립
  const title = `${feature}`;
  const percentStr = `${percent}%`;
  const topPadLen = Math.max(0, width - title.length - percentStr.length - 8);
  const topPad = '─'.repeat(topPadLen);

  const lines = [];
  lines.push(`┌─── ${title} ${topPad} ${percentStr} ─┐`);
  lines.push(`│  ${phaseMarks}  ${bar}  │`);
  lines.push(`└─ ${currentIcon}${currentPhaseName}${' '.repeat(Math.max(0, width - currentPhaseName.length - 6))}┘`);

  return lines.join('\n');
}

module.exports = { renderProgressBar, PHASE_ICONS, STATUS_MARKS };
```

---

### 2.2 `lib/ui/workflow-map.js`

**책임**: 6단계 워크플로우를 화살표 연결로 시각화

**인터페이스**:

```javascript
/**
 * @param {object} summary - getProgressSummary() 반환값
 * @param {object} [options]
 * @returns {string} 렌더링된 Workflow Map 문자열 (멀티라인)
 */
function renderWorkflowMap(summary, options = {})
```

**렌더링 규칙**:

1. 각 단계를 `[아이콘이름 상태]` 블록으로 표현
2. 화살표(`──→`)로 연결
3. 박스 프레임으로 감싸기

**출력 형식**:

```
┌─── Workflow: {feature} ──────────────────────────────────┐
│                                                           │
│  [📋기획 ✓]──→[🎨설계 ✓]──→[🔧인프라 ▶]──→[💻FE ·]──→[⚙️BE ·]──→[✅QA ·]  │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**단계명 축약 규칙** (프레임 폭 절약):

| 단계 | 전체 | 축약 |
|------|------|------|
| plan | 기획 | 기획 |
| design | 설계 | 설계 |
| infra | 인프라 | 인프라 |
| fe | 프론트엔드 | FE |
| be | 백엔드 | BE |
| qa | QA | QA |

**구현 상세**:

```javascript
const { PHASE_ICONS, STATUS_MARKS } = require('./progress-bar');

const SHORT_NAMES = {
  plan: '기획', design: '설계', infra: '인프라',
  fe: 'FE', be: 'BE', qa: 'QA'
};

function renderWorkflowMap(summary, options = {}) {
  if (!summary) return '';

  const { feature, phases } = summary;
  const config = require('../paths').loadConfig();
  const phaseList = config.workflow?.phases || [];

  // 단계 블록 생성
  const blocks = phaseList.map(p => {
    const icon = PHASE_ICONS[p] || '?';
    const name = SHORT_NAMES[p] || p;
    const mark = STATUS_MARKS[phases[p]?.status] || '·';
    return `[${icon}${name} ${mark}]`;
  });

  const chain = blocks.join('──→');

  // 프레임 너비 계산
  const contentWidth = chain.length + 4; // padding
  const titleLine = `Workflow: ${feature}`;
  const topPadLen = Math.max(0, contentWidth - titleLine.length - 6);
  const topPad = '─'.repeat(topPadLen);
  const bottomPad = '─'.repeat(Math.max(0, contentWidth));

  const lines = [];
  lines.push(`┌─── ${titleLine} ${topPad}─┐`);
  lines.push(`│${' '.repeat(contentWidth)}│`);
  lines.push(`│  ${chain}  │`);
  lines.push(`│${' '.repeat(contentWidth)}│`);
  lines.push(`└${bottomPad}──┘`);

  return lines.join('\n');
}

module.exports = { renderWorkflowMap, SHORT_NAMES };
```

---

### 2.3 `hooks/session-start.js` 리팩토링

**책임**: thin orchestrator — 모듈 호출 + 결과 조립만 담당

**변경 전후 비교**:

| 항목 | Before | After |
|------|--------|-------|
| 렌더링 로직 | 인라인 | `lib/ui/` 모듈 호출 |
| output-style | `buildReportRule()` 하드코딩 | `loadOutputStyle()` 파일 기반 |
| Progress Bar | 없음 | `renderProgressBar()` 호출 |
| Workflow Map | 없음 | `renderWorkflowMap()` 호출 |
| 에러 격리 | 없음 | 각 모듈 try-catch |

**리팩토링된 구조**:

```javascript
#!/usr/bin/env node
const { debugLog } = require('../lib/debug');
const { ensureVaisDirs, loadConfig, loadOutputStyle } = require('../lib/paths');
const { getStatus, getActiveFeature, getProgressSummary } = require('../lib/status');
const { sendWebhook } = require('../lib/webhook');

function main() {
  debugLog('SessionStart', 'Hook executed', { cwd: process.cwd() });
  ensureVaisDirs();

  const config = loadConfig();
  const VERSION = config.version || '0.10.1';
  const activeFeature = getActiveFeature();
  const status = getStatus();
  const featureNames = Object.keys(status.features || {});

  let ctx = '';

  // --- 1. Progress Bar (피처 있을 때만) ---
  if (activeFeature) {
    try {
      const { renderProgressBar } = require('../lib/ui/progress-bar');
      const summary = getProgressSummary(activeFeature);
      const bar = renderProgressBar(summary);
      if (bar) ctx += bar + '\n\n';
    } catch (e) {
      debugLog('SessionStart', 'Progress Bar failed', { error: e.message });
    }
  }

  // --- 2. Workflow Map (피처 있을 때만) ---
  if (activeFeature) {
    try {
      const { renderWorkflowMap } = require('../lib/ui/workflow-map');
      const summary = getProgressSummary(activeFeature);
      const map = renderWorkflowMap(summary);
      if (map) ctx += map + '\n\n';
    } catch (e) {
      debugLog('SessionStart', 'Workflow Map failed', { error: e.message });
    }
  }

  // --- 3. 헤더 + 피처 목록 ---
  ctx += `# VAIS Code v${VERSION}\n\n`;
  ctx += `> 📋기획 → 🎨설계 → 🔧인프라 → 💻프론트 + ⚙️백엔드 → ✅QA\n\n`;

  if (featureNames.length > 0) {
    ctx += `## 진행 중인 피처\n\n`;
    for (const fname of featureNames) {
      const summary = getProgressSummary(fname);
      if (!summary) continue;
      const marker = fname === activeFeature ? '👉 ' : '   ';
      ctx += `${marker}**${fname}** — ${summary.currentPhaseName} ${summary.progressCompact}\n`;
    }
    ctx += `\n`;
  }

  // --- 4. 커맨드 테이블 ---
  ctx += `## 시작하기\n\n`;
  ctx += `| 커맨드 | 설명 |\n`;
  ctx += `|--------|------|\n`;
  ctx += `| \`/vais auto {기능}\` | 전체 자동 워크플로우 |\n`;
  ctx += `| \`/vais plan {기능}\` | 기획부터 시작 |\n`;
  ctx += `| \`/vais status\` | 진행 상태 확인 |\n`;
  ctx += `| \`/vais help\` | 사용법 안내 |\n\n`;

  // --- 5. Output Style 자동 주입 ---
  try {
    const styleContent = loadOutputStyle();
    if (styleContent) {
      // frontmatter(---...---) 제거하고 규칙 본문만 주입
      const bodyMatch = styleContent.match(/^---[\s\S]*?---\s*([\s\S]*)$/);
      const styleBody = bodyMatch ? bodyMatch[1].trim() : styleContent;
      ctx += styleBody + '\n\n';
    }
  } catch (e) {
    debugLog('SessionStart', 'Output Style injection failed', { error: e.message });
  }

  // --- Output ---
  const response = { additionalContext: ctx };

  sendWebhook('session_start', {
    project: process.cwd(),
    activeFeature: activeFeature || null,
    featureCount: featureNames.length,
  });

  console.log(JSON.stringify(response));
  process.exit(0);
}

module.exports = { main };
if (require.main === module) { main(); }
```

---

## 3. 데이터 흐름

```
session-start.js (orchestrator)
  │
  ├─→ lib/status.js::getProgressSummary(feature)
  │     └─→ .vais/status.json (피처 상태 데이터)
  │
  ├─→ lib/ui/progress-bar.js::renderProgressBar(summary)
  │     └─→ string (Progress Bar 렌더링 결과)
  │
  ├─→ lib/ui/workflow-map.js::renderWorkflowMap(summary)
  │     └─→ string (Workflow Map 렌더링 결과)
  │
  ├─→ lib/paths.js::loadOutputStyle()
  │     └─→ output-styles/vais-default.md (파일 읽기)
  │
  └─→ stdout: JSON { additionalContext: ctx }
```

---

## 4. 에러 격리 전략

각 렌더링 모듈은 독립적으로 try-catch로 감싸서 실행:

```
[Progress Bar 실패] → 스킵, 다음 모듈 진행
[Workflow Map 실패] → 스킵, 다음 모듈 진행
[Output Style 실패] → 스킵, 기본 ctx만 출력
```

모든 모듈이 실패해도 최소한 헤더 + 커맨드 테이블은 출력됨.

---

## 5. output-style 자동 주입 설계

### 5.1 현재 문제

`buildReportRule()` 함수가 하단 리포트 규칙을 하드코딩. `output-styles/vais-default.md`와 이중 관리.

### 5.2 해결

1. `buildReportRule()` 함수 제거
2. `loadOutputStyle()`로 `vais-default.md` 파일 읽기
3. frontmatter(`---...---`) 제거 후 본문만 additionalContext에 주입
4. 이로써 output-style 파일이 Single Source of Truth

### 5.3 주입 위치

```
additionalContext 구성 순서:
1. Progress Bar          ← 피처 있을 때만
2. Workflow Map          ← 피처 있을 때만
3. 헤더 + 피처 목록      ← 항상
4. 커맨드 테이블          ← 항상
5. Output Style 본문     ← 항상 (하단 리포트 규칙 포함)
```

---

## 6. 제약 사항

| 제약 | 사유 | 대응 |
|------|------|------|
| 5초 타임아웃 | hook timeout 제한 | 동기 파일 읽기만 사용. 네트워크 호출 없음 |
| 유니코드 폭 불일치 | 이모지는 터미널마다 폭이 다름 | 프레임 폭을 넉넉하게 설정, 완벽한 정렬 포기 |
| `getProgressSummary` 2회 호출 | Progress Bar + Workflow Map 각각 | 첫 호출 결과를 변수로 저장하여 재사용 |

---

## 7. 테스트 전략

| 테스트 | 방법 | 기준 |
|--------|------|------|
| 피처 있을 때 출력 | `.vais/status.json`에 테스트 피처 생성 후 `node hooks/session-start.js` | Progress Bar + Workflow Map 포함 |
| 피처 없을 때 출력 | `.vais/status.json` 없이 실행 | 헤더 + 테이블 + output-style만 출력 |
| output-style 주입 | 출력에서 "하단 리포트" 문자열 존재 확인 | frontmatter 미포함, 본문만 포함 |
| 타임아웃 | `time node hooks/session-start.js` | < 1초 |
| 에러 격리 | `lib/ui/progress-bar.js`를 의도적으로 깨뜨린 후 실행 | 나머지 정상 출력 |

---

## 8. 변경 없는 파일

| 파일 | 사유 |
|------|------|
| `output-styles/vais-default.md` | 기존 규칙 그대로 사용 |
| `lib/status.js` | `getProgressSummary()` 그대로 활용 |
| `lib/paths.js` | `loadOutputStyle()` 기존 함수 활용 |
| `vais.config.json` | 워크플로우 설정 변경 없음 |

---

## 9. 구현 체크리스트

- [ ] `lib/ui/progress-bar.js` 생성 — `renderProgressBar(summary)` 함수
- [ ] `lib/ui/workflow-map.js` 생성 — `renderWorkflowMap(summary)` 함수
- [ ] `hooks/session-start.js` 리팩토링 — thin orchestrator + 에러 격리
- [ ] `buildReportRule()` 제거 → `loadOutputStyle()` 기반으로 전환
- [ ] `getProgressSummary()` 결과 재사용 (1회 호출)
- [ ] frontmatter 제거 로직 구현
- [ ] 피처 있을 때/없을 때 테스트
- [ ] 타임아웃 테스트

---

## 10. Implementation Guide

### 10.1 구현 순서

1. `lib/ui/progress-bar.js` 생성
2. `lib/ui/workflow-map.js` 생성
3. `hooks/session-start.js` 리팩토링

### 10.2 의존성 그래프

```
progress-bar.js ← (lib/paths::loadConfig)
workflow-map.js ← (progress-bar::PHASE_ICONS, STATUS_MARKS) + (lib/paths::loadConfig)
session-start.js ← (progress-bar, workflow-map, lib/status, lib/paths)
```

### 10.3 Session Guide

| Module | 파일 | 설명 | 예상 라인 |
|--------|------|------|-----------|
| module-1 | `lib/ui/progress-bar.js` | Progress Bar 렌더링 | ~60줄 |
| module-2 | `lib/ui/workflow-map.js` | Workflow Map 렌더링 | ~50줄 |
| module-3 | `hooks/session-start.js` | Orchestrator 리팩토링 | ~80줄 |

**추천**: 단일 세션에서 모두 구현 가능 (전체 ~190줄)
