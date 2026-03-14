/**
 * VAIS Code - I/O Utilities
 * 훅 스크립트의 stdin/stdout 처리
 */
const fs = require('fs');

const MAX_CONTEXT_LENGTH = 8000;

/**
 * stdin에서 JSON 읽기 (동기)
 */
function readStdin() {
  try {
    const raw = fs.readFileSync(process.stdin.fd, 'utf8').trim();
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

/**
 * 훅 입력에서 tool_input 파싱
 */
function parseHookInput(input) {
  const toolInput = input?.tool_input || input?.input || {};
  return {
    command: toolInput.command || '',
    filePath: toolInput.file_path || '',
    content: toolInput.content || '',
    skill: toolInput.skill || '',
    args: toolInput.args || '',
    raw: toolInput,
  };
}

/**
 * 허용 응답 출력 (additionalContext 포함 가능)
 */
function outputAllow(additionalContext) {
  const response = {};
  if (additionalContext) {
    response.additionalContext = additionalContext;
  }
  console.log(JSON.stringify(response));
}

/**
 * 차단 응답 출력
 */
function outputBlock(reason) {
  console.log(JSON.stringify({
    decision: 'block',
    reason: reason,
  }));
}

/**
 * 빈 응답 (패스스루)
 */
function outputEmpty() {
  console.log(JSON.stringify({}));
}

/**
 * 컨텍스트 길이 제한
 */
function truncate(text, maxLen) {
  if (!text) return '';
  if (text.length <= (maxLen || MAX_CONTEXT_LENGTH)) return text;
  return text.substring(0, maxLen || MAX_CONTEXT_LENGTH) + '\n... (truncated)';
}

module.exports = {
  readStdin,
  parseHookInput,
  outputAllow,
  outputBlock,
  outputEmpty,
  truncate,
  MAX_CONTEXT_LENGTH,
};
