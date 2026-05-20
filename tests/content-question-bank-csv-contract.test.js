const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

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
    /content\/question-bank\.csv row 2 has 19 columns, expected 18/,
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
  const provenanceCounts = { uhr: 0, derived: 0, editorial: 0 };
  rows.forEach((row) => {
    provenanceCounts[row[provenanceIndex]] += 1;
  });

  assert.equal(rows.length, summary.publishedQuestions);
  assert.equal(rows.find((row) => row[idIndex] === 'q001')?.[provenanceIndex], 'uhr');
  assert.deepEqual(summary.questionBankCsvProvenanceCounts, provenanceCounts);
  assert.equal(
    Object.values(summary.questionBankCsvProvenanceCounts).reduce(
      (total, count) => total + count,
      0,
    ),
    summary.publishedQuestions,
  );
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

test('question-bank CSV exposes UHR source metadata with no blank cells', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  assert.equal(summary.questionBankCsvRowsValidated, summary.publishedQuestions);

  const uhrSectionMap = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'content/uhr-section-map.json'), 'utf8'),
  );
  const csv = fs.readFileSync(path.join(repoRoot, 'content', 'question-bank.csv'), 'utf8');
  const lines = csv.trimEnd().split('\n');
  const header = parseExportedCsvLine(lines[0]);
  const idIndex = header.indexOf('id');
  const metadataFields = [
    ['uhrSourceTitle', uhrSectionMap.source.title],
    ['uhrSourcePublisher', uhrSectionMap.source.publisher],
    ['uhrSourceUrl', uhrSectionMap.source.url],
    ['uhrSourceRetrievedAt', uhrSectionMap.source.retrievedDate],
  ];

  const rows = lines.slice(1).map(parseExportedCsvLine);
  assert.equal(rows.length, summary.publishedQuestions);

  for (const [field, expected] of metadataFields) {
    const fieldIndex = header.indexOf(field);
    assert.notEqual(fieldIndex, -1, `${field} column should exist`);
    assert.equal(rows.find((row) => row[idIndex] === 'q001')?.[fieldIndex], expected);
    assert.ok(
      rows.every((row) => row[fieldIndex] === expected),
      `every row should export ${field}`,
    );
  }
});

test('question-bank CSV contract rejects source publisher drift', () => {
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
      'Universitets- och högskolerådet (UHR)',
      'Fel utgivare',
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
    /content\/question-bank\.csv row 2 q001 uhrSourcePublisher is "Fel utgivare", expected "Universitets- och högskolerådet \(UHR\)"/,
  );
});

test('question-bank CSV contract summarizes shared UHR source metadata drift', () => {
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
  if (normalizedPath.endsWith('/content/uhr-section-map.json')) {
    return String(contents).replace(
      '"url": "https://www.uhr.se/globalassets/_uhr.se/medborgarskapsprovet/utbildningsmaterial/sverige-i-fokus.pdf"',
      '"url": "https://www.uhr.se/globalassets/_uhr.se/other/sverige-i-fokus.pdf"',
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
    /content\/question-bank\.csv uhrSourceUrl metadata drift: \d+ rows disagree with content\/uhr-section-map\.json source\.url/,
  );
  assert.match(output, /UHR section map source URL must be under the UHR education material path/);
  assert.equal(
    (output.match(/content\/question-bank\.csv row \d+ q\d+ uhrSourceUrl is/g) || []).length,
    0,
    'whole-bank UHR source URL drift should be summarized instead of repeated per row',
  );
});

test('question-bank CSV contract summarizes row order drift', () => {
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
    const lines = String(contents).trimEnd().split('\\n');
    const firstRow = lines[1];
    lines[1] = lines[2];
    lines[2] = firstRow;
    return \`\${lines.join('\\n')}\\n\`;
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
    /content\/question-bank\.csv row-order\/id drift: 2 row ids do not match exporter order; first mismatch at row 2: saw "q002", expected "q001"; CSV has \d+ data rows, expected \d+; Regenerate with npm run content:export\./,
  );
  assert.equal(
    (output.match(/content\/question-bank\.csv row \d+ q\d+ [A-Za-z]+ is/g) || []).length,
    0,
    'row order drift should be summarized before field-level mismatch cascades',
  );
});

test('question-bank CSV contract summarizes shifted row ids', () => {
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
    const lines = String(contents).trimEnd().split('\\n');
    lines.splice(1, 1);
    return \`\${lines.join('\\n')}\\n\`;
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
    /content\/question-bank\.csv row-order\/id drift: \d+ row ids do not match exporter order; first mismatch at row 2: saw "q002", expected "q001"; CSV has \d+ data rows, expected \d+; Regenerate with npm run content:export\./,
  );
  assert.doesNotMatch(output, /content\/question-bank\.csv has \d+ data rows/);
  assert.equal(
    (output.match(/content\/question-bank\.csv row \d+ q\d+ [A-Za-z]+ is/g) || []).length,
    0,
    'shifted rows should not cascade into per-field mismatch output',
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

test('question-bank CSV contract rejects source publisher drift', () => {
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
      'Universitets- och högskolerådet (UHR)',
      'Unknown publisher',
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
    /content\/question-bank\.csv row 2 q001 uhrSourcePublisher is "Unknown publisher", expected "Universitets- och högskolerådet \(UHR\)"/,
  );
});
