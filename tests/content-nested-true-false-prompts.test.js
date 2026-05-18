const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const CSV = path.resolve(__dirname, '..', 'content', 'question-bank.csv');

const TRUE_FALSE_MARKERS = {
  questionSv: /\bSant eller falskt\s*:/gi,
  questionEn: /\bTrue or false\s*:/gi,
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inQuotes) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (field !== '' || row.length) {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      }
      if (char === '\r' && text[index + 1] === '\n') index += 1;
    } else {
      field += char;
    }
  }

  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function collectNestedTrueFalsePromptOffenders(text) {
  const rows = parseCsv(text);
  const header = rows[0];
  const idIndex = header.indexOf('id');
  assert.ok(idIndex >= 0, 'expected id column');

  const fieldIndexes = Object.keys(TRUE_FALSE_MARKERS).map((field) => {
    const index = header.indexOf(field);
    assert.ok(index >= 0, `expected ${field} column`);
    return [field, index];
  });

  const offenders = [];
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    for (const [field, fieldIndex] of fieldIndexes) {
      const markers = (row[fieldIndex] || '').match(TRUE_FALSE_MARKERS[field]) || [];
      if (markers.length > 1) offenders.push(`${row[idIndex]} [${field}]: ${row[fieldIndex]}`);
    }
  }
  return offenders;
}

test('exported question bank has no nested true/false prompts', () => {
  const offenders = collectNestedTrueFalsePromptOffenders(fs.readFileSync(CSV, 'utf8'));

  assert.equal(
    offenders.length,
    0,
    `Found ${offenders.length} nested true/false prompt(s):\n${offenders.slice(0, 20).join('\n')}`,
  );
});

test('nested true/false prompt gate rejects Swedish and English wrappers', () => {
  const dirtyCsv = [
    '"id","questionSv","questionEn"',
    '"q999","Sant eller falskt: Ett korrekt svar på frågan ""Sant eller falskt: Sverige ligger i Norden."" är ""Sant"".","True or false: A correct answer to ""True or false: Sweden is in the Nordic region."" is ""True""."',
  ].join('\n');

  const offenders = collectNestedTrueFalsePromptOffenders(dirtyCsv);

  assert.equal(offenders.length, 2);
  assert.match(offenders.join('\n'), /q999 \[questionSv\]/);
  assert.match(offenders.join('\n'), /q999 \[questionEn\]/);
});
