const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const root = path.resolve(__dirname, '../../dist-web');
const port = Number(process.env.PORT || 4173);

if (!fs.existsSync(path.join(root, 'index.html'))) {
  console.error('dist-web/index.html is missing. Run `npm run build:web:export` first.');
  process.exit(1);
}

const contentTypeByExt = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
};

function sendFile(res, filePath) {
  const ext = path.extname(filePath);
  res.writeHead(200, { 'content-type': contentTypeByExt[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

http
  .createServer((req, res) => {
    const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
    const safePath = path.normalize(decodeURIComponent(url.pathname)).replace(/^\.\.(?:\/|$)/, '');
    const requested = path.join(root, safePath);
    if (requested.startsWith(root) && fs.existsSync(requested) && fs.statSync(requested).isFile()) {
      sendFile(res, requested);
      return;
    }
    sendFile(res, path.join(root, 'index.html'));
  })
  .listen(port, '127.0.0.1', () => {
    console.log(`Serving dist-web on http://127.0.0.1:${port}`);
  });
