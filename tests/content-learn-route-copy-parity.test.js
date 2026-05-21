const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-learn-flashcard-deck'],
    {
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('learn route chapter-link copy follows the persisted settings language', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/learn.tsx'), 'utf8');

  assert.equal(summary.learnRouteLinkCopyLabelsValidated, 6);
  assert.equal(summary.learnRouteLinkCopyParityValidated, true);
  assert.match(
    source,
    /import \{ selectDailyFlashcardDeck \} from '\.\.\/\.\.\/lib\/learning\/flashcardDeck';/,
  );
  assert.match(source, /const chapterLinkCopy: Record<AppLanguage, ChapterLinkCopy> = \{/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(
    source,
    /const questionProgress = useProgressStore\(\(state\) => state\.questionProgress\);/,
  );
  assert.match(source, /const copy = chapterLinkCopy\[language\];/);
  assert.match(source, /selectDailyFlashcardDeck\(\{/);
  assert.match(source, /limit: FLASHCARD_PREVIEW_LIMIT,/);
  assert.match(source, /questionProgress,/);
  assert.doesNotMatch(source, /questions\.slice\(0,\s*FLASHCARD_PREVIEW_LIMIT\)/);
  assert.match(source, /innehåll planerat/);
  assert.match(source, /content queued/);
  assert.match(source, /\$\{completedCount\} av \$\{questionCount\} frågor besvarade/);
  assert.match(source, /\$\{completedCount\} of \$\{questionCount\} questions practiced/);
  assert.match(source, /Open chapter \$\{primaryName\}/);
  assert.match(source, /Swedish name: \$\{secondaryName\}/);
  assert.match(source, /const primaryName = language === 'en' \? nameEn : nameSv;/);
  assert.match(source, /const secondaryName = language === 'en' \? nameSv : nameEn;/);
  assert.match(source, /accessibilityLabel=\{getChapterLinkAccessibilityLabel\(\{/);
  assert.match(source, /accessibilityMode="presentation"/);
  assert.match(source, /language=\{language\}/);
});

test('learn route chapter-link copy parity rejects bypassing the settings language', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/learn.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('const copy = chapterLinkCopy[language];', 'const copy = chapterLinkCopy.en;');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-learn-flashcard-deck');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /learn route must select chapter-link copy from settings language/,
  );
});

test('learn route chapter-link copy parity rejects missing Swedish copy', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/learn.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("'innehåll planerat'", "'content queued'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-learn-flashcard-deck');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /learn route is missing sv copy/);
});

test('learn route exposes native ebook study articles with localized practice-path copy', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/learn.tsx'), 'utf8');
  const cardSource = fs.readFileSync(
    path.join(repoRoot, 'components/learning/StudyArticleCard.tsx'),
    'utf8',
  );

  assert.match(source, /import \{ StudyArticleCard \}/);
  assert.match(source, /import \{ EBOOK_ARTICLE_COUNT \}/);
  assert.match(source, /href="\/ebook"/);
  assert.match(source, /studyArticlesAccessibilityLabel/);
  assert.match(source, /Korta offlineartiklar med källor och länk till kapitelövning/);
  assert.match(source, /Short offline articles with sources and a path back to chapter practice/);
  assert.match(source, /Studieartiklar med övningsväg/);
  assert.match(source, /Study articles with a practice path/);
  assert.match(source, /RemoveAdsPlacementCta placement="chapter_list_banner"/);
  assert.match(source, /AdBanner placement="chapter_list_banner"/);

  assert.match(cardSource, /export interface StudyArticleCardProps/);
  assert.match(cardSource, /accessibilityMode\?: 'summary' \| 'presentation'/);
  assert.match(cardSource, /importantForAccessibility=.*no-hide-descendants/);
  assert.match(cardSource, /tone="green"/);
});
