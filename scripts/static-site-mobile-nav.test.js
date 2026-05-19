const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const test = require('node:test');
const { chromium } = require('@playwright/test');

const repoRoot = path.resolve(__dirname, '..');
const siteRoot = path.join(repoRoot, 'site');
const requiredRoutes = [
  { label: 'Practice', route: '/practice' },
  { label: 'Mock exam', route: '/mock' },
  { label: 'Ebook', route: '/ebook' },
  { label: 'Support', route: '/support' },
];

function contentType(filePath) {
  if (filePath.endsWith('.css')) return 'text/css';
  if (filePath.endsWith('.js')) return 'text/javascript';
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

function assertNoHorizontalOverflow(snapshot, label) {
  assert.ok(
    snapshot.documentScrollWidth <= snapshot.documentClientWidth,
    `${label} document overflow: ${snapshot.documentScrollWidth} > ${snapshot.documentClientWidth}`,
  );
  assert.ok(
    snapshot.bodyScrollWidth <= snapshot.documentClientWidth,
    `${label} body overflow: ${snapshot.bodyScrollWidth} > ${snapshot.documentClientWidth}`,
  );
}

function assertReachableBox(box, label) {
  assert.ok(box, `${label} should exist`);
  assert.ok(box.width > 0, `${label} should have width`);
  assert.ok(box.height > 0, `${label} should have height`);
  assert.ok(box.left >= 0, `${label} should not start off-screen`);
  assert.ok(box.right <= 390, `${label} should fit inside the 390px viewport`);
}

test('static study buddy role button has keyboard activation wiring', () => {
  const html = fs.readFileSync(path.join(siteRoot, 'index.html'), 'utf8');
  const source = fs.readFileSync(path.join(siteRoot, 'buddies.js'), 'utf8');

  assert.match(
    html,
    /<div[\s\S]*?id="dala-figure"[\s\S]*?role="button"[\s\S]*?tabindex="0"[\s\S]*?data-a11y-label="a11y\.studyBuddy"[\s\S]*?><\/div>/,
  );
  assert.match(source, /function activateBuddyFigure\(\)/);
  assert.match(
    source,
    /document\.addEventListener\("click"[\s\S]*?#dala-figure[\s\S]*?activateBuddyFigure\(\)/,
  );
  assert.match(source, /document\.addEventListener\("keydown"/);
  assert.match(source, /e\.key !== "Enter" && e\.key !== " "/);
  assert.match(source, /e\.preventDefault\(\)/);
  assert.match(source, /activateBuddyFigure\(\)/);
});

test('static icon-only controls use localized accessible-name keys', () => {
  const html = fs.readFileSync(path.join(siteRoot, 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(siteRoot, 'app.js'), 'utf8');
  const extras = fs.readFileSync(path.join(siteRoot, 'extras.js'), 'utf8');
  const extraI18n = fs.readFileSync(path.join(siteRoot, 'i18n-extras.js'), 'utf8');

  [
    /id="settings-open"[\s\S]*?aria-label="Settings"[\s\S]*?data-a11y-label="a11y\.settings\.open"/,
    /class="modal__close"[\s\S]*?aria-label="Close"[\s\S]*?data-a11y-label="a11y\.close"/,
    /id="ad-anchor-close"[\s\S]*?aria-label="Close ad"[\s\S]*?data-a11y-label="a11y\.ad\.close"/,
    /id="dala-bubble-close"[\s\S]*?aria-label="Close"[\s\S]*?data-a11y-label="a11y\.close"/,
    /id="dala-figure"[\s\S]*?aria-label="Study buddy"[\s\S]*?data-a11y-label="a11y\.studyBuddy"/,
  ].forEach((pattern) => assert.match(html, pattern));

  assert.match(app, /function smtUpdateStaticControlLabels\(lang\)/);
  assert.match(app, /querySelectorAll\("\[data-a11y-label\]"\)/);
  assert.match(extras, /class="cheats__close" data-a11y-label="a11y\.close"/);
  assert.doesNotMatch(extras, /aria-label="Close"/);

  ['zh-Hans', 'zh-Hant', 'ar', 'so'].forEach((lang) => {
    const start = extraI18n.indexOf(`"${lang}": {`);
    assert.notEqual(start, -1, `${lang} dictionary should exist`);
    const nextMarker = extraI18n.indexOf(
      '\n    // ============================================================',
      start + 1,
    );
    const block = extraI18n.slice(start, nextMarker === -1 ? undefined : nextMarker);
    assert.match(block, /"a11y\.settings\.open"/);
    assert.match(block, /"a11y\.close"/);
    assert.match(block, /"a11y\.ad\.close"/);
    assert.match(block, /"a11y\.studyBuddy"/);
  });
});

test(
  'static mobile topbar reaches key routes and settings without horizontal overflow',
  chromiumTestOptions(),
  async () => {
    const server = await createStaticServer();
    let browser;

    try {
      browser = await chromium.launch(chromiumLaunchOptions());
      const page = await browser.newPage({ viewport: { width: 390, height: 840 } });
      await page.addInitScript(() => {
        window.localStorage.setItem('smt_consent', 'min');
        window.localStorage.setItem('smt_buddy_hidden', '1');
      });

      await page.goto(server.url, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#nav-toggle');

      const closed = await page.evaluate(() => {
        const boxFor = (selector) => {
          const node = document.querySelector(selector);
          if (!node) return null;
          const rect = node.getBoundingClientRect();
          return {
            height: rect.height,
            left: rect.left,
            right: rect.right,
            width: rect.width,
          };
        };

        return {
          bodyScrollWidth: document.body.scrollWidth,
          documentClientWidth: document.documentElement.clientWidth,
          documentScrollWidth: document.documentElement.scrollWidth,
          navToggle: boxFor('#nav-toggle'),
          settings: boxFor('#settings-open'),
        };
      });

      assertNoHorizontalOverflow(closed, 'closed mobile nav');
      assertReachableBox(closed.navToggle, 'mobile navigation button');
      assertReachableBox(closed.settings, 'settings button');

      await page.click('#nav-toggle');

      const open = await page.evaluate((routes) => {
        const boxFor = (selector) => {
          const node = document.querySelector(selector);
          if (!node) return null;
          const rect = node.getBoundingClientRect();
          return {
            height: rect.height,
            left: rect.left,
            right: rect.right,
            width: rect.width,
          };
        };

        return {
          bodyScrollWidth: document.body.scrollWidth,
          documentClientWidth: document.documentElement.clientWidth,
          documentScrollWidth: document.documentElement.scrollWidth,
          expanded: document.getElementById('nav-toggle')?.getAttribute('aria-expanded'),
          routes: Object.fromEntries(
            routes.map(({ label, route }) => [label, boxFor(`.nav a[data-route="${route}"]`)]),
          ),
        };
      }, requiredRoutes);

      assert.equal(open.expanded, 'true');
      assertNoHorizontalOverflow(open, 'open mobile nav');
      requiredRoutes.forEach(({ label }) => assertReachableBox(open.routes[label], label));

      await page.click('#settings-open');
      const settingsOpen = await page.locator('#settings-modal').evaluate((node) => !node.hidden);
      assert.equal(settingsOpen, true, 'settings modal should open from the mobile topbar');
    } finally {
      if (browser) {
        await browser.close();
      }
      await server.close();
    }
  },
);
