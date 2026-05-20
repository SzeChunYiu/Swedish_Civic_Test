const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const root = path.resolve(__dirname, '../../site');
const port = Number(process.env.PORT || 4173);

if (!fs.existsSync(path.join(root, 'index.html'))) {
  console.error('site/index.html is missing.');
  process.exit(1);
}

const contentTypeByExt = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
};

function sendFile(res, filePath) {
  const ext = path.extname(filePath);
  res.writeHead(200, { 'content-type': contentTypeByExt[ext] || 'application/octet-stream' });

  if (path.basename(filePath) === 'index.html') {
    const html = fs
      .readFileSync(filePath, 'utf8')
      .replace(/\s*<link rel="preconnect" href="https:\/\/fonts\.[^>]+>\n?/g, '')
      .replace(/\s*<link\s+href="https:\/\/fonts\.googleapis\.com[^>]+>\n?/g, '')
      .replace(/\s*<script[\s\S]*?src="https:\/\/unpkg\.com[\s\S]*?<\/script>\n?/g, '');
    res.end(html);
    return;
  }

  fs.createReadStream(filePath).pipe(res);
}

http
  .createServer((req, res) => {
    const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
    const relativePath = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/+/, '');
    const requested = path.resolve(root, relativePath);

    if (!requested.startsWith(`${root}${path.sep}`) && requested !== root) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (fs.existsSync(requested) && fs.statSync(requested).isFile()) {
      sendFile(res, requested);
      return;
    }

    sendFile(res, path.join(root, 'index.html'));
  })
  .listen(port, '127.0.0.1', () => {
    console.log(`Serving static site on http://127.0.0.1:${port}`);
  });
