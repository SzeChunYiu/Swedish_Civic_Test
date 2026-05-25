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
const moduleCache = new Map();

function readManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function resolveLocalModule(fromFilePath, request) {
  const base = path.resolve(path.dirname(fromFilePath), request);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, 'index.ts')];
  const found = candidates.find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );
  if (!found) throw new Error(`Cannot resolve ${request} from ${fromFilePath}`);
  return found;
}

function loadTs(relativePath) {
  const filePath = path.join(repoRoot, relativePath);
  if (moduleCache.has(filePath)) return moduleCache.get(filePath).exports;

  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  moduleCache.set(filePath, mod);

  function localRequire(request) {
    if (request.startsWith('.')) {
      return loadTs(path.relative(repoRoot, resolveLocalModule(filePath, request)));
    }
    return require(request);
  }

  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  return mod.exports;
}

function expectedVisualSmokeRoutes() {
  const { assertValidVisualSmokeRouteEntries, visualSmokeRouteManifestEntries } = loadTs(
    'tests/e2e/visualSmokeRoutes.ts',
  );
  const routes = visualSmokeRouteManifestEntries();

  assertValidVisualSmokeRouteEntries(routes);
  return routes;
}

function visualSmokeDuplicateContract() {
  const {
    assertValidVisualSmokeRouteEntries,
    collectVisualSmokeDuplicateHashGroups,
    findUnexplainedVisualSmokeDuplicateReports,
    formatVisualSmokeDuplicateHashGroupReport,
    hasValidVisualSmokeDuplicateExplanation,
    isExplainedVisualSmokeDuplicate,
    validateVisualSmokeRouteEntries,
    validateVisualSmokeDuplicateExplanations,
    visualSmokeDuplicateExplanationKey,
    visualSmokeDuplicateExplanations,
  } = loadTs('tests/e2e/visualSmokeRoutes.ts');

  return {
    assertValidVisualSmokeRouteEntries,
    collectVisualSmokeDuplicateHashGroups,
    findUnexplainedVisualSmokeDuplicateReports,
    formatVisualSmokeDuplicateHashGroupReport,
    hasValidVisualSmokeDuplicateExplanation,
    isExplainedVisualSmokeDuplicate,
    validateVisualSmokeRouteEntries,
    validateVisualSmokeDuplicateExplanations,
    visualSmokeDuplicateExplanationKey,
    visualSmokeDuplicateExplanations,
  };
}

function loadLaunchAdSuppressionPolicy() {
  const { shouldSuppressLaunchPopupAdForPath } = loadTs('lib/monetization/ads.ts');
  return { shouldSuppressLaunchPopupAdForPath };
}

test('visual smoke uses the shared route filename contract and blocking modal overlay locator', () => {
  const browserLaunchSource = readRepoFile('tests/e2e/browserLaunch.ts');
  const visualSmokeSource = readRepoFile('tests/e2e/visual-smoke.spec.ts');
  const visualSmokeReportSource = readRepoFile('scripts/visual-smoke-report.test.js');
  const visualSmokeRoutesSource = readRepoFile('tests/e2e/visualSmokeRoutes.ts');

  assert.match(browserLaunchSource, /export const blockingModalOverlayLocator/);
  assert.match(browserLaunchSource, /\[role="dialog"\]\[aria-modal="true"\]/);
  assert.match(browserLaunchSource, /\[role="menu"\]\[aria-modal="true"\]/);
  assert.match(browserLaunchSource, /function activateBlockingModalControl/);
  assert.match(browserLaunchSource, /dispatchEvent\('click', undefined, \{ timeout: 2_000 \}\)/);
  assert.match(
    visualSmokeSource,
    /import \{[\s\S]*visualSmokeRouteManifestEntries[\s\S]*\} from '\.\/visualSmokeRoutes';/,
  );
  assert.match(visualSmokeSource, /visualSmokeRouteManifestEntries\(\)/);
  assert.match(visualSmokeSource, /assertValidVisualSmokeRouteEntries\(routeEntries\)/);
  assert.match(visualSmokeSource, /visualSmokeDuplicateExplanations/);
  assert.match(visualSmokeSource, /findUnexplainedVisualSmokeDuplicateReports/);
  assert.doesNotMatch(visualSmokeSource, /const routes = \[/);
  assert.doesNotMatch(visualSmokeSource, /\bvisualSmokeRoutes\b,/);
  assert.doesNotMatch(visualSmokeSource, /explainedDuplicateScreenshotGroups/);
  assert.doesNotMatch(visualSmokeSource, /\$\{name\}\.png/);
  assert.match(visualSmokeRoutesSource, /file: 'index\.png'/);
  assert.match(visualSmokeRoutesSource, /file: 'chapter-ch01\.png'/);
  assert.match(visualSmokeRoutesSource, /export function visualSmokeRouteManifestEntries/);
  assert.match(visualSmokeRoutesSource, /export function validateVisualSmokeRouteEntries/);
  assert.match(visualSmokeRoutesSource, /export function assertValidVisualSmokeRouteEntries/);
  assert.match(visualSmokeRoutesSource, /export const visualSmokeDuplicateExplanations/);
  assert.match(visualSmokeRoutesSource, /export function hasValidVisualSmokeDuplicateExplanation/);
  assert.match(visualSmokeRoutesSource, /export function validateVisualSmokeDuplicateExplanations/);
  assert.match(visualSmokeRoutesSource, /export function isExplainedVisualSmokeDuplicate/);
  assert.match(visualSmokeRoutesSource, /export function collectVisualSmokeDuplicateHashGroups/);
  assert.match(
    visualSmokeRoutesSource,
    /export function formatVisualSmokeDuplicateHashGroupReport/,
  );
  assert.match(
    visualSmokeRoutesSource,
    /export function findUnexplainedVisualSmokeDuplicateReports/,
  );
  assert.match(
    visualSmokeSource,
    /import \{[\s\S]*blockingModalOverlayLocator[\s\S]*dismissBlockingModals[\s\S]*seedFreshFirstRunSettingsLanguage[\s\S]*\} from '\.\/browserLaunch';/,
  );
  assert.match(visualSmokeReportSource, /assertValidVisualSmokeRouteEntries\(routes\)/);
  assert.match(visualSmokeReportSource, /validateVisualSmokeRouteEntries/);
  assert.match(visualSmokeSource, /page\.locator\(blockingModalOverlayLocator\)/);
  assert.match(
    visualSmokeSource,
    /shared modal dismissal helper closes forced first-run guide and language picker/,
  );
  assert.match(visualSmokeSource, /seedFreshFirstRunSettingsLanguage\(page, 'sv'\)/);
  assert.match(visualSmokeSource, /firstRunDismissal\.firstRunAboutDismissed/);
  assert.match(visualSmokeSource, /languagePickerDismissal\.languagePickerDismissed/);
  assert.doesNotMatch(
    visualSmokeSource,
    /page\.locator\('\[role="dialog"\]\[aria-modal="true"\]'\)/,
  );
});

test('visual smoke route entry validator rejects duplicate and unsafe entries', () => {
  const { assertValidVisualSmokeRouteEntries, validateVisualSmokeRouteEntries } =
    visualSmokeDuplicateContract();
  const validRoutes = expectedVisualSmokeRoutes();

  assert.deepEqual(validateVisualSmokeRouteEntries(validRoutes), []);
  assert.doesNotThrow(() => assertValidVisualSmokeRouteEntries(validRoutes));

  const invalidCases = [
    {
      label: 'blank route name',
      routes: [{ ...validRoutes[0], name: '   ' }],
      pattern: /blank route name/,
    },
    {
      label: 'duplicate route name',
      routes: [validRoutes[0], { ...validRoutes[1], name: validRoutes[0].name }],
      pattern: /route name "index" is duplicated by entries 1, 2/,
    },
    {
      label: 'duplicate route path',
      routes: [validRoutes[0], { ...validRoutes[1], route: validRoutes[0].route }],
      pattern: /route path "\/" is duplicated by entries 1, 2/,
    },
    {
      label: 'duplicate screenshot file',
      routes: [validRoutes[0], { ...validRoutes[1], file: validRoutes[0].file }],
      pattern: /screenshot file "index\.png" is duplicated by entries 1, 2/,
    },
    {
      label: 'unsafe nested screenshot file',
      routes: [{ ...validRoutes[0], file: '../index.png' }],
      pattern: /safe \.png basename/,
    },
    {
      label: 'unsafe extension',
      routes: [{ ...validRoutes[0], file: 'index.jpg' }],
      pattern: /safe \.png basename/,
    },
    {
      label: 'blank route path',
      routes: [{ ...validRoutes[0], route: ' ' }],
      pattern: /blank route path/,
    },
    {
      label: 'relative route path',
      routes: [{ ...validRoutes[0], route: 'home' }],
      pattern: /must start with \//,
    },
  ];

  for (const { label, routes, pattern } of invalidCases) {
    const errors = validateVisualSmokeRouteEntries(routes).join('\n');

    assert.match(errors, pattern, label);
    assert.throws(
      () => assertValidVisualSmokeRouteEntries(routes),
      /Visual smoke route entries are invalid:/,
      label,
    );
  }
});

test('visual smoke includes a focused proof for first-run and language picker dismissal', () => {
  const visualSmokeSource = readRepoFile('tests/e2e/visual-smoke.spec.ts');

  assert.match(
    visualSmokeSource,
    /shared modal dismissal helper closes forced first-run guide and language picker/,
  );
  assert.match(visualSmokeSource, /seedFreshFirstRunSettingsLanguage\(page, 'sv'\)/);
  assert.match(
    visualSmokeSource,
    /getByRole\('dialog', \{ name: 'Vad är medborgarskapsprovet\?' \}\)/,
  );
  assert.match(visualSmokeSource, /firstRunDismissal\.firstRunAboutDismissed\)\.toBe\(true\)/);
  assert.match(visualSmokeSource, /languagePickerDismissal\.languagePickerDismissed/);
  assert.match(visualSmokeSource, /Nuvarande språk SV\\\. Öppna språkväljaren\\\./);
  assert.match(visualSmokeSource, /locator\(blockingModalOverlayLocator\)\)\.toHaveCount\(0\)/);
});

test('visual smoke duplicate helper requires exact groups and nonempty reasons', () => {
  const {
    hasValidVisualSmokeDuplicateExplanation,
    isExplainedVisualSmokeDuplicate,
    validateVisualSmokeDuplicateExplanations,
    visualSmokeDuplicateExplanationKey,
    visualSmokeDuplicateExplanations,
  } = visualSmokeDuplicateContract();
  const exactHomeIndexExplanation = {
    names: ['home', 'index'],
    reason: 'The root route is a redirect to /home.',
  };

  assert.equal(visualSmokeDuplicateExplanationKey(['index', 'home']), 'home,index');
  assert.equal(isExplainedVisualSmokeDuplicate(['index', 'home']), true);

  for (const explanation of visualSmokeDuplicateExplanations) {
    assert.equal(hasValidVisualSmokeDuplicateExplanation(explanation), true);
  }
  assert.deepEqual(validateVisualSmokeDuplicateExplanations(), []);

  const duplicateCases = [
    {
      label: 'same group with reversed order',
      names: ['index', 'home'],
      explanations: [exactHomeIndexExplanation],
      expected: true,
    },
    {
      label: 'superset of the allowed duplicate group',
      names: ['home', 'index', 'practice'],
      explanations: [exactHomeIndexExplanation],
      expected: false,
    },
    {
      label: 'subset of the allowed duplicate group',
      names: ['home'],
      explanations: [exactHomeIndexExplanation],
      expected: false,
    },
    {
      label: 'unknown duplicate group',
      names: ['learn', 'practice'],
      explanations: [exactHomeIndexExplanation],
      expected: false,
    },
    {
      label: 'exact group with an empty reason',
      names: ['home', 'index'],
      explanations: [{ names: ['home', 'index'], reason: '' }],
      expected: false,
    },
    {
      label: 'exact group with a blank reason',
      names: ['home', 'index'],
      explanations: [{ names: ['home', 'index'], reason: '   ' }],
      expected: false,
    },
  ];

  for (const { label, names, explanations, expected } of duplicateCases) {
    assert.equal(isExplainedVisualSmokeDuplicate(names, explanations), expected, label);
  }

  const invalidExplanationCases = [
    { names: ['home', 'index'], reason: '' },
    { names: ['home', 'index'], reason: '   ' },
    { names: ['home', 'index'], reason: 'Too short.' },
    { names: ['home'], reason: 'A singleton cannot describe a duplicate screenshot group.' },
    { names: ['home', 'home'], reason: 'Duplicate names cannot describe two screenshots.' },
    { names: ['home', 'missing-route'], reason: 'Unknown route names cannot explain screenshots.' },
  ];

  for (const explanation of invalidExplanationCases) {
    assert.equal(hasValidVisualSmokeDuplicateExplanation(explanation), false);
  }

  const invalidConfigCases = [
    {
      explanations: [
        { names: ['home'], reason: 'A singleton cannot describe a duplicate screenshot group.' },
      ],
      pattern: /must describe at least two routes/,
    },
    {
      explanations: [
        { names: ['home', 'home'], reason: 'Duplicate route names should fail this guard.' },
      ],
      pattern: /contains duplicate route names/,
    },
    {
      explanations: [
        { names: ['home', 'missing-route'], reason: 'Unknown route names should fail this guard.' },
      ],
      pattern: /references unknown route missing-route/,
    },
    {
      explanations: [
        { names: ['home', 'index'], reason: 'The root route can match the home route.' },
        { names: ['index', 'home'], reason: 'A duplicate allowed group should fail this guard.' },
      ],
      pattern: /duplicates allowed group home,index/,
    },
    {
      explanations: [{ names: ['home', 'index'], reason: '   ' }],
      pattern: /reason is blank or too short/,
    },
    {
      explanations: [{ names: ['home', 'index'], reason: 'Too short.' }],
      pattern: /reason is blank or too short/,
    },
  ];

  for (const { explanations, pattern } of invalidConfigCases) {
    assert.match(validateVisualSmokeDuplicateExplanations(explanations).join('\n'), pattern);
  }
});

test('visual smoke duplicate collector groups hashes consistently for runtime and manifest checks', () => {
  const { collectVisualSmokeDuplicateHashGroups } = visualSmokeDuplicateContract();
  const capture = (name, sha256) => ({
    file: `${name}.png`,
    name,
    route: name === 'index' ? '/' : `/${name}`,
    sha256,
  });
  const cases = [
    {
      label: 'empty capture set',
      captures: [],
      expected: [],
    },
    {
      label: 'singleton hashes are ignored',
      captures: [capture('learn', 'learn-hash'), capture('practice', 'practice-hash')],
      expected: [],
    },
    {
      label: 'explained home/index pair is retained and marked explained',
      captures: [capture('index', 'home-index-hash'), capture('home', 'home-index-hash')],
      expected: [
        {
          captures: ['index', 'home'],
          explained: true,
          names: ['index', 'home'],
          sha256: 'home-index-hash',
        },
      ],
    },
    {
      label: 'unexplained pair is retained and marked actionable',
      captures: [capture('practice', 'quiz-hash'), capture('learn', 'quiz-hash')],
      expected: [
        {
          captures: ['practice', 'learn'],
          explained: false,
          names: ['practice', 'learn'],
          sha256: 'quiz-hash',
        },
      ],
    },
    {
      label: 'three-route duplicate group preserves first-seen route order',
      captures: [
        capture('settings', 'shared-hash'),
        capture('privacy', 'unique-hash'),
        capture('terms', 'shared-hash'),
        capture('support', 'shared-hash'),
      ],
      expected: [
        {
          captures: ['settings', 'terms', 'support'],
          explained: false,
          names: ['settings', 'terms', 'support'],
          sha256: 'shared-hash',
        },
      ],
    },
    {
      label: 'hash groups keep first-seen hash order',
      captures: [
        capture('settings', 'second-hash'),
        capture('learn', 'first-hash'),
        capture('profile', 'second-hash'),
        capture('practice', 'first-hash'),
      ],
      expected: [
        {
          captures: ['settings', 'profile'],
          explained: false,
          names: ['settings', 'profile'],
          sha256: 'second-hash',
        },
        {
          captures: ['learn', 'practice'],
          explained: false,
          names: ['learn', 'practice'],
          sha256: 'first-hash',
        },
      ],
    },
  ];

  for (const { captures, expected, label } of cases) {
    const groups = collectVisualSmokeDuplicateHashGroups(captures);

    assert.deepEqual(
      groups.map((group) => ({
        captures: group.captures.map((captureEntry) => captureEntry.name),
        explained: group.explained,
        names: group.names,
        sha256: group.sha256,
      })),
      expected,
      label,
    );
  }
});

test('visual smoke duplicate failure reports include route paths and screenshot files', () => {
  const { findUnexplainedVisualSmokeDuplicateReports, formatVisualSmokeDuplicateHashGroupReport } =
    visualSmokeDuplicateContract();
  const captures = [
    {
      file: 'learn.png',
      name: 'learn',
      route: '/learn',
      sha256: 'duplicate-hash',
    },
    {
      file: 'practice.png',
      name: 'practice',
      route: '/practice',
      sha256: 'duplicate-hash',
    },
    {
      file: 'home.png',
      name: 'home',
      route: '/home',
      sha256: 'explained-home-index-hash',
    },
    {
      file: 'index.png',
      name: 'index',
      route: '/',
      sha256: 'explained-home-index-hash',
    },
    {
      file: 'profile.png',
      name: 'profile',
      route: '/profile',
      sha256: 'unique-hash',
    },
  ];

  assert.deepEqual(findUnexplainedVisualSmokeDuplicateReports(captures), [
    'duplicate-hash: learn (/learn -> learn.png), practice (/practice -> practice.png)',
  ]);
  assert.equal(
    formatVisualSmokeDuplicateHashGroupReport({
      captures: [captures[1], captures[0]],
      sha256: 'duplicate-hash',
    }),
    'duplicate-hash: learn (/learn -> learn.png), practice (/practice -> practice.png)',
  );
});

test('visual smoke manifest matches the shared route list and screenshot filenames without launch overlays', () => {
  const manifest = readManifest();
  const expectedRoutes = expectedVisualSmokeRoutes();
  const {
    collectVisualSmokeDuplicateHashGroups,
    findUnexplainedVisualSmokeDuplicateReports,
    formatVisualSmokeDuplicateHashGroupReport,
    hasValidVisualSmokeDuplicateExplanation,
    validateVisualSmokeDuplicateExplanations,
    visualSmokeDuplicateExplanations,
  } = visualSmokeDuplicateContract();
  const { shouldSuppressLaunchPopupAdForPath } = loadLaunchAdSuppressionPolicy();
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
  assert.deepEqual(manifest.duplicateExplanations, visualSmokeDuplicateExplanations);
  assert.deepEqual(validateVisualSmokeDuplicateExplanations(manifest.duplicateExplanations), []);
  for (const explanation of manifest.duplicateExplanations) {
    assert.ok(Array.isArray(explanation.names));
    assert.equal(typeof explanation.reason, 'string');
    assert.ok(explanation.reason.length > 20);
    assert.equal(hasValidVisualSmokeDuplicateExplanation(explanation), true);
  }

  const routes = manifest.routes || [];
  assert.deepEqual(
    routes.map(({ file, name, route }) => ({ file, name, route })),
    expectedRoutes,
  );

  for (const [index, route] of routes.entries()) {
    const expectedRoute = expectedRoutes[index];
    assert.equal(typeof route.name, 'string');
    assert.equal(typeof route.file, 'string');
    assert.equal(route.name, expectedRoute.name);
    assert.equal(route.file, expectedRoute.file);
    assert.equal(route.route, expectedRoute.route);
    assert.equal(typeof route.firstRunAboutDismissed, 'boolean');
    assert.equal(typeof route.languagePickerDismissed, 'boolean');
    assert.equal(typeof route.launchOverlayDismissed, 'boolean');
    assert.equal(route.launchOverlayVisibleAfterDismissal, false);
    assert.ok(
      route.launchOverlayDismissed || shouldSuppressLaunchPopupAdForPath(route.route),
      `${route.name} should either dismiss or suppress the launch overlay`,
    );

    const screenshotPath = path.join(screenshotDir, route.file);
    assert.ok(fs.existsSync(screenshotPath), `${route.file} should exist`);
    assert.ok(fs.statSync(screenshotPath).size > 10_000, `${route.file} should not be empty`);
    assert.equal(route.sha256, sha256File(screenshotPath), `${route.file} hash should match`);
  }
  assert.ok(
    routes.some((route) => route.firstRunAboutDismissed === false),
    'ordinary visual-smoke baselines may record no first-run dismissal when no first-run guide is present',
  );
  assert.ok(
    routes.some((route) => route.languagePickerDismissed === false),
    'ordinary visual-smoke baselines may record no language-picker dismissal when no picker is present',
  );

  const unexplainedDuplicates = findUnexplainedVisualSmokeDuplicateReports(routes);
  const duplicateHashGroups = collectVisualSmokeDuplicateHashGroups(routes);

  assert.deepEqual(
    unexplainedDuplicates,
    duplicateHashGroups
      .filter((group) => !group.explained)
      .map(formatVisualSmokeDuplicateHashGroupReport),
  );
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
