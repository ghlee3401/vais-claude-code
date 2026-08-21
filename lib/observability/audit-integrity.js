'use strict';

const crypto = require('crypto');

function canonicalize(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('audit values must contain only finite numbers');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalize).join(',') + ']';
  }
  if (value && typeof value === 'object') {
    const entries = Object.keys(value)
      .sort()
      .map(key => JSON.stringify(key) + ':' + canonicalize(value[key]));
    return '{' + entries.join(',') + '}';
  }
  throw new TypeError('audit values must be JSON serializable');
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function hashableEvent(event) {
  const copy = cloneJson(event);
  if (!copy.integrity || typeof copy.integrity !== 'object') {
    throw new TypeError('audit event integrity is required');
  }
  delete copy.integrity.eventHash;
  return copy;
}

function computeAuditEventHash(event) {
  return crypto.createHash('sha256').update(canonicalize(hashableEvent(event)), 'utf8').digest('hex');
}

function sealAuditChain(events) {
  let previousEventHash = null;
  return events.map(event => {
    const sealed = cloneJson(event);
    sealed.integrity = {
      ...sealed.integrity,
      algorithm: 'sha256',
      previousEventHash,
    };
    sealed.integrity.eventHash = computeAuditEventHash(sealed);
    previousEventHash = sealed.integrity.eventHash;
    return sealed;
  });
}

function validateAuditChain(events) {
  const errors = [];
  let previousEventHash = null;
  if (!Array.isArray(events)) return { valid: false, errors: ['events must be an array'] };

  events.forEach((event, index) => {
    const location = 'events[' + index + ']';
    if (event?.sequence !== index) errors.push(location + '.sequence must equal ' + index);
    if (event?.integrity?.algorithm !== 'sha256') errors.push(location + '.integrity.algorithm must be sha256');
    if (event?.integrity?.previousEventHash !== previousEventHash) {
      errors.push(location + '.integrity.previousEventHash does not match the preceding event');
    }
    try {
      const computed = computeAuditEventHash(event);
      if (event?.integrity?.eventHash !== computed) {
        errors.push(location + '.integrity.eventHash does not match canonical event content');
      }
    } catch (error) {
      errors.push(location + ': ' + error.message);
    }
    previousEventHash = event?.integrity?.eventHash ?? null;
  });

  return { valid: errors.length === 0, errors };
}

module.exports = { canonicalize, computeAuditEventHash, sealAuditChain, validateAuditChain };
