const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const rightsWorkLiteralEnglishPattern =
  /\b(?:part of work for gender equality|aim of work for people with disabilities|Work for people with disabilities is about)\b/i;

function readValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

function parseExportedCsvLine(line) {
  return [...line.matchAll(/"((?:""|[^"])*)"(?:,|$)/g)].map((match) =>
    match[1].replaceAll('""', '"'),
  );
}

function readQuestionBankCsvRowsByHeader() {
  const csv = fs.readFileSync(path.join(repoRoot, 'content', 'question-bank.csv'), 'utf8');
  const lines = csv.trimEnd().split('\n');
  const header = parseExportedCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const fields = parseExportedCsvLine(line);
    return Object.fromEntries(header.map((field, index) => [field, fields[index]]));
  });
}

test('published question prompts and explanations keep distinct Swedish and English text', () => {
  const summary = readValidationSummary();

  assert.equal(summary.questionBilingualTextPairsValidated, summary.publishedQuestions);
});

test('question-bank CSV citation consumers use full source citation header fields', () => {
  const rowsById = new Map(readQuestionBankCsvRowsByHeader().map((row) => [row.id, row]));
  const supplementalIds = ['q019', 'q030', 'q166'];

  for (const id of supplementalIds) {
    const row = rowsById.get(id);
    assert.ok(row, `${id} should be exported`);
    assert.match(row.sourceCitationSv, /Valmyndigheten/);
    assert.match(row.sourceCitationEn, /Additional source: Rösträtten i svenska val/);
    assert.doesNotMatch(row.uhrCitationSv, /Valmyndigheten/);
    assert.doesNotMatch(row.uhrCitationEn, /Additional source/);
  }
});

test('published question bilingual text rejects copied prompts and explanations', () => {
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
        "    questionSv: 'Var ligger Sverige?',",
        "    questionSv: 'Where is Sweden located?',",
      )
      .replace(
        /    explanationSv:\\n      '[\\s\\S]*?',\\n    explanationEn:\\n      '[\\s\\S]*?',/,
        "    explanationSv:\\n      'Copied explanation.',\\n    explanationEn:\\n      'Copied explanation.',",
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
  assert.match(output, /q001 questionSv and questionEn must be distinct bilingual text/);
  assert.match(output, /q001 explanationSv and explanationEn must be distinct bilingual text/);
});

test('published question English naturalness rejects literal rights-work calques', () => {
  const summary = readValidationSummary();
  const fileOffenders = [
    'data/additionalQuestions.ts',
    'content/question-bank.csv',
    'site/questions.js',
  ].filter((relativePath) =>
    rightsWorkLiteralEnglishPattern.test(
      fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'),
    ),
  );

  assert.deepEqual(fileOffenders, []);
});

test('published question English naturalness guard fails on rights-work calques', () => {
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
  if (normalizedPath.endsWith('/data/additionalQuestions.ts')) {
    return String(contents)
      .replace(
        'Which example is part of efforts to promote gender equality?',
        'Which example is part of work for gender equality?',
      )
      .replace(
        'What is one aim of disability rights work?',
        'What is one aim of work for people with disabilities?',
      )
      .replace(
        'Disability rights work is about equal rights and opportunities.',
        'Work for people with disabilities is about equal rights and opportunities.',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.match(
    output,
    /q176 uses literal rights-work English wording|q176 questionEn is .*expected .*work for gender equality/,
  );
  assert.match(
    output,
    /q178 uses literal rights-work English wording|q178 questionEn is .*expected .*work for people with disabilities/,
  );
});
