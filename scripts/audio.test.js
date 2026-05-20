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

function loadTs(relativePath, options = {}) {
  const filePath = path.resolve(repoRoot, relativePath);
  const cacheKey = `${filePath}:${options.speechMock ? 'speech-mock' : 'default'}`;
  if (moduleCache.has(cacheKey)) return moduleCache.get(cacheKey);

  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  moduleCache.set(cacheKey, mod.exports);

  new Function('module', 'exports', 'require', output)(mod, mod.exports, (request) => {
    if (request === 'expo-speech') return options.speechMock || { speak() {}, stop() {} };
    if (request.startsWith('.')) {
      const resolvedPath = resolveLocalModule(filePath, request);
      return loadTs(path.relative(repoRoot, resolvedPath), options);
    }
    return require(request);
  });
  moduleCache.set(cacheKey, mod.exports);
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

test('buildQuestionSpeechText keeps source citation separate from spoken prompt', () => {
  const { buildQuestionSpeechText } = loadTs('lib/audio/speak.ts');
  const text = buildQuestionSpeechText({
    questionSv: 'Enligt UHR-materialet, ungefär hur långt sträcker sig Sverige?',
    options: [{ id: 'a', textSv: 'Cirka 1 600 kilometer', textEn: 'About 1,600 kilometres' }],
  });

  assert.equal(
    text,
    'Ungefär hur långt sträcker sig Sverige? Alternativ A. Cirka 1 600 kilometer.',
  );
});

test('buildAnswerFeedbackSpeechText reads selected answer, correction, and Swedish explanation', () => {
  const { buildAnswerFeedbackSpeechText } = loadTs('lib/audio/speak.ts');
  const text = buildAnswerFeedbackSpeechText(
    {
      questionSv: 'Var ligger Sverige?',
      correctOptionId: 'b',
      explanationSv: 'Sverige ligger i Norden och är en del av Europa.',
      options: [
        { id: 'a', textSv: 'I södra Europa', textEn: 'In southern Europe' },
        { id: 'b', textSv: 'I Norden i norra Europa', textEn: 'In the Nordic region' },
      ],
    },
    'a',
  );

  assert.equal(
    text,
    'Ditt svar: I södra Europa. Rätt svar: I Norden i norra Europa. Förklaring: Sverige ligger i Norden och är en del av Europa.',
  );
  assert.doesNotMatch(text, /UHR|Källa|Source/i);
});

test('buildAnswerFeedbackSpeechText keeps correct feedback concise', () => {
  const { buildAnswerFeedbackSpeechText } = loadTs('lib/audio/speak.ts');
  const text = buildAnswerFeedbackSpeechText(
    {
      questionSv: 'Vad betyder demokrati?',
      correctOptionId: 'a',
      explanationSv: 'Demokrati betyder folkstyre.',
      options: [
        { id: 'a', textSv: 'Folkstyre', textEn: 'Rule by the people' },
        { id: 'b', textSv: 'Envälde', textEn: 'Autocracy' },
      ],
    },
    'a',
  );

  assert.equal(text, 'Ditt svar: Folkstyre. Det är rätt. Förklaring: Demokrati betyder folkstyre.');
  assert.doesNotMatch(text, /Rätt svar: Folkstyre\. Rätt svar/);
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

test('practice and routed quiz screens honor audio settings for prompt and feedback playback', () => {
  const routeFiles = ['app/(tabs)/practice.tsx', 'app/quiz/[sessionId].tsx'];

  for (const routeFile of routeFiles) {
    const source = fs.readFileSync(path.join(repoRoot, routeFile), 'utf8');
    assert.match(source, /import\s+\{\s*AudioButton\s*\}\s+from ['"][^'"]+AudioButton['"]/);
    assert.match(
      source,
      /import\s+\{\s*FeedbackAudioButton\s*\}\s+from ['"][^'"]+FeedbackAudioButton['"]/,
    );
    assert.match(
      source,
      /import\s+\{\s*buildAnswerFeedbackSpeechText,\s*buildQuestionSpeechText\s*\}\s+from ['"][^'"]+lib\/audio\/speak['"]/,
    );
    assert.match(
      source,
      /const audioEnabled = useSettingsStore\(\(state\) => state\.audioEnabled\);/,
    );
    assert.match(
      source,
      /<AudioButton[\s\S]*enabled=\{audioEnabled\}[\s\S]*language=\{language\}[\s\S]*text=\{buildQuestionSpeechText\(question\)\}[\s\S]*\/>/,
    );
    assert.match(
      source,
      /<FeedbackAudioButton[\s\S]*enabled=\{audioEnabled\}[\s\S]*language=\{language\}[\s\S]*text=\{buildAnswerFeedbackSpeechText\(question, selectedOptionId\)\}[\s\S]*\/>/,
    );
  }
});

test('active mock exams do not render feedback audio controls', () => {
  const examSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');

  assert.doesNotMatch(examSource, /FeedbackAudioButton|buildAnswerFeedbackSpeechText/);
});
