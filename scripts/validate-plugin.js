#!/usr/bin/env node
/**
 * validate-plugin.js — Claude Code 플러그인 검증 도구
 *
 * 플러그인 코드를 분석하여 plugin.json, marketplace.json, hooks.json,
 * skills, agents 등이 공식 스펙에 부합하는지 검사합니다.
 *
 * Usage:
 *   node validate-plugin.js <plugin-root-dir> [--json] [--fix]
 *
 * 참조 문서:
 *   - 플러그인 만들기: https://code.claude.com/docs/ko/plugins
 *   - 마켓플레이스 생성 및 배포: https://code.claude.com/docs/ko/plugin-marketplaces
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ─── 상수 정의 ───────────────────────────────────────────────

const VALID_HOOK_EVENTS = [
  'SessionStart',
  'PreToolUse',
  'PostToolUse',
  'Notification',
  'Stop',
  'UserPromptSubmit',
  'SubagentStop'
];

const VALID_HOOK_TYPES = ['command'];

const RESERVED_MARKETPLACE_NAMES = [
  'claude-code-marketplace',
  'claude-code-plugins',
  'claude-plugins-official',
  'anthropic-marketplace',
  'anthropic-plugins',
  'agent-skills',
  'life-sciences'
];

const RESERVED_MARKETPLACE_PATTERNS = [
  /^official[-_]?claude/i,
  /^anthropic[-_]?tools/i
];

const VALID_SOURCE_TYPES = ['github', 'url', 'git-subdir', 'npm', 'pip'];

const VALID_LICENSE_IDS = [
  'MIT', 'Apache-2.0', 'GPL-2.0', 'GPL-3.0', 'BSD-2-Clause', 'BSD-3-Clause',
  'ISC', 'MPL-2.0', 'LGPL-2.1', 'LGPL-3.0', 'AGPL-3.0', 'Unlicense',
  'CC0-1.0', 'CC-BY-4.0', 'CC-BY-SA-4.0', 'BSL-1.0', '0BSD'
];

const PLUGIN_JSON_REQUIRED_FIELDS = ['name', 'description', 'version'];
const MARKETPLACE_JSON_REQUIRED_FIELDS = ['name', 'owner', 'plugins'];

const SEMVER_REGEX = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/;
const KEBAB_CASE_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// ─── 결과 수집기 ─────────────────────────────────────────────

class ValidationResult {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
    this.fixes = [];
  }

  error(category, message, fix) {
    this.errors.push({ category, message });
    if (fix) this.fixes.push({ category, message, fix });
  }

  warn(category, message) {
    this.warnings.push({ category, message });
  }

  note(category, message) {
    this.info.push({ category, message });
  }

  get passed() {
    return this.errors.length === 0;
  }

  get summary() {
    return {
      passed: this.passed,
      errors: this.errors.length,
      warnings: this.warnings.length,
      info: this.info.length
    };
  }

  toJSON() {
    return {
      summary: this.summary,
      errors: this.errors,
      warnings: this.warnings,
      info: this.info,
      fixes: this.fixes
    };
  }

  toCLI() {
    const lines = [];
    const S = this.summary;

    lines.push('');
    lines.push('╔═ Plugin Validator ══════════════════════════════════════');

    if (S.passed) {
      lines.push('║ ✅ 검증 통과 — 플러그인/마켓플레이스 배포 준비 완료');
    } else {
      lines.push(`║ ❌ 검증 실패 — 오류 ${S.errors}건 발견`);
    }

    lines.push(`║ 📊 오류: ${S.errors} | 경고: ${S.warnings} | 정보: ${S.info}`);
    lines.push('╚════════════════════════════════════════════════════════');
    lines.push('');

    if (this.errors.length > 0) {
      lines.push('── 오류 (반드시 수정) ──────────────────────────────────');
      for (const e of this.errors) {
        lines.push(`  ❌ [${e.category}] ${e.message}`);
      }
      lines.push('');
    }

    if (this.warnings.length > 0) {
      lines.push('── 경고 (권장 수정) ────────────────────────────────────');
      for (const w of this.warnings) {
        lines.push(`  ⚠️  [${w.category}] ${w.message}`);
      }
      lines.push('');
    }

    if (this.info.length > 0) {
      lines.push('── 정보 ───────────────────────────────────────────────');
      for (const i of this.info) {
        lines.push(`  ℹ️  [${i.category}] ${i.message}`);
      }
      lines.push('');
    }

    if (this.fixes.length > 0) {
      lines.push('── 자동 수정 가능 항목 ────────────────────────────────');
      for (const f of this.fixes) {
        lines.push(`  🔧 [${f.category}] ${f.message}`);
        lines.push(`     → ${f.fix}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}

// ─── 유틸리티 ─────────────────────────────────────────────────

function fileExists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

function readJSON(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return { __error: e.message };
  }
}

function isKebabCase(str) {
  return KEBAB_CASE_REGEX.test(str);
}

function isSemver(str) {
  return SEMVER_REGEX.test(str);
}

// ─── 검증기들 ─────────────────────────────────────────────────

/**
 * 1. 디렉토리 구조 검증
 */
function validateStructure(root, result) {
  const cat = '구조';

  // .claude-plugin 디렉토리 확인
  const claudePluginDir = path.join(root, '.claude-plugin');
  if (!fileExists(claudePluginDir)) {
    result.error(cat, '.claude-plugin/ 디렉토리가 없습니다. 플러그인 매니페스트를 담는 필수 디렉토리입니다.');
    return false;
  }

  // plugin.json 확인
  const pluginJson = path.join(claudePluginDir, 'plugin.json');
  if (!fileExists(pluginJson)) {
    result.error(cat, '.claude-plugin/plugin.json 파일이 없습니다. 플러그인 매니페스트는 필수입니다.');
    return false;
  }

  // 잘못된 위치 체크: .claude-plugin 안에 commands, agents, skills, hooks가 있으면 안됨
  const wrongLocations = ['commands', 'agents', 'skills', 'hooks'];
  for (const dir of wrongLocations) {
    const wrongPath = path.join(claudePluginDir, dir);
    if (fileExists(wrongPath)) {
      result.error(cat,
        `${dir}/ 가 .claude-plugin/ 안에 있습니다. .claude-plugin/ 내에는 plugin.json만 넣어야 합니다. ${dir}/ 는 플러그인 루트에 위치해야 합니다.`,
        `mv ${path.join('.claude-plugin', dir)} ./${dir}`
      );
    }
  }

  // 최소한 하나의 구성 요소가 있는지 (skills, agents, commands, hooks)
  const hasSkills = fileExists(path.join(root, 'skills'));
  const hasAgents = fileExists(path.join(root, 'agents'));
  const hasCommands = fileExists(path.join(root, 'commands'));
  const hasHooks = fileExists(path.join(root, 'hooks'));
  const hasMcp = fileExists(path.join(root, '.mcp.json'));
  const hasLsp = fileExists(path.join(root, '.lsp.json'));
  const hasSettings = fileExists(path.join(root, 'settings.json'));

  if (!hasSkills && !hasAgents && !hasCommands && !hasHooks && !hasMcp && !hasLsp) {
    result.warn(cat, '플러그인에 skills, agents, commands, hooks, MCP, LSP 중 아무것도 없습니다. 최소 하나의 구성 요소가 필요합니다.');
  }

  // 정보 출력
  const components = [];
  if (hasSkills) components.push('skills/');
  if (hasAgents) components.push('agents/');
  if (hasCommands) components.push('commands/');
  if (hasHooks) components.push('hooks/');
  if (hasMcp) components.push('.mcp.json');
  if (hasLsp) components.push('.lsp.json');
  if (hasSettings) components.push('settings.json');
  result.note(cat, `감지된 구성 요소: ${components.length > 0 ? components.join(', ') : '없음'}`);

  return true;
}

/**
 * 2. plugin.json 검증
 */
function validatePluginJson(root, result) {
  const cat = 'plugin.json';
  const filePath = path.join(root, '.claude-plugin', 'plugin.json');

  if (!fileExists(filePath)) return; // 이미 구조 검증에서 에러 발생

  const data = readJSON(filePath);
  if (data.__error) {
    result.error(cat, `JSON 파싱 오류: ${data.__error}`);
    return;
  }

  // 필수 필드 검증
  for (const field of PLUGIN_JSON_REQUIRED_FIELDS) {
    if (!data[field]) {
      result.error(cat, `필수 필드 '${field}'이(가) 없습니다.`);
    }
  }

  // name 검증
  if (data.name) {
    if (!isKebabCase(data.name)) {
      result.error(cat,
        `name '${data.name}'은(는) kebab-case가 아닙니다 (소문자, 숫자, 하이픈만 허용).`,
        `"name": "${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}"`
      );
    }
    if (data.name.includes(' ')) {
      result.error(cat, `name에 공백이 포함되어 있습니다. 공백 없이 kebab-case를 사용하세요.`);
    }
  }

  // version 검증 (semver)
  if (data.version) {
    if (!isSemver(data.version)) {
      result.error(cat,
        `version '${data.version}'이(가) semver 형식이 아닙니다 (예: 1.0.0, 2.1.0-beta.1).`
      );
    }
  }

  // description 검증
  if (data.description) {
    if (data.description.length < 10) {
      result.warn(cat, `description이 너무 짧습니다 (${data.description.length}자). 검색/설치 시 표시되므로 충분한 설명을 권장합니다.`);
    }
    if (data.description.length > 500) {
      result.warn(cat, `description이 너무 깁니다 (${data.description.length}자). 간결하게 유지하세요.`);
    }
  }

  // author 검증
  if (data.author) {
    if (typeof data.author === 'object') {
      if (!data.author.name) {
        result.warn(cat, `author.name이 없습니다. 작성자 이름을 추가하세요.`);
      }
    } else if (typeof data.author !== 'string') {
      result.error(cat, `author는 문자열 또는 { name, email? } 객체여야 합니다.`);
    }
  } else {
    result.warn(cat, `author 필드가 없습니다. 마켓플레이스 배포 시 작성자 정보를 권장합니다.`);
  }

  // license 검증
  if (data.license) {
    if (!VALID_LICENSE_IDS.includes(data.license) && !data.license.includes(' ')) {
      result.warn(cat, `license '${data.license}'은(는) 일반적인 SPDX 식별자가 아닙니다. 확인해주세요.`);
    }
  } else {
    result.warn(cat, `license 필드가 없습니다. 마켓플레이스 배포 시 라이선스 명시를 권장합니다.`);
  }

  // keywords 검증
  if (data.keywords) {
    if (!Array.isArray(data.keywords)) {
      result.error(cat, `keywords는 문자열 배열이어야 합니다.`);
    } else if (data.keywords.length === 0) {
      result.warn(cat, `keywords가 비어있습니다. 검색 편의를 위해 태그 추가를 권장합니다.`);
    }
  } else {
    result.warn(cat, `keywords 필드가 없습니다. 마켓플레이스 검색에 유용합니다.`);
  }

  // repository 검증
  if (data.repository && typeof data.repository === 'string') {
    if (!data.repository.startsWith('http') && !data.repository.startsWith('git@')) {
      result.warn(cat, `repository URL이 올바르지 않습니다: '${data.repository}'.`);
    }
  }

  // 선택적 구성 요소 필드 검증
  if (data.commands) validatePathArray(data.commands, 'commands', root, cat, result);
  if (data.agents) validatePathArray(data.agents, 'agents', root, cat, result);

  // hooks 인라인 검증
  if (data.hooks && typeof data.hooks === 'object' && typeof data.hooks !== 'string') {
    validateHooksObject(data.hooks, cat, result);
  }

  // strict 모드 확인
  if (data.strict === false) {
    result.note(cat, `strict: false 설정됨 — 마켓플레이스가 구성 요소를 완전 제어합니다.`);
  }

  result.note(cat, `플러그인: ${data.name || '?'}@${data.version || '?'} — "${data.description || ''}"`);
}

function validatePathArray(arr, label, root, cat, result) {
  if (!Array.isArray(arr)) {
    if (typeof arr === 'string') {
      arr = [arr];
    } else {
      result.error(cat, `${label}은(는) 문자열 또는 문자열 배열이어야 합니다.`);
      return;
    }
  }
  for (const p of arr) {
    if (typeof p !== 'string') {
      result.error(cat, `${label}의 항목이 문자열이 아닙니다: ${JSON.stringify(p)}`);
      continue;
    }
    // ${CLAUDE_PLUGIN_ROOT} 변수는 런타임에 치환되므로 건너뜀
    if (p.includes('${CLAUDE_PLUGIN_ROOT}')) continue;
    const resolved = path.resolve(root, p);
    if (!fileExists(resolved)) {
      result.warn(cat, `${label}에 지정된 경로가 존재하지 않습니다: '${p}'`);
    }
  }
}

/**
 * 3. hooks.json 검증
 */
function validateHooksJson(root, result) {
  const cat = 'hooks.json';
  const filePath = path.join(root, 'hooks', 'hooks.json');

  if (!fileExists(filePath)) {
    // hooks 디렉토리 없으면 그냥 스킵
    if (!fileExists(path.join(root, 'hooks'))) return;
    result.warn(cat, `hooks/ 디렉토리가 있지만 hooks.json이 없습니다.`);
    return;
  }

  const data = readJSON(filePath);
  if (data.__error) {
    result.error(cat, `JSON 파싱 오류: ${data.__error}`);
    return;
  }

  // hooks 루트 키 확인
  const hooksObj = data.hooks || data;
  if (!data.hooks && typeof data === 'object') {
    // 직접 이벤트가 루트에 있는 경우 — hooks 키로 감싸져 있어야 함
    const hasEvents = Object.keys(data).some(k => VALID_HOOK_EVENTS.includes(k));
    if (hasEvents) {
      result.warn(cat, `hooks.json의 이벤트가 루트에 직접 있습니다. { "hooks": { ... } } 구조를 권장합니다.`);
    }
  }

  validateHooksObject(hooksObj, cat, result);
}

function validateHooksObject(hooksObj, cat, result) {
  if (!hooksObj || typeof hooksObj !== 'object') return;

  const events = Object.keys(hooksObj);
  for (const eventName of events) {
    if (!VALID_HOOK_EVENTS.includes(eventName)) {
      result.error(cat,
        `알 수 없는 hook 이벤트: '${eventName}'. 유효한 이벤트: ${VALID_HOOK_EVENTS.join(', ')}`
      );
      continue;
    }

    const handlers = hooksObj[eventName];
    if (!Array.isArray(handlers)) {
      result.error(cat, `'${eventName}'의 핸들러가 배열이 아닙니다.`);
      continue;
    }

    for (let i = 0; i < handlers.length; i++) {
      const handler = handlers[i];
      const prefix = `${eventName}[${i}]`;

      // matcher 검증 (PreToolUse, PostToolUse에서 사용)
      if (eventName === 'PreToolUse' || eventName === 'PostToolUse') {
        if (!handler.matcher) {
          result.warn(cat, `${prefix}: matcher가 없습니다. 모든 도구에 적용됩니다.`);
        }
      }

      // hooks 배열 검증
      if (!handler.hooks || !Array.isArray(handler.hooks)) {
        result.error(cat, `${prefix}: 'hooks' 배열이 없거나 올바르지 않습니다.`);
        continue;
      }

      for (let j = 0; j < handler.hooks.length; j++) {
        const hook = handler.hooks[j];
        const hPrefix = `${prefix}.hooks[${j}]`;

        if (!hook.type) {
          result.error(cat, `${hPrefix}: 'type' 필드가 없습니다.`);
        } else if (!VALID_HOOK_TYPES.includes(hook.type)) {
          result.error(cat, `${hPrefix}: 알 수 없는 type '${hook.type}'. 유효: ${VALID_HOOK_TYPES.join(', ')}`);
        }

        if (!hook.command) {
          result.error(cat, `${hPrefix}: 'command' 필드가 없습니다.`);
        }

        if (hook.timeout && (typeof hook.timeout !== 'number' || hook.timeout < 0)) {
          result.warn(cat, `${hPrefix}: timeout 값이 올바르지 않습니다: ${hook.timeout}`);
        }

        if (hook.timeout && hook.timeout > 30000) {
          result.warn(cat, `${hPrefix}: timeout이 30초를 초과합니다 (${hook.timeout}ms). 긴 타임아웃은 사용성을 저해할 수 있습니다.`);
        }
      }
    }
  }

  result.note(cat, `등록된 hook 이벤트: ${events.join(', ')}`);
}

/**
 * 4. Skills 검증
 */
function validateSkills(root, result) {
  const cat = 'skills';
  const skillsDir = path.join(root, 'skills');

  if (!fileExists(skillsDir)) return;

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  let skillCount = 0;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    skillCount++;

    const skillDir = path.join(skillsDir, entry.name);
    const skillMd = path.join(skillDir, 'SKILL.md');

    if (!fileExists(skillMd)) {
      result.error(cat,
        `skills/${entry.name}/ 에 SKILL.md 파일이 없습니다. 각 skill 폴더에는 반드시 SKILL.md가 있어야 합니다.`
      );
      continue;
    }

    // SKILL.md 프론트매터 검증
    const content = fs.readFileSync(skillMd, 'utf8');
    validateSkillMd(content, `skills/${entry.name}/SKILL.md`, result);

    // 하위 skills (중첩) 확인
    const subEntries = fs.readdirSync(skillDir, { withFileTypes: true });
    for (const sub of subEntries) {
      if (sub.isDirectory()) {
        const subSkillMd = path.join(skillDir, sub.name, 'SKILL.md');
        if (fileExists(subSkillMd)) {
          const subContent = fs.readFileSync(subSkillMd, 'utf8');
          validateSkillMd(subContent, `skills/${entry.name}/${sub.name}/SKILL.md`, result);
        }
      }
    }
  }

  result.note(cat, `발견된 skill 폴더: ${skillCount}개`);
}

function validateSkillMd(content, filePath, result) {
  const cat = 'skills';

  // 프론트매터 추출 (---로 감싼 YAML 블록, 멀티라인 값 지원)
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    result.warn(cat, `${filePath}: 프론트매터(---)가 없습니다. description 필드 권장.`);
    return;
  }

  const fm = fmMatch[1];

  // description 체크
  if (!fm.includes('description:') && !fm.includes('description :')) {
    result.warn(cat, `${filePath}: 프론트매터에 description이 없습니다.`);
  }

  // 프론트매터 뒤에 본문이 있는지
  const bodyAfterFm = content.slice(fmMatch[0].length).trim();
  if (bodyAfterFm.length < 10) {
    result.warn(cat, `${filePath}: SKILL.md 본문이 너무 짧습니다. 충분한 지침을 작성하세요.`);
  }
}

/**
 * 5. Agents 검증
 */
function validateAgents(root, result) {
  const cat = 'agents';
  const agentsDir = path.join(root, 'agents');

  if (!fileExists(agentsDir)) return;

  const files = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const filePath = path.join(agentsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // 마크다운 agent 파일 기본 검증
    if (content.trim().length < 20) {
      result.warn(cat, `agents/${file}: 내용이 너무 짧습니다. 에이전트 정의를 충분히 작성하세요.`);
    }

    // 프론트매터 체크 (선택적이지만 권장)
    if (!content.startsWith('---')) {
      result.note(cat, `agents/${file}: 프론트매터가 없습니다. model, tools 제한 등 설정 가능.`);
    }
  }

  result.note(cat, `발견된 agent 정의: ${files.length}개`);
}

/**
 * 6. marketplace.json 검증
 */
function validateMarketplaceJson(root, result) {
  const cat = 'marketplace.json';

  // marketplace.json은 저장소 루트의 .claude-plugin/ 안에 위치
  const filePath = path.join(root, '.claude-plugin', 'marketplace.json');

  if (!fileExists(filePath)) {
    // 마켓플레이스 없으면 단일 플러그인으로 배포 가능 — 경고 아님
    result.note(cat, 'marketplace.json이 없습니다. 단일 플러그인으로만 배포 가능합니다.');
    return;
  }

  const data = readJSON(filePath);
  if (data.__error) {
    result.error(cat, `JSON 파싱 오류: ${data.__error}`);
    return;
  }

  // 필수 필드
  for (const field of MARKETPLACE_JSON_REQUIRED_FIELDS) {
    if (!data[field]) {
      result.error(cat, `필수 필드 '${field}'이(가) 없습니다.`);
    }
  }

  // name 검증
  if (data.name) {
    if (!isKebabCase(data.name)) {
      result.error(cat, `name '${data.name}'은(는) kebab-case가 아닙니다.`);
    }

    // 예약된 이름 체크
    if (RESERVED_MARKETPLACE_NAMES.includes(data.name)) {
      result.error(cat,
        `name '${data.name}'은(는) Anthropic 예약 이름입니다. 다른 이름을 사용하세요.`
      );
    }

    for (const pattern of RESERVED_MARKETPLACE_PATTERNS) {
      if (pattern.test(data.name)) {
        result.error(cat,
          `name '${data.name}'은(는) 공식 마켓플레이스를 사칭하는 것으로 간주될 수 있습니다.`
        );
      }
    }
  }

  // owner 검증
  if (data.owner) {
    if (typeof data.owner !== 'object') {
      result.error(cat, `owner는 { name, email? } 객체여야 합니다.`);
    } else {
      if (!data.owner.name) {
        result.error(cat, `owner.name은 필수입니다.`);
      }
    }
  }

  // plugins 배열 검증
  if (data.plugins) {
    if (!Array.isArray(data.plugins)) {
      result.error(cat, `plugins는 배열이어야 합니다.`);
    } else {
      for (let i = 0; i < data.plugins.length; i++) {
        validateMarketplacePlugin(data.plugins[i], i, root, result);
      }
      result.note(cat, `등록된 플러그인: ${data.plugins.length}개`);
    }
  }

  // metadata 검증
  if (data.metadata) {
    if (data.metadata.pluginRoot) {
      result.note(cat, `pluginRoot: '${data.metadata.pluginRoot}' — 플러그인 소스 경로에 접두어 적용됨.`);
    }
  }
}

function validateMarketplacePlugin(plugin, index, root, result) {
  const cat = 'marketplace.json';
  const prefix = `plugins[${index}]`;

  // 필수: name, source
  if (!plugin.name) {
    result.error(cat, `${prefix}: 'name' 필드가 없습니다.`);
  } else if (!isKebabCase(plugin.name)) {
    result.error(cat, `${prefix}: name '${plugin.name}'은(는) kebab-case가 아닙니다.`);
  }

  if (!plugin.source) {
    result.error(cat, `${prefix}: 'source' 필드가 없습니다. 플러그인 위치를 지정해야 합니다.`);
  } else {
    validatePluginSource(plugin.source, prefix, root, result);
  }

  // version
  if (plugin.version && !isSemver(plugin.version)) {
    result.warn(cat, `${prefix}: version '${plugin.version}'이(가) semver 형식이 아닙니다.`);
  }

  // strict 모드
  if (plugin.strict === false) {
    result.note(cat, `${prefix}: strict: false — 마켓플레이스가 구성 요소를 완전 제어.`);
  }
}

function validatePluginSource(source, prefix, root, result) {
  const cat = 'marketplace.json';

  if (typeof source === 'string') {
    // 상대 경로
    if (!source.startsWith('./')) {
      result.warn(cat, `${prefix}: 상대 경로 소스는 './'로 시작해야 합니다: '${source}'`);
    }
    return;
  }

  if (typeof source !== 'object') {
    result.error(cat, `${prefix}: source는 문자열(상대경로) 또는 객체여야 합니다.`);
    return;
  }

  if (!source.source) {
    result.error(cat, `${prefix}: source 객체에 'source' 타입이 없습니다 (github, url, git-subdir, npm, pip).`);
    return;
  }

  if (!VALID_SOURCE_TYPES.includes(source.source)) {
    result.error(cat,
      `${prefix}: 알 수 없는 source 타입 '${source.source}'. 유효: ${VALID_SOURCE_TYPES.join(', ')}`
    );
    return;
  }

  // 타입별 필수 필드 검증
  switch (source.source) {
    case 'github':
      if (!source.repo) {
        result.error(cat, `${prefix}: github 소스에 'repo' 필드가 없습니다 (형식: owner/repo).`);
      } else if (!source.repo.includes('/')) {
        result.error(cat, `${prefix}: github repo는 'owner/repo' 형식이어야 합니다.`);
      }
      if (source.sha && source.sha.length !== 40) {
        result.warn(cat, `${prefix}: sha는 전체 40자 git 커밋 SHA여야 합니다.`);
      }
      break;

    case 'url':
      if (!source.url) {
        result.error(cat, `${prefix}: url 소스에 'url' 필드가 없습니다.`);
      } else if (!source.url.endsWith('.git')) {
        result.warn(cat, `${prefix}: url 소스의 URL은 .git으로 끝나야 합니다.`);
      }
      break;

    case 'git-subdir':
      if (!source.url) {
        result.error(cat, `${prefix}: git-subdir 소스에 'url' 필드가 없습니다.`);
      }
      if (!source.path) {
        result.error(cat, `${prefix}: git-subdir 소스에 'path' 필드가 없습니다.`);
      }
      break;

    case 'npm':
      if (!source.package) {
        result.error(cat, `${prefix}: npm 소스에 'package' 필드가 없습니다.`);
      }
      break;

    case 'pip':
      if (!source.package) {
        result.error(cat, `${prefix}: pip 소스에 'package' 필드가 없습니다.`);
      }
      break;
  }
}

/**
 * 7. settings.json 검증
 */
function validateSettingsJson(root, result) {
  const cat = 'settings.json';
  const filePath = path.join(root, 'settings.json');

  if (!fileExists(filePath)) return;

  const data = readJSON(filePath);
  if (data.__error) {
    result.error(cat, `JSON 파싱 오류: ${data.__error}`);
    return;
  }

  // agent 필드 — agents/ 디렉토리의 파일 참조여야 함
  if (data.agent) {
    const agentFile = path.join(root, 'agents', `${data.agent}.md`);
    if (!fileExists(agentFile)) {
      result.warn(cat, `agent '${data.agent}'에 해당하는 agents/${data.agent}.md 파일이 없습니다.`);
    }
    result.note(cat, `기본 agent 설정: '${data.agent}'`);
  }
}

/**
 * 8. 스크립트 파일 참조 검증
 */
function validateScriptReferences(root, result) {
  const cat = '스크립트 참조';
  const hooksFile = path.join(root, 'hooks', 'hooks.json');

  if (!fileExists(hooksFile)) return;

  const data = readJSON(hooksFile);
  if (data.__error) return;

  const hooksObj = data.hooks || data;

  for (const [eventName, handlers] of Object.entries(hooksObj)) {
    if (!Array.isArray(handlers)) continue;

    for (const handler of handlers) {
      if (!handler.hooks || !Array.isArray(handler.hooks)) continue;

      for (const hook of handler.hooks) {
        if (!hook.command) continue;

        // ${CLAUDE_PLUGIN_ROOT} 치환 후 파일 존재 확인
        const cmd = hook.command.replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, root);
        const parts = cmd.split(/\s+/);

        // node script.js 패턴
        let scriptPath = null;
        if (parts[0] === 'node' && parts[1]) {
          scriptPath = parts[1];
        } else if (parts[0].endsWith('.js') || parts[0].endsWith('.sh')) {
          scriptPath = parts[0];
        }

        if (scriptPath && !scriptPath.includes('${') && !fileExists(scriptPath)) {
          result.warn(cat, `hook 명령이 참조하는 스크립트가 없습니다: ${hook.command}`);
        }
      }
    }
  }
}

/**
 * 9. README 존재 여부
 */
function validateReadme(root, result) {
  const cat = '문서';

  if (!fileExists(path.join(root, 'README.md')) && !fileExists(path.join(root, 'readme.md'))) {
    result.warn(cat, 'README.md가 없습니다. 공유/배포 시 설치 및 사용 지침 포함을 권장합니다.');
  }
}

/**
 * 10. .mcp.json 검증
 */
function validateMcpJson(root, result) {
  const cat = '.mcp.json';
  const filePath = path.join(root, '.mcp.json');

  if (!fileExists(filePath)) return;

  const data = readJSON(filePath);
  if (data.__error) {
    result.error(cat, `JSON 파싱 오류: ${data.__error}`);
    return;
  }

  // MCP 서버 키 확인
  const serverCount = Object.keys(data).length;
  result.note(cat, `등록된 MCP 서버: ${serverCount}개`);

  for (const [name, config] of Object.entries(data)) {
    if (!config.command) {
      result.error(cat, `MCP 서버 '${name}'에 command 필드가 없습니다.`);
    }
  }
}

/**
 * 11. .lsp.json 검증
 */
function validateLspJson(root, result) {
  const cat = '.lsp.json';
  const filePath = path.join(root, '.lsp.json');

  if (!fileExists(filePath)) return;

  const data = readJSON(filePath);
  if (data.__error) {
    result.error(cat, `JSON 파싱 오류: ${data.__error}`);
    return;
  }

  for (const [lang, config] of Object.entries(data)) {
    if (!config.command) {
      result.error(cat, `LSP 서버 '${lang}'에 command 필드가 없습니다.`);
    }
    if (!config.extensionToLanguage || typeof config.extensionToLanguage !== 'object') {
      result.warn(cat, `LSP 서버 '${lang}'에 extensionToLanguage 매핑이 없습니다.`);
    }
  }
}

// ─── 메인 실행 ─────────────────────────────────────────────────

function validate(pluginRoot) {
  const root = path.resolve(pluginRoot);
  const result = new ValidationResult();

  if (!fileExists(root)) {
    result.error('입력', `경로가 존재하지 않습니다: ${root}`);
    return result;
  }

  // 순서대로 검증 실행
  const structureOk = validateStructure(root, result);
  if (structureOk) {
    validatePluginJson(root, result);
  }

  validateHooksJson(root, result);
  validateSkills(root, result);
  validateAgents(root, result);
  validateMarketplaceJson(root, result);
  validateSettingsJson(root, result);
  validateScriptReferences(root, result);
  validateMcpJson(root, result);
  validateLspJson(root, result);
  validateReadme(root, result);

  return result;
}

// ─── CLI 실행 ─────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  const flags = args.filter(a => a.startsWith('--'));
  const positional = args.filter(a => !a.startsWith('--'));

  const pluginRoot = positional[0] || process.cwd();
  const jsonOutput = flags.includes('--json');

  const result = validate(pluginRoot);

  if (jsonOutput) {
    process.stdout.write(JSON.stringify(result.toJSON(), null, 2));
  } else {
    process.stdout.write(result.toCLI());
  }

  process.exit(result.passed ? 0 : 1);
}

// ─── 모듈 내보내기 ─────────────────────────────────────────────

module.exports = { validate, ValidationResult };
