#!/usr/bin/env node

const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {
  findStaticHeadMetadataDescriptionIssues,
  formatUnsupportedStaticOutcomeSlogans,
} = require('./static-outcome-copy-guard');

const TIMEOUT_MS = Number(process.env.SITE_LIVE_TIMEOUT_MS || 15000);
const REPO_ROOT = path.join(__dirname, '..');
const LOCAL_SITE_DIR = path.join(REPO_ROOT, 'site');
const LOCAL_SITE_QUESTIONS_PATH = path.join(LOCAL_SITE_DIR, 'questions.js');
const DEFAULT_ASSET_MANIFEST_PATH = path.join(LOCAL_SITE_DIR, 'asset-manifest.json');
const REQUIRED_STATIC_ASSETS = [
  'index.html',
  'styles.css',
  'app.js',
  'practice.js',
  'ebook.js',
  'settings.js',
  'questions.js',
];

function normalizeBaseUrl(input) {
  const raw = String(input || process.env.SITE_LIVE_URL || '').trim();
  if (!raw) {
    throw new Error('Usage: SITE_LIVE_URL=https://... npm run test:site-live');
  }
  const url = new URL(raw);
  url.hash = '';
  url.search = '';
  return url.toString().replace(/\/$/, '');
}

async function fetchAsset(baseUrl, assetPath) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const url = `${baseUrl}/${assetPath.replace(/^\//, '')}`;

  try {
    const response = await fetch(url, { redirect: 'follow', signal: controller.signal });
    if (!response.ok) {
      throw new Error(`${url} returned HTTP ${response.status}`);
    }
    return { headers: response.headers, text: await response.text(), url };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchText(baseUrl, assetPath) {
  return (await fetchAsset(baseUrl, assetPath)).text;
}

function readStaticQuestionCount(source) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { timeout: 3000 });
  const questions = sandbox.window.SMT_QUESTIONS;
  if (!Array.isArray(questions)) return 0;
  return questions.length;
}

function hashStaticQuestionBank(source) {
  return crypto.createHash('sha256').update(String(source).replace(/\r\n/g, '\n')).digest('hex');
}

function hashStaticAsset(source) {
  return crypto.createHash('sha256').update(String(source).replace(/\r\n/g, '\n')).digest('hex');
}

function normalizeManifestPath(assetPath) {
  return String(assetPath || '').replace(/^\/+/, '');
}

function normalizeRequiredAssetManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('Static asset manifest must be an object');
  }
  if (manifest.algorithm !== 'sha256') {
    throw new Error('Static asset manifest algorithm must be sha256');
  }
  if (!manifest.assets || typeof manifest.assets !== 'object') {
    throw new Error('Static asset manifest must include an assets object');
  }

  const assets = {};
  for (const [assetPath, hash] of Object.entries(manifest.assets)) {
    const normalizedPath = normalizeManifestPath(assetPath);
    const normalizedHash = String(hash || '')
      .trim()
      .toLowerCase();
    if (!normalizedPath) {
      throw new Error('Static asset manifest includes an empty asset path');
    }
    if (!/^[0-9a-f]{64}$/.test(normalizedHash)) {
      throw new Error(`Static asset manifest hash for ${normalizedPath} must be SHA-256 hex`);
    }
    assets[normalizedPath] = normalizedHash;
  }

  for (const requiredAsset of REQUIRED_STATIC_ASSETS) {
    if (!assets[requiredAsset]) {
      throw new Error(`Static asset manifest is missing ${requiredAsset}`);
    }
  }

  return {
    version: manifest.version ?? 1,
    algorithm: 'sha256',
    assets,
  };
}

function readManifestFile(manifestPath) {
  const absolutePath = path.isAbsolute(manifestPath)
    ? manifestPath
    : path.join(REPO_ROOT, manifestPath);
  return normalizeRequiredAssetManifest(JSON.parse(fs.readFileSync(absolutePath, 'utf8')));
}

function resolveRequiredAssetManifest(options = {}) {
  if (options.requiredAssetManifest) {
    return normalizeRequiredAssetManifest(options.requiredAssetManifest);
  }

  if (process.env.SITE_LIVE_ASSET_MANIFEST_JSON) {
    return normalizeRequiredAssetManifest(JSON.parse(process.env.SITE_LIVE_ASSET_MANIFEST_JSON));
  }

  if (process.env.SITE_LIVE_ASSET_MANIFEST_PATH) {
    return readManifestFile(process.env.SITE_LIVE_ASSET_MANIFEST_PATH);
  }

  if (!fs.existsSync(DEFAULT_ASSET_MANIFEST_PATH)) {
    throw new Error(
      'Cannot derive expected live asset fingerprints; set SITE_LIVE_ASSET_MANIFEST_PATH',
    );
  }

  return readManifestFile(DEFAULT_ASSET_MANIFEST_PATH);
}

function resolveRequiredQuestionCount(options = {}) {
  if (Number.isInteger(options.requiredQuestionCount)) return options.requiredQuestionCount;

  if (process.env.SITE_LIVE_REQUIRED_QUESTION_COUNT) {
    const fromEnv = Number(process.env.SITE_LIVE_REQUIRED_QUESTION_COUNT);
    if (Number.isInteger(fromEnv) && fromEnv > 0) return fromEnv;
    throw new Error('SITE_LIVE_REQUIRED_QUESTION_COUNT must be a positive integer');
  }

  if (!fs.existsSync(LOCAL_SITE_QUESTIONS_PATH)) {
    throw new Error(
      'Cannot derive expected live question count; set SITE_LIVE_REQUIRED_QUESTION_COUNT',
    );
  }

  const fromLocalSite = readStaticQuestionCount(fs.readFileSync(LOCAL_SITE_QUESTIONS_PATH, 'utf8'));
  if (fromLocalSite <= 0) {
    throw new Error('Cannot derive expected live question count from site/questions.js');
  }
  return fromLocalSite;
}

function resolveRequiredQuestionBankHash(options = {}) {
  if (typeof options.requiredQuestionBankHash === 'string' && options.requiredQuestionBankHash) {
    return options.requiredQuestionBankHash.toLowerCase();
  }

  if (process.env.SITE_LIVE_REQUIRED_QUESTION_HASH) {
    const fromEnv = process.env.SITE_LIVE_REQUIRED_QUESTION_HASH.trim().toLowerCase();
    if (/^[0-9a-f]{64}$/.test(fromEnv)) return fromEnv;
    throw new Error('SITE_LIVE_REQUIRED_QUESTION_HASH must be a 64-character SHA-256 hex digest');
  }

  if (!fs.existsSync(LOCAL_SITE_QUESTIONS_PATH)) {
    throw new Error(
      'Cannot derive expected live question hash; set SITE_LIVE_REQUIRED_QUESTION_HASH',
    );
  }

  return hashStaticQuestionBank(fs.readFileSync(LOCAL_SITE_QUESTIONS_PATH, 'utf8'));
}

function pass(name, details = '') {
  return { name, ok: true, details };
}

function fail(name, details) {
  return { name, ok: false, details };
}

function containsAll(source, needles) {
  return needles.every((needle) => source.includes(needle));
}

function findStaticAdSenseSlotConfigIssues(indexSource, appSource) {
  const surface = `${indexSource}\n${appSource}`;
  const issues = [];
  const staleSetupPatterns = [
    /Replace ca-pub-XXX/i,
    /data-ad-slot value with your AdSense IDs/i,
    /data-ad-slot=["'](?:0{8,}|000000000[0-9])["']/i,
    /Your AdSense slot will render here/i,
    /AdSense-yta visas här/i,
    /Anchor ad slot/i,
    /AdSense 广告将显示在此处/,
    /AdSense 廣告將顯示在此處/,
    /ستظهر إعلانات AdSense هنا/,
    /AdSense halkan ayey ka soo bixi doontaa/i,
  ];

  for (const pattern of staleSetupPatterns) {
    if (pattern.test(surface)) {
      issues.push(`stale static AdSense setup or render copy: ${pattern.source}`);
    }
  }

  if (/ca-pub-[0-9]{16}/.test(surface)) {
    if (!/slots:\s*{[\s\S]*inline:[\s\S]*anchor:/m.test(appSource)) {
      issues.push('static AdSense publisher is present without an explicit slot config');
    }
    if (!/function\s+smtStaticAdsAreConfigured\s*\(/.test(appSource)) {
      issues.push('static AdSense publisher is present without a fail-closed config gate');
    }
    if (!/function\s+smtIsRealAdSenseSlotId\s*\(/.test(appSource)) {
      issues.push('static AdSense publisher is present without reviewed slot-id validation');
    }
  }

  return issues;
}

function normalizeHeaderValue(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ');
}

function findRequiredSecurityHeaderIssues(headers) {
  return REQUIRED_SECURITY_HEADERS.flatMap((expected) => {
    const actual = headers.get(expected.key);
    if (!actual) {
      return [`missing ${expected.name}`];
    }

    const normalizedActual = normalizeHeaderValue(actual).toLowerCase();
    const normalizedExpected = normalizeHeaderValue(expected.value).toLowerCase();
    if (normalizedActual !== normalizedExpected) {
      return [
        `${expected.name} expected "${expected.value}", found "${normalizeHeaderValue(actual)}"`,
      ];
    }

    return [];
  });
}

async function checkLiveSite(inputUrl, options = {}) {
  const baseUrl = normalizeBaseUrl(inputUrl);
  const requiredQuestionCount = resolveRequiredQuestionCount(options);
  const requiredQuestionBankHash = resolveRequiredQuestionBankHash(options);
  const requiredAssetManifest = resolveRequiredAssetManifest(options);
  const requiredAssetPaths = Array.from(
    new Set([...REQUIRED_STATIC_ASSETS, ...Object.keys(requiredAssetManifest.assets)]),
  );
  const fetchedAssets = Object.fromEntries(
    await Promise.all(
      requiredAssetPaths.map(async (assetPath) => [assetPath, await fetchText(baseUrl, assetPath)]),
    ),
  );
  const index = fetchedAssets['index.html'];
  const styles = fetchedAssets['styles.css'];
  const practice = fetchedAssets['practice.js'];
  const ebook = fetchedAssets['ebook.js'];
  const questions = fetchedAssets['questions.js'];

  const questionCount = readStaticQuestionCount(questions);
  const questionBankHash = hashStaticQuestionBank(questions);
  const checks = [];

  const staticSecurityHeaderIssues = findRequiredSecurityHeaderIssues(indexAsset.headers);
  checks.push(
    staticSecurityHeaderIssues.length === 0
      ? pass('static security headers')
      : fail('static security headers', staticSecurityHeaderIssues.join('; ')),
  );

  checks.push(
    questionCount === requiredQuestionCount
      ? pass('static question bank', `${questionCount} questions`)
      : fail('static question bank', `expected ${requiredQuestionCount}, found ${questionCount}`),
  );

  checks.push(
    questionBankHash === requiredQuestionBankHash
      ? pass('static question bank content', questionBankHash.slice(0, 12))
      : fail(
          'static question bank content',
          `expected ${requiredQuestionBankHash.slice(0, 12)}, found ${questionBankHash.slice(
            0,
            12,
          )}`,
        ),
  );

  const assetMismatches = Object.entries(requiredAssetManifest.assets)
    .map(([assetPath, expectedHash]) => ({
      assetPath,
      expectedHash,
      foundHash: hashStaticAsset(fetchedAssets[assetPath]),
    }))
    .filter(({ expectedHash, foundHash }) => expectedHash !== foundHash);
  checks.push(
    assetMismatches.length === 0
      ? pass(
          'static asset fingerprints',
          `${Object.keys(requiredAssetManifest.assets).length} assets`,
        )
      : fail(
          'static asset fingerprints',
          assetMismatches
            .map(
              ({ assetPath, expectedHash, foundHash }) =>
                `${assetPath} expected ${expectedHash.slice(0, 12)}, found ${foundHash.slice(
                  0,
                  12,
                )}`,
            )
            .join('; '),
        ),
  );

  checks.push(
    containsAll(index, [
      'data-page="/practice"',
      'practice__inner practice__inner--wide',
      'id="quiz-stage"',
      'questions.js',
      'practice.js',
    ]) && containsAll(practice, ['hub__grid', 'hub__card', 'href="#/mock"'])
      ? pass('practice hub assets')
      : fail('practice hub assets', 'missing current Practice route, script, or hub markup'),
  );

  const staticHeadMetadataDescriptionIssues = findStaticHeadMetadataDescriptionIssues(
    index,
    'index.html',
  );
  checks.push(
    staticHeadMetadataDescriptionIssues.length === 0
      ? pass('static head metadata description')
      : fail(
          'static head metadata description',
          formatUnsupportedStaticOutcomeSlogans(staticHeadMetadataDescriptionIssues),
        ),
  );

  const staticAdSenseIssues = findStaticAdSenseSlotConfigIssues(index, app);
  checks.push(
    staticAdSenseIssues.length === 0
      ? pass('static AdSense slot config')
      : fail('static AdSense slot config', staticAdSenseIssues.join('; ')),
  );

  checks.push(
    containsAll(styles, [
      '.practice__inner--wide',
      'max-width: 1080px',
      'grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))',
    ])
      ? pass('practice wide layout')
      : fail('practice wide layout', 'missing wide Practice shell or responsive hub grid CSS'),
  );

  checks.push(
    containsAll(index, ['data-page="/mock"', 'id="mock-stage"']) &&
      containsAll(practice, ['renderMockLanding', 'renderMockExam', 'renderMockResult'])
      ? pass('mock exam route assets')
      : fail('mock exam route assets', 'missing #/mock shell or mock exam renderer'),
  );

  checks.push(
    containsAll(index, ['ebook-tools.js', 'ebook.js']) &&
      containsAll(ebook, ['window.smtEbookRender', 'PRACTICE_LINKS'])
      ? pass('ebook renderer assets')
      : fail('ebook renderer assets', 'missing current Ebook helper or renderer wiring'),
  );

  const staleEbookPattern = /Svenska översättningen kommer|kommer i v1\.1|friendly stubs/i;
  checks.push(
    staleEbookPattern.test(ebook)
      ? fail('ebook placeholder copy', 'found stale Swedish placeholder or v1.1 stub copy')
      : pass('ebook placeholder copy'),
  );

  return { baseUrl, ok: checks.every((check) => check.ok), checks };
}

async function main() {
  const target = process.argv[2] || process.env.SITE_LIVE_URL;
  const result = await checkLiveSite(target);
  for (const check of result.checks) {
    const status = check.ok ? 'OK' : 'FAILED';
    const details = check.details ? ` - ${check.details}` : '';
    console.log(`${status} ${check.name}${details}`);
  }
  console.log(`${result.ok ? 'READY' : 'BLOCKED'} live site ${result.baseUrl}`);
  process.exit(result.ok ? 0 : 1);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exit(1);
  });
}

module.exports = {
  checkLiveSite,
  hashStaticAsset,
  hashStaticQuestionBank,
  normalizeBaseUrl,
  readStaticQuestionCount,
  resolveRequiredAssetManifest,
  resolveRequiredQuestionBankHash,
  resolveRequiredQuestionCount,
};
