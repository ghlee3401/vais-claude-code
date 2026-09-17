'use strict';

// harness-diagram-skill (4.2.0): the diagram skill snapshot, `/vais diagram`, `diagram export`,
// and the stage-3 flow-file rendering. TC ids follow the Design of WI-2026-09-17-harness-diagram-skill.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { describe, it } = require('node:test');
const { routeCommand, routePrompt } = require('../lib/workflow/v2/router');
const { loadDiagramConfig, DEFAULT_DIAGRAMS_DIR } = require('../lib/workflow/v2/config');
const { extractSvg, exportDiagram } = require('../lib/workflow/v2/diagram');
const { authorizeFilePath, authorizeCommand } = require('../lib/workflow/v2/write-policy');
const { AuthorizationStore } = require('../lib/workflow/v2/authorization-store');
const { WorkItemStore } = require('../lib/workflow/v2/work-item-store');
const { loadChainCatalog, getKind, stageOfKind } = require('../lib/workflow/v2/chain-registry');
const { renderStageArtifacts, parseStageDocument } = require('../lib/workflow/v2/id-chain');
const prompt = require('../hooks/workflow-v2-prompt');
const { diagramExport } = require('../scripts/vais-workflow-v2');

const ROOT = path.join(__dirname, '..');
const SKILL = path.join(ROOT, 'skills', 'diagram');
const TYPES = ['flowchart', 'journey', 'swimlane', 'sequence', 'state', 'architecture', 'high-level', 'data-flow', 'er', 'timeline', 'tree'];

function tempRoot(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-diagram-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, '.vais', 'v2'), { recursive: true });
  return root;
}

function writeConfig(root, extra = {}) {
  fs.writeFileSync(path.join(root, 'vais.config.json'), JSON.stringify({ workflowV2: { mode: 'enforce' }, ...extra }));
}

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? listFiles(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
}

function runHook(root, script, input) {
  const result = spawnSync(process.execPath, [path.join(ROOT, 'hooks', script)], { cwd: root, input: JSON.stringify(input), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

describe('harness-diagram-skill TC-001 skill snapshot', () => {
  it('ships SKILL.md within budget, 11 type references, templates, and the MIT provenance', () => {
    const skill = fs.readFileSync(path.join(SKILL, 'SKILL.md'), 'utf8');
    assert.ok(Buffer.byteLength(skill, 'utf8') <= 24 * 1024, `SKILL.md is ${Buffer.byteLength(skill, 'utf8')}B`);
    assert.match(skill, /^---\nname: diagram\n/);
    assert.match(skill, /9874ad73813715fc36875e45afd9cd94c68f3c3f/);
    assert.match(skill, /MIT/);
    for (const type of TYPES) assert.ok(fs.existsSync(path.join(SKILL, 'references', `type-${type}.md`)), `type-${type}.md`);
    assert.equal(fs.readdirSync(path.join(SKILL, 'references')).filter(name => name.startsWith('type-')).length, TYPES.length);
    for (const name of ['style-guide.md', 'semantic-patterns.md']) assert.ok(fs.existsSync(path.join(SKILL, 'references', name)));
    for (const name of ['template.html', 'template-dark.html']) assert.ok(fs.existsSync(path.join(SKILL, 'assets', name)));
    assert.match(fs.readFileSync(path.join(SKILL, 'LICENSE'), 'utf8'), /MIT License[\s\S]*Cathryn Lavery/);
    for (const file of listFiles(SKILL)) {
      if (/\.(?:html|md)$/.test(file) && path.basename(file) !== 'LICENSE') {
        assert.match(fs.readFileSync(file, 'utf8'), /9874ad7|cathrynlavery\/diagram-design/, `provenance in ${path.relative(SKILL, file)}`);
      }
      const text = fs.readFileSync(file, 'utf8');
      for (const banned of ['python', 'playwright', 'drawio', 'excalidraw']) {
        assert.ok(!text.toLowerCase().includes(banned), `${banned} in ${path.relative(SKILL, file)}`);
      }
    }
  });
});

describe('harness-diagram-skill TC-002 /vais diagram entry', () => {
  it('routes the command, keeps state untouched, and opens the drawing folder for the turn', t => {
    const routed = routeCommand('diagram 회원가입 유저 플로우');
    assert.equal(routed.action, 'diagram');
    assert.equal(routed.mutationAllowed, true);
    assert.equal(routed.request, '회원가입 유저 플로우');
    assert.equal(routeCommand('다이어그램 결제 시퀀스').action, 'diagram');
    assert.equal(routeCommand('diagram'), null, 'a bare "diagram" is not a command');
    assert.equal(routePrompt('/vais diagram 흐름도', null).action, 'diagram');
    assert.equal(routePrompt('diagram 흐름도', null).managed, false);

    const root = tempRoot(t);
    writeConfig(root);
    const session = 'diagram-session';
    const output = runHook(root, 'workflow-v2-prompt.js', { session_id: session, prompt: '/vais diagram 회원가입 유저 플로우', cwd: root });
    const context = output.hookSpecificOutput.additionalContext;
    assert.match(context, /skills\/diagram\/SKILL\.md/);
    assert.match(context, /docs\/diagrams\/<slug>\.html/);
    assert.match(context, /diagram export --session diagram-session/);
    const authorization = new AuthorizationStore(root).get(session);
    assert.ok(authorization.allowedPaths.includes('docs/diagrams/**'));
    assert.equal(authorizeFilePath(root, path.join(root, 'docs/diagrams/signup-flow.html'), authorization).allowed, true);
    assert.equal(authorizeFilePath(root, path.join(root, 'app/index.html'), authorization).allowed, false);
    assert.equal(new WorkItemStore(root).getCurrent(), null, 'no Work item is created');
    assert.equal(authorizeCommand('node "/x/plugin/scripts/vais-workflow-v2.js" diagram export --session s --file a.html --png',
      { allowedPaths: [], allowedCommands: ['node "/x/plugin/scripts/vais-workflow-v2.js"'] }).allowed, true);

    // An unprefixed turn revokes the authorization: nothing can be saved without /vais diagram.
    runHook(root, 'workflow-v2-prompt.js', { session_id: session, prompt: '그려줘', cwd: root });
    assert.equal(new AuthorizationStore(root).get(session), null);
  });

  it('honours vais.config.json > diagrams.dir and falls back on bad values', t => {
    const root = tempRoot(t);
    writeConfig(root);
    assert.deepEqual(loadDiagramConfig(root), { dir: DEFAULT_DIAGRAMS_DIR, custom: false });
    writeConfig(root, { diagrams: { dir: 'design/pictures/' } });
    assert.deepEqual(loadDiagramConfig(root), { dir: 'design/pictures', custom: true });
    for (const bad of ['/etc', '../out', 'a//b', '', 42]) {
      writeConfig(root, { diagrams: { dir: bad } });
      assert.equal(loadDiagramConfig(root).dir, DEFAULT_DIAGRAMS_DIR, `bad dir ${JSON.stringify(bad)}`);
    }
    writeConfig(root, { diagrams: { dir: 'pics' } });
    const output = runHook(root, 'workflow-v2-prompt.js', { session_id: 'd2', prompt: '/vais diagram x', cwd: root });
    assert.match(output.hookSpecificOutput.additionalContext, /pics\/<slug>\.html/);
    assert.ok(new AuthorizationStore(root).get('d2').allowedPaths.includes('pics/**'));
  });
});

describe('harness-diagram-skill TC-003 export', () => {
  const html = fs.readFileSync(path.join(ROOT, 'tests', 'fixtures', 'product-stages', 'flows', 'S-002.html'), 'utf8');

  it('extracts the first <svg> with the font import, XML-safe', () => {
    const svg = extractSvg(html);
    assert.match(svg, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n<svg /);
    assert.match(svg, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(svg, /<defs><style>@import url\('https:\/\/fonts\.googleapis\.com\/css2\?family=Instrument\+Serif[^']*'\);<\/style>/);
    assert.ok(!/&(?!amp;|lt;|gt;|quot;|apos;|#)/.test(svg), 'no bare ampersand');
    assert.match(svg, /<\/svg>\n$/);
    assert.throws(() => extractSvg('<html><body>no picture</body></html>'), /<svg> 가 없다/);
    const noDefs = extractSvg('<svg viewBox="0 0 1 1"><rect/></svg>');
    assert.match(noDefs, /<svg[^>]*><defs><style>@import/);
  });

  it('writes .svg and a stub .png next to the html, only inside the write scope', t => {
    const root = tempRoot(t);
    writeConfig(root);
    fs.mkdirSync(path.join(root, 'docs', 'diagrams'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs', 'diagrams', 'flow.html'), html);
    const result = exportDiagram(root, 'docs/diagrams/flow.html', { svg: true, png: true, renderer: 'stub' });
    assert.deepEqual(result.outputs, { svg: 'docs/diagrams/flow.svg', png: 'docs/diagrams/flow.png' });
    assert.ok(fs.existsSync(path.join(root, 'docs', 'diagrams', 'flow.png')));
    assert.throws(() => exportDiagram(root, '../outside.html', { svg: true }), /프로젝트 안/);
    assert.throws(() => exportDiagram(root, 'docs/diagrams/missing.html', { svg: true }), /파일이 없다/);

    const store = new AuthorizationStore(root);
    store.grant({ sessionId: 'ok', workItemId: null, phase: 'plan', allowedPaths: ['docs/diagrams/**'], allowedCommands: [] });
    process.env.VAIS_SCREEN_RENDERER = 'stub';
    const cli = diagramExport(root, { session: 'ok', file: 'docs/diagrams/flow.html', svg: true });
    assert.equal(cli.schema, 'diagram-export/v1');
    assert.equal(cli.outputs.svg, 'docs/diagrams/flow.svg');
    fs.mkdirSync(path.join(root, 'app'), { recursive: true });
    fs.writeFileSync(path.join(root, 'app', 'page.html'), html);
    assert.throws(() => diagramExport(root, { session: 'ok', file: 'app/page.html', svg: true }), /outside the approved write scope/);
    assert.throws(() => diagramExport(root, { session: 'nope', file: 'docs/diagrams/flow.html', svg: true }), /authorization/);
    assert.throws(() => diagramExport(root, { session: 'ok', file: 'docs/diagrams/flow.html' }), /--svg 또는 --png/);
  });
});

describe('harness-diagram-skill TC-004 stage-3 flow files', () => {
  it('renders html flow files, skips .mmd, and tells the Design to draw pictures', t => {
    const catalog = loadChainCatalog();
    const stage = catalog.stages.find(entry => entry.id === 'stage-screens');
    assert.equal(stage.renderArtifacts, true);
    assert.deepEqual(stage.diagram, ['flowchart', 'journey']);

    const root = tempRoot(t);
    const fixtures = path.join(ROOT, 'tests', 'fixtures', 'product-stages');
    fs.mkdirSync(path.join(root, 'docs', 'product', 'flows'), { recursive: true });
    for (const name of ['S-001.mmd', 'S-002.html']) fs.copyFileSync(path.join(fixtures, 'flows', name), path.join(root, 'docs', 'product', 'flows', name));
    const parsed = parseStageDocument(fs.readFileSync(path.join(fixtures, '03-screens.md'), 'utf8'), stage);
    const render = renderStageArtifacts(root, stage, parsed, { renderer: 'stub' });
    assert.deepEqual(render.findings, []);
    assert.deepEqual(render.rendered, ['docs/product/flows/S-002.png']);
    assert.ok(!fs.existsSync(path.join(root, 'docs', 'product', 'flows', 'S-001.png')));

    const kind = getKind('stage-screens');
    const item = { id: 'WI-2026-09-17-screens', primaryFeature: 'screens', designRevision: 1 };
    const lines = prompt.stagePhaseLines(item, kind, stageOfKind(kind), 'sess');
    assert.match(lines.design.join('\n'), /skills\/diagram/);
    assert.match(lines.design.join('\n'), /02-design\/options\/N\/flow\.html/);
    assert.match(lines.design.join('\n'), /screens capture/);
    assert.match(lines.do.join('\n'), /\.html/);
    assert.match(lines.do.join('\n'), /\.mmd/);
    const wire = catalog.stages.find(entry => entry.id === 'stage-wireframes');
    assert.equal(wire.diagram, undefined);
    assert.ok(!prompt.stagePhaseLines(item, getKind('stage-wireframes'), wire, 'sess').design.join('\n').includes('skills/diagram'));
  });
});
