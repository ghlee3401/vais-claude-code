#!/usr/bin/env node
/**
 * 이 파일의 책임: 플러그인 구조 검증 (v2.0 슬림) — 등록 파일 존재, frontmatter, 버전 동기화, 지침 크기 예산.
 * 실패 시 exit 1 (fail-loud CLI).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let errors = 0;
let warns = 0;

function err(scope, msg) { errors++; console.error(`  ❌ [${scope}] ${msg}`); }
function info(scope, msg) { console.log(`  ℹ️  [${scope}] ${msg}`); }

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  } catch (e) {
    err(rel, `JSON 파싱 실패: ${e.message}`);
    return null;
  }
}

function hasFrontmatterField(content, field) {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return false;
  return new RegExp(`^${field}\\s*:`, 'm').test(m[1]);
}

function main() {
  console.log('[VAIS validate] 플러그인 구조 검증 시작\n');

  // 1. package.json claude-plugin 등록 파일 존재 확인
  const pkg = readJson('package.json');
  if (pkg) {
    const cp = pkg['claude-plugin'] || {};
    const registered = [...(cp.skills || []), ...(cp.agents || []), ...(cp.hooks || [])];
    for (const rel of registered) {
      if (!fs.existsSync(path.join(ROOT, rel))) err('package.json', `등록 파일 없음: ${rel}`);
    }
    info('package.json', `skills ${cp.skills?.length || 0} / agents ${cp.agents?.length || 0} / hooks ${cp.hooks?.length || 0} 등록 확인`);
  }

  // 2. 버전 동기화
  const config = readJson('vais.config.json');
  const plugin = readJson('.claude-plugin/plugin.json');
  const marketplace = readJson('.claude-plugin/marketplace.json');
  if (pkg && config && plugin && marketplace) {
    const versions = {
      'package.json': pkg.version,
      'vais.config.json': config.version,
      'plugin.json': plugin.version,
      'marketplace.json(metadata)': marketplace.metadata?.version,
      'marketplace.json(plugins[0])': marketplace.plugins?.[0]?.version,
    };
    const unique = [...new Set(Object.values(versions))];
    if (unique.length > 1) {
      err('version', `버전 불일치: ${JSON.stringify(versions)}`);
    } else {
      info('version', `동기화 확인: v${unique[0]}`);
    }
  }

  // 3. SKILL.md + agents frontmatter
  const skillPath = path.join(ROOT, 'skills/vais/SKILL.md');
  if (fs.existsSync(skillPath)) {
    const content = fs.readFileSync(skillPath, 'utf8');
    for (const f of ['name', 'description']) {
      if (!hasFrontmatterField(content, f)) err('SKILL.md', `frontmatter '${f}' 누락`);
    }
  } else {
    err('skills', 'skills/vais/SKILL.md 없음');
  }

  const agentsDir = path.join(ROOT, 'agents');
  const agentFiles = fs.existsSync(agentsDir)
    ? fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'))
    : [];
  for (const f of agentFiles) {
    const content = fs.readFileSync(path.join(agentsDir, f), 'utf8');
    for (const field of ['name', 'description']) {
      if (!hasFrontmatterField(content, field)) err('agents', `${f}: frontmatter '${field}' 누락`);
    }
  }
  info('agents', `agent 정의 ${agentFiles.length}개 확인`);

  // 4. hooks.json 이 참조하는 스크립트 존재 확인
  const hooksJson = readJson('hooks/hooks.json');
  if (hooksJson) {
    const cmds = JSON.stringify(hooksJson).match(/\$\{CLAUDE_PLUGIN_ROOT\}\/[^"\s]+/g) || [];
    for (const cmd of cmds) {
      const rel = cmd.replace('${CLAUDE_PLUGIN_ROOT}/', '');
      if (!fs.existsSync(path.join(ROOT, rel))) err('hooks.json', `참조 스크립트 없음: ${rel}`);
    }
    info('hooks.json', `이벤트: ${Object.keys(hooksJson.hooks || {}).join(', ')}`);
  }

  // 5. 템플릿 존재 확인
  for (const t of ['plan.template.md', 'notes.template.md', 'review.template.md']) {
    if (!fs.existsSync(path.join(ROOT, 'templates', t))) err('templates', `${t} 없음`);
  }

  // 6. 지침 크기 예산 (guidelines 메타 규칙 1 — 기계 검증)
  const budgets = config?.guidelines?.sizeBudgetKB || {};
  for (const [file, kb] of Object.entries(budgets)) {
    const p = path.join(ROOT, config.guidelines.root || 'guidelines/', file);
    if (!fs.existsSync(p)) { err('guidelines', `${file} 없음`); continue; }
    const size = fs.statSync(p).size;
    if (size > kb * 1024) {
      err('guidelines', `${file} 크기 예산 초과: ${(size / 1024).toFixed(1)}KB > ${kb}KB — 규칙 하나를 제거하세요`);
    }
  }
  info('guidelines', `크기 예산 확인 (${Object.keys(budgets).length}개 파일)`);

  // 결과
  console.log('');
  if (errors > 0) {
    console.error(`[VAIS validate] ❌ 실패 — 오류 ${errors}건, 경고 ${warns}건`);
    process.exit(1);
  }
  console.log(`[VAIS validate] ✅ 통과 — 경고 ${warns}건`);
}

main();
