const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { FOCUSED_VALIDATION_REGISTRY } = require('../scripts/validate-content-focus-registry');

const repoRoot = path.resolve(__dirname, '..');

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

function runValidateContent(args) {
  return spawnSync(process.execPath, ['scripts/validate-content.js', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: process.env,
  });
}

function parseValidationSummary(stdout) {
  const match = stdout.match(/\{[\s\S]*\}\s*$/);
  assert.ok(match, `validation output did not end with JSON summary:\n${stdout}`);
  return JSON.parse(match[0]);
}

function focusRegistryEntry(id) {
  const entry = FOCUSED_VALIDATION_REGISTRY.find((candidate) => candidate.id === id);
  assert.ok(entry, `${id} must be registered as a validate-content focus mode`);
  return entry;
}

function assertValidatorFocusRoute(validatorSource, id, flag, summaryPattern) {
  assert.ok(focusRegistryEntry(id).flags.includes(flag), `${id} must register ${flag}`);
  assert.match(validatorSource, new RegExp(`focusedValidationRequested\\('${id}'\\)`));
  assert.match(validatorSource, new RegExp(`printFocusedValidationSummary\\('${id}'`));
  assert.match(validatorSource, summaryPattern);
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

test('validate-content focus registry covers every focused route and summary', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const registryIds = FOCUSED_VALIDATION_REGISTRY.map((entry) => entry.id).sort();
  const routedIds = Array.from(
    validatorSource.matchAll(/focusedValidationRequested\('([^']+)'\)/g),
    (match) => match[1],
  ).sort();
  const summaryIds = Array.from(
    validatorSource.matchAll(/printFocusedValidationSummary\('([^']+)'/g),
    (match) => match[1],
  ).sort();
  const seenFlags = new Set();

  assert.deepEqual(routedIds, registryIds);
  assert.deepEqual(summaryIds, registryIds);
  assert.doesNotMatch(validatorSource, /process\.argv\.includes\('--focus-/);

  for (const entry of FOCUSED_VALIDATION_REGISTRY) {
    assert.ok(entry.flags.length > 0, `${entry.id} must define at least one focus flag`);
    assert.ok(entry.summaryKeys.length > 0, `${entry.id} must define summary keys`);
    for (const flag of entry.flags) {
      assert.match(flag, /^--focus-[a-z0-9-]+$/);
      assert.equal(seenFlags.has(flag), false, `${flag} must be registered once`);
      seenFlags.add(flag);
    }
  }
});

test('registered validate-content focus summaries stay isolated', () => {
  const registryEntry = FOCUSED_VALIDATION_REGISTRY.find((entry) => entry.id === 'contentExecCwd');
  assert.ok(registryEntry);

  const result = runValidateContent(['--focus-content-exec-cwd']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const summary = parseValidationSummary(result.stdout);

  assert.deepEqual(Object.keys(summary), registryEntry.summaryKeys);
  assert.equal(summary.contentTestValidateContentExecCwdParityValidated, true);
});

test('unknown validate-content focus flags fail before full validation', () => {
  const result = runValidateContent(['--focus-not-real']);

  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /Unsupported validate-content focus flag: --focus-not-real/);
  assert.match(result.stderr, /Supported focus modes:/);
  assert.match(result.stderr, /--focus-content-exec-cwd/);
  assert.doesNotMatch(result.stderr, /Cannot find module 'typescript'/);
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

  assertValidatorFocusRoute(
    validatorSource,
    'questionCardAccessibility',
    '--focus-question-card-accessibility',
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

  assertValidatorFocusRoute(
    validatorSource,
    'chapterCardAccessibility',
    '--focus-chapter-card-accessibility',
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

  assertValidatorFocusRoute(
    validatorSource,
    'answerFeedbackParity',
    '--focus-answer-feedback-parity',
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

  assertValidatorFocusRoute(
    validatorSource,
    'questionReportLinkParity',
    '--focus-question-report-link-parity',
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

  assertValidatorFocusRoute(
    validatorSource,
    'mistakesRouteCopy',
    '--focus-mistakes-route-copy',
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

  assertValidatorFocusRoute(
    validatorSource,
    'spacedRepetitionSchema',
    '--focus-spaced-repetition-schema',
    /validateSpacedRepetitionSchedule\(\);[\s\S]*spacedRepetitionIntervalsValidated[\s\S]*spacedRepetitionRuntimeInputParityValidated/,
  );
  assert.match(spacedRepetitionTestSource, /--focus-spaced-repetition-schema/);
  assert.doesNotMatch(
    spacedRepetitionTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'spaced repetition tests must not route through full content validation',
  );
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
