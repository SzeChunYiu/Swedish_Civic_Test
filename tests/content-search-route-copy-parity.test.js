const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function resolveLocalModule(fromFile, request) {
  const base = path.resolve(path.dirname(fromFile), request);
  for (const candidate of [`${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return request;
}

function loadTs(relativePath, moduleCache = new Map()) {
  const filePath = path.join(repoRoot, relativePath);

  if (moduleCache.has(filePath)) return moduleCache.get(filePath).exports;

  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const mod = { exports: {} };
  moduleCache.set(filePath, mod);

  const localRequire = (request) => {
    if (request.startsWith('.')) {
      return loadTs(path.relative(repoRoot, resolveLocalModule(filePath, request)), moduleCache);
    }
    return require(request);
  };

  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  return mod.exports;
}

const sampleQuestion = {
  id: 'qsea',
  chapterId: 'ch01',
  type: 'single_choice',
  questionSv: 'Vad heter havet vid Sveriges östra kust?',
  questionEn: "What is the sea along Sweden's eastern coast called?",
  options: [
    { id: 'a', textSv: 'Nordsjön', textEn: 'The North Sea' },
    { id: 'b', textSv: 'Östersjön', textEn: 'The Baltic Sea' },
  ],
  correctOptionId: 'b',
  explanationSv: 'Havet vid Sveriges östra kust heter Östersjön.',
  explanationEn: "The sea along Sweden's eastern coast is the Baltic Sea.",
  uhrReference: {
    chapter: 'Landet Sverige',
    section: 'Geografi, klimat och natur',
    pageApprox: 5,
  },
  difficulty: 'easy',
  reviewStatus: 'reviewed',
  tags: ['geography', 'baltic-sea'],
};

test('search route has localized search copy and highlighted result rendering', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'app/search.tsx'), 'utf8');

  assert.match(source, /type SearchCopy = \{/);
  assert.match(source, /const searchCopy: Record<AppLanguage, SearchCopy> = \{/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(source, /const copy = searchCopy\[language\];/);
  assert.match(source, /searchQuestions\(questions, trimmedQuery, language, \{ limit: 10 \}\)/);
  assert.match(source, /Sök/);
  assert.match(source, /Search/);
  assert.match(source, /Sökresultat/);
  assert.match(source, /Search results/);
  assert.match(source, /renderHighlightedParts/);
  assert.match(source, /styles\.highlight/);
  assert.match(source, /accessibilityRole="link"/);
  assert.doesNotMatch(source, /Question search is coming/);
});

test('question search matches and highlights Swedish text without requiring accents', () => {
  const { searchQuestions } = loadTs('lib/search/questionSearch.ts');
  const [result] = searchQuestions([sampleQuestion], 'ostersjon', 'sv');

  assert.equal(result.question.id, 'qsea');
  assert.equal(result.field, 'answer');
  assert.equal(result.questionText, 'Vad heter havet vid Sveriges östra kust?');
  assert.equal(result.highlightParts.find((part) => part.matched)?.text, 'Östersjön');
});

test('question search matches English answer options and multi-word question tokens', () => {
  const { searchQuestions } = loadTs('lib/search/questionSearch.ts');
  const [answerResult] = searchQuestions([sampleQuestion], 'Baltic Sea', 'en');
  const [questionResult] = searchQuestions([sampleQuestion], 'Sweden coast', 'en');

  assert.equal(answerResult.field, 'answer');
  assert.equal(answerResult.highlightParts.find((part) => part.matched)?.text, 'Baltic Sea');
  assert.equal(questionResult.field, 'question');
  assert.equal(questionResult.questionText, "What is the sea along Sweden's eastern coast called?");
});
