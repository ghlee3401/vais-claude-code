#!/usr/bin/env node
'use strict';

/**
 * Import MUI design system → MD catalog (idempotent).
 *
 * Usage:
 *   node scripts/import-mui-design-system.js [--fallback-mui-only] [--dry-run] [--verbose]
 *
 * Required env (project root .env):
 *   FIGMA_PAT (or VITE_FIGMA_PAT)
 *   FIGMA_FILE_KEY (or VITE_FIGMA_FILE_KEY)
 *
 * @see docs/mui-design-system-import/02-design/api-contract.md §1
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');

function sha256(content) {
  return 'sha256:' + crypto.createHash('sha256').update(content).digest('hex');
}

function areInputsUnchanged(prevLockfile, sources) {
  if (!prevLockfile || !prevLockfile.inputs) return false;
  const prevFigma = prevLockfile.inputs.figma && prevLockfile.inputs.figma.hash;
  const prevMui = prevLockfile.inputs.muiNpm && prevLockfile.inputs.muiNpm.hash;
  const prevOv = prevLockfile.inputs.overrides && prevLockfile.inputs.overrides.hash;
  const curFigma = sources.figma ? sha256(JSON.stringify(sources.figma)) : null;
  const curMui = sha256(JSON.stringify(sources.muiNpm));
  const curOv = sources.overrides ? sha256(JSON.stringify(sources.overrides)) : null;
  return prevFigma === curFigma && prevMui === curMui && prevOv === curOv;
}

const { loadEnv, getFigmaPat, getFigmaFileKey } = require('./import-mui-helpers/env');
const { fetchAll: fetchFigmaAll } = require('./import-mui-helpers/fetch-figma');
const { fetchMuiDefaults } = require('./import-mui-helpers/fetch-mui');
const { normalizeMui, normalizeFigma } = require('./import-mui-helpers/normalize');
const { resolveAll } = require('./import-mui-helpers/resolve');
const { emitAll } = require('./import-mui-helpers/emit');

const EXIT = { OK: 0, GENERIC: 1, SCHEMA: 2, FIGMA_AUTH: 3, MUI_MISSING: 4, ATOMICITY: 5 };

function parseArgs(argv) {
  const opts = { fallbackMuiOnly: false, dryRun: false, skipValidation: false, figmaFileKey: null, verbose: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--fallback-mui-only') opts.fallbackMuiOnly = true;
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--skip-validation') opts.skipValidation = true;
    else if (a === '--verbose' || a === '-v') opts.verbose = true;
    else if (a === '--figma-file-key') { opts.figmaFileKey = argv[++i]; }
    else if (a === '--help' || a === '-h') { printHelp(); process.exit(EXIT.OK); }
  }
  return opts;
}

function printHelp() {
  console.log(`Usage: node scripts/import-mui-design-system.js [options]

Options:
  --fallback-mui-only      Skip Figma fetch, use MUI npm defaults only
  --dry-run                Compute and print diff, but don't write files
  --skip-validation        Skip Ajv validation (debug only)
  --figma-file-key <key>   Override env FIGMA_FILE_KEY
  --verbose, -v            Verbose logs
  --help, -h               This help

Required env (when not --fallback-mui-only):
  FIGMA_PAT (or VITE_FIGMA_PAT)
  FIGMA_FILE_KEY (or VITE_FIGMA_FILE_KEY)
`);
}

function logStage(n, total, name) {
  console.log(`\n[${n}/${total}] ${name}`);
}

function logOk(msg) {
  console.log(`  ✓ ${msg}`);
}

function logWarn(msg) {
  console.log(`  ⚠️  ${msg}`);
}

function loadPrevLockfile(dsName) {
  const p = path.join(ROOT, 'design-system', dsName, 'lockfile.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function bumpVersion(prev) {
  if (!prev || !prev.version) return '1.0.0';
  const parts = prev.version.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return '1.0.0';
  parts[2] += 1; // patch by default — emit will decide via diff
  return parts.join('.');
}

async function main() {
  const opts = parseArgs(process.argv);
  loadEnv(ROOT);

  const STAGES = 4;
  const sources = { figma: null, muiNpm: null, overrides: null };

  // STAGE 1: FETCH
  logStage(1, STAGES, 'FETCH');

  // MUI npm
  let muiDefaults;
  try {
    muiDefaults = fetchMuiDefaults();
    logOk(`MUI npm theme   (createTheme defaults, v${muiDefaults.version})`);
  } catch (err) {
    if (err.code === 'MUI_NOT_INSTALLED') {
      console.error('\n❌ ' + err.message);
      process.exit(EXIT.MUI_MISSING);
    }
    throw err;
  }
  sources.muiNpm = muiDefaults;

  // Figma
  let figmaData = null;
  if (!opts.fallbackMuiOnly) {
    const pat = getFigmaPat();
    const fileKey = opts.figmaFileKey || getFigmaFileKey();
    if (!pat || !fileKey) {
      logWarn(`FIGMA_PAT or FIGMA_FILE_KEY missing — auto-activating --fallback-mui-only`);
      opts.fallbackMuiOnly = true;
    } else {
      try {
        figmaData = await fetchFigmaAll(fileKey, pat);
        logOk(`Figma file      ("${figmaData.name}", ${figmaData.styles.length} styles, ${figmaData.components.length} components)`);
        sources.figma = { fileKey, lastModified: figmaData.lastModified, version: figmaData.version, ...figmaData };
      } catch (err) {
        if (err.statusCode === 401 || err.statusCode === 403) {
          console.error(`\n❌ Figma auth failed (${err.statusCode}). Token expired/invalid?`);
          console.error('   Regenerate at https://www.figma.com/settings → Security');
          process.exit(EXIT.FIGMA_AUTH);
        }
        if (err.statusCode === 404) {
          console.error(`\n❌ Figma file not found (404). Check FIGMA_FILE_KEY.`);
          process.exit(EXIT.FIGMA_AUTH);
        }
        logWarn(`Figma fetch failed: ${err.message} — falling back to mui-only`);
        opts.fallbackMuiOnly = true;
      }
    }
  }
  if (opts.fallbackMuiOnly) {
    logOk(`Figma           (skipped: --fallback-mui-only)`);
  }

  // overrides (optional)
  const overridesPath = path.join(ROOT, 'design-system', '_overrides.json');
  if (fs.existsSync(overridesPath)) {
    try {
      const ov = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
      sources.overrides = ov;
      logOk(`Overrides       (${Object.keys(ov).length} top-level keys)`);
    } catch (err) {
      logWarn(`_overrides.json parse error: ${err.message} — ignored`);
    }
  } else {
    logOk(`Overrides       (none — _overrides.json not found, that's OK)`);
  }

  // STAGE 2: NORMALIZE
  logStage(2, STAGES, 'NORMALIZE');
  const muiNormalized = normalizeMui(sources.muiNpm);
  logOk(`mui   → standard schema (color=${Object.keys(muiNormalized.color).length}, typography=${Object.keys(muiNormalized.typography).length}, shadow=${Object.keys(muiNormalized.shadow).length})`);
  const figmaNormalized = sources.figma ? normalizeFigma(sources.figma) : { color: {}, typography: {}, shadow: {} };
  if (sources.figma) {
    logOk(`figma → standard schema (color=${Object.keys(figmaNormalized.color).length}, typography=${Object.keys(figmaNormalized.typography).length}, shadow=${Object.keys(figmaNormalized.shadow).length})`);
  }

  // STAGE 3: RESOLVE
  logStage(3, STAGES, 'RESOLVE (overrides > figma > mui-npm)');
  const resolved = resolveAll(figmaNormalized, muiNormalized, sources.overrides);
  const totalTokens = Object.keys(resolved.color).length + Object.keys(resolved.typography).length + Object.keys(resolved.shadow).length;
  logOk(`merged ${totalTokens} tokens (color=${Object.keys(resolved.color).length}, typography=${Object.keys(resolved.typography).length}, shadow=${Object.keys(resolved.shadow).length})`);

  // STAGE 4: EMIT
  logStage(4, STAGES, opts.dryRun ? 'EMIT (dry-run — no files written)' : 'EMIT');
  const prevLockfile = loadPrevLockfile('mui');
  const inputsUnchanged = areInputsUnchanged(prevLockfile, sources);
  const dsVersion = inputsUnchanged && prevLockfile ? prevLockfile.version : bumpVersion(prevLockfile);
  if (inputsUnchanged && !opts.dryRun) {
    logOk(`inputs unchanged — keeping version ${dsVersion} (idempotent)`);
  }

  if (opts.dryRun) {
    const { computeDiff } = require('./import-mui-helpers/emit');
    const diff = computeDiff(prevLockfile, resolved);
    console.log(`  (dry-run) Would write ${1 /* MASTER */ + 5 /* tokens */ + 19 /* components */ + 2 /* lockfile + CHANGELOG */ + 1 /* INDEX */} files`);
    console.log(`\nDIFF SUMMARY:`);
    console.log(`  tokens changed:    ${diff.tokensChanged.length}`);
    console.log(`  components changed: ${diff.componentsChanged.length}`);
    console.log(`  added: ${diff.added.length}   removed: ${diff.removed.length}   deprecated: ${diff.deprecated.length}`);
    process.exit(EXIT.OK);
  }

  if (inputsUnchanged) {
    // True idempotency: skip emit entirely. Outputs already on disk, lockfile already valid.
    console.log(`\n✓ Done — inputs unchanged (idempotent), no files written. Version ${dsVersion}`);
    process.exit(EXIT.OK);
  }

  let result;
  try {
    result = emitAll({ rootDir: ROOT, resolved, sources, dsVersion, prevLockfile });
  } catch (err) {
    console.error(`\n❌ Emit failed: ${err.message}`);
    process.exit(EXIT.ATOMICITY);
  }

  logOk(`design-system/mui/MASTER.md`);
  logOk(`design-system/mui/tokens/{color,typography,spacing,radius,shadow}.md  (5 files)`);
  logOk(`design-system/mui/components/*.md  (19 files)`);
  logOk(`design-system/mui/lockfile.json`);
  logOk(`design-system/mui/CHANGELOG.md  (entry: v${dsVersion})`);
  logOk(`design-system/INDEX.md  (mui entry updated)`);

  console.log(`\nDIFF SUMMARY (vs previous lockfile):`);
  console.log(`  tokens changed:    ${result.diff.tokensChanged.length}`);
  console.log(`  components changed: ${result.diff.componentsChanged.length}`);
  console.log(`  added: ${result.diff.added.length}   removed: ${result.diff.removed.length}   deprecated: ${result.diff.deprecated.length}`);

  console.log(`\n✓ Done — version ${dsVersion}`);
  process.exit(EXIT.OK);
}

main().catch((err) => {
  console.error('\n❌ Unexpected error:', err.stack || err.message);
  process.exit(EXIT.GENERIC);
});
