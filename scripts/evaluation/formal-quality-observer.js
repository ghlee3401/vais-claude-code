#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { findChrome, runScenario } = require('./mini-booking-browser');
const { sha256, canonicalBody } = require('./formal-workload');

const BASELINE = Object.freeze({
  initial: '다시 만나 반가워요',
  'invalid-login': '이메일 형식과 6자 이상의 비밀번호',
  'password-reset': '링크는 30분 동안 유효',
  'login-book': 'Morning Flow 예약이 완료',
});

function selectQualityScenarios(manifest) {
  const scenarios = Array.isArray(manifest?.scenarios) ? manifest.scenarios : [];
  const byId = new Map(scenarios.map(item => [item.id, item]));
  const selected = [];
  for (const [id, expectedText] of Object.entries(BASELINE)) {
    const scenario = byId.get(id);
    if (scenario?.expectedText !== expectedText) throw new Error(`Baseline scenario changed: ${id}`);
    selected.push({ canonicalId: id, scenario });
  }
  const cancellations = scenarios.filter(item => !Object.hasOwn(BASELINE, item.id) &&
    String(item.expectedText || '').includes('취소')).sort((left, right) => left.id.localeCompare(right.id));
  if (cancellations.length === 0) throw new Error('A Chrome scenario with cancellation evidence is required');
  selected.push({ canonicalId: 'book-cancel', scenario: cancellations[0] });
  return selected;
}

function observeQuality(projectRoot, outputDir) {
  const root = path.resolve(projectRoot);
  const output = path.resolve(outputDir);
  fs.mkdirSync(output, { recursive: true });
  const manifestPath = path.join(root, 'tests', 'fixtures', 'mini-booking', 'scenarios.json');
  let contractError = null;
  let selected = [];
  try {
    selected = selectQualityScenarios(JSON.parse(fs.readFileSync(manifestPath, 'utf8')));
  } catch (error) {
    contractError = error.message;
  }
  const chrome = contractError ? null : findChrome();
  const browser = contractError ? { verdict: 'fail', reason: contractError, scenarios: [] } :
    !chrome ? { verdict: 'blocked', reason: 'Chrome/Chromium is unavailable', scenarios: [] } : (() => {
      const fixtureDir = path.join(root, 'tests', 'fixtures', 'mini-booking');
      const screenshots = path.join(output, 'screenshots');
      fs.mkdirSync(screenshots, { recursive: true });
      const scenarios = selected.map(item => ({
        ...runScenario(chrome, fixtureDir, item.scenario, screenshots),
        sourceScenarioId: item.scenario.id,
        id: item.canonicalId,
      }));
      return { verdict: scenarios.every(item => item.verdict === 'pass') ? 'pass' : 'fail', scenarios };
    })();
  const observedIds = browser.scenarios.map(item => item.id).sort();
  const requiredIds = [...Object.keys(BASELINE), 'book-cancel'].sort();
  const complete = JSON.stringify(observedIds) === JSON.stringify(requiredIds) &&
    browser.scenarios.every(item => item.verdict === 'pass');
  const verdict = browser.verdict === 'blocked' ? 'blocked' :
    !contractError && browser.verdict === 'pass' && complete ? 'pass' : 'fail';
  const evidence = {
    schema: 'vais-formal-quality-observer/v1', verdict,
    fixture: 'mini-booking', requiredScenarioIds: requiredIds,
    observedScenarioIds: observedIds,
    scenarios: browser.scenarios.map(item => ({
      id: item.id, viewport: item.viewport, verdict: item.verdict,
      ...(item.sourceScenarioId !== item.id ? { sourceScenarioId: item.sourceScenarioId } : {}),
      screenshot: item.screenshot ? path.relative(output, item.screenshot).split(path.sep).join('/') : null,
    })),
    ...(contractError ? { reason: contractError } : browser.reason ? { reason: browser.reason } : {}),
  };
  const body = canonicalBody(evidence);
  const target = path.join(output, 'quality-observer.json');
  fs.writeFileSync(target, body);
  return { evidence, target, digest: sha256(body) };
}

module.exports = { BASELINE, selectQualityScenarios, observeQuality };
