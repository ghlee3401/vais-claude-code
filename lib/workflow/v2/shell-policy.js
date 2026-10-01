'use strict';

// unattended-chain U1 (REQ-003): a composed shell command is judged piece by piece instead of
// being refused as a whole. `segmentCommand` splits on unquoted `&&` · `||` · `;` · `|` · line
// breaks, lifts `$( )` and backtick bodies out as pieces of their own, and refuses the shapes the
// policy cannot read (background `&`, subshells, process substitution, heredocs, unclosed quotes).
// `parseRedirections` separates output targets so `write-policy.js` can judge them as paths.

const PLACEHOLDER = '__VAIS_SUBST__';

// Commands that are refused in every position, authorization or not.
const DESTRUCTIVE_COMMANDS = Object.freeze([
  /^\s*rm\s+(?:-[A-Za-z]*[rRf][A-Za-z]*(?:\s|$)|--recursive|--force|--no-preserve-root)/,
  /^\s*git(?:\s+-C\s+\S+)?\s+push\b[\s\S]*(?:\s--force(?:-with-lease)?|\s-f)(?:\s|$)/,
  /^\s*git(?:\s+-C\s+\S+)?\s+(?:commit|push|merge|rebase|am)\b[\s\S]*\s(?:--no-verify|-n)(?:\s|$)/,
  /^\s*(?:sudo|su|doas|pkexec)\b/,
  /^\s*(?:eval|exec|source|xargs|nohup|setsid|env|command|builtin|watch|timeout)\b/,
  /^\s*\.\s/,
  /^\s*(?:chmod|chown|chgrp|mkfs|dd|shutdown|reboot|halt|kill|killall|pkill|crontab)\b/,
]);

function destructiveReason(segment) {
  return DESTRUCTIVE_COMMANDS.some(pattern => pattern.test(segment)) ? `destructive or wrapper command: ${segment.trim().split(/\s+/).slice(0, 2).join(' ')}` : null;
}

// Find the index of the `)` that closes a `$(` opened at `open` (index of `$`), honouring quotes
// and nesting. Returns -1 when unclosed.
function closingParen(source, open) {
  let depth = 1;
  let quote = null;
  for (let index = open + 1; index < source.length; index += 1) {
    const ch = source[index];
    if (quote === "'") { if (ch === "'") quote = null; continue; }
    if (ch === '\\') { index += 1; continue; }
    if (quote === '"') { if (ch === '"') quote = null; else if (ch === '$' && source[index + 1] === '(') { depth += 1; index += 1; } continue; }
    if (ch === "'") { quote = "'"; continue; }
    if (ch === '"') { quote = '"'; continue; }
    if (ch === '(') { depth += 1; continue; }
    if (ch === ')') { depth -= 1; if (depth === 0) return index; }
  }
  return -1;
}

function closingBacktick(source, open) {
  for (let index = open + 1; index < source.length; index += 1) {
    if (source[index] === '\\') { index += 1; continue; }
    if (source[index] === '`') return index;
  }
  return -1;
}

function refuse(reason) {
  return { ok: false, reason, segments: [] };
}

function segmentCommand(command) {
  const source = String(command || '');
  const segments = [];
  let current = '';
  let quote = null;
  const push = () => { if (current.trim()) segments.push(current.trim()); current = ''; };
  for (let index = 0; index < source.length; index += 1) {
    const ch = source[index];
    const next = source[index + 1];
    if (quote === "'") {
      current += ch;
      if (ch === "'") quote = null;
      continue;
    }
    if (ch === '\\') {
      if (index + 1 >= source.length) return refuse('trailing backslash');
      // An unquoted backslash is removed by bash before execution (`-e\xec` → `-exec`), so the
      // policy could not read the word the shell runs (QA, repair 4). Inside double quotes it
      // only escapes and the word is kept intact.
      if (quote === null) return refuse('unquoted backslash escapes are not allowed');
      current += ch + next;
      index += 1;
      continue;
    }
    // ANSI-C `$'…'` and locale `$"…"` quoting escape quotes in ways this scanner would read
    // differently from bash (QA finding, repair 2): refused outright.
    if (ch === '$' && (next === "'" || next === '"') && quote !== '"') return refuse('ANSI-C / locale quoting `$\'…\'` is not allowed');
    // `${NAME}` is plain parameter expansion (the runtime's own `${CLAUDE_PLUGIN_ROOT}` uses it);
    // any operator inside the braces (`${x:-…}`, `${x//…}`) is refused with the other braces.
    if (ch === '$' && next === '{') {
      const close = source.indexOf('}', index + 2);
      const name = close < 0 ? '' : source.slice(index + 2, close);
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) return refuse('parameter expansion with operators is not allowed');
      current += source.slice(index, close + 1);
      index = close;
      continue;
    }
    // `$( … )` and backticks execute even inside double quotes: their bodies are pieces too.
    if (ch === '$' && next === '(') {
      if (source[index + 2] === '(') return refuse('arithmetic expansion is not allowed');
      const close = closingParen(source, index + 1);
      if (close < 0) return refuse('unclosed command substitution');
      const inner = segmentCommand(source.slice(index + 2, close));
      if (!inner.ok) return inner;
      segments.push(...inner.segments);
      current += PLACEHOLDER;
      index = close;
      continue;
    }
    if (ch === '`') {
      const close = closingBacktick(source, index);
      if (close < 0) return refuse('unclosed backtick substitution');
      const inner = segmentCommand(source.slice(index + 1, close));
      if (!inner.ok) return inner;
      segments.push(...inner.segments);
      current += PLACEHOLDER;
      index = close;
      continue;
    }
    if (quote === '"') {
      current += ch;
      if (ch === '"') quote = null;
      continue;
    }
    if (ch === "'" || ch === '"') { quote = ch; current += ch; continue; }
    if (ch === '&' && next === '&') { push(); index += 1; continue; }
    if (ch === '|' && next === '|') { push(); index += 1; continue; }
    if (ch === '|' && next === '&') return refuse('`|&` is not allowed');
    if (ch === '|') { push(); continue; }
    if (ch === ';') { push(); continue; }
    if (ch === '\n' || ch === '\r') { push(); continue; }
    // `2>&1` / `>&2` / `<&0` duplicate descriptors; a lone `&` would background the command.
    if (ch === '&' && next !== '>' && source[index - 1] !== '>' && source[index - 1] !== '<') return refuse('background execution `&` is not allowed');
    if ((ch === '<' || ch === '>') && next === '(') return refuse('process substitution is not allowed');
    if (ch === '(' || ch === ')') return refuse('subshell grouping is not allowed');
    // Unquoted braces expand into other words (`tr{u,}ncate`, `-{,}exec`): refused whole.
    if (ch === '{' || ch === '}') return refuse('unquoted brace expansion is not allowed');
    current += ch;
  }
  if (quote) return refuse('unclosed quote');
  push();
  if (segments.length === 0) return refuse('empty command');
  return { ok: true, reason: null, segments };
}

// Strip quotes from a redirection target word.
function unquote(word) {
  return String(word || '').replace(/^(['"])([\s\S]*)\1$/, '$2').replace(/\\(.)/g, '$1');
}

// Split one segment into its command text and redirections. Returns null with `reason` for
// shapes the policy refuses (clobber `>|`, heredoc `<<`).
function parseRedirections(segment) {
  const source = String(segment || '');
  const redirections = [];
  let text = '';
  let quote = null;
  for (let index = 0; index < source.length; index += 1) {
    const ch = source[index];
    if (quote) {
      text += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '\\') { text += ch + (source[index + 1] || ''); index += 1; continue; }
    if (ch === "'" || ch === '"') { quote = ch; text += ch; continue; }
    if (ch !== '<' && ch !== '>' && ch !== '&' && !/[0-9]/.test(ch)) { text += ch; continue; }
    // Candidate operator: [N]>, [N]>>, &>, &>>, >|, [N]>&M, <, <<, <<<, N<
    const rest = source.slice(index);
    const match = rest.match(/^(?:([0-9]+)?(>>|>\||>|<<<|<<|<)|(&>>|&>))/);
    if (!match) { text += ch; continue; }
    // A digit that is not glued to a redirection operator is ordinary text (e.g. `head -20`).
    if (/^[0-9]/.test(ch) && !/^[0-9]+(?:>>|>\||>|<)/.test(rest)) { text += ch; continue; }
    const operator = match[2] || match[3];
    const fd = match[1] || null;
    let cursor = index + match[0].length;
    if (operator === '>|') return { ok: false, reason: 'clobber redirection `>|` is not allowed' };
    if (operator === '<<') return { ok: false, reason: 'heredoc `<<` is not allowed (use the Write tool)' };
    // `>&M` / `N>&M`: file descriptor duplication, no path involved.
    const dup = source.slice(cursor).match(/^&([0-9]+|-)/);
    if (dup && (operator === '>' || operator === '<')) {
      index = cursor + dup[0].length - 1;
      continue;
    }
    const targetMatch = source.slice(cursor).match(/^\s*((?:'[^']*'|"(?:[^"\\]|\\.)*"|\\.|[^\s'"\\|;&<>])+)/);
    if (!targetMatch) return { ok: false, reason: `redirection ${operator} without a target` };
    const target = unquote(targetMatch[1]);
    cursor += targetMatch[0].length;
    redirections.push({
      operator,
      fd,
      target,
      direction: operator.startsWith('<') ? 'input' : 'output',
    });
    index = cursor - 1;
  }
  return { ok: true, reason: null, text: text.replace(/\s+/g, ' ').trim(), redirections };
}

module.exports = { PLACEHOLDER, DESTRUCTIVE_COMMANDS, destructiveReason, segmentCommand, parseRedirections };
