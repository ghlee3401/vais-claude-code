#!/usr/bin/env node
'use strict';

/**
 * .vais/status.json v3 → v4 마이그레이션.
 *
 * v2 design migration-plan.md (피처 agent-teams-orchestration) 박제.
 *
 * 변경:
 * 1. version: 3 → 4
 * 2. activeFeature: string → activeFeatures: string[]
 * 3. features.{name}.lock: null (신규 필드)
 * 4. features.{name}.subagentLocks: {} (신규, 패턴 D)
 * 5. features.{name}.synthesisHistory: {} (신규, v2 합성자 추적)
 *
 * Idempotent — 이미 v4 면 변경 없음.
 * 백업 — `.vais/status.json.v3.bak` 자동 생성.
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_PATH = path.join(process.cwd(), '.vais', 'status.json');

function migrate(v3) {
  if (!v3 || typeof v3 !== 'object') {
    throw new Error('Invalid input: not an object');
  }
  if (v3.version === 4) return v3; // idempotent
  if (v3.version !== 3 && v3.version !== 2) {
    throw new Error(`Unknown version: ${v3.version}`);
  }

  const features = v3.features || {};
  const migratedFeatures = Object.fromEntries(
    Object.entries(features).map(([name, feat]) => [
      name,
      {
        ...feat,
        lock: feat.lock || null,
        subagentLocks: feat.subagentLocks || {},
        synthesisHistory: feat.synthesisHistory || {},
      },
    ])
  );

  return {
    version: 4,
    activeFeatures: v3.activeFeatures || (v3.activeFeature ? [v3.activeFeature] : []),
    features: migratedFeatures,
  };
}

function main() {
  const args = process.argv.slice(2);
  const statusPath = args[0] || DEFAULT_PATH;
  const dryRun = args.includes('--dry-run');

  if (!fs.existsSync(statusPath)) {
    console.error(`[migrate-v3-v4] status.json not found at ${statusPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(statusPath, 'utf8');
  let v3;
  try {
    v3 = JSON.parse(raw);
  } catch (e) {
    console.error(`[migrate-v3-v4] parse failed: ${e.message}`);
    process.exit(2);
  }

  if (v3.version === 4) {
    console.log(`[migrate-v3-v4] Already v4 — no changes`);
    process.exit(0);
  }

  let v4;
  try {
    v4 = migrate(v3);
  } catch (e) {
    console.error(`[migrate-v3-v4] migration failed: ${e.message}`);
    process.exit(3);
  }

  if (dryRun) {
    console.log(`[migrate-v3-v4] DRY-RUN — would write:`);
    console.log(JSON.stringify(v4, null, 2));
    process.exit(0);
  }

  // 백업
  const bakPath = `${statusPath}.v3.bak`;
  fs.writeFileSync(bakPath, raw);
  console.log(`[migrate-v3-v4] backup → ${bakPath}`);

  // atomic write (temp + rename)
  const tempPath = `${statusPath}.migrate.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(v4, null, 2));
  fs.renameSync(tempPath, statusPath);
  console.log(`[migrate-v3-v4] migrated v${v3.version} → v4 (${Object.keys(v4.features).length} features)`);
}

if (require.main === module) {
  main();
}

module.exports = { migrate };
