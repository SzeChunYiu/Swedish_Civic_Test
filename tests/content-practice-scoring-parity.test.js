const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const scoringTypeContractFixturePath = path.join(
  repoRoot,
  'tests/scoreAnswers-runtime-input-type-contract.ts',
);
const tscPath = require.resolve('typescript/bin/tsc');

function runScoringTypeContractTsc(scoringSource) {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'score-answers-type-contract-'));
  const fixturePath = path.join(tmpRoot, 'tests/scoreAnswers-runtime-input-type-contract.ts');
  const scoringPath = path.join(tmpRoot, 'lib/quiz/scoring.ts');

  fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
  fs.mkdirSync(path.dirname(scoringPath), { recursive: true });
  fs.writeFileSync(fixturePath, fs.readFileSync(scoringTypeContractFixturePath, 'utf8'));
  fs.writeFileSync(scoringPath, scoringSource);

  const result = spawnSync(
    process.execPath,
    [
      tscPath,
      '--noEmit',
      '--strict',
      '--target',
      'ES2020',
      '--module',
      'commonjs',
      '--moduleResolution',
      'node',
      'tests/scoreAnswers-runtime-input-type-contract.ts',
    ],
    { cwd: tmpRoot, encoding: 'utf8' },
  );
  fs.rmSync(tmpRoot, { recursive: true, force: true });
  return result;
}

test('practice scoring parity validates scoreAnswers rule cases', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-practice-scoring-parity'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  const summary = JSON.parse(match[0]);

  assert.equal(summary.practiceScoringRulesValidated, 8);
  assert.equal(summary.practiceScoringRulesParityValidated, true);
});

test('practice scoring parity rejects truthy non-boolean correctness results', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
process.argv.push('scripts/validate-content.js', '--focus-practice-scoring-parity');
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath);
  if (normalizedPath.endsWith('/lib/quiz/scoring.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('if (result === true) correct += 1;', 'if (Boolean(result)) correct += 1;');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: process.cwd(), encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /practice scoring rule truthy non-boolean results returned \{"correct":5,"total":6\}, expected \{"correct":1,"total":6\}/,
  );
});

test('practice scoring parity rejects array-only TypeScript signature drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
process.argv.push('scripts/validate-content.js', '--focus-practice-scoring-parity');
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath);
  if (normalizedPath.endsWith('/lib/quiz/scoring.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('results: unknown = []', 'results: readonly unknown[] = []');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /scoreAnswers TypeScript signature must accept unknown runtime input/,
  );
});

test('practice scoring type contract fixture accepts runtime inputs through tsc', () => {
  const fixtureSource = fs.readFileSync(scoringTypeContractFixturePath, 'utf8');
  assert.match(fixtureSource, /scoreAnswers\(\{ 0: true, length: 1 }\)/);
  assert.match(fixtureSource, /scoreAnswers\('yes'\)/);
  assert.match(fixtureSource, /scoreAnswers\(null\)/);
  assert.match(fixtureSource, /scoreAnswers\(\[true, false, 'yes'\]\)/);

  const result = runScoringTypeContractTsc(
    fs.readFileSync(path.join(repoRoot, 'lib/quiz/scoring.ts'), 'utf8'),
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});

test('practice scoring type contract fixture rejects array-only signatures through tsc', () => {
  const scoringSource = fs.readFileSync(path.join(repoRoot, 'lib/quiz/scoring.ts'), 'utf8');
  const arrayOnlyScoringSource = scoringSource.replace(
    'results: unknown = []',
    'results: readonly unknown[] = []',
  );
  assert.notEqual(arrayOnlyScoringSource, scoringSource, 'mutation should narrow scoreAnswers');

  const result = runScoringTypeContractTsc(arrayOnlyScoringSource);

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /scoreAnswers-runtime-input-type-contract\.ts.*Argument of type '\{ 0: boolean; length: number; \}' is not assignable to parameter of type 'readonly unknown\[\]'/s,
  );
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /scoreAnswers-runtime-input-type-contract\.ts.*Argument of type 'string' is not assignable to parameter of type 'readonly unknown\[\]'/s,
  );
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /scoreAnswers-runtime-input-type-contract\.ts.*Argument of type 'null' is not assignable to parameter of type 'readonly unknown\[\](?: \| undefined)?'/s,
  );
});
