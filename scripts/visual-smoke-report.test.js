const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const gitignorePath = path.join(repoRoot, '.gitignore');
const screenshotDir = path.join(repoRoot, 'reports/2026-05-15-uiux-screenshots');
const manifestPath = path.join(screenshotDir, 'manifest.json');

function readManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function loadTs(relativePath) {
  const filePath = path.join(repoRoot, relativePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };

  new Function('module', 'exports', 'require', output)(mod, mod.exports, require);
  return mod.exports;
}

test('visual smoke uses the shared blocking modal overlay locator', () => {
  const browserLaunchSource = readRepoFile('tests/e2e/browserLaunch.ts');
  const visualSmokeSource = readRepoFile('tests/e2e/visual-smoke.spec.ts');

  assert.match(browserLaunchSource, /export const blockingModalOverlayLocator/);
  assert.match(browserLaunchSource, /\[role="dialog"\]\[aria-modal="true"\]/);
  assert.match(browserLaunchSource, /\[role="menu"\]\[aria-modal="true"\]/);
  assert.match(
    visualSmokeSource,
    /import \{ blockingModalOverlayLocator, dismissBlockingModals \} from '\.\/browserLaunch';/,
  );
  assert.match(visualSmokeSource, /page\.locator\(blockingModalOverlayLocator\)/);
  assert.doesNotMatch(
    visualSmokeSource,
    /page\.locator\('\[role="dialog"\]\[aria-modal="true"\]'\)/,
  );
});

test('visual smoke report records route-specific screenshots without launch overlays', () => {
  const manifest = readManifest();
  const {
    explainedVisualSmokeDuplicateScreenshotGroups,
    isExplainedVisualSmokeDuplicate,
    visualSmokeRouteNamesKey,
    visualSmokeRoutes,
  } = loadTs('tests/e2e/visualSmokeRoutes.ts');
  const { resolveVisualSmokeOutput } = loadTs('tests/e2e/visualSmokeOutput.ts');
  const committedBaselineOutput = resolveVisualSmokeOutput({
    cwd: repoRoot,
    env: { VISUAL_SMOKE_UPDATE_BASELINE: '1' },
  });

  assert.match(manifest.viewport, /iPhone 12/);
  assert.equal(manifest.outputMode, committedBaselineOutput.mode);
  assert.equal(manifest.outputPolicy, committedBaselineOutput.outputPolicy);
  assert.equal(manifest.writesCommittedBaseline, true);
  assert.equal(manifest.writesCommittedBaseline, committedBaselineOutput.writesCommittedBaseline);
  assert.match(manifest.launchOverlayPolicy, /dismisses the launch sponsor overlay/i);
  assert.match(manifest.launchOverlayPolicy, /modal menu overlays/i);
  assert.match(manifest.duplicatePolicy, /duplicate screenshot hashes fail/i);
  assert.deepEqual(manifest.duplicateExplanations, explainedVisualSmokeDuplicateScreenshotGroups);
  for (const explanation of explainedVisualSmokeDuplicateScreenshotGroups) {
    assert.ok(explanation.names.length > 1, 'duplicate explanations should name a route group');
    assert.ok(explanation.reason.trim().length > 20, 'duplicate explanations should include why');
  }

  const routes = manifest.routes || [];
  assert.deepEqual(
    routes.map((route) => route.route),
    visualSmokeRoutes.map(([, route]) => route),
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
    .filter((names) => !isExplainedVisualSmokeDuplicate(names))
    .map((names) => visualSmokeRouteNamesKey(names));

  assert.deepEqual(unexplainedDuplicates, []);
});

test('visual smoke output resolver defaults to ignored temp artifacts', () => {
  const {
    VISUAL_SMOKE_BASELINE_RELATIVE_DIR,
    VISUAL_SMOKE_RUNTIME_RELATIVE_DIR,
    resolveVisualSmokeOutput,
  } = loadTs('tests/e2e/visualSmokeOutput.ts');
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');

  const defaultOutput = resolveVisualSmokeOutput({ cwd: repoRoot, env: {} });
  assert.equal(defaultOutput.mode, 'runtime-temp');
  assert.equal(defaultOutput.relativeDir, VISUAL_SMOKE_RUNTIME_RELATIVE_DIR);
  assert.equal(defaultOutput.dir, path.join(repoRoot, VISUAL_SMOKE_RUNTIME_RELATIVE_DIR));
  assert.equal(defaultOutput.writesCommittedBaseline, false);
  assert.match(defaultOutput.outputPolicy, /tmp\/visual-smoke-uiux-screenshots/);
  assert.match(defaultOutput.outputPolicy, /VISUAL_SMOKE_UPDATE_BASELINE=1/);

  const nonOptInOutput = resolveVisualSmokeOutput({
    cwd: repoRoot,
    env: { VISUAL_SMOKE_UPDATE_BASELINE: 'true' },
  });
  assert.equal(nonOptInOutput.mode, 'runtime-temp');
  assert.equal(nonOptInOutput.writesCommittedBaseline, false);

  const refreshOutput = resolveVisualSmokeOutput({
    cwd: repoRoot,
    env: { VISUAL_SMOKE_UPDATE_BASELINE: '1' },
  });
  assert.equal(refreshOutput.mode, 'committed-baseline-refresh');
  assert.equal(refreshOutput.relativeDir, VISUAL_SMOKE_BASELINE_RELATIVE_DIR);
  assert.equal(refreshOutput.dir, path.join(repoRoot, VISUAL_SMOKE_BASELINE_RELATIVE_DIR));
  assert.equal(refreshOutput.writesCommittedBaseline, true);
  assert.match(
    refreshOutput.outputPolicy,
    /intentionally refreshes the committed reports\/2026-05-15-uiux-screenshots baseline/,
  );

  assert.match(gitignore, /^tmp\/$/m);
});
