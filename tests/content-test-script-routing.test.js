const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { generatedFixtureIdHelperSource } = require('../scripts/generated-question-fixture-ids');

const repoRoot = path.resolve(__dirname, '..');
const generatedSingleChoiceDuplicateFocusFlag = '--focus-generated-single-choice-duplicate-stems';

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
  });
}

test('npm test keeps selector routing in the project dispatcher', () => {
  const pkg = readPackageJson();

  assert.equal(pkg.scripts.test, 'node scripts/test-dispatch.js');
  assert.doesNotMatch(pkg.scripts.test, /&&/);
  assert.match(pkg.scripts['test:content'], /tests\/content-test-script-routing\.test\.js/);
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

test('validate-content rejects unsupported focus flags before full validation', () => {
  const result = runValidateContent(['--focus-not-a-real-mode']);
  const output = `${result.stdout}\n${result.stderr}`;

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unsupported validate-content focus flag: --focus-not-a-real-mode/);
  assert.match(result.stderr, /Supported focus modes:/);
  assert.match(result.stderr, /--focus-exam-generator-schema/);
  assert.doesNotMatch(output, /q021 published source options does not match authored source/);
});

test('validate-content known focus flags short-circuit before full validation', () => {
  const result = runValidateContent(['--focus-exam-generator-schema']);
  const output = `${result.stdout}\n${result.stderr}`;

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /"examGeneratorTypeSchemaParityValidated": true/);
  assert.doesNotMatch(output, /q021 published source options does not match authored source/);
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

test('generated single-choice duplicate focus path avoids full content parity', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', generatedSingleChoiceDuplicateFocusFlag],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, /published source options/);

  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  const summary = JSON.parse(match[0]);
  assert.ok(summary.sourceQuestions > 100);
  assert.equal(summary.generatedPublishedQuestions, summary.sourceQuestions * 4);
  assert.equal(summary.generatedSingleChoiceDuplicateStemOptionsValidated, summary.sourceQuestions);
});

test('generated single-choice duplicate focus rejects matching option-bank duplicates', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
process.argv.push('${generatedSingleChoiceDuplicateFocusFlag}');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents).replace(
      "export const generatedPublishedQuestions: PracticeQuestion[] = derivePublishedQuestions(\\n  sourceQuestions,\\n  sourceQuestions.length + 1,\\n);",
      [
        ${JSON.stringify(generatedFixtureIdHelperSource())},
        "const duplicateSectionPracticeId = generatedFixtureId('q001', 0);",
        "const duplicateJudgementId = generatedFixtureId('q001', 3);",
        "let duplicateSectionPracticeQuestion = null;",
        "export const generatedPublishedQuestions: PracticeQuestion[] = derivePublishedQuestions(",
        "  sourceQuestions,",
        "  sourceQuestions.length + 1,",
        ").map((question) => {",
        "  if (question.id === duplicateSectionPracticeId) {",
        "    duplicateSectionPracticeQuestion = question;",
        "    return question;",
        "  }",
        "  if (question.id === duplicateJudgementId && duplicateSectionPracticeQuestion) {",
        "    return {",
        "      ...question,",
        "      questionSv: duplicateSectionPracticeQuestion.questionSv,",
        "      questionEn: duplicateSectionPracticeQuestion.questionEn,",
        "      options: duplicateSectionPracticeQuestion.options.map((option) => ({ ...option })),",
        "    };",
        "  }",
        "  return question;",
        "});",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q001 generated variant\[3\] duplicates generated variant\[0\] stem\/options/,
  );
});
