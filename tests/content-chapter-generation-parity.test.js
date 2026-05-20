const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const generatedVariantsPerSource = 4;

function loadTs(relativePath) {
  const filePath = path.join(repoRoot, relativePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };

  function localRequire(request) {
    if (request.startsWith('.')) {
      const base = path.resolve(path.dirname(filePath), request);
      const resolved = fs.existsSync(base) ? base : `${base}.ts`;
      return loadTs(path.relative(repoRoot, resolved));
    }
    return require(request);
  }

  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  return mod.exports;
}

function countByChapter(questions) {
  return questions.reduce((counts, question) => {
    counts.set(question.chapterId, (counts.get(question.chapterId) || 0) + 1);
    return counts;
  }, new Map());
}

test('chapter source and generated question counts stay in parity', () => {
  const { chapters } = loadTs('data/chapters.ts');
  const { sourceQuestions, generatedPublishedQuestions, questions } = loadTs('data/questions.ts');
  const sourceCounts = countByChapter(sourceQuestions);
  const generatedCounts = countByChapter(generatedPublishedQuestions);
  const publishedCounts = countByChapter(questions);

  chapters.forEach((chapter) => {
    const sourceCount = sourceCounts.get(chapter.id) || 0;
    const generatedCount = generatedCounts.get(chapter.id) || 0;
    const publishedCount = publishedCounts.get(chapter.id) || 0;

    assert.ok(sourceCount > 0, `${chapter.id} should have authored source questions`);
    assert.equal(generatedCount, sourceCount * generatedVariantsPerSource);
    assert.equal(publishedCount, sourceCount + generatedCount);
    assert.equal(chapter.questionCount, publishedCount);
  });
});

test('chapter question-count guard reports focused metadata drift', () => {
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
  if (normalizedPath.endsWith('/data/chapters.ts')) {
    return String(contents).replace(
      /(id: 'ch07',[\\s\\S]*?questionCount:) 80,/,
      '$1 85,',
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /ch07 questionCount is 85, expected 80 published questions/,
  );
});

test('published question chapter schema rejects unknown chapter ids', () => {
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
      "    chapterId: 'ch01',",
      "    chapterId: 'ch99',",
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /q001 references unknown chapter ch99/);
});
