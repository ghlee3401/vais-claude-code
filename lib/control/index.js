/**
 * VAIS Code - Control Module Barrel Export
 * @module lib/control
 */
module.exports = {
  ...require('./automation-controller'),
  ...require('./checkpoint-manager'),
  ...require('./loop-breaker'),
  ...require('./blast-radius'),
  ...require('./trust-engine'),
};
