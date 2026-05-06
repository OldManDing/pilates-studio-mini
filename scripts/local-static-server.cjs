const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.cwd(), 'dist');
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.wxml': 'application/xml; charset=utf-8',
  '.wxss': 'text/css; charset=utf-8',
  '.wxs': 'application/javascript; charset=utf-8',
};

function resolvePath(requestUrl) {
  const pathname = decodeURIComponent((requestUrl || '/').split('?')[0]);
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const candidate = path.resolve(root, `.${normalized}`);
  if (!candidate.startsWith(root)) {
    return null;
  }
  return candidate;
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = types[ext] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
  });
  res.end(fs.readFileSync(filePath));
}

const server = http.createServer((req, res) => {
  const requested = resolvePath(req.url || '/');
  if (!requested) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  let filePath = requested;
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    filePath = path.join(root, 'index.html');
  }

  try {
    sendFile(res, filePath);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(String(error && error.stack || error));
  }
});

server.listen(port, host, () => {
  console.log(`Static server listening on http://${host}:${port}`);
});
