#!/usr/bin/env node

const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {
  findStaticHeadMetadataDescriptionIssues,
  findStaticHeadMetadataTitleIssues,
  findUnsupportedStaticTeamCredentialClaimsInSource,
  formatUnsupportedStaticTeamCredentialClaims,
  formatUnsupportedStaticOutcomeSlogans,
} = require('./static-outcome-copy-guard');
const {
  findUnsupportedStaticReleaseCopyInSource,
  formatUnsupportedStaticReleaseCopy,
} = require('./static-site-release-copy-guard');
const {
  findStaticAdSenseSlotStateCopyIssues,
  staticAdSenseSlotsAreConfiguredInSource,
} = require('./static-adsense-slot-state');

const TIMEOUT_MS = Number(process.env.SITE_LIVE_TIMEOUT_MS || 15000);
const LOCAL_SITE_INDEX_PATH = path.join(__dirname, '..', 'site', 'index.html');
const LOCAL_SITE_QUESTIONS_PATH = path.join(__dirname, '..', 'site', 'questions.js');
const PERMISSIONS_POLICY_VALUE = [
  'accelerometer=()',
  'autoplay=()',
  'bluetooth=()',
  'camera=()',
  'display-capture=()',
  'encrypted-media=()',
  'fullscreen=()',
  'geolocation=()',
  'gyroscope=()',
  'hid=()',
  'idle-detection=()',
  'local-fonts=()',
  'magnetometer=()',
  'microphone=()',
  'midi=()',
  'payment=()',
  'publickey-credentials-get=()',
  'screen-wake-lock=()',
  'serial=()',
  'usb=()',
  'xr-spatial-tracking=()',
].join(', ');
const REQUIRED_SECURITY_HEADERS = [
  {
    key: 'x-content-type-options',
    name: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'referrer-policy',
    name: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'x-frame-options',
    name: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'permissions-policy',
    name: 'Permissions-Policy',
    value: PERMISSIONS_POLICY_VALUE,
  },
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

function normalizeHtmlMetadataValue(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function readHtmlAttribute(tag, attribute) {
  const pattern = new RegExp(`\\b${attribute}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i');
  const match = String(tag || '').match(pattern);
  return match ? normalizeHtmlMetadataValue(match[2]) : '';
}

function extractStaticHeadMetadata(source) {
  const html = String(source || '');
  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? normalizeHtmlMetadataValue(titleMatch[1]) : '';
  const descriptionTag = (html.match(/<meta\b[^>]*>/gi) || []).find(
    (tag) => readHtmlAttribute(tag, 'name').toLowerCase() === 'description',
  );
  const description = descriptionTag ? readHtmlAttribute(descriptionTag, 'content') : '';
  return { title, description };
}

function resolveRequiredHeadMetadata(options = {}) {
  if (
    options.requiredHeadMetadata &&
    typeof options.requiredHeadMetadata.title === 'string' &&
    typeof options.requiredHeadMetadata.description === 'string'
  ) {
    return {
      title: normalizeHtmlMetadataValue(options.requiredHeadMetadata.title),
      description: normalizeHtmlMetadataValue(options.requiredHeadMetadata.description),
    };
  }

  if (!fs.existsSync(LOCAL_SITE_INDEX_PATH)) {
    throw new Error('Cannot derive expected live head metadata from site/index.html');
  }

  const metadata = extractStaticHeadMetadata(fs.readFileSync(LOCAL_SITE_INDEX_PATH, 'utf8'));
  if (!metadata.title || !metadata.description) {
    throw new Error('Cannot derive expected live title and description from site/index.html');
  }
  return metadata;
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

function findStaticNoTrackingClaimIssues(indexSource, appSource) {
  const surface = `${indexSource}\n${appSource}`;
  const patterns = [
    /\bNo tracking\b/i,
    /\bzero tracking\b/i,
    /\btrack(?:s|ing)? nothing\b/i,
    /\bNo third-party trackers\b/i,
    /\bIngen spårning\b/i,
    /\bspårar inte\b/i,
    /\bInga tredjepartssp[aå]rare\b/i,
  ];

  return patterns
    .filter((pattern) => pattern.test(surface))
    .map((pattern) => `unqualified static no-tracking claim: ${pattern.source}`);
}

function findStaticTeamCredentialClaimIssues(indexSource, appSource) {
  return [
    ...findUnsupportedStaticTeamCredentialClaimsInSource(indexSource, 'index.html'),
    ...findUnsupportedStaticTeamCredentialClaimsInSource(appSource, 'app.js'),
  ];
}

function findStaticReleaseCopyIssues(indexSource, appSource) {
  return findUnsupportedStaticReleaseCopyInSource(`${indexSource}\n${appSource}`, 'live static');
}

function indexReferencesSigninScript(indexSource) {
  return /\bsrc=["']signin\.js["']/.test(String(indexSource || ''));
}

function findStaticSigninAssetIssues(indexSource, manifestSource, signinSource) {
  const index = String(indexSource || '');
  if (!indexReferencesSigninScript(index)) return [];

  const issues = [];
  if (!/\bid=["']signin-open["']/.test(index)) {
    issues.push('index.html references signin.js but does not expose #signin-open');
  }
  if (!/\bid=["']signin-modal["']/.test(index)) {
    issues.push('index.html references signin.js but does not expose #signin-modal');
  }

  try {
    const manifest = JSON.parse(String(manifestSource || ''));
    if (!manifest.assets?.['signin.js']) {
      issues.push('signin.js is referenced by index.html but missing from asset-manifest.json');
    }
  } catch (error) {
    issues.push(`asset-manifest.json could not be parsed for signin.js: ${error.message}`);
  }

  if (!/closest\(["']#signin-open["']\)/.test(String(signinSource || ''))) {
    issues.push('signin.js does not wire the #signin-open trigger');
  }

  return issues;
}

function parseJsonForStaticCheck(source, label, issues) {
  try {
    return JSON.parse(String(source || ''));
  } catch (error) {
    issues.push(`${label} could not be parsed: ${error.message}`);
    return null;
  }
}

function findStaticPwaAssetIssues(indexSource, assetManifestSource, pwaManifestSource, swSource) {
  const index = String(indexSource || '');
  const serviceWorker = String(swSource || '');
  const issues = [];

  if (!/\brel=["']manifest["']\s+href=["']manifest\.webmanifest["']/.test(index)) {
    issues.push('index.html does not link manifest.webmanifest');
  }
  if (!/\bname=["']theme-color["']\s+content=["']#f5f7fa["']/.test(index)) {
    issues.push('index.html does not expose the static PWA theme color');
  }
  if (!/navigator\.serviceWorker[\s\S]*\.register\(["']\.\/sw\.js["']/.test(index)) {
    issues.push('index.html does not register ./sw.js');
  }
  if (!/updateViaCache:\s*["']none["']/.test(index)) {
    issues.push('service worker registration does not bypass update cache');
  }

  const assetManifest = parseJsonForStaticCheck(assetManifestSource, 'asset-manifest.json', issues);
  if (assetManifest) {
    for (const assetPath of [
      'manifest.webmanifest',
      'icons/pwa-icon-192.png',
      'icons/pwa-icon-512.png',
      'icons/pwa-maskable-512.png',
      'sw.js',
    ]) {
      if (!assetManifest.assets?.[assetPath]) {
        issues.push(`${assetPath} missing from asset-manifest.json`);
      }
    }
  }

  const pwaManifest = parseJsonForStaticCheck(pwaManifestSource, 'manifest.webmanifest', issues);
  if (pwaManifest) {
    if (pwaManifest.display !== 'standalone') {
      issues.push(`manifest.webmanifest display expected standalone, found ${pwaManifest.display}`);
    }
    if (pwaManifest.start_url !== '.' || pwaManifest.scope !== '.') {
      issues.push('manifest.webmanifest must keep root-relative start_url and scope');
    }

    const iconSources = new Set((pwaManifest.icons || []).map((icon) => icon.src));
    for (const iconPath of [
      'icons/pwa-icon-192.png',
      'icons/pwa-icon-512.png',
      'icons/pwa-maskable-512.png',
    ]) {
      if (!iconSources.has(iconPath)) {
        issues.push(`manifest.webmanifest does not list ${iconPath}`);
      }
    }
  }

  for (const [label, pattern] of [
    ['asset-manifest-driven precache', /asset-manifest\.json/],
    ['revisioned cache name', /cacheNameForManifestText/],
    ['manifest hash cache revision', /crypto\.subtle\.digest\(["']SHA-256["']/],
    ['app-shell precache', /cache\.addAll\(resolvePrecacheUrls\(manifest\)\)/],
    ['stale cache cleanup', /caches\.delete\(cacheName\)/],
    [
      'same-origin fetch handler',
      /event\.respondWith\(networkFirstWithCacheFallback\(event\.request\)\)/,
    ],
  ]) {
    if (!pattern.test(serviceWorker)) {
      issues.push(`sw.js missing ${label}`);
    }
  }

  if (/https?:\/\//.test(serviceWorker)) {
    issues.push('sw.js must not hardcode external cache URLs');
  }

  return issues;
}

async function fetchTextForCheck(baseUrl, assetPath) {
  try {
    return await fetchText(baseUrl, assetPath);
  } catch (error) {
    return `__FETCH_ERROR__ ${error.message}`;
  }
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
  const requiredHeadMetadata = resolveRequiredHeadMetadata(options);
  const requiredQuestionCount = resolveRequiredQuestionCount(options);
  const requiredQuestionBankHash = resolveRequiredQuestionBankHash(options);
  const [
    indexAsset,
    stylesAsset,
    appAsset,
    practiceAsset,
    ebookToolsAsset,
    ebookAsset,
    questionsAsset,
  ] = await Promise.all([
    fetchAsset(baseUrl, 'index.html'),
    fetchAsset(baseUrl, 'styles.css'),
    fetchAsset(baseUrl, 'app.js'),
    fetchAsset(baseUrl, 'practice.js'),
    fetchAsset(baseUrl, 'ebook-tools.js'),
    fetchAsset(baseUrl, 'ebook.js'),
    fetchAsset(baseUrl, 'questions.js'),
  ]);
  const index = indexAsset.text;
  const styles = stylesAsset.text;
  const app = appAsset.text;
  const practice = practiceAsset.text;
  const ebookTools = ebookToolsAsset.text;
  const ebook = ebookAsset.text;
  const questions = questionsAsset.text;

  const questionCount = readStaticQuestionCount(questions);
  const questionBankHash = hashStaticQuestionBank(questions);
  const liveHeadMetadata = extractStaticHeadMetadata(index);
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

  const staticHeadMetadataTitleIssues = findStaticHeadMetadataTitleIssues(index, 'index.html');
  const staticHeadMetadataDescriptionIssues = findStaticHeadMetadataDescriptionIssues(
    index,
    'index.html',
  );
  const staticHeadMetadataIssues = [
    ...staticHeadMetadataTitleIssues,
    ...staticHeadMetadataDescriptionIssues,
  ];
  checks.push(
    staticHeadMetadataIssues.length === 0 &&
      liveHeadMetadata.title === requiredHeadMetadata.title &&
      liveHeadMetadata.description === requiredHeadMetadata.description
      ? pass('static head metadata', liveHeadMetadata.title)
      : fail(
          'static head metadata',
          [
            `expected title "${requiredHeadMetadata.title}" and description "${requiredHeadMetadata.description}", found title "${liveHeadMetadata.title}" and description "${liveHeadMetadata.description}"`,
            formatUnsupportedStaticOutcomeSlogans(staticHeadMetadataIssues),
          ]
            .filter(Boolean)
            .join('\n'),
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

  const staticAdSenseIssues = findStaticAdSenseSlotConfigIssues(index, app);
  checks.push(
    staticAdSenseIssues.length === 0
      ? pass('static AdSense slot config')
      : fail('static AdSense slot config', staticAdSenseIssues.join('; ')),
  );

  const staticAdSenseSlotStateCopyIssues = findStaticAdSenseSlotStateCopyIssues(index, app);
  checks.push(
    staticAdSenseSlotStateCopyIssues.length === 0
      ? pass('static AdSense slot-state copy')
      : fail('static AdSense slot-state copy', staticAdSenseSlotStateCopyIssues.join('; ')),
  );

  const staticNoTrackingIssues = findStaticNoTrackingClaimIssues(index, app);
  checks.push(
    staticNoTrackingIssues.length === 0
      ? pass('static privacy no-tracking copy')
      : fail('static privacy no-tracking copy', staticNoTrackingIssues.join('; ')),
  );

  const staticTeamCredentialIssues = findStaticTeamCredentialClaimIssues(index, app);
  checks.push(
    staticTeamCredentialIssues.length === 0
      ? pass('static team credential copy')
      : fail(
          'static team credential copy',
          formatUnsupportedStaticTeamCredentialClaims(staticTeamCredentialIssues),
        ),
  );

  const staticReleaseCopyIssues = findStaticReleaseCopyIssues(index, app);
  checks.push(
    staticReleaseCopyIssues.length === 0
      ? pass('static release copy')
      : fail('static release copy', formatUnsupportedStaticReleaseCopy(staticReleaseCopyIssues)),
  );

  if (indexReferencesSigninScript(index)) {
    const [assetManifest, signin] = await Promise.all([
      fetchTextForCheck(baseUrl, 'asset-manifest.json'),
      fetchTextForCheck(baseUrl, 'signin.js'),
    ]);
    const staticSigninAssetIssues = findStaticSigninAssetIssues(index, assetManifest, signin);
    checks.push(
      staticSigninAssetIssues.length === 0
        ? pass('static sign-in assets')
        : fail('static sign-in assets', staticSigninAssetIssues.join('; ')),
    );
  } else {
    checks.push(pass('static sign-in assets', 'signin.js not referenced'));
  }

  const [pwaAssetManifest, pwaManifest, serviceWorker] = await Promise.all([
    fetchTextForCheck(baseUrl, 'asset-manifest.json'),
    fetchTextForCheck(baseUrl, 'manifest.webmanifest'),
    fetchTextForCheck(baseUrl, 'sw.js'),
  ]);
  const staticPwaAssetIssues = findStaticPwaAssetIssues(
    index,
    pwaAssetManifest,
    pwaManifest,
    serviceWorker,
  );
  checks.push(
    staticPwaAssetIssues.length === 0
      ? pass('static PWA offline shell')
      : fail('static PWA offline shell', staticPwaAssetIssues.join('; ')),
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
    !/<script\b[^>]+\bsrc=["'][^"']*ebook(?:-tools)?\.js[^"']*["']/i.test(index) &&
      containsAll(app, [
        'SMT_EBOOK_SCRIPT_SOURCES',
        'ebook-tools.js',
        'ebook.js',
        'window.smtEnsureEbookScripts',
      ]) &&
      containsAll(ebookTools, ['window.smtApplyEbookHighlights']) &&
      containsAll(ebook, ['window.smtEbookRender', 'PRACTICE_LINKS'])
      ? pass('ebook renderer assets')
      : fail(
          'ebook renderer assets',
          'missing lazy Ebook helper/renderer wiring or found eager ebook entry scripts',
        ),
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
  extractStaticHeadMetadata,
  fetchAsset,
  fetchText,
  findRequiredSecurityHeaderIssues,
  findStaticAdSenseSlotConfigIssues,
  findStaticAdSenseSlotStateCopyIssues,
  findStaticNoTrackingClaimIssues,
  findStaticSigninAssetIssues,
  hashStaticQuestionBank,
  indexReferencesSigninScript,
  normalizeBaseUrl,
  readStaticQuestionCount,
  REQUIRED_SECURITY_HEADERS,
  staticAdSenseSlotsAreConfiguredInSource,
  resolveRequiredHeadMetadata,
  resolveRequiredQuestionBankHash,
  resolveRequiredQuestionCount,
};
