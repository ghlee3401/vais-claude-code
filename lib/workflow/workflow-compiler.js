'use strict';

const PHASES = ['ideation', 'plan', 'design', 'do', 'qa', 'report'];
const PROFILES = ['patch', 'feature', 'initiative'];
const COMPILE_SIGNAL_KEYS = [
  'uiFlow',
  'apiContract',
  'dataModel',
  'architecture',
  'externalIntegration',
  'publicContract',
  'multiArea',
  'highUncertainty',
  'newProduct',
  'ceoAnalysisAvailable',
];
const DESIGN_SIGNALS = ['uiFlow', 'apiContract', 'dataModel', 'architecture', 'externalIntegration'];

function normalizeCompileSignals(signals = {}) {
  return Object.fromEntries(COMPILE_SIGNAL_KEYS.map(key => [key, signals[key] === true]));
}

function selectProfile(recommended, rawSignals = {}) {
  const signals = normalizeCompileSignals(rawSignals);
  const normalized = PROFILES.includes(recommended) ? recommended : 'unknown';

  if (normalized === 'unknown') {
    return { recommended: normalized, selected: 'initiative', promoted: true, reason: 'unknown-conservative-promotion' };
  }

  if (normalized === 'patch') {
    if (signals.newProduct || signals.multiArea || signals.highUncertainty) {
      return { recommended: normalized, selected: 'initiative', promoted: true, reason: 'initiative-scope-signal' };
    }
    if (signals.publicContract || signals.dataModel) {
      return { recommended: normalized, selected: 'feature', promoted: true, reason: 'feature-contract-signal' };
    }
  }

  if (normalized === 'feature' && (signals.newProduct || signals.multiArea || signals.highUncertainty)) {
    return { recommended: normalized, selected: 'initiative', promoted: true, reason: 'initiative-scope-signal' };
  }

  return { recommended: normalized, selected: normalized, promoted: false, reason: 'recommendation-accepted' };
}

function compilePhaseGraph(profile, rawSignals = {}) {
  const signals = normalizeCompileSignals(rawSignals);

  if (profile === 'patch') {
    return {
      required: ['plan', 'do', 'qa'],
      optional: [],
      notRequired: ['ideation', 'design', 'report'],
    };
  }

  if (profile === 'feature') {
    const designRequired = DESIGN_SIGNALS.some(signal => signals[signal]);
    return designRequired
      ? {
        required: ['plan', 'design', 'do', 'qa'],
        optional: [],
        notRequired: ['ideation', 'report'],
      }
      : {
        required: ['plan', 'do', 'qa'],
        optional: ['design'],
        notRequired: ['ideation', 'report'],
      };
  }

  if (profile === 'initiative') {
    return signals.ceoAnalysisAvailable
      ? {
        required: ['plan', 'design', 'do', 'qa', 'report'],
        optional: ['ideation'],
        notRequired: [],
      }
      : {
        required: [...PHASES],
        optional: [],
        notRequired: [],
      };
  }

  throw new Error(`Unknown workflow profile: ${profile}`);
}

function compilePhaseStates(phaseGraph) {
  const states = {};
  for (const phase of PHASES) {
    states[phase] = phaseGraph.notRequired.includes(phase) ? 'not-required' : 'pending';
  }
  return states;
}

function toEvaluationPhaseGraph(phaseGraph) {
  return {
    required: [...phaseGraph.required],
    conditional: [...phaseGraph.optional],
    notRequired: [...phaseGraph.notRequired],
  };
}

module.exports = {
  PHASES,
  PROFILES,
  COMPILE_SIGNAL_KEYS,
  DESIGN_SIGNALS,
  normalizeCompileSignals,
  selectProfile,
  compilePhaseGraph,
  compilePhaseStates,
  toEvaluationPhaseGraph,
};
