const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const siteRoot = path.join(repoRoot, 'site');

function readSiteFile(fileName) {
  return fs.readFileSync(path.join(siteRoot, fileName), 'utf8');
}

function scriptTagPattern(assetPath) {
  return new RegExp(
    `<script\\b[^>]+\\bsrc=["'][^"']*${assetPath.replace('.', '\\.')}[^"']*["']`,
    'i',
  );
}

test('static Home route does not eagerly include route-only bundles', () => {
  const indexHtml = readSiteFile('index.html');

  for (const assetPath of ['questions.js', 'practice.js', 'ebook-tools.js', 'ebook.js']) {
    assert.doesNotMatch(indexHtml, scriptTagPattern(assetPath), `${assetPath} is eager`);
  }

  assert.match(indexHtml, scriptTagPattern('app.js'));
  assert.match(indexHtml, scriptTagPattern('i18n-extras.js'));
  assert.match(indexHtml, scriptTagPattern('settings.js'));
  assert.match(indexHtml, scriptTagPattern('signin.js'));
});

test('app route loader owns Practice Mock and Ebook bundle demand', () => {
  const appSource = readSiteFile('app.js');

  assert.match(appSource, /const SMT_QUESTION_BANK_SCRIPT_SRC = 'questions\.js'/);
  assert.match(appSource, /const SMT_PRACTICE_SCRIPT_SOURCES = \['practice\.js'\]/);
  assert.match(appSource, /const SMT_EBOOK_SCRIPT_SOURCES = \['ebook-tools\.js', 'ebook\.js'\]/);
  assert.match(appSource, /function\s+smtEnsureStaticRouteBundleForRoute\s*\(/);
  assert.match(appSource, /path === '\/practice' \|\| path === '\/mock'/);
  assert.match(appSource, /path === '\/ebook'/);
  assert.match(appSource, /script\.async = false/);
  assert.match(appSource, /smtEnsureStaticRouteBundleForRoute\(path\)/);
  assert.match(appSource, /smtEnsureQuestionBankForRoute\(path\)/);
});

test('lazy-loaded route bundles run their current-route hooks after dynamic load', () => {
  const appSource = readSiteFile('app.js');
  const practiceSource = readSiteFile('practice.js');
  const ebookSource = readSiteFile('ebook.js');

  assert.match(appSource, /window\.smtEnsurePracticeScripts/);
  assert.match(appSource, /window\.smtEnsureEbookScripts/);
  assert.match(appSource, /window\.smtQuizRenderRoute = smtQuizRenderRoute/);
  assert.match(practiceSource, /onRoute\(\);/);
  assert.match(ebookSource, /if \(isOnEbook\(\)\) render\(\);/);
});

test('static service worker keeps route bundles out of install precache', () => {
  const serviceWorkerSource = readSiteFile('sw.js');

  assert.match(
    serviceWorkerSource,
    /ROUTE_LAZY_ASSETS = new Set\(\['questions\.js', 'practice\.js', 'ebook-tools\.js', 'ebook\.js'\]\)/,
  );
  assert.match(serviceWorkerSource, /!ROUTE_LAZY_ASSETS\.has/);
});
