const fs = require('fs');
const path = require('path');
const { atomicWriteSync } = require('../fs-utils');

// Design Ref: §2.1 — StateWriter는 단일 책임: .vais/agent-state.json 관리만
class StateWriter {
  constructor(stateFilePath) {
    this.stateFilePath = stateFilePath;
    this._ensureDir();
  }

  _ensureDir() {
    const dir = path.dirname(this.stateFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  _load() {
    if (!fs.existsSync(this.stateFilePath)) {
      return this._defaultState();
    }
    try {
      return JSON.parse(fs.readFileSync(this.stateFilePath, 'utf8'));
    } catch {
      return this._defaultState();
    }
  }

  _save(state) {
    atomicWriteSync(this.stateFilePath, JSON.stringify(state, null, 2));
  }

  _defaultState() {
    return {
      session: new Date().toISOString(),
      feature: '',
      active_agents: [],
      completed_agents: [],
      pipeline: { current: null, queue: [], completed: [] },
    };
  }

  // Plan SC: SC-03 — 에이전트 시작 상태 기록
  markAgentStart(role, phase, taskDescription = '') {
    const state = this._load();

    // 이미 active에 있으면 업데이트
    const existing = state.active_agents.find(a => a.role === role);
    if (existing) {
      existing.phase = phase;
      existing.current_task = taskDescription;
      existing.started_at = new Date().toISOString();
    } else {
      state.active_agents.push({
        role,
        status: 'running',
        phase,
        started_at: new Date().toISOString(),
        current_task: taskDescription,
      });
    }

    this._save(state);
  }

  // Plan SC: SC-03 — 에이전트 완료/실패 상태 기록
  markAgentStop(role, outcome, outputDoc = '') {
    const state = this._load();

    state.active_agents = state.active_agents.filter(a => a.role !== role);

    if (!state.completed_agents.includes(role)) {
      state.completed_agents.push(role);
    }

    if (outputDoc) {
      state.last_output = { role, outcome, doc: outputDoc, at: new Date().toISOString() };
    }

    this._save(state);
  }

  updatePipeline(current, queue, completed) {
    const state = this._load();
    state.pipeline = { current, queue: [...queue], completed: [...completed] };
    this._save(state);
  }

  read() {
    return this._load();
  }

  // 새 세션 시작 시 상태 초기화
  reset(feature, cSuiteRoles = []) {
    const state = {
      session: new Date().toISOString(),
      feature,
      active_agents: [],
      completed_agents: [],
      pipeline: {
        current: cSuiteRoles[0] || null,
        queue: cSuiteRoles.slice(1),
        completed: [],
      },
    };
    this._save(state);
    return state;
  }
}

module.exports = { StateWriter };
