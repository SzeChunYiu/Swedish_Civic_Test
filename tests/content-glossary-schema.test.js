const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
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
  assert.equal(summary.contentTypeSchemaParityValidated, true);
  assert.equal(summary.contentTypeInterfacesValidated, 5);
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
