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

function createFakeNode(tmpDir) {
  const fakeNode = path.join(tmpDir, 'node');
  fs.writeFileSync(
    fakeNode,
    [
      '#!/bin/sh',
      'for arg in "$@"; do',
      '  printf "%s\\n" "$arg" >> "$TEST_DISPATCH_LOG"',
      'done',
      'exit 0',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );
  return fakeNode;
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

function runPackageContentFocused(args, env) {
  return spawnSync('npm', ['run', 'test:content-focused', '--', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env,
  });
}

function readValidateContentSource() {
  return fs.readFileSync(path.join(repoRoot, 'scripts/validate-content.js'), 'utf8');
}

function readFocusedValidationRegistryModule() {
  const modulePath = path.join(repoRoot, 'scripts/validate-content-focus-registry.js');
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

function readFocusedValidationRegistrySource() {
  return fs.readFileSync(path.join(repoRoot, 'scripts/validate-content-focus-registry.js'), 'utf8');
}

function extractFocusedValidationRegistry() {
  return readFocusedValidationRegistryModule().FOCUSED_VALIDATION_REGISTRY;
}

function focusedValidationBlock(source, id) {
  const start = source.indexOf(`focusedValidationRequested('${id}')`);
  assert.notEqual(start, -1, `${id} must have a focused validation route`);
  const exitIndex = source.indexOf('process.exit(0);', start);
  assert.notEqual(exitIndex, -1, `${id} route must exit before full validation`);
  return source.slice(start, exitIndex + 'process.exit(0);'.length);
}

test('npm test keeps selector routing in the project dispatcher', () => {
  const pkg = readPackageJson();

  assert.equal(pkg.scripts.test, 'node scripts/test-dispatch.js');
  assert.doesNotMatch(pkg.scripts.test, /&&/);
  assert.equal(
    pkg.scripts['test:content-focused'],
    'node scripts/test-dispatch.js content-focused',
  );
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

test('content-focused package script routes test-name pattern before file list', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-dispatch-content-focused-'));
  const nodeLog = path.join(tmpDir, 'node.log');
  const pattern = 'religious-freedom option parallelism|focus-religious-freedom';
  const env = {
    ...process.env,
    npm_config_loglevel: 'silent',
    TEST_DISPATCH_CAPTURE: '1',
    TEST_DISPATCH_LOG: nodeLog,
    TEST_DISPATCH_NODE: createFakeNode(tmpDir),
  };

  try {
    const result = runPackageContentFocused(
      [
        '--test-name-pattern',
        pattern,
        'tests/content-test-script-routing.test.js',
        'tests/content-published-question-types.test.js',
      ],
      env,
    );

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.deepEqual(fs.readFileSync(nodeLog, 'utf8').trim().split(/\n/), [
      '--test',
      '--test-name-pattern',
      pattern,
      'tests/content-test-script-routing.test.js',
      'tests/content-published-question-types.test.js',
    ]);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('content-focused selector rejects missing file lists before running node', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-dispatch-content-focused-invalid-'));
  const nodeLog = path.join(tmpDir, 'node.log');
  const env = {
    ...process.env,
    TEST_DISPATCH_CAPTURE: '1',
    TEST_DISPATCH_LOG: nodeLog,
    TEST_DISPATCH_NODE: createFakeNode(tmpDir),
  };

  try {
    const result = runDispatcher(['content-focused', '--test-name-pattern', 'routing'], env);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /missing test file list/);
    assert.equal(fs.existsSync(nodeLog), false);
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
  const registry = extractFocusedValidationRegistry(validator);
  const registryEntry = registry.find((entry) => entry.id === 'answerShuffleParity');
  const focusBlockStart = validator.indexOf("focusedValidationRequested('answerShuffleParity')");
  const focusBlockEnd =
    focusBlockStart === -1 ? -1 : validator.indexOf('process.exit(0);', focusBlockStart);
  const focusBlock =
    focusBlockStart === -1 || focusBlockEnd === -1
      ? ''
      : validator.slice(focusBlockStart, focusBlockEnd);
  const focusFlagMatches = parityTest.match(/--focus-answer-shuffle-parity/g) || [];

  assert.ok(registryEntry, 'registry needs the answer-shuffle focus mode');
  assert.ok(registryEntry.flags.includes('--focus-answer-shuffle-parity'));
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

test('weekly recap focused content validation runs only its runtime summary', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-weekly-recap-runtime'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused weekly recap validation should print JSON summary');
  const summary = JSON.parse(match[0]);

  assert.equal(summary.weeklyRecapRuntimeCasesValidated, 7);
  assert.equal(summary.weeklyRecapRuntimeParityValidated, true);
  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'questionSchemasValidated'), false);
});

test('question speech text focused content validation runs only its parity summary', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-question-speech-text-parity'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused question speech validation should print JSON summary');
  const summary = JSON.parse(match[0]);

  assert.equal(summary.questionSpeechTextQuestionsValidated, summary.publishedQuestions);
  assert.ok(summary.questionSpeechTextOptionsValidated > 0);
  assert.equal(summary.questionSpeechTextParityValidated, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(summary, 'speechRuntimeParityValidated'),
    false,
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(summary, 'answerFeedbackRuntimeParityValidated'),
    false,
  );
});

test('XP rules focused content validation runs only its parity summary', () => {
  const result = spawnSync(process.execPath, ['scripts/validate-content.js', '--focus-xp-rules'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused XP validation should print JSON summary');
  const summary = JSON.parse(match[0]);

  assert.equal(summary.xpRulesValidated, 24);
  assert.equal(summary.xpRulesParityValidated, true);
  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'streakRulesParityValidated'), false);
});

test('streak rules parity uses the focused content validator path', () => {
  const validator = fs.readFileSync(path.join(repoRoot, 'scripts/validate-content.js'), 'utf8');
  const parityTest = fs.readFileSync(
    path.join(repoRoot, 'tests/content-streak-rules-parity.test.js'),
    'utf8',
  );
  const registry = extractFocusedValidationRegistry(validator);
  const registryEntry = registry.find((entry) => entry.id === 'streakRules');
  const focusBlockStart = validator.indexOf("focusedValidationRequested('streakRules')");
  const focusBlockEnd =
    focusBlockStart === -1 ? -1 : validator.indexOf('process.exit(0);', focusBlockStart);
  const focusBlock =
    focusBlockStart === -1 || focusBlockEnd === -1
      ? ''
      : validator.slice(focusBlockStart, focusBlockEnd);
  const focusFlagMatches = parityTest.match(/--focus-streak-rules/g) || [];

  assert.ok(registryEntry, 'registry needs the streak-rules focus mode');
  assert.ok(registryEntry.flags.includes('--focus-streak-rules'));
  assert.notEqual(focusBlockStart, -1, 'validate-content needs the streak-rules focus flag');
  assert.match(focusBlock, /validateStreakRules\(\);/);
  assert.match(focusBlock, /streakRulesValidated/);
  assert.match(focusBlock, /streakRulesParityValidated/);
  assert.ok(
    focusFlagMatches.length >= 2,
    'positive and mutation streak checks should use the focused validator',
  );
});

test('streak rules focused content validation runs only its parity summary', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-streak-rules'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused streak validation should print JSON summary');
  const summary = JSON.parse(match[0]);

  assert.equal(summary.streakRulesValidated, 10);
  assert.equal(summary.streakRulesParityValidated, true);
  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'xpRulesParityValidated'), false);
});

test('readiness adapter focused content validation runs only its runtime summary', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-readiness-adapter-rules'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused readiness adapter validation should print JSON summary');
  const summary = JSON.parse(match[0]);

  assert.equal(summary.readinessAdapterRulesValidated, 6);
  assert.equal(summary.readinessAdapterRuntimeParityValidated, true);
  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'xpRulesParityValidated'), false);
});

test('readiness score focused content validation runs only its runtime summary', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-readiness-score-rules'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused readiness score validation should print JSON summary');
  const summary = JSON.parse(match[0]);

  assert.equal(summary.readinessScoreRulesValidated, 5);
  assert.equal(summary.readinessScoreRuntimeParityValidated, true);
  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'xpRulesParityValidated'), false);
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

test('CelebrationBurst focused content validation runs only its accessibility summary', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-celebration-burst-accessibility'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused CelebrationBurst validation should print JSON summary');
  const summary = JSON.parse(match[0]);

  assert.equal(summary.celebrationBurstAccessibilityRulesValidated, 13);
  assert.equal(summary.celebrationBurstAccessibilityParityValidated, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(summary, 'answerFeedbackRuntimeParityValidated'),
    false,
  );
});

test('validate-content focus registry owns every focused route and summary', () => {
  const source = readValidateContentSource();
  const registry = extractFocusedValidationRegistry();
  const registrySource = readFocusedValidationRegistrySource();
  const ids = new Set();
  const flags = new Set();

  assert.ok(registry.length >= 30, 'registry should cover all focused validation modes');
  assert.match(
    source,
    /require\(['"]\.\/validate-content-focus-registry['"]\)/,
    'validate-content should import the shared focused registry module',
  );
  assert.doesNotMatch(
    source,
    /focusedValidationFlagsFromRegistrySource|readFileSync\(__filename/,
    'validate-content must not parse its own source to discover focus flags',
  );
  assert.doesNotMatch(
    source,
    /process\.argv\.includes\(['"]--focus-/,
    'focused routes should go through focusedValidationRequested()',
  );

  for (const entry of registry) {
    assert.match(entry.id, /^[a-z][A-Za-z0-9]*$/, `${entry.id} must be a stable registry id`);
    assert.equal(ids.has(entry.id), false, `${entry.id} is duplicated`);
    ids.add(entry.id);
    assert.ok(entry.flags.length >= 1, `${entry.id} must declare at least one CLI flag`);
    assert.ok(entry.summaryKeys.length >= 1, `${entry.id} must declare summary keys`);

    for (const flag of entry.flags) {
      assert.match(flag, /^--focus-[a-z0-9-]+$/, `${entry.id} has invalid flag ${flag}`);
      assert.equal(flags.has(flag), false, `${flag} is duplicated`);
      flags.add(flag);
    }

    const block = focusedValidationBlock(source, entry.id);
    assert.match(block, /printValidationSummary\(\{/, `${entry.id} must print an isolated summary`);
    for (const summaryKey of entry.summaryKeys) {
      assert.match(
        block,
        new RegExp(`\\b${summaryKey}\\b`),
        `${entry.id} summary must include ${summaryKey}`,
      );
    }
  }

  const routedIds = new Set(
    [...source.matchAll(/focusedValidationRequested\('([^']+)'\)/g)].map((match) => match[1]),
  );
  assert.deepEqual(routedIds, ids);

  const flagsInRegistrySource = new Set(registrySource.match(/--focus-[a-z0-9-]+/g) || []);
  assert.deepEqual(flagsInRegistrySource, flags);
  assert.deepEqual(new Set(source.match(/--focus-[a-z0-9-]+/g) || []), new Set());
});

test('validate-content rejects unknown focused validator flags before full validation', () => {
  const result = spawnSync(process.execPath, ['scripts/validate-content.js', '--focus-not-real'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unsupported validate-content focus flag: --focus-not-real/);
  assert.match(result.stderr, /--focus-answer-feedback-parity/);
});

test('validate-content rejects unknown focus flags before loading heavy modules', () => {
  const script = `
    const Module = require('node:module');
    const originalLoad = Module._load;
    Module._load = function(request, parent, isMain) {
      if (request === 'typescript' || request === './export-site-question-bank') {
        throw new Error('heavy module loaded: ' + request);
      }
      return originalLoad.apply(this, arguments);
    };
    process.argv = ['node', 'scripts/validate-content.js', '--focus-not-real'];
    require('./scripts/validate-content.js');
  `;
  const result = spawnSync(process.execPath, ['-e', script], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unsupported validate-content focus flag: --focus-not-real/);
  assert.doesNotMatch(result.stderr, /heavy module loaded/);
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
