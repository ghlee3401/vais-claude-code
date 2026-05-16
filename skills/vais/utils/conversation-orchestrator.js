'use strict';

/**
 * Conversation Orchestrator — v2 대화-합성 모델 핵심.
 *
 * v2 design `main.md` §3 + §4 박제.
 * Lazy Consensus 5-state FSM: draft → review-window → (consensus-reached | objection-raised → revision → review-window) → consensus-reached (or timeout)
 *
 * **주의**: 본 모듈은 실제 SendMessage 도구 호출 wrapper. Claude Code 외부에서는 dryRun 모드로만 동작.
 * Hook 또는 skill phase 진입 시 호출.
 */

const STATES = Object.freeze({
  DRAFT: 'draft',
  REVIEW_WINDOW: 'review-window',
  OBJECTION_RAISED: 'objection-raised',
  REVISION: 'revision',
  CONSENSUS_REACHED: 'consensus-reached',
  TIMEOUT: 'timeout',
});

const EVENT_TYPES = Object.freeze({
  PROPOSE: '제기',
  OBJECT: '반박',
  AGREE: '합의',
  PIVOT: 'pivot',
  TIMEOUT: 'timeout',
});

/**
 * 단일 phase 대화 세션.
 *
 * @param {object} opts
 * @param {string} opts.feature
 * @param {string} opts.phase
 * @param {string} opts.synthesizer - 도메인 리드 c-level
 * @param {string[]} opts.participants - 다른 C-Level 목록
 * @param {number} [opts.consensusTurns=2]
 * @param {number} [opts.turnTimeoutMs=60000]
 * @param {boolean} [opts.dryRun=false] - 실제 SendMessage 없이 시뮬레이션
 * @param {function} [opts.sendMessageFn] - 외부 주입 SendMessage 함수 (test 용)
 */
class ConversationSession {
  constructor(opts) {
    if (!opts || !opts.feature || !opts.phase || !opts.synthesizer) {
      throw new Error('ConversationSession requires feature, phase, synthesizer');
    }
    this.feature = opts.feature;
    this.phase = opts.phase;
    this.synthesizer = opts.synthesizer;
    this.participants = opts.participants || [];
    this.consensusTurns = opts.consensusTurns ?? 2;
    this.turnTimeoutMs = opts.turnTimeoutMs ?? 60000;
    this.dryRun = !!opts.dryRun;
    this.sendMessageFn = opts.sendMessageFn || null;
    this.state = STATES.DRAFT;
    this.events = [];
    this.draft = null;
    this.objections = [];
    this.roundCount = 0;
  }

  /**
   * 상태 전이 헬퍼 (FSM 검증).
   */
  _transition(toState, reason) {
    const allowed = {
      [STATES.DRAFT]: [STATES.REVIEW_WINDOW],
      [STATES.REVIEW_WINDOW]: [STATES.CONSENSUS_REACHED, STATES.OBJECTION_RAISED, STATES.TIMEOUT],
      [STATES.OBJECTION_RAISED]: [STATES.REVISION],
      [STATES.REVISION]: [STATES.REVIEW_WINDOW],
      [STATES.CONSENSUS_REACHED]: [],
      [STATES.TIMEOUT]: [STATES.CONSENSUS_REACHED],
    };
    if (!allowed[this.state]?.includes(toState)) {
      throw new Error(
        `Invalid state transition: ${this.state} → ${toState} (reason: ${reason})`
      );
    }
    this.state = toState;
  }

  /**
   * decisions-log event 박제.
   */
  log(eventType, actor, topic, refObj = {}) {
    this.events.push({
      time: new Date().toISOString(),
      actor,
      eventType,
      topic,
      ref: (typeof refObj === 'string' ? refObj : JSON.stringify(refObj)).slice(0, 200),
    });
  }

  /**
   * Synthesizer 가 draft 작성. 실제 호출자가 draft 텍스트 제공.
   */
  setDraft(draftContent, version = 1) {
    this.draft = draftContent;
    this.log(EVENT_TYPES.PROPOSE, this.synthesizer, `draft v${version}`, {
      length: typeof draftContent === 'string' ? draftContent.length : 0,
    });
  }

  /**
   * Review window 열기. participant 들에게 SendMessage (또는 dryRun).
   * @returns {Promise<Array<{ actor, eventType, topic, ref }>>}
   */
  async openReviewWindow() {
    this._transition(STATES.REVIEW_WINDOW, 'openReviewWindow');
    const responses = [];
    for (const p of this.participants) {
      const r = await this._sendReviewRequest(p);
      responses.push(r);
      this.log(r.eventType, r.actor, r.topic, r.ref || {});
    }
    return responses;
  }

  async _sendReviewRequest(participantClevel) {
    if (this.dryRun) {
      // dryRun = no SendMessage, 항상 합의 응답
      return {
        actor: participantClevel,
        eventType: EVENT_TYPES.AGREE,
        topic: `[dryRun] auto-agree on draft v${this.roundCount + 1}`,
      };
    }
    if (!this.sendMessageFn) {
      throw new Error('sendMessageFn required when dryRun=false');
    }
    const promptText = `Review draft for ${this.feature}/${this.phase}. window N=${this.consensusTurns}. 이의 있으면 '반박'+topic, 없으면 '합의'.`;
    let resp;
    try {
      resp = await this.sendMessageFn({
        to: participantClevel,
        prompt: promptText,
        timeoutMs: this.turnTimeoutMs,
      });
    } catch (e) {
      // 타임아웃 등 → timeout event
      return {
        actor: participantClevel,
        eventType: EVENT_TYPES.TIMEOUT,
        topic: `SendMessage timeout/error: ${e.message.slice(0, 100)}`,
      };
    }
    return this._parseResponse(participantClevel, resp);
  }

  _parseResponse(actor, resp) {
    // 단순 휴리스틱 — "반박" 키워드 포함 시 OBJECT, 아니면 AGREE
    const text = typeof resp === 'string' ? resp : resp?.text || '';
    if (/반박|이의|object/i.test(text)) {
      return { actor, eventType: EVENT_TYPES.OBJECT, topic: text.slice(0, 200), ref: { raw: text } };
    }
    return { actor, eventType: EVENT_TYPES.AGREE, topic: text.slice(0, 200), ref: { raw: text } };
  }

  /**
   * Synthesizer 가 objections 받아 draft 수정. 실제 호출자가 revised 텍스트 제공.
   */
  reviseDraft(revisedContent) {
    this._transition(STATES.OBJECTION_RAISED, 'reviseDraft.intent');
    this._transition(STATES.REVISION, 'reviseDraft');
    this.roundCount += 1;
    this.draft = revisedContent;
    this.log(EVENT_TYPES.PROPOSE, this.synthesizer, `draft v${this.roundCount + 1}`, {
      revised: true,
      length: revisedContent?.length || 0,
    });
  }

  /**
   * 전체 conversation 진행. 호출자가 draftFn / reviseFn 제공.
   *
   * @param {object} fns
   * @param {function} fns.draftFn - async () → draftContent
   * @param {function} fns.reviseFn - async (objections) → revisedContent
   * @returns {Promise<{ state, draft, events }>}
   */
  async run(fns) {
    if (!fns?.draftFn) throw new Error('draftFn required');

    // 1. draft v1
    const initialDraft = await fns.draftFn();
    this.setDraft(initialDraft, 1);

    // 2. review window 라운드 반복 (최대 consensusTurns + 1)
    for (let round = 1; round <= this.consensusTurns + 1; round++) {
      const responses = await this.openReviewWindow();
      this.objections = responses.filter((r) => r.eventType === EVENT_TYPES.OBJECT);

      if (this.objections.length === 0) {
        this._transition(STATES.CONSENSUS_REACHED, `Lazy Consensus round ${round}`);
        this.log(EVENT_TYPES.AGREE, '*', `Lazy Consensus (round ${round})`, {});
        break;
      }

      // 이의 있음 → revise (마지막 라운드 초과 시 timeout)
      if (round > this.consensusTurns) {
        // forced synthesis (timeout)
        this._transition(STATES.TIMEOUT, 'maxTurns exceeded');
        this._transition(STATES.CONSENSUS_REACHED, 'forced after timeout');
        this.log(EVENT_TYPES.TIMEOUT, this.synthesizer, 'Forced synthesis after max turns', {
          unresolvedObjections: this.objections,
        });
        break;
      }

      if (!fns.reviseFn) {
        // reviseFn 없으면 자동 timeout
        this._transition(STATES.TIMEOUT, 'no reviseFn');
        this._transition(STATES.CONSENSUS_REACHED, 'forced (no revise)');
        this.log(EVENT_TYPES.TIMEOUT, this.synthesizer, 'No reviseFn — forced synthesis', {
          unresolvedObjections: this.objections,
        });
        break;
      }

      const revised = await fns.reviseFn(this.objections);
      this.reviseDraft(revised);
    }

    return {
      state: this.state,
      draft: this.draft,
      events: this.events,
      roundCount: this.roundCount,
    };
  }
}

module.exports = {
  STATES,
  EVENT_TYPES,
  ConversationSession,
};
