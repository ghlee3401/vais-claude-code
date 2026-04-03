#!/usr/bin/env node
/**
 * VAIS Code - lib/webhook.js 유닛 테스트
 */
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

let originalEnv;

beforeEach(() => {
  originalEnv = process.env.VAIS_WEBHOOK_URL;
  // 캐시 클리어
  Object.keys(require.cache).forEach(key => {
    if (key.includes('lib/webhook') || key.includes('lib/debug')) {
      delete require.cache[key];
    }
  });
});

afterEach(() => {
  if (originalEnv !== undefined) {
    process.env.VAIS_WEBHOOK_URL = originalEnv;
  } else {
    delete process.env.VAIS_WEBHOOK_URL;
  }
});

function loadWebhook() {
  Object.keys(require.cache).forEach(key => {
    if (key.includes('lib/webhook') || key.includes('lib/debug')) {
      delete require.cache[key];
    }
  });
  return require('../lib/webhook');
}

describe('webhook - sendWebhook', () => {
  it('VAIS_WEBHOOK_URL 미설정 시 아무 동작 안함', () => {
    delete process.env.VAIS_WEBHOOK_URL;
    const { sendWebhook } = loadWebhook();
    // 에러 없이 조용히 리턴
    sendWebhook('test_event', { foo: 'bar' });
  });

  it('사설 IP URL은 요청을 보내지 않는다 (SSRF 방지)', async () => {
    // 127.0.0.1은 isPrivateHost()에 의해 차단되므로 서버에 요청이 도달하지 않아야 함
    const received = [];
    const server = http.createServer((req, res) => {
      received.push(req.method);
      res.end();
    });

    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;

    process.env.VAIS_WEBHOOK_URL = `http://127.0.0.1:${port}/webhook`;
    const { sendWebhook } = loadWebhook();

    sendWebhook('phase_complete', { feature: 'login', phase: 'plan' });

    // 충분한 대기 후에도 요청이 오지 않아야 함
    await new Promise(resolve => setTimeout(resolve, 200));

    assert.equal(received.length, 0, '사설 IP로 요청이 전송되면 안 됨');

    server.close();
  });

  it('서버 응답 없어도 에러 발생 안함', () => {
    process.env.VAIS_WEBHOOK_URL = 'http://127.0.0.1:1/nonexistent';
    const { sendWebhook } = loadWebhook();
    // fire-and-forget이므로 에러 없이 리턴
    sendWebhook('test_event', { foo: 'bar' });
  });

  it('잘못된 URL이어도 에러 발생 안함', () => {
    process.env.VAIS_WEBHOOK_URL = 'not-a-valid-url';
    const { sendWebhook } = loadWebhook();
    sendWebhook('test_event', { foo: 'bar' });
  });
});
