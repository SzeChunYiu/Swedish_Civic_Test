#!/usr/bin/env node
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const { chromium } = require('playwright');

const SYSTEM_CHROMIUM_EXECUTABLES = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

const CONTENT_TYPE_BY_EXT = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml; charset=utf-8',
};

function findSystemChromiumExecutable() {
  return SYSTEM_CHROMIUM_EXECUTABLES.find((candidate) => fs.existsSync(candidate));
}

function contentTypeFor(filePath) {
  return CONTENT_TYPE_BY_EXT[path.extname(filePath)] || 'application/octet-stream';
}

function resolveStaticRequestPath(root, requestPathname) {
  let requestedPath;
  try {
    requestedPath = decodeURIComponent(requestPathname);
  } catch {
    return { error: 'malformed-path' };
  }

  const normalizedPath = requestedPath === '/' ? '/index.html' : requestedPath;
  const filePath = path.resolve(root, `.${normalizedPath}`);

  if (!filePath.startsWith(`${root}${path.sep}`) && filePath !== root) {
    return { error: 'forbidden' };
  }

  return { filePath };
}

function createStaticServer(root) {
  const missingRequests = [];
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    const resolved = resolveStaticRequestPath(root, url.pathname);

    if (resolved.error === 'malformed-path') {
      res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' }).end('bad request');
      return;
    }

    if (resolved.error === 'forbidden') {
      res.writeHead(403).end('forbidden');
      return;
    }

    let { filePath } = resolved;
    if (url.pathname === '/favicon.ico' && !fs.existsSync(filePath)) {
      const pwaIconPath = path.join(root, 'icons', 'pwa-icon-192.png');
      if (fs.existsSync(pwaIconPath)) {
        filePath = pwaIconPath;
      }
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      missingRequests.push(url.pathname);
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('not found');
      return;
    }

    res.writeHead(200, { 'content-type': contentTypeFor(filePath) });
    fs.createReadStream(filePath).pipe(res);
  });

  return { missingRequests, server };
}

async function checkWebExportResources(outputDir) {
  const root = path.resolve(process.cwd(), outputDir);
  const indexPath = path.join(root, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error(`${outputDir}/index.html is missing. Run npm run build:web:export first.`);
  }

  const { missingRequests, server } = createStaticServer(root);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const executablePath = findSystemChromiumExecutable();
  const launchOptions = executablePath ? { executablePath, headless: true } : { headless: true };

  let browser;
  try {
    browser = await chromium.launch(launchOptions);
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const badEvents = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        badEvents.push(`console error: ${message.text()}`);
      }
    });
    page.on('pageerror', (error) => badEvents.push(`page error: ${error.message}`));
    page.on('requestfailed', (request) => {
      badEvents.push(
        `request failed: ${request.url()} ${request.failure()?.errorText || ''}`.trim(),
      );
    });
    page.on('response', (response) => {
      if (response.status() >= 400) {
        badEvents.push(`HTTP ${response.status()}: ${response.url()}`);
      }
    });

    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(500);
    const bodyText = await page.locator('body').innerText({ timeout: 30000 });
    if (!bodyText.trim()) {
      badEvents.push('body rendered blank');
    }

    if (missingRequests.length > 0 || badEvents.length > 0) {
      throw new Error(
        [
          'Web export resource smoke failed.',
          missingRequests.length ? `Missing requests: ${missingRequests.join(', ')}` : null,
          badEvents.length ? `Browser events: ${badEvents.join(' | ')}` : null,
        ]
          .filter(Boolean)
          .join('\n'),
      );
    }
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

async function main() {
  const outputDir = process.argv[2] || 'dist-web';
  await checkWebExportResources(outputDir);
  console.log(`Web export resources OK: ${outputDir}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

module.exports = {
  checkWebExportResources,
  createStaticServer,
  findSystemChromiumExecutable,
  resolveStaticRequestPath,
};
