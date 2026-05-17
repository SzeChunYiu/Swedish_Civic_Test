'use strict';
// GATE: question stems must NOT carry the connective UHR-source phrase.
// The UHR material stays cited ONLY in the Källa/Source line below the
// question (uhrChapter/uhrSection/uhrPage columns), never woven into the
// stem text. Scans the exported bank (covers base + derived variants).
// Owner: SOURCE-CITATION P0 (codex-tasks/open.txt). Do not weaken; if a
// stem legitimately needs the word "UHR" as a sentence subject, phrase it
// without the "Enligt UHR-materialet" / "According to the UHR material" /
// "stämmer bäst enligt UHR-avsnittet" connective.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const CSV = path.resolve(__dirname, '..', 'content', 'question-bank.csv');

const BANNED = [
  /enligt\s+(?:det\s+)?UHR[\s-]?(?:materialet|avsnittet)/i,
  /according to\s+(?:the\s+)?UHR\s+(?:material|section)/i,
  /st(?:ä|a)mmer\s+b(?:ä|a)st\s+enligt\s+UHR/i,
  /best matches the UHR section/i,
];

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
      if (BANNED.some((re) => re.test(v))) {
        offenders.push(`${id} [${header[col]}]: ${v}`);
      }
    }
  }
  return offenders;
}

test('question stems carry no connective UHR-source phrase', () => {
  const text = fs.readFileSync(CSV, 'utf8');
  const offenders = collectStemAuthorityConnectiveOffenders(text);

  assert.equal(
    offenders.length,
    0,
    `Found ${offenders.length} stem(s) with the UHR-source connective phrase ` +
      `(must live only in the Källa/Source line):\n` +
      offenders.slice(0, 20).join('\n'),
  );
});

test('source-citation stem gate rejects connective phrase drift in exported CSV', () => {
  const dirtyExport = fs
    .readFileSync(CSV, 'utf8')
    .replace(
      '"q001","ch01","single_choice","Var ligger Sverige?","Where is Sweden located?",',
      '"q001","ch01","single_choice","Enligt UHR-materialet, var ligger Sverige?","According to the UHR material, where is Sweden located?",',
    );

  const offenders = collectStemAuthorityConnectiveOffenders(dirtyExport);

  assert.equal(offenders.length, 2);
  assert.match(offenders.join('\n'), /q001 \[questionSv\]/);
  assert.match(offenders.join('\n'), /q001 \[questionEn\]/);
});
