const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const test = require('node:test');
const { chromium } = require('@playwright/test');

const repoRoot = path.resolve(__dirname, '..');
const siteRoot = path.join(repoRoot, 'site');
const adSenseHostPattern = /pagead2\.googlesyndication\.com/;

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

function installAdSenseProbe(page) {
  return page.addInitScript(() => {
    window.__staticAdSenseEvents = [];
    const originalAppendChild = Element.prototype.appendChild;
    Element.prototype.appendChild = function appendChildWithAdSenseProbe(node) {
      if (
        node &&
        node.tagName === 'SCRIPT' &&
        typeof node.src === 'string' &&
        node.src.includes('pagead2.googlesyndication.com')
      ) {
        window.__staticAdSenseEvents.push({
          requestNonPersonalizedAds:
            window.adsbygoogle && window.adsbygoogle.requestNonPersonalizedAds,
          type: 'append-script',
        });
      }
      return originalAppendChild.call(this, node);
    };
  });
}

async function prepareAdSenseQueue(page) {
  await page.evaluate(() => {
    const queue = [];
    const originalPush = queue.push.bind(queue);
    queue.push = function pushWithAdSenseProbe(payload) {
      window.__staticAdSenseEvents.push({
        payload,
        requestNonPersonalizedAds: queue.requestNonPersonalizedAds,
        type: 'push',
      });
      return originalPush(payload);
    };
    window.adsbygoogle = queue;
  });
}

async function runConsentScenario({
  buttonId,
  expectedChoice,
  expectedDataNpa,
  expectedSignal,
  lang,
}) {
  const server = await createStaticServer();
  let browser;
  const pageErrors = [];

  try {
    browser = await chromium.launch(chromiumLaunchOptions());
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') pageErrors.push(message.text());
    });
    await page.route(/pagead2\.googlesyndication\.com/, (route) =>
      route.fulfill({ body: '', contentType: 'application/javascript', status: 200 }),
    );
    await installAdSenseProbe(page);
    await page.addInitScript((nextLang) => {
      window.localStorage.removeItem('smt_consent');
      window.localStorage.setItem('smt_buddy_hidden', '1');
      window.localStorage.setItem('smt_lang', nextLang);
    }, lang);

    await page.goto(server.url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#consent:not([hidden])');

    if (lang === 'sv') {
      await assertVisibleText(page, 'Cookies, på lagom-vis.', '#consent');
      await assertVisibleText(page, 'Bara nödvändiga', '#consent');
      await assertVisibleText(page, 'Godkänn allt', '#consent');
    } else {
      await assertVisibleText(page, 'Cookies, lagom-style.', '#consent');
      await assertVisibleText(page, 'Necessary only', '#consent');
      await assertVisibleText(page, 'Accept all', '#consent');
    }

    await prepareAdSenseQueue(page);
    await page.click(buttonId);
    await page.waitForFunction(() =>
      Boolean(window.__staticAdSenseEvents?.some((event) => event.type === 'push')),
    );

    const snapshot = await page.evaluate(() => ({
      adDataNpaValues: Array.from(document.querySelectorAll('ins.adsbygoogle'), (node) =>
        node.getAttribute('data-npa'),
      ),
      adSlotHiddenStates: Array.from(document.querySelectorAll('[data-ad-slot]'), (node) => ({
        hidden: node.hidden,
        slot: node.getAttribute('data-ad-slot'),
      })),
      consentHidden: document.getElementById('consent')?.hidden,
      events: window.__staticAdSenseEvents,
      requestNonPersonalizedAds: window.adsbygoogle?.requestNonPersonalizedAds,
      storedConsent: window.localStorage.getItem('smt_consent'),
    }));

    assert.equal(snapshot.storedConsent, expectedChoice);
    assert.equal(snapshot.consentHidden, true, `${expectedChoice} consent modal should close`);
    assert.equal(snapshot.requestNonPersonalizedAds, expectedSignal);
    assert.ok(
      snapshot.adDataNpaValues.length >= 2,
      'static page should expose inline and anchor AdSense slots',
    );
    snapshot.adDataNpaValues.forEach((value) => assert.equal(value, expectedDataNpa));
    assert.ok(
      snapshot.adSlotHiddenStates.some((slot) => slot.slot === 'inline' && slot.hidden === false),
      'accepted consent should reveal the inline ad slot',
    );
    assert.ok(
      snapshot.adSlotHiddenStates.some((slot) => slot.slot === 'anchor' && slot.hidden === false),
      'accepted consent should reveal the anchor ad slot',
    );

    const adRequests = snapshot.events.filter(
      (event) => event.type === 'append-script' || event.type === 'push',
    );
    assert.ok(adRequests.length >= 2, 'AdSense script append and slot push should be observed');
    adRequests.forEach((event) => {
      assert.equal(
        event.requestNonPersonalizedAds,
        expectedSignal,
        `${expectedChoice} ${event.type} should use the expected AdSense personalization signal`,
      );
    });

    await page.goto(`${server.url}/#/privacy`, { waitUntil: 'domcontentloaded' });
    if (lang === 'sv') {
      await assertVisibleText(page, 'Annonser på webbplatsen', 'main[data-page="/privacy"]');
      await assertVisibleText(page, 'Bara nödvändiga', 'main[data-page="/privacy"]');
      await assertVisibleText(page, 'icke-personaliserade', 'main[data-page="/privacy"]');
    } else {
      await assertVisibleText(page, 'Ads on this website', 'main[data-page="/privacy"]');
      await assertVisibleText(page, 'Necessary only', 'main[data-page="/privacy"]');
      await assertVisibleText(page, 'non-personalised', 'main[data-page="/privacy"]');
    }

    assert.deepEqual(pageErrors, []);
  } finally {
    if (browser) {
      await browser.close();
    }
    await server.close();
  }
}

async function assertVisibleText(page, text, scopeSelector) {
  const locator = page.locator(scopeSelector).getByText(text, { exact: false }).first();
  await locator.waitFor({ state: 'visible' });
  assert.ok(await locator.isVisible(), `${text} should be visible`);
}

test(
  'static AdSense consent sends non-personalized signal before loading ads',
  chromiumTestOptions(),
  async () => {
    await runConsentScenario({
      buttonId: '#consent-min',
      expectedChoice: 'min',
      expectedDataNpa: '1',
      expectedSignal: 1,
      lang: 'en',
    });
  },
);

test(
  'static AdSense consent resets personalization signal for accept all in Swedish',
  chromiumTestOptions(),
  async () => {
    await runConsentScenario({
      buttonId: '#consent-all',
      expectedChoice: 'all',
      expectedDataNpa: null,
      expectedSignal: 0,
      lang: 'sv',
    });
  },
);
