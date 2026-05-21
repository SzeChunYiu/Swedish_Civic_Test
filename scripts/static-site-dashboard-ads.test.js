const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const test = require('node:test');
const { launchStaticChromium } = require('./static-browser-support');

const repoRoot = path.resolve(__dirname, '..');
const siteRoot = path.join(repoRoot, 'site');

function contentType(filePath) {
  if (filePath.endsWith('.css')) return 'text/css';
  if (filePath.endsWith('.js')) return 'text/javascript';
  if (filePath.endsWith('.html')) return 'text/html';
  if (filePath.endsWith('.json')) return 'application/json';
  if (filePath.endsWith('.txt')) return 'text/plain';
  return 'application/octet-stream';
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function createStaticServer() {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url || '/', 'http://127.0.0.1');
    const relativePath = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/+/, '');
    const resolvedPath = path.resolve(siteRoot, relativePath);

    if (!resolvedPath.startsWith(`${siteRoot}${path.sep}`) && resolvedPath !== siteRoot) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    fs.readFile(resolvedPath, (error, body) => {
      if (error) {
        response.writeHead(404);
        response.end('Not found');
        return;
      }
      response.writeHead(200, { 'content-type': contentType(resolvedPath) });
      response.end(body);
    });
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({
        close: () => new Promise((done) => server.close(done)),
        url: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

async function visibleAdSlots(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-page].is-active [data-ad-slot]')).map((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      const ins = node.querySelector('ins.adsbygoogle');
      return {
        client: ins?.getAttribute('data-ad-client') || '',
        hidden: node.hidden || style.display === 'none' || style.visibility === 'hidden',
        placement: node.getAttribute('data-ad-slot'),
        pushed: ins?.getAttribute('data-smt-pushed') || '',
        slot: ins?.getAttribute('data-ad-slot') || '',
        width: rect.width,
      };
    }),
  );
}

test('static dashboard hash route activates the dashboard page instead of home', async (t) => {
  const server = await createStaticServer();
  let browser;

  try {
    browser = await launchStaticChromium(t, 'dashboard route guard');
    if (!browser) return;

    const page = await browser.newPage({ viewport: { width: 390, height: 840 } });
    await page.addInitScript(() => {
      window.localStorage.setItem('smt_consent', 'min');
      window.localStorage.setItem('smt_buddy_hidden', '1');
    });
    await page.goto(`${server.url}/#/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-page="/dashboard"].is-active');

    const routeState = await page.evaluate(() => ({
      dashboardActive: document
        .querySelector('[data-page="/dashboard"]')
        ?.classList.contains('is-active'),
      dashboardText: document.getElementById('v11-dashboard')?.textContent.trim() || '',
      homeActive: document.querySelector('[data-page="/"]')?.classList.contains('is-active'),
    }));

    assert.equal(routeState.dashboardActive, true);
    assert.equal(routeState.homeActive, false);
    assert.match(routeState.dashboardText, /dashboard|progress|sign in/i);
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
});

test('static AdSense settings can load reviewed auto ads while manual panels remain visible', () => {
  const app = read('site/app.js');
  const adsTxt = read('site/ads.txt');

  assert.match(adsTxt, /google\.com, pub-2451892671779738, DIRECT, f08c47fec0942fa0/);
  assert.match(
    read('site/index.html'),
    /\bsrc=["']app\.js\?v=[0-9a-f]{8,}["']/,
    'index.html should cache-bust app.js so Loopia/browser caches do not serve stale routing or ad settings',
  );
  assert.match(app, /publisherId:\s*'ca-pub-2451892671779738'/);
  assert.match(app, /autoAds:\s*true/);
  assert.match(app, /function\s+smtAdSenseCanLoad\b/);
  assert.match(app, /https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/);
});

test('practice questions and ebook render visible in-content ad panels after consent', async (t) => {
  const server = await createStaticServer();
  let browser;

  try {
    browser = await launchStaticChromium(t, 'practice ebook ad panel guard');
    if (!browser) return;

    const page = await browser.newPage({ viewport: { width: 390, height: 840 } });
    await page.addInitScript(() => {
      window.localStorage.setItem('smt_consent', 'min');
      window.localStorage.setItem('smt_buddy_hidden', '1');
      window.sessionStorage.setItem('smt_anchor_closed', '1');
    });

    await page.goto(`${server.url}/#/practice?c=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-page="/practice"].is-active .quiz__card');
    const practiceSlots = await visibleAdSlots(page);
    assert.ok(
      practiceSlots.some((slot) => slot.placement === 'practice' && !slot.hidden && slot.width > 0),
      `practice question should show a visible ad panel: ${JSON.stringify(practiceSlots)}`,
    );

    await page.goto(`${server.url}/#/ebook?c=ch03`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-page="/ebook"].is-active .ebook__reader');
    const ebookSlots = await visibleAdSlots(page);
    assert.ok(
      ebookSlots.some((slot) => slot.placement === 'ebook' && !slot.hidden && slot.width > 0),
      `ebook should show a visible ad panel: ${JSON.stringify(ebookSlots)}`,
    );
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
});
