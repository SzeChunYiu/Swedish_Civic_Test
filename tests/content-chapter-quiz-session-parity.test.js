const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
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

test('chapter quiz sessions resolve to the first published question per chapter', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const chapters = loadTs('data/chapters.ts', 'chapters');
  const { questions } = loadTs('data/questions.ts');
  const { getChapterQuizSessionId } = loadTs('lib/quiz/practiceFlow.ts');

  assert.equal(summary.chapterQuizSessionParityValidated, chapters.length);

  chapters.forEach((chapter) => {
    const expectedQuestion = questions.find((question) => question.chapterId === chapter.id);
    const sessionId = getChapterQuizSessionId(questions, chapter.id);
    const sessionQuestion = questions.find((question) => question.id === sessionId);

    assert.ok(expectedQuestion, `${chapter.id} should have a bundled question`);
    assert.equal(sessionId, expectedQuestion.id);
    assert.equal(sessionQuestion.chapterId, chapter.id);
    assert.equal(sessionQuestion.reviewStatus, 'published');
  });

  assert.equal(getChapterQuizSessionId(questions, 'missing-chapter'), null);
  assert.equal(getChapterQuizSessionId(questions, null), null);
});
