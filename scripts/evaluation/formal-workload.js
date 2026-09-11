#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SCHEMA = 'vais-evaluation-workload/v1';
const ADAPTER_VERSIONS = Object.freeze({ legacy: 'legacy-public-grammar/v1', v2: 'v2-public-grammar/v2' });
const ENGINE_STEPS = Object.freeze({
  legacy: Object.freeze(['request', 'plan-approval', 'design-approval', 'review-progress', 'final-approval']),
  v2: Object.freeze(['request', 'plan-approval', 'design-approval', 'final-approval']),
});

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
}

function canonicalBody(value) {
  return `${JSON.stringify(canonical(value), null, 2)}\n`;
}

function assertExactKeys(value, expected, label) {
  const actual = Object.keys(value || {}).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    throw new Error(`${label} requires exactly: ${wanted.join(', ')}`);
  }
}

function validateWorkload(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Workload must be an object');
  assertExactKeys(value, ['schema', 'scenario', 'feature', 'scale', 'locale', 'fixture',
    'request', 'acceptanceCriteria', 'decisions'], 'Workload');
  if (value.schema !== SCHEMA || !/^[a-z0-9-]+$/.test(value.scenario) ||
    !/^[a-z0-9-]+$/.test(value.feature) || !['compact', 'standard', 'extended'].includes(value.scale) ||
    value.locale !== 'ko-KR' || typeof value.request !== 'string' || !value.request.trim()) {
    throw new Error('Workload identity or request is invalid');
  }
  assertExactKeys(value.fixture, ['name', 'rootDigest'], 'Workload fixture');
  if (value.fixture.name !== 'mini-booking' || !/^[a-f0-9]{64}$/.test(value.fixture.rootDigest)) {
    throw new Error('Workload fixture identity is invalid');
  }
  if (!Array.isArray(value.acceptanceCriteria) || value.acceptanceCriteria.length < 1 ||
    value.acceptanceCriteria.some(item => typeof item !== 'string' || !item.trim())) {
    throw new Error('Workload acceptanceCriteria must be non-empty strings');
  }
  assertExactKeys(value.decisions, ['planApproval', 'designApproval', 'finalApproval'], 'Workload decisions');
  if (Object.values(value.decisions).some(item => typeof item !== 'string' || !item.trim())) {
    throw new Error('Workload decisions must be non-empty strings');
  }
  return value;
}

function semanticPayload(value) {
  const workload = validateWorkload(value);
  return canonical({
    scenario: workload.scenario,
    feature: workload.feature,
    scale: workload.scale,
    locale: workload.locale,
    fixture: workload.fixture,
    request: workload.request,
    acceptanceCriteria: workload.acceptanceCriteria,
    decisions: workload.decisions,
  });
}

function loadWorkload(target) {
  const absolute = path.resolve(target);
  const value = validateWorkload(JSON.parse(fs.readFileSync(absolute, 'utf8')));
  const body = canonicalBody(value);
  return {
    path: absolute,
    value,
    body,
    digest: sha256(body),
    semanticPayloadDigest: sha256(canonicalBody(semanticPayload(value))),
  };
}

function taskBody(workload) {
  return [workload.request, '완료 조건:',
    ...workload.acceptanceCriteria.map((item, index) => `${index + 1}. ${item}`)].join('\n');
}

function requireBinding(bindings, name) {
  const value = Number(bindings?.[name]);
  if (!Number.isInteger(value) || value < 1) throw new Error(`${name} binding is required`);
  return value;
}

function renderStep(engine, workloadValue, kind, bindings = {}) {
  const workload = validateWorkload(workloadValue);
  if (!ENGINE_STEPS[engine]?.includes(kind)) throw new Error(`Unsupported ${engine} journey step: ${kind}`);
  const feature = workload.feature;
  if (kind === 'request') {
    const body = taskBody(workload);
    return engine === 'legacy'
      ? `/vais cto plan ${feature}\n${body}`
      : `/vais ${body}\nPlan Gate까지만 진행하고 승인을 요청해.`;
  }
  if (kind === 'plan-approval') {
    return engine === 'legacy'
      ? `/vais cto design ${feature}\n${workload.decisions.planApproval} 승인된 Plan을 기준으로 Design Gate까지만 진행하고 승인을 요청해.`
      : `/vais Plan revision ${requireBinding(bindings, 'planRevision')}을 승인합니다. 승인된 Plan을 기준으로 Design Gate까지만 진행하고 승인을 요청해.`;
  }
  if (kind === 'design-approval') {
    return engine === 'legacy'
      ? `/vais cto do ${feature}\n${workload.decisions.designApproval} 승인된 범위로 구현해.`
      : `/vais Design revision ${requireBinding(bindings, 'designRevision')}을 승인합니다. 승인된 범위로 구현하고 독립 QA Review 결과와 최종 승인 요청까지 자동으로 진행해.`;
  }
  if (kind === 'review-progress') {
    return `/vais cto qa ${feature}\n승인된 구현을 Plan과 Design에 따라 독립적으로 검증하고 AI QA 결과를 보여줘.`;
  }
  return engine === 'legacy'
    ? `/vais cto report ${feature}\n${workload.decisions.finalApproval}`
    : '/vais 최종 결과를 승인합니다. AI QA PASS를 확인했습니다. Report를 확정하고 완료 상태를 보여줘.';
}

function adapterDigest(engine) {
  if (!ADAPTER_VERSIONS[engine]) throw new Error(`Unsupported adapter engine: ${engine}`);
  const source = fs.readFileSync(__filename);
  return sha256(Buffer.concat([Buffer.from(`${engine}\0${ADAPTER_VERSIONS[engine]}\0`), source]));
}

function buildAdapterProof(engine, workloadInfo, bindings = {}) {
  const steps = ENGINE_STEPS[engine];
  if (!steps) throw new Error(`Unsupported adapter engine: ${engine}`);
  const prompts = steps.map((kind, index) => {
    const prompt = renderStep(engine, workloadInfo.value, kind, bindings);
    return { index: index + 1, kind, digest: sha256(prompt) };
  });
  return {
    schema: 'vais-prompt-adapter-proof/v1',
    engine,
    adapterVersion: ADAPTER_VERSIONS[engine],
    adapterDigest: adapterDigest(engine),
    workloadDigest: workloadInfo.digest,
    semanticPayloadDigest: workloadInfo.semanticPayloadDigest,
    fixtureDigest: workloadInfo.value.fixture.rootDigest,
    bindings: canonical(bindings),
    prompts,
  };
}

function verifyAdapterProof(proof, engine, workloadInfo) {
  if (!proof || proof.schema !== 'vais-prompt-adapter-proof/v1' || proof.engine !== engine ||
    proof.adapterVersion !== ADAPTER_VERSIONS[engine] || proof.adapterDigest !== adapterDigest(engine) ||
    proof.workloadDigest !== workloadInfo.digest ||
    proof.semanticPayloadDigest !== workloadInfo.semanticPayloadDigest ||
    proof.fixtureDigest !== workloadInfo.value.fixture.rootDigest) {
    throw new Error(`${engine} adapter proof is not bound to the canonical workload`);
  }
  const expected = buildAdapterProof(engine, workloadInfo, proof.bindings || {});
  if (canonicalBody(proof) !== canonicalBody(expected)) {
    throw new Error(`${engine} adapter proof does not reproduce the rendered prompt digests`);
  }
  return true;
}

module.exports = {
  SCHEMA,
  ADAPTER_VERSIONS,
  ENGINE_STEPS,
  sha256,
  canonical,
  canonicalBody,
  validateWorkload,
  semanticPayload,
  loadWorkload,
  renderStep,
  adapterDigest,
  buildAdapterProof,
  verifyAdapterProof,
};
