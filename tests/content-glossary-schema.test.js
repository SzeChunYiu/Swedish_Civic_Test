const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function loadTs(relativePath, exportName) {
  const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', output)(mod, mod.exports, require);
  return exportName ? mod.exports[exportName] : mod.exports;
}

test('glossary schema validates bundled glossary terms', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const glossaryTerms = loadTs('data/glossary.ts', 'glossaryTerms');
  const ids = new Set(glossaryTerms.map((term) => term.id));

  assert.ok(Array.isArray(glossaryTerms));
  assert.equal(summary.glossaryTerms, glossaryTerms.length);
  assert.equal(summary.glossaryTermsValidated, glossaryTerms.length);
  assert.equal(summary.glossaryTermExactSchemaKeysValidated, glossaryTerms.length);
  assert.equal(summary.contentTypeSchemaParityValidated, true);
  assert.equal(summary.contentTypeInterfacesValidated, 6);
  assert.equal(ids.size, glossaryTerms.length);
});

test('glossary terms use the shared content schema', () => {
  const glossarySource = fs.readFileSync(path.join(repoRoot, 'data/glossary.ts'), 'utf8');
  const contentTypeSource = fs.readFileSync(path.join(repoRoot, 'types/content.ts'), 'utf8');

  assert.match(glossarySource, /import type \{ GlossaryTerm \} from '\.\.\/types\/content';/);
  assert.doesNotMatch(glossarySource, /interface GlossaryTerm/);
  assert.match(contentTypeSource, /export interface GlossaryTerm/);
  assert.match(contentTypeSource, /chapterId\?: string;/);
});

test('glossary schema rejects extra runtime keys', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/data/glossary.ts')) {
    return [
      "import type { GlossaryTerm } from '../types/content';",
      '',
      'export const glossaryTerms: GlossaryTerm[] = [',
      '  {',
      "    id: 'demokrati',",
      "    termSv: 'Demokrati',",
      "    termEn: 'Democracy',",
      "    explanationSv: 'Folkstyre där invånare kan påverka gemensamma beslut.',",
      "    explanationEn: 'Rule by the people where residents can influence shared decisions.',",
      "    chapterId: 'ch03',",
      "    editorNote: 'internal note',",
      '  },',
      '];',
      '',
    ].join('\\n');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, /demokrati\.editorNote is not part of GlossaryTerm schema/);
});

test('glossary schema rejects duplicate terms and unknown chapter links', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/data/glossary.ts')) {
    return [
      "import type { GlossaryTerm } from '../types/content';",
      '',
      'export const glossaryTerms: GlossaryTerm[] = [',
      '  {',
      "    id: 'demokrati',",
      "    termSv: 'Demokrati',",
      "    termEn: 'Democracy',",
      "    explanationSv: 'Folkstyre där invånare kan påverka gemensamma beslut.',",
      "    explanationEn: 'Rule by the people where residents can influence shared decisions.',",
      "    chapterId: 'ch02',",
      '  },',
      '  {',
      "    id: 'demokrati',",
      "    termSv: 'Demokrati',",
      "    termEn: 'Democracy',",
      "    explanationSv: 'Folkstyre där invånare kan påverka gemensamma beslut.',",
      "    explanationEn: 'Rule by the people where residents can influence shared decisions.',",
      "    chapterId: 'ch99',",
      '  },',
      '];',
      '',
    ].join('\\n');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, /demokrati duplicates glossary term id/);
  assert.match(output, /demokrati duplicates Swedish glossary term/);
  assert.match(output, /demokrati duplicates English glossary term/);
  assert.match(output, /demokrati references unknown chapter ch99/);
});
