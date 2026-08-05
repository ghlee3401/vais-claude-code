#!/usr/bin/env node
process.on('uncaughtException', e => { try { process.stderr.write(`[VAIS hook] prompt-handler crashed: ${e.message}\n`); } catch (_) {} process.exit(0); });
process.on('unhandledRejection', e => { try { process.stderr.write(`[VAIS hook] prompt-handler rejected: ${e && e.message || e}\n`); } catch (_) {} process.exit(0); });
/**
 * VAIS Code - UserPromptSubmit Handler
 * 사용자 입력에서 의도를 감지하여 워크플로우 컨텍스트 주입
 */
const { readStdin, outputAllow, outputEmpty } = require('../lib/io');
const { debugLog } = require('../lib/debug');
const { logHook } = require('../lib/hook-logger');
const { getActiveFeature, getProgressSummary } = require('../lib/status');
const { loadConfig } = require('../lib/paths');

// 워크플로우 관련 키워드 감지
const INTENT_PATTERNS = [
  { keywords: ['init', '초기화', '적용', '기존 프로젝트', '문서 생성', '역분석', '코드 분석'], phase: 'init' },
  { keywords: ['기획', '계획', 'plan', '요구사항', 'prd', '기능 정의', '아이디어', '조사', 'research', '뭐 만들', '만들고 싶', 'mvp', '브레인스토밍'], phase: 'plan' },
  { keywords: ['ui 설계', 'ux 설계', 'ui설계', 'ux설계', '디자인 토큰', 'design token', '인터랙션 설계', '스타일 가이드', 'db 설계', 'db설계', '데이터베이스 설계', 'database design', '스키마 설계', 'schema design', 'erd 설계', 'ia', 'information architecture', '정보 구조', '사이트맵', 'sitemap', '네비게이션', '와이어프레임', 'wireframe', '목업', 'mockup', '화면 구성', '레이아웃'], phase: 'design' },
  { keywords: ['인프라', 'infra', 'architect', '아키텍트', 'db 설정', '환경 설정', '마이그레이션', 'migration', '스키마', 'schema'], phase: 'design' },
  { keywords: ['프론트', 'frontend', 'react', 'next', 'vue', '컴포넌트', '화면 개발'], phase: 'do' },
  { keywords: ['백엔드', 'backend', 'api', '서버', 'express', 'nest', 'fastapi'], phase: 'do' },
  { keywords: ['qa', 'QA', 'gap 분석', 'gap분석', '검토', '코드 리뷰', '빌드 검증', '빌드검증', '보안 점검', '품질'], phase: 'qa' },
  { keywords: ['/vais fix', 'vais fix'], phase: 'manager' },
];

function main() {
const input = readStdin();
const userPrompt = input.prompt || input.user_message || input.message || '';

if (!userPrompt || userPrompt.length < 3) {
  outputEmpty();
  process.exit(0);
}

const promptLower = userPrompt.toLowerCase();

const activeFeature = getActiveFeature();

// URL 감지 → SEO 스킬 제안
const URL_PATTERN = /https?:\/\/[^\s]+/i;
const urlMatch = userPrompt.match(URL_PATTERN);
if (urlMatch && !promptLower.includes('/vais-seo') && !promptLower.includes('/vais ')) {
  const url = urlMatch[0];
  debugLog('PromptHandler', 'URL detected, suggesting SEO audit', { url });
  outputAllow(
    `🔍 URL이 감지되었습니다: ${url}\n` +
    `SEO 감사를 실행하려면: \`/vais-seo ${url}\``
  );
  process.exit(0);
}

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

// 체이닝 패턴 감지: "plan:design:architect", "frontend+backend", 혼합
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
      // 병렬 그룹 적용: frontend+backend
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

  logHook('UserPromptSubmit', 'ok', { detected: detectedPhase, feature: activeFeature });
  debugLog('PromptHandler', 'Intent detected', { phase: detectedPhase, feature: activeFeature });
  outputAllow(msg);
} else {
  logHook('UserPromptSubmit', 'ok', { detected: null });
  outputEmpty();
}

process.exit(0);
}

module.exports = { main, INTENT_PATTERNS };

if (require.main === module) {
  main();
}
