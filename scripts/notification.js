#!/usr/bin/env node
/**
 * VAIS Code - Notification Handler
 * 백그라운드 작업 완료 알림 처리
 *
 * [확장 포인트] 현재는 로깅만 수행합니다.
 * 향후 Slack/Discord 알림, 데스크탑 알림 등으로 확장할 수 있습니다.
 */
const { readStdin, outputAllow } = require('../lib/io');
const { debugLog } = require('../lib/debug');

const input = readStdin();
debugLog('Notification', 'Received', { type: input?.type || 'unknown' });

outputAllow();
process.exit(0);
