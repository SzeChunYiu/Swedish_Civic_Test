const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const {
  check,
  hasForbiddenExportPathFragment,
  prepare,
  readWebDocumentMetadata,
} = require('../scripts/prepare-web-export');
const publicUrls = require('../config/publicUrls.json');

function makeExportFixture(bundleSource = defaultBundleSource()) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'web-export-asset-paths-'));
  const outputDir = path.join(tmpDir, 'dist-web');
  const bundleDir = path.join(outputDir, '_expo/static/js/web');

  fs.mkdirSync(bundleDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, 'index.html'),
    [
      '<!DOCTYPE html>',
      '<html>',
      '<head><title>Export</title></head>',
      '<body>',
      '<div id="root"></div>',
      '<script src="/_expo/static/js/web/entry-test.js" defer></script>',
      '</body>',
      '</html>',
      '',
    ].join('\n'),
  );
  fs.writeFileSync(path.join(bundleDir, 'entry-test.js'), bundleSource);

  return { bundleDir, outputDir, tmpDir };
}

function defaultBundleSource() {
  return [
    'const chunks = {"paths":{"1":"/_expo/static/js/web/chunk-test.js"}};',
    'const backIcon = {uri:"/assets/back-icon.35ba0eaec5a4f5ed12ca16fabeae451d.png"};',
    'const routerIcon = {uri:"assets/error.d1ea1496f9057eb392d5bbf3732a61b7.png"};',
  ].join(' ');
}

function walkFiles(directory) {
  const files = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(entryPath));
    } else {
      files.push(entryPath);
    }
  }

  return files;
}

test('web export path hygiene allows public support URLs containing repository slug prefixes', () => {
  assert.equal(new URL(publicUrls.support).origin, 'https://szechunyiu.github.io');
  assert.equal(new URL(publicUrls.support).pathname, '/Swedish_Civic_Test-public-site/support/');
  assert.equal(hasForbiddenExportPathFragment(publicUrls.support), false);
  assert.equal(fs.readFileSync(__filename, 'utf8').includes(publicUrls.support), false);
});

test('prepare web export rewrites loader, metadata, fallback, and root-relative bundle references', () => {
  const { bundleDir, outputDir, tmpDir } = makeExportFixture();

  try {
    prepare(outputDir);
    check(outputDir);

    const metadata = readWebDocumentMetadata();
    const index = fs.readFileSync(path.join(outputDir, 'index.html'), 'utf8');
    const fallback = fs.readFileSync(path.join(outputDir, '404.html'), 'utf8');
    const bundle = fs.readFileSync(path.join(bundleDir, 'entry-test.js'), 'utf8');

    assert.equal(fallback, index);
    assert.match(index, /data-web-export-loader="true"/);
    assert.match(index, /window\.location\.protocol === "file:" \? "\.\/" : "\/"/);
    assert.match(index, /script\.src = "_expo\/static\/js\/web\/entry-test\.js"/);
    assert.match(index, new RegExp(`lang="${metadata.language}"`));
    assert.match(index, new RegExp(`content="${metadata.description}"`));
    assert.doesNotMatch(index, /src="\/_expo\//);
    assert.match(bundle, /"paths":\{"1":"_expo\/static\/js\/web\/chunk-test\.js"\}/);
    assert.match(bundle, /uri:"assets\/back-icon\.35ba0eaec5a4f5ed12ca16fabeae451d\.png"/);
    assert.doesNotMatch(bundle, /"\/(?:_expo|assets)\//);
  } finally {
    fs.rmSync(tmpDir, { force: true, recursive: true });
  }
});

test('prepare web export flattens leaked exported asset paths and rewrites bundle references', () => {
  const leakedBundleSource = [
    'const backIcon = {uri:"/assets/__home/billy/Swedish_Civic_Test/node_modules/@react-navigation/elements/lib/module/assets/back-icon.35ba0eaec5a4f5ed12ca16fabeae451d.png"};',
    'const duplicateReactIcon = {uri:"assets/__home/billy/Swedish_Civic_Test/node_modules/@react-navigation/elements/lib/module/assets/shared-icon.ca11ab1e.png"};',
    'const duplicateRouterIcon = {uri:"assets/__home/billy/Swedish_Civic_Test/node_modules/expo-router/assets/shared-icon.ca11ab1e.png"};',
  ].join(' ');
  const { bundleDir, outputDir, tmpDir } = makeExportFixture(leakedBundleSource);
  const leakedReactAsset = path.join(
    outputDir,
    'assets/__home/billy/Swedish_Civic_Test/node_modules/@react-navigation/elements/lib/module/assets',
  );
  const leakedExpoRouterAsset = path.join(
    outputDir,
    'assets/__home/billy/Swedish_Civic_Test/node_modules/expo-router/assets',
  );

  try {
    fs.mkdirSync(leakedReactAsset, { recursive: true });
    fs.mkdirSync(leakedExpoRouterAsset, { recursive: true });
    fs.writeFileSync(
      path.join(leakedReactAsset, 'back-icon.35ba0eaec5a4f5ed12ca16fabeae451d.png'),
      'back-icon',
    );
    fs.writeFileSync(path.join(leakedReactAsset, 'shared-icon.ca11ab1e.png'), 'duplicate-react');
    fs.writeFileSync(
      path.join(leakedExpoRouterAsset, 'shared-icon.ca11ab1e.png'),
      'duplicate-router',
    );

    prepare(outputDir);
    check(outputDir);

    const relativeFiles = walkFiles(outputDir)
      .map((filePath) => path.relative(outputDir, filePath).split(path.sep).join('/'))
      .sort();
    const bundle = fs.readFileSync(path.join(bundleDir, 'entry-test.js'), 'utf8');
    const reactMatch = bundle.match(/duplicateReactIcon = \{uri:"(assets\/[^"]+)"\}/);
    const routerMatch = bundle.match(/duplicateRouterIcon = \{uri:"(assets\/[^"]+)"\}/);

    assert.equal(relativeFiles.some(hasForbiddenExportPathFragment), false);
    assert.ok(relativeFiles.includes('assets/back-icon.35ba0eaec5a4f5ed12ca16fabeae451d.png'));
    assert.match(bundle, /uri:"assets\/back-icon\.35ba0eaec5a4f5ed12ca16fabeae451d\.png"/);
    assert.doesNotMatch(bundle, /__home|Swedish_Civic_Test|node_modules|\/assets\//);
    assert.ok(reactMatch);
    assert.ok(routerMatch);
    assert.notEqual(reactMatch[1], routerMatch[1]);
    assert.equal(
      fs.readFileSync(path.join(outputDir, ...reactMatch[1].split('/')), 'utf8'),
      'duplicate-react',
    );
    assert.equal(
      fs.readFileSync(path.join(outputDir, ...routerMatch[1].split('/')), 'utf8'),
      'duplicate-router',
    );
  } finally {
    fs.rmSync(tmpDir, { force: true, recursive: true });
  }
});

test('web export check fails when an exported path leaks checkout or dependency details', () => {
  const { outputDir, tmpDir } = makeExportFixture();

  try {
    prepare(outputDir);
    const leakedAssetDir = path.join(
      outputDir,
      'assets/__home/billy/Swedish_Civic_Test/node_modules/expo-router/assets',
    );
    fs.mkdirSync(leakedAssetDir, { recursive: true });
    fs.writeFileSync(path.join(leakedAssetDir, 'error.png'), 'asset');

    assert.throws(() => check(outputDir), /Exported file path leaks local build details/);
  } finally {
    fs.rmSync(tmpDir, { force: true, recursive: true });
  }
});

test('web export check fails when text exports contain checkout or dependency path fragments', () => {
  const { bundleDir, outputDir, tmpDir } = makeExportFixture();
  const bundlePath = path.join(bundleDir, 'entry-test.js');

  try {
    prepare(outputDir);
    fs.appendFileSync(
      bundlePath,
      ' const leaked = "assets/__home/billy/Swedish_Civic_Test/node_modules/expo-router/assets/error.png";',
    );

    assert.throws(
      () => check(outputDir),
      /Exported file content leaks local build path or dependency path fragments/,
    );
  } finally {
    fs.rmSync(tmpDir, { force: true, recursive: true });
  }
});

test('build config keeps the legacy asset path hygiene fixture out of npm test dispatch', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

  assert.equal(packageJson.scripts['test:web-export-asset-path-hygiene'], undefined);
  assert.doesNotMatch(packageJson.scripts.test, /test:web-export-asset-path-hygiene/);
});
