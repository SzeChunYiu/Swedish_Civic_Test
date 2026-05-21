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

  assert.equal(summary.examRouteCopyLabelsValidated, 78);
  assert.equal(summary.examRouteCopyParityValidated, true);
  assert.match(source, /const examRouteCopy: Record<AppLanguage, ExamRouteCopy> = \{/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(source, /const copy = examRouteCopy\[language\];/);
  assert.match(source, /answerAccessibilityLabel: \(optionText, questionNumber\) =>/);
  assert.match(source, /Välj svaret \$\{optionText\} för fråga \$\{questionNumber\}/);
  assert.match(source, /Select answer \$\{optionText\} for question \$\{questionNumber\}/);
  assert.match(source, /submitAccessibilityLabel: 'Skicka övningsprov'/);
  assert.match(source, /submitAccessibilityLabel: 'Submit mock exam'/);
  assert.match(source, /selectedAnswerLabel: 'Valt svar'/);
  assert.match(source, /selectedAnswerLabel: 'Selected answer'/);
  assert.match(source, /flagQuestionLabel: 'Flagga för genomgång'/);
  assert.match(source, /flagQuestionLabel: 'Flag for review'/);
  assert.match(source, /flaggedQuestionLabel: 'Flaggad för genomgång'/);
  assert.match(source, /flaggedQuestionLabel: 'Flagged for review'/);
  assert.match(source, /navigatorStateLabels: \{ flagged: 'Flaggad' \}/);
  assert.match(source, /navigatorStateLabels: \{ flagged: 'Flagged' \}/);
  assert.match(
    source,
    /const \[flaggedQuestionIds, setFlaggedQuestionIds\] = useState<Record<string, true>>\(\{\}\);/,
  );
  assert.match(source, /<QuestionNavigator/);
  assert.match(source, /flaggedIndexes=\{flaggedIndexes\}/);
  assert.match(source, /stateLabels=\{copy\.navigatorStateLabels\}/);
  assert.match(source, /language === 'en' \? chapter\.chapterNameEn : chapter\.chapterNameSv/);
  assert.match(
    source,
    /import \{ getQuestionDisplayText, getQuestionSourceCitation \} from '..\/..\/lib\/quiz\/questionText';/,
  );
  assert.match(
    source,
    /import \{ ProvenanceBadge \} from '..\/..\/components\/quiz\/ProvenanceBadge';/,
  );
  assert.match(source, /getQuestionSourceCitation\(item, language\)/);
  assert.match(source, /getQuestionSourceCitation\(question, language\)/);
  assert.match(source, /const examQuestionById = useMemo\(/);
  assert.match(
    source,
    /new Map\(examQuestions\.map\(\(question\) => \[question\.id, question\] as const\)\)/,
  );
  assert.match(source, /<ProvenanceBadge language=\{language\} question=\{question\} \/>/);
  assert.match(
    source,
    /<ProvenanceBadge language=\{language\} question=\{examQuestionById\.get\(item\.questionId\)\} \/>/,
  );
  assert.match(source, /<UHRReferenceCard language=\{language\}/);
  assert.match(
    source,
    /const recordMockExamSession = useProgressStore\(\(state\) => state\.recordMockExamSession\);/,
  );
  assert.match(source, /recordMockExamSession\(\{/);
  const recordCall = source.match(/recordMockExamSession\(\{[\s\S]*?\n\s*\}\);/)?.[0] ?? '';
  assert.doesNotMatch(recordCall, /flaggedQuestionIds/);
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
        '<ProvenanceBadge language={language} question={examQuestionById.get(item.questionId)} />',
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
