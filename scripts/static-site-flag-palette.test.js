const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const test = require('node:test');
const { launchStaticChromium } = require('./static-browser-support');

const repoRoot = path.resolve(__dirname, '..');
const siteRoot = path.join(repoRoot, 'site');
const officialBlue = 'rgb(0, 106, 167)';
const officialGold = 'rgb(254, 204, 0)';
const palettes = ['flag', 'midsommar', 'falu', 'skargard', 'norrsken'];
const themes = ['light', 'dark'];

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

test('static Swedish flag surfaces keep official colors across palettes and themes', async (t) => {
  const server = await createStaticServer();
  let browser;

  try {
    browser = await launchStaticChromium(t, 'static Swedish flag palette guard');
    if (!browser) return;

    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(server.url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof window.smtApplyPalette === 'function');
    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll('.brand__mark, .ebook__brand-mark')).every(
        (node) => !(node instanceof HTMLImageElement) || (node.complete && node.naturalWidth > 0),
      ),
    );

    const logoSnapshot = await page.evaluate(() => {
      const logoFor = (selector) => {
        const node = document.querySelector(selector);
        if (!(node instanceof HTMLImageElement)) throw new Error(`Missing image ${selector}`);
        return {
          height: node.naturalHeight,
          src: node.getAttribute('src') || '',
          width: node.naturalWidth,
        };
      };

      return {
        brand: logoFor('.brand__mark'),
        ebook: logoFor('.ebook__brand-mark'),
      };
    });

    for (const [name, logo] of Object.entries(logoSnapshot)) {
      assert.match(logo.src, /assets\/logo-mark\.png$/, `${name} logo uses the fixed logo asset`);
      assert.ok(logo.width > 0 && logo.height > 0, `${name} logo image loads`);
    }

    for (const theme of themes) {
      for (const palette of palettes) {
        const snapshot = await page.evaluate(
          ({ nextPalette, nextTheme }) => {
            window.smtApplyTheme(nextTheme);
            window.smtApplyPalette(nextPalette);
            const styleFor = (selector, pseudo) => {
              const node = document.querySelector(selector);
              if (!node) throw new Error(`Missing ${selector}`);
              return getComputedStyle(node, pseudo || null).backgroundColor;
            };

            return {
              heroCrossHorizontal: styleFor('.hero__cross', '::after'),
              heroCrossVertical: styleFor('.hero__cross', '::before'),
              mutableBlue: getComputedStyle(document.documentElement)
                .getPropertyValue('--blue')
                .trim(),
              mutableGold: getComputedStyle(document.documentElement)
                .getPropertyValue('--gold')
                .trim(),
              fixedBlue: getComputedStyle(document.documentElement)
                .getPropertyValue('--flag-blue')
                .trim(),
              fixedGold: getComputedStyle(document.documentElement)
                .getPropertyValue('--flag-gold')
                .trim(),
            };
          },
          { nextPalette: palette, nextTheme: theme },
        );

        assert.equal(snapshot.fixedBlue, '#006aa7', `${theme}/${palette} fixed blue token`);
        assert.equal(snapshot.fixedGold, '#fecc00', `${theme}/${palette} fixed gold token`);
        assert.equal(
          snapshot.heroCrossHorizontal,
          officialBlue,
          `${theme}/${palette} hero cross horizontal`,
        );
        assert.equal(
          snapshot.heroCrossVertical,
          officialBlue,
          `${theme}/${palette} hero cross vertical`,
        );

        if (palette !== 'flag') {
          assert.notEqual(snapshot.mutableBlue, '#006aa7', `${theme}/${palette} mutates UI blue`);
          assert.notEqual(snapshot.mutableGold, '#fecc00', `${theme}/${palette} mutates UI gold`);
        }
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }
    await server.close();
  }
});
