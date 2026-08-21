'use strict';

const crypto = require('crypto');
const taxonomy = require('../../contracts/workflow-taxonomy.json');
const { analyzeDimensions } = require('../ceo-algorithm');
const {
  normalizeCompileSignals,
  selectProfile,
  compilePhaseGraph,
} = require('./workflow-compiler');

const CLASSIFIER_VERSION = '1.0.0';
const ASSURANCE_RANK = { normal: 0, high: 1, regulated: 2 };
const TRIGGER_POLICY = Object.fromEntries(taxonomy.riskTriggers.map(rule => [rule.id, rule]));

const RISK_RULES = [
  ['auth', /\b(auth(?:entication)?|login|log-in|sign[ -]?in|oauth|password reset|password hashing|service account impersonation|mfa|2fa)\b|로그인|인증|비밀번호 재설정|비밀번호 해싱|서비스 계정 위임|다중 인증/i],
  ['authorization', /\b(authori[sz]ation|permission|role-based|role inheritance|rbac|access control|tenant isolation|administrator impersonation|admin(?:istrator)? access)\b|권한|역할 기반|역할 상속|접근 제어|관리자 위임|관리자 접근|테넌트 격리/i],
  ['payment', /\b(payment|checkout|billing|credit card|card charge|invoice|refund|payout|currency total)\b|결제|체크아웃|청구|카드|환불|판매자 정산|통화 합계/i],
  ['pii', /\b(pii|personal data|personal information|private customer|customer documents?|customer address(?:es)?|user emails?|user profile|onboarding funnel|audit history|health record)\b|개인정보|개인 정보|고객 문서|고객 주소|사용자 이메일|사용자 프로필|온보딩 퍼널|감사 이력|건강 기록|의료 기록/i],
  ['health', /\b(health(?:care)?|medical|clinical|patient|hipaa|health record)\b|건강|의료|환자|진료/i],
  ['regulated', /\b(regulated|regulatory|statutory|european privacy|privacy deletion|gdpr|hipaa|pci(?:-dss)?|sox|retention(?: policy)?|immutable .*audit|audit .*retention)\b|규제|법정 보존|유럽 개인정보|개인정보 삭제|컴플라이언스|보존 정책|불변 .*감사|감사 .*보존/i],
  ['cross-border', /\b(cross-border|data residency|regional residency|international transfer)\b|국경 간|데이터 레지던시|해외 이전/i],
  ['migration', /\b(database migration|schema migration|data migration|backfill|table migration|split .*table .*schemas?)\b|데이터베이스 마이그레이션|스키마 마이그레이션|데이터 이전|테이블 분할|백필/i],
  ['external-write', /\b(outbound webhook|publish(?:ing)?|send .* to (?:a )?(?:partner|external)|partner api|external system|create tickets automatically|send email|send message|third-party write|external side effect|provision|deploy to|upload to)\b|외부 웹훅|파트너 API|외부 시스템|티켓 자동 생성|외부 전송|메시지 발송|이메일 발송|배포 실행|프로비저닝/i],
  ['secret', /\b(secret|api key|access token|private key|credential|signing key|password hashing|key rotation|rotate .*key)\b|시크릿|API 키|액세스 토큰|개인 키|서명 키|비밀번호 해싱|자격 증명|키 순환/i],
  ['dependency', /\b(dependency|package upgrade|package update|plugin|extension|third-party library|supply chain|build toolchain)\b|의존성|패키지 업그레이드|플러그인|확장 생태계|공급망|빌드 도구 체인/i],
  ['infrastructure', /\b(infrastructure|deployment|pipeline|kubernetes|terraform|cloud resource|cloud region|production ingress|ingress controller|move workloads|failover|repository fleet)\b|인프라|배포 파이프라인|쿠버네티스|테라폼|클라우드 자원|클라우드 리전|운영 인그레스|워크로드 이동|장애 조치|전체 저장소/i],
  ['destructive', /\b(drop table|delete (?:data|.*records)|remove production (?:storage|resources?)|force delete|cleanup command|wipe|truncate|reset --hard|unsafe path)\b|테이블 삭제|데이터 삭제|레코드 일괄 삭제|운영 스토리지 제거|운영 자원 제거|강제 삭제|정리 명령|초기화 명령|위험 경로/i],
  ['untrusted-input', /\b(untrusted|file upload|document upload|uploaded archives?|extract .*contents|customer supplied templates?|render .*templates?|user input|prompt injection|archive import|plugin ecosystem|extension ecosystem)\b|신뢰하지 않는 입력|파일 업로드|문서 업로드|업로드 압축 파일|압축 해제|고객 제공 템플릿|사용자 입력|프롬프트 인젝션|플러그인 생태계/i],
  ['agent-capability', /\b(ai agent|autonomous agent|agent tool permissions?|tool permission|repository writes?|shell access|browser access|computer use|agent capability|mcp server|lifecycle hooks?)\b|AI 에이전트|자율 에이전트|에이전트 도구 권한|저장소 쓰기|도구 권한|셸 접근|브라우저 접근|에이전트 권한|MCP 서버|수명주기 훅/i],
];

const SENSITIVE_PATTERNS = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gi],
  ['aws-access-key', /\bAKIA[0-9A-Z]{16}\b/g],
  ['github-token', /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g],
  ['slack-token', /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g],
  ['bearer-token', /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}\b/gi],
  ['credential-assignment', /\b(password|passwd|secret|token|api[_ -]?key)\s*[:=]\s*[^\s,;]+/gi],
  ['email', /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g],
  ['payment-card', /\b(?:\d[ -]*?){13,19}\b/g],
];

function normalizeText(value) {
  return String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim();
}

// Keyed digest: an unsalted hash of a short prompt is trivially reversible by
// dictionary attack, so the key must live outside the event log (see shadow-runner).
function createRequestDigest(rawText, key) {
  if (!key || key.length === 0) throw new Error('digest key is required');
  return crypto.createHmac('sha256', key).update(String(rawText || ''), 'utf8').digest('hex');
}

// Digit runs like epoch timestamps also match the 13-19 digit card pattern;
// Luhn filters those false positives out of the reported metadata.
function passesLuhn(digits) {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let value = digits.charCodeAt(i) - 48;
    if (double) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
    double = !double;
  }
  return sum % 10 === 0;
}

// Detection only — the raw text is never persisted, so nothing is rewritten.
function detectSensitiveFields(rawText) {
  const text = normalizeText(rawText);
  const fields = [];
  for (const [kind, pattern] of SENSITIVE_PATTERNS) {
    pattern.lastIndex = 0;
    if (kind === 'payment-card') {
      const candidates = text.match(pattern) || [];
      const isCard = candidates.some(candidate => {
        const digits = candidate.replace(/[^0-9]/g, '');
        return digits.length >= 13 && digits.length <= 19 && passesLuhn(digits);
      });
      if (isCard) fields.push(kind);
      continue;
    }
    if (pattern.test(text)) fields.push(kind);
  }
  return { applied: fields.length > 0, fields: [...new Set(fields)] };
}

// Persisted summary is built only from classifier output and structural
// metadata — it must never contain or truncate verbatim prompt text.
function buildStructuralSummary(classification, rawText, maxLength = 240) {
  const text = normalizeText(rawText);
  const chars = text.length;
  const words = text ? text.split(' ').length : 0;
  const hasHangul = /[가-힣]/.test(text);
  const hasLatin = /[a-z]/i.test(text);
  const script = hasHangul && hasLatin ? 'ko+en' : hasHangul ? 'ko' : hasLatin ? 'en' : 'other';
  const sizeBucket = chars < 40 ? 'xs' : chars < 120 ? 's' : chars < 300 ? 'm' : chars < 800 ? 'l' : 'xl';
  const profile = classification.profile || {};
  const assurance = classification.assurance || {};
  const phaseGraph = classification.phaseGraph || {};
  const signals = Object.entries(classification.compileSignals || {})
    .filter(([key, value]) => value === true && key !== 'ceoAnalysisAvailable')
    .map(([key]) => key);
  const parts = [
    `profile=${profile.selected}<-${profile.recommended}@${profile.confidence}`,
    `assurance=${assurance.level}`,
    `triggers=${(assurance.triggers || []).join('+') || 'none'}`,
    `signals=${signals.join('+') || 'none'}`,
    `graph=${(phaseGraph.required || []).join('>')}`,
    `size=${sizeBucket}/${chars}c/${words}w`,
    `script=${script}`,
  ];
  return `[structural] ${parts.join(' ')}`.slice(0, maxLength);
}

function isReferenceOnlyChange(text) {
  const reference = /\b(readme|documentation|docs?|example|mock|fixture|sample)\b|문서|예시|목업|픽스처|테스트용/i.test(text);
  const narrow = /\b(rename|word|typo|spelling|label|name only|example only|text only|correct the word)\b|이름만|문구만|단어|오타|라벨|예시만/i.test(text);
  return reference && narrow;
}

function detectRiskTriggers(rawText) {
  const text = normalizeText(rawText);
  const referenceOnly = isReferenceOnlyChange(text);
  const suppressedForReference = new Set(['auth', 'payment', 'secret', 'pii']);
  const triggers = [];
  for (const [trigger, pattern] of RISK_RULES) {
    if (!pattern.test(text)) continue;
    if (referenceOnly && suppressedForReference.has(trigger)) continue;
    triggers.push(trigger);
  }

  if (triggers.includes('health') && !triggers.includes('regulated')) triggers.push('regulated');
  if (triggers.includes('health') && !triggers.includes('pii')) triggers.push('pii');
  if (triggers.includes('cross-border') && !triggers.includes('regulated')) triggers.push('regulated');
  if (/private customer documents?|고객의 비공개 문서/i.test(text)) {
    if (!triggers.includes('regulated')) triggers.push('regulated');
    if (!triggers.includes('external-write')) triggers.push('external-write');
  }
  return taxonomy.riskTriggers.map(rule => rule.id).filter(trigger => triggers.includes(trigger));
}

function deriveAssurance(triggers) {
  let level = 'normal';
  for (const trigger of triggers) {
    const minimum = TRIGGER_POLICY[trigger]?.minimumAssurance || 'normal';
    if (ASSURANCE_RANK[minimum] > ASSURANCE_RANK[level]) level = minimum;
  }
  return {
    level,
    triggers: [...triggers],
    reasons: triggers.length === 0 ? ['no-canonical-risk-trigger'] : triggers.map(trigger => `risk:${trigger}`),
  };
}

function inferCompileSignals(rawText, context = {}) {
  const text = normalizeText(rawText);
  const ceo = context.ceoDimensions || analyzeDimensions(text);
  const project = context.projectProfile || {};
  const inventory = context.repoInventory || {};
  const expectedContracts = context.expectedContracts || [];

  const signals = {
    uiFlow: /\b(ui|ux|screen|page|form|wizard|navigation|onboarding flow)\b|화면|페이지|폼|사용자 흐름|온보딩 흐름/i.test(text),
    apiContract: /\b(api contract|endpoint|webhook|file upload|document upload|event set|event contract|csv export)\b|API 계약|엔드포인트|웹훅|파일 업로드|문서 업로드|이벤트 세트|CSV 내보내기/i.test(text),
    dataModel: /\b(data model|schema shape|new table|new column|persistent history|immutable .*history|retention)\b|데이터 모델|스키마 구조|새 테이블|새 컬럼|영구 이력|불변 .*이력|보존 정책/i.test(text),
    architecture: /\b(architecture|replatform|ecosystem|platform|assistant using|across all repositories|multi-service|immutable .*history)\b|아키텍처|리플랫폼|생태계|플랫폼|전체 저장소|다중 서비스|불변 .*이력|전반적으로 정리/i.test(text),
    externalIntegration: /\b(third-party|external api|integration|webhook|outbound|plugin ecosystem|extension ecosystem)\b|외부 API|외부 연동|웹훅|플러그인 생태계/i.test(text),
    publicContract: /\b(public api|published contract|breaking api|sdk contract|cli contract)\b|공개 API|공개 계약|호환성 파괴|SDK 계약|CLI 계약/i.test(text),
    multiArea: /\b(across all|organization-wide|multi-service|multiple domains|end-to-end product|ecosystem)\b|전체 저장소|전사|여러 서비스|여러 도메인|제품 전체|생태계/i.test(text),
    highUncertainty: /\b(figure out|explore|unknown scope|redesign broadly|clean up overall|make it better)\b|알아서|전반적으로|범위가 불명확|탐색해|정리해줘|개선해줘/i.test(text),
    newProduct: /\b(build|create|launch)\s+(?:an?\s+)?(?:new\s+)?(?:[\w-]+\s+){0,3}(?:product|platform|service|app|ecosystem|ai assistant)\b|새 (?:제품|플랫폼|서비스|앱)|신규 (?:제품|플랫폼|서비스)|AI 비서.*만들|생태계.*구축/i.test(text),
    ceoAnalysisAvailable: context.ceoAnalysisAvailable === true,
  };

  if (ceo.productDefinition === 'high' && /신규|new product|new service|launch/i.test(text)) signals.newProduct = true;
  if (ceo.dataModel === 'high' && /model|schema|table|migration|모델|스키마|테이블|마이그레이션/i.test(text)) signals.dataModel = true;
  if (ceo.externalAPI === 'high') signals.externalIntegration = true;
  if (project.stage === 'idea' && /build|create|launch|만들|구축/i.test(text)) signals.newProduct = true;
  if (Array.isArray(inventory.touchedAreas) && inventory.touchedAreas.length > 1) signals.multiArea = true;
  if (Array.isArray(expectedContracts)) {
    if (expectedContracts.some(value => /api|event|schema/i.test(String(value)))) signals.apiContract = true;
    if (expectedContracts.some(value => /public|sdk|cli/i.test(String(value)))) signals.publicContract = true;
  }
  return normalizeCompileSignals(signals);
}

function recommendProfile(rawText, signals) {
  const text = normalizeText(rawText);
  const vague = signals.highUncertainty || text.length < 8;
  if (vague) {
    return { recommended: 'unknown', confidence: 0.35, reasons: ['ambiguous-scope'] };
  }

  if (signals.newProduct || signals.multiArea || /\b(replatform|ecosystem|organization-wide|roadmap|product strategy)\b|리플랫폼|생태계|전사|로드맵|제품 전략/i.test(text)) {
    return { recommended: 'initiative', confidence: 0.92, reasons: ['initiative-scope-language'] };
  }

  const patchLanguage = /\b(fix|correct|tune|rename|guard|typo|missing|small change|without changing|name only|wording)\b|수정|고쳐|조정|이름만|문구만|오타|누락|가드|기존 .* 유지/i.test(text);
  const featureLanguage = /\b(add|create|implement|support|enable|track|introduce)\b|추가|생성|구현|지원|활성화|추적|도입/i.test(text);

  if (patchLanguage && !signals.publicContract && !signals.dataModel) {
    return { recommended: 'patch', confidence: 0.9, reasons: ['bounded-change-language'] };
  }
  if (featureLanguage || signals.uiFlow || signals.apiContract || signals.externalIntegration || signals.dataModel) {
    return { recommended: 'feature', confidence: 0.82, reasons: ['bounded-capability-language'] };
  }
  return { recommended: 'feature', confidence: 0.52, reasons: ['default-bounded-work'] };
}

function classifyRequest(rawText, context = {}) {
  const normalized = normalizeText(rawText);
  if (!normalized) throw new Error('rawText must be a non-empty string');

  const compileSignals = inferCompileSignals(normalized, context);
  const recommendation = recommendProfile(normalized, compileSignals);
  const profileSelection = selectProfile(recommendation.recommended, compileSignals);
  const triggers = detectRiskTriggers(normalized);
  const assurance = deriveAssurance(triggers);
  const phaseGraph = compilePhaseGraph(profileSelection.selected, compileSignals);
  const profileReasons = [...recommendation.reasons];
  if (profileSelection.promoted) profileReasons.push(profileSelection.reason);

  return {
    classifierVersion: CLASSIFIER_VERSION,
    profile: {
      recommended: profileSelection.recommended,
      selected: profileSelection.selected,
      confidence: recommendation.confidence,
      reasons: profileReasons,
    },
    assurance,
    compileSignals,
    phaseGraph,
  };
}

module.exports = {
  CLASSIFIER_VERSION,
  normalizeText,
  createRequestDigest,
  detectSensitiveFields,
  buildStructuralSummary,
  isReferenceOnlyChange,
  detectRiskTriggers,
  deriveAssurance,
  inferCompileSignals,
  recommendProfile,
  classifyRequest,
};
