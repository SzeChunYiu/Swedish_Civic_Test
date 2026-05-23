const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { resolveStaticRequestPath } = require('./staticPathResolver.cjs');

const root = path.resolve(process.env.DIST_WEB_ROOT || path.join(__dirname, '../../dist-web'));
const port = Number(process.env.PORT || 4173);

function assertDistWebReady(outputDir = root) {
  const indexPath = path.join(outputDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error('dist-web/index.html is missing. Run `npm run build:web:export` first.');
  }
  const { check } = require('../../scripts/prepare-web-export.js');
  check(outputDir);
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

function createRequestHandler({ outputDir = root, listenPort = port } = {}) {
  return (req, res) => {
    const url = new URL(req.url || '/', `http://127.0.0.1:${listenPort}`);
    sendFile(res, resolveStaticRequestPath({ root: outputDir, pathname: url.pathname }));
  };
}

function startServer({ outputDir = root, listenPort = port } = {}) {
  assertDistWebReady(outputDir);
  return http
    .createServer(createRequestHandler({ outputDir, listenPort }))
    .listen(listenPort, '127.0.0.1', () => {
      console.log(`Serving dist-web on http://127.0.0.1:${listenPort}`);
    });
}

function closeServer(server, callback = () => {}) {
  if (typeof server.closeIdleConnections === 'function') {
    server.closeIdleConnections();
  }
  server.close((error) => {
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }
    callback(error);
  });
}

function installSignalHandlers(server) {
  let shuttingDown = false;
  const shutdown = (signal) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    const forcedExit = setTimeout(() => {
      console.error(`Timed out closing dist-web server after ${signal}`);
      process.exit(1);
    }, 5000);
    forcedExit.unref();

    closeServer(server, (error) => {
      clearTimeout(forcedExit);
      if (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
      }
      process.exit(0);
    });
  };

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

if (require.main === module) {
  try {
    const server = startServer();
    installSignalHandlers(server);
    server.once('error', (error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

module.exports = {
  assertDistWebReady,
  closeServer,
  createRequestHandler,
  installSignalHandlers,
  startServer,
};
