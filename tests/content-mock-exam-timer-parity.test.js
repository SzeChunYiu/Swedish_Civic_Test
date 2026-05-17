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
  const totalSeconds = config.durationMinutes * 60;

  assert.equal(summary.mockExamTimerParityValidated, true);
  assert.equal(formatExamTime(totalSeconds), expectedFormattedTime(totalSeconds));
  assert.equal(
    shouldAutoSubmitExam({
      remainingSeconds: totalSeconds,
      submitted: false,
      questionCount: config.questionCount,
    }),
    false,
  );
  assert.equal(
    shouldAutoSubmitExam({
      remainingSeconds: 0,
      submitted: false,
      questionCount: config.questionCount,
    }),
    true,
  );
  assert.equal(formatExamTime(-1), '00:00');
});
