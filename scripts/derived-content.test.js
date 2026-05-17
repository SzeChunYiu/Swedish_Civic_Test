const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function loadTs(relativePath, exportName) {
  const filePath = path.join(repoRoot, relativePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', output)(mod, mod.exports, require);
  return exportName ? mod.exports[exportName] : mod.exports;
}

test('derivePublishedQuestions creates four published UHR-referenced variants per source question', () => {
  const { derivePublishedQuestions } = loadTs('lib/content/derivedQuestions.ts');
  const source = {
    id: 'q001',
    chapterId: 'ch01',
    type: 'single_choice',
    questionSv: 'Var ligger Sverige?',
    questionEn: 'Where is Sweden located?',
    options: [
      { id: 'a', textSv: 'I Norden', textEn: 'In the Nordic region' },
      { id: 'b', textSv: 'I Asien', textEn: 'In Asia' },
      { id: 'c', textSv: 'I Afrika', textEn: 'In Africa' },
      { id: 'd', textSv: 'I Sydamerika', textEn: 'In South America' },
    ],
    correctOptionId: 'a',
    explanationSv: 'Sverige ligger i Norden.',
    explanationEn: 'Sweden is in the Nordic region.',
    uhrReference: { chapter: 'Landet Sverige', section: 'Geografi', pageApprox: 5 },
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['geography'],
  };

  const derived = derivePublishedQuestions([source], 101);
  assert.equal(derived.length, 4);
  assert.deepEqual(
    derived.map((question) => question.id),
    ['q101', 'q102', 'q103', 'q104'],
  );
  assert.ok(derived.every((question) => question.reviewStatus === 'published'));
  assert.ok(derived.every((question) => question.uhrReference.section === 'Geografi'));
  assert.ok(derived.some((question) => question.type === 'true_false'));
  assert.ok(derived.every((question) => question.tags.length === new Set(question.tags).size));
});
