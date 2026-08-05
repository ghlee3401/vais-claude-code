'use strict';

/**
 * VAIS Code — Profile Gate 통합 테스트 (T-01 ~ T-07)
 *
 * 테스트 케이스:
 *   T-01 local-only + ci-cd-configurator scope → skip
 *   T-02 cloud + sla_required + runbook-author scope → 실행
 *   T-03 enum 위반 (type: invalid-type) → validateProfile errors
 *   T-04 bool 타입 위반 (handles_pii: "yes") → validateProfile errors
 *   T-05 secret 입력 (api_key 값 포함) → secret detect
 *   T-06 path traversal (feature = "../../etc") → throw Error
 *   T-07 scope 연산자 5개 (IN, NOT_IN, ==, !=, >=) → 모두 통과
 *
 * @see docs/subagent-architecture-rethink/02-design/technical-architecture-design.md 섹션 1 (T-01~T-07)
 * @see docs/subagent-architecture-rethink/02-design/_tmp/infra-architect.md 섹션 1.3
 *
 * Node.js 내장 test runner 사용 (node --test).
 * @see https://nodejs.org/api/test.html
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// 테스트 대상 모듈
const {
  validateProfile,
  evaluateScopeConditions,
  profilePath,
  detectSecrets,
  applyDefaults,
  ALLOWED_VALUES,
  BOOLEAN_FIELDS,
} = require('../../lib/project-profile');

// ── 공통 픽스처 ────────────────────────────────────────────────

/**
 * 기본 유효 Profile 객체 생성 (테스트마다 독립 복사본).
 * FAILSAFE_SCHEMA로 로드된 경우 boolean도 string일 수 있으므로
 * 실제 boolean 타입 사용.
 */
function makeProfile(overrides) {
  const base = {
    _schema_version: '1.0',
    _feature: 'test-feature',
    type: 'plugin',
    stage: 'mvp',
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
  return Object.assign({}, base, overrides);
}

// ── T-01: local-only 프로파일 + ci-cd-configurator scope → skip ──

describe('T-01: local-only 프로파일 + cloud scope_condition → skip', () => {
  it('deployment.target = local-only 이면 cloud/hybrid 조건 false 반환', () => {
    const profile = makeProfile({
      deployment: { target: 'local-only', sla_required: false },
    });

    // ci-cd-configurator scope_conditions: "deployment.target IN [cloud,hybrid]"
    const conditions = ['deployment.target IN [cloud,hybrid]'];
    const result = evaluateScopeConditions(conditions, profile);

    assert.strictEqual(result, false, 'local-only 는 cloud/hybrid IN 조건 실패 → skip');
  });

  it('빈 scope_conditions 는 항상 pass (always 정책)', () => {
    const profile = makeProfile();
    const result = evaluateScopeConditions([], profile);
    assert.strictEqual(result, true, '빈 조건 = always pass');
  });
});

// ── T-02: cloud + sla_required + runbook-author scope → 실행 ──

describe('T-02: cloud + sla_required + runbook-author scope → 실행', () => {
  it('cloud 배포 + sla_required=true → runbook-author scope 통과', () => {
    const profile = makeProfile({
      deployment: { target: 'cloud', sla_required: true },
      users: { target_scale: 'proto', geography: 'domestic' },
    });

    // runbook-author scope_conditions: "deployment.sla_required = true"
    const conditions = ['deployment.sla_required = true'];
    const result = evaluateScopeConditions(conditions, profile);

    assert.strictEqual(result, true, 'sla_required=true 이면 runbook-author 실행');
  });

  it('target_scale >= 1k-100k 조건: 1k-100k 이상이면 pass', () => {
    const profile = makeProfile({
      deployment: { target: 'cloud', sla_required: false },
      users: { target_scale: '1k-100k', geography: 'domestic' },
    });

    const conditions = ['users.target_scale >= 1k-100k'];
    const result = evaluateScopeConditions(conditions, profile);

    assert.strictEqual(result, true, '1k-100k >= 1k-100k → pass');
  });

  it('두 조건 AND: cloud + sla_required 모두 충족 시 pass', () => {
    const profile = makeProfile({
      deployment: { target: 'cloud', sla_required: true },
    });

    const conditions = [
      'deployment.target IN [cloud,hybrid]',
      'deployment.sla_required = true',
    ];
    const result = evaluateScopeConditions(conditions, profile);

    assert.strictEqual(result, true, 'cloud AND sla_required=true → pass');
  });
});

// ── T-03: enum 위반 (type: invalid-type) → validateProfile errors ──

describe('T-03: enum 위반 → validateProfile errors', () => {
  it('type = invalid-type → valid=false, errors 포함', () => {
    const profile = makeProfile({ type: 'invalid-type' });
    const { valid, errors } = validateProfile(profile);

    assert.strictEqual(valid, false, 'enum 위반 시 valid=false');
    assert.ok(
      errors.some((e) => e.includes('"type"') && e.includes('invalid-type')),
      `errors 에 type enum 오류 포함 — 현재 errors: ${JSON.stringify(errors)}`
    );
  });

  it('stage = unknown-stage → valid=false', () => {
    const profile = makeProfile({ stage: 'unknown-stage' });
    const { valid, errors } = validateProfile(profile);

    assert.strictEqual(valid, false);
    assert.ok(errors.some((e) => e.includes('"stage"')));
  });

  it('deployment.target = invalid → valid=false', () => {
    const profile = makeProfile({
      deployment: { target: 'invalid-target', sla_required: false },
    });
    const { valid, errors } = validateProfile(profile);

    assert.strictEqual(valid, false);
    assert.ok(errors.some((e) => e.includes('"deployment.target"')));
  });

  it('유효한 enum 값 → valid=true', () => {
    const profile = makeProfile({ type: 'plugin', stage: 'mvp' });
    const { valid, errors } = validateProfile(profile);

    // secret 패턴 없는 기본 profile은 valid
    assert.strictEqual(valid, true, `유효 profile은 valid=true — errors: ${JSON.stringify(errors)}`);
  });
});

// ── T-04: bool 타입 위반 (handles_pii: "yes") → validateProfile errors ──

describe('T-04: boolean 타입 위반 → validateProfile errors', () => {
  it('data.handles_pii = "yes" → valid=false (boolean 아님)', () => {
    const profile = makeProfile({
      data: {
        handles_pii: 'yes',    // "yes"는 허용되지 않는 값
        handles_payments: false,
        handles_health: false,
        cross_border_transfer: false,
      },
    });
    const { valid, errors } = validateProfile(profile);

    assert.strictEqual(valid, false, '"yes" 는 boolean 타입 위반 → valid=false');
    assert.ok(
      errors.some((e) => e.includes('handles_pii') || e.includes('type')),
      `errors 에 handles_pii 타입 오류 포함 — errors: ${JSON.stringify(errors)}`
    );
  });

  it('data.handles_pii = "true" (문자열) → valid=true (FAILSAFE_SCHEMA 호환)', () => {
    // FAILSAFE_SCHEMA로 파싱된 경우 "true" 문자열도 허용
    const profile = makeProfile({
      data: {
        handles_pii: 'true',
        handles_payments: 'false',
        handles_health: 'false',
        cross_border_transfer: 'false',
      },
    });
    const { valid } = validateProfile(profile);
    assert.strictEqual(valid, true, '"true" / "false" 문자열은 FAILSAFE_SCHEMA 호환으로 허용');
  });

  it('business.monetization_active = 1 (숫자) → valid=false', () => {
    const profile = makeProfile({
      business: { revenue_model: 'none', monetization_active: 1 },
    });
    const { valid, errors } = validateProfile(profile);
    assert.strictEqual(valid, false);
    assert.ok(errors.some((e) => e.includes('monetization_active')));
  });
});

// ── T-05: secret 입력 → detectSecrets 감지 ──

describe('T-05: secret 패턴 입력 → detectSecrets 감지', () => {
  it('api_key: sk-abc123... 포함 값 → detectSecrets=true', () => {
    const value = 'api_key: sk-abc123456789012345678901234567890';
    assert.strictEqual(detectSecrets(value), true, 'API key 패턴 감지');
  });

  it('GitHub PAT (ghp_) → detectSecrets=true', () => {
    const value = 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    assert.strictEqual(detectSecrets(value), true, 'GitHub PAT 패턴 감지');
  });

  it('평범한 문자열 → detectSecrets=false', () => {
    const value = 'b2b-saas';
    assert.strictEqual(detectSecrets(value), false, '평범한 값은 감지 안 됨');
  });

  it('secret 포함 profile → validateProfile valid=false', () => {
    // type 필드에 시크릿 삽입 시 enum + secret 둘 다 오류
    const profile = makeProfile({ type: 'api_key=sk-abc123456789012345678901234567890' });
    const { valid, errors } = validateProfile(profile);
    assert.strictEqual(valid, false);
    assert.ok(
      errors.some((e) => e.toLowerCase().includes('secret')),
      `secret 감지 오류 포함 — errors: ${JSON.stringify(errors)}`
    );
  });
});

// ── T-06: path traversal → throw Error ──

describe('T-06: path traversal → throw Error', () => {
  it('feature = "../../etc/passwd" → profilePath throws', () => {
    assert.throws(
      () => profilePath('../../etc/passwd'),
      (err) => {
        assert.ok(
          err instanceof Error,
          'Error 객체 throw'
        );
        assert.ok(
          err.message.includes('Path traversal') || err.message.includes('traversal') || err.message.includes('blocked'),
          `path traversal 메시지 포함 — 실제: "${err.message}"`
        );
        return true;
      }
    );
  });

  it('feature = "/etc/passwd" (절대 경로) → profilePath throws', () => {
    assert.throws(
      () => profilePath('/etc/passwd'),
      (err) => {
        assert.ok(err instanceof Error);
        return true;
      }
    );
  });

  it('feature = "valid-feature-name" → profilePath 정상 반환', () => {
    const result = profilePath('valid-feature-name');
    assert.ok(typeof result === 'string', '정상 feature 이름은 경로 반환');
    assert.ok(result.includes('valid-feature-name'), '경로에 feature 이름 포함');
    assert.ok(result.includes('00-ideation'), '경로에 00-ideation 포함');
    assert.ok(result.includes('project-profile.yaml'), '경로에 파일명 포함');
  });
});

// ── T-07: scope 연산자 5개 (IN, NOT_IN, ==, !=, >=) ──

describe('T-07: scope 연산자 5개 검증', () => {
  const profile = makeProfile({
    type: 'b2b-saas',
    stage: 'mvp',
    users: { target_scale: '1k-100k', geography: 'global' },
    deployment: { target: 'cloud', sla_required: true },
    data: { handles_pii: true, handles_payments: false, handles_health: false, cross_border_transfer: false },
  });

  it('IN 연산자: deployment.target IN [cloud,hybrid] → true', () => {
    const result = evaluateScopeConditions(
      ['deployment.target IN [cloud,hybrid]'],
      profile
    );
    assert.strictEqual(result, true, 'cloud IN [cloud,hybrid] → true');
  });

  it('NOT_IN 연산자: deployment.target NOT_IN [on-prem,edge] → true', () => {
    const result = evaluateScopeConditions(
      ['deployment.target NOT_IN [on-prem,edge]'],
      profile
    );
    assert.strictEqual(result, true, 'cloud NOT_IN [on-prem,edge] → true');
  });

  it('== 연산자 (= 형식): type = b2b-saas → true', () => {
    const result = evaluateScopeConditions(
      ['type = b2b-saas'],
      profile
    );
    assert.strictEqual(result, true, 'type == b2b-saas → true');
  });

  it('!= 연산자: stage != scale → true', () => {
    const result = evaluateScopeConditions(
      ['stage != scale'],
      profile
    );
    assert.strictEqual(result, true, 'mvp != scale → true');
  });

  it('>= 연산자 (target_scale rank): users.target_scale >= pilot → true', () => {
    // profile.users.target_scale = '1k-100k' (rank 3) >= 'pilot' (rank 1)
    const result = evaluateScopeConditions(
      ['users.target_scale >= pilot'],
      profile
    );
    assert.strictEqual(result, true, '1k-100k (rank 3) >= pilot (rank 1) → true');
  });

  it('>= 연산자: rank 비교 실패 케이스 — proto >= 1k-100k → false', () => {
    const protoProfile = makeProfile({
      users: { target_scale: 'proto', geography: 'domestic' },
    });
    const result = evaluateScopeConditions(
      ['users.target_scale >= 1k-100k'],
      protoProfile
    );
    assert.strictEqual(result, false, 'proto (rank 0) >= 1k-100k (rank 3) → false');
  });

  it('복수 AND 조건: IN + >= 모두 pass', () => {
    const result = evaluateScopeConditions(
      [
        'deployment.target IN [cloud,hybrid]',
        'users.target_scale >= pilot',
      ],
      profile
    );
    assert.strictEqual(result, true, '두 조건 AND → true');
  });

  it('복수 AND 조건: 하나가 실패하면 전체 false', () => {
    const result = evaluateScopeConditions(
      [
        'deployment.target IN [cloud,hybrid]',
        'stage = scale',  // profile.stage = mvp → false
      ],
      profile
    );
    assert.strictEqual(result, false, '하나 실패 → AND 전체 false');
  });
});

// ── 추가: applyDefaults 동작 검증 ──

describe('applyDefaults: 기본값 적용', () => {
  it('빈 객체 → 기본값으로 채워짐', () => {
    const result = applyDefaults({});
    assert.strictEqual(result.stage, 'idea', 'stage 기본값 = idea');
    assert.strictEqual(result.users.target_scale, 'proto', 'target_scale 기본값 = proto');
    assert.strictEqual(result.deployment.target, 'local-only', 'deployment.target 기본값 = local-only');
    assert.strictEqual(result.deployment.sla_required, false, 'sla_required 기본값 = false');
  });

  it('일부 필드 있으면 기존 값 유지', () => {
    const result = applyDefaults({ stage: 'mvp', users: { target_scale: 'sub-1k' } });
    assert.strictEqual(result.stage, 'mvp', 'stage 기존 값 유지');
    assert.strictEqual(result.users.target_scale, 'sub-1k', 'target_scale 기존 값 유지');
    assert.strictEqual(result.users.geography, 'domestic', 'geography 기본값 채워짐');
  });
});
