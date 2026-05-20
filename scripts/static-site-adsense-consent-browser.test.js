const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const test = require('node:test');
const { chromium } = require('@playwright/test');

const repoRoot = path.resolve(__dirname, '..');
const siteRoot = path.join(repoRoot, 'site');

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

async function openStaticSiteWithStoredConsent(consent) {
  const server = await createStaticServer();
  const browser = await chromium.launch(chromiumLaunchOptions());
  const page = await browser.newPage({ viewport: { width: 390, height: 840 } });
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
            placement: node.getAttribute('data-smt-ad-placement'),
            slot: node.getAttribute('data-ad-slot'),
          })),
          anchorHidden: document.querySelector('[data-ad-slot="anchor"]')?.hidden,
          events: window.__adsenseEvents,
          inlineHidden: document.querySelector('[data-ad-slot="inline"]')?.hidden,
          modalHidden: document.getElementById('consent')?.hidden,
          storedConsent: window.localStorage.getItem('smt_consent'),
        }));

        assert.equal(firstLoad.modalHidden, true);
        assert.equal(firstLoad.storedConsent, consent);
        assert.equal(adScriptRequests.length, 0);
        assert.equal(firstLoad.inlineHidden, true);
        assert.equal(firstLoad.anchorHidden, true);
        assert.deepEqual(firstLoad.events, []);
        assert.deepEqual(firstLoad.adPlacements, [
          { placement: 'inline', slot: null },
          { placement: 'anchor', slot: null },
        ]);

        await page.reload({ waitUntil: 'domcontentloaded' });

        const afterReload = await page.evaluate(() => ({
          dataNpa: Array.from(document.querySelectorAll('ins.adsbygoogle')).map((node) =>
            node.getAttribute('data-npa'),
          ),
          anchorHidden: document.querySelector('[data-ad-slot="anchor"]')?.hidden,
          events: window.__adsenseEvents,
          inlineHidden: document.querySelector('[data-ad-slot="inline"]')?.hidden,
          modalHidden: document.getElementById('consent')?.hidden,
          npa: window.adsbygoogle?.requestNonPersonalizedAds,
          storedConsent: window.localStorage.getItem('smt_consent'),
        }));

        assert.equal(afterReload.modalHidden, true);
        assert.equal(afterReload.storedConsent, consent);
        assert.equal(afterReload.inlineHidden, true);
        assert.equal(afterReload.anchorHidden, true);
        assert.equal(adScriptRequests.length, 0);
        assert.deepEqual(afterReload.events, []);
        assert.deepEqual(afterReload.dataNpa, [null, null]);
        assert.equal(afterReload.npa, undefined);
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
  assert.match(source, /if \(!smtStaticAdsAreConfigured\(\)\) {\s*smtHideConsent\(\);/);
  assert.match(source, /window\.adsbygoogle = window\.adsbygoogle \|\| \[\];/);
  assert.match(
    source,
    /window\.adsbygoogle\.requestNonPersonalizedAds\s*=\s*choice === ['"]min['"] \? 1 : 0;/,
  );
  assert.ok(
    source.indexOf('window.adsbygoogle.requestNonPersonalizedAds') <
      source.indexOf('smtLoadAdSense();'),
    'requestNonPersonalizedAds must be assigned before smtLoadAdSense runs',
  );
});
