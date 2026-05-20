const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const test = require('node:test');

const {
  checkLiveSite,
  hashStaticAsset,
  hashStaticQuestionBank,
  normalizeBaseUrl,
  readStaticQuestionCount,
  resolveRequiredAssetManifest,
  resolveRequiredQuestionBankHash,
  resolveRequiredQuestionCount,
} = require('./check-live-site');
const { checkAssetManifest, writeAssetManifest } = require('./update-site-asset-manifest');

const repoRoot = path.resolve(__dirname, '..');
const SECURITY_RESPONSE_HEADERS = Object.fromEntries(
  REQUIRED_SECURITY_HEADERS.map((header) => [header.name, header.value]),
);

const repoRoot = path.resolve(__dirname, '..');
const manifestAssetPaths = [
  'index.html',
  'styles.css',
  'app.js',
  'practice.js',
  'ebook.js',
  'settings.js',
  'questions.js',
];

function generatedQuestions(count, label = 'current') {
  const questions = Array.from({ length: count }, (_, index) => ({
    id: `q${index + 1}`,
    why: index === 17 ? `${label} q018 explanation` : `${label} explanation`,
  }));
  return [
    '(function () {',
    '  "use strict";',
    `  window.SMT_QUESTIONS = ${JSON.stringify(questions)};`,
    '})();',
    '',
  ].join('\n');
}

function currentQuestionBank() {
  return generatedQuestions(715, 'current');
}

function currentAssets() {
  return {
    '/index.html': [
      '<head>',
      '<meta name="description" content="A friendly, unofficial study app for Swedish citizenship test practice.">',
      '</head>',
      '<main data-page="/practice"><div class="practice__inner practice__inner--wide"><div id="quiz-stage"></div></div></main>',
      '<main data-page="/mock"><div id="mock-stage"></div></main>',
      '<script src="questions.js"></script>',
      '<script src="practice.js"></script>',
      '<script src="ebook-tools.js"></script>',
      '<script src="ebook.js"></script>',
    ].join('\n'),
    '/styles.css': [
      '.practice__inner--wide { max-width: 1080px; }',
      '.hub__grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }',
    ].join('\n'),
    '/app.js': 'window.smtApp = { renderAppShell() { return "current app"; } };',
    '/practice.js': [
      'function renderPracticeHub(){ return `<a class="hub__card" href="#/mock">hub__grid</a>`; }',
      'function renderMockLanding(){}',
      'function renderMockExam(){}',
      'function renderMockResult(){}',
    ].join('\n'),
    '/ebook.js': 'const PRACTICE_LINKS = {}; window.smtEbookRender = function render() {};',
    '/settings.js': 'window.smtSettings = { renderSettings() { return "current settings"; } };',
    '/questions.js': currentQuestionBank(),
  };
}

function staleAssets() {
  return {
    '/index.html': '<main data-page="/"><div id="hero"></div></main>',
    '/styles.css': '.practice__inner { max-width: 720px; }',
    '/app.js': 'window.smtApp = { renderAppShell() { return "stale app"; } };',
    '/practice.js': 'function renderPractice(){ return "old"; }',
    '/ebook.js': 'const copy = "Svenska översättningen kommer i v1.1";',
    '/settings.js': 'window.smtSettings = { renderSettings() { return "stale settings"; } };',
    '/questions.js': generatedQuestions(57, 'stale'),
  };
}

function sameCountStaleAssets() {
  return {
    ...currentAssets(),
    '/questions.js': generatedQuestions(715, 'stale'),
  };
}

function assetManifestFor(assets) {
  return {
    version: 1,
    algorithm: 'sha256',
    assets: Object.fromEntries(
      manifestAssetPaths.map((assetPath) => [assetPath, hashStaticAsset(assets[`/${assetPath}`])]),
    ),
  };
}

async function withStaticServer(assets, callback) {
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    const body = assets[pathname] ?? assets['/index.html'];
    const headers = {
      'content-type': 'text/plain; charset=utf-8',
      ...(options.includeSecurityHeaders === false ? {} : SECURITY_RESPONSE_HEADERS),
      ...(options.headers ?? {}),
    };
    response.writeHead(body == null ? 404 : 200, headers);
    response.end(body ?? 'not found');
  });

  return new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', async () => {
      const { port } = server.address();
      try {
        resolve(await callback(`http://127.0.0.1:${port}`));
      } catch (error) {
        reject(error);
      } finally {
        server.close();
      }
    });
  });
}

test('normalizes production URL inputs', () => {
  assert.equal(normalizeBaseUrl('https://example.com/#/practice'), 'https://example.com');
  assert.equal(normalizeBaseUrl('https://example.com/path/?x=1'), 'https://example.com/path');
});

test('reads the generated static question count', () => {
  assert.equal(readStaticQuestionCount(currentQuestionBank()), 715);
});

test('derives the expected live count from the local generated site bank', () => {
  const count = resolveRequiredQuestionCount();
  assert.ok(count >= 715);
});

test('derives the expected live bank hash from the local generated site bank', () => {
  const hash = resolveRequiredQuestionBankHash();
  assert.match(hash, /^[0-9a-f]{64}$/);
});

test('committed static asset manifest matches local site assets', () => {
  const manifest = resolveRequiredAssetManifest();

  assert.deepEqual(Object.keys(manifest.assets), manifestAssetPaths);
  for (const assetPath of manifestAssetPaths) {
    const localAsset = fs.readFileSync(path.join(repoRoot, 'site', assetPath), 'utf8');
    assert.equal(manifest.assets[assetPath], hashStaticAsset(localAsset), assetPath);
  }
});

test('live site check passes current static assets', async () => {
  const assets = currentAssets();
  await withStaticServer(currentAssets(), async (baseUrl) => {
    const result = await checkLiveSite(baseUrl, {
      requiredAssetManifest: assetManifestFor(assets),
      requiredQuestionBankHash: hashStaticQuestionBank(currentQuestionBank()),
      requiredQuestionCount: 715,
    });
    assert.equal(result.ok, true);
    assert.equal(
      result.checks.every((check) => check.ok),
      true,
    );
  });
});

test('live site check rejects missing static security headers', async () => {
  await withStaticServer(
    currentAssets(),
    async (baseUrl) => {
      const result = await checkLiveSite(baseUrl, {
        requiredQuestionBankHash: hashStaticQuestionBank(currentQuestionBank()),
        requiredQuestionCount: 715,
      });
      const failedCheck = result.checks.find((check) => check.name === 'static security headers');
      assert.equal(result.ok, false);
      assert.equal(failedCheck?.ok, false);
      assert.match(failedCheck?.details ?? '', /missing X-Content-Type-Options/);
      assert.match(failedCheck?.details ?? '', /missing Referrer-Policy/);
      assert.match(failedCheck?.details ?? '', /missing X-Frame-Options/);
      assert.match(failedCheck?.details ?? '', /missing Permissions-Policy/);
    },
    { includeSecurityHeaders: false },
  );
});

test('live site check rejects stale deploy assets', async () => {
  const assets = currentAssets();
  await withStaticServer(staleAssets(), async (baseUrl) => {
    const result = await checkLiveSite(baseUrl, {
      requiredAssetManifest: assetManifestFor(assets),
      requiredQuestionBankHash: hashStaticQuestionBank(currentQuestionBank()),
      requiredQuestionCount: 715,
    });
    assert.equal(result.ok, false);
    assert.deepEqual(
      result.checks.filter((check) => !check.ok).map((check) => check.name),
      [
        'static question bank',
        'static question bank content',
        'static asset fingerprints',
        'practice hub assets',
        'static head metadata description',
        'static AdSense slot config',
        'practice wide layout',
        'mock exam route assets',
        'ebook renderer assets',
        'ebook placeholder copy',
      ],
    );
  });
});

test('live site check rejects missing, blank, or outcome meta descriptions', async () => {
  const cases = [
    {
      label: 'missing description',
      indexHtml: currentAssets()['/index.html'].replace(
        /<meta name="description" content="[^"]+">\n/,
        '',
      ),
      expectedDetails: /missing static meta description/,
    },
    {
      label: 'blank description',
      indexHtml: currentAssets()['/index.html'].replace(
        /<meta name="description" content="[^"]+">/,
        '<meta name="description" content="">',
      ),
      expectedDetails: /blank static meta description/,
    },
    {
      label: 'outcome description',
      indexHtml: currentAssets()['/index.html'].replace(
        /<meta name="description" content="[^"]+">/,
        '<meta name="description" content="Pass the test.">',
      ),
      expectedDetails: /static meta description English pass-the-test slogan/,
    },
  ];

  for (const { indexHtml, expectedDetails, label } of cases) {
    await withStaticServer({ ...currentAssets(), '/index.html': indexHtml }, async (baseUrl) => {
      const result = await checkLiveSite(baseUrl, {
        requiredQuestionBankHash: hashStaticQuestionBank(currentQuestionBank()),
        requiredQuestionCount: 715,
      });
      const failedCheck = result.checks.find(
        (check) => check.name === 'static head metadata description',
      );
      assert.equal(result.ok, false, `${label} should fail live-site validation`);
      assert.equal(failedCheck?.ok, false, `${label} should fail the metadata check`);
      assert.match(failedCheck?.details ?? '', expectedDetails);
    });
  }
});

test('live site check rejects placeholder static AdSense slot IDs', async () => {
  const placeholderIndex = [
    currentAssets()['/index.html'],
    '<ins class="adsbygoogle" data-ad-client="ca-pub-2451892671779738" data-ad-slot="0000000001"></ins>',
    '<p>Your AdSense slot will render here.</p>',
  ].join('\n');

  await withStaticServer(
    {
      ...currentAssets(),
      '/index.html': placeholderIndex,
      '/app.js': 'const SMT_ADS = { publisherId: "ca-pub-2451892671779738" };',
    },
    async (baseUrl) => {
      const result = await checkLiveSite(baseUrl, {
        requiredQuestionBankHash: hashStaticQuestionBank(currentQuestionBank()),
        requiredQuestionCount: 715,
      });
      const failedCheck = result.checks.find(
        (check) => check.name === 'static AdSense slot config',
      );
      assert.equal(result.ok, false);
      assert.equal(failedCheck?.ok, false);
      assert.match(failedCheck?.details ?? '', /data-ad-slot/);
      assert.match(failedCheck?.details ?? '', /Your AdSense slot will render here/);
      assert.match(failedCheck?.details ?? '', /without an explicit slot config/);
    },
  );
});

test('live site check rejects same-count stale question banks', async () => {
  const assets = currentAssets();
  await withStaticServer(sameCountStaleAssets(), async (baseUrl) => {
    const result = await checkLiveSite(baseUrl, {
      requiredAssetManifest: assetManifestFor(assets),
      requiredQuestionBankHash: hashStaticQuestionBank(currentQuestionBank()),
      requiredQuestionCount: 715,
    });
    assert.equal(result.ok, false);
    assert.deepEqual(
      result.checks.filter((check) => !check.ok).map((check) => check.name),
      ['static question bank content', 'static asset fingerprints'],
    );
  });
});

for (const assetPath of manifestAssetPaths) {
  test(`live site check rejects stale ${assetPath} with current question count`, async () => {
    const assets = currentAssets();
    const staleAssetSet = {
      ...assets,
      [`/${assetPath}`]: `${assets[`/${assetPath}`]}\n/* stale deploy asset */`,
    };

    await withStaticServer(staleAssetSet, async (baseUrl) => {
      const result = await checkLiveSite(baseUrl, {
        requiredAssetManifest: assetManifestFor(assets),
        requiredQuestionBankHash: hashStaticQuestionBank(currentQuestionBank()),
        requiredQuestionCount: 715,
      });
      const fingerprintCheck = result.checks.find(
        (check) => check.name === 'static asset fingerprints',
      );

      assert.equal(result.ok, false);
      assert.equal(fingerprintCheck?.ok, false);
      assert.match(fingerprintCheck?.details ?? '', new RegExp(assetPath.replace('.', '\\.')));
    });
  });
}
