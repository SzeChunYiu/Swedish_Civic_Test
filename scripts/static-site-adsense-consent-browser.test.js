const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const test = require('node:test');
const { chromium } = require('@playwright/test');

const repoRoot = path.resolve(__dirname, '..');
const siteRoot = path.join(repoRoot, 'site');
const expectedAdSenseLoaderPattern =
  /^https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-2451892671779738$/;

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

function assertOnlyExpectedAdSenseLoaderRequests(adScriptRequests, expectedCount = 1) {
  assert.equal(adScriptRequests.length, expectedCount);
  adScriptRequests.forEach((requestUrl) => {
    assert.match(requestUrl, expectedAdSenseLoaderPattern);
  });
}

async function openStaticSiteWithStoredConsent(consent, viewport = { width: 390, height: 840 }) {
  const server = await createStaticServer();
  const browser = await chromium.launch(chromiumLaunchOptions());
  const page = await browser.newPage({ viewport });
  const adScriptRequests = [];

  await page.route('**/pagead2.googlesyndication.com/pagead/js/adsbygoogle.js**', (route) => {
    adScriptRequests.push(route.request().url());
    return route.fulfill({
      body: 'window.__adsenseScriptLoaded = true;',
      contentType: 'text/javascript',
      status: 200,
    });
  });
  await page.addInitScript((storedConsent) => {
    window.__adsenseEvents = [];
    window.localStorage.setItem('smt_consent', storedConsent);
    window.localStorage.setItem('smt_buddy_hidden', '1');

    const adsbygoogle = [];
    adsbygoogle.push = function pushAd(...items) {
      window.__adsenseEvents.push({
        dataNpa: Array.from(document.querySelectorAll('ins.adsbygoogle')).map((node) =>
          node.getAttribute('data-npa'),
        ),
        npa: window.adsbygoogle?.requestNonPersonalizedAds ?? null,
        type: 'push',
      });
      return Array.prototype.push.apply(this, items);
    };
    window.adsbygoogle = adsbygoogle;

    const originalAppendChild = Node.prototype.appendChild;
    Node.prototype.appendChild = function appendChild(child) {
      if (
        this === document.head &&
        child?.tagName === 'SCRIPT' &&
        child.src.includes('pagead2.googlesyndication.com')
      ) {
        window.__adsenseEvents.push({
          dataNpa: Array.from(document.querySelectorAll('ins.adsbygoogle')).map((node) =>
            node.getAttribute('data-npa'),
          ),
          npa: window.adsbygoogle?.requestNonPersonalizedAds ?? null,
          type: 'append',
        });
      }
      return originalAppendChild.call(this, child);
    };
  }, consent);

  await page.goto(server.url, { waitUntil: 'domcontentloaded' });

  return { adScriptRequests, browser, page, server };
}

async function measureVisibleConsentTargets(page) {
  return page.evaluate(() => {
    const buttons = ['consent-min', 'consent-all'].map((id) => {
      const button = document.getElementById(id);
      button?.focus();
      const rect = button?.getBoundingClientRect();
      const style = button ? window.getComputedStyle(button) : null;

      return {
        focused: document.activeElement === button,
        height: rect?.height ?? 0,
        id,
        label: button?.textContent?.trim() ?? '',
        minHeight: style?.minHeight ?? '',
        outlineStyle: style?.outlineStyle ?? '',
        width: rect?.width ?? 0,
      };
    });

    return {
      buttons,
      hidden: document.getElementById('consent')?.hidden,
    };
  });
}

for (const viewport of [
  { label: 'mobile', width: 390, height: 840 },
  { label: 'desktop', width: 1024, height: 768 },
]) {
  test(
    `visible static consent buttons keep 44px targets on ${viewport.label}`,
    chromiumTestOptions(),
    async () => {
      const { adScriptRequests, browser, page, server } = await openStaticSiteWithStoredConsent(
        'banana',
        { width: viewport.width, height: viewport.height },
      );

      try {
        const targetState = await measureVisibleConsentTargets(page);

        assert.equal(targetState.hidden, false);
        assertOnlyExpectedAdSenseLoaderRequests(adScriptRequests);
        assert.deepEqual(
          targetState.buttons.map((button) => button.label),
          ['Necessary only', 'Accept all'],
        );

        for (const button of targetState.buttons) {
          assert.ok(button.width >= 44, `${button.id} width ${button.width}px must be >= 44px`);
          assert.ok(button.height >= 44, `${button.id} height ${button.height}px must be >= 44px`);
          assert.equal(button.minHeight, '44px');
          assert.equal(button.focused, true, `${button.id} should be focusable`);
          assert.notEqual(button.outlineStyle, 'none', `${button.id} should keep focus outline`);
        }

        await page.click('#consent-min');
        await page.waitForFunction(() => document.getElementById('consent')?.hidden === true);
        const storedConsent = await page.evaluate(() => window.localStorage.getItem('smt_consent'));
        assert.equal(storedConsent, 'min');
      } finally {
        await browser.close();
        await server.close();
      }
    },
  );
}

for (const { consent } of [{ consent: 'min' }, { consent: 'all' }]) {
  test(
    `stored ${consent} AdSense consent does not load unconfigured web slots`,
    chromiumTestOptions(),
    async () => {
      const { adScriptRequests, browser, page, server } =
        await openStaticSiteWithStoredConsent(consent);

      try {
        const firstLoad = await page.evaluate(() => ({
          adPlacements: Array.from(document.querySelectorAll('ins.adsbygoogle')).map((node) => ({
            client: node.getAttribute('data-ad-client'),
            dataNpa: node.getAttribute('data-npa'),
            placement: node.getAttribute('data-smt-ad-placement'),
            pushed: node.getAttribute('data-smt-pushed'),
            slot: node.getAttribute('data-ad-slot'),
          })),
          events: window.__adsenseEvents,
          manualSlotCount: document.querySelectorAll('ins.adsbygoogle[data-ad-slot]').length,
          modalHidden: document.getElementById('consent')?.hidden,
          npa: window.adsbygoogle?.requestNonPersonalizedAds,
          storedConsent: window.localStorage.getItem('smt_consent'),
        }));

        assert.equal(firstLoad.modalHidden, true);
        assert.equal(firstLoad.storedConsent, consent);
        assertOnlyExpectedAdSenseLoaderRequests(adScriptRequests);
        assert.equal(firstLoad.manualSlotCount, 0);
        assert.equal(firstLoad.npa, consent === 'min' ? 1 : 0);
        assert.deepEqual(firstLoad.events, []);
        assert.deepEqual(firstLoad.adPlacements, [
          {
            client: 'ca-pub-2451892671779738',
            dataNpa: consent === 'min' ? '1' : null,
            placement: 'inline',
            pushed: null,
            slot: null,
          },
          {
            client: 'ca-pub-2451892671779738',
            dataNpa: consent === 'min' ? '1' : null,
            placement: 'anchor',
            pushed: null,
            slot: null,
          },
        ]);

        await page.reload({ waitUntil: 'domcontentloaded' });

        const afterReload = await page.evaluate(() => ({
          adPlacements: Array.from(document.querySelectorAll('ins.adsbygoogle')).map((node) => ({
            client: node.getAttribute('data-ad-client'),
            dataNpa: node.getAttribute('data-npa'),
            placement: node.getAttribute('data-smt-ad-placement'),
            pushed: node.getAttribute('data-smt-pushed'),
            slot: node.getAttribute('data-ad-slot'),
          })),
          events: window.__adsenseEvents,
          manualSlotCount: document.querySelectorAll('ins.adsbygoogle[data-ad-slot]').length,
          modalHidden: document.getElementById('consent')?.hidden,
          npa: window.adsbygoogle?.requestNonPersonalizedAds,
          storedConsent: window.localStorage.getItem('smt_consent'),
        }));

        assert.equal(afterReload.modalHidden, true);
        assert.equal(afterReload.storedConsent, consent);
        assert.equal(afterReload.manualSlotCount, 0);
        assert.equal(afterReload.npa, consent === 'min' ? 1 : 0);
        assertOnlyExpectedAdSenseLoaderRequests(adScriptRequests, 2);
        assert.deepEqual(afterReload.events, []);
        assert.deepEqual(afterReload.adPlacements, [
          {
            client: 'ca-pub-2451892671779738',
            dataNpa: consent === 'min' ? '1' : null,
            placement: 'inline',
            pushed: null,
            slot: null,
          },
          {
            client: 'ca-pub-2451892671779738',
            dataNpa: consent === 'min' ? '1' : null,
            placement: 'anchor',
            pushed: null,
            slot: null,
          },
        ]);
      } finally {
        await browser.close();
        await server.close();
      }
    },
  );
}

for (const { consent } of [
  { consent: 'yes' },
  { consent: 'false' },
  { consent: '0' },
  { consent: 'banana' },
  { consent: '{"choice":"all"}' },
]) {
  test(
    `invalid stored AdSense consent "${consent}" is ignored before ads render`,
    chromiumTestOptions(),
    async () => {
      const { adScriptRequests, browser, page, server } =
        await openStaticSiteWithStoredConsent(consent);

      try {
        const state = await page.evaluate(() => ({
          anchorHidden: document.querySelector('[data-ad-slot="anchor"]')?.hidden,
          events: window.__adsenseEvents,
          inlineHidden: document.querySelector('[data-ad-slot="inline"]')?.hidden,
          modalHidden: document.getElementById('consent')?.hidden,
          npa: window.adsbygoogle?.requestNonPersonalizedAds,
          storedConsent: window.localStorage.getItem('smt_consent'),
        }));

        assert.equal(state.modalHidden, false);
        assert.equal(state.storedConsent, null);
        assert.equal(state.inlineHidden, true);
        assert.equal(state.anchorHidden, true);
        assertOnlyExpectedAdSenseLoaderRequests(adScriptRequests);
        assert.deepEqual(state.events, []);
        assert.equal(state.npa, undefined);
      } finally {
        await browser.close();
        await server.close();
      }
    },
  );
}

test('static AdSense stored-consent source keeps NPA before load ordering explicit', () => {
  const source = fs.readFileSync(path.join(siteRoot, 'app.js'), 'utf8');
  const index = fs.readFileSync(path.join(siteRoot, 'index.html'), 'utf8');
  const extras = fs.readFileSync(path.join(siteRoot, 'i18n-extras.js'), 'utf8');
  const staticSurface = `${source}\n${index}\n${extras}`;

  assert.doesNotMatch(staticSurface, /data-ad-slot=["'](?:0{8,}|000000000[0-9])["']/);
  assert.doesNotMatch(
    staticSurface,
    /Replace ca-pub-XXX|data-ad-slot value with your AdSense IDs/i,
  );
  assert.doesNotMatch(
    staticSurface,
    /Your AdSense slot will render here|AdSense-yta visas här|Anchor ad slot|AdSense 广告将显示在此处|AdSense 廣告將顯示在此處|ستظهر إعلانات AdSense هنا|AdSense halkan ayey ka soo bixi doontaa/i,
  );

  assert.match(
    source,
    /slots:\s*{\s*['"]?inline['"]?:\s*['"]{2}\s*,\s*['"]?anchor['"]?:\s*['"]{2}/,
  );
  assert.match(source, /function smtIsRealAdSenseSlotId\(slotId\)/);
  assert.match(source, /function smtStaticAdsAreConfigured\(\)/);
  assert.match(source, /function smtAdSenseCanLoad\(\)/);
  assert.match(source, /function smtNormalizeConsent\(value\)/);
  assert.match(source, /const normalized = smtNormalizeConsent\(stored\);/);
  assert.match(source, /if \(stored && !normalized\) smtClearConsent\(\);/);
  assert.match(source, /if \(!smtAdSenseCanLoad\(\)\) {\s*smtHideConsent\(\);/);
  assert.match(source, /const canShowAds = !!consent && smtAdSenseCanLoad\(\);/);
  assert.match(source, /window\.adsbygoogle = window\.adsbygoogle \|\| \[\];/);
  assert.match(
    source,
    /window\.adsbygoogle\.requestNonPersonalizedAds\s*=\s*normalized === ['"]min['"] \? 1 : 0;/,
  );
  assert.ok(
    source.indexOf('window.adsbygoogle.requestNonPersonalizedAds') <
      source.indexOf('smtLoadAdSense();'),
    'requestNonPersonalizedAds must be assigned before smtLoadAdSense runs',
  );
});
