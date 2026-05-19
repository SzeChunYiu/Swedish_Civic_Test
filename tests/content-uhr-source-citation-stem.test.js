'use strict';
// GATE: question stems must NOT carry UHR source-authority phrasing.
// The UHR material stays cited ONLY in the Källa/Source line below the
// question (uhrChapter/uhrSection/uhrPage columns), never woven into the
// stem text. Scans the exported bank (covers base + derived variants).
// Owner: SOURCE-CITATION P0 (codex-tasks/open.txt). Do not weaken; if a
// stem legitimately needs source context, keep that context in the source line
// rather than "UHR-materialet", "UHR-avsnittet", or "UHR material" wording.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  SOURCE_AUTHORITY_STEM_PATTERNS,
  SOURCE_AUTHORITY_STEM_PATTERN_FIXTURES,
  hasSourceAuthorityStemPattern,
} = require('../scripts/sourceAuthorityStemPatterns');

const CSV = path.resolve(__dirname, '..', 'content', 'question-bank.csv');

function parseCsv(text) {
  // RFC4180-ish: every field quoted (QUOTE_ALL export).
  const rows = [];
  let row = [],
    field = '',
    inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') inQ = false;
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (field !== '' || row.length) {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      }
      if (c === '\r' && text[i + 1] === '\n') i++;
    } else field += c;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function collectStemAuthorityConnectiveOffenders(text) {
  const rows = parseCsv(text);
  const header = rows[0];
  const idIdx = header.indexOf('id');
  const svIdx = header.indexOf('questionSv');
  const enIdx = header.indexOf('questionEn');
  assert.ok(svIdx >= 0 && enIdx >= 0 && idIdx >= 0, 'expected id/questionSv/questionEn columns');

  const offenders = [];
  for (let r = 1; r < rows.length; r++) {
    const id = rows[r][idIdx];
    for (const col of [svIdx, enIdx]) {
      const v = rows[r][col] || '';
      if (hasSourceAuthorityStemPattern(v)) {
        offenders.push(`${id} [${header[col]}]: ${v}`);
      }
    }
  }
  return offenders;
}

function csvField(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

test('question stems carry no UHR source-authority phrase', () => {
  const text = fs.readFileSync(CSV, 'utf8');
  const offenders = collectStemAuthorityConnectiveOffenders(text);

  assert.equal(
    offenders.length,
    0,
    `Found ${offenders.length} stem(s) with UHR source-authority phrasing ` +
      `(must live only in the Källa/Source line):\n` +
      offenders.slice(0, 20).join('\n'),
  );
});

test('source-citation stem gate rejects source-authority phrase drift in exported CSV', () => {
  const dirtyExport = fs
    .readFileSync(CSV, 'utf8')
    .replace(
      '"q001","ch01","single_choice","Var ligger Sverige?","Where is Sweden located?",',
      '"q001","ch01","single_choice","Vilken plats beskriver UHR-materialet?","Which place does the UHR material describe?",',
    );

  const offenders = collectStemAuthorityConnectiveOffenders(dirtyExport);

  assert.equal(offenders.length, 2);
  assert.match(offenders.join('\n'), /q001 \[questionSv\]/);
  assert.match(offenders.join('\n'), /q001 \[questionEn\]/);
});

test('source-citation stem gate rejects every shared source-authority fixture', () => {
  assert.equal(
    SOURCE_AUTHORITY_STEM_PATTERN_FIXTURES.length,
    SOURCE_AUTHORITY_STEM_PATTERNS.length,
  );

  const rows = SOURCE_AUTHORITY_STEM_PATTERN_FIXTURES.map((fixture, index) => {
    const row = {
      id: `fixture-${index + 1}`,
      questionSv: 'Neutral fråga utan källfras.',
      questionEn: 'Neutral question without a source phrase.',
    };
    row[fixture.column] = fixture.text;
    return [row.id, row.questionSv, row.questionEn].map(csvField).join(',');
  });
  const offenders = collectStemAuthorityConnectiveOffenders(
    `"id","questionSv","questionEn"\n${rows.join('\n')}\n`,
  );

  assert.equal(offenders.length, SOURCE_AUTHORITY_STEM_PATTERN_FIXTURES.length);
  for (const fixture of SOURCE_AUTHORITY_STEM_PATTERN_FIXTURES) {
    assert.ok(
      offenders.some((offender) => offender.includes(fixture.text)),
      `${fixture.label} should be reported by the exported CSV gate`,
    );
    assert.equal(
      SOURCE_AUTHORITY_STEM_PATTERNS[fixture.patternIndex].test(fixture.text),
      true,
      `${fixture.label} should exercise its paired shared pattern`,
    );
  }
});
