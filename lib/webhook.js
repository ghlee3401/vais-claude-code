/**
 * VAIS Code - Webhook Utility
 * 모든 훅 스크립트에서 공용으로 사용하는 HTTP 웹훅 전송
 *
 * 활성화 조건: 환경변수 VAIS_WEBHOOK_URL이 설정되어 있을 때만 동작
 * 예: export VAIS_WEBHOOK_URL=https://hooks.slack.com/services/T.../B.../...
 *
 * 실패해도 워크플로우를 차단하지 않음 (fire-and-forget)
 */
const { debugLog } = require('./debug');

const WEBHOOK_TIMEOUT = 5000;

/**
 * 웹훅 전송 (fire-and-forget)
 * @param {string} event - 이벤트명 (phase_complete, session_start, gap_analysis, review_complete, workflow_hint)
 * @param {object} data - 이벤트 데이터
 */
function sendWebhook(event, data) {
  const webhookUrl = process.env.VAIS_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const http = require(webhookUrl.startsWith('https') ? 'https' : 'http');
    const payload = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      ...data,
    });

    const url = new URL(webhookUrl);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: WEBHOOK_TIMEOUT,
      },
      (res) => {
        // 응답 소비 (메모리 누수 방지)
        res.resume();
      }
    );

    req.on('error', (err) => {
      debugLog('Webhook', `${event} failed (non-critical)`, { error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      debugLog('Webhook', `${event} timed out`, { url: webhookUrl });
    });

    req.write(payload);
    req.end();
  } catch (err) {
    debugLog('Webhook', `${event} error (non-critical)`, { error: err.message });
  }
}

module.exports = { sendWebhook };
