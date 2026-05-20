const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
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

function expectedFormattedTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

test('default mock exam timer stays in parity with configured duration', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const config = loadTs('data/mockExamConfig.ts', 'defaultMockExamConfig');
  const { formatExamTime, shouldAutoSubmitExam } = loadTs('lib/quiz/examGenerator.ts');
  const examRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');
  const totalSeconds = config.durationMinutes * 60;

  assert.equal(summary.mockExamTimerParityValidated, true);
  assert.equal(formatExamTime(totalSeconds), expectedFormattedTime(totalSeconds));
  assert.equal(
    shouldAutoSubmitExam({
      examActive: true,
      remainingSeconds: totalSeconds,
      submitted: false,
      questionCount: config.questionCount,
    }),
    false,
  );
  assert.equal(
    shouldAutoSubmitExam({
      examActive: true,
      remainingSeconds: 0,
      submitted: false,
      questionCount: config.questionCount,
    }),
    true,
  );
  assert.equal(
    shouldAutoSubmitExam({
      examActive: false,
      remainingSeconds: 0,
      submitted: false,
      questionCount: config.questionCount,
    }),
    false,
  );
  assert.equal(formatExamTime(-1), '00:00');
  assert.match(
    examRoute,
    /if \(!examUnlocked \|\| submitted \|\| remainingSeconds <= 0\) return undefined;/,
  );
  assert.match(examRoute, /examActive: examUnlocked/);
  assert.doesNotMatch(
    examRoute,
    /accessDecision\.canStartExam && accessDecision\.reason !== 'rewarded_exam_credit'/,
  );
});

test('mock exam timer parity rejects route timer effects that run before explicit start', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/exam.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('if (!examUnlocked || submitted || remainingSeconds <= 0) return undefined;', 'if (submitted || remainingSeconds <= 0) return undefined;');
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
    /mock exam timer interval must wait for the explicit start state/,
  );
});

test('mock exam timer parity rejects auto-submit without the explicit start guard', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/exam.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('examActive: examUnlocked,', 'examActive: true,');
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
    /mock exam auto-submit must be gated by the explicit start state/,
  );
});

test('mock exam timer parity rejects free or premium auto-unlock regressions', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/exam.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('const accessLoading = !accessReady || !entitlementsReady;', "const accessLoading = !accessReady || !entitlementsReady;\\n  if (accessDecision.canStartExam && accessDecision.reason !== 'rewarded_exam_credit') {\\n    setExamUnlocked(true);\\n  }");
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
    /mock exam route must not auto-unlock free or premium exams before Start is pressed/,
  );
});
