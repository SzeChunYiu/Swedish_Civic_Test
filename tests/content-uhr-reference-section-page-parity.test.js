const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const test = require('node:test');

function parseValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

function runValidationWithAdditionalQuestionsPatch(patchExpression) {
  return spawnSync(
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
    return String(contents).${patchExpression};
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );
}

test('published question UHR references stay in section and page parity with the UHR map', () => {
  const summary = parseValidationSummary();

  assert.equal(summary.uhrReferencesValidated, summary.publishedQuestions);
  assert.equal(summary.questionChapterReferenceParityValidated, summary.publishedQuestions);
});

test('UHR reference parity rejects sections not listed for the referenced chapter', () => {
  const result = runValidationWithAdditionalQuestionsPatch(
    'replace("section: \'Regionerna ansvarar för sjukvården\'", "section: \'Regionerna ansvarar för sjukvard disabled\'")',
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q072 UHR section "Regionerna ansvarar för sjukvard disabled" is not listed for "Välfärdssamhället"/,
  );
});

test('UHR reference parity rejects chapters missing from the UHR section map', () => {
  const result = runValidationWithAdditionalQuestionsPatch(
    `replace("{ chapter: 'Välfärdssamhället', section: 'Regionerna ansvarar för sjukvården', pageApprox: 30 }", "{ chapter: 'Okänt UHR-kapitel', section: 'Regionerna ansvarar för sjukvården', pageApprox: 30 }")`,
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q072 UHR chapter "Okänt UHR-kapitel" is not in section map/,
  );
});

test('UHR reference parity rejects pages outside the referenced chapter range', () => {
  const result = runValidationWithAdditionalQuestionsPatch(
    `replace("{ chapter: 'Välfärdssamhället', section: 'Regionerna ansvarar för sjukvården', pageApprox: 30 }", "{ chapter: 'Välfärdssamhället', section: 'Regionerna ansvarar för sjukvården', pageApprox: 99 }")`,
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q072 UHR page 99 is outside "Välfärdssamhället" page range 30-31/,
  );
});

test('UHR reference parity rejects non-integer page references', () => {
  const result = runValidationWithAdditionalQuestionsPatch(
    `replace("{ chapter: 'Välfärdssamhället', section: 'Regionerna ansvarar för sjukvården', pageApprox: 30 }", "{ chapter: 'Välfärdssamhället', section: 'Regionerna ansvarar för sjukvården', pageApprox: 30.5 }")`,
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q072 UHR page 30\.5 is outside "Välfärdssamhället" page range 30-31/,
  );
});

test('UHR reference parity rejects missing page references', () => {
  const result = runValidationWithAdditionalQuestionsPatch(
    `replace("{ chapter: 'Välfärdssamhället', section: 'Regionerna ansvarar för sjukvården', pageApprox: 30 }", "{ chapter: 'Välfärdssamhället', section: 'Regionerna ansvarar för sjukvården' }")`,
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /q072 has incomplete UHR reference/);
});

test('UHR reference parity rejects blank section references', () => {
  const result = runValidationWithAdditionalQuestionsPatch(
    `replace("{ chapter: 'Välfärdssamhället', section: 'Regionerna ansvarar för sjukvården', pageApprox: 30 }", "{ chapter: 'Välfärdssamhället', section: '', pageApprox: 30 }")`,
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /q072 has incomplete UHR reference/);
});

test('UHR reference parity rejects blank chapter references', () => {
  const result = runValidationWithAdditionalQuestionsPatch(
    `replace("{ chapter: 'Välfärdssamhället', section: 'Regionerna ansvarar för sjukvården', pageApprox: 30 }", "{ chapter: '', section: 'Regionerna ansvarar för sjukvården', pageApprox: 30 }")`,
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /q072 has incomplete UHR reference/);
});

test('UHR reference parity rejects string page references', () => {
  const result = runValidationWithAdditionalQuestionsPatch(
    `replace("{ chapter: 'Välfärdssamhället', section: 'Regionerna ansvarar för sjukvården', pageApprox: 30 }", "{ chapter: 'Välfärdssamhället', section: 'Regionerna ansvarar för sjukvården', pageApprox: '30' }")`,
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q072 UHR page 30 is outside "Välfärdssamhället" page range 30-31/,
  );
});

test('UHR reference parity rejects pages before the referenced chapter range', () => {
  const result = runValidationWithAdditionalQuestionsPatch(
    `replace("{ chapter: 'Välfärdssamhället', section: 'Regionerna ansvarar för sjukvården', pageApprox: 30 }", "{ chapter: 'Välfärdssamhället', section: 'Regionerna ansvarar för sjukvården', pageApprox: 29 }")`,
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q072 UHR page 29 is outside "Välfärdssamhället" page range 30-31/,
  );
});

test('UHR reference parity rejects missing reference objects', () => {
  const result = runValidationWithAdditionalQuestionsPatch(
    `replace("{ chapter: 'Välfärdssamhället', section: 'Regionerna ansvarar för sjukvården', pageApprox: 30 }", "undefined")`,
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q072 uhrReference must be a UHRReference object/,
  );
  assert.match(`${result.stdout}\n${result.stderr}`, /q072 has incomplete UHR reference/);
});
