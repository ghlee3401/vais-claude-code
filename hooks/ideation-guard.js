'use strict';

/**
 * VAIS Code — Ideation Guard Hook (F1 - PostToolUse)
 * 00-ideation/main.md Write 이벤트 감지 → project-profile.yaml 미존재 시
 * Profile 초안 추출 + 합의 안내를 additionalContext에 주입.
 *
 * Hook 타입: PostToolUse (Write|Edit matcher)
 * hooks.json 에 등록 필요:
 *   "PostToolUse" > matcher: "Write|Edit" > command: ideation-guard.js
 *
 * @see https://docs.anthropic.com/en/docs/claude-code/hooks
 * @see docs/subagent-architecture-rethink/02-design/technical-architecture-design.md 섹션 2
 * @see docs/subagent-architecture-rethink/02-design/_tmp/infra-architect.md 섹션 2.1~2.3
 *
 * > 참조 문서:
 * > - technical-architecture-design.md 섹션 2: PostToolUse 훅 플로우
 * > - infra-architect.md 섹션 2.2: 플로우 차트
 * > - infra-architect.md 섹션 2.3: extractProfileDraft 키워드 스캔 패턴
 * > - solution-features.md F1: SC-01 수용 기준
 */

const fs = require('fs');
const path = require('path');

const { readStdin, parseHookInput, outputAllow, outputEmpty } = require('../lib/io');
const { PROJECT_DIR } = require('../lib/paths');

// lib/project-profile은 선택적 — 미로드 시 graceful degradation
let profileModule;
try {
  profileModule = require('../lib/project-profile');
} catch (e) {
  profileModule = null;
}

// ── Profile 초안 추출 ─────────────────────────────────────────

/**
 * ideation main.md 내용에서 키워드를 스캔하여 Project Profile 초안 생성.
 * 매핑 불가 필드는 null (사용자가 직접 입력).
 *
 * 키워드 매핑 전략:
 * - "saas" / "b2b" / "b2c" 등 → type
 * - "mvp" / "scale" 등 → stage
 * - "pii" / "개인정보" → handles_pii
 * - "payment" / "결제" → handles_payments
 * - "cloud" / "클라우드" → deployment.target
 *
 * @param {string} content  - ideation main.md 전체 내용
 * @param {string} feature  - 피처명
 * @returns {object}        - Profile 초안 객체
 *
 * @see docs/subagent-architecture-rethink/02-design/_tmp/infra-architect.md 섹션 2.3
 */
function extractProfileDraft(content, feature) {
  const SCHEMA_VERSION = profileModule ? profileModule.PROFILE_SCHEMA_VERSION : '1.0';

  const draft = {
    _schema_version: SCHEMA_VERSION,
    _feature: feature,
    type: null,
    stage: 'idea', // 기본값
    users: {
      target_scale: 'proto',
      geography: 'domestic',
    },
    business: {
      revenue_model: 'none',
      monetization_active: false,
    },
    data: {
      handles_pii: false,
      handles_payments: false,
      handles_health: false,
      cross_border_transfer: false,
    },
    deployment: {
      target: 'local-only',
      sla_required: false,
    },
    brand: {
      seo_dependent: false,
      public_marketing: false,
    },
  };

  if (!content || typeof content !== 'string') return draft;

  const c = content.toLowerCase();

  // ── type 추론 ────────────────────────────────────────────────
  if (/\bb2b\b.*saas|\bsaas\b.*b2b/i.test(content)) {
    draft.type = 'b2b-saas';
  } else if (/\bb2c\b/i.test(content)) {
    draft.type = 'b2c-app';
  } else if (/\bmarketplace|마켓플레이스/i.test(content)) {
    draft.type = 'marketplace';
  } else if (/\bopen.?source|\boss\b/i.test(content)) {
    draft.type = 'oss';
  } else if (/\binternal.?tool|내부\s*도구/i.test(content)) {
    draft.type = 'internal-tool';
  } else if (/\bapi.?only|\bapi\s+server/i.test(content)) {
    draft.type = 'api-only';
  } else if (/\bplugin|플러그인/i.test(content)) {
    draft.type = 'plugin';
  } else if (/\bsaas\b/i.test(content)) {
    draft.type = 'b2b-saas'; // 단독 saas → 기본 b2b-saas
  }

  // ── stage 추론 ───────────────────────────────────────────────
  if (/\bscale|확장\s*단계/i.test(content)) {
    draft.stage = 'scale';
  } else if (/\bpmf|product.?market.?fit/i.test(content)) {
    draft.stage = 'pmf';
  } else if (/\bmvp|최소\s*기능/i.test(content)) {
    draft.stage = 'mvp';
  } else if (/\bmature|성숙\s*단계/i.test(content)) {
    draft.stage = 'mature';
  }

  // ── users.target_scale 추론 ──────────────────────────────────
  if (/100만|million\s*users?|100k\+/i.test(content)) {
    draft.users.target_scale = '100k+';
  } else if (/1만|만\s*명|10,?000|1k.100k/i.test(content)) {
    draft.users.target_scale = '1k-100k';
  } else if (/1,?000명|sub.1k|소규모/i.test(content)) {
    draft.users.target_scale = 'sub-1k';
  } else if (/\bpilot|파일럿/i.test(content)) {
    draft.users.target_scale = 'pilot';
  }

  // ── users.geography 추론 ─────────────────────────────────────
  if (/\bglobal|글로벌|해외|international/i.test(content)) {
    draft.users.geography = 'global';
  } else if (/\bregulated|규제\s*지역|gdpr|hipaa/i.test(content)) {
    draft.users.geography = 'regulated-region';
  }

  // ── business.revenue_model 추론 ─────────────────────────────
  if (/\bsubscription|구독|월정액/i.test(content)) {
    draft.business.revenue_model = 'subscription';
  } else if (/\btransaction|거래\s*수수료|per.use/i.test(content)) {
    draft.business.revenue_model = 'transaction';
  } else if (/\bads|광고\s*수익/i.test(content)) {
    draft.business.revenue_model = 'ads';
  } else if (/\bfreemium|프리미엄/i.test(content)) {
    draft.business.revenue_model = 'freemium';
  } else if (/\benterprise\s*sales|엔터프라이즈/i.test(content)) {
    draft.business.revenue_model = 'enterprise';
  }

  // ── business.monetization_active 추론 ───────────────────────
  if (/수익화|monetiz|유료|결제\s*기능/i.test(content)) {
    draft.business.monetization_active = true;
  }

  // ── data.handles_pii ────────────────────────────────────────
  if (/\bpii\b|개인정보|personal.?data|회원가입|로그인|login|signup/i.test(content)) {
    draft.data.handles_pii = true;
  }

  // ── data.handles_payments ────────────────────────────────────
  if (/\bpayment|결제|billing|card|카드|stripe|toss|pg\s/i.test(content)) {
    draft.data.handles_payments = true;
  }

  // ── data.handles_health ──────────────────────────────────────
  if (/\bhealth|의료|환자|patient|hipaa|건강/i.test(content)) {
    draft.data.handles_health = true;
  }

  // ── data.cross_border_transfer ───────────────────────────────
  if (/\bcross.border|해외\s*이전|gdpr|international\s*transfer/i.test(content)) {
    draft.data.cross_border_transfer = true;
  }

  // ── deployment.target ────────────────────────────────────────
  if (/\bcloud|클라우드|aws|gcp|azure|vercel|heroku/i.test(content)) {
    draft.deployment.target = 'cloud';
  } else if (/\bon.prem|온프레미스|사내\s*서버/i.test(content)) {
    draft.deployment.target = 'on-prem';
  } else if (/\bhybrid|하이브리드/i.test(content)) {
    draft.deployment.target = 'hybrid';
  } else if (/\bedge|에지\s*컴퓨팅/i.test(content)) {
    draft.deployment.target = 'edge';
  }

  // ── deployment.sla_required ──────────────────────────────────
  if (/\bsla|uptime|가용성|99\.9|장애\s*대응/i.test(content)) {
    draft.deployment.sla_required = true;
  }

  // ── brand.seo_dependent ──────────────────────────────────────
  if (/\bseo|검색\s*노출|organic\s*traffic|구글\s*검색/i.test(content)) {
    draft.brand.seo_dependent = true;
  }

  // ── brand.public_marketing ───────────────────────────────────
  if (/\bmarketing|마케팅|랜딩\s*페이지|landing\s*page|광고|campaign/i.test(content)) {
    draft.brand.public_marketing = true;
  }

  return draft;
}

// ── YAML 직렬화 (js-yaml 없이도 동작하는 단순 버전) ──────────

/**
 * Profile 객체를 사람이 읽기 쉬운 YAML 형식 문자열로 변환.
 * js-yaml 미설치 시 단순 문자열 생성으로 fallback.
 *
 * @param {object} profile
 * @returns {string}
 */
function profileToYaml(profile) {
  // js-yaml 사용 가능 시 표준 직렬화
  try {
    const yaml = require('js-yaml');
    return yaml.dump({ project_profile: profile }, { indent: 2, lineWidth: 120 });
  } catch (_) {
    // fallback: 수동 직렬화
  }

  const lines = ['project_profile:'];
  function addField(key, val, indent) {
    const pad = '  '.repeat(indent);
    if (val === null || val === undefined) {
      lines.push(`${pad}${key}: null  # 미결정 — 직접 입력해 주세요`);
    } else if (typeof val === 'object' && !Array.isArray(val)) {
      lines.push(`${pad}${key}:`);
      for (const [k, v] of Object.entries(val)) {
        addField(k, v, indent + 1);
      }
    } else {
      lines.push(`${pad}${key}: ${val}`);
    }
  }

  for (const [key, val] of Object.entries(profile)) {
    if (key.startsWith('_')) continue;
    addField(key, val, 1);
  }

  return lines.join('\n') + '\n';
}

// ── 합의 안내 컨텍스트 생성 ───────────────────────────────────

/**
 * Profile 초안을 포함한 합의 안내 컨텍스트 문자열 생성.
 *
 * @param {string} feature
 * @param {object} draft   - extractProfileDraft 결과
 * @returns {string}
 */
function buildConsentContext(feature, draft) {
  const yamlStr = profileToYaml(draft);
  const profilePath = `docs/${feature}/00-ideation/project-profile.yaml`;

  return [
    '---',
    '## [VAIS] Project Profile 합의 필요',
    '',
    `ideation(${feature}) 완료가 감지됐습니다.`,
    'VAIS는 아래 12변수 Project Profile 초안을 자동 추출했습니다.',
    '**확인 후 수정하고 승인해 주세요** — 이 값이 이후 모든 C-Level Context에 자동 주입됩니다.',
    '',
    '### 자동 추출된 초안',
    '',
    '```yaml',
    yamlStr.trim(),
    '```',
    '',
    '### 다음 단계',
    '',
    `1. 위 YAML을 검토하고 \`null\` 항목 또는 잘못된 값을 수정해 주세요.`,
    `2. 확정 후 \`${profilePath}\` 파일로 저장하세요.`,
    `   (직접 파일 작성 또는 AI에게 "profile 저장해줘"라고 요청)`,
    '',
    '**허용 값 참조**:',
    '- type: b2b-saas | b2c-app | marketplace | oss | internal-tool | api-only | plugin',
    '- stage: idea | mvp | pmf | scale | mature',
    '- users.target_scale: proto | pilot | sub-1k | 1k-100k | 100k+',
    '- users.geography: domestic | global | regulated-region',
    '- business.revenue_model: subscription | transaction | ads | freemium | enterprise | none',
    '- deployment.target: cloud | on-prem | hybrid | edge | local-only',
    '---',
    '',
  ].join('\n');
}

// ── 훅 메인 로직 ──────────────────────────────────────────────

/**
 * PostToolUse Write 훅 메인 함수.
 * stdin에서 hook 입력을 읽어 처리 후 stdout에 JSON 응답.
 */
function run() {
  const input = readStdin();
  const { filePath, content } = parseHookInput(input);

  // ── 대상 파일 확인: 00-ideation/main.md 인지 검사 ───────────
  // 형식: docs/{feature}/00-ideation/main.md
  const ideationMainRe = /[/\\]docs[/\\]([^/\\]+)[/\\]00-ideation[/\\]main\.md$/;
  const match = filePath ? filePath.match(ideationMainRe) : null;

  if (!match) {
    // ideation main.md 가 아닌 파일 → 패스스루
    outputEmpty();
    return;
  }

  const feature = match[1];

  // ── profile.yaml 이미 존재하는지 확인 ───────────────────────
  let profileYamlExists = false;
  try {
    if (profileModule) {
      const fPath = profileModule.profilePath(feature);
      profileYamlExists = fs.existsSync(fPath);
    } else {
      // profileModule 없을 때 직접 경로 구성
      const fPath = path.join(PROJECT_DIR, 'docs', feature, '00-ideation', 'project-profile.yaml');
      profileYamlExists = fs.existsSync(fPath);
    }
  } catch (_) {
    // path traversal 시도 등 예외 → 안전하게 패스스루
    outputEmpty();
    return;
  }

  if (profileYamlExists) {
    // 이미 합의된 profile 존재 → Context Load 주입 후 통과
    let contextBlock = '';
    if (profileModule) {
      try {
        contextBlock = profileModule.buildContextBlock(feature);
      } catch (_) {
        contextBlock = '';
      }
    }
    outputAllow(contextBlock || undefined);
    return;
  }

  // ── Profile 초안 추출 + 합의 안내 컨텍스트 주입 ─────────────
  const draft = extractProfileDraft(content, feature);
  const consentContext = buildConsentContext(feature, draft);

  outputAllow(consentContext);
}

// ── 실행 ──────────────────────────────────────────────────────

// 모듈로 사용 시 함수 export (테스트용)
module.exports = {
  extractProfileDraft,
  buildConsentContext,
  profileToYaml,
};

// CLI 직접 실행 시 hook 로직 동작
if (require.main === module) {
  run();
}
