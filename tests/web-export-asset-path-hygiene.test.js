const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const { check, hasForbiddenExportPathFragment, prepare } = require('../scripts/prepare-web-export');

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

test('build config wires the asset path hygiene guard into npm test', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

  assert.equal(
    packageJson.scripts['test:web-export-asset-path-hygiene'],
    'node --test tests/web-export-asset-path-hygiene.test.js',
  );
  assert.match(packageJson.scripts.test, /npm run test:web-export-asset-path-hygiene/);
});
