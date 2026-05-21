const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const expectedBadgeIds = ['first_practice', 'streak_3', 'level_2', 'mistake_reviewer'];

function loadTs(relativePath) {
  const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', output)(mod, mod.exports, require);
  return mod.exports;
}

test('learning badge catalog schema validates the milestone badges', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-badge-xp-runtime'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const {
    badgeCatalog,
    deriveBadges,
    getAllBadges,
    getBadgeDescription,
    getBadgeLockedHint,
    getBadgeProgressHint,
    getBadgeTitle,
  } = loadTs('lib/learning/badges.ts');

  assert.deepEqual(Object.keys(badgeCatalog), expectedBadgeIds);
  assert.equal(summary.badgesValidated, expectedBadgeIds.length);
  assert.equal(summary.badgeMilestoneParityValidated, true);
  assert.equal(summary.badgeRuntimeInputCasesValidated, 4);
  assert.equal(summary.badgeRuntimeInputParityValidated, true);
  assert.equal(badgeCatalog.first_practice.titleSv, 'Första övningen');
  assert.equal(badgeCatalog.first_practice.titleEn, 'First practice');
  assert.equal(badgeCatalog.first_practice.descriptionSv, 'Svara på din första övningsfråga.');
  assert.equal(badgeCatalog.first_practice.descriptionEn, 'Answer your first practice question.');
  assert.equal(getBadgeTitle(badgeCatalog.streak_3, 'sv'), 'Tre dagars svit');
  assert.equal(getBadgeTitle(badgeCatalog.streak_3, 'en'), 'Three-day streak');
  assert.equal(getBadgeDescription(badgeCatalog.streak_3, 'sv'), 'Öva tre dagar i rad.');
  assert.equal(getBadgeDescription(badgeCatalog.streak_3, 'en'), 'Practice three days in a row.');
  assert.deepEqual(
    getAllBadges().map((badge) => badge.id),
    expectedBadgeIds,
  );
  assert.equal(getBadgeTitle(badgeCatalog.first_practice, 'sv'), 'Första övningen');
  assert.equal(getBadgeTitle(badgeCatalog.first_practice, 'en'), 'First practice');
  assert.equal(getBadgeDescription(badgeCatalog.streak_3, 'sv'), 'Öva tre dagar i rad.');
  assert.equal(
    getBadgeLockedHint(badgeCatalog.level_2, 'en'),
    'Keep practicing until you reach level 2.',
  );
  assert.equal(
    getBadgeProgressHint(
      badgeCatalog.mistake_reviewer,
      { completedQuestionCount: 0, currentStreak: 0, level: 1, wrongAnswerCount: 0 },
      'sv',
    ),
    '0/1 misstagsfrågor',
  );
  assert.deepEqual(
    deriveBadges({
      completedQuestionCount: 1,
      currentStreak: 3,
      level: 2,
      wrongAnswerCount: 1,
    }).map((badge) => badge.id),
    expectedBadgeIds,
  );
  assert.deepEqual(
    deriveBadges({
      completedQuestionCount: '1',
      currentStreak: '3',
      level: '2',
      wrongAnswerCount: '1',
    }).map((badge) => badge.id),
    [],
  );
  assert.deepEqual(
    deriveBadges({
      completedQuestionCount: Infinity,
      currentStreak: Infinity,
      level: Infinity,
      wrongAnswerCount: Infinity,
    }).map((badge) => badge.id),
    [],
  );
  assert.deepEqual(
    deriveBadges({
      completedQuestionCount: 1.5,
      currentStreak: 3.5,
      level: 2.5,
      wrongAnswerCount: 1.5,
    }).map((badge) => badge.id),
    [],
  );
});

test('learning badge catalog schema rejects duplicate badge copy and milestone drift', () => {
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
  if (normalizedPath.endsWith('/lib/learning/badges.ts')) {
    return String(contents)
      .replace("title: 'Three-day streak'", "title: 'First practice'")
      .replace("titleSv: 'Tre dagars svit'", "titleSv: 'Three-day streak'")
      .replace(
        "description: 'Practice three days in a row.'",
        "description: 'Answer your first practice question.'",
      )
      .replace(
        "descriptionSv: 'Öva tre dagar i rad.'",
        "descriptionSv: 'Practice three days in a row.'",
      )
      .replace(
        'if (currentStreak >= 3) badges.push(badgeCatalog.streak_3);',
        'if (currentStreak >= 3) badges.push(badgeCatalog.first_practice);',
      );
  }
  return contents;
};
process.argv.push('--focus-badge-xp-runtime');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, /streak_3 duplicates badge title/);
  assert.match(output, /streak_3 duplicates badge description/);
  assert.match(output, /streak_3 titleSv must be localized separately from titleEn/);
  assert.match(output, /streak_3 descriptionSv must be localized separately from descriptionEn/);
  assert.match(output, /deriveBadges milestone ids are/);
});

test('learning badge catalog schema rejects missing bilingual badge copy', () => {
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
  if (normalizedPath.endsWith('/lib/learning/badges.ts')) {
    return String(contents)
      .replace("titleSv: 'Första övningen'", "titleSv: ''")
      .replace(
        "descriptionSv: 'Svara på din första övningsfråga.'",
        "descriptionSv: ''",
      );
  }
  return contents;
};
process.argv.push('--focus-badge-xp-runtime');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, /first_practice missing titleSv/);
  assert.match(output, /first_practice missing descriptionSv/);
});
