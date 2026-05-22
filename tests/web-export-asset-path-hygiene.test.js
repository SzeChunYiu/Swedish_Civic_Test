const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const { check, prepare } = require('../scripts/prepare-web-export');
const publicUrls = require('../config/publicUrls.json');

function makeExportFixture() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'web-export-asset-paths-'));
  const outputDir = path.join(tmpDir, 'dist-web');
  const bundleDir = path.join(outputDir, '_expo/static/js/web');
  const leakedReactNavigationAsset = path.join(
    outputDir,
    'assets/__home/billy/Swedish_Civic_Test/node_modules/@react-navigation/elements/lib/module/assets',
  );
  const leakedExpoRouterAsset = path.join(
    outputDir,
    'assets/__home/billy/Swedish_Civic_Test/node_modules/expo-router/assets',
  );

  fs.mkdirSync(bundleDir, { recursive: true });
  fs.mkdirSync(leakedReactNavigationAsset, { recursive: true });
  fs.mkdirSync(leakedExpoRouterAsset, { recursive: true });

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
  fs.writeFileSync(
    path.join(bundleDir, 'entry-test.js'),
    [
      'const chunks = {"paths":{"1":"/_expo/static/js/web/chunk-test.js"}};',
      'const backIcon = {uri:"/assets/__home/billy/Swedish_Civic_Test/node_modules/@react-navigation/elements/lib/module/assets/back-icon.35ba0eaec5a4f5ed12ca16fabeae451d.png"};',
      'const routerIcon = {uri:"assets/__home/billy/Swedish_Civic_Test/node_modules/expo-router/assets/error.d1ea1496f9057eb392d5bbf3732a61b7.png"};',
      'const duplicateReactIcon = {uri:"/assets/__home/billy/Swedish_Civic_Test/node_modules/@react-navigation/elements/lib/module/assets/shared-icon.ca11ab1e.png"};',
      'const duplicateRouterIcon = {uri:"assets/__home/billy/Swedish_Civic_Test/node_modules/expo-router/assets/shared-icon.ca11ab1e.png"};',
    ].join(' '),
  );
  fs.writeFileSync(
    path.join(leakedReactNavigationAsset, 'back-icon.35ba0eaec5a4f5ed12ca16fabeae451d.png'),
    'back-icon',
  );
  fs.writeFileSync(
    path.join(leakedExpoRouterAsset, 'error.d1ea1496f9057eb392d5bbf3732a61b7.png'),
    'router-error',
  );
  fs.writeFileSync(
    path.join(leakedReactNavigationAsset, 'shared-icon.ca11ab1e.png'),
    'duplicate-react',
  );
  fs.writeFileSync(
    path.join(leakedExpoRouterAsset, 'shared-icon.ca11ab1e.png'),
    'duplicate-router',
  );

  return { outputDir, tmpDir };
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
  assert.equal(fs.readFileSync(__filename, 'utf8').includes(publicUrls.support), false);
});

test('prepare web export flattens leaked asset paths and rewrites bundle references', () => {
  const { outputDir, tmpDir } = makeExportFixture();

  try {
    prepare(outputDir);
    check(outputDir);

    const relativeFiles = walkFiles(outputDir)
      .map((filePath) => path.relative(outputDir, filePath).split(path.sep).join('/'))
      .sort();
    const bundle = fs.readFileSync(
      path.join(outputDir, '_expo/static/js/web/entry-test.js'),
      'utf8',
    );

    assert.ok(relativeFiles.includes('assets/back-icon.35ba0eaec5a4f5ed12ca16fabeae451d.png'));
    assert.ok(relativeFiles.includes('assets/error.d1ea1496f9057eb392d5bbf3732a61b7.png'));
    assert.equal(relativeFiles.some(hasForbiddenExportPathFragment), false);
    assert.match(bundle, /uri:"assets\/back-icon\.35ba0eaec5a4f5ed12ca16fabeae451d\.png"/);
    assert.match(bundle, /uri:"assets\/error\.d1ea1496f9057eb392d5bbf3732a61b7\.png"/);
    assert.doesNotMatch(bundle, /__home|Swedish_Civic_Test|node_modules|\/assets\//);
  } finally {
    fs.rmSync(tmpDir, { force: true, recursive: true });
  }
});

test('prepare web export preserves duplicate asset basenames with matching bundle references', () => {
  const { outputDir, tmpDir } = makeExportFixture();

  try {
    prepare(outputDir);
    check(outputDir);

    const bundle = fs.readFileSync(
      path.join(outputDir, '_expo/static/js/web/entry-test.js'),
      'utf8',
    );
    const reactMatch = bundle.match(/duplicateReactIcon = \{uri:"(assets\/[^"]+)"\}/);
    const routerMatch = bundle.match(/duplicateRouterIcon = \{uri:"(assets\/[^"]+)"\}/);

    assert.ok(reactMatch);
    assert.ok(routerMatch);

    const reactTarget = reactMatch[1];
    const routerTarget = routerMatch[1];

    assert.notEqual(reactTarget, routerTarget);
    assert.equal(path.posix.dirname(reactTarget), 'assets');
    assert.equal(path.posix.dirname(routerTarget), 'assets');
    assert.match(reactTarget, /^assets\/shared-icon\.ca11ab1e(?:\.[0-9a-f]{8}(?:-\d+)?)?\.png$/);
    assert.match(routerTarget, /^assets\/shared-icon\.ca11ab1e(?:\.[0-9a-f]{8}(?:-\d+)?)?\.png$/);
    assert.equal(
      fs.readFileSync(path.join(outputDir, ...reactTarget.split('/')), 'utf8'),
      'duplicate-react',
    );
    assert.equal(
      fs.readFileSync(path.join(outputDir, ...routerTarget.split('/')), 'utf8'),
      'duplicate-router',
    );
  } finally {
    fs.rmSync(tmpDir, { force: true, recursive: true });
  }
});

test('web export check fails when checkout or dependency path fragments leak', () => {
  const { outputDir, tmpDir } = makeExportFixture();
  const indexPath = path.join(outputDir, 'index.html');
  const bundlePath = path.join(outputDir, '_expo/static/js/web/entry-test.js');
  const index = fs
    .readFileSync(indexPath, 'utf8')
    .replace(
      '<script src="/_expo/static/js/web/entry-test.js" defer></script>',
      [
        '<script data-web-export-loader="true">',
        'window.__bundle = "_expo/static/js/web/entry-test.js";',
        '</script>',
      ].join('\n'),
    );

  try {
    fs.writeFileSync(indexPath, index);
    fs.writeFileSync(path.join(outputDir, '404.html'), index);
    fs.writeFileSync(
      bundlePath,
      fs
        .readFileSync(bundlePath, 'utf8')
        .replaceAll('"/_expo/', '"_expo/')
        .replaceAll('"/assets/', '"assets/'),
    );

    assert.throws(
      () => check(outputDir),
      /leaks local build path or dependency path fragments|Exported file path leaks local build details/,
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
