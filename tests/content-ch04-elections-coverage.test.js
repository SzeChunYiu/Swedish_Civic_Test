const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const moduleCache = new Map();

function resolveLocalModule(fromFilePath, request) {
  const base = path.resolve(path.dirname(fromFilePath), request);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, 'index.ts')];
  const found = candidates.find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );
  if (!found) throw new Error(`Cannot resolve ${request} from ${fromFilePath}`);
  return found;
}

function loadTs(relativePath, exportName) {
  const filePath = path.join(repoRoot, relativePath);
  if (moduleCache.has(filePath)) {
    const cached = moduleCache.get(filePath);
    return exportName ? cached[exportName] : cached;
  }

  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  moduleCache.set(filePath, mod.exports);

  function localRequire(request) {
    if (request.startsWith('.')) {
      return loadTs(path.relative(repoRoot, resolveLocalModule(filePath, request)));
    }
    return require(request);
  }

  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  moduleCache.set(filePath, mod.exports);
  return exportName ? mod.exports[exportName] : mod.exports;
}

test('chapter 4 authored source coverage includes practical election and party participation details', () => {
  const { sourceQuestions } = loadTs('data/questions.ts');
  const ch04Sources = sourceQuestions.filter((question) => question.chapterId === 'ch04');
  const requiredTags = [
    'eu-parliament-election',
    'non-citizen-voting',
    'voting-card',
    'advance-voting',
    'party-membership',
    'new-party',
    'local-parties',
    'campaign-methods',
  ];

  for (const tag of requiredTags) {
    assert.ok(
      ch04Sources.some((question) => question.tags.includes(tag)),
      `expected chapter 4 source coverage for ${tag}`,
    );
  }

  const publishedUhrRows = ch04Sources.filter(
    (question) =>
      question.reviewStatus === 'published' &&
      question.uhrReference?.chapter === 'Politiska val och partier' &&
      Number.isInteger(question.uhrReference?.pageApprox),
  );

  assert.equal(publishedUhrRows.length, ch04Sources.length);
  assert.ok(ch04Sources.length >= 14);
});
