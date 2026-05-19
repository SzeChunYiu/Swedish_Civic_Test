const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const EXPECTED_SOURCE_AUTHORITY_STEM_PATTERN_FIXTURES = 7;

test('published question text keeps the independent study boundary', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  assert.equal(summary.questionAuthorityBoundaryTextValidated, summary.publishedQuestions);
  assert.equal(summary.questionAuthorityOverclaimPatternFixturesValidated, 10);
  assert.equal(summary.questionAuthorityOverclaimPatternFixtureParityValidated, true);
});

test('question authority boundary rejects official-status and pass-guarantee overclaims', () => {
  const overclaimFixtures = [
    'official citizenship test',
    'real citizenship exam questions',
    'UHR-approved practice',
    'quality-controlled by an authority',
    'guaranteed passing',
    'officiella prov',
    'riktiga provfrågor',
    'myndighetsgodkänd övning',
    'kvalitetsgranskad av regeringen',
    'garanterar att klara',
  ];

  for (const fixture of overclaimFixtures) {
    const injectedStem = JSON.stringify(`${fixture}. Where is Sweden located?`);
    const result = spawnSync(
      process.execPath,
      [
        '-e',
        `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents).replace(
      'Where is Sweden located?',
      ${injectedStem},
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
      ],
      { encoding: 'utf8' },
    );

    assert.notEqual(result.status, 0, fixture);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /q001 appears to overclaim official status or exam certainty/,
      fixture,
    );
  }
});

test('question authority boundary rejects UHR source wording in stems', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents).replace(
      'Where is Sweden located?',
      'Which place does the UHR material describe?',
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
    /q001 carries source-authority wording in the stem/,
  );
});

test('question authority boundary rejects UHR source wording in true/false stems', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents)
      .replace(
        'Sveriges nordligaste del ligger norr om polcirkeln.',
        'Enligt UHR-materialet ligger Sveriges nordligaste del norr om polcirkeln.',
      )
      .replace(
        "Sweden's northernmost part lies north of the Arctic Circle.",
        "According to the UHR material, Sweden's northernmost part lies north of the Arctic Circle.",
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
    /q002 carries source-authority wording in the stem/,
  );
});

test('question authority boundary rejects missing shared source-authority pattern fixtures', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/scripts/validate-content.js')) {
    return String(contents).replace(
      "  {\\n    label: 'uhr-materialet',\\n    pattern: QUESTION_STEM_SOURCE_AUTHORITY_PATTERNS[1],\\n    text: 'UHR-materialet beskriver Sveriges nordligaste del.',\\n  },\\n",
      '',
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
    /source-authority stem pattern fixtures must cover every shared source-authority pattern/,
  );
});
