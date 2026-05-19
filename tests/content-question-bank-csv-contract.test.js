const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseExportedCsvLine(line) {
  return [...line.matchAll(/"((?:""|[^"])*)"(?:,|$)/g)].map((match) =>
    match[1].replaceAll('""', '"'),
  );
}

test('question-bank CSV keeps its public row contract', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  assert.equal(summary.questionBankCsvRowsValidated, summary.publishedQuestions);
});

test('question-bank CSV contract rejects public header drift', () => {
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
  if (normalizedPath.endsWith('/content/question-bank.csv')) {
    return String(contents).replace(
      '"id","chapterId","type"',
      '"id","chapterId","reviewState"',
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
    /content\/question-bank\.csv header is .* expected/,
  );
});

test('question-bank CSV contract rejects row column drift', () => {
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
  if (normalizedPath.endsWith('/content/question-bank.csv')) {
    const lines = String(contents).split('\\n');
    lines[1] = \`\${lines[1]},"internal-only"\`;
    return lines.join('\\n');
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
    /content\/question-bank\.csv row 2 has 18 columns, expected 17/,
  );
});

test('question-bank CSV exposes derived question provenance with no blank cells', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  assert.equal(summary.questionBankCsvRowsValidated, summary.publishedQuestions);

  const csv = fs.readFileSync(path.join(repoRoot, 'content', 'question-bank.csv'), 'utf8');
  const lines = csv.trimEnd().split('\n');
  const header = parseExportedCsvLine(lines[0]);
  const provenanceIndex = header.indexOf('questionProvenance');
  const idIndex = header.indexOf('id');
  const tagIndex = header.indexOf('tags');
  assert.notEqual(provenanceIndex, -1);

  const rows = lines.slice(1).map(parseExportedCsvLine);
  assert.equal(rows.length, summary.publishedQuestions);
  assert.equal(rows.find((row) => row[idIndex] === 'q001')?.[provenanceIndex], 'uhr');
  assert.ok(
    rows.some(
      (row) =>
        row[tagIndex].split('|').includes('published-variant') &&
        row[provenanceIndex] === 'derived',
    ),
    'at least one published-variant row should export derived provenance',
  );
  assert.ok(
    rows.every((row) => ['uhr', 'derived', 'editorial'].includes(row[provenanceIndex])),
    'every row should export non-blank supported provenance',
  );
});

test('question-bank CSV contract rejects option payload drift', () => {
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
  if (normalizedPath.endsWith('/content/question-bank.csv')) {
    return String(contents).replace(
      'I Norden i norra Europa',
      'I Norden',
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
    /content\/question-bank\.csv row 2 q001 optionSv is .* expected/,
  );
});

test('question-bank CSV contract rejects explanation drift', () => {
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
  if (normalizedPath.endsWith('/content/question-bank.csv')) {
    return String(contents).replace(
      'Sweden is in the Nordic region in northern Europe. The Nordic region is part of northern Europe and includes Denmark, Finland, Iceland, Norway, and Sweden, so the option about the Nordic region in northern Europe is correct.',
      'The exported explanation drifted from the source question.',
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
    /content\/question-bank\.csv row 2 q001 explanationEn is "The exported explanation drifted from the source question\.", expected "Sweden is in the Nordic region/,
  );
});
