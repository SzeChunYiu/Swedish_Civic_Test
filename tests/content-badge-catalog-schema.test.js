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
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const { badgeCatalog, deriveBadges, getBadgeDescription, getBadgeTitle } =
    loadTs('lib/learning/badges.ts');

  assert.deepEqual(Object.keys(badgeCatalog), expectedBadgeIds);
  assert.equal(summary.badgesValidated, expectedBadgeIds.length);
  assert.equal(summary.badgeLocalizedCopyFieldsValidated, expectedBadgeIds.length * 4);
  assert.equal(summary.badgeMilestoneParityValidated, true);
  assert.equal(badgeCatalog.first_practice.titleSv, 'Första övningen');
  assert.equal(badgeCatalog.first_practice.titleEn, 'First practice');
  assert.equal(badgeCatalog.first_practice.descriptionSv, 'Svarade på din första övningsfråga.');
  assert.equal(badgeCatalog.first_practice.descriptionEn, 'Answered your first practice question.');
  assert.equal(getBadgeTitle(badgeCatalog.streak_3, 'sv'), 'Tre dagars svit');
  assert.equal(getBadgeTitle(badgeCatalog.streak_3, 'en'), 'Three-day streak');
  assert.equal(
    getBadgeDescription(badgeCatalog.level_2, 'sv'),
    'Samlade tillräckligt med XP för att nå nivå 2.',
  );
  assert.equal(
    getBadgeDescription(badgeCatalog.level_2, 'en'),
    'Earned enough XP to reach level 2.',
  );
  assert.deepEqual(
    deriveBadges({
      completedQuestionCount: 1,
      currentStreak: 3,
      level: 2,
      wrongAnswerCount: 1,
    }).map((badge) => [badge.id, badge.titleSv, badge.titleEn]),
    [
      ['first_practice', 'Första övningen', 'First practice'],
      ['streak_3', 'Tre dagars svit', 'Three-day streak'],
      ['level_2', 'Nivå 2', 'Level 2'],
      ['mistake_reviewer', 'Misstagsrepetition', 'Mistake reviewer'],
    ],
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
      .replace("titleSv: 'Tre dagars svit'", "titleSv: 'Första övningen'")
      .replace(
        "descriptionEn: 'Practiced on three days in a row.'",
        "descriptionEn: 'Answered your first practice question.'",
      )
      .replace(
        'if (currentStreak >= 3) badges.push(badgeCatalog.streak_3);',
        'if (currentStreak >= 3) badges.push(badgeCatalog.first_practice);',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, /streak_3 duplicates titleSv/);
  assert.match(output, /streak_3 duplicates descriptionEn/);
  assert.match(output, /deriveBadges milestone ids are/);
});

test('learning badge catalog schema rejects English-only localized fields', () => {
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
      .replace("titleSv: 'Första övningen'", "titleSv: 'First practice'")
      .replace(
        "descriptionSv: 'Svarade på din första övningsfråga.'",
        "descriptionSv: 'Answered your first practice question.'",
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, /first_practice titleSv and titleEn must be distinct bilingual text/);
  assert.match(
    output,
    /first_practice descriptionSv and descriptionEn must be distinct bilingual text/,
  );
});
