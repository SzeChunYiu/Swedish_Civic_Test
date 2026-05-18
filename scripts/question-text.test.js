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
  const filePath = path.resolve(repoRoot, relativePath);
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

test('question text helper localizes fallback, source citation, and secondary text', () => {
  const {
    getQuestionDisplayText,
    getQuestionSourceCitation,
    getQuestionTranslationText,
    stripSourceAuthorityPhrasing,
  } = loadTs('lib/quiz/questionText.ts');
  const question = {
    questionEn: 'According to the UHR material, where is Sweden located?',
    questionSv: 'Enligt UHR-materialet, var ligger Sverige?',
    uhrReference: {
      chapter: 'Landet Sverige',
      pageApprox: 5,
      section: 'Geografi, klimat och natur',
    },
  };

  assert.equal(
    stripSourceAuthorityPhrasing('enligt UHR-materialet, var ligger Sverige?'),
    'Var ligger Sverige?',
  );
  assert.equal(getQuestionDisplayText(undefined, 'sv'), 'Fråga saknas');
  assert.equal(getQuestionDisplayText(undefined, 'en'), 'Question unavailable');
  assert.equal(getQuestionDisplayText(question, 'sv'), 'Var ligger Sverige?');
  assert.equal(getQuestionDisplayText(question, 'en'), 'Where is Sweden located?');
  assert.equal(getQuestionTranslationText(question, 'sv'), 'Where is Sweden located?');
  assert.equal(getQuestionTranslationText(question, 'en'), 'Var ligger Sverige?');
  assert.equal(
    getQuestionSourceCitation(question, 'sv'),
    'Källa: Sverige i fokus, Landet Sverige, Geografi, klimat och natur, s. 5',
  );
  assert.equal(
    getQuestionSourceCitation(question, 'en'),
    'Source: Sverige i fokus, Landet Sverige, Geografi, klimat och natur, p. 5',
  );
  assert.equal(getQuestionSourceCitation(undefined, 'sv'), 'Källhänvisning saknas');
  assert.equal(getQuestionSourceCitation(undefined, 'en'), 'Source citation unavailable');
});
