const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

test('content TypeScript schema stays in parity with runtime validator expectations', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const contentTypes = fs.readFileSync(path.join(repoRoot, 'types/content.ts'), 'utf8');

  assert.equal(summary.contentTypeUnionsValidated, 3);
  assert.equal(summary.contentTypeInterfacesValidated, 5);
  assert.equal(summary.contentTypeSchemaParityValidated, true);
  assert.match(contentTypes, /export type ReviewStatus = 'draft' \| 'reviewed' \| 'published';/);
  assert.match(
    contentTypes,
    /export type QuestionType = 'single_choice' \| 'true_false' \| 'flashcard';/,
  );
  assert.match(contentTypes, /export type Difficulty = 'easy' \| 'medium' \| 'hard';/);
  assert.match(contentTypes, /export interface PracticeQuestion/);
  assert.match(contentTypes, /uhrReference: UHRReference;/);
  assert.match(contentTypes, /tags: string\[\];/);
  assert.match(contentTypes, /export interface GlossaryTerm/);
  assert.match(contentTypes, /chapterId\?: string;/);
});

test('content TypeScript schema parity rejects content field optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/content.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('tags: string[];', 'tags?: string[];');
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
    /PracticeQuestion\.tags optional=true, expected false/,
  );
});

test('content TypeScript schema parity rejects difficulty union drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/content.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        "export type Difficulty = 'easy' | 'medium' | 'hard';",
        "export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';",
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
    /types\/content\.ts Difficulty values are \["easy","medium","hard","expert"\], expected \["easy","medium","hard"\]/,
  );
});

test('content TypeScript schema parity rejects review-status union drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/content.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        "export type ReviewStatus = 'draft' | 'reviewed' | 'published';",
        "export type ReviewStatus = 'draft' | 'reviewed' | 'published' | 'archived';",
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
    /types\/content\.ts ReviewStatus values are \["draft","reviewed","published","archived"\], expected \["draft","reviewed","published"\]/,
  );
});

test('content TypeScript schema parity rejects QuestionType union drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/content.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        "export type QuestionType = 'single_choice' | 'true_false' | 'flashcard';",
        "export type QuestionType = 'single_choice' | 'true_false';",
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
    /types\/content\.ts QuestionType values are \["single_choice","true_false"\], expected \["single_choice","true_false","flashcard"\]/,
  );
});

test('content TypeScript schema parity rejects glossary field optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/content.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('chapterId?: string;', 'chapterId: string;');
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
    /GlossaryTerm\.chapterId optional=false, expected true/,
  );
});

test('content TypeScript schema parity rejects UHR page locator optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/content.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('pageApprox: number;', 'pageApprox?: number;');
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
    /UHRReference\.pageApprox optional=true, expected false/,
  );
});

test('content TypeScript schema parity rejects UHR chapter locator optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/content.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('chapter: string;', 'chapter?: string;');
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
    /UHRReference\.chapter optional=true, expected false/,
  );
});

test('content TypeScript schema parity rejects UHR section locator optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/content.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('section: string;', 'section?: string;');
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
    /UHRReference\.section optional=true, expected false/,
  );
});

test('content TypeScript schema parity rejects answer option translation optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/content.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('textEn: string;', 'textEn?: string;');
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
    /QuestionOption\.textEn optional=true, expected false/,
  );
});

test('content TypeScript schema parity rejects answer option Swedish text optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/content.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('textSv: string;', 'textSv?: string;');
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
    /QuestionOption\.textSv optional=true, expected false/,
  );
});

test('content TypeScript schema parity rejects answer option id optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/content.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        "export interface QuestionOption {\\n  id: string;\\n  textSv: string;\\n  textEn: string;\\n}",
        "export interface QuestionOption {\\n  id?: string;\\n  textSv: string;\\n  textEn: string;\\n}",
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
    /QuestionOption\.id optional=true, expected false/,
  );
});

test('content TypeScript schema parity rejects correct answer id optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/content.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('correctOptionId: string;', 'correctOptionId?: string;');
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
    /PracticeQuestion\.correctOptionId optional=true, expected false/,
  );
});

test('content TypeScript schema parity rejects answer options optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/content.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('options: QuestionOption[];', 'options?: QuestionOption[];');
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
    /PracticeQuestion\.options optional=true, expected false/,
  );
});

test('content TypeScript schema parity rejects UHR reference optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/content.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('uhrReference: UHRReference;', 'uhrReference?: UHRReference;');
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
    /PracticeQuestion\.uhrReference optional=true, expected false/,
  );
});

test('content TypeScript schema parity rejects review status optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/content.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('reviewStatus: ReviewStatus;', 'reviewStatus?: ReviewStatus;');
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
    /PracticeQuestion\.reviewStatus optional=true, expected false/,
  );
});

test('content TypeScript schema parity rejects English explanation optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/content.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('explanationEn: string;', 'explanationEn?: string;');
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
    /PracticeQuestion\.explanationEn optional=true, expected false/,
  );
});

test('content TypeScript schema parity rejects Swedish explanation optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/content.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('explanationSv: string;', 'explanationSv?: string;');
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
    /PracticeQuestion\.explanationSv optional=true, expected false/,
  );
});

test('content TypeScript schema parity rejects English prompt optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/content.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('questionEn: string;', 'questionEn?: string;');
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
    /PracticeQuestion\.questionEn optional=true, expected false/,
  );
});

test('content TypeScript schema parity rejects Swedish prompt optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/content.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('questionSv: string;', 'questionSv?: string;');
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
    /PracticeQuestion\.questionSv optional=true, expected false/,
  );
});

test('content TypeScript schema parity rejects chapter metadata id optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/content.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('chapterId: string;', 'chapterId?: string;');
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
    /PracticeQuestion\.chapterId optional=true, expected false/,
  );
});

test('content TypeScript schema parity rejects question type optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/content.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('type: QuestionType;', 'type?: QuestionType;');
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
    /PracticeQuestion\.type optional=true, expected false/,
  );
});

test('content TypeScript schema parity rejects difficulty optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/content.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('difficulty: Difficulty;', 'difficulty?: Difficulty;');
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
    /PracticeQuestion\.difficulty optional=true, expected false/,
  );
});

test('content TypeScript schema parity rejects question id optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/content.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        "export interface PracticeQuestion {\\n  id: string;\\n  chapterId: string;",
        "export interface PracticeQuestion {\\n  id?: string;\\n  chapterId: string;",
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
    /PracticeQuestion\.id optional=true, expected false/,
  );
});

test('content TypeScript schema parity rejects chapter question-count optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/content.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('questionCount: number;', 'questionCount?: number;');
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
    /Chapter\.questionCount optional=true, expected false/,
  );
});

test('content TypeScript schema parity rejects chapter id optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/content.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        "export interface Chapter {\\n  id: string;\\n  nameSv: string;",
        "export interface Chapter {\\n  id?: string;\\n  nameSv: string;",
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
  assert.match(`${result.stdout}\n${result.stderr}`, /Chapter\.id optional=true, expected false/);
});

test('content TypeScript schema parity rejects chapter Swedish name optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/content.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        "export interface Chapter {\\n  id: string;\\n  nameSv: string;",
        "export interface Chapter {\\n  id: string;\\n  nameSv?: string;",
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
    /Chapter\.nameSv optional=true, expected false/,
  );
});
