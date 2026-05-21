const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const { createTsLoader } = require('./helpers/monetizationRuntimeHarness.cjs');

const repoRoot = path.resolve(__dirname, '..');
const loadTs = createTsLoader(repoRoot);

const questionReportLinkModuleMocks = {
  '../Button': {
    Button() {
      return null;
    },
  },
  'expo-router': {
    Link() {
      return null;
    },
  },
  'react-native': {
    StyleSheet: {
      create(styles) {
        return styles;
      },
    },
    View() {
      return null;
    },
  },
  'react/jsx-runtime': {
    Fragment: Symbol('Fragment'),
    jsx() {
      return null;
    },
    jsxs() {
      return null;
    },
  },
};

function loadQuestionReportLinkExports() {
  const filePath = path.join(repoRoot, 'components/quiz/QuestionReportLink.tsx');
  const output = ts.transpileModule(fs.readFileSync(filePath, 'utf8'), {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const mod = { exports: {} };

  function localRequire(specifier) {
    if (Object.hasOwn(questionReportLinkModuleMocks, specifier)) {
      return questionReportLinkModuleMocks[specifier];
    }
    if (specifier === '../../lib/quiz/questionText') {
      return loadTs('lib/quiz/questionText.ts');
    }
    if (specifier === '../../lib/theme') {
      return { space: { 6: 48 } };
    }
    return require(specifier);
  }

  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  return mod.exports;
}

function createReportQuestion() {
  return {
    chapterId: 'ch02',
    correctOptionId: 'a',
    difficulty: 'easy',
    explanationEn: 'Explanation',
    explanationSv: 'Förklaring',
    id: 'q id/å?',
    options: [
      { id: 'a', textEn: 'Vote & choose', textSv: 'Rösta & välja' },
      { id: 'b', textEn: 'Pay a fee', textSv: 'Betala en avgift' },
    ],
    questionEn: 'What can citizens do?',
    questionSv: 'Vad kan medborgare göra?',
    reviewStatus: 'published',
    tags: [],
    type: 'single_choice',
    uhrReference: {
      chapter: 'Demokrati & värden',
      pageApprox: 12,
      section: 'Riksdagens uppgifter',
    },
  };
}

function supportUrl(href) {
  return new URL(href, 'https://example.test');
}

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
  const examSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');
  const supportSource = fs.readFileSync(path.join(repoRoot, 'app/support.tsx'), 'utf8');
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

  assert.equal(summary.questionReportLinkRulesValidated, 26);
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
  assert.match(examSource, /import \{ QuestionReportLink \}/);
  assert.match(
    examSource,
    /<QuestionReportLink\s+language=\{language\}\s+question=\{question\}\s+screen="exam"\s+\/>/,
  );
  assert.match(
    examSource,
    /const reviewQuestion = examQuestionById\.get\(item\.questionId\);[\s\S]*<QuestionReportLink\s+language=\{language\}\s+question=\{reviewQuestion\}\s+screen="exam"\s+selectedOptionId=\{answers\[item\.questionId\]\}\s+\/>/,
  );
  assert.match(supportSource, /Lägg inte till namn, personnummer, ärendenummer/);
  assert.match(supportSource, /Do not add names, personal identity numbers, case numbers/);
  assert.match(supportSource, /Frågekontexten kunde inte användas/);
  assert.match(supportSource, /Question context could not be used/);
  assert.match(supportSource, /avvisade värden/);
  assert.match(supportSource, /rejected values are not shown/);
  assert.match(supportSource, /getQuestionReportContextResult/);
  assert.match(supportSource, /hasQuestionReportSearchParams/);
  assert.match(supportSource, /exam: 'Övningsprov'/);
  assert.match(supportSource, /exam: 'Mock exam'/);
  assert.doesNotMatch(supportSource, /mailto:|Linking\.openURL|fetch\(/);
  assert.match(
    packageJson.scripts['test:content'],
    /tests\/content-question-report-link-parity\.test\.js/,
  );
});

test('buildQuestionReportSupportHref encodes selected-answer support context deterministically', () => {
  const { buildQuestionReportSupportHref } = loadQuestionReportLinkExports();
  const href = buildQuestionReportSupportHref({
    language: 'en',
    question: createReportQuestion(),
    screen: 'practice',
    selectedOptionId: 'a',
  });
  const url = supportUrl(href);

  assert.equal(
    href,
    '/support?questionId=q%20id%2F%C3%A5%3F&source=Source%3A%20Sverige%20i%20fokus%2C%20Demokrati%20%26%20v%C3%A4rden%2C%20Riksdagens%20uppgifter%2C%20p.%2012&language=en&reportScreen=practice&screen=practice&selectedAnswer=Vote%20%26%20choose',
  );
  assert.equal(url.pathname, '/support');
  assert.equal(url.searchParams.get('questionId'), 'q id/å?');
  assert.equal(
    url.searchParams.get('source'),
    'Source: Sverige i fokus, Demokrati & värden, Riksdagens uppgifter, p. 12',
  );
  assert.equal(url.searchParams.get('language'), 'en');
  assert.equal(url.searchParams.get('reportScreen'), 'practice');
  assert.equal(url.searchParams.get('screen'), 'practice');
  assert.equal(url.searchParams.get('selectedAnswer'), 'Vote & choose');
});

test('buildQuestionReportSupportHref omits missing or unknown selected answers', () => {
  const { buildQuestionReportSupportHref } = loadQuestionReportLinkExports();
  const question = createReportQuestion();

  for (const selectedOptionId of [undefined, null, 'missing']) {
    const url = supportUrl(
      buildQuestionReportSupportHref({
        language: 'sv',
        question,
        screen: 'chapter',
        selectedOptionId,
      }),
    );

    assert.equal(url.searchParams.get('questionId'), 'q id/å?');
    assert.equal(
      url.searchParams.get('source'),
      'Källa: Sverige i fokus, Demokrati & värden, Riksdagens uppgifter, s. 12',
    );
    assert.equal(url.searchParams.get('language'), 'sv');
    assert.equal(url.searchParams.get('reportScreen'), 'chapter');
    assert.equal(url.searchParams.get('screen'), 'chapter');
    assert.equal(url.searchParams.has('selectedAnswer'), false);
  }
});

test('buildQuestionReportSupportHref selects localized answer text before encoding', () => {
  const { buildQuestionReportSupportHref } = loadQuestionReportLinkExports();
  const url = supportUrl(
    buildQuestionReportSupportHref({
      language: 'sv',
      question: createReportQuestion(),
      screen: 'quiz',
      selectedOptionId: 'a',
    }),
  );

  assert.equal(url.searchParams.get('selectedAnswer'), 'Rösta & välja');
});

test('buildQuestionReportSupportHref accepts exam screen reports with selected answer context', () => {
  const { buildQuestionReportSupportHref } = loadQuestionReportLinkExports();
  const url = supportUrl(
    buildQuestionReportSupportHref({
      language: 'en',
      question: createReportQuestion(),
      screen: 'exam',
      selectedOptionId: 'a',
    }),
  );

  assert.equal(url.searchParams.get('reportScreen'), 'exam');
  assert.equal(url.searchParams.get('screen'), 'exam');
  assert.equal(url.searchParams.get('selectedAnswer'), 'Vote & choose');
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

test('question report parity rejects dropping mock exam report context', () => {
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
  if (normalizedPath.endsWith('/app/(tabs)/exam.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(/\\n\\s*<QuestionReportLink\\s+language=\\{language\\}\\s+question=\\{question\\}\\s+screen="exam"\\s+\\/>/, '')
      .replace(/\\n\\s*<QuestionReportLink[\\s\\S]*?question=\\{reviewQuestion\\}[\\s\\S]*?selectedOptionId=\\{answers\\[item\\.questionId\\]\\}[\\s\\S]*?\\/>/, '');
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
    /QuestionReportLink missing active exam source context|QuestionReportLink missing submitted exam selected answer context/,
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

test('question report parity rejects removing the rejected-context notice', () => {
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
      .replace('Question context could not be used', 'Question context')
      .replace('rejected values are not shown here.', 'the rejected values are shown below.');
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
    /QuestionReportLink missing support rejected context notice/,
  );
});
