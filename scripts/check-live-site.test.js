const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  checkLiveSite,
  hashStaticQuestionBank,
  normalizeBaseUrl,
  readStaticQuestionCount,
  REQUIRED_SECURITY_HEADERS,
  resolveRequiredQuestionBankHash,
  resolveRequiredQuestionCount,
} = require('./check-live-site');
const { checkAssetManifest, writeAssetManifest } = require('./update-site-asset-manifest');

const repoRoot = path.resolve(__dirname, '..');
const SECURITY_RESPONSE_HEADERS = Object.fromEntries(
  REQUIRED_SECURITY_HEADERS.map((header) => [header.name, header.value]),
);

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
    '/practice.js': [
      'function renderPracticeHub(){ return `<a class="hub__card" href="#/mock">hub__grid</a>`; }',
      'function renderMockLanding(){}',
      'function renderMockExam(){}',
      'function renderMockResult(){}',
    ].join('\n'),
    '/ebook.js': 'const PRACTICE_LINKS = {}; window.smtEbookRender = function render() {};',
    '/questions.js': currentQuestionBank(),
  };
}

function staleAssets() {
  return {
    '/index.html': '<main data-page="/"><div id="hero"></div></main>',
    '/styles.css': '.practice__inner { max-width: 720px; }',
    '/practice.js': 'function renderPractice(){ return "old"; }',
    '/ebook.js': 'const copy = "Svenska översättningen kommer i v1.1";',
    '/questions.js': generatedQuestions(57, 'stale'),
  };
}

function sameCountStaleAssets() {
  return {
    ...currentAssets(),
    '/questions.js': generatedQuestions(715, 'stale'),
  };
}

async function withStaticServer(assets, callback, options = {}) {
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

test('site asset manifest generator writes and checks deterministic static fingerprints', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  assert.equal(
    pkg.scripts['update:site-asset-manifest'],
    'node scripts/update-site-asset-manifest.js',
  );

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'site-asset-manifest-'));
  const siteDir = path.join(tmpDir, 'site');
  const manifestPath = path.join(siteDir, 'asset-manifest.json');
  fs.mkdirSync(siteDir, { recursive: true });
  fs.writeFileSync(path.join(siteDir, 'index.html'), '<main>Almost Swedish</main>\n');
  fs.writeFileSync(path.join(siteDir, 'styles.css'), '.practice__inner { max-width: 1080px; }\n');

  const first = writeAssetManifest({ siteDir, manifestPath });
  const second = writeAssetManifest({ siteDir, manifestPath });
  assert.deepEqual(second, first);
  assert.equal(checkAssetManifest({ siteDir, manifestPath }).ok, true);

  fs.appendFileSync(path.join(siteDir, 'styles.css'), '.stale { color: red; }\n');
  const staleResult = checkAssetManifest({ siteDir, manifestPath });
  assert.equal(staleResult.ok, false);
  assert.match(staleResult.mismatches.join('\n'), /styles\.css/);

  writeAssetManifest({ siteDir, manifestPath });
  assert.equal(checkAssetManifest({ siteDir, manifestPath }).ok, true);
});

test('live site check passes current static assets', async () => {
  await withStaticServer(currentAssets(), async (baseUrl) => {
    const result = await checkLiveSite(baseUrl, {
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
  await withStaticServer(staleAssets(), async (baseUrl) => {
    const result = await checkLiveSite(baseUrl, {
      requiredQuestionBankHash: hashStaticQuestionBank(currentQuestionBank()),
      requiredQuestionCount: 715,
    });
    assert.equal(result.ok, false);
    assert.deepEqual(
      result.checks.filter((check) => !check.ok).map((check) => check.name),
      [
        'static question bank',
        'static question bank content',
        'practice hub assets',
        'static head metadata description',
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

test('live site check rejects same-count stale question banks', async () => {
  await withStaticServer(sameCountStaleAssets(), async (baseUrl) => {
    const result = await checkLiveSite(baseUrl, {
      requiredQuestionBankHash: hashStaticQuestionBank(currentQuestionBank()),
      requiredQuestionCount: 715,
    });
    assert.equal(result.ok, false);
    assert.deepEqual(
      result.checks.filter((check) => !check.ok).map((check) => check.name),
      ['static question bank content'],
    );
  });
});
