const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { createMemoryMMKV, loadTsWithStorage } = require('./helpers/storageStoreHarness.cjs');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-mistakes-route-copy'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('mistakes route shell copy follows the persisted settings language', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/mistakes.tsx'), 'utf8');
  const mistakesRouteE2eSource = fs.readFileSync(
    path.join(repoRoot, 'tests/e2e/mistakes-route.spec.ts'),
    'utf8',
  );

  assert.equal(summary.mistakesRouteCopyLabelsValidated, 30);
  assert.equal(summary.mistakesRouteCopyParityValidated, true);
  assert.match(source, /const mistakesCopy: Record<AppLanguage, MistakesCopy> = \{/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(source, /const copy = mistakesCopy\[language\];/);
  assert.match(source, /Här samlas frågor du vill öva på igen, med förklaring, källhänvisning/);
  assert.match(source, /Sparad till senare övning/);
  assert.match(source, /Inga missade frågor ännu/);
  assert.doesNotMatch(source, /Inga misstag ännu/);
  assert.match(source, /Frågor att öva på/);
  assert.match(source, /Ditt senaste svar/);
  assert.match(source, /Review wrong answers with the question, explanation, source reference/);
  assert.match(source, /Missade frågor/);
  [
    ['Fell', 'ogg'],
    ['Fel svar att', ' repetera'],
    ['Ditt senaste felaktiga', ' svar'],
    ['Sparad för fokuserad', ' repetition'],
  ].forEach((parts) => assert.doesNotMatch(source, new RegExp(parts.join(''))));
  assert.match(source, /Fel svar: \$\{count\}/);
  assert.match(source, /accessibilityLabel=\{copy\.emptyPracticeAccessibilityLabel\}/);
  assert.match(source, /useMistakeReviewStore/);
  assert.match(source, /type AnswerReviewBlockProps = \{/);
  assert.match(source, /function AnswerReviewBlock\(\{/);
  assert.match(source, /const bookmarkedReviewQuestions = questions\.filter\(/);
  assert.match(source, /\(questionProgress\[question\.id\]\?\.wrongCount \?\? 0\) === 0/);
  assert.match(source, /<FlatList/);
  assert.match(source, /data=\{reviewItems\}/);
  assert.match(source, /initialNumToRender=\{10\}/);
  assert.match(source, /testID="mistakes-review-list"/);
  assert.match(source, /testID="mistakes-review-card"/);
  assert.match(
    source,
    /<AnswerReviewBlock copy=\{copy\} correctAnswer=\{correctAnswer\} styles=\{styles\} \/>/,
  );
  assert.match(source, /\{copy\.selectedWrongAnswerLabel\}/);
  assert.match(source, /\{copy\.correctAnswerLabel\}/);
  assert.match(source, /accessibilityLabel=\{copy\.answerReviewAccessibilityLabel\(/);
  assert.match(
    source,
    /\{copy\.wrongAnswers\(questionProgress\[question\.id\]\?\.wrongCount \?\? 0\)\}/,
  );
  assert.match(
    mistakesRouteE2eSource,
    /Practice bookmark persists into Mistakes saved list after reload and clears on revisit/,
  );
  assert.match(mistakesRouteE2eSource, /page\.reload\(\{ waitUntil: 'networkidle' \}\)/);
  assert.match(mistakesRouteE2eSource, /Bookmarked questions/);
  assert.match(mistakesRouteE2eSource, /Saved for focused review/);
  assert.match(mistakesRouteE2eSource, /Remove this question bookmark/);
  assert.match(mistakesRouteE2eSource, /No mistakes yet/);
});

test('mistakes route copy parity rejects the stale Swedish empty-state title', () => {
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
      .replace("'Inga missade frågor ännu'", "'Inga misstag ännu'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-mistakes-route-copy');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /mistakes route is missing sv copy "Inga missade frågor ännu"/,
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
process.argv.push('--focus-mistakes-route-copy');
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
      .replace("'När du missar en övningsfråga visas den här.'", "'No mistakes yet'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-mistakes-route-copy');
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
process.argv.push('--focus-mistakes-route-copy');
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
process.argv.push('--focus-mistakes-route-copy');
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

test('mistakes route copy parity rejects bookmarked cards without answer review', () => {
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
        '<AnswerReviewBlock copy={copy} correctAnswer={correctAnswer} styles={styles} />',
        'null',
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-mistakes-route-copy');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /bookmarked review cards must show the localized correct answer/,
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
