const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const root = path.resolve(__dirname, '../../site');
const port = Number(process.env.PORT || 4173);

const contentTypeByExt = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
};

function assertStaticSiteReady(siteRoot = root) {
  if (!fs.existsSync(path.join(siteRoot, 'index.html'))) {
    throw new Error('site/index.html is missing.');
  }
}

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

function createRequestHandler({ siteRoot = root, listenPort = port } = {}) {
  return (req, res) => {
    const url = new URL(req.url || '/', `http://127.0.0.1:${listenPort}`);
    const relativePath = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/+/, '');
    const requested = path.resolve(siteRoot, relativePath);

    if (!requested.startsWith(`${siteRoot}${path.sep}`) && requested !== siteRoot) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (fs.existsSync(requested) && fs.statSync(requested).isFile()) {
      sendFile(res, requested);
      return;
    }

    sendFile(res, path.join(siteRoot, 'index.html'));
  };
}

function startServer({ siteRoot = root, listenPort = port } = {}) {
  assertStaticSiteReady(siteRoot);
  return http
    .createServer(createRequestHandler({ siteRoot, listenPort }))
    .listen(listenPort, '127.0.0.1', () => {
      console.log(`Serving static site on http://127.0.0.1:${listenPort}`);
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
      console.error(`Timed out closing static site server after ${signal}`);
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
  assertStaticSiteReady,
  closeServer,
  createRequestHandler,
  installSignalHandlers,
  startServer,
};
