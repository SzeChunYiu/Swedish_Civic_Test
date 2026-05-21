const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

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

test('npm test keeps selector routing in the project dispatcher', () => {
  const pkg = readPackageJson();

  assert.equal(pkg.scripts.test, 'node scripts/test-dispatch.js');
  assert.doesNotMatch(pkg.scripts.test, /&&/);
  assert.match(pkg.scripts['test:content'], /tests\/content-test-script-routing\.test\.js/);
});

test('question report link parity runs through its focused validator path', () => {
  const pkg = readPackageJson();
  const source = fs.readFileSync(
    path.join(repoRoot, 'tests/content-question-report-link-parity.test.js'),
    'utf8',
  );

  assert.match(pkg.scripts['test:content'], /tests\/content-question-report-link-parity\.test\.js/);
  assert.match(source, /--focus-question-report-link-parity/);
  assert.match(source, /process\.argv\.push\('--focus-question-report-link-parity'\)/);
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

test('answer shuffle parity uses the focused content validator path', () => {
  const validator = fs.readFileSync(path.join(repoRoot, 'scripts/validate-content.js'), 'utf8');
  const parityTest = fs.readFileSync(
    path.join(repoRoot, 'tests/content-answer-shuffle-parity.test.js'),
    'utf8',
  );
  const focusBlockStart = validator.indexOf(
    "process.argv.includes('--focus-answer-shuffle-parity')",
  );
  const focusBlockEnd =
    focusBlockStart === -1 ? -1 : validator.indexOf('process.exit(0);', focusBlockStart);
  const focusBlock =
    focusBlockStart === -1 || focusBlockEnd === -1
      ? ''
      : validator.slice(focusBlockStart, focusBlockEnd);
  const focusFlagMatches = parityTest.match(/--focus-answer-shuffle-parity/g) || [];

  assert.notEqual(focusBlockStart, -1, 'validate-content needs the answer-shuffle focus flag');
  assert.match(focusBlock, /validateAnswerShuffleDistributionParity\(\);/);
  assert.match(focusBlock, /answerShuffleDistributionParityValidated/);
  assert.match(focusBlock, /publishedQuestions/);
  assert.ok(
    focusFlagMatches.length >= 3,
    'positive and mutation answer-shuffle checks should use the focused validator',
  );
});

test('answer feedback focused content validation runs only its parity summary', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-answer-feedback-parity'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused answer feedback validation should print JSON summary');
  const summary = JSON.parse(match[0]);

  assert.equal(summary.answerValidationTypeSchemaParityValidated, true);
  assert.equal(summary.answerFeedbackRuntimeParityValidated, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(summary, 'questionCardAccessibilityParityValidated'),
    false,
  );
});

test('exam submission finality focused validation runs only its parity summary', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-exam-submission-finality-parity'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused exam submission validation should print JSON summary');
  const summary = JSON.parse(match[0]);

  assert.equal(summary.examSubmissionFinalityParityValidated, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(summary, 'progressQuestionSchemaParityValidated'),
    false,
  );
});

test('UHR reference card focused content validation runs only its accessibility summary', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-uhr-reference-card-accessibility'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused UHR reference validation should print JSON summary');
  const summary = JSON.parse(match[0]);

  assert.equal(summary.uhrReferenceCardAccessibilityRulesValidated, 15);
  assert.equal(summary.uhrReferenceCardAccessibilityParityValidated, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(summary, 'answerFeedbackRuntimeParityValidated'),
    false,
  );
});

test('AudioButton focused content validation runs only its accessibility summary', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-audio-button-accessibility'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused AudioButton validation should print JSON summary');
  const summary = JSON.parse(match[0]);

  assert.equal(summary.audioButtonAccessibilityRulesValidated, 15);
  assert.equal(summary.audioButtonAccessibilityParityValidated, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(summary, 'speechRuntimeParityValidated'),
    false,
  );
});

test('speech runtime focused content validation runs only its speech summary', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-speech-runtime'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused speech runtime validation should print JSON summary');
  const summary = JSON.parse(match[0]);

  assert.equal(summary.speechRuntimeCasesValidated, 4);
  assert.equal(summary.speechRuntimeParityValidated, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(summary, 'audioButtonAccessibilityParityValidated'),
    false,
  );
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
