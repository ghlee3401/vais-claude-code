'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { validateAuditChain } = require('../lib/observability/audit-integrity');

const ROOT = path.join(__dirname, '..');
const readJson = relative => JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));

const previewSchema = readJson('schemas/execution-preview.schema.json');
const envelopeSchema = readJson('schemas/task-envelope.schema.json');
const auditSchema = readJson('schemas/audit-event.schema.json');
const fixtures = readJson('tests/fixtures/adaptive-workflow-contracts.json');

function typeMatches(expected, value) {
  const types = Array.isArray(expected) ? expected : [expected];
  return types.some(type => {
    if (type === 'null') return value === null;
    if (type === 'array') return Array.isArray(value);
    if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
    if (type === 'integer') return Number.isInteger(value);
    if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
    return typeof value === type;
  });
}

function validate(schema, value, location = '$') {
  if (schema.const !== undefined) {
    assert.deepEqual(value, schema.const, `${location}: const mismatch`);
  }
  if (schema.enum) {
    assert.ok(schema.enum.includes(value), `${location}: ${JSON.stringify(value)} not in enum`);
  }
  if (schema.type !== undefined) {
    assert.ok(typeMatches(schema.type, value), `${location}: type mismatch`);
  }
  if (value === null) return;

  if (typeof value === 'string') {
    if (schema.minLength !== undefined) assert.ok(value.length >= schema.minLength, `${location}: too short`);
    if (schema.pattern) assert.match(value, new RegExp(schema.pattern), `${location}: pattern mismatch`);
    if (schema.format === 'date-time') assert.ok(Number.isFinite(Date.parse(value)), `${location}: invalid date-time`);
  }

  if (typeof value === 'number') {
    if (schema.minimum !== undefined) assert.ok(value >= schema.minimum, `${location}: below minimum`);
    if (schema.maximum !== undefined) assert.ok(value <= schema.maximum, `${location}: above maximum`);
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined) assert.ok(value.length >= schema.minItems, `${location}: too few items`);
    if (schema.uniqueItems) assert.equal(new Set(value.map(item => JSON.stringify(item))).size, value.length, `${location}: duplicate items`);
    if (schema.items) value.forEach((item, index) => validate(schema.items, item, `${location}[${index}]`));
    return;
  }

  if (typeof value === 'object') {
    for (const key of schema.required || []) {
      assert.ok(Object.prototype.hasOwnProperty.call(value, key), `${location}: missing ${key}`);
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        assert.ok(schema.properties && schema.properties[key], `${location}: unexpected ${key}`);
      }
    }
    for (const [key, child] of Object.entries(schema.properties || {})) {
      if (Object.prototype.hasOwnProperty.call(value, key)) validate(child, value[key], `${location}.${key}`);
    }
  }
}

describe('adaptive workflow Phase 0A contracts', () => {
  it('normal/high 실행 예고 fixture가 schema를 충족한다', () => {
    for (const preview of fixtures.previews) validate(previewSchema, preview);
  });

  it('TaskEnvelope fixture가 schema를 충족하고 raw prompt를 저장하지 않는다', () => {
    for (const envelope of fixtures.envelopes) {
      validate(envelopeSchema, envelope);
      assert.equal(envelope.request.rawPersistence, 'none');
      assert.ok(!Object.prototype.hasOwnProperty.call(envelope.request, 'raw'));
      assert.ok(!Object.prototype.hasOwnProperty.call(envelope.request, 'rawText'));
    }
  });

  it('patch phase graph는 design/report를 not-required로 기록한다', () => {
    const patch = fixtures.envelopes.find(item => item.profile.selected === 'patch');
    assert.deepEqual(patch.phaseGraph.required, ['plan', 'do', 'qa']);
    assert.deepEqual(patch.phaseGraph.notRequired, ['ideation', 'design', 'report']);
    assert.equal(patch.phaseStates.ideation, 'not-required');
    assert.equal(patch.phaseStates.design, 'not-required');
    assert.equal(patch.phaseStates.report, 'not-required');
  });

  it('모든 작업은 결과 예시를 제공하고 high는 보안 승인 대기 상태다', () => {
    for (const preview of fixtures.previews) {
      assert.ok(preview.resultPreview.items.length > 0);
      assert.deepEqual(new Set(preview.availableChoices), new Set(['execute', 'revise', 'cancel']));
      if (preview.assurance.level === 'high' || preview.assurance.level === 'regulated') {
        assert.equal(preview.securityReview.required, true);
        assert.equal(preview.approvalState, 'security-review-required');
        assert.ok(preview.securityReview.topics.length > 0);
      }
    }
  });

  it('audit fixture가 schema와 append-only hash chain을 충족한다', () => {
    fixtures.auditEvents.forEach(event => validate(auditSchema, event));
    const result = validateAuditChain(fixtures.auditEvents);
    assert.equal(result.valid, true, result.errors.join('\n'));
  });

  it('audit event 본문 변조를 hash 재계산으로 거부한다', () => {
    const tampered = structuredClone(fixtures.auditEvents);
    tampered[1].payload.profile = 'initiative';
    const result = validateAuditChain(tampered);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(error => error.includes('canonical event content')));
  });

  it('감사 event taxonomy가 실행 전후 핵심 행동을 모두 포함한다', () => {
    const eventTypes = new Set(auditSchema.properties.eventType.enum);
    for (const required of [
      'request.received', 'classification.completed', 'preview.created', 'approval.recorded',
      'security.review.completed', 'context.read', 'agent.started', 'agent.completed',
      'tool.started', 'tool.completed', 'tool.failed', 'file.changed',
      'check.completed', 'gate.evaluated', 'scope.changed', 'run.completed', 'audit.warning',
    ]) {
      assert.ok(eventTypes.has(required), `missing audit event ${required}`);
    }
  });

  it('host capability 계약이 Claude/Codex 공식 reference와 audit gap을 명시한다', () => {
    const contract = fs.readFileSync(path.join(ROOT, 'docs/adaptive-workflow-kernel/01-plan/phase-0a-contracts.md'), 'utf8');
    assert.match(contract, /code\.claude\.com\/docs\/en\/hooks/);
    assert.match(contract, /learn\.chatgpt\.com\/docs\/hooks/);
    assert.match(contract, /auditIncomplete=true/);
    assert.match(contract, /관찰되지 않은 행동을 성공으로 추정하지 않는다/);
  });
});
