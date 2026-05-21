const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  FOCUSED_VALIDATION_REGISTRY,
  SUPPORTED_FOCUSED_VALIDATION_FLAGS,
  focusedValidationRequested,
} = require('../scripts/validate-content-focus-registry');

const repoRoot = path.resolve(__dirname, '..');

function collectFocusFlagsFromSourceTree() {
  const flags = new Set();
  const stack = ['scripts', 'tests'];

  while (stack.length > 0) {
    const relativeDir = stack.pop();
    const absoluteDir = path.join(repoRoot, relativeDir);
    for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const relativePath = path.join(relativeDir, entry.name);
      const absolutePath = path.join(repoRoot, relativePath);
      if (entry.isDirectory()) {
        stack.push(relativePath);
        continue;
      }
      if (relativePath === path.join('scripts', 'validate-content-focus-registry.js')) {
        continue;
      }
      if (!/\.(?:js|ts|tsx)$/.test(entry.name)) continue;
      const source = fs.readFileSync(absolutePath, 'utf8');
      for (const match of source.matchAll(/--focus-[a-z0-9-]+/g)) {
        if (match[0] === '--focus-not-real') continue;
        flags.add(match[0]);
      }
    }
  }

  return flags;
}

function readPackageJson() {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
}

function createFakeNpm(tmpDir) {
  const fakeNpm = path.join(tmpDir, 'npm');
  fs.writeFileSync(
    fakeNpm,
    ['#!/bin/sh', 'printf "%s\\n" "$*" >> "$TEST_DISPATCH_LOG"', 'exit 0', ''].join('\n'),
    { mode: 0o755 },
  );
  return fakeNpm;
}

function runDispatcher(args, env) {
  return spawnSync(process.execPath, ['scripts/test-dispatch.js', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env,
  });
}

function runPackageTest(args, env) {
  return spawnSync('npm', ['test', '--', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env,
  });
}

test('npm test keeps selector routing in the project dispatcher', () => {
  const pkg = readPackageJson();
  const testContentScript = pkg.scripts['test:content'];

  assert.equal(pkg.scripts.test, 'node scripts/test-dispatch.js');
  assert.doesNotMatch(pkg.scripts.test, /&&/);
  assert.match(testContentScript, /tests\/content-test-script-routing\.test\.js/);
  assert.equal(
    (testContentScript.match(/tests\/content-study-reminder-runtime-parity\.test\.js/g) ?? [])
      .length,
    1,
    'test:content must include the study reminder runtime parity guard exactly once',
  );
});

test('QuestionCard accessibility parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const questionCardTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-question-card-accessibility-parity.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /focusedValidationRequested\('questionCardAccessibility'\)/);
  assert.equal(
    focusedValidationRequested('questionCardAccessibility', [
      '--focus-question-card-accessibility',
    ]),
    true,
  );
  assert.match(
    validatorSource,
    /validateQuestionCardAccessibilityParity\(\);[\s\S]*questionCardAccessibilityRulesValidated[\s\S]*questionCardAccessibilityParityValidated/,
  );
  assert.match(questionCardTestSource, /--focus-question-card-accessibility/);
  assert.doesNotMatch(
    questionCardTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'QuestionCard accessibility tests must not route through full content validation',
  );
});

test('ChapterCard accessibility parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const chapterCardTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-chapter-card-accessibility-parity.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /focusedValidationRequested\('chapterCardAccessibility'\)/);
  assert.equal(
    focusedValidationRequested('chapterCardAccessibility', ['--focus-chapter-card-accessibility']),
    true,
  );
  assert.match(
    validatorSource,
    /validateChapterCardAccessibilityParity\(\);[\s\S]*chapterCardAccessibilityRulesValidated[\s\S]*chapterCardAccessibilityParityValidated/,
  );
  assert.match(chapterCardTestSource, /--focus-chapter-card-accessibility/);
  assert.doesNotMatch(
    chapterCardTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'ChapterCard accessibility tests must not route through full content validation',
  );
});

test('answer feedback parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const answerFeedbackTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-answer-feedback-parity.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /focusedValidationRequested\('answerFeedbackParity'\)/);
  assert.equal(
    focusedValidationRequested('answerFeedbackParity', ['--focus-answer-feedback-parity']),
    true,
  );
  assert.match(
    validatorSource,
    /validateAnswerValidationTypeSchemaParity\(\);[\s\S]*validateAnswerFeedbackParity\(\);[\s\S]*answerFeedbackRuntimeParityValidated/,
  );
  assert.match(answerFeedbackTestSource, /--focus-answer-feedback-parity/);
  assert.doesNotMatch(
    answerFeedbackTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'answer feedback tests must not route through full content validation',
  );
});

test('question report link parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const reportLinkTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-question-report-link-parity.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /focusedValidationRequested\('questionReportLinkParity'\)/);
  assert.equal(
    focusedValidationRequested('questionReportLinkParity', ['--focus-question-report-link-parity']),
    true,
  );
  assert.match(
    validatorSource,
    /validateQuestionReportLinkParity\(\);[\s\S]*questionReportLinkRulesValidated[\s\S]*questionReportLinkParityValidated/,
  );
  assert.match(reportLinkTestSource, /--focus-question-report-link-parity/);
  assert.doesNotMatch(
    reportLinkTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'QuestionReportLink parity tests must not route through full content validation',
  );
});

test('Mistakes route copy parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const mistakesRouteTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-mistakes-route-copy-parity.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /focusedValidationRequested\('mistakesRouteCopy'\)/);
  assert.equal(
    focusedValidationRequested('mistakesRouteCopy', ['--focus-mistakes-route-copy']),
    true,
  );
  assert.match(
    validatorSource,
    /validateMistakesRouteCopyParity\(\);[\s\S]*mistakesRouteCopyLabelsValidated[\s\S]*mistakesRouteCopyParityValidated/,
  );
  assert.match(mistakesRouteTestSource, /--focus-mistakes-route-copy/);
  assert.doesNotMatch(
    mistakesRouteTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'Mistakes route copy tests must not route through full content validation',
  );
});

test('spaced repetition schema parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const spacedRepetitionTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-spaced-repetition-schema.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /focusedValidationRequested\('spacedRepetitionSchema'\)/);
  assert.equal(
    focusedValidationRequested('spacedRepetitionSchema', ['--focus-spaced-repetition-schema']),
    true,
  );
  assert.match(
    validatorSource,
    /validateSpacedRepetitionSchedule\(\);[\s\S]*spacedRepetitionIntervalsValidated[\s\S]*spacedRepetitionRuntimeInputParityValidated/,
  );
  assert.match(spacedRepetitionTestSource, /--focus-spaced-repetition-schema/);
  assert.doesNotMatch(
    spacedRepetitionTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'spaced repetition tests must not route through full content validation',
  );
});

test('validate-content focus registry is the shared focus flag source', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const usedFocusFlags = collectFocusFlagsFromSourceTree();
  const unsupportedUsedFlags = Array.from(usedFocusFlags)
    .filter((flag) => !SUPPORTED_FOCUSED_VALIDATION_FLAGS.has(flag))
    .sort();

  assert.match(validatorSource, /validate-content-focus-registry/);
  assert.equal(
    validatorSource.indexOf('rejectUnsupportedFocusedValidationFlags();') <
      validatorSource.indexOf("require('typescript')"),
    true,
    'unknown focus flags must be rejected before TypeScript is loaded',
  );
  assert.doesNotMatch(
    validatorSource,
    /SUPPORTED_FOCUSED_VALIDATION_FLAGS\s*=\s*new Set/,
    'validate-content.js must import the focus registry instead of duplicating it',
  );
  assert.deepEqual(unsupportedUsedFlags, []);

  for (const entry of FOCUSED_VALIDATION_REGISTRY) {
    assert.ok(entry.id, 'focused validation registry entries need stable ids');
    assert.ok(entry.flags.length > 0, `${entry.id} must register at least one flag`);
    assert.ok(entry.summaryKeys.length > 0, `${entry.id} must declare summary keys`);
    assert.equal(
      focusedValidationRequested(entry.id, entry.flags),
      true,
      `${entry.id} should route through the registry helper`,
    );
  }
});

test('unknown focused validator flags fail before heavy validator imports', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-focus-unknown-'));
  const preload = path.join(tmpDir, 'preload.js');
  fs.writeFileSync(
    preload,
    [
      "const Module = require('node:module');",
      'const originalLoad = Module._load;',
      'Module._load = function guardedLoad(request, parent, isMain) {',
      "  if (request === 'typescript' || request === './export-site-question-bank') {",
      '    console.error(`heavy validator import loaded: ${request}`);',
      '    process.exit(99);',
      '  }',
      '  return originalLoad.apply(this, arguments);',
      '};',
      '',
    ].join('\n'),
  );

  try {
    const result = spawnSync(
      process.execPath,
      ['--require', preload, 'scripts/validate-content.js', '--focus-not-real'],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        env: { ...process.env, NODE_OPTIONS: '--v8-pool-size=1' },
      },
    );

    assert.equal(result.status, 1, result.stderr || result.stdout);
    assert.match(result.stderr, /Unsupported validate-content focus flag: --focus-not-real/);
    assert.doesNotMatch(result.stderr, /heavy validator import loaded/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('monetization selector runs only the focused monetization suite', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-dispatch-routing-'));
  const npmLog = path.join(tmpDir, 'npm.log');
  const env = {
    ...process.env,
    TEST_DISPATCH_CAPTURE: '1',
    TEST_DISPATCH_LOG: npmLog,
    TEST_DISPATCH_NPM: createFakeNpm(tmpDir),
  };

  try {
    const selectedResult = runDispatcher(['--', 'monetization'], env);
    assert.equal(selectedResult.status, 0, selectedResult.stderr || selectedResult.stdout);
    assert.equal(fs.readFileSync(npmLog, 'utf8'), 'run test:monetization\n');

    fs.writeFileSync(npmLog, '');
    const fullResult = runDispatcher([], env);
    assert.equal(fullResult.status, 0, fullResult.stderr || fullResult.stdout);
    assert.equal(fs.readFileSync(npmLog, 'utf8'), 'run test:all\n');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('package npm test selector enters the dispatcher before running suites', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-dispatch-package-routing-'));
  const npmLog = path.join(tmpDir, 'npm.log');
  const env = {
    ...process.env,
    npm_config_loglevel: 'silent',
    TEST_DISPATCH_CAPTURE: '1',
    TEST_DISPATCH_LOG: npmLog,
    TEST_DISPATCH_NPM: createFakeNpm(tmpDir),
  };

  try {
    const selectedResult = runPackageTest(['monetization'], env);
    assert.equal(selectedResult.status, 0, selectedResult.stderr || selectedResult.stdout);
    assert.equal(fs.readFileSync(npmLog, 'utf8'), 'run test:monetization\n');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('unsupported npm test selectors fail before running any suite', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-dispatch-unsupported-'));
  const npmLog = path.join(tmpDir, 'npm.log');
  const env = {
    ...process.env,
    TEST_DISPATCH_CAPTURE: '1',
    TEST_DISPATCH_LOG: npmLog,
    TEST_DISPATCH_NPM: createFakeNpm(tmpDir),
  };

  try {
    const result = runDispatcher(['bogus'], env);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Unsupported npm test selector: bogus/);
    assert.match(result.stderr, /monetization -> npm run test:monetization/);
    assert.equal(fs.existsSync(npmLog), false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
