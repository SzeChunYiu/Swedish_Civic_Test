const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const gitignorePath = path.join(repoRoot, '.gitignore');
const screenshotDir = path.join(repoRoot, 'reports/2026-05-15-uiux-screenshots');
const manifestPath = path.join(screenshotDir, 'manifest.json');
const visualSmokeSpecPath = path.join(repoRoot, 'tests/e2e/visual-smoke.spec.ts');
const visualSmokeOutputPath = path.join(repoRoot, 'tests/e2e/visualSmokeOutput.ts');
const expectedRoutes = [
  '/',
  '/onboarding',
  '/home',
  '/learn',
  '/practice',
  '/exam',
  '/mistakes',
  '/profile',
  '/settings',
  '/chapter/ch01',
  '/disclaimer',
  '/privacy',
  '/terms',
  '/sources',
  '/support',
];
const explainedDuplicateScreenshotGroups = new Set(['home,index']);

function readManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function loadVisualSmokeOutputModule() {
  const source = fs.readFileSync(visualSmokeOutputPath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: visualSmokeOutputPath,
  }).outputText;
  const module = { exports: {} };
  const sandbox = {
    __dirname: path.dirname(visualSmokeOutputPath),
    __filename: visualSmokeOutputPath,
    console,
    exports: module.exports,
    module,
    process,
    require,
  };

  vm.runInNewContext(compiled, sandbox, { filename: visualSmokeOutputPath });
  return module.exports;
}

test('visual smoke report records route-specific screenshots without launch overlays', () => {
  const manifest = readManifest();
  assert.match(manifest.viewport, /iPhone 12/);
  assert.match(manifest.outputPolicy, /tmp\/visual-smoke-uiux-screenshots/);
  assert.match(manifest.outputPolicy, /VISUAL_SMOKE_UPDATE_BASELINE=1/);
  assert.match(manifest.launchOverlayPolicy, /dismisses the launch sponsor overlay/i);
  assert.match(manifest.duplicatePolicy, /duplicate screenshot hashes fail/i);

  const routes = manifest.routes || [];
  assert.deepEqual(
    routes.map((route) => route.route),
    expectedRoutes,
  );

  const namesByHash = new Map();
  for (const route of routes) {
    assert.equal(typeof route.name, 'string');
    assert.equal(typeof route.file, 'string');
    assert.equal(route.launchOverlayVisibleAfterDismissal, false);
    assert.ok(
      route.launchOverlayDismissed ||
        [
          '/practice',
          '/exam',
          '/disclaimer',
          '/privacy',
          '/terms',
          '/sources',
          '/support',
        ].includes(route.route),
      `${route.name} should either dismiss or suppress the launch overlay`,
    );

    const screenshotPath = path.join(screenshotDir, route.file);
    assert.ok(fs.existsSync(screenshotPath), `${route.file} should exist`);
    assert.ok(fs.statSync(screenshotPath).size > 10_000, `${route.file} should not be empty`);
    assert.equal(route.sha256, sha256File(screenshotPath), `${route.file} hash should match`);

    const names = namesByHash.get(route.sha256) || [];
    names.push(route.name);
    namesByHash.set(route.sha256, names);
  }

  const unexplainedDuplicates = [...namesByHash.values()]
    .filter((names) => names.length > 1)
    .map((names) => names.sort().join(','))
    .filter((names) => !explainedDuplicateScreenshotGroups.has(names));

  assert.deepEqual(unexplainedDuplicates, []);
});

test('visual smoke output resolver defaults to ignored temp artifacts', () => {
  const {
    isVisualSmokeCommittedBaselineOutput,
    resolveVisualSmokeOutput,
    visualSmokeBaselineScreenshotDir,
    visualSmokeOutputPolicy,
    visualSmokeRuntimeScreenshotDir,
  } = loadVisualSmokeOutputModule();
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');

  const runtimeOutput = resolveVisualSmokeOutput({});
  assert.equal(runtimeOutput.outputDir, visualSmokeRuntimeScreenshotDir);
  assert.equal(runtimeOutput.outputMode, 'runtime-temp');
  assert.equal(runtimeOutput.outputPolicy, visualSmokeOutputPolicy);
  assert.equal(runtimeOutput.refreshCommittedBaseline, false);
  assert.equal(runtimeOutput.writesCommittedBaseline, false);
  assert.equal(isVisualSmokeCommittedBaselineOutput(runtimeOutput.outputDir), false);

  const baselineOutput = resolveVisualSmokeOutput({ VISUAL_SMOKE_UPDATE_BASELINE: '1' });
  assert.equal(baselineOutput.outputDir, visualSmokeBaselineScreenshotDir);
  assert.equal(baselineOutput.outputMode, 'committed-baseline-refresh');
  assert.equal(baselineOutput.outputPolicy, visualSmokeOutputPolicy);
  assert.equal(baselineOutput.refreshCommittedBaseline, true);
  assert.equal(baselineOutput.writesCommittedBaseline, true);
  assert.equal(isVisualSmokeCommittedBaselineOutput(baselineOutput.outputDir), true);

  assert.match(gitignore, /^tmp\/$/m);
});

test('visual smoke spec writes the resolved output policy into manifests', () => {
  const source = fs.readFileSync(visualSmokeSpecPath, 'utf8');

  assert.match(source, /resolveVisualSmokeOutput\(\)/);
  assert.match(source, /visualSmokeOutput\.outputDir/);
  assert.match(source, /visualSmokeOutput\.outputMode/);
  assert.match(source, /visualSmokeOutput\.outputPolicy/);
  assert.match(source, /visualSmokeOutput\.refreshCommittedBaseline/);
  assert.match(source, /visualSmokeOutput\.writesCommittedBaseline/);
  assert.match(
    source,
    /Default visual-smoke runs must not write into the committed screenshot baseline/,
  );
});
