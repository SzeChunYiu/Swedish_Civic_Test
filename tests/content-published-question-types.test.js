const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const { buildSiteQuestionBank } = require('../scripts/export-site-question-bank');

const repoRoot = path.resolve(__dirname, '..');
const trueFalsePrefixPattern = /^\s*(?:Sant eller falskt|True or false)\s*:/i;

function actualStaticQuestions() {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(repoRoot, 'site/questions.js'), 'utf8'), context, {
    filename: 'site/questions.js',
    timeout: 3000,
  });
  return context.window.SMT_QUESTIONS;
}

test('published question types stay answerable by quiz runtime', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  assert.equal(summary.publishedQuestionTypesValidated, summary.publishedQuestions);
});

test('published true/false question banks omit UI-afforded prefixes', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = actualStaticQuestions();
  const csvLines = fs
    .readFileSync(path.join(repoRoot, 'content/question-bank.csv'), 'utf8')
    .split(/\r?\n/);

  const generatedStaticOffenders = generatedSiteBank
    .filter((question) => question.type === 'true_false')
    .filter(
      (question) =>
        trueFalsePrefixPattern.test(question.q.sv) || trueFalsePrefixPattern.test(question.q.en),
    )
    .map((question) => question.id);
  const actualStaticOffenders = Array.from(actualSiteBank)
    .filter((question) => question.type === 'true_false')
    .filter(
      (question) =>
        trueFalsePrefixPattern.test(question.q.sv) || trueFalsePrefixPattern.test(question.q.en),
    )
    .map((question) => question.id);
  const csvOffenders = csvLines
    .filter((line) => line.includes('"true_false"'))
    .filter((line) => /"(?:Sant eller falskt|True or false)\s*:/.test(line))
    .map((line) => line.match(/^"([^"]+)"/)?.[1] ?? line.slice(0, 80));

  assert.deepEqual(generatedStaticOffenders, []);
  assert.deepEqual(actualStaticOffenders, []);
  assert.deepEqual(csvOffenders, []);
});

test('generated single-choice banks omit true-false and filler option shells', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = actualStaticQuestions();
  const fillerOptionPattern =
    /^(?:Inget av alternativen stämmer|None of the options is correct|Endast ibland|Only sometimes)$/i;
  const metaStemPattern = /^(?:Vilket svar är korrekt\?|Which answer is correct\?)/i;
  const absentTrueFalseExplanationPattern =
    /\b(?:Påståendet är sant|alternativet\s+Sant|medan\s+Falskt|That makes True correct|True is correct|while False)\b/i;

  function singleChoiceOptionTexts(question) {
    return (question.opts || []).flatMap((option) => [option.sv, option.en]);
  }

  function fillerRows(questions) {
    return Array.from(questions)
      .filter((question) => question.type === 'single_choice')
      .filter((question) =>
        singleChoiceOptionTexts(question).some((text) => fillerOptionPattern.test(text)),
      )
      .map((question) => question.id);
  }

  function trueFalseShellRows(questions) {
    return Array.from(questions)
      .filter((question) => question.type === 'single_choice')
      .filter((question) => {
        const texts = new Set(singleChoiceOptionTexts(question));
        return (
          texts.has('Sant') &&
          texts.has('Falskt') &&
          texts.has('True') &&
          texts.has('False') &&
          singleChoiceOptionTexts(question).some((text) => fillerOptionPattern.test(text))
        );
      })
      .map((question) => question.id);
  }

  function metaStemRows(questions) {
    return Array.from(questions)
      .filter((question) => question.type === 'single_choice')
      .filter(
        (question) => metaStemPattern.test(question.q.sv) || metaStemPattern.test(question.q.en),
      )
      .map((question) => question.id);
  }

  function absentTrueFalseExplanationRows(questions) {
    return Array.from(questions)
      .filter((question) => question.type === 'single_choice')
      .filter(
        (question) =>
          !singleChoiceOptionTexts(question).some((text) =>
            /^(?:Sant|Falskt|True|False)$/.test(text),
          ),
      )
      .filter((question) =>
        absentTrueFalseExplanationPattern.test(
          `${question.why?.sv || ''} ${question.why?.en || ''}`,
        ),
      )
      .map((question) => question.id);
  }

  assert.deepEqual(fillerRows(generatedSiteBank), []);
  assert.deepEqual(fillerRows(actualSiteBank), []);
  assert.deepEqual(trueFalseShellRows(generatedSiteBank), []);
  assert.deepEqual(trueFalseShellRows(actualSiteBank), []);
  assert.deepEqual(metaStemRows(generatedSiteBank), []);
  assert.deepEqual(metaStemRows(actualSiteBank), []);
  assert.deepEqual(absentTrueFalseExplanationRows(generatedSiteBank), []);
  assert.deepEqual(absentTrueFalseExplanationRows(actualSiteBank), []);
});

test('published question type schema rejects non-answerable flashcards', () => {
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
      "    type: 'single_choice',",
      "    type: 'flashcard',",
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q001 published question type flashcard is not quiz-answerable/,
  );
});

test('published question answer schema rejects orphaned correct option ids', () => {
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
      "    correctOptionId: 'a',",
      "    correctOptionId: 'missing',",
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q001 correctOptionId does not match an option/,
  );
});

test('published question answer schema rejects duplicate option ids', () => {
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
      "      { id: 'b',",
      "      { id: 'a',",
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /q001 has duplicate option id a/);
});

test('published question schema rejects nested generated true/false meta-stems', () => {
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
        'Var ligger Sverige?',
        'Sant eller falskt: Ett korrekt svar på frågan "Sant eller falskt: Sveriges nordligaste del ligger norr om polcirkeln." är "Sant".',
      )
      .replace(
        'Where is Sweden located?',
        'True or false: A correct answer to "True or false: Sweden is in northern Europe." is "True".',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q001 contains a generated true\/false meta-stem instead of a civic statement/,
  );
});

test('published question schema rejects nested single-choice true/false source prompts', () => {
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
        'Var ligger Sverige?',
        'Vilket svar stämmer bäst? Sant eller falskt: Sveriges nordligaste del ligger norr om polcirkeln.',
      )
      .replace(
        'Where is Sweden located?',
        'Which answer best matches? True or false: Sweden is in northern Europe.',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q001 contains a generated true\/false meta-stem instead of a civic statement/,
  );
});

test('published question schema rejects generated judgement meta-stems', () => {
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
        'Var ligger Sverige?',
        'Vilket alternativ motsvarar rätt bedömning av påståendet? Var ligger Sverige?',
      )
      .replace(
        'Where is Sweden located?',
        'Which option gives the correct judgment of the statement? Where is Sweden located?',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q001 contains a generated judgement meta-stem instead of a civic-study prompt/,
  );
});

test('published question schema rejects generated true/false grammar-splice stems', () => {
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
        'Sveriges nordligaste del ligger norr om polcirkeln.',
        'Det stämmer att Ungefär nästan 11 miljoner människor bor i Sverige.',
      )
      .replace(
        "Sweden's northernmost part lies north of the Arctic Circle.",
        'It is true that Approximately almost 11 million people live in Sweden.',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q002 contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects generated true/false answer-scaffold stems', () => {
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
        'Sveriges nordligaste del ligger norr om polcirkeln.',
        'Det är korrekt att Svaret är genom att kontrollera information.',
      )
      .replace(
        "Sweden's northernmost part lies north of the Arctic Circle.",
        'It is correct that the answer is checking information.',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q002 contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects generated true/false describes-that stems', () => {
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
        'Sveriges nordligaste del ligger norr om polcirkeln.',
        'Det är korrekt att Det att Sverige är en konstitutionell monarki betyder att statschefen saknar politisk makt.',
      )
      .replace(
        "Sweden's northernmost part lies north of the Arctic Circle.",
        'That the head of state lacks political power describes that Sweden is a constitutional monarchy.',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q002 contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects residual generated true/false option-fragment stems', () => {
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
        'Sveriges nordligaste del ligger norr om polcirkeln.',
        'Alla som har rätt att rösta har en röst var ingår i fria val i en demokrati.',
      )
      .replace(
        "Sweden's northernmost part lies north of the Arctic Circle.",
        'Everyone who has the right to vote has one vote each is part of free elections in a democracy.',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q002 contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects residual generated true/false applies-to stems', () => {
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
        'Sveriges nordligaste del ligger norr om polcirkeln.',
        'Man måste vara svensk medborgare och ha fyllt 18 år gäller för att rösta i Sveriges riksdagsval.',
      )
      .replace(
        "Sweden's northernmost part lies north of the Arctic Circle.",
        'You must be a Swedish citizen and at least 18 years old applies to voting in Sweden’s Riksdag election.',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q002 contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects residual generated true/false definition splices', () => {
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
        'Sveriges nordligaste del ligger norr om polcirkeln.',
        'De genomför beslut och måste följa lagar och regeringens instruktioner beskriver statliga myndigheter.',
      )
      .replace(
        "Sweden's northernmost part lies north of the Arctic Circle.",
        'They implement decisions and must follow laws and government instructions describes government agencies.',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q002 contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects residual generated true/false list and meaning splices', () => {
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
        'Sveriges nordligaste del ligger norr om polcirkeln.',
        'Allemansrätten innebär att den ger alla möjlighet att vara i naturen.',
      )
      .replace(
        "Sweden's northernmost part lies north of the Arctic Circle.",
        'The right of public access means it gives everyone the opportunity to be in nature.',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q002 contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects residual generated true/false fragment-only stems', () => {
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
        'Sveriges nordligaste del ligger norr om polcirkeln.',
        'Genom att allmänna handlingar kan begäras ut.',
      )
      .replace(
        "Sweden's northernmost part lies north of the Arctic Circle.",
        'By allowing public documents to be requested.',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q002 contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects generated true/false statement-about-statement stems', () => {
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
        'Sveriges nordligaste del ligger norr om polcirkeln.',
        'Påståendet är sant: Sveriges nordligaste del ligger norr om polcirkeln.',
      )
      .replace(
        "Sweden's northernmost part lies north of the Arctic Circle.",
        'The statement is true: Sweden is in the Nordic region.',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q002 contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects generated true/false negative meta-stems', () => {
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
        'Sveriges nordligaste del ligger norr om polcirkeln.',
        'Det är inte sant att Sveriges nordligaste del ligger norr om polcirkeln.',
      )
      .replace(
        "Sweden's northernmost part lies north of the Arctic Circle.",
        'It is not true that Sweden is in northern Europe.',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q002 contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects false-answer explanations that say True is correct', () => {
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
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  question.id === 'q161'",
        "    ? {",
        "        ...question,",
        "        explanationSv:",
        "          'Påståendet är sant: Sveriges nordligaste del ligger norr om polcirkeln. Därför stämmer alternativet Sant, medan Falskt motsäger uppgiften.',",
        '        explanationEn:',
        '          "The statement is true: Sweden\\'s northernmost part lies north of the Arctic Circle. That makes True correct, while False contradicts the fact.",',
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q161 contains a false-answer explanation that says True is correct/,
  );
});

test('published question schema rejects generated true-answer explanation meta wording', () => {
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
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  question.id === 'q160'",
        "    ? {",
        "        ...question,",
        "        explanationSv:",
        "          'Påståendet är sant: Sveriges nordligaste del ligger norr om polcirkeln. Därför stämmer alternativet Sant, medan Falskt motsäger uppgiften.',",
        '        explanationEn:',
        '          "The statement is true: Sweden\\'s northernmost part lies north of the Arctic Circle. That makes True correct, while False contradicts the fact.",',
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q160 contains a generated true\/false explanation meta-judgement/,
  );
});

test('published question schema rejects generated false-answer explanation meta wording', () => {
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
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  question.id === 'q161'",
        "    ? {",
        "        ...question,",
        "        explanationSv:",
        "          'Sveriges nordligaste del ligger norr om polcirkeln. Därför är påståendet i frågan falskt, och alternativet Falskt stämmer.',",
        '        explanationEn:',
        '          "Sweden\\'s northernmost part lies north of the Arctic Circle. Therefore the statement in the question is false, so False is correct.",',
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q161 contains a generated true\/false explanation meta-judgement/,
  );
});

test('published question schema rejects residual q261-q310 reason-target wording', () => {
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
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        "const q261Residuals = {",
        "  q280: { questionSv: 'En anledning är att valet är hemligt och ingen annan ska se vilket val de gör.', questionEn: 'One reason is the vote is secret and no one else should see their choice.' },",
        "  q281: { questionSv: 'En anledning är att rösterna ska räknas snabbare.', questionEn: 'One reason is votes are counted faster.' },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  q261Residuals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...q261Residuals[question.id],",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  for (const id of ['q280', 'q281']) {
    assert.match(output, new RegExp(`${id} contains a generated true/false grammar-splice stem`));
  }
});

test('published question schema rejects residual q311-q360 true/false wording', () => {
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
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  question.id === 'q328'",
        "    ? {",
        "        ...question,",
        "        questionEn: 'A person in Sweden is criminally responsible and able to be prosecuted for a crime from 15 years.',",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q328 contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects residual q361-q410 true/false wording', () => {
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
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  question.id === 'q408'",
        "    ? {",
        "        ...question,",
        "        questionEn: 'They represent employees, negotiate wages, and can help members.',",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q408 contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects residual q411-q460 true/false wording', () => {
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
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  question.id === 'q456'",
        "    ? {",
        "        ...question,",
        "        questionEn: 'One reason is eU membership.',",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q456 contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects residual q461-q510 true/false wording', () => {
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
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        "const q461Residuals = {",
        "  q464: { questionSv: 'Förändringen genom den nya grundlagen år 1809 var att Kungens makt begränsades.' },",
        "  q476: { questionSv: 'Saltsjöbadsavtalet från 1938 blev viktigt för Samarbetet mellan fackföreningar och arbetsgivare.', questionEn: 'The 1938 Saltsjöbaden Agreement became important for Cooperation between trade unions and employers.' },",
        "  q480: { questionSv: 'En anledning är att Sverige hade långvarig stark ekonomisk tillväxt och kunde genomföra stora reformer.', questionEn: 'One reason is that Sweden had long-lasting strong economic growth and could carry out major reforms.' },",
        "  q481: { questionSv: 'En anledning är att Sverige saknade nästan all industri.', questionEn: 'One reason is that Sweden had almost no industry.' },",
        "  q489: { questionSv: 'Den digitala revolutionen har förändrat bara hur människor firar midsommar.', questionEn: 'The digital revolution has changed only how people celebrate Midsummer.' },",
        "  q505: { questionSv: 'Europarådet arbetar för endast jordbrukspolitik.', questionEn: 'The Council of Europe works for only agricultural policy.' },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  q461Residuals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...q461Residuals[question.id],",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  for (const id of ['q464', 'q476', 'q480', 'q481', 'q489', 'q505']) {
    assert.match(output, new RegExp(`${id} contains a generated true/false grammar-splice stem`));
  }
});

test('published question schema rejects residual q511-q560 true/false wording', () => {
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
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        "const q511Residuals = {",
        "  q536: { questionEn: 'Islam is described as the second largest in Sweden.' },",
        "  q537: { questionEn: 'Judaism is described as the second largest in Sweden.' },",
        "  q540: { questionEn: 'On New Year’s Eve, 31 December,, it is common to celebrate with parties and dinners and at night with fireworks.' },",
        "  q541: { questionEn: 'On New Year’s Eve, 31 December,, it is common to large bonfires and spring songs.' },",
        "  q545: { questionSv: 'På Sveriges nationaldag den 6 juni brukar arbetarrörelsen arrangerar demonstrationer.' },",
        "  q552: { questionEn: 'Lucia celebration is largely about spreadinging light when the year is at its darkest.' },",
        "  q553: { questionEn: 'Lucia celebration is largely about welcominging spring with large bonfires.' },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  q511Residuals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...q511Residuals[question.id],",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  for (const id of ['q536', 'q537', 'q540', 'q541', 'q545', 'q552', 'q553']) {
    assert.match(output, new RegExp(`${id} contains a generated true/false grammar-splice stem`));
  }
});

test('published question schema rejects residual q561-q610 true/false wording', () => {
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
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        "const q561Residuals = {",
        "  q573: { questionEn: 'Advent occurs a Saturday at the end of October or beginning of November.' },",
        "  q584: { questionEn: 'In different places in Sweden, there are buddhist and Hindu congregations and temples for Buddhists and Hindus.' },",
        "  q608: { questionEn: 'Travel to Asia and increased interest in meditation and yoga is mentioned as an example of contacts with Hindus and Buddhists in Sweden during the 20th century.' },",
        "  q609: { questionEn: \\"That Sweden's first mosques were built during the 1970s is mentioned as an example of contacts with Hindus and Buddhists in Sweden during the 20th century.\\" },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  q561Residuals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...q561Residuals[question.id],",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  for (const id of ['q573', 'q584', 'q608', 'q609']) {
    assert.match(output, new RegExp(`${id} contains a generated true/false grammar-splice stem`));
  }
});

test('published question schema rejects residual q611-q660 true/false wording', () => {
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
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        "const q611Residuals = {",
        "  q616: { questionSv: 'Regeringsformen skyddar rätten att utöva sin religion och skydd mot diskriminering på grund av tro.', questionEn: 'The Instrument of Government protects the right to practice one’s religion and protection from discrimination because of belief.' },",
        "  q617: { questionSv: 'Regeringsformen skyddar att staten väljer religion åt varje invånare.', questionEn: 'The Instrument of Government protects that the state chooses a religion for each resident.' },",
        "  q621: { questionSv: 'Många svenskar firar id al-fitr och Newroz även om de inte ser sig som religiösa.', questionEn: 'Many Swedes celebrate Eid al-Fitr and Newroz even if they do not see themselves as religious.' },",
        "  q632: { questionSv: 'Judar fick rätt att bo i landet och utöva sin religion.', questionEn: 'Jews gained the right to live in the country and practice their religion.' },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  q611Residuals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...q611Residuals[question.id],",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  for (const id of ['q616', 'q617', 'q621', 'q632']) {
    assert.match(output, new RegExp(`${id} contains a generated true/false grammar-splice stem`));
  }
});

test('published question schema rejects residual q661-q710 proper-noun lowercasing', () => {
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
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        "const q661Residuals = {",
        "  q708: { questionSv: 'Julen firar traditionellt jesu födelse inom kristendomen.', questionEn: \\"Christmas traditionally celebrates jesus' birth in Christianity.\\" },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  q661Residuals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...q661Residuals[question.id],",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.match(output, /q708 contains a generated true\/false grammar-splice stem/);
});

test('published question schema rejects residual q661-q710 holiday wording', () => {
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
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        "const q661Residuals = {",
        "  q673: { questionSv: 'Gudstjänsten tidigt på morgonen den 25 december kallas Luciatåg.', questionEn: 'The church service early on the morning of 25 December is called Lucia procession.' },",
        "  q680: { questionSv: 'Barn öppnar en lucka varje dag fram till julafton med en adventskalender hemma.', questionEn: 'Children often open one door each day until Christmas Eve with an Advent calendar at home.' },",
        "  q681: { questionSv: 'Barn tänder stora brasor på kvällen med en adventskalender hemma.', questionEn: 'Children often light large bonfires in the evening with an Advent calendar at home.' },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  q661Residuals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...q661Residuals[question.id],",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  for (const id of ['q673', 'q680', 'q681']) {
    assert.match(output, new RegExp(`${id} contains a generated true/false grammar-splice stem`));
  }
});

test('published question schema rejects source-material generated option fallbacks', () => {
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
      "export const generatedPublishedQuestions: PracticeQuestion[] = derivePublishedQuestions(\\n  sourceQuestions,\\n  sourceQuestions.length + 1,\\n);",
      [
        "export const generatedPublishedQuestions: PracticeQuestion[] = derivePublishedQuestions(",
        "  sourceQuestions,",
        "  sourceQuestions.length + 1,",
        ").map((question) =>",
        "  question.id === 'q155'",
        "    ? {",
        "        ...question,",
        "        options: question.options.map((option, index) =>",
        "          index === 2",
        "            ? { ...option, textSv: 'Det går inte att avgöra av materialet', textEn: 'It cannot be determined from the material' }",
        "            : option,",
        "        ),",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /generated variant\[0\] option\[2\] uses source-material fallback wording/,
  );
});

test('published question schema rejects generated single-choice filler options', () => {
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
      "export const generatedPublishedQuestions: PracticeQuestion[] = derivePublishedQuestions(\\n  sourceQuestions,\\n  sourceQuestions.length + 1,\\n);",
      [
        "export const generatedPublishedQuestions: PracticeQuestion[] = derivePublishedQuestions(",
        "  sourceQuestions,",
        "  sourceQuestions.length + 1,",
        ").map((question) =>",
        "  question.id === 'q158'",
        "    ? {",
        "        ...question,",
        "        options: question.options.map((option, index) =>",
        "          index === 2",
        "            ? { ...option, textSv: 'Inget av alternativen stämmer', textEn: 'None of the options is correct' }",
        "            : option,",
        "        ),",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /generated variant\[3\] option\[2\] uses generated single-choice filler option "(?:Inget av alternativen stämmer|None of the options is correct)"/,
  );
});

test('published question metadata schema rejects invalid difficulty values', () => {
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
      "    difficulty: 'easy',",
      "    difficulty: 'expert',",
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /q001 has invalid difficulty expert/);
});
