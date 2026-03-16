#!/usr/bin/env node
/**
 * VAIS Code - UserPromptSubmit Handler
 * 사용자 입력에서 의도를 감지하여 워크플로우 컨텍스트 주입
 */
const { readStdin, outputAllow, outputEmpty } = require('../lib/io');
const { debugLog } = require('../lib/debug');
const { getActiveFeature, getProgressSummary } = require('../lib/status');
const { loadConfig } = require('../lib/paths');

const input = readStdin();
const userPrompt = input.prompt || input.user_message || input.message || '';

if (!userPrompt || userPrompt.length < 3) {
  outputEmpty();
  process.exit(0);
}

const promptLower = userPrompt.toLowerCase();

// 워크플로우 관련 키워드 감지
const INTENT_PATTERNS = [
  { keywords: ['init', '초기화', '적용', '기존 프로젝트', '문서 생성', '역분석', '코드 분석'], phase: 'init' },
  { keywords: ['아이디어', '조사', 'research', '뭐 만들', '만들고 싶', 'mvp', '브레인스토밍'], phase: 'research' },
  { keywords: ['기획', '계획', 'plan', '요구사항', 'prd', '기능 정의'], phase: 'plan' },
  { keywords: ['ia', 'information architecture', '정보 구조', '사이트맵', 'sitemap', '네비게이션'], phase: 'ia' },
  { keywords: ['와이어프레임', 'wireframe', '목업', 'mockup', '화면 구성', '레이아웃'], phase: 'wireframe' },
  { keywords: ['ui', 'ux', '디자인', 'design', '인터랙션', '스타일 가이드', 'db', '데이터베이스', 'database', '스키마', 'schema', 'erd'], phase: 'design' },
  { keywords: ['프론트', 'frontend', 'fe', 'react', 'next', 'vue', '컴포넌트', '화면 개발'], phase: 'fe' },
  { keywords: ['백엔드', 'backend', 'be', 'api', '서버', 'express', 'nest', 'fastapi'], phase: 'be' },
  { keywords: ['gap', 'check', '빌드', '검증', '분석'], phase: 'check' },
  { keywords: ['리뷰', 'review', '검토', '코드 리뷰', '품질', '보안 점검'], phase: 'review' },
  { keywords: ['/vais fix', 'vais fix'], phase: 'fix' },
];

const activeFeature = getActiveFeature();
let detectedPhase = null;

for (const { keywords, phase } of INTENT_PATTERNS) {
  if (keywords.some(k => promptLower.includes(k))) {
    detectedPhase = phase;
    break;
  }
}

// 범위 지정 패턴 감지: "plan부터 backend까지", "plan~backend"
const config = loadConfig();
const phases = config.workflow?.phases || [];
const phaseNames = config.workflow?.phaseNames || {};

// 한글 이름 → phase key 역매핑
const nameToKey = {};
for (const [key, name] of Object.entries(phaseNames)) {
  nameToKey[name] = key;
  nameToKey[key] = key;
}

// 체이닝 패턴 감지: "plan:ia:wireframe", "fe+be", 혼합
const chainingPattern = /^\/vais\s+([\w+:]+)\s+(.+)$/i;
const chainingMatch = userPrompt.match(chainingPattern);

if (chainingMatch) {
  const [, chainExpr, featureName] = chainingMatch;
  // : 또는 + 가 포함된 체이닝 표현인지 확인 (단일 단계가 아닌 경우만)
  if (chainExpr.includes(':') || chainExpr.includes('+')) {
    const segments = chainExpr.split(':');
    const allValid = segments.every(seg => {
      const parts = seg.split('+');
      return parts.every(p => phases.includes(p) || Object.values(nameToKey).includes(p));
    });

    if (allValid) {
      debugLog('PromptHandler', 'Chaining detected', { chain: chainExpr, feature: featureName });
      const desc = segments.map(seg => {
        if (seg.includes('+')) {
          const parts = seg.split('+');
          return parts.map(p => phaseNames[p] || p).join(' + ');
        }
        return phaseNames[seg] || seg;
      }).join(' → ');
      outputAllow(
        `🔗 체이닝 실행: ${desc}\n` +
        `피처: "${featureName}"\n` +
        `(:는 순차, +는 병렬 실행)`
      );
      process.exit(0);
    }
  }
}

// 범위 패턴: "plan부터 backend까지"
const rangePattern = /(\w+)\s*부터\s*(\w+)\s*까지/;
const rangeMatch = promptLower.match(rangePattern);

if (rangeMatch) {
  const [, fromRaw, toRaw] = rangeMatch;
  const from = nameToKey[fromRaw] || fromRaw;
  const to = nameToKey[toRaw] || toRaw;

  if (phases.includes(from) && phases.includes(to)) {
    const fromIdx = phases.indexOf(from);
    const toIdx = phases.indexOf(to);

    if (fromIdx <= toIdx) {
      const rangePhases = phases.slice(fromIdx, toIdx + 1);
      // 병렬 그룹 적용: fe+be
      const parallelGroups = config.parallelGroups || {};
      const implGroup = parallelGroups.implementation || [];
      const chainParts = [];
      let i = 0;
      while (i < rangePhases.length) {
        const p = rangePhases[i];
        if (implGroup.includes(p)) {
          const siblings = rangePhases.filter(rp => implGroup.includes(rp));
          if (siblings.length > 1) {
            chainParts.push(siblings.join('+'));
            // skip all siblings — findIndex returns -1 when no non-impl phase remains
            const nextNonImpl = rangePhases.slice(i).findIndex(rp => !implGroup.includes(rp));
            if (nextNonImpl === -1) {
              i = rangePhases.length;
            } else {
              i += nextNonImpl;
            }
            continue;
          }
        }
        chainParts.push(p);
        i++;
      }
      const chainExpr = chainParts.join(':');
      const chainDesc = chainParts.map(seg => {
        if (seg.includes('+')) {
          return seg.split('+').map(p => phaseNames[p] || p).join(' + ');
        }
        return phaseNames[seg] || seg;
      }).join(' → ');

      const feature = activeFeature || '{기능명}';
      debugLog('PromptHandler', 'Range → auto chaining', { from, to, chain: chainExpr, feature });
      outputAllow(
        `🚀 범위 실행: ${chainDesc}\n` +
        `체이닝 변환: \`/vais ${chainExpr} ${feature}\`\n` +
        `(:는 순차, +는 병렬 실행)`
      );
      process.exit(0);
    }
  }
}

if (detectedPhase && activeFeature) {
  const phaseName = phaseNames[detectedPhase] || detectedPhase;
  const msg = `💡 "${phaseName}" 관련 요청이 감지되었습니다. ` +
    `진행 중인 피처: "${activeFeature}"\n` +
    `해당 단계의 스킬을 사용하려면: \`/vais ${detectedPhase} ${activeFeature}\``;

  debugLog('PromptHandler', 'Intent detected', { phase: detectedPhase, feature: activeFeature });
  outputAllow(msg);
} else {
  outputEmpty();
}

process.exit(0);
