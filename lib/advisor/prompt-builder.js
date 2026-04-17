/**
 * VAIS Code - Advisor Prompt Builder
 * @module lib/advisor/prompt-builder
 *
 * Sub-agent 시스템 프롬프트 + advisor-guard + trigger별 컨텍스트를 합성.
 *
 * @see docs/_legacy/01-plan/features/v050/04-advisor-integration.plan.md §2.2
 */

const TRIGGER_TEMPLATES = {
  early: ({ summary }) =>
    `이제 다음 작업을 시작하려 한다: ${summary}\n접근 방향이 올바른가? 놓친 전제는?`,
  stuck: ({ error, attempts }) =>
    `다음 에러/상태에서 막혔다: ${error}\n시도한 것: ${attempts}\n다른 접근은?`,
  final: ({ summary }) =>
    `작업이 끝났다. 다음 산출물이 완성됐다: ${summary}\n빠뜨린 것 있나?`,
  reconcile: ({ conflict }) =>
    `advisor 이전 조언과 1차 자료가 충돌한다: ${conflict}\n어느 쪽이 맞나?`,
};

/**
 * @param {Object} opts
 * @param {string} opts.subAgentMarkdown - registry.loadAgent().mergedBody
 * @param {Array} opts.conversation - 대화 히스토리
 * @param {string} opts.trigger - 'early' | 'stuck' | 'final' | 'reconcile'
 * @param {string[]} [opts.currentFiles] - 최근 편집 파일 경로
 * @param {Object} [opts.triggerContext] - trigger 템플릿에 전달할 변수
 * @returns {{systemPrompt: string, userPrompt: string}}
 */
function buildAdvisorPrompt(opts) {
  const { subAgentMarkdown, conversation, trigger, currentFiles, triggerContext } = opts;

  const systemPrompt = [
    'You are an Opus-level advisor reviewing a Sonnet sub-agent\'s work.',
    'The sub-agent\'s full instructions are below.',
    '',
    subAgentMarkdown || '(no agent markdown provided)',
  ].join('\n');

  const templateFn = TRIGGER_TEMPLATES[trigger] || TRIGGER_TEMPLATES.early;
  const triggerBlock = templateFn(triggerContext || {});

  const contextBlock = currentFiles && currentFiles.length > 0
    ? `\n최근 편집 파일:\n${currentFiles.map(f => `- ${f}`).join('\n')}`
    : '';

  const recentTurns = Array.isArray(conversation)
    ? conversation.slice(-20).map(t => `[${t.role}]: ${t.content}`).join('\n')
    : '';

  const userPrompt = [
    triggerBlock,
    contextBlock,
    recentTurns ? `\n최근 대화:\n${recentTurns}` : '',
  ].filter(Boolean).join('\n');

  return { systemPrompt, userPrompt };
}

module.exports = { buildAdvisorPrompt, TRIGGER_TEMPLATES };
