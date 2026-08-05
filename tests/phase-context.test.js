'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const config = require('../vais.config.json');
const { buildPhaseContext, stripAnnotations } = require('../lib/paths');
const { measureText } = require('../lib/context-metrics');

describe('buildPhaseContext', () => {
  it('CTO plan에 필요한 live 설정만 반환한다', () => {
    const view = buildPhaseContext(config, 'cto', 'plan');
    assert.equal(view._contextView.mode, 'compact');
    assert.equal(view.workflow.checkpointPolicy.mode, config.workflow.checkpointPolicy.mode);
    assert.deepEqual(view.workflow.template, stripAnnotations(config.workflow.template));
    assert.deepEqual(view.gates.cto.plan, stripAnnotations(config.gates.cto.plan));
    assert.deepEqual(view.dependencies, config.dependencies);
    assert.equal(view.designSystem, undefined);
  });

  it('모든 phase가 Gate 임계값·문서 경로·추천 의존성을 전체 config와 동일하게 담는다', () => {
    const phaseFolders = {
      plan: '01-plan',
      design: '02-design',
      do: '03-do',
      qa: '04-qa',
      report: '05-report',
    };
    for (const phase of Object.keys(phaseFolders)) {
      const view = buildPhaseContext(config, 'cto', phase);
      assert.equal(view._contextView.mode, 'compact', phase);
      assert.deepEqual(view.dependencies, config.dependencies, `${phase}: dependencies`);
      assert.deepEqual(
        view.workflow.docPaths,
        stripAnnotations(config.workflow.docPaths),
        `${phase}: docPaths`
      );
      for (const [key, value] of Object.entries(config.workflow.docPaths)) {
        if (key.startsWith('_')) continue;
        assert.deepEqual(view.workflow.docPaths[key], stripAnnotations(value), `${phase}: ${key} 경로`);
      }
      assert.deepEqual(
        view.workflow.phaseArtifactMapping[phaseFolders[phase]],
        stripAnnotations(config.workflow.phaseArtifactMapping[phaseFolders[phase]]),
        `${phase}: artifact mapping`
      );
      // 조건부 단정 금지 — 게이트 임계값은 모든 phase에 반드시 있어야 한다.
      assert.deepEqual(
        view.gates.defaults,
        stripAnnotations(config.gates.defaults),
        `${phase}: gate defaults`
      );
    }
  });

  it('plan Gate 임계값(designCompleteness)이 compact view에 포함된다', () => {
    const view = buildPhaseContext(config, 'cto', 'plan');
    assert.equal(view.gates.defaults.designCompleteness, config.gates.defaults.designCompleteness);
  });

  it('role 전용 게이트는 해당 role로 진입할 때만 포함된다', () => {
    const cto = buildPhaseContext(config, 'cto', 'plan');
    const cpo = buildPhaseContext(config, 'cpo', 'plan');
    assert.ok(cto.gates.cto.plan, 'cto: gates.cto.plan 포함');
    assert.equal(cpo.gates.cto, undefined, 'cpo: cto 전용 게이트 제외');
    assert.deepEqual(cpo.gates.defaults, stripAnnotations(config.gates.defaults));
  });

  it('role별 Gate override가 진입 role에 맞게 선택된다', () => {
    const cso = buildPhaseContext(config, 'cso', 'qa');
    assert.deepEqual(cso.gates.roleOverrides.cso, config.gates.roleOverrides.cso);
    assert.equal(cso.gates.roleOverrides.cbo, undefined);
  });

  it('설정 주석 키(_description 등)는 compact view에서 제거된다', () => {
    for (const phase of ['ideation', 'plan', 'design', 'do', 'qa', 'report']) {
      const view = buildPhaseContext(config, 'cto', phase);
      const { _contextView, ...values } = view;
      assert.ok(_contextView, `${phase}: _contextView 유지`);
      const annotations = JSON.stringify(values).match(/"_[a-zA-Z]/g);
      assert.equal(annotations, null, `${phase}: 남은 주석 키 ${annotations}`);
    }
  });

  it('compact view는 전체 config보다 작다', () => {
    for (const phase of ['plan', 'design', 'do', 'qa', 'report']) {
      const fullBytes = measureText(JSON.stringify(config)).bytes;
      const compactBytes = measureText(JSON.stringify(buildPhaseContext(config, 'cto', phase))).bytes;
      assert.ok(compactBytes < fullBytes, `${phase}: ${compactBytes} < ${fullBytes}`);
    }
  });

  it('필수 키가 누락되면 전체 config fallback을 반환한다', () => {
    const incomplete = structuredClone(config);
    delete incomplete.workflow.template;
    const view = buildPhaseContext(incomplete, 'cto', 'plan');
    assert.equal(view._contextView.mode, 'full');
    assert.equal(view._contextView.reason, 'required-config-missing');
    assert.ok(view._contextView.missingPaths.includes('workflow.template'));
    assert.deepEqual(view.workflow, incomplete.workflow);
  });

  it('알 수 없는 role/phase는 전체 config fallback을 반환한다', () => {
    const view = buildPhaseContext(config, 'unknown', 'unknown');
    assert.equal(view._contextView.mode, 'full');
    assert.equal(view._contextView.reason, 'unsupported-role-or-phase');
    assert.deepEqual(view.workflow, config.workflow);
  });

  it('CLI는 현재 프로젝트의 vais.config.json override를 사용한다', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-phase-context-'));
    try {
      const projectConfig = structuredClone(config);
      projectConfig.version = '9.9.9-project';
      fs.writeFileSync(
        path.join(tmpDir, 'vais.config.json'),
        JSON.stringify(projectConfig),
        'utf8'
      );
      const script = path.join(__dirname, '..', 'scripts', 'phase-context.js');
      const result = spawnSync(process.execPath, [script, 'cto', 'plan'], {
        cwd: tmpDir,
        encoding: 'utf8',
      });
      assert.equal(result.status, 0, result.stderr);
      const view = JSON.parse(result.stdout);
      assert.equal(view.version, '9.9.9-project');
      assert.equal(view._contextView.mode, 'compact');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

describe('Agent Teams default contract', () => {
  it('config와 사용자 문서가 sequential 기본값에 합의한다', () => {
    const root = path.join(__dirname, '..');
    const onboarding = fs.readFileSync(path.join(root, 'ONBOARDING.md'), 'utf8');
    const claude = fs.readFileSync(path.join(root, 'CLAUDE.md'), 'utf8');
    const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
    assert.equal(config.orchestration.agentTeams.enabled, false);
    assert.match(onboarding, /기본값: `agentTeams\.enabled=false`/);
    assert.match(onboarding, /`enabled=false` 는 sequential 모드/);
    assert.match(claude, /기본 false/);
    assert.match(readme, /`enabled=false` 는 sequential/);
  });
});
