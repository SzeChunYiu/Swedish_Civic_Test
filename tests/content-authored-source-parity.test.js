const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { buildSiteQuestionBank } = require('../scripts/export-site-question-bank');

const repoRoot = path.resolve(__dirname, '..');

const auditedChapterOneBatch = [
  {
    id: 'q001',
    questionSv: 'Var ligger Sverige?',
    questionEn: 'Where is Sweden located?',
    section: 'Geografi, klimat och natur',
    page: 5,
    correctSv: 'I Norden i norra Europa',
    correctEn: 'In the Nordic region in northern Europe',
    termsSv: ['Norden', 'norra Europa'],
    termsEn: ['Nordic region', 'northern Europe'],
  },
  {
    id: 'q002',
    questionSv: 'Sveriges nordligaste del ligger norr om polcirkeln.',
    questionEn: "Sweden's northernmost part lies north of the Arctic Circle.",
    section: 'Geografi, klimat och natur',
    page: 5,
    correctSv: 'Sant',
    correctEn: 'True',
    termsSv: ['norr om polcirkeln', 'arktiska området'],
    termsEn: ['north of the Arctic Circle', 'Arctic area'],
  },
  {
    id: 'q003',
    questionSv: 'Ungefär hur långt sträcker sig Sverige från Treriksröset till Smygehuk?',
    questionEn: 'Approximately how far does Sweden stretch from Treriksröset to Smygehuk?',
    section: 'Geografi, klimat och natur',
    page: 5,
    correctSv: 'Cirka 1 600 kilometer',
    correctEn: 'About 1,600 kilometres',
    termsSv: ['1 600 kilometer', 'Treriksröset', 'Smygehuk'],
    termsEn: ['1,600 kilometres', 'Treriksröset', 'Smygehuk'],
  },
  {
    id: 'q004',
    questionSv: 'Vad heter havet vid Sveriges östra kust?',
    questionEn: "What is the sea along Sweden's eastern coast called?",
    section: 'Geografi, klimat och natur',
    page: 5,
    correctSv: 'Östersjön',
    correctEn: 'The Baltic Sea',
    termsSv: ['östra kust', 'Östersjön'],
    termsEn: ['eastern coast', 'Baltic Sea'],
  },
  {
    id: 'q005',
    questionSv: 'Vilka öar är Sveriges två största?',
    questionEn: "Which islands are Sweden's two largest?",
    section: 'Geografi, klimat och natur',
    page: 5,
    correctSv: 'Gotland och Öland',
    correctEn: 'Gotland and Öland',
    termsSv: ['Gotland', 'Öland'],
    termsEn: ['Gotland', 'Öland'],
  },
  {
    id: 'q006',
    questionSv: 'Golfströmmen och den Nordatlantiska strömmen bidrar till Sveriges milda klimat.',
    questionEn: "The Gulf Stream and the North Atlantic Current help make Sweden's climate mild.",
    section: 'Geografi, klimat och natur',
    page: 5,
    correctSv: 'Sant',
    correctEn: 'True',
    termsSv: ['Golfströmmen', 'Nordatlantiska strömmen', 'milt klimat'],
    termsEn: ['Gulf Stream', 'North Atlantic Current', 'mild climate'],
  },
  {
    id: 'q007',
    questionSv: 'Vad heter Sveriges högsta berg?',
    questionEn: "What is the name of Sweden's highest mountain?",
    section: 'Fjäll',
    page: 6,
    correctSv: 'Kebnekaise',
    correctEn: 'Kebnekaise',
    termsSv: ['Kebnekaise', '2 000 meter'],
    termsEn: ['Kebnekaise', '2,000 metres'],
  },
  {
    id: 'q008',
    questionSv: 'Vilka är Sveriges tre största sjöar?',
    questionEn: "What are Sweden's three largest lakes?",
    section: 'Skogar, sjöar och öar',
    page: 6,
    correctSv: 'Vänern, Vättern och Mälaren',
    correctEn: 'Vänern, Vättern, and Mälaren',
    termsSv: ['Vänern', 'Vättern', 'Mälaren'],
    termsEn: ['Vänern', 'Vättern', 'Mälaren'],
  },
  {
    id: 'q009',
    questionSv: 'Ungefär hur många människor bor i Sverige?',
    questionEn: 'Approximately how many people live in Sweden?',
    section: 'Befolkning',
    page: 7,
    correctSv: 'Nästan 11 miljoner',
    correctEn: 'Almost 11 million',
    termsSv: ['nästan 11 miljoner', 'södra delen', 'kusterna'],
    termsEn: ['Almost 11 million', 'southern part', 'coasts'],
  },
  {
    id: 'q010',
    questionSv: 'Vilka naturresurser är viktiga i Sverige?',
    questionEn: 'Which natural resources are important in Sweden?',
    section: 'Naturresurser',
    page: 7,
    correctSv: 'Järnmalm och andra mineraler, skog, jordbruksmark och vatten',
    correctEn: 'Iron ore and other minerals, forest, agricultural land, and water',
    termsSv: ['järnmalm', 'skog', 'jordbruksmark', 'vatten'],
    termsEn: ['iron ore', 'forests', 'agricultural land', 'water'],
  },
];

function readUhrSectionMap() {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, 'content/uhr-section-map.json'), 'utf8'));
}

function optionAtAnswer(question) {
  const answerOption = question.opts[question.answer];
  assert.ok(
    answerOption,
    `${question.id} should have an answer option at index ${question.answer}`,
  );
  return answerOption;
}

function assertIncludesAll(haystack, needles, label) {
  for (const needle of needles) {
    assert.ok(haystack.includes(needle), `${label} should include ${needle}`);
  }
}

test('authored source questions stay reviewed and publish without field drift', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-authored-source-parity'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  assert.equal(summary.authoredSourceQuestionsValidated, summary.sourceQuestions);
  assert.equal(summary.sourcePublicationParityValidated, summary.sourceQuestions);
});

test('CONTENT-VERIFY q001-q010 preserves audited UHR chapter 1 facts', () => {
  const questionsById = new Map(
    buildSiteQuestionBank().questions.map((question) => [question.id, question]),
  );
  const chapterOne = readUhrSectionMap().chapters.find((chapter) => chapter.id === 'ch01');
  assert.ok(chapterOne, 'UHR section map should include chapter 1');
  const chapterOneSections = new Set(chapterOne.sections);

  for (const expected of auditedChapterOneBatch) {
    const question = questionsById.get(expected.id);
    assert.ok(question, `${expected.id} should be present in the published question bank`);
    assert.equal(question.chapterId, 1, `${expected.id} should stay in chapter 1`);
    assert.equal(question.questionProvenance, 'uhr', `${expected.id} should remain UHR-provenance`);
    assert.equal(question.q.sv, expected.questionSv, `${expected.id} Swedish stem changed`);
    assert.equal(question.q.en, expected.questionEn, `${expected.id} English stem changed`);
    assert.doesNotMatch(question.q.sv, /^(?:Sant eller falskt|Enligt UHR)/i);
    assert.doesNotMatch(question.q.en, /^(?:True or false|According to UHR)/i);

    assert.equal(question.source.title, 'Sverige i fokus', `${expected.id} source title`);
    assert.equal(question.source.chapter, 'Landet Sverige', `${expected.id} source chapter`);
    assert.equal(question.source.section, expected.section, `${expected.id} source section`);
    assert.equal(question.source.page, expected.page, `${expected.id} source page`);
    assert.ok(
      chapterOneSections.has(question.source.section),
      `${expected.id} section exists in UHR map`,
    );

    const correct = optionAtAnswer(question);
    assert.equal(correct.sv, expected.correctSv, `${expected.id} Swedish correct answer`);
    assert.equal(correct.en, expected.correctEn, `${expected.id} English correct answer`);
    assertIncludesAll(question.why.sv, expected.termsSv, `${expected.id} Swedish explanation`);
    assertIncludesAll(question.why.en, expected.termsEn, `${expected.id} English explanation`);
  }
});

test('derived q002 false-variant explanation expectation stays anchored to authored source', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'scripts/derived-content.test.js'), 'utf8');

  assert.match(source, /const sourceQ002 = byId\.get\('q002'\);/);
  assert.match(
    source,
    /\[generatedQuestionId\(sourceQuestions,\s*'q002',\s*'falseStatement'\)\]:\s*\[/,
  );
  assert.match(source, /const sourceQ002FalseVariant = assertQuestionTextPresent\(/);
  assert.match(
    source,
    /sourceQ002FalseVariant\.explanationSv,\s*'Sveriges nordligaste del ligger norr om polcirkeln\.'/,
  );
  assert.match(
    source,
    /sourceQ002FalseVariant\.explanationEn,\s*"Sweden's northernmost part lies north of the Arctic Circle\."/,
  );
  assert.match(source, /sourceQ002\.explanationSv/);
  assert.match(source, /sourceQ002\.explanationEn/);
});

test('authored source schema rejects invalid review status values', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents).replace(
      "    reviewStatus: 'reviewed',",
      "    reviewStatus: 'verified',",
    );
  }
  return contents;
};
process.argv.push('--focus-authored-source-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, /q001 authored source reviewStatus is verified, expected reviewed/);
  assert.match(output, /q001 has invalid reviewStatus verified/);
});

test('authored source parity rejects published source field drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    const marker = \`export const sourceQuestions: PracticeQuestion[] = publishQuestions([
  ...baseQuestions,
  ...localizedAdditionalQuestions,
]);\`;
    const replacement = \`export const sourceQuestions: PracticeQuestion[] = publishQuestions([
  ...baseQuestions,
  ...localizedAdditionalQuestions,
]).map((question) =>
  question.id === 'q001'
    ? {
        ...question,
        explanationEn:
          'The published source row drifted away from the authored source explanation.',
      }
    : question,
);\`;
    return String(contents).replace(marker, replacement);
  }
  return contents;
};
process.argv.push('--focus-authored-source-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q001 published source explanationEn does not match authored source/,
  );
});

test('authored source parity expects localized option overlays for additional pilot rows', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/scripts/validate-content.js')) {
    return String(contents).replace(
\`function expectedPublishedSourceOptions(question) {
  if (typeof applyQuestionLocalizationPilot !== 'function') {
    return question.options;
  }

  return applyQuestionLocalizationPilot(question).options;
}\`,
\`function expectedPublishedSourceOptions(question) {
  return question.options;
}\`,
    );
  }
  return contents;
};
process.argv.push('--focus-authored-source-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, /q021 published source options does not match authored source/);
  assert.match(output, /q160 published source options does not match authored source/);
});

test('authored source parity rejects true/false source prefixes before publishing', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents)
      .replace(
        "    questionSv: 'Sveriges nordligaste del ligger norr om polcirkeln.',",
        "    questionSv: 'Sant eller falskt: Sveriges nordligaste del ligger norr om polcirkeln.',",
      )
      .replace(
        '    questionEn: "Sweden\\'s northernmost part lies north of the Arctic Circle.",',
        '    questionEn: "True or false: Sweden\\'s northernmost part lies north of the Arctic Circle.",',
      );
  }
  return contents;
};
process.argv.push('--focus-authored-source-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q002 authored true\/false source stem contains redundant true\/false prefix/,
  );
});

test('authored source parity rejects true/false explanation answer-judgement boilerplate', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents)
      .replace(
        "'Sverige har ett milt klimat jämfört med många andra områden på samma breddgrad. Golfströmmen och den Nordatlantiska strömmen transporterar varmt vatten mot Europa, vilket värmer luften som vindarna för in över Sverige.'",
        "'Påståendet är sant: Sverige har ett milt klimat jämfört med många andra områden på samma breddgrad. Golfströmmen och den Nordatlantiska strömmen transporterar varmt vatten mot Europa, vilket värmer luften som vindarna för in över Sverige.'",
      )
      .replace(
        "'Sweden has a mild climate compared with many other areas at the same latitude. The Gulf Stream and the North Atlantic Current carry warm water toward Europe, warming the air that winds bring over Sweden.'",
        "'The statement is true: Sweden has a mild climate compared with many other areas at the same latitude. The Gulf Stream and the North Atlantic Current carry warm water toward Europe, warming the air that winds bring over Sweden.'",
      );
  }
  return contents;
};
process.argv.push('--focus-authored-source-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q006 authored true\/false source explanation contains answer-judgement boilerplate/,
  );
});
