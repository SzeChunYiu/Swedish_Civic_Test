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
