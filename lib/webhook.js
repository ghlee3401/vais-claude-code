/**
 * VAIS Code - Webhook Utility
 * 모든 훅 스크립트에서 공용으로 사용하는 HTTP 웹훅 전송
 *
 * 활성화 조건: 환경변수 VAIS_WEBHOOK_URL이 설정되어 있을 때만 동작
 * 예: export VAIS_WEBHOOK_URL=https://hooks.slack.com/services/T.../B.../...
 *
 * 1회 재시도, 실패 시 로컬 로그 기록 (워크플로우 차단하지 않음)
 */
const net = require('net');
const { debugLog } = require('./debug');

const WEBHOOK_TIMEOUT = 5000;
const MAX_RETRIES = 1;

/**
 * A10: 사설 IP 대역 차단 — SSRF 방지
 * 127.x, 10.x, 172.16-31.x, 192.168.x, 169.254.x (클라우드 메타데이터) 차단
 */
function isPrivateHost(hostname) {
  if (hostname === 'localhost' || hostname === '::1') return true;
  if (!net.isIPv4(hostname)) return false;
  const [a, b] = hostname.split('.').map(Number);
  return (
    a === 127 ||
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  );
}

/**
 * 단일 HTTP 요청 전송
 */
function doRequest(url, payload, attempt) {
  try {
    const parsedUrl = new URL(url);

    if (isPrivateHost(parsedUrl.hostname)) {
      debugLog('Webhook', 'Blocked: private/loopback target', { hostname: parsedUrl.hostname });
      return;
    }

    const http = require(parsedUrl.protocol === 'https:' ? 'https' : 'http');

    const req = http.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: WEBHOOK_TIMEOUT,
      },
      (res) => {
        res.resume();
        if (res.statusCode >= 500 && attempt < MAX_RETRIES) {
          debugLog('Webhook', `Server error ${res.statusCode}, retrying (${attempt + 1}/${MAX_RETRIES})`);
          setTimeout(() => doRequest(url, payload, attempt + 1), 1000);
        }
      }
    );

    req.on('error', (err) => {
      debugLog('Webhook', `Request failed (attempt ${attempt + 1})`, { error: err.message });
      if (attempt < MAX_RETRIES) {
        setTimeout(() => doRequest(url, payload, attempt + 1), 1000);
      }
    });

    req.on('timeout', () => {
      req.destroy();
      debugLog('Webhook', `Timed out (attempt ${attempt + 1})`, { url });
      if (attempt < MAX_RETRIES) {
        setTimeout(() => doRequest(url, payload, attempt + 1), 1000);
      }
    });

    req.write(payload);
    req.end();
  } catch (err) {
    debugLog('Webhook', `Error (attempt ${attempt + 1})`, { error: err.message });
  }
}

/**
 * 웹훅 전송 (1회 재시도, fire-and-forget)
 * @param {string} event - 이벤트명 (phase_complete, session_start, gap_analysis, review_complete, workflow_hint)
 * @param {object} data - 이벤트 데이터
 */
function sendWebhook(event, data) {
  const webhookUrl = process.env.VAIS_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    // URL 유효성 사전 검증
    new URL(webhookUrl);
  } catch (e) {
    debugLog('Webhook', 'Invalid webhook URL', { url: webhookUrl, error: e.message });
    return;
  }

  const payload = JSON.stringify({
    ...data,
    event,
    timestamp: new Date().toISOString(),
  });

  doRequest(webhookUrl, payload, 0);
}

module.exports = { sendWebhook };
