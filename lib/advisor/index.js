/**
 * VAIS Code - Advisor Module Entry
 * @module lib/advisor
 */

const { callAdvisor } = require('./wrapper');
const { buildAdvisorPrompt, TRIGGER_TEMPLATES } = require('./prompt-builder');

module.exports = { callAdvisor, buildAdvisorPrompt, TRIGGER_TEMPLATES };
