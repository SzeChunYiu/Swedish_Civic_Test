const assert = require('node:assert/strict');
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
  new Function('module', 'exports', 'require', output)(mod, mod.exports, (request) => {
    if (request === 'expo-speech') return { speak() {}, stop() {} };
    return require(request);
  });
  return exportName ? mod.exports[exportName] : mod.exports;
}

test('buildQuestionSpeechText reads Swedish question and answer options', () => {
  const { buildQuestionSpeechText } = loadTs('lib/audio/speak.ts');
  const text = buildQuestionSpeechText({
    questionSv: 'Vad betyder demokrati?',
    options: [
      { id: 'a', textSv: 'Folkstyre', textEn: 'Rule by the people' },
      { id: 'b', textSv: 'Envälde', textEn: 'Autocracy' },
    ],
  });

  assert.equal(text, 'Vad betyder demokrati? Alternativ A. Folkstyre. Alternativ B. Envälde.');
});
