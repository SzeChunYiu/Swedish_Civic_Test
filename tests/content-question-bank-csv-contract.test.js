const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { buildSiteQuestionBank } = require('../scripts/export-site-question-bank');
const { generatedQuestionId } = require('../scripts/generated-question-fixture-ids');

const repoRoot = path.resolve(__dirname, '..');
const SUFFRAGE_1921_STALE_CSV_PATTERN =
  /\b1921 is the year of the election asked about here\b|\bthe year of the election asked about here\b/i;
const SUFFRAGE_1921_EXPECTED_CSV_EXPLANATION =
  'the first Riksdag election held after those reforms was in 1921';
const Q080_SUFFRAGE_STALE_PATTERN = SUFFRAGE_1921_STALE_CSV_PATTERN;
const Q080_SUFFRAGE_REVISED_PATTERN =
  /first Riksdag election held after those reforms was in 1921/i;
const GENERATED_SINGLE_CHOICE_ANSWER_LOGIC_OPTION_PATTERN =
  /\b(?:Båda påståendena är korrekta|Both statements are correct|Inget av påståendena är korrekt|Neither statement is correct)\b/i;

function parseExportedCsvLine(line) {
  return [...line.matchAll(/"((?:""|[^"])*)"(?:,|$)/g)].map((match) =>
    match[1].replaceAll('""', '"'),
  );
}

function loadQuestionBankRowsById() {
  const csv = fs.readFileSync(path.join(repoRoot, 'content', 'question-bank.csv'), 'utf8');
  const lines = csv.trimEnd().split('\n');
  const header = parseExportedCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const fields = parseExportedCsvLine(line);
    return Object.fromEntries(header.map((field, index) => [field, fields[index]]));
  });
  return new Map(rows.map((row) => [row.id, row]));
}

function runQuestionBankCsvValidation() {
  return execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-question-bank-csv'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
}

function runQuestionProvenanceRuntimeValidation() {
  return execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-question-provenance-runtime'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
}

test('question-bank CSV keeps its public row contract', () => {
  const output = runQuestionBankCsvValidation();
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  assert.equal(summary.questionBankCsvRowsValidated, summary.publishedQuestions);
  assert.equal(summary.questionBankCsvHeaderColumnsValidated, 30);
  assert.equal(summary.questionBankCsvUniqueHeaderNamesValidated, true);
  assert.equal(summary.questionBankCsvUhrCitationRowsValidated, summary.publishedQuestions);
  assert.equal(summary.questionBankCsvUhrCitationParityValidated, true);
  assert.equal(summary.questionBankCsvSourceCitationRowsValidated, summary.publishedQuestions);
  assert.equal(summary.questionBankCsvSourceCitationParityValidated, true);
  assert.equal(summary.questionBankCsvUhrSourcePublisherRowsValidated, summary.publishedQuestions);
  assert.equal(summary.questionBankCsvUhrSourcePublisherParityValidated, true);
  assert.equal(summary.questionBankCsvSupplementalSourceRowsValidated, 15);
  assert.equal(summary.questionBankCsvVotingRightsSupplementalSourceParityValidated, true);
});

test('question-bank CSV has no generated single-choice both/neither answer-logic options', () => {
  const rowsById = loadQuestionBankRowsById();
  const expectedBank = buildSiteQuestionBank();
  const sourceQuestions = expectedBank.questions.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const targetIds = [
    'q002',
    'q006',
    'q023',
    'q028',
    'q031',
    'q047',
    'q049',
    'q074',
    'q091',
    'q094',
    'q143',
  ].flatMap((sourceId) => [
    generatedQuestionId(sourceQuestions, sourceId, 'singleChoice'),
    generatedQuestionId(sourceQuestions, sourceId, 'judgement'),
  ]);

  for (const id of targetIds) {
    const row = rowsById.get(id);
    assert.ok(row, `${id} should exist in content/question-bank.csv`);
    assert.equal(row.type, 'single_choice');
    assert.doesNotMatch(
      row.optionSv,
      GENERATED_SINGLE_CHOICE_ANSWER_LOGIC_OPTION_PATTERN,
      `${id} Swedish options should use civic distractors`,
    );
    assert.doesNotMatch(
      row.optionEn,
      GENERATED_SINGLE_CHOICE_ANSWER_LOGIC_OPTION_PATTERN,
      `${id} English options should use civic distractors`,
    );
  }
});

test('question-bank CSV keeps q128 holiday date options appositive', () => {
  const rowsById = loadQuestionBankRowsById();
  const relevantIds = ['q128', 'q688', 'q689', 'q690', 'q691'];
  const relevantRows = relevantIds.map((id) => rowsById.get(id));
  relevantRows.forEach((row, index) => assert.ok(row, `${relevantIds[index]} should exist`));

  const optionRows = ['q128', 'q688', 'q691'].map((id) => rowsById.get(id));
  for (const row of optionRows) {
    const optionEn = JSON.parse(row.optionEn);
    assert.equal(
      optionEn.find((option) => option.id === 'c')?.text,
      "On New Year's Eve, 31 December",
    );
    assert.equal(optionEn.find((option) => option.id === 'd')?.text, 'On Lucia Day, 13 December');
    assert.doesNotMatch(row.optionEn, /New Year(?:’|')s Eve on 31 December/i);
    assert.doesNotMatch(row.optionEn, /Lucia Day on 13 December/i);
  }

  assert.equal(rowsById.get('q128').correctOptionId, 'a');
  assert.equal(rowsById.get('q128').uhrSection, 'Nya traditioner');
  assert.equal(rowsById.get('q128').uhrPageApprox, '47');
  assert.equal(rowsById.get('q689').correctOptionId, 'true');
  assert.equal(rowsById.get('q690').correctOptionId, 'false');
  assert.doesNotMatch(
    relevantRows.map((row) => JSON.stringify(row)).join('\n'),
    /New Year(?:’|')s Eve on 31 December/i,
  );
  assert.doesNotMatch(
    relevantRows.map((row) => JSON.stringify(row)).join('\n'),
    /Lucia Day on 13 December/i,
  );
});

test('question-bank CSV keeps rule-of-law wording learner-facing while allowing internal tags', () => {
  const rowsById = loadQuestionBankRowsById();
  const relevantIds = [
    'q014',
    'q041',
    'q232',
    'q233',
    'q234',
    'q235',
    'q340',
    'q341',
    'q342',
    'q343',
  ];

  for (const id of relevantIds) {
    const row = rowsById.get(id);
    assert.ok(row, `${id} should exist in content/question-bank.csv`);

    const learnerFacingEnglish = [
      row.questionEn,
      row.explanationEn,
      row.optionEn,
      row.correctOptionEn,
    ].join(' ');

    assert.doesNotMatch(
      learnerFacingEnglish,
      /\blegal certainty\b/i,
      `${id} must not expose literal legal certainty English`,
    );
    assert.match(learnerFacingEnglish, /\bthe rule of law\b/i, `${id} should use rule of law`);
    assert.match(row.tags, /\blegal-certainty\b/, `${id} keeps the internal tag`);
  }
});

test('question provenance runtime guard validates invalid tags and provenance fallbacks', () => {
  const output = runQuestionProvenanceRuntimeValidation();
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  assert.equal(summary.questionProvenanceRuntimeCasesValidated, 13);
  assert.equal(summary.questionProvenanceRuntimeParityValidated, true);
});

test('question provenance runtime guard rejects arbitrary includes-based tags', () => {
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
  if (normalizedPath.endsWith('/lib/content/provenance.ts')) {
    const source = String(contents);
    const mutated = source.replace(
      'return isReadonlyStringArray(tags) ? tags : [];',
      'return (tags ?? []) as readonly string[];',
    );
    if (mutated === source) {
      throw new Error('question tag guard mutation target not found');
    }
    return mutated;
  }
  return contents;
};
process.argv.push('--focus-question-provenance-runtime');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /question provenance runtime guard .* tags .* expected "uhr"/i,
  );
});

test('question-bank CSV keeps q080 suffrage explanations learner-facing', () => {
  const sourceQuestions = buildSiteQuestionBank().questions.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const expectedIds = [
    'q080',
    generatedQuestionId(sourceQuestions, 'q080', 'singleChoice'),
    generatedQuestionId(sourceQuestions, 'q080', 'trueStatement'),
    generatedQuestionId(sourceQuestions, 'q080', 'falseStatement'),
    generatedQuestionId(sourceQuestions, 'q080', 'judgement'),
  ];
  const csv = fs.readFileSync(path.join(repoRoot, 'content', 'question-bank.csv'), 'utf8');
  const rowsById = new Map(
    csv
      .trimEnd()
      .split('\n')
      .slice(1)
      .map((line) => {
        const columns = parseExportedCsvLine(line);
        return [columns[0], columns];
      }),
  );

  for (const id of expectedIds) {
    const columns = rowsById.get(id);
    assert.ok(columns, `${id} should be present in content/question-bank.csv`);
    const visibleText = `${columns[4]}\n${columns[6]}`;
    assert.ok(visibleText.includes(SUFFRAGE_1921_EXPECTED_CSV_EXPLANATION));
    assert.doesNotMatch(visibleText, SUFFRAGE_1921_STALE_CSV_PATTERN);
  }
});

test('question-bank CSV has unique public header names', () => {
  const csv = fs.readFileSync(path.join(repoRoot, 'content', 'question-bank.csv'), 'utf8');
  const [headerLine] = csv.trimEnd().split('\n');
  const header = parseExportedCsvLine(headerLine);
  const duplicateHeaderNames = [
    ...new Set(header.filter((field, index) => header.indexOf(field) !== index)),
  ];

  assert.deepEqual(duplicateHeaderNames, []);
  assert.equal(header.filter((field) => field === 'uhrSourcePublisher').length, 1);
  assert.equal(header.filter((field) => field === 'supplementalSourcePublisher').length, 1);
});

test('question-bank CSV keeps q080 suffrage explanation learner-facing', () => {
  const csv = fs.readFileSync(path.join(repoRoot, 'content', 'question-bank.csv'), 'utf8');
  const lines = csv.trimEnd().split('\n');
  const header = parseExportedCsvLine(lines[0]);
  const idIndex = header.indexOf('id');
  const explanationEnIndex = header.indexOf('explanationEn');
  const expectedIds = new Set(['q080', 'q496', 'q497', 'q498', 'q499']);
  const rowsById = new Map(
    lines.slice(1).map((line) => {
      const row = parseExportedCsvLine(line);
      return [row[idIndex], row];
    }),
  );

  for (const id of expectedIds) {
    const row = rowsById.get(id);
    assert.ok(row, `${id} should be exported to content/question-bank.csv`);
    assert.doesNotMatch(row[explanationEnIndex], Q080_SUFFRAGE_STALE_PATTERN);
    assert.match(row[explanationEnIndex], Q080_SUFFRAGE_REVISED_PATTERN);
  }
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
process.argv.push('--focus-question-bank-csv');
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
process.argv.push('--focus-question-bank-csv');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /content\/question-bank\.csv row 2 has 31 columns, expected 30/,
  );
});

test('question-bank CSV contract rejects duplicate header names', () => {
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
      '"questionProvenance"',
      '"uhrSourcePublisher"',
    );
  }
  return contents;
};
process.argv.push('--focus-question-bank-csv');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /content\/question-bank\.csv header has duplicate column name\(s\): uhrSourcePublisher/,
  );
});

test('question-bank CSV exposes derived question provenance with no blank cells', () => {
  const output = runQuestionBankCsvValidation();
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

test('question-bank CSV export check rejects generated rows collapsing to UHR', () => {
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
  if (normalizedPath.endsWith('/lib/content/provenance.ts')) {
    const source = String(contents);
    const mutated = source.replace(
      "if (tags.includes('published-variant')) return 'derived';",
      "if (tags.includes('published-variant')) return 'uhr';",
    );
    if (mutated === source) {
      throw new Error('published-variant provenance mutation target not found');
    }
    return mutated;
  }
  return contents;
};
process.argv.push('--check');
require('./scripts/export-question-bank.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /published-variant|provenance|derived|uhr/i);
});

test('question-bank CSV exposes UHR source metadata with no blank cells', () => {
  const output = runQuestionBankCsvValidation();
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

test('question-bank CSV exposes localized user-visible UHR citation strings', () => {
  const output = runQuestionBankCsvValidation();
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  assert.equal(summary.questionBankCsvUhrCitationRowsValidated, summary.publishedQuestions);
  assert.equal(summary.questionBankCsvUhrCitationParityValidated, true);

  const csv = fs.readFileSync(path.join(repoRoot, 'content', 'question-bank.csv'), 'utf8');
  const lines = csv.trimEnd().split('\n');
  const header = parseExportedCsvLine(lines[0]);
  const rows = lines.slice(1).map(parseExportedCsvLine);
  const idIndex = header.indexOf('id');
  const citationSvIndex = header.indexOf('uhrCitationSv');
  const citationEnIndex = header.indexOf('uhrCitationEn');
  assert.notEqual(citationSvIndex, -1, 'uhrCitationSv column should exist');
  assert.notEqual(citationEnIndex, -1, 'uhrCitationEn column should exist');

  const q001 = rows.find((row) => row[idIndex] === 'q001');
  assert.ok(q001, 'q001 should be exported');
  assert.equal(
    q001[citationSvIndex],
    'Källa: Sverige i fokus, Landet Sverige, Geografi, klimat och natur, s. 5',
  );
  assert.equal(
    q001[citationEnIndex],
    'Source: Sverige i fokus, Landet Sverige, Geografi, klimat och natur, p. 5',
  );
  assert.ok(rows.every((row) => row[citationSvIndex] && row[citationEnIndex]));
});

test('question-bank CSV exposes localized full source citations with supplemental sources', () => {
  const output = runQuestionBankCsvValidation();
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  assert.equal(summary.questionBankCsvSourceCitationRowsValidated, summary.publishedQuestions);
  assert.equal(summary.questionBankCsvSourceCitationParityValidated, true);

  const rowsById = loadQuestionBankRowsById();
  const q001 = rowsById.get('q001');
  const q019 = rowsById.get('q019');
  assert.ok(q001, 'q001 should be exported');
  assert.ok(q019, 'q019 should be exported');
  assert.equal(q001.sourceCitationSv, q001.uhrCitationSv);
  assert.equal(q001.sourceCitationEn, q001.uhrCitationEn);
  assert.equal(
    q019.sourceCitationSv,
    'Källa: Sverige i fokus, Politiska val och partier, Val och röstning, s. 14; Kompletterande källa: Rösträtten i svenska val, Valmyndigheten, publicerad 2025-11-21, hämtad 2026-05-22, https://www.val.se/det-svenska-valsystemet/sa-funkar-rostning-i-svenska-val/rostratten-i-svenska-val',
  );
  assert.equal(
    q019.sourceCitationEn,
    'Source: Sverige i fokus, Politiska val och partier, Val och röstning, p. 14; Additional source: Rösträtten i svenska val, Valmyndigheten, published 2025-11-21, retrieved 2026-05-22, https://www.val.se/det-svenska-valsystemet/sa-funkar-rostning-i-svenska-val/rostratten-i-svenska-val',
  );
  assert.equal(
    q019.uhrCitationEn,
    'Source: Sverige i fokus, Politiska val och partier, Val och röstning, p. 14',
  );
  assert.match(q019.sourceCitationSv, /Kompletterande källa: .*Valmyndigheten/);
  assert.match(q019.sourceCitationEn, /Additional source: .*Valmyndigheten/);
});

test('question-bank CSV contract rejects localized UHR citation drift', () => {
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
      'Source: Sverige i fokus, Landet Sverige, Geografi, klimat och natur, p. 5',
      'Source: Sverige i fokus, Landet Sverige, wrong section, p. 5',
    );
  }
  return contents;
};
process.argv.push('--focus-question-bank-csv');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /content\/question-bank\.csv row 2 q001 uhrCitationEn is "Source: Sverige i fokus, Landet Sverige, wrong section, p\. 5", expected "Source: Sverige i fokus, Landet Sverige, Geografi, klimat och natur, p\. 5"/,
  );
});

test('question-bank CSV exposes Valmyndigheten supplemental source metadata for voting-rights rows', () => {
  const output = runQuestionBankCsvValidation();
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  assert.equal(summary.questionBankCsvSupplementalSourceRowsValidated, 15);
  assert.equal(summary.questionBankCsvVotingRightsSupplementalSourceParityValidated, true);

  const csv = fs.readFileSync(path.join(repoRoot, 'content', 'question-bank.csv'), 'utf8');
  const lines = csv.trimEnd().split('\n');
  const header = parseExportedCsvLine(lines[0]);
  const rows = lines.slice(1).map(parseExportedCsvLine);
  const idIndex = header.indexOf('id');
  const expectedRows = new Set([
    'q019',
    'q030',
    'q166',
    'q252',
    'q253',
    'q254',
    'q255',
    'q296',
    'q297',
    'q298',
    'q299',
    'q840',
    'q841',
    'q842',
    'q843',
  ]);
  const expectedSource = {
    supplementalSourceTitle: 'Rösträtten i svenska val',
    supplementalSourcePublisher: 'Valmyndigheten',
    supplementalSourceUrl:
      'https://www.val.se/det-svenska-valsystemet/sa-funkar-rostning-i-svenska-val/rostratten-i-svenska-val',
    supplementalSourcePublishedDate: '2025-11-21',
    supplementalSourceRetrievedDate: '2026-05-22',
  };

  const rowsWithSupplementalSource = rows.filter((row) =>
    Object.keys(expectedSource).some((field) => row[header.indexOf(field)]),
  );
  assert.deepEqual(new Set(rowsWithSupplementalSource.map((row) => row[idIndex])), expectedRows);

  rowsWithSupplementalSource.forEach((row) => {
    for (const [field, expected] of Object.entries(expectedSource)) {
      const fieldIndex = header.indexOf(field);
      assert.notEqual(fieldIndex, -1, `${field} column should exist`);
      assert.equal(row[fieldIndex], expected, `${row[idIndex]} ${field}`);
    }
  });
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
process.argv.push('--focus-question-bank-csv');
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
process.argv.push('--focus-question-bank-csv');
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
      'Sweden is in the Nordic region in northern Europe. The Nordic region includes Denmark, Finland, Iceland, Norway, and Sweden and is part of northern Europe.',
      'The exported explanation drifted from the source question.',
    );
  }
  return contents;
};
process.argv.push('--focus-question-bank-csv');
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
process.argv.push('--focus-question-bank-csv');
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
