const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');

const expectedToastCallsites = [
  {
    file: 'site/app.js',
    call: "fx.toast(`🔥 STREAK ×${streak}`, { flavor: 'streak', duration: 1800 });",
  },
  {
    file: 'site/ebook-tools.js',
    call: 'if (window.smtFx) window.smtFx.toast(copy().highlighted, { duration: 1200 });',
  },
  {
    file: 'site/ebook-tools.js',
    call: 'if (window.smtFx) window.smtFx.toast(copy().noteSaved, { duration: 1400 });',
  },
  {
    file: 'site/extras.js',
    call: "fx.toast(extrasText('fikaToast'), { duration: 2200 });",
  },
  {
    file: 'site/extras.js',
    call: "fx.toast(extrasText('abbaToast'), { flavor: 'win', duration: 2800 });",
  },
  {
    file: 'site/extras.js',
    call: "if (window.smtFx) window.smtFx.toast(extrasText('snowToast'), { duration: 2200 });",
  },
  {
    file: 'site/extras.js',
    call: "if (window.smtFx) window.smtFx.toast(extrasText('snowToast'), { duration: 2200 });",
  },
  {
    file: 'site/extras.js',
    call: "if (window.smtFx) window.smtFx.toast(extrasText('vasaToast'), { duration: 2200 });",
  },
  {
    file: 'site/extras.js',
    call: "if (window.smtFx) window.smtFx.toast(extrasText('vasaToast'), { duration: 2200 });",
  },
  {
    file: 'site/extras.js',
    call: "window.smtFx.toast(extrasText('ikeaToast'), { duration: 2400 });",
  },
  {
    file: 'site/extras.js',
    call: "window.smtFx.toast(extrasText('skalToast'), { duration: 1800 });",
  },
  {
    file: 'site/extras.js',
    call: "if (window.smtFx) window.smtFx.toast(extrasText('lagomToast'), { duration: 1800 });",
  },
  {
    file: 'site/extras.js',
    call: "if (window.smtFx) window.smtFx.toast(extrasText('swedenModeToast'), { duration: 1800 });",
  },
  {
    file: 'site/extras.js',
    call: 'if (window.smtFx) window.smtFx.toast(`💡 ${f[lang()] || f.en}`, { duration: 4200 });',
  },
  {
    file: 'site/purchase.js',
    call: 'if (window.smtFx && message) window.smtFx.toast(message, { duration: 2600 });',
  },
  {
    file: 'site/signin.js',
    call: "if (window.smtFx) window.smtFx.toast(t('signin.unavailable'), { duration: 2800 });",
  },
  {
    file: 'site/signin.js',
    call: "if (window.smtFx) window.smtFx.toast(t('signin.toast'), { duration: 2400 });",
  },
  {
    file: 'site/signin.js',
    call: "if (window.smtFx) window.smtFx.toast(t('signin.magicsent'), { duration: 2800 });",
  },
];

const trustedHtmlToastAllowlist = [];

function read(filePath, root = repoRoot) {
  return fs.readFileSync(path.join(root, filePath), 'utf8');
}

function normalizeCall(call) {
  return call.trim().replace(/\s+/g, ' ');
}

function siteJavaScriptFiles(root = repoRoot) {
  return fs
    .readdirSync(path.join(root, 'site'))
    .filter((fileName) => fileName.endsWith('.js'))
    .map((fileName) => `site/${fileName}`)
    .sort();
}

function collectStaticToastCallsites(root = repoRoot) {
  const callsites = [];

  for (const file of siteJavaScriptFiles(root)) {
    const source = read(file, root);
    source.split(/\r?\n/).forEach((line, index) => {
      if (!line.includes('.toast(')) return;
      const trimmed = line.trim();
      if (!/\b(?:window\.)?(?:smtFx|fx)\.toast\(/.test(trimmed)) return;
      callsites.push({
        call: normalizeCall(trimmed),
        file,
        line: index + 1,
        trustedHtml: /\btrustedHtml\s*:\s*true\b/.test(trimmed),
      });
    });
  }

  return callsites;
}

function publicCallsite(callsite) {
  return { call: callsite.call, file: callsite.file };
}

function sortedCallsites(callsites) {
  return callsites
    .map(publicCallsite)
    .sort((left, right) =>
      `${left.file}\0${left.call}`.localeCompare(`${right.file}\0${right.call}`),
    );
}

function assertStaticToastCallsiteInventory(root = repoRoot) {
  assert.deepEqual(
    sortedCallsites(collectStaticToastCallsites(root)),
    sortedCallsites(expectedToastCallsites),
    'static toast call-site inventory changed; review text-safety and update expectedToastCallsites intentionally',
  );
}

function assertNoUnreviewedTrustedHtmlToastCallsites(root = repoRoot) {
  const allowed = new Set(
    trustedHtmlToastAllowlist.map(
      (callsite) => `${callsite.file}\0${normalizeCall(callsite.call)}`,
    ),
  );
  const unreviewed = collectStaticToastCallsites(root)
    .filter((callsite) => callsite.trustedHtml)
    .filter((callsite) => !allowed.has(`${callsite.file}\0${callsite.call}`))
    .map(publicCallsite);

  assert.deepEqual(unreviewed, [], 'unreviewed static toast trustedHtml:true call-sites found');
}

function assertStaticToastHelperTextSafeByDefault(root = repoRoot) {
  const fx = read('site/fx.js', root);

  assert.match(fx, /t\.textContent\s*=\s*String\(msg \?\? ''\)/);
  assert.doesNotMatch(fx, /t\.innerHTML\s*=\s*msg/);
  assertStaticToastCallsiteInventory(root);
  assertNoUnreviewedTrustedHtmlToastCallsites(root);
}

function registerStaticToastCallsiteGuardTests() {
  const test = require('node:test');

  test('static toast call site guard keeps the reviewed inventory exact', () => {
    assertStaticToastCallsiteInventory();
  });

  test('static toast call site guard rejects unreviewed trustedHtml call sites', () => {
    assertNoUnreviewedTrustedHtmlToastCallsites();
  });
}

module.exports = {
  assertNoUnreviewedTrustedHtmlToastCallsites,
  assertStaticToastCallsiteInventory,
  assertStaticToastHelperTextSafeByDefault,
  collectStaticToastCallsites,
  expectedToastCallsites,
  registerStaticToastCallsiteGuardTests,
  trustedHtmlToastAllowlist,
};

if (path.resolve(process.argv[1] || '') === __filename) {
  registerStaticToastCallsiteGuardTests();
}
