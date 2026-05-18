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
  assert.equal(
    derived[1].questionSv,
    'Sant eller falskt: Det stämmer att Sverige ligger i Norden.',
  );
  assert.equal(
    derived[1].questionEn,
    'True or false: It is true that Sweden is located in the Nordic region.',
  );
  assert.equal(derived[2].questionSv, 'Sant eller falskt: Det stämmer att Sverige ligger i Asien.');
  assert.equal(derived[2].questionEn, 'True or false: It is true that Sweden is located in Asia.');
  assert.equal(derived[3].questionSv, 'Vilket svar är korrekt? Var ligger Sverige?');
  assert.equal(derived[3].questionEn, 'Which answer is correct? Where is Sweden located?');
  assert.ok(
    derived
      .filter((question) => question.type === 'true_false')
      .every(
        (question) =>
          !/Ett korrekt svar på frågan|A correct answer to/.test(
            `${question.questionSv} ${question.questionEn}`,
          ),
      ),
  );
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

  const trueFalseVariants = derived.filter((question) => question.type === 'true_false');
  assert.deepEqual(
    trueFalseVariants.map((question) => question.questionSv),
    [
      'Sant eller falskt: Det stämmer i sak att Sverige ligger i Norden.',
      'Sant eller falskt: Det stämmer inte att Sverige ligger i Norden.',
    ],
  );
  assert.deepEqual(
    trueFalseVariants.map((question) => question.questionEn),
    [
      'True or false: It is factually true that Sweden is in the Nordic region.',
      'True or false: It is not true that Sweden is in the Nordic region.',
    ],
  );
  assert.equal(
    derived[3].questionSv,
    'Vilket alternativ stämmer med påståendet? Sverige ligger i Norden.',
  );
  assert.equal(
    derived[3].questionEn,
    'Which option matches the statement? Sweden is in the Nordic region.',
  );
  assert.ok(
    trueFalseVariants.every(
      (question) =>
        !/Sant eller falskt:\s*Ett korrekt svar|True or false:\s*A correct answer/.test(
          `${question.questionSv} ${question.questionEn}`,
        ),
    ),
  );
});
