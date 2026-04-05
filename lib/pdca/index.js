/**
 * VAIS Code - PDCA Module Barrel Export
 * @module lib/pdca
 */
module.exports = {
  ...require('./feature-manager'),
  ...require('./automation'),
  ...require('./session-guide'),
  ...require('./decision-record'),
};
