const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  findGeneratedSingleChoiceDuplicateStemOptions,
} = require('./helpers/generatedSingleChoiceDuplicateGuard.cjs');

const repoRoot = path.resolve(__dirname, '..');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuote = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (inQuote) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index++;
      } else if (char === '"') {
        inQuote = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuote = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (field || row.length) {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      }
      if (char === '\r' && text[index + 1] === '\n') index++;
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function readQuestionBankCsvRows() {
  const rows = parseCsv(
    fs.readFileSync(path.join(repoRoot, 'content', 'question-bank.csv'), 'utf8'),
  );
  const header = rows[0];
  assert.ok(header, 'question bank CSV should include a header');
  const indexByName = new Map(header.map((name, index) => [name, index]));
  const field = (row, name) => {
    assert.ok(indexByName.has(name), `question bank CSV should include ${name}`);
    return row[indexByName.get(name)];
  };

  return rows.slice(1).map((row) => ({
    id: field(row, 'id'),
    type: field(row, 'type'),
    questionSv: field(row, 'questionSv'),
    questionEn: field(row, 'questionEn'),
    optionSv: field(row, 'optionSv'),
    optionEn: field(row, 'optionEn'),
    tags: field(row, 'tags').split('|').filter(Boolean),
  }));
}

function guardQuestionFromCsvRow(row) {
  const optionsSv = JSON.parse(row.optionSv);
  const optionsEn = JSON.parse(row.optionEn);

  assert.equal(optionsSv.length, optionsEn.length, `${row.id} should export paired options`);

  return {
    id: row.id,
    type: row.type,
    questionSv: row.questionSv,
    questionEn: row.questionEn,
    options: optionsSv.map((optionSv, index) => ({
      sv: optionSv.text,
      en: optionsEn[index]?.text,
    })),
    tags: row.tags,
  };
}

test('question bank export stays in parity with generated questions', () => {
  const output = execFileSync(process.execPath, ['scripts/export-question-bank.js', '--check'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/Question bank export parity OK \((\d+) questions(?:; [^)]+)?\)/);
  assert.ok(match, 'export parity should report the generated question count');
  assert.ok(Number(match[1]) >= 720);
});

test('question bank CSV has no generated single-choice duplicate stems', () => {
  const questions = readQuestionBankCsvRows().map(guardQuestionFromCsvRow);
  const findings = findGeneratedSingleChoiceDuplicateStemOptions(questions, {
    artifactLabel: 'content/question-bank.csv',
  });

  assert.deepEqual(findings, []);
});

test('CSV generated single-choice duplicate guard rejects q001 variant collapse', () => {
  const rows = readQuestionBankCsvRows();
  const sectionPractice = rows.find(
    (row) =>
      row.questionEn === 'Which answer best matches? Where is Sweden located?' &&
      row.tags.includes('published-variant') &&
      row.tags.includes('section-practice'),
  );
  const judgement = rows.find(
    (row) =>
      row.questionEn === 'Choose the correct option: Where is Sweden located?' &&
      row.tags.includes('published-variant') &&
      row.tags.includes('judgement'),
  );
  assert.ok(sectionPractice && judgement, 'expected q001 generated single-choice variants');

  judgement.questionSv = sectionPractice.questionSv;
  judgement.questionEn = sectionPractice.questionEn;
  judgement.optionSv = sectionPractice.optionSv;
  judgement.optionEn = sectionPractice.optionEn;

  const findings = findGeneratedSingleChoiceDuplicateStemOptions(
    rows.map(guardQuestionFromCsvRow),
    {
      artifactLabel: 'content/question-bank.csv',
    },
  );

  assert.equal(findings.length, 1);
  assert.ok(
    findings[0].includes(
      `content/question-bank.csv: ${judgement.id} duplicates ${sectionPractice.id}`,
    ),
    findings[0],
  );
});
