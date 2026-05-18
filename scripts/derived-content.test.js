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

test('derivePublishedQuestions keeps generated single-choice variants at four options', () => {
  const { derivePublishedQuestions } = loadTs('lib/content/derivedQuestions.ts');
  const source = {
    id: 'q002',
    chapterId: 'ch01',
    type: 'true_false',
    questionSv: 'Sant eller falskt: Sverige ligger i Norden.',
    questionEn: 'True or false: Sweden is in the Nordic region.',
    options: [
      { id: 'true', textSv: 'Sant', textEn: 'True' },
      { id: 'false', textSv: 'Falskt', textEn: 'False' },
    ],
    correctOptionId: 'true',
    explanationSv: 'Sverige ligger i Norden.',
    explanationEn: 'Sweden is in the Nordic region.',
    uhrReference: { chapter: 'Landet Sverige', section: 'Geografi', pageApprox: 5 },
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['geography', 'true-false'],
  };

  const derived = derivePublishedQuestions([source], 105);
  const singleChoiceVariants = derived.filter((question) => question.type === 'single_choice');

  assert.ok(singleChoiceVariants.length > 0);
  assert.ok(singleChoiceVariants.every((question) => question.options.length === 4));
  singleChoiceVariants.forEach((question) => {
    assert.deepEqual(
      question.options.map((option) => option.id),
      ['a', 'b', 'c', 'd'],
    );
  });
  assert.ok(singleChoiceVariants.every((question) => question.correctOptionId === 'a'));
});

test('derivePublishedQuestions avoids nested meta-stems for true/false source questions', () => {
  const { derivePublishedQuestions } = loadTs('lib/content/derivedQuestions.ts');
  const source = {
    id: 'q002',
    chapterId: 'ch01',
    type: 'true_false',
    questionSv: 'Sant eller falskt: Sveriges nordligaste del ligger norr om polcirkeln.',
    questionEn: "True or false: Sweden's northernmost part lies north of the Arctic Circle.",
    options: [
      { id: 'true', textSv: 'Sant', textEn: 'True' },
      { id: 'false', textSv: 'Falskt', textEn: 'False' },
    ],
    correctOptionId: 'true',
    explanationSv: 'Sveriges nordligaste del ligger norr om polcirkeln.',
    explanationEn: "Sweden's northernmost part lies north of the Arctic Circle.",
    uhrReference: { chapter: 'Landet Sverige', section: 'Geografi', pageApprox: 5 },
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['geography', 'arctic-circle', 'true-false'],
  };

  const derived = derivePublishedQuestions([source], 105);
  const trueFalseVariants = derived.filter((question) => question.type === 'true_false');

  assert.deepEqual(
    trueFalseVariants.map((question) => question.questionSv),
    [
      'Sant eller falskt: Påståendet "Sveriges nordligaste del ligger norr om polcirkeln" är sant.',
      'Sant eller falskt: Påståendet "Sveriges nordligaste del ligger norr om polcirkeln" är falskt.',
    ],
  );
  assert.deepEqual(
    trueFalseVariants.map((question) => question.questionEn),
    [
      'True or false: The statement "Sweden\'s northernmost part lies north of the Arctic Circle" is true.',
      'True or false: The statement "Sweden\'s northernmost part lies north of the Arctic Circle" is false.',
    ],
  );
  trueFalseVariants.forEach((question) => {
    assert.doesNotMatch(question.questionSv, /Ett korrekt svar på frågan "Sant eller falskt:/);
    assert.doesNotMatch(question.questionEn, /A correct answer to "True or false:/);
  });
});
