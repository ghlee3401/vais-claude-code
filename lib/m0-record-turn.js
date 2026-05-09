#!/usr/bin/env node
/**
 * VAIS Code v0.66 — M0-① Working-notes worker
 *
 * Stop hook 에서 detached 로 호출됨 (fire-and-forget). 사용자 경험에 영향 없음.
 * argv: [node, script, transcriptPath, feature]
 *
 * 동작:
 * 1. transcript JSONL 에서 마지막 user + assistant turn 추출
 * 2. lib/llm-heuristic.judgeTurnWorth 로 KEPT/SKIP 판단
 * 3. KEPT → working-notes.md 자동 append + lastTurn 갱신
 * 4. 실패 시 silent exit (Never break user experience)
 */

process.on('uncaughtException', () => process.exit(0));
process.on('unhandledRejection', () => process.exit(0));

const fs = require('fs');
const path = require('path');

const transcriptPath = process.argv[2];
const featureName = process.argv[3];

if (!transcriptPath || !featureName) {
  process.exit(0);
}

(async () => {
  try {
    const { judgeTurnWorth, appendWorkingNotes } = require('./llm-heuristic');
    const { getIdeationProgress, setIdeationProgress } = require('./status');

    // 1. transcript 마지막 turn 추출
    const { assistantTurn, userTurn } = _extractLastTurns(transcriptPath);
    if (!assistantTurn) process.exit(0);

    const ideation = getIdeationProgress(featureName);
    if (!ideation?.inProgress) process.exit(0);

    const wnPath = ideation.workingNotesPath || `docs/${featureName}/00-ideation/working-notes.md`;
    const recentNotes = _readRecentNotes(wnPath);

    // 2. LLM 휴리스틱 판단
    const result = await judgeTurnWorth({ assistantTurn, userTurn, recentNotes });

    // 3. KEPT 시 append
    if (result.decision === 'KEPT' && result.summary) {
      const turnNum = (ideation.lastTurn || 0) + 1;
      const ts = new Date().toISOString();
      const entry = `\n### Turn ${turnNum} (auto-recorded ${ts})\n${result.summary}\n`;
      appendWorkingNotes(wnPath, entry);
      setIdeationProgress(featureName, { lastTurn: turnNum });

      // M0-② Decision Record append (decisionKeywords 비어있지 않으면)
      if (Array.isArray(result.decisionKeywords) && result.decisionKeywords.length > 0) {
        _appendDecisionRecord(featureName, ideation, result, turnNum, ts);
      }
    }
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
})();

/**
 * Transcript JSONL 에서 가장 최근 assistant turn + 직전 user turn 추출.
 */
function _extractLastTurns(transcriptPath) {
  let assistantTurn = '';
  let userTurn = '';
  try {
    const raw = fs.readFileSync(transcriptPath, 'utf8').trim();
    const lines = raw.split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const msg = JSON.parse(lines[i]);
        const role = msg.message?.role || msg.role;
        const content = msg.message?.content ?? msg.content;
        if (!assistantTurn && role === 'assistant') {
          assistantTurn = _extractText(content);
          continue;
        }
        if (assistantTurn && !userTurn && role === 'user') {
          userTurn = _extractText(content);
          break;
        }
      } catch (_) { continue; }
    }
  } catch (_) { /* file read failed */ }
  return { assistantTurn, userTurn };
}

function _extractText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter(c => c.type === 'text' && typeof c.text === 'string')
      .map(c => c.text)
      .join('\n');
  }
  return '';
}

function _readRecentNotes(wnPath) {
  try {
    const content = fs.readFileSync(wnPath, 'utf8');
    const lines = content.split('\n');
    return lines.slice(-30).join('\n');
  } catch (_) {
    return '';
  }
}

/**
 * M0-② Decision Record append — main.md 의 표에 1 row 추가.
 * append-only (clevel-main-guard rule 3).
 */
function _appendDecisionRecord(featureName, ideation, result, turnNum, ts) {
  try {
    const mainPath = ideation.mainMdPath || `docs/${featureName}/00-ideation/main.md`;
    if (!fs.existsSync(mainPath)) return;

    const content = fs.readFileSync(mainPath, 'utf8');
    const date = ts.slice(0, 10);
    const decisionLine = result.decisionKeywords.join(' / ');
    const decisionRow = `| ${date} | ${decisionLine} | auto-recorded (turn ${turnNum}) | working-notes turn ${turnNum} |`;

    // Decision Record 표의 마지막 row 다음에 append
    const dr = content.match(/(## Decision Record[\s\S]*?\n\|[^\n]+\|\n\|[-:|\s]+\|\n)((?:\|[^\n]+\|\n)*)/);
    if (!dr) return;
    const existing = dr[2];
    const updated = content.replace(dr[0], dr[1] + existing + decisionRow + '\n');

    // atomic write 패턴
    const tmp = mainPath + '.tmp';
    fs.writeFileSync(tmp, updated, 'utf8');
    fs.renameSync(tmp, mainPath);
  } catch (_) { /* silent */ }
}
