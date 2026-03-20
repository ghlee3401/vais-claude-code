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

  it('유효한 URL 설정 시 HTTP POST 전송', async () => {
    // 테스트용 HTTP 서버
    const received = [];
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        received.push({
          method: req.method,
          contentType: req.headers['content-type'],
          body: JSON.parse(body),
        });
        res.writeHead(200);
        res.end('ok');
      });
    });

    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;

    process.env.VAIS_WEBHOOK_URL = `http://127.0.0.1:${port}/webhook`;
    const { sendWebhook } = loadWebhook();

    sendWebhook('phase_complete', { feature: 'login', phase: 'plan' });

    // 전송 대기
    await new Promise(resolve => setTimeout(resolve, 500));

    assert.equal(received.length, 1);
    assert.equal(received[0].method, 'POST');
    assert.equal(received[0].contentType, 'application/json');
    assert.equal(received[0].body.event, 'phase_complete');
    assert.equal(received[0].body.feature, 'login');
    assert.equal(received[0].body.phase, 'plan');
    assert.ok(received[0].body.timestamp);

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
