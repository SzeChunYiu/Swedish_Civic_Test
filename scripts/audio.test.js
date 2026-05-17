const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function loadTs(relativePath, options = {}) {
  const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', output)(mod, mod.exports, (request) => {
    if (request === 'expo-speech') return options.speechMock || { speak() {}, stop() {} };
    return require(request);
  });
  return mod.exports;
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

test('speech helpers do not crash when the platform speech engine is unavailable', () => {
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args.join(' '));
  try {
    const { speakSwedish, stopSpeech } = loadTs('lib/audio/speak.ts', {
      speechMock: {
        speak() {
          throw new Error('speech unavailable');
        },
        stop() {
          throw new Error('speech stop unavailable');
        },
      },
    });

    assert.doesNotThrow(() => speakSwedish('Hej Sverige'));
    assert.doesNotThrow(() => stopSpeech());
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(warnings.length, 2);
  assert.match(warnings[0], /Speech unavailable/i);
  assert.match(warnings[1], /Speech stop unavailable/i);
});

test('practice and routed quiz screens honor the persisted audio setting', () => {
  const routeFiles = ['app/(tabs)/practice.tsx', 'app/quiz/[sessionId].tsx'];

  for (const routeFile of routeFiles) {
    const source = fs.readFileSync(path.join(repoRoot, routeFile), 'utf8');
    assert.match(source, /import\s+\{\s*AudioButton\s*\}\s+from ['"][^'"]+AudioButton['"]/);
    assert.match(
      source,
      /import\s+\{\s*buildQuestionSpeechText\s*\}\s+from ['"][^'"]+lib\/audio\/speak['"]/,
    );
    assert.match(
      source,
      /const audioEnabled = useSettingsStore\(\(state\) => state\.audioEnabled\);/,
    );
    assert.match(
      source,
      /<AudioButton\s+text=\{buildQuestionSpeechText\(question\)\}\s+enabled=\{audioEnabled\}\s+\/>/,
    );
  }
});
