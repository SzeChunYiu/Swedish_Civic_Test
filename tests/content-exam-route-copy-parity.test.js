const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('exam route shell and review copy follows the persisted settings language', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');

  assert.equal(summary.examRouteCopyLabelsValidated, 56);
  assert.equal(summary.examRouteCopyParityValidated, true);
  assert.match(source, /const examRouteCopy: Record<AppLanguage, ExamRouteCopy> = \{/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(source, /const copy = examRouteCopy\[language\];/);
  assert.match(source, /answerAccessibilityLabel: \(optionText, questionNumber\) =>/);
  assert.match(source, /Välj svaret \$\{optionText\} för fråga \$\{questionNumber\}/);
  assert.match(source, /Select answer \$\{optionText\} for question \$\{questionNumber\}/);
  assert.match(source, /import \{ OptionCard \} from '..\/..\/components\/OptionCard';/);
  assert.match(
    source,
    /<OptionCard[\s\S]*accessibilityLabel=\{copy\.answerAccessibilityLabel\(optionText, index \+ 1\)\}[\s\S]*accessibilityRole="radio"[\s\S]*accessibilityState=\{\{ checked: isSelected, selected: isSelected \}\}/,
  );
  assert.doesNotMatch(source, /<Pressable[\s\S]*copy\.answerAccessibilityLabel/);
  assert.match(source, /accessTitle: 'Åtkomst till övningsprov'/);
  assert.match(source, /checkingAccess: 'Kontrollerar åtkomst till övningsprov\.'/);
  assert.match(source, /examResultTitle: 'Resultat från övningsprov'/);
  assert.match(source, /nextExamTitle: 'Nästa övningsprov'/);
  assert.match(source, /startExtraExam: 'Lås upp extra övningsprov'/);
  assert.match(source, /submitAccessibilityLabel: 'Skicka in övningsprovet'/);
  assert.match(source, /submitLabel: 'Skicka övningsprov'/);
  assert.match(source, /accessTitle: 'Mock exam access'/);
  assert.match(source, /startExtraExam: 'Unlock extra mock exam'/);
  assert.match(source, /submitAccessibilityLabel: 'Submit the mock exam'/);
  assert.match(source, /submitLabel: 'Submit mock exam'/);
  assert.match(source, /resultBadge: 'Mock exam score'/);
  assert.match(source, /access_read_failed:/);
  assert.match(source, /Det gick inte att läsa lokal åtkomst för övningsprov/);
  assert.match(source, /Mock exam access could not be checked on this device/);
  [
    'Provåtkomst',
    'Kontrollerar provåtkomst.',
    'Lås upp extra prov',
    'Starta upplåst extra prov',
    'Skicka prov',
    'Provresultat',
    'Nästa prov',
    'Exam access',
    'Unlock extra exam',
    'Start unlocked extra exam',
    'Submit exam',
    'Exam result',
    'Next exam',
  ].forEach((label) => {
    assert.equal(source.includes(label), false, `exam route must not include ${label}`);
  });
  assert.match(source, /selectedAnswerLabel: 'Valt svar'/);
  assert.match(source, /selectedAnswerLabel: 'Selected answer'/);
  assert.match(source, /language === 'en' \? chapter\.chapterNameEn : chapter\.chapterNameSv/);
  assert.match(
    source,
    /import \{ getQuestionDisplayText, getQuestionSourceCitation \} from '..\/..\/lib\/quiz\/questionText';/,
  );
  assert.match(source, /getQuestionSourceCitation\(item, language\)/);
  assert.match(source, /getQuestionSourceCitation\(question, language\)/);
  assert.match(source, /<UHRReferenceCard language=\{language\}/);
  assert.match(
    source,
    /const recordMockExamSession = useProgressStore\(\(state\) => state\.recordMockExamSession\);/,
  );
  assert.match(source, /recordMockExamSession\(\{/);
  assert.match(source, /score: resultTotalCount > 0 \? resultCorrectCount \/ resultTotalCount : 0/);
  assert.match(source, /completedAt: new Date\(\)\.toISOString\(\)/);
});

test('exam route copy parity rejects bypassing the settings language', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/exam.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('const copy = examRouteCopy[language];', 'const copy = examRouteCopy.en;');
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
    /exam route must select copy from settings language/,
  );
});

test('exam route copy parity rejects missing Swedish review labels', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/exam.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("selectedAnswerLabel: 'Valt svar'", "selectedAnswerLabel: 'Selected answer'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /exam route is missing sv copy/);
});

test('exam route copy parity rejects ambiguous mock-exam wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/exam.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("submitLabel: 'Skicka övningsprov'", "submitLabel: 'Skicka prov'");
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
    /exam Swedish submit label must say övningsprov/,
  );
});

test('exam route copy parity rejects bare English exam wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/exam.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("submitLabel: 'Submit mock exam'", "submitLabel: 'Submit exam'");
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
    /exam English submit label must say mock exam/,
  );
});

test('exam route copy parity rejects missing localized UHR source cards', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/exam.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('<UHRReferenceCard language={language}', '<UHRReferenceCard language={undefined}');
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
    /exam UHR references must receive settings language/,
  );
});
