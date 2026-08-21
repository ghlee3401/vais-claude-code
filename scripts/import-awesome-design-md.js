#!/usr/bin/env node
'use strict';

/**
 * VAIS Code — Awesome DESIGN.md Importer
 *
 * Source: VoltAgent/awesome-design-md (MIT, 2026)
 * Spec: design-system/specs/import-script.md
 *
 * Bakes brand DESIGN.md files from upstream awesome-design-md repo into
 * design-system/brands/{slug}/DESIGN.md with attribution headers + LICENSE.
 * Idempotent — re-runs without --force skip existing brands.
 *
 * Usage:
 *   node scripts/import-awesome-design-md.js --brands claude,linear,stripe
 *   node scripts/import-awesome-design-md.js --pre-bake
 *   node scripts/import-awesome-design-md.js --all
 *   node scripts/import-awesome-design-md.js --regen-index
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BRANDS_ROOT = path.join(PROJECT_ROOT, 'design-system', 'brands');
const DEFAULT_SOURCE = path.resolve(PROJECT_ROOT, '..', 'references', 'awesome-design-md');

function parseArgs(argv) {
  const args = {
    source: null,
    brands: null,
    all: false,
    preBake: false,
    dryRun: false,
    force: false,
    regenIndex: false,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--source') args.source = argv[++i];
    else if (a === '--brands') args.brands = argv[++i].split(',').map(s => s.trim()).filter(Boolean);
    else if (a === '--all') args.all = true;
    else if (a === '--pre-bake') args.preBake = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--force') args.force = true;
    else if (a === '--regen-index') args.regenIndex = true;
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

function printHelp() {
  process.stdout.write(`
VAIS Code — Awesome DESIGN.md Importer

Usage:
  node scripts/import-awesome-design-md.js [options]

Options:
  --source <path>     Source directory (default: ../references/awesome-design-md)
  --brands <slugs>    Comma-separated brand slugs (e.g. claude,linear,stripe)
  --all               Bake all 71 brands (warning: ~4.7MB repo size increase)
  --pre-bake          Bake brands from vais.config.json > designSystem.preBakedBrands
  --dry-run           Print plan without writing files
  --force             Overwrite existing baked DESIGN.md
  --regen-index       Regenerate INDEX.md only (no baking)
  --help, -h          Show this help

Source: VoltAgent/awesome-design-md (MIT License, 2026)
Spec:   design-system/specs/import-script.md
`);
}

function loadVaisConfig() {
  const p = path.join(PROJECT_ROOT, 'vais.config.json');
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { return {}; }
}

function normalizeSlug(folder) {
  let s = String(folder).toLowerCase();
  const stripped = s.replace(/\.(app|ai|com|io|dev)$/, '');
  // Too-short result (e.g. "x.ai" → "x") → concatenate instead
  if (stripped.length < 3 && s !== stripped) {
    s = s.replace(/\./g, '');
  } else {
    s = stripped.replace(/\./g, '-');
  }
  return s
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function validateSource(sourceRoot) {
  const designMdRoot = path.join(sourceRoot, 'design-md');
  const licensePath = path.join(sourceRoot, 'LICENSE');
  const readmePath = path.join(sourceRoot, 'README.md');
  if (!fs.existsSync(designMdRoot)) {
    return {
      ok: false,
      reason: `Source missing: ${designMdRoot}`,
      hint: 'git clone https://github.com/VoltAgent/awesome-design-md ../references/awesome-design-md',
    };
  }
  if (!fs.existsSync(licensePath)) {
    return { ok: false, reason: `LICENSE missing: ${licensePath}` };
  }
  return { ok: true, designMdRoot, licensePath, readmePath };
}

function listSourceFolders(designMdRoot) {
  return fs.readdirSync(designMdRoot, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}

function buildAttribution(originalFolder) {
  const today = new Date().toISOString().slice(0, 10);
  return `<!--\nSource: https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/${originalFolder}/DESIGN.md\nLicense: MIT (VoltAgent, 2026) — see design-system/brands/LICENSE.md\nImported: ${today} (vais-code scripts/import-awesome-design-md.js)\n-->\n\n`;
}

function bakeOne({ designMdRoot, originalFolder, force, dryRun, log }) {
  const slug = normalizeSlug(originalFolder);
  const src = path.join(designMdRoot, originalFolder, 'DESIGN.md');
  const dstDir = path.join(BRANDS_ROOT, slug);
  const dst = path.join(dstDir, 'DESIGN.md');

  if (!fs.existsSync(src)) {
    log.warn(`source missing: ${originalFolder}/DESIGN.md`);
    return { slug, originalFolder, status: 'missing' };
  }
  if (fs.existsSync(dst) && !force) {
    log.skip(`${slug} (already baked)`);
    return { slug, originalFolder, status: 'skipped' };
  }
  if (dryRun) {
    log.plan(`would bake: ${originalFolder} → design-system/brands/${slug}/DESIGN.md`);
    return { slug, originalFolder, status: 'dry-run' };
  }

  fs.mkdirSync(dstDir, { recursive: true });
  const original = fs.readFileSync(src, 'utf8');
  fs.writeFileSync(dst, buildAttribution(originalFolder) + original);
  const slugNote = slug === originalFolder ? '' : `  [slug: ${slug} ← ${originalFolder}]`;
  const lines = original.split('\n').length;
  log.bake(`${originalFolder.padEnd(14)} → design-system/brands/${slug}/DESIGN.md (${lines} lines)${slugNote}`);
  return { slug, originalFolder, status: 'baked', lines };
}

function parseUpstreamReadme(readmePath) {
  if (!fs.existsSync(readmePath)) return { categories: [] };
  const md = fs.readFileSync(readmePath, 'utf8');
  const categories = [];
  let current = null;
  for (const line of md.split('\n')) {
    const cat = line.match(/^###\s+(.+?)\s*$/);
    if (cat) {
      const name = cat[1].trim();
      if (name.toLowerCase().includes('contributing') || name.toLowerCase().includes('license')) {
        current = null;
        continue;
      }
      current = { name, brands: [] };
      categories.push(current);
      continue;
    }
    const m = line.match(/^-\s+\[\*\*(.+?)\*\*\]\((https?:\/\/[^)]+)\)\s*-\s*(.+)$/);
    if (m && current) {
      const [, displayName, url, description] = m;
      const slugFromUrl = url.match(/getdesign\.md\/([^/]+)\//)?.[1];
      const originalFolder = slugFromUrl || displayName.toLowerCase();
      current.brands.push({
        displayName,
        originalFolder,
        slug: normalizeSlug(originalFolder),
        sourceUrl: url,
        description: description.trim(),
      });
    }
  }
  return { categories };
}

function listBakedSlugs() {
  if (!fs.existsSync(BRANDS_ROOT)) return new Set();
  const baked = new Set();
  for (const d of fs.readdirSync(BRANDS_ROOT, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    if (fs.existsSync(path.join(BRANDS_ROOT, d.name, 'DESIGN.md'))) {
      baked.add(d.name);
    }
  }
  return baked;
}

function renderIndex({ categories, designMdFolders, log }) {
  const baked = listBakedSlugs();
  const today = new Date().toISOString().slice(0, 10);

  // Drop empty categories (README noise like "How to Use")
  categories = categories.filter(c => c.brands.length > 0);

  // Fallback: brands not found in README parsing
  const seen = new Set();
  for (const c of categories) for (const b of c.brands) seen.add(b.originalFolder);
  const uncategorized = designMdFolders
    .filter(f => !seen.has(f))
    .map(f => ({
      displayName: f,
      originalFolder: f,
      slug: normalizeSlug(f),
      sourceUrl: `https://github.com/VoltAgent/awesome-design-md/tree/main/design-md/${f}`,
      description: '(uncategorized — upstream README parse miss)',
    }));
  if (uncategorized.length > 0) {
    categories.push({ name: `Uncategorized`, brands: uncategorized });
    log.warn(`${uncategorized.length} brand(s) uncategorized — upstream README parse fallback`);
  }

  const totalBrands = categories.reduce((n, c) => n + c.brands.length, 0);

  let md = `# Design System — Brands\n\n`;
  md += `> **Source**: [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (MIT, 2026)\n`;
  md += `> **Format**: [Google Stitch DESIGN.md](https://stitch.withgoogle.com/docs/design-md/overview/)\n`;
  md += `> **Generated**: ${today} via \`scripts/import-awesome-design-md.js\`\n`;
  md += `> **Total**: ${totalBrands} brands across ${categories.length} categories\n\n`;
  md += `**Baked** (this repo): ${baked.size} / ${totalBrands} — ${[...baked].sort().join(', ') || '(none yet)'}\n`;
  md += `**Lazy** (on-demand): run \`node scripts/import-awesome-design-md.js --brands <slug>\` to bake.\n\n`;
  md += `---\n\n`;

  for (const cat of categories) {
    md += `## ${cat.name} (${cat.brands.length})\n\n`;
    md += `| Slug | Brand | 톤 한 줄 | Baked | Source |\n`;
    md += `|------|-------|----------|:-----:|--------|\n`;
    for (const b of cat.brands) {
      const isBaked = baked.has(b.slug) ? '✅' : '⬜';
      const slugDisplay = b.slug === b.originalFolder ? b.slug : `${b.slug} (←${b.originalFolder})`;
      const safeDesc = b.description.replace(/\|/g, '\\|').slice(0, 120);
      md += `| \`${b.slug}\` | ${b.displayName} | ${safeDesc} | ${isBaked} | [URL](${b.sourceUrl}) |\n`;
    }
    md += `\n`;
  }

  md += `---\n\n## Slug 정규화 규칙\n\n`;
  md += `\`{tld}\` 제거 → \`.\` → \`-\` → lowercase. 예: \`linear.app\` → \`linear\`, \`x.ai\` → \`xai\`, \`mistral.ai\` → \`mistral\`.\n\n`;
  md += `상세: \`design-system/specs/schema.md\`\n\n`;

  md += `## Lazy Import\n\n`;
  md += `미박제 brand (⬜) 가 선택되면 hook 이 자동으로 import 를 트리거합니다. 또는 수동으로:\n\n`;
  md += `\`\`\`bash\nnode scripts/import-awesome-design-md.js --brands <slug>\n\`\`\`\n`;
  return md;
}

function ensureLicense({ licensePath, log }) {
  const dst = path.join(BRANDS_ROOT, 'LICENSE.md');
  if (fs.existsSync(dst)) {
    log.skip(`design-system/brands/LICENSE.md (already exists)`);
    return;
  }
  if (!fs.existsSync(BRANDS_ROOT)) fs.mkdirSync(BRANDS_ROOT, { recursive: true });
  const license = fs.readFileSync(licensePath, 'utf8');
  const content = `# Brand DESIGN.md License\n\n> **Source**: https://github.com/VoltAgent/awesome-design-md\n> **Imported**: ${new Date().toISOString().slice(0, 10)}\n\n${license}`;
  fs.writeFileSync(dst, content);
  log.write(`design-system/brands/LICENSE.md`);
}

function makeLogger() {
  return {
    bake: m => process.stdout.write(`[bake]  ${m}\n`),
    skip: m => process.stdout.write(`[skip]  ${m}\n`),
    plan: m => process.stdout.write(`[plan]  ${m}\n`),
    write: m => process.stdout.write(`[write] ${m}\n`),
    warn: m => process.stderr.write(`[warn]  ${m}\n`),
    info: m => process.stdout.write(`[info]  ${m}\n`),
    error: m => process.stderr.write(`[error] ${m}\n`),
  };
}

function main() {
  const args = parseArgs(process.argv);
  const log = makeLogger();

  if (args.help) { printHelp(); return 0; }

  const sourceRoot = args.source ? path.resolve(args.source) : DEFAULT_SOURCE;
  const valid = validateSource(sourceRoot);
  if (!valid.ok) {
    log.error(valid.reason);
    if (valid.hint) log.error(valid.hint);
    return 1;
  }

  log.info(`source: ${sourceRoot}`);

  const designMdFolders = listSourceFolders(valid.designMdRoot);
  const folderBySlug = new Map();
  for (const f of designMdFolders) folderBySlug.set(normalizeSlug(f), f);

  // Resolve target brand list
  let targets = [];
  if (args.regenIndex) {
    // skip baking
  } else if (args.all) {
    targets = designMdFolders;
  } else if (args.preBake) {
    const cfg = loadVaisConfig();
    const preBaked = cfg?.designSystem?.preBakedBrands || ['claude', 'linear', 'stripe', 'vercel', 'notion'];
    for (const slug of preBaked) {
      const folder = folderBySlug.get(slug) || (designMdFolders.includes(slug) ? slug : null);
      if (folder) targets.push(folder);
      else log.warn(`pre-bake slug "${slug}" not found in source`);
    }
  } else if (args.brands && args.brands.length > 0) {
    for (const slug of args.brands) {
      const folder = folderBySlug.get(normalizeSlug(slug)) || (designMdFolders.includes(slug) ? slug : null);
      if (folder) targets.push(folder);
      else log.warn(`brand "${slug}" not found in source — listing first 5 of ${designMdFolders.length}: ${designMdFolders.slice(0, 5).join(', ')}`);
    }
  } else {
    log.error('No brands specified. Use --brands <slugs> or --all or --pre-bake or --regen-index.');
    log.error('Run with --help for full usage.');
    return 1;
  }

  // Bake
  const results = [];
  if (targets.length > 0 && !args.dryRun) {
    if (!fs.existsSync(BRANDS_ROOT)) fs.mkdirSync(BRANDS_ROOT, { recursive: true });
    ensureLicense({ licensePath: valid.licensePath, log });
  }
  for (const folder of targets) {
    const r = bakeOne({
      designMdRoot: valid.designMdRoot,
      originalFolder: folder,
      force: args.force,
      dryRun: args.dryRun,
      log,
    });
    results.push(r);
  }

  // Regenerate INDEX.md
  if (!args.dryRun) {
    const { categories } = parseUpstreamReadme(valid.readmePath);
    const indexMd = renderIndex({ categories, designMdFolders, log });
    if (!fs.existsSync(BRANDS_ROOT)) fs.mkdirSync(BRANDS_ROOT, { recursive: true });
    fs.writeFileSync(path.join(BRANDS_ROOT, 'INDEX.md'), indexMd);
    log.write(`design-system/brands/INDEX.md`);
  }

  // Summary
  const baked = results.filter(r => r.status === 'baked').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const missing = results.filter(r => r.status === 'missing').length;
  process.stdout.write(`\n`);
  if (args.dryRun) {
    log.info(`Dry run — would bake ${results.length} brand(s). No files written.`);
  } else if (args.regenIndex && targets.length === 0) {
    log.info(`INDEX.md regenerated.`);
  } else {
    log.info(`Done — baked: ${baked}, skipped: ${skipped}, missing: ${missing}`);
  }
  if (missing > 0) return 2;
  return 0;
}

if (require.main === module) {
  try {
    process.exit(main());
  } catch (e) {
    process.stderr.write(`\n[fatal] ${e?.stack || e?.message || e}\n`);
    process.exit(1);
  }
}

module.exports = {
  normalizeSlug,
  validateSource,
  bakeOne,
  parseUpstreamReadme,
  renderIndex,
  listBakedSlugs,
  loadVaisConfig,
  _internal: { DEFAULT_SOURCE, BRANDS_ROOT, buildAttribution },
};
