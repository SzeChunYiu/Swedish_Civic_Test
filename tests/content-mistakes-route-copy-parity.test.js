const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const { createMemoryMMKV, loadTsWithStorage } = require('./helpers/storageStoreHarness.cjs');

const repoRoot = path.resolve(__dirname, '..');

require.extensions['.ts'] = function tsLoader(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText;
  module._compile(transpiled, filename);
};

function parseValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('mistakes route shell copy follows the persisted settings language', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/mistakes.tsx'), 'utf8');

  assert.equal(summary.mistakesRouteCopyLabelsValidated, 30);
  assert.equal(summary.mistakesRouteCopyParityValidated, true);
  assert.match(source, /const mistakesCopy: Record<AppLanguage, MistakesCopy> = \{/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(source, /const copy = mistakesCopy\[language\];/);
  assert.match(source, /Gå igenom fel svar med fråga, förklaring, källreferens/);
  assert.match(source, /Review wrong answers with the question, explanation, source reference/);
  assert.match(source, /accessibilityLabel=\{copy\.emptyPracticeAccessibilityLabel\}/);
  assert.match(source, /useMistakeReviewStore/);
  assert.match(source, /\{copy\.selectedWrongAnswerLabel\}/);
  assert.match(source, /\{copy\.correctAnswerLabel\}/);
  assert.match(source, /accessibilityLabel=\{copy\.answerReviewAccessibilityLabel\(/);
  assert.match(
    source,
    /\{copy\.wrongAnswers\(questionProgress\[question\.id\]\?\.wrongCount \?\? 0\)\}/,
  );
});

test('mistakes route copy parity rejects bypassing the settings language', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/mistakes.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('const copy = mistakesCopy[language];', 'const copy = mistakesCopy.en;');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /mistakes route must select copy from settings language/,
  );
});

test('mistakes route copy parity rejects missing Swedish shell copy', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/mistakes.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("'Svara fel på en övningsfråga så visas den här.'", "'No mistakes yet'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /mistakes route is missing sv copy/);
});

test('mistakes route copy parity rejects missing answer-review accessibility copy', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/mistakes.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        'accessibilityLabel={copy.answerReviewAccessibilityLabel(',
        'accessibilityLabel={copy.emptyPracticeAccessibilityLabel}',
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /answer review must expose localized accessibility summary/,
  );
});

test('mistakes route copy parity rejects missing wrong-answer review store wiring', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/mistakes.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replaceAll('useMistakeReviewStore', 'useProgressStore');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /mistakes route must read stored wrong-answer review text/,
  );
});

test('mistake review store drops corrupt persisted selected-answer reviews', () => {
  const answeredAt = '2026-05-19T10:00:00.000Z';
  const longAnswer = 'x'.repeat(501);
  const storage = createMemoryMMKV({
    mistakeReviewState: JSON.stringify({
      wrongAnswerReviews: {
        q001: {
          answeredAt,
          questionId: 'q001',
          selectedOptionTextEn: '  Wrong answer  ',
          selectedOptionTextSv: '  Fel svar  ',
        },
        qBadDate: {
          answeredAt: 'not-a-date',
          questionId: 'qBadDate',
          selectedOptionTextEn: 'Wrong answer',
          selectedOptionTextSv: 'Fel svar',
        },
        qMismatched: {
          answeredAt,
          questionId: 'other-id',
          selectedOptionTextEn: 'Wrong answer',
          selectedOptionTextSv: 'Fel svar',
        },
        '': {
          answeredAt,
          questionId: '',
          selectedOptionTextEn: 'Wrong answer',
          selectedOptionTextSv: 'Fel svar',
        },
        qBlankEn: {
          answeredAt,
          questionId: 'qBlankEn',
          selectedOptionTextEn: '   ',
          selectedOptionTextSv: 'Fel svar',
        },
        qBlankSv: {
          answeredAt,
          questionId: 'qBlankSv',
          selectedOptionTextEn: 'Wrong answer',
          selectedOptionTextSv: '   ',
        },
        qTooLong: {
          answeredAt,
          questionId: 'qTooLong',
          selectedOptionTextEn: longAnswer,
          selectedOptionTextSv: 'Fel svar',
        },
      },
    }),
  });
  const { useMistakeReviewStore } = loadTsWithStorage(
    repoRoot,
    'lib/storage/mistakeReviewStore.ts',
    {
      'mistake-review': storage,
    },
  );

  assert.deepEqual(useMistakeReviewStore.getState().wrongAnswerReviews, {
    q001: {
      answeredAt,
      questionId: 'q001',
      selectedOptionTextEn: 'Wrong answer',
      selectedOptionTextSv: 'Fel svar',
    },
  });
});
