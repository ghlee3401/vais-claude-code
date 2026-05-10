#!/usr/bin/env node
/**
 * VAIS Code v0.66 — M0-③ Checkpoint Keyword Handler
 *
 * UserPromptSubmit hook 핸들러. 사용자가 "체크포인트" / "여기까지 정리" /
 * "checkpoint" / "summary so far" 발화 시:
 *   1. 활성 ideation feature 의 main.md Decision Record 마지막 3 entries
 *   2. working-notes.md 마지막 entry
 *   를 additionalContext 로 출력 (assistant 가 이를 보고 부분 정리 응답).
 *
 * ideation 종료 X (계속). 키워드 부재 시 통과.
 *
 * Fail-safe: 모든 실패 silent → empty pass-through (사용자 경험 영향 0).
 */

process.on('uncaughtException', () => { try { console.log('{}'); } catch (_) {} process.exit(0); });
process.on('unhandledRejection', () => { try { console.log('{}'); } catch (_) {} process.exit(0); });

const fs = require('fs');
const { readStdin } = require('../lib/io');
const { debugLog } = require('../lib/debug');
const { getActiveFeature, getIdeationProgress } = require('../lib/status');

const KEYWORDS = [
  '체크포인트', '여기까지 정리', '여기까지정리',
  'checkpoint', 'summary so far',
];

function _hasKeyword(prompt) {
  if (!prompt || typeof prompt !== 'string') return false;
  const lower = prompt.toLowerCase();
  return KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

function _extractDecisionRows(mainMdContent, limit = 3) {
  // ## Decision Record 섹션 찾기 → 표의 데이터 row 추출 (header + separator 제외)
  const dr = mainMdContent.match(/## Decision Record[\s\S]*?\n((?:\|[^\n]+\|\n)+)/);
  if (!dr) return [];
  const allRows = dr[1].split('\n').filter(l => l.startsWith('|'));
  // 첫 2 줄 = header + separator. 그 이후가 데이터.
  const dataRows = allRows.slice(2);
  return dataRows.slice(-limit);
}

function _extractLastWorkingNoteEntry(wnContent) {
  // 가장 마지막 ### 섹션 본문 추출
  const sections = wnContent.split(/^### /m);
  if (sections.length < 2) return '';
  const last = sections[sections.length - 1];
  // 마지막 섹션의 첫 200 자
  return '### ' + last.split('\n').slice(0, 5).join('\n').slice(0, 400);
}

function _buildCheckpointContext(feature, ideation) {
  const lines = [];
  lines.push(`📍 **체크포인트** — ${feature} (turn ${ideation.lastTurn || '?'})`);
  lines.push('');

  // Decision Record 마지막 3
  try {
    const mainPath = ideation.mainMdPath;
    if (mainPath && fs.existsSync(mainPath)) {
      const content = fs.readFileSync(mainPath, 'utf8');
      const rows = _extractDecisionRows(content, 3);
      if (rows.length > 0) {
        lines.push('📌 **현재까지 결정 (Decision Record 마지막 3)**:');
        rows.forEach(r => lines.push(r));
        lines.push('');
      }
    }
  } catch (e) {
    debugLog('CheckpointKeyword', 'main.md 읽기 실패', { error: e.message });
  }

  // working-notes 마지막 entry
  try {
    const wnPath = ideation.workingNotesPath;
    if (wnPath && fs.existsSync(wnPath)) {
      const content = fs.readFileSync(wnPath, 'utf8');
      const last = _extractLastWorkingNoteEntry(content);
      if (last) {
        lines.push('📝 **마지막 working-notes**:');
        lines.push(last);
      }
    }
  } catch (e) {
    debugLog('CheckpointKeyword', 'working-notes 읽기 실패', { error: e.message });
  }

  return lines.join('\n');
}

function main() {
  const input = readStdin();

  // UserPromptSubmit input 의 prompt 필드 추출 (스펙 추측)
  const prompt = input?.prompt || input?.user_prompt || input?.text || '';

  // 키워드 감지
  if (!_hasKeyword(prompt)) {
    console.log('{}'); // pass-through
    process.exit(0);
  }

  // 활성 feature 의 ideation 확인
  const feature = getActiveFeature();
  if (!feature) {
    console.log('{}');
    process.exit(0);
  }

  const ideation = getIdeationProgress(feature);
  if (!ideation?.inProgress) {
    console.log('{}');
    process.exit(0);
  }

  // 체크포인트 컨텍스트 빌드
  let checkpointCtx = '';
  try {
    checkpointCtx = _buildCheckpointContext(feature, ideation);
  } catch (e) {
    debugLog('CheckpointKeyword', 'context build 실패', { error: e.message });
    console.log('{}');
    process.exit(0);
  }

  if (!checkpointCtx) {
    console.log('{}');
    process.exit(0);
  }

  // additionalContext 로 assistant 에게 전달
  const response = {
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: checkpointCtx,
    },
  };
  console.log(JSON.stringify(response));
  process.exit(0);
}

module.exports = { main, _hasKeyword, _extractDecisionRows, _extractLastWorkingNoteEntry };

if (require.main === module) {
  main();
}
