const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const test = require('node:test');

test('published question types stay answerable by quiz runtime', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  assert.equal(summary.publishedQuestionTypesValidated, summary.publishedQuestions);
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
        'Var ligger Sverige?',
        'Sant eller falskt: Det stämmer att Ungefär nästan 11 miljoner människor bor i Sverige.',
      )
      .replace(
        'Where is Sweden located?',
        'True or false: It is true that Approximately almost 11 million people live in Sweden.',
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
    /q001 contains a generated true\/false grammar-splice stem/,
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
        'Var ligger Sverige?',
        'Sant eller falskt: Det är korrekt att Svaret är genom att kontrollera information.',
      )
      .replace(
        'Where is Sweden located?',
        'True or false: It is correct that the answer is checking information.',
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
    /q001 contains a generated true\/false grammar-splice stem/,
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
        'Var ligger Sverige?',
        'Sant eller falskt: Det är korrekt att Det att Sverige är en konstitutionell monarki betyder att statschefen saknar politisk makt.',
      )
      .replace(
        'Where is Sweden located?',
        'True or false: That the head of state lacks political power describes that Sweden is a constitutional monarchy.',
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
    /q001 contains a generated true\/false grammar-splice stem/,
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
        'Var ligger Sverige?',
        'Sant eller falskt: Alla som har rätt att rösta har en röst var ingår i fria val i en demokrati.',
      )
      .replace(
        'Where is Sweden located?',
        'True or false: Everyone who has the right to vote has one vote each is part of free elections in a democracy.',
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
    /q001 contains a generated true\/false grammar-splice stem/,
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
        'Var ligger Sverige?',
        'Sant eller falskt: Man måste vara svensk medborgare och ha fyllt 18 år gäller för att rösta i Sveriges riksdagsval.',
      )
      .replace(
        'Where is Sweden located?',
        'True or false: You must be a Swedish citizen and at least 18 years old applies to voting in Sweden’s Riksdag election.',
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
    /q001 contains a generated true\/false grammar-splice stem/,
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
        'Var ligger Sverige?',
        'Sant eller falskt: De genomför beslut och måste följa lagar och regeringens instruktioner beskriver statliga myndigheter.',
      )
      .replace(
        'Where is Sweden located?',
        'True or false: They implement decisions and must follow laws and government instructions describes government agencies.',
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
    /q001 contains a generated true\/false grammar-splice stem/,
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
        'Var ligger Sverige?',
        'Sant eller falskt: Allemansrätten innebär att den ger alla möjlighet att vara i naturen.',
      )
      .replace(
        'Where is Sweden located?',
        'True or false: The right of public access means it gives everyone the opportunity to be in nature.',
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
    /q001 contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects generated source-material fallback options', () => {
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
  if (normalizedPath.endsWith('/lib/content/derivedQuestions.ts')) {
    return String(contents)
      .replace('Alla alternativen är korrekta', 'Det går inte att avgöra av materialet')
      .replace('All of the options are correct', 'It cannot be determined from the material');
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
    /q001 generated variant\[3\] option text uses source-material wording/,
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
