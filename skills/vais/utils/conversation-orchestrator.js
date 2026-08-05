'use strict';

/**
 * Conversation Orchestrator — v2 대화-합성 모델 핵심.
 *
 * v2 design `main.md` §3 + §4 박제.
 * Lazy Consensus 5-state FSM: draft → review-window → (consensus-reached | objection-raised → revision → review-window) → consensus-reached (or timeout)
 *
 * **주의**: 본 모듈은 실제 SendMessage 도구 호출 wrapper. Claude Code 외부에서는 simulation 모드로만 동작.
 * Hook 또는 skill phase 진입 시 호출.
 *
 * SimulationMode / real 분기 + T1~T3 security mitigation 지원.
 */

const crypto = require('crypto');

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

// [T1] SendMessage body 에서 시크릿 패턴 검출용 regex — security-gate-plan §3 AC-CSO-1
const SECRET_PATTERNS = [
  /(password|passwd)\s*[:=]\s*["'][^"']{8,}/i,
  /secret\s*[:=]\s*["'][^"']{8,}/i,
  /api[_-]?key\s*[:=]\s*["'][^"']{8,}/i,
  /token\s*[:=]\s*["'][^"']{8,}/i,
];

/**
 * SHA-256 해시 (real 모드 messageHash 용).
 * @param {string} text
 * @returns {string}
 */
function _sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

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
 * @param {boolean} [opts.dryRun=false] - (legacy) 하위 호환 — 내부적으로 simulationMode 로 매핑
 * @param {boolean} [opts.simulationMode=true] - true = 0.68.0 byte-compat simulation, false = real SendMessage
 * @param {'main'|'c-level'|'sub-agent'} [opts.callerContext='main'] - T3 분기용
 * @param {string[]} [opts.parallelGroup=[]] - T2 화이트리스트 구성용
 * @param {function} [opts.sendMessageFn] - 외부 주입 SendMessage 함수 (test / real 모드)
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

    // dryRun (legacy) → simulationMode 매핑. opts.simulationMode 명시 시 우선
    if (opts.simulationMode !== undefined) {
      this.simulationMode = !!opts.simulationMode;
    } else if (opts.dryRun !== undefined) {
      this.simulationMode = !!opts.dryRun;
    } else {
      this.simulationMode = true; // 기본값: 안전
    }
    // 하위 호환 — dryRun 필드도 유지
    this.dryRun = this.simulationMode;

    this.mode = this.simulationMode ? 'simulated' : 'real';

    // [T3] caller context — sub-agent 발신 차단용
    this.callerContext = opts.callerContext || 'main';

    // [T2] 화이트리스트 구성 — parallelGroup + participants + 'main' + synthesizer
    this.parallelGroup = opts.parallelGroup || [];
    this.allowedActors = Array.from(new Set([
      ...this.parallelGroup,
      ...this.participants,
      'main',
      this.synthesizer,
    ]));

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
   * @param {string} eventType
   * @param {string} actor
   * @param {string} topic
   * @param {object|string} [refObj={}]
   * @param {string} [mode] - 'real' | 'simulated'
   * @param {string|null} [messageHash] - SHA-256 (real 만), simulated = null
   */
  log(eventType, actor, topic, refObj = {}, mode = this.mode, messageHash = null) {
    this.events.push({
      time: new Date().toISOString(),
      actor,
      eventType,
      topic,
      ref: (typeof refObj === 'string' ? refObj : JSON.stringify(refObj)).slice(0, 200),
      mode,
      messageHash,
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
   * Review window 열기. participant 들에게 SendMessage (또는 simulation).
   * @returns {Promise<Array<{ actor, eventType, topic, ref, mode, messageHash }>>}
   */
  async openReviewWindow() {
    this._transition(STATES.REVIEW_WINDOW, 'openReviewWindow');
    const responses = [];
    for (const p of this.participants) {
      const r = await this._sendReviewRequest(p);
      responses.push(r);
      this.log(r.eventType, r.actor, r.topic, r.ref || {}, r.mode, r.messageHash || null);
    }
    return responses;
  }

  /**
   * [T3] main→sub 일방향 정책. sub-agent 호출 시 throw.
   * 보안 위협: sub-agent 가 SendMessage 를 통해 prompt injection 전달 가능.
   */
  _enforceMainSubDirectionality(targetActor) {
    if (this.callerContext === 'sub-agent') {
      const msg =
        `[T3] SendMessage blocked: sub-agent caller is not allowed to send messages. ` +
        `caller=${this.callerContext}, target=${targetActor}, feature=${this.feature}`;
      process.stderr.write('[VAIS] ⚠️  ' + msg + '\n');
      this.log('security-block', 'system', msg, {}, this.mode, null);
      throw new Error(msg);
    }
  }

  /**
   * [T2] actor 화이트리스트 검증. unknown → drop (silent + warn).
   * 보안 위협: agent ID 위조로 의사결정 라우팅 교란.
   * @returns {boolean} true = 허용, false = drop
   */
  _validateActor(actor) {
    if (!this.allowedActors.includes(actor)) {
      const msg =
        `[T2] Unknown actor '${actor}' — message dropped. ` +
        `allowed=${JSON.stringify(this.allowedActors)}, feature=${this.feature}`;
      process.stderr.write('[VAIS] ⚠️  ' + msg + '\n');
      this.log('security-block', 'system', msg, {}, this.mode, null);
      // throw 하지 않고 drop — ID 위조 시 파이프라인 전체 중단 방지
      return false;
    }
    return true;
  }

  /**
   * [T1] SendMessage body 시크릿 grep. hit → throw.
   * 보안 위협: SendMessage body 에 민감 정보(API 키, 토큰 등) 포함 가능.
   */
  _scanSecrets(text) {
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(text)) {
        const msg =
          `[T1] Secret pattern detected in SendMessage body — send blocked. ` +
          `pattern=${pattern.source.slice(0, 50)}, feature=${this.feature}`;
        process.stderr.write('[VAIS] ⚠️  ' + msg + '\n');
        this.log('security-block', 'system', msg, {}, this.mode, null);
        throw new Error(msg);
      }
    }
  }

  /** review prompt 구성. */
  _buildReviewPrompt() {
    return `Review draft for ${this.feature}/${this.phase}. window N=${this.consensusTurns}. 이의 있으면 '반박'+topic, 없으면 '합의'.`;
  }

  async _sendReviewRequest(participantClevel) {
    // simulated 모드: 0.68.0 byte-compat — 보안 함수 호출 없이 그대로
    if (this.simulationMode) {
      return {
        actor: participantClevel,
        eventType: EVENT_TYPES.AGREE,
        topic: `[simulated] auto-agree on draft v${this.roundCount + 1}`,
        mode: 'simulated',
        messageHash: null,
      };
    }

    // real 모드 — T3 → T2 → T1 → SendMessage 순서
    // [T3] 최우선 — sub-agent caller 차단
    this._enforceMainSubDirectionality(participantClevel);

    // [T2] actor 화이트리스트
    if (!this._validateActor(participantClevel)) {
      // drop — undefined 반환 시 openReviewWindow 에서 null 포함되므로 빈 agree 로 대체
      return {
        actor: participantClevel,
        eventType: EVENT_TYPES.AGREE,
        topic: `[T2-drop] unknown actor dropped`,
        mode: 'real',
        messageHash: null,
      };
    }

    if (!this.sendMessageFn) {
      throw new Error('sendMessageFn required in real mode (simulationMode=false)');
    }

    // [T1] 시크릿 grep — 송신 직전
    const promptText = this._buildReviewPrompt();
    this._scanSecrets(promptText);

    let resp;
    try {
      resp = await this.sendMessageFn({
        to: participantClevel,
        prompt: promptText,
        timeoutMs: this.turnTimeoutMs,
      });
    } catch (e) {
      return {
        actor: participantClevel,
        eventType: EVENT_TYPES.TIMEOUT,
        topic: `SendMessage timeout/error: ${e.message.slice(0, 100)}`,
        mode: 'real',
        messageHash: null,
      };
    }

    const hash = _sha256(JSON.stringify(resp));
    return {
      ...this._parseResponse(participantClevel, resp),
      mode: 'real',
      messageHash: hash,
    };
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
