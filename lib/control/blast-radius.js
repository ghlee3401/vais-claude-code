/**
 * VAIS Code - Blast Radius Analyzer
 * @module lib/control/blast-radius
 * @version 1.0.0
 *
 * Assesses risk level of file changes based on 6 rules.
 * @see bkit-claude-code/lib/control/blast-radius.js
 */

const path = require('path');

// ── Blast Rules ────────────────────────────────────────────────────

const BLAST_RULES = {
  'B-001': {
    name: 'Large single file change',
    severity: 'medium',
    trigger: 'Single file > 500 lines changed',
    threshold: 500,
  },
  'B-002': {
    name: 'Many files changed',
    severity: 'high',
    trigger: '10+ files changed simultaneously',
    threshold: 10,
  },
  'B-003': {
    name: 'Mass file creation',
    severity: 'high',
    trigger: '20+ new files in session',
    threshold: 20,
  },
  'B-004': {
    name: 'Dependency change',
    severity: 'high',
    trigger: 'Package manager files modified',
  },
  'B-005': {
    name: 'Database migration/schema change',
    severity: 'critical',
    trigger: 'Migration or schema files modified',
  },
  'B-006': {
    name: 'Config/settings file change',
    severity: 'medium',
    trigger: 'Configuration files modified',
  },
};

// ── Pattern Matching ───────────────────────────────────────────────

const DEPENDENCY_PATTERNS = [
  'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  'requirements.txt', 'Pipfile', 'pyproject.toml', 'poetry.lock',
  'go.mod', 'go.sum',
  'Cargo.toml', 'Cargo.lock',
  'Gemfile', 'Gemfile.lock',
  'composer.json', 'composer.lock',
];

const MIGRATION_PATTERNS = [
  /migration[s]?\//i,
  /schema\./i,
  /prisma\/schema/i,
  /\.sql$/i,
  /alembic\//i,
  /knex.*migrate/i,
];

const CONFIG_PATTERNS = [
  /tsconfig/i, /jsconfig/i,
  /\.eslintrc/i, /\.prettierrc/i,
  /webpack/i, /vite\.config/i, /next\.config/i,
  /jest\.config/i, /vitest\.config/i,
  /docker-compose/i, /Dockerfile/i,
  /\.env(?!\.example)/i,
  /babel\.config/i,
  /vais\.config\.json$/i,
];

// ── Analysis ───────────────────────────────────────────────────────

/**
 * Check if a file matches dependency patterns
 */
function isDependencyFile(filePath) {
  const basename = path.basename(filePath);
  return DEPENDENCY_PATTERNS.includes(basename);
}

/**
 * Check if a file matches migration patterns
 */
function isMigrationFile(filePath) {
  return MIGRATION_PATTERNS.some(p => p.test(filePath));
}

/**
 * Check if a file matches config patterns
 */
function isConfigFile(filePath) {
  return CONFIG_PATTERNS.some(p => p.test(filePath));
}

/**
 * Analyze blast radius for a set of changed files
 * @param {string[]} changedFiles - List of changed file paths
 * @param {Object} [options]
 * @param {Object} [options.linesPerFile] - {filePath: lineCount}
 * @param {number} [options.newFilesInSession] - Total new files created
 * @returns {{level:string, rules:Object[], recommendation:string}}
 */
function analyzeBlastRadius(changedFiles, options = {}) {
  const { linesPerFile = {}, newFilesInSession = 0 } = options;
  const triggered = [];

  // B-001: Large single file
  for (const file of changedFiles) {
    const lines = linesPerFile[file] || 0;
    if (lines > BLAST_RULES['B-001'].threshold) {
      triggered.push({
        rule: 'B-001',
        ...BLAST_RULES['B-001'],
        detail: `${file}: ${lines} lines`,
      });
    }
  }

  // B-002: Many files
  if (changedFiles.length >= BLAST_RULES['B-002'].threshold) {
    triggered.push({
      rule: 'B-002',
      ...BLAST_RULES['B-002'],
      detail: `${changedFiles.length} files`,
    });
  }

  // B-003: Mass creation
  if (newFilesInSession >= BLAST_RULES['B-003'].threshold) {
    triggered.push({
      rule: 'B-003',
      ...BLAST_RULES['B-003'],
      detail: `${newFilesInSession} new files`,
    });
  }

  // B-004: Dependency
  for (const file of changedFiles) {
    if (isDependencyFile(file)) {
      triggered.push({
        rule: 'B-004',
        ...BLAST_RULES['B-004'],
        detail: file,
      });
      break; // One is enough
    }
  }

  // B-005: Migration
  for (const file of changedFiles) {
    if (isMigrationFile(file)) {
      triggered.push({
        rule: 'B-005',
        ...BLAST_RULES['B-005'],
        detail: file,
      });
      break;
    }
  }

  // B-006: Config
  for (const file of changedFiles) {
    if (isConfigFile(file)) {
      triggered.push({
        rule: 'B-006',
        ...BLAST_RULES['B-006'],
        detail: file,
      });
      break;
    }
  }

  const level = determineLevel(triggered);
  const recommendation = buildRecommendation(level, triggered);

  return { level, rules: triggered, recommendation };
}

/**
 * Check a single file for blast radius
 * @param {string} filePath
 * @param {number} [linesChanged=0]
 * @returns {{warning:boolean, rules:Object[]}}
 */
function checkSingleFile(filePath, linesChanged = 0) {
  const rules = [];

  if (linesChanged > BLAST_RULES['B-001'].threshold) {
    rules.push({ rule: 'B-001', ...BLAST_RULES['B-001'], detail: `${linesChanged} lines` });
  }
  if (isDependencyFile(filePath)) {
    rules.push({ rule: 'B-004', ...BLAST_RULES['B-004'], detail: filePath });
  }
  if (isMigrationFile(filePath)) {
    rules.push({ rule: 'B-005', ...BLAST_RULES['B-005'], detail: filePath });
  }
  if (isConfigFile(filePath)) {
    rules.push({ rule: 'B-006', ...BLAST_RULES['B-006'], detail: filePath });
  }

  return { warning: rules.length > 0, rules };
}

/**
 * Determine overall risk level from triggered rules
 */
function determineLevel(rules) {
  if (rules.some(r => r.severity === 'critical')) return 'critical';
  if (rules.some(r => r.severity === 'high')) return 'high';
  if (rules.some(r => r.severity === 'medium')) return 'medium';
  return 'low';
}

/**
 * Build human-readable recommendation
 */
function buildRecommendation(level, rules) {
  if (rules.length === 0) return 'Low risk. Proceed normally.';

  const ruleNames = rules.map(r => r.name).join(', ');

  switch (level) {
    case 'critical':
      return `CRITICAL: ${ruleNames}. Create checkpoint before proceeding. Require manual approval.`;
    case 'high':
      return `HIGH RISK: ${ruleNames}. Review changes carefully before committing.`;
    case 'medium':
      return `MODERATE: ${ruleNames}. Consider reviewing impact.`;
    default:
      return `Low risk: ${ruleNames}.`;
  }
}

// ── Exports ────────────────────────────────────────────────────────

module.exports = {
  BLAST_RULES,
  analyzeBlastRadius,
  checkSingleFile,
  determineLevel,
  isDependencyFile,
  isMigrationFile,
  isConfigFile,
};
