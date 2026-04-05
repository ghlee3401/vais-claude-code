/**
 * VAIS Code - PDCA Automation (Mandatory Checkpoints)
 * @module lib/pdca/automation
 * @version 1.0.0
 *
 * Defines mandatory user checkpoints per C-Level role,
 * preventing rework through structured decision points.
 * @see bkit-claude-code/lib/pdca/automation.js
 */

// ── Mandatory Checkpoints per Role ─────────────────────────────────

/**
 * Checkpoint definitions per C-Level role.
 * Each checkpoint requires AskUserQuestion before proceeding.
 *
 * @type {Record<string, Array<{id:string, phase:string, trigger:string, question:string, options:Array<{label:string, description:string}>}>>}
 */
const CHECKPOINTS = {
  cto: [
    {
      id: 'CP-1',
      phase: 'plan',
      trigger: 'Plan document complete',
      question: '구현 범위를 선택하세요',
      options: [
        { label: 'A. Minimal', description: '핵심 기능만 구현 (MVP)' },
        { label: 'B. Standard', description: '핵심 + 주요 부가 기능' },
        { label: 'C. Extended', description: '전체 기능 + 테스트 + QA' },
      ],
    },
    {
      id: 'CP-D',
      phase: 'design',
      trigger: 'Design document complete',
      question: '아키텍처 옵션을 선택하세요',
      options: [
        { label: 'A. Minimal Change', description: '기존 구조 최소 변경' },
        { label: 'B. Clean Architecture', description: '이상적 설계 (리팩토링 포함)' },
        { label: 'C. Pragmatic Balance', description: '실용적 균형 (권장)' },
      ],
    },
    {
      id: 'CP-2',
      phase: 'do',
      trigger: 'Before implementation starts',
      question: '이 범위로 구현을 시작할까요?',
      options: [
        { label: 'A. Execute', description: '계획대로 실행' },
        { label: 'B. Modify', description: '범위 수정 후 실행' },
        { label: 'C. Stop', description: '실행 중단' },
      ],
    },
    {
      id: 'CP-Q',
      phase: 'qa',
      trigger: 'QA analysis complete',
      question: 'QA 결과를 어떻게 처리할까요?',
      options: [
        { label: 'A. Fix All', description: '모든 이슈 수정' },
        { label: 'B. Critical Only', description: 'Critical 이슈만 수정' },
        { label: 'C. Accept', description: '현재 상태로 진행' },
      ],
    },
  ],
  ceo: [
    {
      id: 'CP-1',
      phase: 'plan',
      trigger: 'Strategic plan complete',
      question: '서비스 범위를 확인하세요',
      options: [
        { label: 'A. Minimal', description: 'MVP 범위' },
        { label: 'B. Standard', description: '표준 범위' },
        { label: 'C. Extended', description: '확장 범위' },
      ],
    },
    {
      id: 'CP-R',
      phase: 'plan',
      trigger: 'Routing decision needed',
      question: 'C-Level 라우팅을 확인하세요',
      options: [
        { label: 'A. Approve', description: '제안된 라우팅으로 진행' },
        { label: 'B. Modify', description: '다른 C-Level로 변경' },
        { label: 'C. Direct', description: '사용자가 직접 처리' },
      ],
    },
    {
      id: 'CP-2',
      phase: 'do',
      trigger: 'Before C-Level delegation',
      question: '실행을 시작할까요?',
      options: [
        { label: 'A. Execute', description: '위임 실행' },
        { label: 'B. Modify', description: '계획 수정' },
        { label: 'C. Stop', description: '중단' },
      ],
    },
    {
      id: 'CP-Q',
      phase: 'qa',
      trigger: 'All C-Level reviews complete',
      question: '최종 판단을 내려주세요',
      options: [
        { label: 'A. Supplement', description: '보완 필요' },
        { label: 'B. Critical Only', description: 'Critical만 수정' },
        { label: 'C. Approve', description: '승인' },
        { label: 'D. Stop', description: '중단' },
      ],
    },
  ],
  cso: [
    {
      id: 'CP-1',
      phase: 'plan',
      trigger: 'Security scope defined',
      question: '보안 검토 범위를 선택하세요',
      options: [
        { label: 'A. Gate A Only', description: '보안 감사만' },
        { label: 'B. Gate B Only', description: '플러그인 검증만' },
        { label: 'C. Gate C Only', description: '코드 리뷰만' },
        { label: 'D. All Gates', description: 'A+B+C 전체 실행' },
      ],
    },
    {
      id: 'CP-C',
      phase: 'do',
      trigger: 'Critical vulnerability found',
      question: 'Critical 이슈가 발견되었습니다. 배포를 차단할까요?',
      options: [
        { label: 'A. Block + Fix', description: '배포 차단 + CTO 수정 요청' },
        { label: 'B. Conditional', description: '조건부 승인' },
        { label: 'C. Developer Judgment', description: '개발자 판단에 맡김' },
      ],
    },
    {
      id: 'CP-Q',
      phase: 'qa',
      trigger: 'Security review complete',
      question: '보안 판정 결과를 확인하세요',
      options: [
        { label: 'A. CTO Fix', description: 'CTO에게 수정 요청' },
        { label: 'B. Approve', description: '현재 상태 승인' },
        { label: 'C. Recheck', description: '재검토 요청' },
      ],
    },
  ],
};

// ── Checkpoint Helpers ─────────────────────────────────────────────

/**
 * Get checkpoints for a role at a specific phase
 * @param {string} role
 * @param {string} phase
 * @returns {Array}
 */
function getCheckpointsForPhase(role, phase) {
  const roleCPs = CHECKPOINTS[role] || CHECKPOINTS.cto;
  return roleCPs.filter(cp => cp.phase === phase);
}

/**
 * Get a specific checkpoint by role and ID
 * @param {string} role
 * @param {string} cpId
 * @returns {Object|null}
 */
function getCheckpoint(role, cpId) {
  const roleCPs = CHECKPOINTS[role] || [];
  return roleCPs.find(cp => cp.id === cpId) || null;
}

/**
 * Format checkpoint as AskUserQuestion payload
 * @param {Object} checkpoint
 * @param {Object} [context] - Additional context (summary, metrics)
 * @returns {Object} AskUserQuestion-compatible payload
 */
function formatCheckpointQuestion(checkpoint, context = {}) {
  const header = context.summary
    ? `${context.summary}\n\n---\n\n**[${checkpoint.id}]** ${checkpoint.question}`
    : `**[${checkpoint.id}]** ${checkpoint.question}`;

  return {
    question: header,
    options: checkpoint.options.map(opt => ({
      label: opt.label,
      description: opt.description,
    })),
  };
}

/**
 * Check if a role has any checkpoints for a phase
 */
function hasCheckpoints(role, phase) {
  return getCheckpointsForPhase(role, phase).length > 0;
}

/**
 * Get all roles that have checkpoint definitions
 */
function getRolesWithCheckpoints() {
  return Object.keys(CHECKPOINTS);
}

// ── Exports ────────────────────────────────────────────────────────

module.exports = {
  CHECKPOINTS,
  getCheckpointsForPhase,
  getCheckpoint,
  formatCheckpointQuestion,
  hasCheckpoints,
  getRolesWithCheckpoints,
};
