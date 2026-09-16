#!/usr/bin/env node
'use strict';

// Minimal static file server for tests of the app runner: `node static-server.js <dir> <port>`.

const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.resolve(process.argv[2] || '.');
const port = Number(process.argv[3]) || 4173;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml' };

http.createServer((request, response) => {
  const relative = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';
  const file = path.join(root, relative);
  if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404);
    response.end('not found');
    return;
  }
  response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1');
