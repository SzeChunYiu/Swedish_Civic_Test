const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

test('authored source questions stay reviewed and publish without field drift', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  assert.equal(summary.authoredSourceQuestionsValidated, summary.sourceQuestions);
  assert.equal(summary.sourcePublicationParityValidated, summary.sourceQuestions);
});

test('derived q002 true-statement explanation expectation stays anchored to authored source', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'scripts/derived-content.test.js'), 'utf8');

  assert.match(source, /generatedQuestionId\(sourceQuestions, 'q002', 'trueStatement'\)/);
  assert.match(source, /const \{ questions, sourceQuestions \} = loadTs\('data\/questions\.ts'\);/);
  assert.match(source, /question\.id === 'q002'/);
  assert.match(
    source,
    /byId\.get\(sourceQ002TrueStatementId\)\?\.explanationSv, sourceQ002\.explanationSv/,
  );
  assert.match(
    source,
    /byId\.get\(sourceQ002TrueStatementId\)\?\.explanationEn, sourceQ002\.explanationEn/,
  );
  assert.doesNotMatch(source, /byId\.get\('q\d{3,}'\)/);
  assert.doesNotMatch(
    source,
    /Sveriges nordligaste del ligger norr om polcirkeln, i det arktiska området\./,
  );
  assert.doesNotMatch(
    source,
    /Sweden's northernmost part lies north of the Arctic Circle, in the Arctic area\./,
  );
});

test('authored source schema rejects invalid review status values', () => {
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
      "    reviewStatus: 'reviewed',",
      "    reviewStatus: 'verified',",
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
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, /q001 authored source reviewStatus is verified, expected reviewed/);
  assert.match(output, /q001 has invalid reviewStatus verified/);
});

test('authored source parity rejects published source field drift', () => {
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
    const marker = \`export const sourceQuestions: PracticeQuestion[] = publishQuestions([
  ...baseQuestions,
  ...additionalQuestions,
]);\`;
    const replacement = \`export const sourceQuestions: PracticeQuestion[] = publishQuestions([
  ...baseQuestions,
  ...additionalQuestions,
]).map((question) =>
  question.id === 'q001'
    ? {
        ...question,
        explanationEn:
          'The published source row drifted away from the authored source explanation.',
      }
    : question,
);\`;
    return String(contents).replace(marker, replacement);
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
    /q001 published source explanationEn does not match authored source/,
  );
});

test('authored source parity rejects true/false source prefixes before publishing', () => {
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
        "    questionSv: 'Sveriges nordligaste del ligger norr om polcirkeln.',",
        "    questionSv: 'Sant eller falskt: Sveriges nordligaste del ligger norr om polcirkeln.',",
      )
      .replace(
        '    questionEn: "Sweden\\'s northernmost part lies north of the Arctic Circle.",',
        '    questionEn: "True or false: Sweden\\'s northernmost part lies north of the Arctic Circle.",',
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
    /q002 authored true\/false source stem contains redundant true\/false prefix/,
  );
});

test('authored source parity rejects true/false explanation answer-judgement boilerplate', () => {
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
        "'Sverige har ett milt klimat jämfört med många andra områden på samma breddgrad. Golfströmmen och den Nordatlantiska strömmen transporterar varmt vatten mot Europa, vilket värmer luften som vindarna för in över Sverige.'",
        "'Påståendet är sant: Sverige har ett milt klimat jämfört med många andra områden på samma breddgrad. Golfströmmen och den Nordatlantiska strömmen transporterar varmt vatten mot Europa, vilket värmer luften som vindarna för in över Sverige.'",
      )
      .replace(
        "'Sweden has a mild climate compared with many other areas at the same latitude. The Gulf Stream and the North Atlantic Current carry warm water toward Europe, warming the air that winds bring over Sweden.'",
        "'The statement is true: Sweden has a mild climate compared with many other areas at the same latitude. The Gulf Stream and the North Atlantic Current carry warm water toward Europe, warming the air that winds bring over Sweden.'",
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
    /q006 authored true\/false source explanation contains answer-judgement boilerplate/,
  );
});
