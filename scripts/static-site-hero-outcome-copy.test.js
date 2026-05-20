const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const test = require('node:test');
const { chromium } = require('@playwright/test');

const repoRoot = path.resolve(__dirname, '..');
const siteRoot = path.join(repoRoot, 'site');

const unsupportedOutcomePatterns = [
  /\bPass the test\b/i,
  /\bEarn the passport\b/i,
  /\bPass big\b/i,
  /\bPass like\b/i,
  /\bPass with\b/i,
  /\bBrag at midsommar\b/i,
  /\bKlara provet\b/i,
  /\bFå passet\b/i,
  /\bKlara stort\b/i,
  /\bSkryt på midsommar\b/i,
  /\bStudy, fika, pass\b/i,
];

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function assertNoOutcomeCopy(text, label) {
  for (const pattern of unsupportedOutcomePatterns) {
    assert.doesNotMatch(text, pattern, `${label} should not include ${pattern}`);
  }
}

function contentType(filePath) {
  if (filePath.endsWith('.css')) return 'text/css';
  if (filePath.endsWith('.js')) return 'text/javascript';
  if (filePath.endsWith('.jsx')) return 'text/javascript';
  if (filePath.endsWith('.html')) return 'text/html';
  if (filePath.endsWith('.json')) return 'application/json';
  return 'application/octet-stream';
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

function chromeExecutablePath() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }

  const systemCandidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  return systemCandidates.find((candidate) => fs.existsSync(candidate));
}

function hasPlayableChromium() {
  return Boolean(chromeExecutablePath()) || fs.existsSync(chromium.executablePath());
}

function chromiumTestOptions() {
  return hasPlayableChromium()
    ? {}
    : {
        skip: 'Chromium is not available; set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH or install a supported browser.',
      };
}

function chromiumLaunchOptions() {
  const executablePath = chromeExecutablePath();
  return executablePath ? { executablePath } : {};
}

async function visibleText(page) {
  return page.locator('body').innerText();
}

test('static hero, footer, tweaks, and Dala defaults use study-focused copy', () => {
  const surface = ['site/index.html', 'site/app.js', 'site/tweaks.jsx', 'site/buddies.js']
    .map(read)
    .join('\n');

  assert.match(surface, /Study the facts\./);
  assert.match(surface, /Arrive prepared\./);
  assert.match(surface, /Plugga fakta\./);
  assert.match(surface, /Kom f(?:ö|o)rberedd\./);
  assert.match(surface, /Study the facts\. Keep the streak\./);
  assert.match(surface, /Plugga fakta\. H(?:å|a)ll sviten\./);
  assertNoOutcomeCopy(surface, 'static source defaults');
});

test(
  'static hero and footer render study-focused EN/SV copy without outcome claims',
  chromiumTestOptions(),
  async () => {
    const server = await createStaticServer();
    let browser;

    try {
      browser = await chromium.launch(chromiumLaunchOptions());
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await page.addInitScript(() => {
        const randomValues = [0.5, 0.21];
        Math.random = () => (randomValues.length ? randomValues.shift() : 0.5);
        window.localStorage.setItem('smt_consent', 'min');
        window.localStorage.setItem('smt_buddy', 'dala');
        window.sessionStorage.setItem('smt_buddy_greeted', '1');
      });

      await page.goto(server.url, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(
        () => document.querySelector('[data-i18n="hero.h1a"]')?.textContent === 'Study the facts.',
      );

      assert.equal(await page.locator('[data-i18n="hero.h1a"]').innerText(), 'Study the facts.');
      assert.equal(await page.locator('[data-i18n="hero.h1c"]').innerText(), 'Arrive prepared.');
      assert.equal(await page.locator('[data-i18n="footer.t1"]').innerText(), 'Study lagom.');
      assert.equal(await page.locator('[data-i18n="footer.t2"]').innerText(), 'Arrive prepared.');
      assertNoOutcomeCopy(await visibleText(page), 'English visible static home');

      await page.click('#dala-figure');
      await page.waitForFunction(
        () =>
          !document.getElementById('dala-bubble')?.hidden &&
          document.getElementById('dala-msg')?.textContent?.includes('Study the facts'),
      );
      assertNoOutcomeCopy(await page.locator('#dala-msg').innerText(), 'English Dala tip');

      await page.evaluate(() => {
        window.localStorage.setItem('smt_lang', 'sv');
        window.location.reload();
      });
      await page.waitForFunction(
        () => document.querySelector('[data-i18n="hero.h1a"]')?.textContent === 'Plugga fakta.',
      );

      assert.equal(await page.locator('[data-i18n="hero.h1a"]').innerText(), 'Plugga fakta.');
      assert.equal(await page.locator('[data-i18n="hero.h1c"]').innerText(), 'Kom förberedd.');
      assert.equal(await page.locator('[data-i18n="footer.t1"]').innerText(), 'Plugga lagom.');
      assert.equal(await page.locator('[data-i18n="footer.t2"]').innerText(), 'Kom förberedd.');
      assertNoOutcomeCopy(await visibleText(page), 'Swedish visible static home');
    } finally {
      if (browser) {
        await browser.close();
      }
      await server.close();
    }
  },
);
