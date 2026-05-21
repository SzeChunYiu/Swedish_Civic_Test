const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-question-report-link-parity'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('question report CTA is wired from question surfaces to support context', () => {
  const summary = parseValidationSummary();
  const componentSource = fs.readFileSync(
    path.join(repoRoot, 'components/quiz/QuestionReportLink.tsx'),
    'utf8',
  );
  const chapterSource = fs.readFileSync(path.join(repoRoot, 'app/chapter/[chapterId].tsx'), 'utf8');
  const supportSource = fs.readFileSync(path.join(repoRoot, 'app/support.tsx'), 'utf8');
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

  assert.equal(summary.questionReportLinkRulesValidated, 23);
  assert.equal(summary.questionReportLinkParityValidated, true);
  assert.match(componentSource, /Rapportera den här frågan/);
  assert.match(componentSource, /Report this question/);
  assert.match(componentSource, /selectedOptionId\?: string \| null/);
  assert.match(componentSource, /getQuestionSourceCitation\(question, language\)/);
  assert.match(componentSource, /selectedAnswer \? \['selectedAnswer', selectedAnswer\] : null/);
  assert.match(componentSource, /minHeight: space\[6\]/);
  assert.match(chapterSource, /import \{ QuestionReportLink \}/);
  assert.match(
    chapterSource,
    /<QuestionReportLink\s+language=\{language\}\s+question=\{question\}\s+screen="chapter"\s+\/>/,
  );
  assert.doesNotMatch(chapterSource, /screen="chapter"[\s\S]*selectedOptionId=/);
  assert.match(supportSource, /Lägg inte till namn, personnummer, ärendenummer/);
  assert.match(supportSource, /Do not add names, personal identity numbers, case numbers/);
  assert.doesNotMatch(supportSource, /mailto:|Linking\.openURL|fetch\(/);
  assert.match(
    packageJson.scripts['test:content'],
    /tests\/content-question-report-link-parity\.test\.js/,
  );
});

test('question report parity rejects dropping the practice feedback CTA', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
process.argv.push('--focus-question-report-link-parity');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/practice.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(/<QuestionReportLink[\\s\\S]*?selectedOptionId=\\{selectedOptionId\\}[\\s\\S]*?\\/>/, '');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-question-report-link-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /QuestionReportLink missing practice feedback selected answer context/,
  );
});

test('question report parity rejects dropping the chapter reader CTA', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
process.argv.push('--focus-question-report-link-parity');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/chapter/[chapterId].tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(/\\n\\s*<QuestionReportLink\\s+language=\\{language\\}\\s+question=\\{question\\}\\s+screen="chapter"\\s+\\/>/, '');
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
    /QuestionReportLink missing chapter reader source context/,
  );
});

test('question report parity rejects selected-answer context from chapter reading', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
process.argv.push('--focus-question-report-link-parity');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/chapter/[chapterId].tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        '<QuestionReportLink language={language} question={question} screen="chapter" />',
        '<QuestionReportLink language={language} question={question} screen="chapter" selectedOptionId={question.correctOptionId} />',
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
    /QuestionReportLink chapter reader must not include selected answer context/,
  );
});

test('question report parity rejects removing the support no-personal-data warning', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
process.argv.push('--focus-question-report-link-parity');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/support.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('Do not add names, personal identity numbers, case numbers, or other personal data to the report.', 'Send anything that helps support debug the issue.');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-question-report-link-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /QuestionReportLink missing support context non-PII copy/,
  );
});
