const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const staleSwedishMistakesCopy = {
  bookmarkedMeta: ['Sparad för', 'fokuserad', 'repetition'].join(' '),
  mistakeBadge: ['Fel', 'logg'].join(''),
  mistakeTitle: ['Fel', 'svar', 'att repetera'].join(' '),
  selectedWrongAnswerLabel: ['Ditt senaste', 'felaktiga svar'].join(' '),
  subtitle: [
    ['Gå igenom', 'fel', 'svar', 'med fråga'].join(' '),
    ['förklaring, källreferens och repetitionsantal', 'på samma plats.'].join(' '),
  ].join(', '),
  wrongAnswers: [['Fel', 'svar'].join(' '), '${count}'].join(': '),
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

  assert.equal(summary.mistakesRouteCopyLabelsValidated, 31);
  assert.equal(summary.mistakesRouteCopyParityValidated, true);
  assert.match(source, /const mistakesCopy: Record<AppLanguage, MistakesCopy> = \{/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(source, /const copy = mistakesCopy\[language\];/);
  assert.match(source, /Gå igenom frågor du har missat, se förklaringen/);
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
  for (const staleCopy of Object.values(staleSwedishMistakesCopy)) {
    assert.doesNotMatch(source, new RegExp(staleCopy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
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

test('mistakes route copy parity rejects stale Swedish review labels', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const staleCopy = ${JSON.stringify(staleSwedishMistakesCopy)};
const tick = String.fromCharCode(96);
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/mistakes.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("'Sparad till senare övning'", JSON.stringify(staleCopy.bookmarkedMeta))
      .replace("'Öva igen'", JSON.stringify(staleCopy.mistakeBadge))
      .replace("'Frågor att öva på'", JSON.stringify(staleCopy.mistakeTitle))
      .replace("'Ditt senaste svar'", JSON.stringify(staleCopy.selectedWrongAnswerLabel))
      .replace(
        "'Gå igenom frågor du har missat, se förklaringen och hitta källan på samma ställe.'",
        JSON.stringify(staleCopy.subtitle),
      )
      .replace(tick + 'Missad $' + '{count} gånger' + tick, tick + staleCopy.wrongAnswers + tick);
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
    /mistakes route keeps stale Swedish review copy/,
  );
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
