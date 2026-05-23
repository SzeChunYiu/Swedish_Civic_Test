const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const zlib = require('node:zlib');

const { WEB_ENTRY_BUNDLE_BUDGET } = require('../scripts/web-export-budget');

const repoRoot = path.resolve(__dirname, '..');
const DEFAULT_OUTPUT_DIR = path.join(repoRoot, 'dist-web');

function listJsBundles(bundleDir) {
  if (!fs.existsSync(bundleDir)) return [];
  return fs
    .readdirSync(bundleDir)
    .filter((name) => name.endsWith('.js'))
    .map((name) => path.join(bundleDir, name))
    .sort();
}

function parseEntryBundlePath(indexHtml) {
  const directScript = indexHtml.match(/<script\s+src="\/?(_expo\/static\/js\/web\/[^"]+\.js)"/);
  if (directScript) return directScript[1];

  const runtimeLoader = indexHtml.match(/script\.src\s*=\s*"(_expo\/static\/js\/web\/[^"]+\.js)"/);
  if (runtimeLoader) return runtimeLoader[1];

  return null;
}

function measureBundle(bundlePath) {
  const source = fs.readFileSync(bundlePath);
  return {
    rawBytes: source.byteLength,
    gzipBytes: zlib.gzipSync(source, { level: 9 }).byteLength,
    brotliBytes: zlib.brotliCompressSync(source).byteLength,
  };
}

function formatBytes(bytes) {
  return `${bytes} bytes`;
}

function assertWithinBudget(report, budget) {
  const failures = [
    ['rawBytes', budget.maxRawBytes],
    ['gzipBytes', budget.maxGzipBytes],
    ['brotliBytes', budget.maxBrotliBytes],
  ].filter(([field, ceiling]) => report[field] > ceiling);

  if (!failures.length) return;

  const measured = [
    `rawBytes=${formatBytes(report.rawBytes)} / maxRawBytes=${formatBytes(budget.maxRawBytes)}`,
    `gzipBytes=${formatBytes(report.gzipBytes)} / maxGzipBytes=${formatBytes(budget.maxGzipBytes)}`,
    `brotliBytes=${formatBytes(report.brotliBytes)} / maxBrotliBytes=${formatBytes(budget.maxBrotliBytes)}`,
  ].join(', ');
  throw new Error(
    `Web export entry bundle exceeds budget for ${report.relativePath}: ${measured}. ` +
      'If the increase is intentional, update scripts/web-export-budget.js with the new measured ceiling and baseline rationale.',
  );
}

function measureWebExportBudget(outputDir, budget = WEB_ENTRY_BUNDLE_BUDGET) {
  const indexPath = path.join(outputDir, 'index.html');
  assert.ok(
    fs.existsSync(indexPath),
    `Missing ${path.relative(repoRoot, indexPath)}. Run \`npm run build:web:export\` before \`npm run test:web-export-budget\`.`,
  );

  const bundleDir = path.join(outputDir, '_expo/static/js/web');
  const bundles = listJsBundles(bundleDir);
  assert.ok(bundles.length > 0, `Missing web JavaScript bundles under ${bundleDir}`);

  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  const entryRelativePath = parseEntryBundlePath(indexHtml);
  assert.ok(entryRelativePath, 'dist-web/index.html does not identify the Expo web entry bundle');

  const entryPath = path.join(outputDir, entryRelativePath);
  assert.ok(
    fs.existsSync(entryPath),
    `Entry bundle from dist-web/index.html does not exist: ${entryRelativePath}`,
  );

  const report = {
    relativePath: entryRelativePath,
    bundleCount: bundles.length,
    ...measureBundle(entryPath),
  };
  assertWithinBudget(report, budget);
  return report;
}

function writeFixtureExport(outputDir, bundleBytes) {
  const bundleDir = path.join(outputDir, '_expo/static/js/web');
  fs.mkdirSync(bundleDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, 'index.html'),
    [
      '<!DOCTYPE html>',
      '<html>',
      '<body>',
      '<div id="root"></div>',
      '<script src="/_expo/static/js/web/entry-test.js" defer></script>',
      '</body>',
      '</html>',
      '',
    ].join('\n'),
  );
  fs.writeFileSync(path.join(bundleDir, 'entry-test.js'), crypto.randomBytes(bundleBytes));
}

test('web export entry bundle stays within documented mobile budget', () => {
  const report = measureWebExportBudget(DEFAULT_OUTPUT_DIR);

  assert.equal(report.bundleCount >= 1, true);
  assert.equal(report.rawBytes > 0, true);
  assert.equal(report.gzipBytes > 0, true);
  assert.equal(report.brotliBytes > 0, true);
});

test('web export bundle budget records the measured baseline and size drivers', () => {
  const { baseline } = WEB_ENTRY_BUNDLE_BUDGET;
  const maxBaselineHeadroom = 1.06;

  assert.equal(baseline.measuredAt, '2026-05-23');
  assert.equal(
    baseline.entryBundle,
    '_expo/static/js/web/entry-ae08d50efdaae692cb6c77772e36f561.js',
  );
  assert.equal(baseline.bundleCount, 3);
  assert.equal(baseline.measuredRawBytes, 5_002_584);
  assert.equal(baseline.measuredGzipBytes, 1_103_404);
  assert.equal(baseline.measuredBrotliBytes, 800_461);
  assert.ok(WEB_ENTRY_BUNDLE_BUDGET.maxRawBytes >= baseline.measuredRawBytes);
  assert.ok(WEB_ENTRY_BUNDLE_BUDGET.maxGzipBytes >= baseline.measuredGzipBytes);
  assert.ok(WEB_ENTRY_BUNDLE_BUDGET.maxBrotliBytes >= baseline.measuredBrotliBytes);
  assert.ok(
    WEB_ENTRY_BUNDLE_BUDGET.maxRawBytes <=
      Math.ceil(baseline.measuredRawBytes * maxBaselineHeadroom),
  );
  assert.ok(
    WEB_ENTRY_BUNDLE_BUDGET.maxGzipBytes <=
      Math.ceil(baseline.measuredGzipBytes * maxBaselineHeadroom),
  );
  assert.ok(
    WEB_ENTRY_BUNDLE_BUDGET.maxBrotliBytes <=
      Math.ceil(baseline.measuredBrotliBytes * maxBaselineHeadroom),
  );
  assert.match(baseline.rationale, /Measured re-baseline/);
  assert.ok(baseline.sizeDrivers.some((driver) => /Expo Router|React Native Web/.test(driver)));
  assert.ok(baseline.sizeDrivers.some((driver) => /question bank|generated practice/.test(driver)));
  assert.ok(baseline.sizeDrivers.some((driver) => /localization pilot/.test(driver)));
});

test('web export budget reports raw, gzip, and brotli sizes when exceeded', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'web-export-budget-'));
  const outputDir = path.join(tmpDir, 'dist-web');
  writeFixtureExport(outputDir, 2048);

  assert.throws(
    () =>
      measureWebExportBudget(outputDir, {
        maxRawBytes: 128,
        maxGzipBytes: 128,
        maxBrotliBytes: 128,
      }),
    /entry-test\.js[\s\S]*rawBytes=[\s\S]*gzipBytes=[\s\S]*brotliBytes=/,
  );
});

module.exports = {
  WEB_ENTRY_BUNDLE_BUDGET,
  measureWebExportBudget,
};
