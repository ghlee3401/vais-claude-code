'use strict';

/**
 * VAIS Code — Project Profile (F1)
 * ideation 종료 시 합의된 12변수 Profile을 로드/검증/평가.
 * 모든 C-Level 진입 시 Context Load에 자동 주입.
 *
 * @module lib/project-profile
 * @requires js-yaml   (YAML 파싱 — FAILSAFE_SCHEMA 전용)
 * @requires lib/paths (safePath, PROJECT_DIR, loadConfig)
 * @requires lib/fs-utils (fileExists, atomicWriteSync)
 *
 * @see https://github.com/nodeca/js-yaml#api
 * @see docs/subagent-architecture-rethink/02-design/technical-architecture-design.md
 * @see docs/subagent-architecture-rethink/03-do/solution-features.md#F1
 * @see docs/subagent-architecture-rethink/01-plan/nfr-and-data-model.md
 *
 * > 참조 문서:
 * > - technical-architecture-design.md 섹션 1: 8 함수 시그니처
 * > - infra-architect.md 섹션 1.1~1.3: 구현 상세 + evaluateScopeConditions 패서
 * > - solution-features.md F1: 12변수 schema
 * > - nfr-and-data-model.md 1.2: 보안 G-1 (path traversal / secret 차단)
 */

const fs = require('fs');
const path = require('path');

// js-yaml은 선택적 의존성 — 미설치 시 graceful degradation
let yaml;
try {
  yaml = require('js-yaml');
} catch (e) {
  yaml = null;
}

const { safePath, PROJECT_DIR, loadConfig } = require('./paths');
const { fileExists, atomicWriteSync } = require('./fs-utils');

// ── Schema 상수 ────────────────────────────────────────────────

const PROFILE_SCHEMA_VERSION = '1.0';

/**
 * Project Profile의 12 변수 허용 값 집합.
 * @see docs/subagent-architecture-rethink/03-do/solution-features.md#F1
 */
const ALLOWED_VALUES = {
  type: ['b2b-saas', 'b2c-app', 'marketplace', 'oss', 'internal-tool', 'api-only', 'plugin'],
  stage: ['idea', 'mvp', 'pmf', 'scale', 'mature'],
  'users.target_scale': ['proto', 'pilot', 'sub-1k', '1k-100k', '100k+'],
  'users.geography': ['domestic', 'global', 'regulated-region'],
  'business.revenue_model': ['subscription', 'transaction', 'ads', 'freemium', 'enterprise', 'none'],
  'deployment.target': ['cloud', 'on-prem', 'hybrid', 'edge', 'local-only'],
};

const BOOLEAN_FIELDS = [
  'business.monetization_active',
  'data.handles_pii',
  'data.handles_payments',
  'data.handles_health',
  'data.cross_border_transfer',
  'deployment.sla_required',
  'brand.seo_dependent',
  'brand.public_marketing',
];

/**
 * target_scale 순서 비교용 rank 맵.
 * proto < pilot < sub-1k < 1k-100k < 100k+
 * @see docs/subagent-architecture-rethink/02-design/_tmp/infra-architect.md 섹션 1.2
 */
const TARGET_SCALE_RANK = {
  proto: 0,
  pilot: 1,
  'sub-1k': 2,
  '1k-100k': 3,
  '100k+': 4,
};

/**
 * scope_conditions 파서 — 정규식 기반 (CEL 파서 불필요 — D-T5 YAGNI)
 * 형식: "field OP value" 또는 "field IN [v1,v2,...]"
 */
const COND_PATTERN = /^(\S+)\s+(=|!=|IN|NOT_IN|>=)\s+(.+)$/;

/**
 * 보안 G-1: secret 패턴 감지 정규식.
 * API key / token / secret / password 값에 8자+ 영숫자 문자열 포함 시 차단.
 * @see docs/subagent-architecture-rethink/01-plan/nfr-and-data-model.md 섹션 1.2
 */
const SECRET_PATTERN = /(?:api[_-]?key|token|secret|password)\s*[:=]\s*\S{8,}/i;

/**
 * high-entropy 문자열 추가 감지 (30자+ 영숫자).
 * GitHub PAT(ghp_), Stripe(sk_), 일반 랜덤 토큰 대응.
 */
const HIGH_ENTROPY_PATTERN = /(?:ghp_|sk_|pk_|Bearer\s+)[A-Za-z0-9_-]{20,}|[A-Za-z0-9+/]{30,}={0,2}/;

// ── feature 이름 유효성 검사 ──────────────────────────────────

/**
 * feature 이름 유효성 검사 (path traversal 차단).
 * - ".." 포함 금지
 * - 절대경로 시작 금지
 * - kebab-case 영숫자만 허용
 *
 * @param {string} feature
 * @throws {Error} 유효하지 않은 feature 이름
 */
function validateFeatureName(feature) {
  if (typeof feature !== 'string' || feature.length === 0) {
    throw new Error('[VAIS Profile] feature 이름이 비어 있습니다.');
  }
  // 절대 경로 거부
  if (path.isAbsolute(feature)) {
    throw new Error(`[VAIS Profile] Path traversal blocked: 절대경로 거부 "${feature}"`);
  }
  // ".." 포함 거부
  if (feature.includes('..')) {
    throw new Error(`[VAIS Profile] Path traversal blocked: ".." 포함 "${feature}"`);
  }
  // 허용 문자: 영문자, 숫자, 하이픈, 언더스코어
  if (!/^[a-zA-Z0-9_-]+$/.test(feature)) {
    throw new Error(`[VAIS Profile] 유효하지 않은 feature 이름 "${feature}" — kebab-case 영숫자만 허용`);
  }
}

// ── 경로 해석 ─────────────────────────────────────────────────

/**
 * feature 의 ideation profile.yaml 경로를 반환.
 * 형식: docs/{feature}/00-ideation/project-profile.yaml
 *
 * @param {string} feature  - 피처명 (kebab-case 영문)
 * @returns {string}        - 절대 경로 (PROJECT_DIR 기준)
 * @throws {Error}          - path traversal 시도 시
 */
function profilePath(feature) {
  validateFeatureName(feature);
  const relative = path.join('docs', feature, '00-ideation', 'project-profile.yaml');
  return safePath(PROJECT_DIR, relative);
}

// ── 보조: 중첩 객체 값 조회 ──────────────────────────────────

/**
 * 점 표기법(dot notation)으로 중첩 객체 값 조회.
 * 예: getNestedValue(obj, "users.target_scale") → obj.users.target_scale
 *
 * @param {object} obj
 * @param {string} dotPath
 * @returns {*}
 */
function getNestedValue(obj, dotPath) {
  return dotPath.split('.').reduce((curr, key) => (curr != null ? curr[key] : undefined), obj);
}

// ── 보안: secret 감지 ─────────────────────────────────────────

/**
 * 문자열에서 secret 패턴 감지 (G-1 NFR 보안).
 *
 * @param {string} value  - 검사할 문자열
 * @returns {boolean}     - true = secret 패턴 발견됨
 */
function detectSecrets(value) {
  if (typeof value !== 'string') return false;
  if (SECRET_PATTERN.test(value)) return true;
  if (HIGH_ENTROPY_PATTERN.test(value)) return true;
  return false;
}

// ── Schema: 기본값 적용 ───────────────────────────────────────

/**
 * Profile 스키마 정의 로드 (인메모리 상수 반환).
 * 향후 외부 schema 파일 지원 시 이 함수를 확장.
 *
 * @returns {object} schema 메타데이터
 */
function loadProfileSchema() {
  return {
    version: PROFILE_SCHEMA_VERSION,
    fields: Object.keys(ALLOWED_VALUES).concat(BOOLEAN_FIELDS),
    allowedValues: ALLOWED_VALUES,
    booleanFields: BOOLEAN_FIELDS,
  };
}

/**
 * Profile 객체에 기본값 적용.
 * 누락된 선택 필드를 안전한 기본값으로 채움.
 *
 * @param {object} profile  - 원본 profile (raw YAML parse 결과)
 * @returns {object}        - 기본값이 채워진 profile
 */
function applyDefaults(profile) {
  const p = Object.assign({}, profile);

  // 최상위 스칼라 기본값
  if (!p.type) p.type = null;
  if (!p.stage) p.stage = 'idea';

  // 중첩 객체 기본값
  p.users = Object.assign({ target_scale: 'proto', geography: 'domestic' }, p.users || {});
  p.business = Object.assign({ revenue_model: 'none', monetization_active: false }, p.business || {});
  p.data = Object.assign(
    { handles_pii: false, handles_payments: false, handles_health: false, cross_border_transfer: false },
    p.data || {}
  );
  p.deployment = Object.assign({ target: 'local-only', sla_required: false }, p.deployment || {});
  p.brand = Object.assign({ seo_dependent: false, public_marketing: false }, p.brand || {});

  return p;
}

// ── 로드 ──────────────────────────────────────────────────────

/**
 * project-profile.yaml 파일을 읽어 파싱된 ProfileObject 반환.
 * 파일이 없으면 null 반환 (에러 throw 안 함).
 *
 * 보안:
 * - feature 값은 validateFeatureName()으로 traversal 방지
 * - YAML 파싱은 js-yaml FAILSAFE_SCHEMA로 코드실행 방지
 *   (FAILSAFE_SCHEMA: 문자열만 파싱, 임의 JS 생성자/함수 실행 불가)
 *
 * @param {string} feature  - 피처명
 * @returns {object|null}   - ProjectProfile 또는 null
 *
 * @see https://github.com/nodeca/js-yaml#load-string---options-
 */
function loadProfile(feature) {
  // path traversal 방지 (throw 가능)
  const fPath = profilePath(feature);

  if (!fileExists(fPath)) {
    return null;
  }

  const raw = fs.readFileSync(fPath, 'utf8');

  let parsed;
  if (yaml) {
    // @see https://github.com/nodeca/js-yaml#api — FAILSAFE_SCHEMA: strings only, no code execution
    parsed = yaml.load(raw, { schema: yaml.FAILSAFE_SCHEMA });
  } else {
    // js-yaml 미설치 시 경고 후 null 반환
    process.stderr.write('[VAIS Profile] ⚠ js-yaml 미설치 — profile 로드 불가. npm install 실행 권장.\n');
    return null;
  }

  if (!parsed || typeof parsed !== 'object') {
    process.stderr.write(`[VAIS Profile] ⚠ ${fPath} — YAML 파싱 결과가 객체가 아닙니다.\n`);
    return null;
  }

  // project_profile 루트 키 있으면 unwrap
  const data = parsed.project_profile || parsed;

  // 메타 필드 주입
  data._schema_version = PROFILE_SCHEMA_VERSION;
  data._feature = feature;

  // 기본값 적용
  return applyDefaults(data);
}

// ── 검증 ──────────────────────────────────────────────────────

/**
 * ProfileObject의 유효성을 검사.
 * ALLOWED_VALUES 열거 검사 + BOOLEAN_FIELDS 타입 검사 + secret 패턴 차단 (G-1 NFR).
 *
 * FAILSAFE_SCHEMA로 파싱된 경우 모든 값은 string이므로
 * boolean 필드는 "true"/"false" 문자열도 허용.
 *
 * @param {object} profile  - loadProfile() 반환 객체
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateProfile(profile) {
  const errors = [];

  if (!profile || typeof profile !== 'object') {
    return { valid: false, errors: ['profile이 객체가 아닙니다.'] };
  }

  // ── enum 검증 ──────────────────────────────────────────────
  for (const [dotField, allowed] of Object.entries(ALLOWED_VALUES)) {
    const val = getNestedValue(profile, dotField);
    if (val === null || val === undefined) continue; // null = 미결정 허용
    const strVal = String(val).trim();
    if (!allowed.includes(strVal)) {
      errors.push(`[enum] "${dotField}" 값 "${strVal}" 이 허용 목록에 없습니다. 허용: [${allowed.join(', ')}]`);
    }
    // secret 패턴 검사
    if (detectSecrets(strVal)) {
      errors.push(`[security G-1] "${dotField}" 값에 secret 패턴이 감지됐습니다. 민감 정보를 profile에 포함하지 마세요.`);
    }
  }

  // ── boolean 타입 검증 ──────────────────────────────────────
  for (const dotField of BOOLEAN_FIELDS) {
    const val = getNestedValue(profile, dotField);
    if (val === null || val === undefined) continue; // 미결정 허용

    const isActualBool = typeof val === 'boolean';
    const isStringBool = typeof val === 'string' && (val === 'true' || val === 'false');

    if (!isActualBool && !isStringBool) {
      errors.push(`[type] "${dotField}" 는 boolean (true/false) 이어야 합니다. 현재 값: "${val}" (${typeof val})`);
    }
  }

  // ── 전체 문자열 필드 secret 스캔 ────────────────────────────
  function scanObject(obj, prefix) {
    for (const [k, v] of Object.entries(obj || {})) {
      if (k.startsWith('_')) continue; // 메타 필드 skip
      const fullKey = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'string' && detectSecrets(v)) {
        errors.push(`[security G-1] "${fullKey}" 값에 secret 패턴이 감지됐습니다.`);
      } else if (v && typeof v === 'object' && !Array.isArray(v)) {
        scanObject(v, fullKey);
      }
    }
  }
  scanObject(profile, '');

  return { valid: errors.length === 0, errors };
}

// ── Scope Conditions 평가 ─────────────────────────────────────

/**
 * 조건 문자열 1개를 파싱하여 { field, op, value?, values? } 반환.
 * 파싱 실패 시 null 반환.
 *
 * @param {string} condStr
 * @returns {{ field: string, op: string, value?: string, values?: string[] } | null}
 */
function parseCondition(condStr) {
  const m = condStr.trim().match(COND_PATTERN);
  if (!m) return null;
  const [, field, op, rawVal] = m;
  if (op === 'IN' || op === 'NOT_IN') {
    // "[v1,v2,v3]" → ['v1', 'v2', 'v3']
    const vals = rawVal.replace(/^\[|\]$/g, '').split(',').map((v) => v.trim());
    return { field, op, values: vals };
  }
  return { field, op, value: rawVal.trim() };
}

/**
 * 프로파일 값을 boolean으로 정규화 (FAILSAFE_SCHEMA "true"/"false" 문자열 대응).
 *
 * @param {*} val
 * @returns {boolean}
 */
function toBool(val) {
  if (typeof val === 'boolean') return val;
  if (val === 'true') return true;
  if (val === 'false') return false;
  return Boolean(val);
}

/**
 * 단일 조건을 profile에 대해 평가.
 *
 * @param {{ field: string, op: string, value?: string, values?: string[] }} cond
 * @param {object} profile
 * @returns {boolean}
 */
function evaluateCondition(cond, profile) {
  if (!cond) return false;

  const { field, op, value, values } = cond;
  const profileVal = getNestedValue(profile, field);

  // target_scale >= 비교는 rank 맵 사용
  if (op === '>=' && field === 'users.target_scale') {
    const profileRank = TARGET_SCALE_RANK[String(profileVal)] ?? -1;
    const condRank = TARGET_SCALE_RANK[String(value)] ?? -1;
    return profileRank >= condRank;
  }

  // boolean 필드 처리
  if (BOOLEAN_FIELDS.includes(field)) {
    const profileBool = toBool(profileVal);
    if (op === '=' || op === '==') return profileBool === toBool(value);
    if (op === '!=') return profileBool !== toBool(value);
    if (op === 'IN') return values ? values.map(toBool).includes(profileBool) : false;
    if (op === 'NOT_IN') return values ? !values.map(toBool).includes(profileBool) : true;
    return false;
  }

  // 일반 문자열 비교
  const strVal = profileVal !== null && profileVal !== undefined ? String(profileVal) : '';

  switch (op) {
    case '=':
    case '==':
      return strVal === String(value);
    case '!=':
      return strVal !== String(value);
    case 'IN':
      return values ? values.includes(strVal) : false;
    case 'NOT_IN':
      return values ? !values.includes(strVal) : true;
    case '>=': {
      // 일반 필드 >= 는 숫자 비교 시도 후 문자열 비교
      const numProfile = parseFloat(strVal);
      const numCond = parseFloat(String(value));
      if (!isNaN(numProfile) && !isNaN(numCond)) return numProfile >= numCond;
      return strVal >= String(value);
    }
    default:
      return false;
  }
}

/**
 * template frontmatter 의 scope_conditions 배열을 평가하여
 * 현재 Profile에서 해당 산출물 생성 여부를 결정.
 *
 * 문법 (CEL-like dict 비교, YAGNI 단순 구현 — D-T5):
 *   condition := field op value
 *   op := "=" | "!=" | "IN" | "NOT_IN" | ">="
 *
 * 배열 조건은 AND 로 결합 (모든 조건이 true여야 pass).
 * 빈 배열 = always pass.
 *
 * @param {string[]} conditions  - scope_conditions 배열
 * @param {object} profile       - ProjectProfile
 * @returns {boolean}            - true = 산출물 생성, false = skip
 *
 * @see docs/subagent-architecture-rethink/02-design/_tmp/infra-architect.md 섹션 1.2
 */
function evaluateScopeConditions(conditions, profile) {
  if (!Array.isArray(conditions) || conditions.length === 0) {
    return true; // 빈 조건 = always pass
  }
  if (!profile || typeof profile !== 'object') {
    return false; // profile 없으면 scope 조건 평가 불가 → skip
  }

  for (const condStr of conditions) {
    const cond = parseCondition(condStr);
    if (!cond) {
      process.stderr.write(`[VAIS Profile] ⚠ 파싱 불가한 scope_condition: "${condStr}"\n`);
      continue; // 파싱 실패한 조건은 무시 (관대한 처리)
    }
    if (!evaluateCondition(cond, profile)) {
      return false; // AND 결합 — 하나라도 false면 전체 false
    }
  }

  return true;
}

// ── Context Load 주입 ──────────────────────────────────────────

/**
 * 현재 feature의 Profile을 읽어 C-Level Context Load용 마크다운 블록 반환.
 * ideation 미완료(파일 없음) 시 경고 문자열 반환 (에러 아님).
 *
 * @param {string} feature  - 피처명
 * @returns {string}        - Context Load 삽입용 마크다운 블록
 */
function buildContextBlock(feature) {
  let profile;
  try {
    profile = loadProfile(feature);
  } catch (e) {
    return `## [VAIS] Project Profile — 로드 오류\n> ⚠ ${e.message}\n`;
  }

  if (!profile) {
    return [
      `## [VAIS] Project Profile (${feature})`,
      '> ⚠ project-profile.yaml 미존재 — ideation 종료 후 Profile 합의를 진행해 주세요.',
      '> 파일 위치: `docs/' + feature + '/00-ideation/project-profile.yaml`',
      '',
    ].join('\n');
  }

  // 유효성 검사 결과 포함
  const { valid, errors } = validateProfile(profile);
  const validationNote = valid
    ? ''
    : `\n> ⚠ 검증 오류 ${errors.length}건: ${errors.slice(0, 2).join('; ')}${errors.length > 2 ? ' ...' : ''}`;

  return [
    `## [VAIS] Project Profile (${feature})`,
    `- type: ${profile.type || '미결정'} | stage: ${profile.stage || '미결정'}`,
    `- deployment.target: ${profile.deployment?.target || '미결정'} | sla_required: ${profile.deployment?.sla_required ?? false}`,
    `- users.target_scale: ${profile.users?.target_scale || '미결정'} | geography: ${profile.users?.geography || '미결정'}`,
    `- data.handles_pii: ${profile.data?.handles_pii ?? false} | handles_payments: ${profile.data?.handles_payments ?? false} | handles_health: ${profile.data?.handles_health ?? false}`,
    `- business.revenue_model: ${profile.business?.revenue_model || '미결정'} | monetization_active: ${profile.business?.monetization_active ?? false}`,
    `- brand.seo_dependent: ${profile.brand?.seo_dependent ?? false} | public_marketing: ${profile.brand?.public_marketing ?? false}`,
    validationNote,
    '',
  ].join('\n');
}

// ── 저장 ──────────────────────────────────────────────────────

/**
 * Profile 객체를 YAML로 직렬화하여 ideation 폴더에 원자적 저장.
 * 저장 전 validateProfile() 호출 — 검증 실패 시 throw.
 *
 * @param {string} feature
 * @param {object} profile
 * @returns {string} 저장된 파일의 절대 경로
 * @throws {Error}   검증 실패 또는 path traversal
 */
function saveProfile(feature, profile) {
  const { valid, errors } = validateProfile(profile);
  if (!valid) {
    throw new Error(`[VAIS Profile] 검증 실패 — 저장 거부:\n${errors.join('\n')}`);
  }

  const fPath = profilePath(feature); // throws on traversal
  const dir = path.dirname(fPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!yaml) {
    throw new Error('[VAIS Profile] js-yaml 미설치 — profile 저장 불가. npm install 실행 권장.');
  }

  // 메타 필드 주입
  profile._schema_version = PROFILE_SCHEMA_VERSION;
  profile._feature = feature;

  // @see https://github.com/nodeca/js-yaml#dump-object---options-
  const yamlStr = yaml.dump({ project_profile: profile }, { indent: 2, lineWidth: 120 });
  atomicWriteSync(fPath, yamlStr);

  return fPath;
}

// ── feature flag ──────────────────────────────────────────────

/**
 * vais.config.json > orchestration.profileGateEnabled 읽어 반환.
 * 필드 없으면 true (기본 ON — Sprint 7~14 GA 도달, sub-agent frontmatter 마이그레이션 완료).
 * 명시적으로 false 설정하면 OFF 유지 (opt-out 가능).
 *
 * @returns {boolean}
 */
function isProfileGateEnabled() {
  try {
    const config = loadConfig();
    const flag = config?.orchestration?.profileGateEnabled;
    if (flag === undefined || flag === null) return true;
    if (typeof flag === 'boolean') return flag;
    if (flag === 'true') return true;
    if (flag === 'false') return false;
    return Boolean(flag);
  } catch (_) {
    return true;
  }
}

// ── exports ───────────────────────────────────────────────────

module.exports = {
  // 경로
  profilePath,
  // 로드/저장
  loadProfile,
  saveProfile,
  // 검증
  validateProfile,
  detectSecrets,
  // 평가
  evaluateScopeConditions,
  // Context Load
  buildContextBlock,
  // feature flag
  isProfileGateEnabled,
  // 보조
  loadProfileSchema,
  applyDefaults,
  // 상수 (테스트/외부 참조용)
  PROFILE_SCHEMA_VERSION,
  ALLOWED_VALUES,
  BOOLEAN_FIELDS,
  TARGET_SCALE_RANK,
};
