/**
 * VAIS Code — M0-① LLM Heuristic
 *
 * 매 assistant turn 종료 시 turn 의 *기록 가치* 를 LLM (Claude Haiku) 으로 판단.
 * KEPT → working-notes 자동 append. SKIP → noise 누적 방지.
 * 실패 시 default SKIP (under-record 가 over-record 보다 안전).
 *
 * 비용: turn 당 ~130 토큰 (~$0.0001 Haiku 기준).
 */

const fs = require('fs');
const path = require('path');
const { debugLog } = require('./debug');

const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';
const TIMEOUT_MS = 3000;

const SYSTEM_PROMPT = `You are a working-notes curator for an AI development workflow (vais-code).

Decide if this assistant turn is worth recording in working-notes.md (1~3 line summary) or should be skipped.

KEPT criteria (any one):
- 결정 사항 (확정·합의·반대·재논의)
- 새 정보 / 외부 reference / 새 가설 / 새 차원
- 미해결 질문 (Open Question 후보)
- C-Level 페르소나 충돌 / 주요 trade-off

SKIP criteria (all must apply):
- 단순 yes/no 확인
- 명확화 질문 (재질문)
- 도구 호출 결과 단순 보고 (commit hash, file size 등)

Output JSON (no markdown wrapping):
{
  "decision": "KEPT" | "SKIP",
  "summary": "<1~3 line bullet, omit if SKIP>",
  "decisionKeywords": ["<keyword1>", "..."]  // 비어있으면 [] (Decision Record append 안함)
}`;

/**
 * Anthropic SDK 동적 require — optionalDependency. 미설치 시 graceful skip.
 *
 * @returns {Object|null} Anthropic SDK 인스턴스 또는 null
 */
function _loadAnthropicSDK() {
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      debugLog('LLMHeuristic', 'ANTHROPIC_API_KEY 미설정, SKIP fallback');
      return null;
    }
    return new Anthropic({ apiKey, timeout: TIMEOUT_MS });
  } catch (e) {
    debugLog('LLMHeuristic', 'Anthropic SDK 미설치, SKIP fallback', { error: e.message });
    return null;
  }
}

/**
 * Turn 기록 가치 판단 (LLM 호출).
 *
 * @param {Object} input
 * @param {string} input.assistantTurn  - 최근 assistant 응답 본문
 * @param {string} [input.userTurn]      - 직전 user prompt
 * @param {string} [input.recentNotes]   - working-notes 마지막 3 entry (컨텍스트)
 * @returns {Promise<Object>} { decision: 'KEPT'|'SKIP', summary?, decisionKeywords[] }
 */
async function judgeTurnWorth({ assistantTurn, userTurn = '', recentNotes = '' }) {
  // Default fallback (실패 시)
  const skipResult = { decision: 'SKIP', summary: '', decisionKeywords: [] };

  if (!assistantTurn || assistantTurn.length < 50) {
    return skipResult; // 너무 짧은 turn 은 자동 skip
  }

  const sdk = _loadAnthropicSDK();
  if (!sdk) return skipResult;

  // Token 절약 — 각 input 1500 자 cap
  const userExcerpt = (userTurn || '').slice(0, 1500);
  const assistantExcerpt = assistantTurn.slice(0, 1500);
  const notesExcerpt = (recentNotes || '').slice(0, 800);

  const userMessage = `User turn:
${userExcerpt}

Assistant turn:
${assistantExcerpt}

Recent working-notes (context):
${notesExcerpt}

Decide: KEPT or SKIP. Output JSON only.`;

  try {
    const response = await sdk.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const text = response.content?.[0]?.text || '';
    return _parseResponse(text);
  } catch (e) {
    debugLog('LLMHeuristic', 'API 호출 실패, SKIP fallback', { error: e.message });
    return skipResult;
  }
}

/**
 * LLM 응답 JSON 파싱 (defensive).
 */
function _parseResponse(text) {
  const fallback = { decision: 'SKIP', summary: '', decisionKeywords: [] };
  if (!text) return fallback;

  // JSON block 추출 (markdown code fence 제거)
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      decision: parsed.decision === 'KEPT' ? 'KEPT' : 'SKIP',
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      decisionKeywords: Array.isArray(parsed.decisionKeywords) ? parsed.decisionKeywords : [],
    };
  } catch (e) {
    debugLog('LLMHeuristic', 'JSON 파싱 실패, SKIP fallback', { text: cleaned.slice(0, 200) });
    return fallback;
  }
}

/**
 * Working-notes append (atomic file write 패턴).
 *
 * @param {string} workingNotesPath - 절대/상대 경로
 * @param {string} entry - 새 entry (Markdown)
 * @returns {boolean} 성공 여부
 */
function appendWorkingNotes(workingNotesPath, entry) {
  try {
    const dir = path.dirname(workingNotesPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.appendFileSync(workingNotesPath, entry, 'utf8');
    return true;
  } catch (e) {
    debugLog('LLMHeuristic', 'working-notes append 실패', { error: e.message });
    return false;
  }
}

module.exports = {
  judgeTurnWorth,
  appendWorkingNotes,
  ANTHROPIC_MODEL,
  // Internal exposed for testing
  _parseResponse,
  _loadAnthropicSDK,
};
