/**
 * VAIS Code - Quality Module Barrel Export
 * @module lib/quality
 */
module.exports = {
  ...require('./gate-manager'),
  ...require('./template-validator'),
};
