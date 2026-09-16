'use strict';

const MANAGED_PREFIX = /^\s*\/vais(?:\s+|$)/i;
const EXPLICIT_APPROVAL = /^(?:(?:(?:plan|design)(?:\s+(?:rev(?:ision)?\.?\s*\d+|v\d+|개정(?:본)?\s*\d+))?|최종(?:\s*결과)?)\s*(?:을|를)?\s*)?(?:승인(?:할게|합니다|해|함)?|approve|approved|confirm)\s*[.!?]?$/i;
const APPROVAL_CLAIM_START = /^(?:(?:(?:plan|design)(?:\s+(?:rev(?:ision)?\.?\s*\d+|v\d+|개정(?:본)?\s*\d+))?|최종(?:\s*결과)?)\s*(?:을|를)?\s*)?(?:승인(?:할게|합니다|해|함)?|approve|approved|confirm)(?:\s|[.!?]|$)/i;
const APPROVAL_PREFIX = /^(?:(?:(?:plan|design)(?:\s+(?:rev(?:ision)?\.?\s*\d+|v\d+|개정(?:본)?\s*\d+))?|최종(?:\s*결과)?)\s*(?:을|를)?\s*)?(?:승인(?:할게|합니다|해|함)?|approve|approved|confirm)(?:\s*[.!?]\s*([\s\S]+)|\s*[.!?]?)$/i;
// The only trailing clause an approval may carry is a plain "go ahead". Every other
// sentence after an approval makes it ambiguous and therefore invalid.
const SAFE_APPROVAL_SUFFIXES = Object.freeze([
  /^(?:(?:이\s*승인\s*(?:뒤|후)(?:에는)?|이제)\s*)?(?:(?:do|구현|다음\s*(?:단계|phase))\s*(?:을|를|으로)?\s*)?진행(?:해|해줘|합니다|하세요|하자|해주세요)$/i,
]);
const NAME_FEATURE = /^(?:이름|name)\s*[:：]\s*([A-Za-z0-9][A-Za-z0-9-]{1,47})\s*$/i;
const EXPLICIT_FINAL_REJECTION = /^(?:(?:최종(?:\s*결과)?|최종\s*승인)\s*(?:을|를)?\s*)?(?:승인하지\s*않(?:아|습니다|을게)|거절(?:할게|합니다|해|함)?|reject|rejected)(?:\s*[.!?](?:\s+[\s\S]*)?)?$/i;
const RESUME_INTENT = /^(?:(?:작업|work(?:\s+item)?)\s*(?:을|를)?\s*)?(?:resume|재개)(?:\s*(?:하고|해서|해|합니다|할게)|\s|$)/i;
const AMBIGUOUS_POSITIVE = /^(?:좋아|좋네|괜찮네|오케이|ok|okay|그래)(?:\s*[.!])?$/i;
const EXPLICIT_PENDING_REQUEST = /^(?:새(?:로운)?|다음|별도)\s*(?:작업|기능|요청)(?:으로|은|을|를|:)?\s+|^(?:(?:완전히|전혀)\s+)?다른\s+.+(?:기능|작업|요청)(?:을|를|으로|은|는|:|\s)|^(?:new|next|separate|completely\s+different)\s+(?:task|feature|request)(?:\s*:\s*|\s+)/i;
const DISQUALIFYING_APPROVAL = /(?:조건부|조건이\s*있|조건에\s*따라|경우에만|전제로|만약|(?:단|다만)\s*[,，:]?|승인하지\s*않|승인(?:하는\s*것은|한\s*것은)?\s*아니|승인\s*(?:아님|취소|철회)|대리\s*승인|승인(?:해\s*)?달라고|승인한다고\s*(?:말|전달)|(?:사용자|고객|팀|ceo|cto|cpo|cso|cbo|coo)(?:을|를)?\s*대신(?:해서)?|대신(?:해서)?\s*(?:말|승인)|실제로는\s*(?:반대|거절)|(?:하지만|그러나)[^.?!]*(?:반대|거절)|\b(?:conditional(?:ly)?|if|unless|do\s+not\s+approve|not\s+approved|withdraw\s+(?:my\s+)?approval|on\s+behalf\s+of)\b|(?:사용자|고객|팀|ceo|cto|cpo|cso|cbo|coo)(?:가|이|께서)[^.?!\n]{0,40}승인|\b(?:user|customer|team|ceo|cto|cpo|cso|cbo|coo)\s+(?:has\s+)?approved\b)/i;

function isManagedPrompt(prompt) {
  return MANAGED_PREFIX.test(String(prompt || ''));
}

function stripManagedPrefix(prompt) {
  return String(prompt || '').replace(MANAGED_PREFIX, '').trim();
}

function isExplicitApproval(text) {
  const value = String(text || '').trim();
  if (EXPLICIT_APPROVAL.test(value)) return true;
  const match = value.match(APPROVAL_PREFIX);
  if (!match?.[1]) return false;
  const clauses = match[1].split(/[.!?]+(?:\s+|$)/).map(clause => clause.trim()).filter(Boolean);
  return clauses.length > 0 && clauses.every(clause => SAFE_APPROVAL_SUFFIXES.some(pattern => pattern.test(clause)));
}

function approvalTarget(text) {
  const match = String(text || '').trim().match(/^((?:plan|design)(?:\s+(?:rev(?:ision)?\.?\s*\d+|v\d+|개정(?:본)?\s*\d+))?|최종(?:\s*결과)?)\s*(?:을|를)?\s*/i);
  if (!match) return null;
  const value = match[1].toLowerCase();
  if (value.startsWith('최종')) return 'review';
  if (value.startsWith('design')) return 'design';
  return 'plan';
}

function approvalRevision(text) {
  const match = String(text || '').trim().match(/^(?:plan|design)\s+(?:rev(?:ision)?\.?\s*(\d+)|v(\d+)|개정(?:본)?\s*(\d+))/i);
  return match ? Number(match[1] || match[2] || match[3]) : null;
}

function routePrompt(prompt, currentWorkItem) {
  const managed = isManagedPrompt(prompt);
  const text = managed ? stripManagedPrefix(prompt) : String(prompt || '').trim();
  if (!managed) {
    return {
      managed: false,
      action: currentWorkItem ? 'unmanaged-active-work' : 'unmanaged',
      mutationAllowed: false,
      text,
    };
  }

  const normalized = text.toLowerCase();
  if (/^(status|상태)(?:\s|$)/i.test(text)) {
    return { managed: true, action: 'status', mutationAllowed: false, text };
  }
  if (/^(help|도움말)(?:\s|$)/i.test(text)) {
    return { managed: true, action: 'help', mutationAllowed: false, text };
  }
  if (/^doctor(?:\s|$)/i.test(text)) {
    return { managed: true, action: 'doctor', mutationAllowed: false, text };
  }
  if (!currentWorkItem) {
    const named = text.match(NAME_FEATURE);
    if (named) return { managed: true, action: 'name-feature', mutationAllowed: true, text, slug: named[1].toLowerCase() };
  }
  if (/^(pause|일시정지)(?:\s|$)/i.test(text)) {
    return { managed: true, action: 'pause', mutationAllowed: true, text };
  }
  if (RESUME_INTENT.test(text)) {
    return { managed: true, action: 'resume', mutationAllowed: true, text };
  }
  if (/^(cancel|취소)(?:\s|$)/i.test(text)) {
    return { managed: true, action: 'cancel', mutationAllowed: true, text };
  }
  if (/^(?:ceo|cpo|cto|cso|cbo|coo)(?:\s|$)/i.test(normalized)) {
    return { managed: true, action: 'legacy-alias', mutationAllowed: true, text };
  }
  if (currentWorkItem?.phase === 'review' && currentWorkItem.status === 'waiting-user' &&
    EXPLICIT_FINAL_REJECTION.test(text)) {
    return { managed: true, action: 'reject-final', mutationAllowed: true, text };
  }
  if (/승인|approv|confirm/i.test(text) && DISQUALIFYING_APPROVAL.test(text)) {
    return { managed: true, action: 'invalid-approval', mutationAllowed: false, text };
  }
  if (APPROVAL_CLAIM_START.test(text)) {
    if (!isExplicitApproval(text)) {
      return { managed: true, action: 'invalid-approval', mutationAllowed: false, text };
    }
    if (!currentWorkItem || currentWorkItem.status !== 'waiting-user') {
      return { managed: true, action: 'approval-without-gate', mutationAllowed: false, text };
    }
    const actions = {
      plan: 'approve-plan',
      design: 'approve-design',
      review: 'approve-final',
    };
    const target = approvalTarget(text);
    if (target && target !== currentWorkItem.phase) {
      return { managed: true, action: 'approval-target-mismatch', mutationAllowed: false, text, target };
    }
    const revision = approvalRevision(text);
    const currentRevision = currentWorkItem.phase === 'plan' ? currentWorkItem.planRevision :
      currentWorkItem.phase === 'design' ? currentWorkItem.designRevision : null;
    if (revision !== null && Number.isInteger(currentRevision) && revision !== currentRevision) {
      return { managed: true, action: 'approval-revision-mismatch', mutationAllowed: false, text, revision };
    }
    const action = actions[currentWorkItem.phase];
    return {
      managed: true,
      action: action || 'approval-without-gate',
      mutationAllowed: Boolean(action),
      text,
    };
  }
  if (currentWorkItem?.status === 'waiting-user' && AMBIGUOUS_POSITIVE.test(text)) {
    return { managed: true, action: 'ambiguous-response', mutationAllowed: false, text };
  }
  if (!currentWorkItem) {
    return { managed: true, action: 'start-request', mutationAllowed: true, text };
  }
  if (currentWorkItem.status === 'paused') {
    return { managed: true, action: 'paused-awaiting-resume', mutationAllowed: false, text };
  }
  if (EXPLICIT_PENDING_REQUEST.test(text)) {
    return { managed: true, action: 'queue-pending', mutationAllowed: true, text };
  }
  if (currentWorkItem?.status === 'waiting-user') {
    const action = { plan: 'revise-plan', design: 'revise-design', review: 'clarify-final' }[currentWorkItem.phase];
    if (action) return { managed: true, action, mutationAllowed: action !== 'clarify-final', text };
  }
  return { managed: true, action: 'continue-work', mutationAllowed: true, text };
}

module.exports = {
  MANAGED_PREFIX,
  NAME_FEATURE,
  SAFE_APPROVAL_SUFFIXES,
  AMBIGUOUS_POSITIVE,
  EXPLICIT_PENDING_REQUEST,
  EXPLICIT_FINAL_REJECTION,
  DISQUALIFYING_APPROVAL,
  RESUME_INTENT,
  isManagedPrompt,
  stripManagedPrefix,
  isExplicitApproval,
  approvalTarget,
  approvalRevision,
  routePrompt,
};
