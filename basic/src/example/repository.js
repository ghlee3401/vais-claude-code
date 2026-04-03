/**
 * src/example/repository.js — 예시 리포지토리
 *
 * DB 접근을 담당합니다. 실제 DB 드라이버/ORM으로 교체하세요.
 */

'use strict';

const { randomUUID } = require('crypto');

// 실제 프로젝트에서는 DB 연결로 교체
const store = new Map();

async function insert(data) {
  const record = {
    id: randomUUID(),
    ...data,
    createdAt: new Date().toISOString(),
  };
  store.set(record.id, record);
  return record;
}

async function findById(id) {
  return store.get(id) || null;
}

module.exports = { insert, findById };
