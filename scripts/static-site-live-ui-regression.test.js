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
  if (filePath.endsWith('.png')) return 'image/png';
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

async function pageSnapshot(page) {
  return page.evaluate(() => {
    const boxFor = (selector) => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        bottom: rect.bottom,
        display: style.display,
        height: rect.height,
        hidden: node.hidden || style.display === 'none' || style.visibility === 'hidden',
        left: rect.left,
        pointerEvents: style.pointerEvents,
        right: rect.right,
        top: rect.top,
        width: rect.width,
      };
    };
    return {
      bodyScrollWidth: document.body.scrollWidth,
      documentClientWidth: document.documentElement.clientWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
      consent: boxFor('#consent'),
      consentAll: boxFor('#consent-all'),
      consentMin: boxFor('#consent-min'),
      buddy: boxFor('#dala-buddy'),
      buddyFigure: boxFor('#dala-figure'),
      purchaseGate: boxFor('#purchase-account-gate'),
      purchaseButtons: Array.from(document.querySelectorAll('[data-purchase-kind]')).map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          kind: node.getAttribute('data-purchase-kind'),
          locked: node.getAttribute('data-purchase-locked'),
          disabled: node.disabled,
          ariaDisabled: node.getAttribute('aria-disabled'),
          text: node.textContent.trim(),
          width: rect.width,
          left: rect.left,
          right: rect.right,
        };
      }),
    };
  });
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

function assertFitsViewport(box, viewportWidth, label) {
  assert.ok(box, `${label} should exist`);
  assert.ok(box.width > 0, `${label} should have width`);
  assert.ok(box.left >= 0, `${label} should not start off-screen`);
  assert.ok(box.right <= viewportWidth, `${label} should fit viewport`);
}

test('static auth and purchase source is production-domain and migration guarded', () => {
  const index = read('site/index.html');
  const signin = read('site/signin.js');
  const purchase = read('site/purchase.js');
  const migration = read('supabase/migrations/0002_purchase_intents.sql');
  const runbook = read('docs/release/auth-purchase-live-check.md');

  assert.match(index, /window\.SMT_SITE_ORIGIN\s*=\s*['"]https:\/\/almostswedish\.se['"]/);
  assert.match(signin, /function\s+redirectTarget\b/);
  assert.match(signin, /SMT_SITE_ORIGIN/);
  assert.doesNotMatch(signin, /localhost:3000/);
  assert.match(purchase, /purchase_intents/);
  assert.match(purchase, /PGRST205/);
  assert.match(purchase, /purchase\.status\.backendMissing/);
  assert.match(migration, /create table if not exists public\.purchase_intents/);
  assert.match(runbook, /Site URL: https:\/\/almostswedish\.se/);
});

test('cookie consent owns the lower-right corner until accepted, then buddy can appear', async (t) => {
  const server = await createStaticServer();
  let browser;

  try {
    browser = await launchStaticChromium(t, 'cookie mascot overlap guard');
    if (!browser) return;

    const page = await browser.newPage({ viewport: { width: 390, height: 840 } });
    await page.addInitScript(() => {
      window.localStorage.removeItem('smt_consent');
      window.localStorage.removeItem('smt_buddy_hidden');
      window.sessionStorage.removeItem('smt_buddy_greeted');
    });
    await page.goto(server.url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#consent:not([hidden])');

    const before = await pageSnapshot(page);
    assertNoHorizontalOverflow(before, 'cookie visible mobile layout');
    assertFitsViewport(before.consentAll, before.viewportWidth, 'accept-all cookie button');
    assertFitsViewport(before.consentMin, before.viewportWidth, 'necessary-only cookie button');
    assert.ok(before.buddy.hidden, 'buddy must be hidden while cookie consent is visible');

    await page.click('#consent-min');
    await page.waitForFunction(() => document.querySelector('#consent')?.hidden === true);
    await page.waitForFunction(() => {
      const buddy = document.querySelector('#dala-buddy');
      return buddy && !buddy.hidden && getComputedStyle(buddy).display !== 'none';
    });

    const after = await pageSnapshot(page);
    assertNoHorizontalOverflow(after, 'cookie accepted mobile layout');
    assert.ok(!after.buddy.hidden, 'buddy may appear after cookie choice');
    assertFitsViewport(after.buddyFigure, after.viewportWidth, 'buddy figure after consent');
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
});

test('narrow mobile layout keeps core buttons usable without squeezing or overflow', async (t) => {
  const server = await createStaticServer();
  let browser;

  try {
    browser = await launchStaticChromium(t, 'narrow responsive guard');
    if (!browser) return;

    const page = await browser.newPage({ viewport: { width: 320, height: 780 } });
    await page.addInitScript(() => {
      window.localStorage.setItem('smt_consent', 'min');
      window.localStorage.setItem('smt_buddy_hidden', '1');
    });
    await page.goto(server.url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#purchase-account-gate');

    const home = await pageSnapshot(page);
    assertNoHorizontalOverflow(home, '320px home layout');
    assertFitsViewport(home.purchaseGate, home.viewportWidth, 'purchase gate');
    assert.equal(home.purchaseButtons.length, 2, 'two purchase buttons should render');
    home.purchaseButtons.forEach((button) => {
      assert.equal(button.locked, 'true', `${button.kind} starts locked`);
      assert.equal(button.ariaDisabled, null, `${button.kind} locked button remains actionable`);
      assert.equal(
        button.disabled,
        false,
        `${button.kind} locked button remains enabled to open sign-in`,
      );
      assert.ok(button.width >= 44, `${button.kind} button should remain tappable`);
      assert.ok(
        button.left >= 0 && button.right <= home.viewportWidth,
        `${button.kind} fits viewport`,
      );
    });

    await page.click('[data-purchase-kind="remove_ads"]');
    const signinOpen = await page.locator('#signin-modal').evaluate((node) => !node.hidden);
    assert.equal(signinOpen, true, 'locked purchase button opens sign-in modal');

    await page.click('#signin-modal .modal__close');
    await page.click('#nav-toggle');
    const nav = await page.evaluate(() => ({
      expanded: document.getElementById('nav-toggle').getAttribute('aria-expanded'),
      links: Array.from(document.querySelectorAll('.nav a')).map((link) => {
        const rect = link.getBoundingClientRect();
        return {
          text: link.textContent.trim(),
          left: rect.left,
          right: rect.right,
          width: rect.width,
        };
      }),
      bodyScrollWidth: document.body.scrollWidth,
      documentClientWidth: document.documentElement.clientWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
    }));
    assert.equal(nav.expanded, 'true');
    assertNoHorizontalOverflow(nav, '320px open nav layout');
    nav.links.forEach((link) => {
      assert.ok(link.width >= 44, `${link.text} nav link should remain tappable`);
      assert.ok(link.left >= 0 && link.right <= 320, `${link.text} nav link fits viewport`);
    });
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
});
