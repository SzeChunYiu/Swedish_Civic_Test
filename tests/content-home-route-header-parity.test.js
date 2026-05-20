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

test('home route title and dashboard card headings stay accessible as headers', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/home.tsx'), 'utf8');
  const guidedPathSource = fs.readFileSync(
    path.join(repoRoot, 'components/learning/GuidedPracticePath.tsx'),
    'utf8',
  );
  const screenShell = fs.readFileSync(path.join(repoRoot, 'components/ui/ScreenShell.tsx'), 'utf8');

  assert.equal(summary.homeRouteHeadersValidated, 5);
  assert.equal(summary.homeRouteHeaderParityValidated, true);
  assert.equal(summary.homeRouteCopyLabelsValidated, 96);
  assert.equal(summary.homeRouteCopyParityValidated, true);
  assert.equal(summary.homeRouteInternalBenchmarkCopyValidated, true);
  assert.equal(summary.swedishFlashcardCopyNaturalnessValidated, true);
  assert.match(source, /type HomeCopy =/);
  assert.match(source, /const homeCopy: Record<AppLanguage, HomeCopy>/);
  assert.match(source, /const copy = homeCopy\[language\]/);
  assert.match(source, /computeReadinessFromQuestionProgress/);
  assert.match(
    source,
    /const mockExamSessions = useProgressStore\(\(state\) => state\.mockExamSessions\);/,
  );
  assert.match(source, /mockExamSessions,/);
  assert.match(source, /const readinessVerdict = copy\.readinessVerdicts\[readiness\.verdict\]/);
  assert.match(source, /Studieöversikt/);
  assert.match(source, /Study dashboard/);
  assert.match(source, /Förberedelsesignal/);
  assert.match(source, /Preparation signal/);
  assert.match(source, /Väg från grund till provträning/);
  assert.match(source, /Guided path from basics to exam practice/);
  assert.match(source, /const guidedPathChapterGroups = \[/);
  assert.match(source, /\{ id: 'beginner', chapterIds: \['ch01', 'ch02', 'ch03', 'ch04'\] \}/);
  assert.match(
    source,
    /\{ id: 'builder', chapterIds: \['ch05', 'ch06', 'ch07', 'ch08', 'ch09'\] \}/,
  );
  assert.match(source, /\{ id: 'advanced', chapterIds: \['ch10', 'ch11', 'ch12', 'ch13'\] \}/);
  assert.match(source, /buildGuidedPracticePathStages\(copy, questionProgress\)/);
  assert.match(source, /<SectionHeader[\s\S]*title=\{copy\.guidedPathTitle\}/);
  assert.match(source, /<GuidedPracticePath/);
  assert.match(source, /resumeHref=\{guidedPathResumeHref\}/);
  assert.match(source, /dailyProgress=\{progress\}/);
  assert.match(source, /cta: stageCopy\.cta\(isCompleted\)/);
  assert.match(
    source,
    /ctaAccessibilityLabel: stageCopy\.ctaAccessibilityLabel\(stageCopy\.title, isCompleted\)/,
  );
  assert.match(source, /: '\/exam';/);
  assert.doesNotMatch(source, /group\.id === 'advanced'[\s\S]*'\/learn'/);
  assert.match(guidedPathSource, /href=\{stage\.href\}/);
  assert.match(guidedPathSource, /accessibilityLabel=\{stage\.ctaAccessibilityLabel\}/);
  assert.match(guidedPathSource, /\{stage\.cta\}/);
  assert.match(guidedPathSource, /href="\/practice"/);
  assert.match(guidedPathSource, /minHeight: space\[6\]/);
  assert.match(source, /Smarta studievanor/);
  assert.match(source, /Smart study habits/);
  assert.match(source, /Hela banken gratis/);
  assert.match(source, /Alla 13 ämnen och hela frågebanken ingår gratis/);
  assert.match(source, /Full bank free/);
  assert.match(source, /All 13 topics and the full question bank are included for free/);
  assert.match(source, /<Badge tone="blue">\{copy\.freeBankBadge\}<\/Badge>/);
  assert.match(source, /<Text style=\{styles\.freeBankText\}>\{copy\.freeBankText\}<\/Text>/);
  assert.match(source, /calculateStreakWithFreeze/);
  assert.match(source, /freezeBannerCopy\(streakWithFreeze, language\)/);
  assert.match(source, /Svitskydd/);
  assert.match(source, /Streak freeze/);
  assert.match(source, /<ScreenShell[\s\S]*title=\{copy\.title\}/);
  assert.match(source, /<SectionHeader[\s\S]*title=\{copy\.studyLoopTitle\}/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.goalLabel\}>/);
  assert.match(source, /\{copy\.dailyGoalTitle\}/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.readinessTitle\}>/);
  assert.match(source, /\{copy\.readinessTitle\}/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.feedbackTitle\}>/);
  assert.match(source, /\{copy\.feedbackTitle\}/);
  assert.doesNotMatch(
    source,
    /<Text style=\{styles\.(?:goalLabel|readinessTitle|feedbackTitle)\}>/,
  );
  assert.match(screenShell, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(screenShell, /<Text accessibilityRole="header" style=\{styles\.sectionTitle\}>/);
});

test('home source-trust row links learners to sources without unsupported rating copy', () => {
  const homeSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/home.tsx'), 'utf8');
  const socialProofRow = fs.readFileSync(
    path.join(repoRoot, 'components/ui/SocialProofRow.tsx'),
    'utf8',
  );

  assert.match(homeSource, /<SocialProofRow language=\{language\} \/>/);
  assert.match(socialProofRow, /import \{ Link \} from 'expo-router';/);
  assert.match(socialProofRow, /href="\/sources"/);
  assert.match(socialProofRow, /accessibilityRole="link"/);
  assert.match(socialProofRow, /Källor och transparens/);
  assert.match(socialProofRow, /Sources and transparency/);
  assert.match(socialProofRow, /Öppna källor och transparens/);
  assert.match(socialProofRow, /Open sources and transparency/);
  assert.doesNotMatch(socialProofRow, /Excellent|Utmärkt|5 of 5|5 av 5|★★★★★/);
test('home route copy parity rejects unreachable flashcard promises', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/home.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        'Växla mellan tidsatta prov, bokmärken, missade frågor, ljud och redoindikator.',
        'Växla mellan tidsatta prov, flashcards, bokmärken, missade frågor, ljud och redoindikator.',
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
    /home route must not advertise flashcards until the feature is reachable/,
  );
});

test('home route copy parity rejects harsh Swedish mistake-review wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/home.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        'Växla mellan tidsatta prov, bokmärken, missade frågor, ljud och redoindikator.',
        'Växla mellan tidsatta prov, bokmärken, felspårning, ljud och redoindikator.',
      )
      .replace(
        'genomgång av frågor du missat',
        'repetition av misstag',
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
    /home route Swedish missed-question review copy must use natural learner wording/,
  );
});

test('home route copy parity rejects internal benchmark phrases in learner copy', () => {
  const forbiddenPhrase = ['Optimized', ' study loop'].join('');
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
const forbiddenPhrase = ${JSON.stringify(forbiddenPhrase)};
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/home.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("'Smart study habits'", JSON.stringify(forbiddenPhrase));
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
    /home route learner copy must not expose internal benchmark phrase/,
  );
});

test('home route copy parity rejects guided path chapter drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/home.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("'ch13'", "'ch99'");
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
    /home route guided path must finish with chapters 10-13/,
  );
});

test('home route header parity rejects unheadered dashboard card titles', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/home.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        '<Text accessibilityRole="header" style={styles.feedbackTitle}>',
        '<Text style={styles.feedbackTitle}>',
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
    /home route card headings must expose accessibilityRole="header"/,
  );
});

test('home route copy parity rejects bypassing the settings language', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/home.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('const copy = homeCopy[language];', 'const copy = homeCopy.en;');
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
    /home route must select copy from settings language/,
  );
});

test('home route copy parity rejects missing Swedish shell copy', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/home.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("'Starta övning'", "'Start practice'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /home route is missing sv copy/);
});
