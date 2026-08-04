// Design Ref: §2.1 — lib/observability/ barrel export
const { StateWriter } = require('./state-writer');
const { EventLogger } = require('./event-logger');
const { EVENT_TYPES, EVENT_SCHEMAS, validatePayload } = require('./schema');
const { shouldRotate, rotate } = require('./rotation');

module.exports = { StateWriter, EventLogger, EVENT_TYPES, EVENT_SCHEMAS, validatePayload, shouldRotate, rotate };
