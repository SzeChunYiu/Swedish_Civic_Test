const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const test = require('node:test');

test('published question objects keep exact runtime schema keys', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  assert.equal(summary.questionExactSchemaKeysValidated, summary.publishedQuestions);
});

test('published question exact schema rejects internal field leakage', () => {
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
        "        textEn: 'In the Nordic region in northern Europe',",
        "        textEn: 'In the Nordic region in northern Europe',\\n        editorNote: 'internal option note',",
      )
      .replace(
        "      pageApprox: 5,\\n    },",
        "      pageApprox: 5,\\n      sourceLine: 'internal source note',\\n    },",
      )
      .replace(
        "    tags: ['geography', 'norden', 'location'],",
        "    tags: ['geography', 'norden', 'location'],\\n    editorNote: 'internal question note',",
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, /q001\.editorNote is not part of PracticeQuestion schema/);
  assert.match(output, /q001 option\[0\]\.editorNote is not part of QuestionOption schema/);
  assert.match(output, /q001 uhrReference\.sourceLine is not part of UHRReference schema/);
});
