const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const moduleCache = new Map();

function resolveLocalModule(fromFilePath, request) {
  const base = path.resolve(path.dirname(fromFilePath), request);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, 'index.ts')];
  const found = candidates.find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );
  if (!found) throw new Error(`Cannot resolve ${request} from ${fromFilePath}`);
  return found;
}

function loadTs(relativePath, exportName) {
  const filePath = path.resolve(repoRoot, relativePath);
  if (moduleCache.has(filePath)) {
    const cached = moduleCache.get(filePath);
    return exportName ? cached[exportName] : cached;
  }

  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  moduleCache.set(filePath, mod.exports);

  function localRequire(request) {
    if (request === 'expo-speech') return { speak() {}, stop() {} };
    if (request.startsWith('.')) {
      const resolvedPath = resolveLocalModule(filePath, request);
      return loadTs(path.relative(repoRoot, resolvedPath));
    }
    return require(request);
  }

  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  moduleCache.set(filePath, mod.exports);
  return exportName ? mod.exports[exportName] : mod.exports;
}

function optionLetter(index) {
  return String.fromCharCode('A'.charCodeAt(0) + index);
}

const SOURCE_AUTHORITY_REPLACEMENTS = [
  {
    pattern: /\bSant eller falskt\s+enligt UHR-materialet\s*:/gi,
    replacement: 'Sant eller falskt:',
  },
  {
    pattern: /\bTrue or false\s+according to the UHR material\s*:/gi,
    replacement: 'True or false:',
  },
  { pattern: /\bEnligt UHR-materialet,\s*/gi, replacement: '' },
  { pattern: /\bAccording to the UHR material,\s*/gi, replacement: '' },
  { pattern: /\s+enligt UHR-materialet\b/gi, replacement: '' },
  { pattern: /\s+according to the UHR material\b/gi, replacement: '' },
  { pattern: /\s+enligt UHR-avsnittet\s+"[^"]+"/gi, replacement: '' },
  { pattern: /\s+the UHR section\s+"[^"]+"/gi, replacement: '' },
  { pattern: /^\s*Sant eller falskt\s*:\s*/i, replacement: '' },
  { pattern: /^\s*True or false\s*:\s*/i, replacement: '' },
];

function stripSourceAuthorityPhrasing(text) {
  const cleaned = SOURCE_AUTHORITY_REPLACEMENTS.reduce(
    (current, replacement) => current.replace(replacement.pattern, replacement.replacement),
    String(text ?? ''),
  )
    .replace(/\?\s*,\s*/g, '? ')
    .replace(/:\s*,\s*/g, ': ')
    .replace(/\s+([,.:;!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleaned
    .replace(/^([a-zåäö])/, (character) => character.toLocaleUpperCase('sv-SE'))
    .replace(/([.!?]\s+)([a-zåäö])/g, (_match, prefix, character) => {
      return `${prefix}${character.toLocaleUpperCase('sv-SE')}`;
    });
}

function expectedSpeechText(question) {
  const questionText = stripSourceAuthorityPhrasing(question.questionSv) || question.questionSv;
  const optionText = question.options
    .map((option, index) => `Alternativ ${optionLetter(index)}. ${option.textSv}.`)
    .join(' ');
  return `${questionText} ${optionText}`.trim();
}

function runFocusedValidation() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-question-speech-text-parity'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('question speech text stays in parity with every published Swedish option', () => {
  const summary = runFocusedValidation();
  const { questions } = loadTs('data/questions.ts');
  const { buildQuestionSpeechText } = loadTs('lib/audio/speak.ts');
  const expectedOptionCount = questions.reduce(
    (count, question) => count + question.options.length,
    0,
  );
  const sample = questions.find((question) => question.id === 'q001');

  assert.ok(sample, 'q001 should exist');
  assert.equal(summary.questionSpeechTextQuestionsValidated, summary.publishedQuestions);
  assert.equal(summary.questionSpeechTextOptionsValidated, expectedOptionCount);
  assert.equal(summary.questionSpeechTextParityValidated, true);
  assert.equal(buildQuestionSpeechText(sample), expectedSpeechText(sample));
  assert.doesNotMatch(buildQuestionSpeechText(sample), /Enligt UHR-materialet/i);
});

test('focused speech parity reports source-authority leakage with the speech prompt message', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("questionSv: 'Var ligger Sverige?'", "questionSv: 'Enligt UHR-materialet, Var ligger Sverige?'");
  }
  if (normalizedPath.endsWith('/lib/audio/speak.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        'const promptText = stripSourceAuthorityPhrasing(rawPromptText) || rawPromptText;',
        'const promptText = rawPromptText;'
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-question-speech-text-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q001 speech text must start with the display-safe Swedish question prompt/,
  );
  assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, /answerFeedbackRuntimeParity/);
});

test('focused speech parity reports missing option fragments directly', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/audio/speak.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        'const optionText = getQuestionOptions(question)',
        'const optionText = getQuestionOptions(question).slice(0, 0)'
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-question-speech-text-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q001 speech text is missing option fragment Alternativ A\. I Norden i norra Europa\./,
  );
  assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, /speechRuntimeParity/);
});
