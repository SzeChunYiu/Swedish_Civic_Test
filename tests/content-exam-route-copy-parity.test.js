const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function readExamRouteSource() {
  return fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');
}

function parseValidationSummary() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-mock-exam-runtime-parity'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('exam route result summary avoids unsupported official pass-line styling', () => {
  const source = readExamRouteSource();

  assert.match(source, /<ResultSummary[\s\S]*correctCount=\{result\.correctCount\}/);
  assert.match(source, /tone=\{endedByTime \? 'orange' : 'blue'\}/);
  assert.doesNotMatch(source, /result\.percent\s*>=\s*75/);
  assert.doesNotMatch(source, /status=\{result\.percent/);
  assert.doesNotMatch(source, /75\s*%|Passing\s+line|Gräns\s+för\s+godkänt|\bPassed\b|\bGodkänt\b/);
});

test('exam route shell and review copy follows the persisted settings language', () => {
  const summary = parseValidationSummary();
  const source = readExamRouteSource();

  assert.equal(summary.examRouteCopyLabelsValidated, 68);
  assert.equal(summary.examRouteCopyParityValidated, true);
  assert.match(source, /const examRouteCopy: Record<AppLanguage, ExamRouteCopy> = \{/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(source, /const copy = examRouteCopy\[language\];/);
  assert.match(source, /answerGroupAccessibilityLabel: \(questionNumber\) =>/);
  assert.match(source, /Svarsalternativ för fråga \$\{questionNumber\}/);
  assert.match(source, /Answer options for question \$\{questionNumber\}/);
  assert.match(
    source,
    /aria-label=\{copy\.answerGroupAccessibilityLabel\(index \+ 1\)\}[\s\S]*accessibilityLabel=\{copy\.answerGroupAccessibilityLabel\(index \+ 1\)\}[\s\S]*accessibilityRole="radiogroup"[\s\S]*\{question\.options\.map/,
  );
  assert.match(source, /answerAccessibilityLabel: \(optionText, questionNumber\) =>/);
  assert.match(source, /Välj svaret \$\{optionText\} för fråga \$\{questionNumber\}/);
  assert.match(source, /Select answer \$\{optionText\} for question \$\{questionNumber\}/);
  assert.match(source, /aria-checked=\{isSelected\}/);
  assert.match(source, /accessibilityRole="radio"/);
  assert.match(source, /accessibilityState=\{\{ checked: isSelected \}\}/);
  assert.doesNotMatch(source, /aria-selected=\{isSelected\}/);
  assert.doesNotMatch(source, /accessibilityState=\{\{ selected: isSelected \}\}/);
  assert.match(source, /submitAccessibilityLabel: 'Skicka övningsprov'/);
  assert.match(source, /submitAccessibilityLabel: 'Submit mock exam'/);
  assert.match(source, /selectedAnswerLabel: 'Valt svar'/);
  assert.match(source, /selectedAnswerLabel: 'Selected answer'/);
  assert.match(source, /flaggedReviewCount: \(count\) => `Flaggade frågor: \$\{count\}`/);
  assert.match(source, /flaggedReviewCount: \(count\) => `Flagged questions: \$\{count\}`/);
  assert.match(source, /reviewFilterAll: 'Visa alla frågor'/);
  assert.match(source, /reviewFilterAll: 'Show all questions'/);
  assert.match(source, /reviewFilterFlagged: \(count\) => `Visa flaggade frågor \(\$\{count\}\)`/);
  assert.match(
    source,
    /reviewFilterFlagged: \(count\) => `Show flagged questions \(\$\{count\}\)`/,
  );
  assert.match(
    source,
    /reviewFilterSummary: \(visibleCount, totalCount\) =>\s*`Visar \$\{visibleCount\} av \$\{totalCount\} frågor`/,
  );
  assert.match(
    source,
    /reviewFilterSummary: \(visibleCount, totalCount\) =>\s*`Showing \$\{visibleCount\} of \$\{totalCount\} questions`/,
  );
  assert.match(
    source,
    /const \[reviewFilter, setReviewFilter\] = useState<ReviewFilter>\('all'\);/,
  );
  assert.match(source, /const flaggedReviewCount = reviewItems\.filter/);
  assert.match(source, /const filteredReviewItems =/);
  assert.match(source, /reviewFilter === 'flagged'/);
  assert.match(source, /copy\.flaggedReviewCount\(flaggedReviewCount\)/);
  assert.match(
    source,
    /copy\.reviewFilterSummary\(filteredReviewItems\.length, reviewItems\.length\)/,
  );
  assert.match(source, /copy\.reviewFilterFlagged\(flaggedReviewCount\)/);
  assert.match(source, /\{copy\.reviewFilterAll\}/);
  assert.match(
    source,
    /accessibilityLabel=\{copy\.reviewFilterFlagged\(flaggedReviewCount\)\}[\s\S]*?accessibilityRole="button"[\s\S]*?accessibilityState=\{\{ selected: reviewFilter === 'flagged' \}\}[\s\S]*?aria-pressed=\{reviewFilter === 'flagged'\}/,
  );
  assert.match(
    source,
    /accessibilityLabel=\{copy\.reviewFilterAll\}[\s\S]*?accessibilityRole="button"[\s\S]*?accessibilityState=\{\{ selected: reviewFilter === 'all' \}\}[\s\S]*?aria-pressed=\{reviewFilter === 'all'\}/,
  );
  assert.match(source, /filteredReviewItems\.map/);
  assert.match(source, /const examQuestionNumberById = useMemo\(/);
  assert.match(source, /copy\.questionNumber\(questionNumber\)/);
  assert.match(source, /language === 'en' \? chapter\.chapterNameEn : chapter\.chapterNameSv/);
  assert.match(
    source,
    /import \{ getQuestionDisplayText, getQuestionSourceCitation \} from '..\/..\/lib\/quiz\/questionText';/,
  );
  assert.match(
    source,
    /import \{ ProvenanceBadge \} from '..\/..\/components\/quiz\/ProvenanceBadge';/,
  );
  assert.match(
    source,
    /import \{ QuestionReportLink \} from '..\/..\/components\/quiz\/QuestionReportLink';/,
  );
  assert.match(source, /getQuestionSourceCitation\(item, language\)/);
  assert.match(source, /getQuestionSourceCitation\(question, language\)/);
  assert.match(source, /const examQuestionById = useMemo\(/);
  assert.match(
    source,
    /new Map\(examQuestions\.map\(\(question\) => \[question\.id, question\] as const\)\)/,
  );
  assert.match(source, /<ProvenanceBadge language=\{language\} question=\{question\} \/>/);
  assert.match(source, /<ProvenanceBadge language=\{language\} question=\{reviewQuestion\} \/>/);
  assert.match(
    source,
    /<QuestionReportLink\s+language=\{language\}\s+question=\{question\}\s+screen="exam"\s+\/>/,
  );
  assert.match(
    source,
    /const reviewQuestion = examQuestionById\.get\(item\.questionId\);[\s\S]*<QuestionReportLink\s+language=\{language\}\s+question=\{reviewQuestion\}\s+screen="exam"\s+selectedOptionId=\{answers\[item\.questionId\]\}\s+\/>/,
  );
  assert.match(source, /<UHRReferenceCard language=\{language\}/);
  assert.match(
    source,
    /const recordMockExamSession = useProgressStore\(\(state\) => state\.recordMockExamSession\);/,
  );
  assert.match(source, /recordMockExamSession\(\{/);
  assert.match(source, /score: resultTotalCount > 0 \? resultCorrectCount \/ resultTotalCount : 0/);
  assert.match(
    source,
    /completedAt: submittedExamSession\?\.completedAt \?\? new Date\(\)\.toISOString\(\)/,
  );
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
process.argv.push('--focus-mock-exam-runtime-parity');
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

test('exam route copy parity rejects selected-button answer options', () => {
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
      .replace('aria-checked={isSelected}', 'aria-selected={isSelected}')
      .replace('accessibilityRole="radio"', 'accessibilityRole="button"')
      .replace('accessibilityState={{ checked: isSelected }}', 'accessibilityState={{ selected: isSelected }}');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-mock-exam-runtime-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /active exam answer options must use checked radio semantics, not selected buttons|exam answer radios must expose checked state on web/,
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
process.argv.push('--focus-mock-exam-runtime-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /exam route is missing sv copy/);
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
process.argv.push('--focus-mock-exam-runtime-parity');
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

test('exam route copy parity rejects dropping provenance badges from exam questions', () => {
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
      .replace('<ProvenanceBadge language={language} question={question} />', 'null')
      .replace(
        '<ProvenanceBadge language={language} question={reviewQuestion} />',
        'null',
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-mock-exam-runtime-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /exam questions must render provenance badges/,
  );
});
