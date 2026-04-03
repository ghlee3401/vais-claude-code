/**
 * src/example/service.js — 예시 서비스 모듈
 *
 * 비즈니스 로직을 담당합니다.
 * DB 접근은 repository.js에 위임합니다.
 */

'use strict';

const repository = require('./repository');

/**
 * 항목 생성
 * @param {{ name: string, value: number }} data
 * @returns {Promise<{ id: string, name: string, value: number, createdAt: string }>}
 */
async function create(data) {
  if (!data.name || typeof data.name !== 'string') {
    throw new Error('VALIDATION_ERROR: name은 필수 문자열입니다');
  }
  if (typeof data.value !== 'number') {
    throw new Error('VALIDATION_ERROR: value는 숫자여야 합니다');
  }

  return repository.insert(data);
}

/**
 * 항목 조회
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  if (!id) throw new Error('VALIDATION_ERROR: id는 필수입니다');
  return repository.findById(id);
}

module.exports = { create, findById };
