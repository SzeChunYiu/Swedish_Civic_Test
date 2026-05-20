const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const { assertWebExportFreshness } = require('../../scripts/prepare-web-export.js');

const repoRoot = path.resolve(__dirname, '../..');
const root = path.resolve(__dirname, '../../dist-web');
const port = Number(process.env.PORT || 4173);

const contentTypeByExt = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
};

function assertDistWebReady(distRoot = root, sourceRoot = repoRoot) {
  if (!fs.existsSync(path.join(distRoot, 'index.html'))) {
    throw new Error('dist-web/index.html is missing. Run `npm run build:web:export` first.');
  }

  assertWebExportFreshness(distRoot, { repoRoot: sourceRoot });
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath);
  res.writeHead(200, { 'content-type': contentTypeByExt[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

function createDistWebRequestHandler(distRoot = root, serverPort = port) {
  return (req, res) => {
    const url = new URL(req.url || '/', `http://127.0.0.1:${serverPort}`);
    const safePath = path.normalize(decodeURIComponent(url.pathname)).replace(/^\.\.(?:\/|$)/, '');
    const requested = path.join(distRoot, safePath);
    if (
      requested.startsWith(distRoot) &&
      fs.existsSync(requested) &&
      fs.statSync(requested).isFile()
    ) {
      sendFile(res, requested);
      return;
    }
    sendFile(res, path.join(distRoot, 'index.html'));
  };
}

function startServer(distRoot = root, serverPort = port, sourceRoot = repoRoot) {
  assertDistWebReady(distRoot, sourceRoot);
  return http
    .createServer(createDistWebRequestHandler(distRoot, serverPort))
    .listen(serverPort, '127.0.0.1', () => {
      console.log(`Serving dist-web on http://127.0.0.1:${serverPort}`);
    });
}

if (require.main === module) {
  try {
    startServer();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

module.exports = {
  assertDistWebReady,
  createDistWebRequestHandler,
  startServer,
};
