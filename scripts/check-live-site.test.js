const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  checkLiveSite,
  extractStaticHeadMetadata,
  hashStaticQuestionBank,
  normalizeBaseUrl,
  readStaticQuestionCount,
  REQUIRED_SECURITY_HEADERS,
  resolveRequiredHeadMetadata,
  resolveRequiredQuestionBankHash,
  resolveRequiredQuestionCount,
} = require('./check-live-site');
const { checkAssetManifest, writeAssetManifest } = require('./update-site-asset-manifest');

const repoRoot = path.resolve(__dirname, '..');
const localHeadMetadata = resolveRequiredHeadMetadata();

function headMarkup(metadata = localHeadMetadata) {
  return [
    `<title>${metadata.title}</title>`,
    `<meta name="description" content="${metadata.description}" />`,
  ].join('\n');
}

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
      headMarkup(),
      '<button id="signin-open" type="button">Sign in</button>',
      '<section id="signin-modal" hidden></section>',
      '<main data-page="/practice"><div class="practice__inner practice__inner--wide"><div id="quiz-stage"></div></div></main>',
      '<main data-page="/mock"><div id="mock-stage"></div></main>',
      '<script src="practice.js"></script>',
      '<script src="ebook-tools.js"></script>',
      '<script src="ebook.js"></script>',
      '<script src="v11.js"></script>',
      '<script src="signin.js"></script>',
    ].join('\n'),
    '/styles.css': [
      '.practice__inner--wide { max-width: 1080px; }',
      '.hub__grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }',
    ].join('\n'),
    '/practice.js': [
      'window.smtEnsureQuestionBank && window.smtEnsureQuestionBank();',
      'function renderPracticeHub(){ return `<a class="hub__card" href="#/mock">hub__grid</a>`; }',
      'function renderMockLanding(){}',
      'function renderMockExam(){}',
      'function renderMockResult(){}',
    ].join('\n'),
    '/app.js': [
      'const SMT_QUESTION_BANK_SCRIPT_SRC = "questions.js";',
      'function smtEnsureQuestionBank(){}',
      'const SMT_ADS = { slots: { inline: "", anchor: "" } };',
      'function smtStaticAdsAreConfigured(){ return false; }',
      'function smtIsRealAdSenseSlotId(){ return false; }',
    ].join('\n'),
    '/ebook.js': 'const PRACTICE_LINKS = {}; window.smtEbookRender = function render() {};',
    '/v11.js': 'window.smtEnsureQuestionBank && window.smtEnsureQuestionBank();',
    '/questions.js': currentQuestionBank(),
    '/signin.js': "document.addEventListener('click', (e) => e.target.closest('#signin-open'));",
    '/asset-manifest.json': JSON.stringify({
      version: 1,
      assets: {
        'signin.js': { bytes: 76, sha256: 'fixture' },
      },
    }),
  };
}

function staleAssets() {
  return {
    '/index.html': '<main data-page="/"><div id="hero"></div></main>',
    '/styles.css': '.practice__inner { max-width: 720px; }',
    '/app.js': '',
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

function staleHeadAssets(replacement) {
  const assets = currentAssets();
  assets['/index.html'] = assets['/index.html'].replace(headMarkup(), headMarkup(replacement));
  return assets;
}

async function withStaticServer(assets, callback, options = {}) {
  const headers = { 'content-type': 'text/plain; charset=utf-8' };
  if (options.includeSecurityHeaders !== false) {
    for (const header of REQUIRED_SECURITY_HEADERS) {
      headers[header.name] = header.value;
    }
  }

  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    const body = assets[pathname] ?? assets['/index.html'];
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

test('extracts static head title and description metadata', () => {
  const metadata = extractStaticHeadMetadata(`
    <title>
      Almost Swedish — Study and practice.
    </title>
    <meta content="A friendly, unofficial study app." name="description" />
  `);
  assert.deepEqual(metadata, {
    title: 'Almost Swedish — Study and practice.',
    description: 'A friendly, unofficial study app.',
  });
});

test('derives the expected live head metadata from the local static index', () => {
  const metadata = resolveRequiredHeadMetadata();
  assert.equal(metadata.title, localHeadMetadata.title);
  assert.equal(metadata.description, localHeadMetadata.description);
  assert.match(metadata.title, /Almost Swedish/);
  assert.match(metadata.description, /unofficial study app/i);
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
  assert.equal(
    pkg.scripts['test:static-site-asset-references'],
    'node scripts/update-site-asset-manifest.js --check && node --test scripts/static-site-asset-references.test.js',
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

test('live site check rejects eager static question-bank loading', async () => {
  const assets = {
    ...currentAssets(),
    '/index.html': currentAssets()['/index.html'].replace(
      '<script src="practice.js"></script>',
      '<script src="questions.js"></script><script src="practice.js"></script>',
    ),
  };

  await withStaticServer(assets, async (baseUrl) => {
    const result = await checkLiveSite(baseUrl, {
      requiredQuestionBankHash: hashStaticQuestionBank(currentQuestionBank()),
      requiredQuestionCount: 715,
    });
    const failedCheck = result.checks.find(
      (check) => check.name === 'static question bank lazy loading',
    );

    assert.equal(result.ok, false);
    assert.equal(failedCheck?.ok, false);
    assert.match(failedCheck?.details ?? '', /eagerly loads questions\.js/);
  });
});

test('live site check rejects missing static question-bank loader wiring', async () => {
  const assets = {
    ...currentAssets(),
    '/app.js': currentAssets()['/app.js'].replace('function smtEnsureQuestionBank(){}', ''),
  };

  await withStaticServer(assets, async (baseUrl) => {
    const result = await checkLiveSite(baseUrl, {
      requiredQuestionBankHash: hashStaticQuestionBank(currentQuestionBank()),
      requiredQuestionCount: 715,
    });
    const failedCheck = result.checks.find(
      (check) => check.name === 'static question bank lazy loading',
    );

    assert.equal(result.ok, false);
    assert.equal(failedCheck?.ok, false);
    assert.match(failedCheck?.details ?? '', /missing smtEnsureQuestionBank/);
  });
});

test('live site check rejects signin.js missing from the static asset manifest', async () => {
  const assets = {
    ...currentAssets(),
    '/asset-manifest.json': JSON.stringify({ version: 1, assets: {} }),
  };

  await withStaticServer(assets, async (baseUrl) => {
    const result = await checkLiveSite(baseUrl, {
      requiredQuestionBankHash: hashStaticQuestionBank(currentQuestionBank()),
      requiredQuestionCount: 715,
    });
    const failedCheck = result.checks.find((check) => check.name === 'static sign-in assets');

    assert.equal(result.ok, false);
    assert.equal(failedCheck?.ok, false);
    assert.match(failedCheck?.details ?? '', /signin\.js.*missing from asset-manifest\.json/);
  });
});

test('live site check rejects signin.js without the visible sign-in trigger contract', async () => {
  const assets = {
    ...currentAssets(),
    '/index.html': currentAssets()['/index.html'].replace(
      '<button id="signin-open" type="button">Sign in</button>',
      '<button id="account-open" type="button">Sign in</button>',
    ),
    '/signin.js': "document.addEventListener('click', (e) => e.target.closest('#account-open'));",
  };

  await withStaticServer(assets, async (baseUrl) => {
    const result = await checkLiveSite(baseUrl, {
      requiredQuestionBankHash: hashStaticQuestionBank(currentQuestionBank()),
      requiredQuestionCount: 715,
    });
    const failedCheck = result.checks.find((check) => check.name === 'static sign-in assets');

    assert.equal(result.ok, false);
    assert.equal(failedCheck?.ok, false);
    assert.match(failedCheck?.details ?? '', /does not expose #signin-open/);
    assert.match(failedCheck?.details ?? '', /does not wire the #signin-open trigger/);
  });
});

test('live site check rejects unqualified no-tracking static copy', async () => {
  const staleApp = [
    currentAssets()['/app.js'],
    '"numbers.4": "to start. No login. No tracking.";',
    '"numbers.4": "att börja. Ingen inloggning. Ingen spårning.";',
  ].join('\n');

  await withStaticServer({ ...currentAssets(), '/app.js': staleApp }, async (baseUrl) => {
    const result = await checkLiveSite(baseUrl, {
      requiredQuestionBankHash: hashStaticQuestionBank(currentQuestionBank()),
      requiredQuestionCount: 715,
    });
    const failedCheck = result.checks.find(
      (check) => check.name === 'static privacy no-tracking copy',
    );
    assert.equal(result.ok, false);
    assert.equal(failedCheck?.ok, false);
    assert.match(failedCheck?.details ?? '', /No tracking/);
    assert.match(failedCheck?.details ?? '', /Ingen spårning/);
  });
});

test('live site check rejects current-use AdSense copy when slots are unconfigured', async () => {
  const staleApp = [
    currentAssets()['/app.js'],
    "'privacy.s5.p': 'This website uses Google AdSense.';",
    "'privacy.s5.p': 'Den här webbplatsen använder Google AdSense.';",
    "'consent.body': 'We use Google AdSense to show a couple of ads.';",
    "'consent.body': 'Vi använder Google AdSense för att visa ett par annonser.';",
  ].join('\n');

  await withStaticServer({ ...currentAssets(), '/app.js': staleApp }, async (baseUrl) => {
    const result = await checkLiveSite(baseUrl, {
      requiredQuestionBankHash: hashStaticQuestionBank(currentQuestionBank()),
      requiredQuestionCount: 715,
    });
    const failedCheck = result.checks.find(
      (check) => check.name === 'static AdSense slot-state copy',
    );
    assert.equal(result.ok, false);
    assert.equal(failedCheck?.ok, false);
    assert.match(failedCheck?.details ?? '', /reviewed web slot IDs are not configured/);
    assert.match(failedCheck?.details ?? '', /Google AdSense/);
  });
});

test('live site check rejects static team credential claims', async () => {
  const staleAssetsWithCredentialClaim = currentAssets();
  staleAssetsWithCredentialClaim['/index.html'] = [
    staleAssetsWithCredentialClaim['/index.html'],
    "An independent study tool, built by people who've taken the test themselves.",
  ].join('\n');
  staleAssetsWithCredentialClaim['/app.js'] = [
    staleAssetsWithCredentialClaim['/app.js'],
    "'footer.about.p': 'Ett verktyg från personer som själva har gjort provet.'",
  ].join('\n');

  await withStaticServer(staleAssetsWithCredentialClaim, async (baseUrl) => {
    const result = await checkLiveSite(baseUrl, {
      requiredQuestionBankHash: hashStaticQuestionBank(currentQuestionBank()),
      requiredQuestionCount: 715,
    });
    const failedCheck = result.checks.find((check) => check.name === 'static team credential copy');
    assert.equal(result.ok, false);
    assert.equal(failedCheck?.ok, false);
    assert.match(failedCheck?.details ?? '', /taken the test themselves/);
    assert.match(failedCheck?.details ?? '', /själva har gjort provet/);
  });
});

test('live site check rejects static MVP release copy', async () => {
  const staleIndex = [
    currentAssets()['/index.html'],
    '<p>No. The MVP needs zero registration.</p>',
    '<span data-i18n="privacy.meta2.v">1.0 MVP</span>',
  ].join('\n');

  await withStaticServer({ ...currentAssets(), '/index.html': staleIndex }, async (baseUrl) => {
    const result = await checkLiveSite(baseUrl, {
      requiredQuestionBankHash: hashStaticQuestionBank(currentQuestionBank()),
      requiredQuestionCount: 715,
    });
    const failedCheck = result.checks.find((check) => check.name === 'static release copy');
    assert.equal(result.ok, false);
    assert.equal(failedCheck?.ok, false);
    assert.match(failedCheck?.details ?? '', /MVP release label/);
    assert.match(failedCheck?.details ?? '', /"MVP"/);
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
        'static head metadata',
        'practice hub assets',
        'static question bank lazy loading',
        'practice wide layout',
        'mock exam route assets',
        'ebook renderer assets',
        'ebook placeholder copy',
      ],
    );
  });
});

test('live site check rejects stale live head titles', async () => {
  await withStaticServer(
    staleHeadAssets({
      ...localHeadMetadata,
      title: 'Almost Swedish - stale search title',
    }),
    async (baseUrl) => {
      const result = await checkLiveSite(baseUrl, {
        requiredQuestionBankHash: hashStaticQuestionBank(currentQuestionBank()),
        requiredQuestionCount: 715,
      });
      assert.equal(result.ok, false);
      assert.deepEqual(
        result.checks.filter((check) => !check.ok).map((check) => check.name),
        ['static head metadata'],
      );
    },
  );
});

test('live site check rejects pass-outcome head titles even when they match the expected stale title', async () => {
  await withStaticServer(
    staleHeadAssets({
      ...localHeadMetadata,
      title: 'Almost Swedish — Study, fika, pass.',
    }),
    async (baseUrl) => {
      const result = await checkLiveSite(baseUrl, {
        requiredHeadMetadata: {
          ...localHeadMetadata,
          title: 'Almost Swedish — Study, fika, pass.',
        },
        requiredQuestionBankHash: hashStaticQuestionBank(currentQuestionBank()),
        requiredQuestionCount: 715,
      });
      assert.equal(result.ok, false);
      assert.deepEqual(
        result.checks.filter((check) => !check.ok).map((check) => check.name),
        ['static head metadata'],
      );
      assert.match(
        result.checks.find((check) => check.name === 'static head metadata')?.details ?? '',
        /Study,\s*fika,\s*pass/,
      );
    },
  );
});

test('live site check rejects stale live meta descriptions', async () => {
  await withStaticServer(
    staleHeadAssets({
      ...localHeadMetadata,
      description: 'A neutral but stale deployed search description.',
    }),
    async (baseUrl) => {
      const result = await checkLiveSite(baseUrl, {
        requiredQuestionBankHash: hashStaticQuestionBank(currentQuestionBank()),
        requiredQuestionCount: 715,
      });
      assert.equal(result.ok, false);
      assert.deepEqual(
        result.checks.filter((check) => !check.ok).map((check) => check.name),
        ['static head metadata'],
      );
    },
  );
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
