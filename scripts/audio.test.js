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

function createHookRuntime() {
  const hooks = [];
  const effects = [];
  let hookIndex = 0;
  let pendingEffects = [];

  const react = {
    useEffect(effect, deps) {
      const index = hookIndex;
      hookIndex += 1;
      const previous = effects[index];
      const changed =
        !previous ||
        !deps ||
        !previous.deps ||
        deps.length !== previous.deps.length ||
        deps.some((dep, depIndex) => !Object.is(dep, previous.deps[depIndex]));

      if (changed) pendingEffects.push({ deps, effect, index });
    },
    useRef(initialValue) {
      const index = hookIndex;
      hookIndex += 1;
      if (!hooks[index]) hooks[index] = { current: initialValue };
      return hooks[index];
    },
    useState(initialValue) {
      const index = hookIndex;
      hookIndex += 1;
      if (!hooks[index]) {
        hooks[index] = {
          value: typeof initialValue === 'function' ? initialValue() : initialValue,
        };
      }
      return [
        hooks[index].value,
        (nextValue) => {
          hooks[index].value =
            typeof nextValue === 'function' ? nextValue(hooks[index].value) : nextValue;
        },
      ];
    },
  };

  return {
    react,
    render(Component, props) {
      hookIndex = 0;
      pendingEffects = [];
      const element = Component(props);
      for (const pendingEffect of pendingEffects) {
        const previous = effects[pendingEffect.index];
        if (typeof previous?.cleanup === 'function') previous.cleanup();
        effects[pendingEffect.index] = {
          deps: pendingEffect.deps,
          cleanup: pendingEffect.effect(),
        };
      }
      return element;
    },
  };
}

function loadAudioControlComponent(relativePath, exportName, runtime, speechMock) {
  const filePath = path.resolve(repoRoot, relativePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const mod = { exports: {} };
  const jsxRuntime = {
    jsx(type, props) {
      return typeof type === 'function' ? type(props) : { props, type };
    },
    jsxs(type, props) {
      return typeof type === 'function' ? type(props) : { props, type };
    },
  };

  new Function('module', 'exports', 'require', output)(mod, mod.exports, (request) => {
    if (request === 'react') return runtime.react;
    if (request === 'react/jsx-runtime') return jsxRuntime;
    if (request === '../Button') {
      return {
        Button(props) {
          return { props, type: 'Button' };
        },
      };
    }
    if (request === '../../lib/audio/speak') return speechMock;
    throw new Error(`Unexpected ${relativePath} dependency in runtime audio fixture: ${request}`);
  });

  return mod.exports[exportName];
}

function mountAudioControl(relativePath, exportName, props) {
  const runtime = createHookRuntime();
  const speakCalls = [];
  const stopCalls = [];
  const speechMock = {
    speakSwedish(text, options) {
      speakCalls.push({ options, text });
    },
    stopSpeech() {
      stopCalls.push({ afterSpeakCalls: speakCalls.length });
    },
  };
  const Component = loadAudioControlComponent(relativePath, exportName, runtime, speechMock);
  let currentProps = props;
  let element = runtime.render(Component, currentProps);

  return {
    get element() {
      return element;
    },
    rerender(nextProps = currentProps) {
      currentProps = nextProps;
      element = runtime.render(Component, currentProps);
      return element;
    },
    speakCalls,
    stopCalls,
  };
}

function assertStaleSpeechCallbackCannotClearCurrentRun({
  callbackName,
  expectedPlayLabel,
  expectedStopLabel,
  exportName,
  relativePath,
}) {
  const control = mountAudioControl(relativePath, exportName, {
    enabled: true,
    language: 'en',
    rate: 1.3,
    text: '  Vad betyder demokrati?  ',
  });

  assert.equal(control.element.props.children, expectedPlayLabel);
  assert.equal(control.element.props.accessibilityState.busy, false);

  control.element.props.onPress();
  control.rerender();
  assert.equal(control.speakCalls.length, 1);
  assert.equal(control.speakCalls[0].text, 'Vad betyder demokrati?');
  assert.equal(control.speakCalls[0].options.rate, 1.3);
  assert.equal(control.element.props.children, expectedStopLabel);
  assert.equal(control.element.props.accessibilityState.busy, true);

  control.element.props.onPress();
  control.rerender();
  assert.equal(control.element.props.children, expectedPlayLabel);
  assert.equal(control.element.props.accessibilityState.busy, false);

  control.element.props.onPress();
  control.rerender();
  assert.equal(control.speakCalls.length, 2);
  assert.equal(control.element.props.children, expectedStopLabel);
  assert.equal(control.element.props.accessibilityState.busy, true);

  control.speakCalls[0].options[callbackName]();
  control.rerender();
  assert.equal(
    control.element.props.children,
    expectedStopLabel,
    `${exportName} must ignore stale ${callbackName} from an earlier playback run`,
  );
  assert.equal(control.element.props.accessibilityState.busy, true);

  control.speakCalls[1].options.onDone();
  control.rerender();
  assert.equal(control.element.props.children, expectedPlayLabel);
  assert.equal(control.element.props.accessibilityState.busy, false);
  assert.equal(control.stopCalls.length, 3);
}

function countMatches(source, pattern) {
  return source.match(pattern)?.length ?? 0;
}

function assertPracticeAudioAutoplaySingleton(source) {
  assert.equal(
    countMatches(source, /const hasSelectedAnswer =/g),
    1,
    'Practice must declare hasSelectedAnswer exactly once',
  );
  assert.equal(
    countMatches(source, /const questionSpeechText = useMemo\(/g),
    1,
    'Practice must declare questionSpeechText exactly once',
  );
  assert.equal(
    countMatches(source, /\buseQuestionAudioAutoplay\(\{/g),
    1,
    'Practice must call useQuestionAudioAutoplay exactly once',
  );
  assert.match(
    source,
    /questionKey:\s*question\s*\?\s*`practice:\$\{question\.id\}:\$\{shuffleSessionId\}`\s*:\s*null/,
    'Practice autoplay key must include question id and shuffle session id',
  );
  assert.doesNotMatch(
    source,
    /questionKey:\s*question\s*\?\s*`practice:\$\{question\.id\}`\s*:\s*null/,
    'Practice autoplay key must not fall back to the question id alone',
  );
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

test('buildAnswerFeedbackSpeechText stays silent until an answer is selected', () => {
  const { buildAnswerFeedbackSpeechText } = loadTs('lib/audio/speak.ts');
  const text = buildAnswerFeedbackSpeechText(
    {
      questionSv: 'Var ligger Sverige?',
      options: [{ id: 'a', textSv: 'I Norden', textEn: 'In the Nordic region' }],
      correctOptionId: 'a',
      explanationSv: 'Sverige ligger i Norden.',
    },
    null,
  );

  assert.equal(text, '');
});

test('buildAnswerFeedbackSpeechText speaks selected, correct, and explanation text', () => {
  const { buildAnswerFeedbackSpeechText } = loadTs('lib/audio/speak.ts');
  const text = buildAnswerFeedbackSpeechText(
    {
      questionSv: 'Var ligger Sverige?',
      options: [
        { id: 'a', textSv: 'I Norden i norra Europa', textEn: 'In northern Europe' },
        { id: 'b', textSv: 'I södra Europa', textEn: 'In southern Europe' },
      ],
      correctOptionId: 'a',
      explanationSv: 'Sverige ligger i Norden i norra Europa.',
    },
    'b',
  );

  assert.equal(
    text,
    'Du valde: I södra Europa. Det rätta svaret är: I Norden i norra Europa. Förklaring: Sverige ligger i Norden i norra Europa.',
  );
});

test('buildAnswerFeedbackSpeechText omits correct answer repetition for a correct selection', () => {
  const { buildAnswerFeedbackSpeechText } = loadTs('lib/audio/speak.ts');
  const text = buildAnswerFeedbackSpeechText(
    {
      questionSv: 'Var ligger Sverige?',
      options: [{ id: 'a', textSv: 'I Norden', textEn: 'In the Nordic region' }],
      correctOptionId: 'a',
      explanationSv: 'Sverige ligger i Norden.',
    },
    'a',
  );

  assert.equal(text, 'Du valde: I Norden. Det stämmer. Förklaring: Sverige ligger i Norden.');
});

test('buildAnswerFeedbackSpeechText keeps authority wording and source citations out of speech', () => {
  const { buildAnswerFeedbackSpeechText } = loadTs('lib/audio/speak.ts');
  const text = buildAnswerFeedbackSpeechText(
    {
      questionSv: 'Enligt UHR-materialet, var ligger Sverige?',
      options: [
        { id: 'a', textSv: 'I Norden', textEn: 'In the Nordic region' },
        { id: 'b', textSv: 'I Nordamerika', textEn: 'In North America' },
      ],
      correctOptionId: 'a',
      explanationSv:
        'Enligt UHR-materialet, Sverige ligger i Norden. Källa: Sverige i fokus, Landet Sverige, s. 5.',
    },
    'b',
  );

  assert.equal(
    text,
    'Du valde: I Nordamerika. Det rätta svaret är: I Norden. Förklaring: Sverige ligger i Norden.',
  );
  assert.doesNotMatch(text, /UHR|Källa|Source|Sverige i fokus|s\. 5/i);
});

test('speech text builders ignore malformed runtime data', () => {
  const { buildAnswerFeedbackSpeechText, buildQuestionSpeechText } = loadTs('lib/audio/speak.ts');

  assert.doesNotThrow(() => buildQuestionSpeechText(null));
  assert.doesNotThrow(() =>
    buildQuestionSpeechText({
      questionSv: null,
      options: [
        null,
        { id: 'a', textSv: null, textEn: null },
        { id: 'b', textSv: 'Sverige', textEn: 'Sweden' },
      ],
    }),
  );

  const questionSpeech = buildQuestionSpeechText({
    questionSv: null,
    options: [
      null,
      { id: 'a', textSv: null, textEn: null },
      { id: 'b', textSv: 'Sverige', textEn: 'Sweden' },
    ],
  });
  const feedbackSpeech = buildAnswerFeedbackSpeechText(
    {
      correctOptionId: 'a',
      explanationSv: null,
    },
    'b',
  );

  assert.match(questionSpeech, /Sverige/);
  assert.doesNotMatch(`${questionSpeech} ${feedbackSpeech}`, /\b(?:null|undefined)\b/i);
  assert.match(feedbackSpeech, /Du valde: det valda svaret\./);
});

test('speech helpers do not crash when the platform speech engine is unavailable', () => {
  moduleCache.clear();
  const warnings = [];
  const onErrorCalls = [];
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

    assert.doesNotThrow(() =>
      speakSwedish('Hej Sverige', {
        onError(error) {
          onErrorCalls.push(error);
        },
      }),
    );
    assert.doesNotThrow(() =>
      speakSwedish('   ', {
        onError(error) {
          onErrorCalls.push(error);
        },
      }),
    );
    assert.doesNotThrow(() => stopSpeech());
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(warnings.length, 2);
  assert.match(warnings[0], /Speech unavailable/i);
  assert.match(warnings[1], /Speech stop unavailable/i);
  assert.equal(onErrorCalls.length, 1);
  assert.ok(onErrorCalls[0] instanceof Error);
  assert.equal(onErrorCalls[0].message, 'speech unavailable');
});

test('speakSwedish ignores malformed text, rates, callbacks, and options', () => {
  moduleCache.clear();
  const speakCalls = [];
  const { speakSwedish } = loadTs('lib/audio/speak.ts', {
    speechMock: {
      speak(text, options) {
        speakCalls.push({ text, options });
      },
      stop() {},
    },
  });

  assert.doesNotThrow(() => speakSwedish(null));
  assert.doesNotThrow(() => speakSwedish(undefined));
  assert.doesNotThrow(() => speakSwedish(123));
  assert.doesNotThrow(() => speakSwedish('Hej Sverige', null));
  speakSwedish('Hej snabbt', { rate: 99 });
  speakSwedish('Hej igen', {
    rate: Infinity,
    onDone: 'not-a-function',
    onError: 'not-a-function',
    onStopped: 'not-a-function',
  });

  assert.equal(speakCalls.length, 3);
  assert.equal(speakCalls[0].text, 'Hej Sverige');
  assert.equal(speakCalls[0].options.language, 'sv-SE');
  assert.equal(speakCalls[1].text, 'Hej snabbt');
  assert.equal(speakCalls[1].options.rate, 2);
  assert.equal(speakCalls[2].text, 'Hej igen');
  assert.equal(Object.hasOwn(speakCalls[2].options, 'rate'), false);
  assert.equal(speakCalls[2].options.onDone, undefined);
  assert.equal(speakCalls[2].options.onError, undefined);
  assert.equal(speakCalls[2].options.onStopped, undefined);
});

test('speakSwedish forwards lifecycle callbacks to Expo Speech', () => {
  moduleCache.clear();
  const speakCalls = [];
  const callbacks = {
    onDone() {},
    onError() {},
    onStopped() {},
  };
  const { speakSwedish } = loadTs('lib/audio/speak.ts', {
    speechMock: {
      speak(text, options) {
        speakCalls.push({ text, options });
      },
      stop() {},
    },
  });

  speakSwedish(' Hej Sverige ', { rate: 1.25, ...callbacks });

  assert.equal(speakCalls.length, 1);
  assert.equal(speakCalls[0].text, 'Hej Sverige');
  assert.equal(speakCalls[0].options.language, 'sv-SE');
  assert.equal(speakCalls[0].options.rate, 1.25);
  assert.equal(speakCalls[0].options.onDone, callbacks.onDone);
  assert.equal(speakCalls[0].options.onError, callbacks.onError);
  assert.equal(speakCalls[0].options.onStopped, callbacks.onStopped);
});

test('AudioButton ignores stale speech callbacks after a newer playback run starts', () => {
  for (const callbackName of ['onDone', 'onError', 'onStopped']) {
    assertStaleSpeechCallbackCannotClearCurrentRun({
      callbackName,
      expectedPlayLabel: 'Listen to the Swedish question and answers',
      expectedStopLabel: 'Stop question audio',
      exportName: 'AudioButton',
      relativePath: 'components/learning/AudioButton.tsx',
    });
  }
});

test('FeedbackAudioButton ignores stale speech callbacks after a newer playback run starts', () => {
  for (const callbackName of ['onDone', 'onError', 'onStopped']) {
    assertStaleSpeechCallbackCannotClearCurrentRun({
      callbackName,
      expectedPlayLabel: 'Listen to feedback',
      expectedStopLabel: 'Stop feedback',
      exportName: 'FeedbackAudioButton',
      relativePath: 'components/learning/FeedbackAudioButton.tsx',
    });
  }
});

test('question and feedback audio buttons guard stale speech callbacks by playback run', () => {
  const audioSource = fs.readFileSync(
    path.join(repoRoot, 'components/learning/AudioButton.tsx'),
    'utf8',
  );
  const feedbackSource = fs.readFileSync(
    path.join(repoRoot, 'components/learning/FeedbackAudioButton.tsx'),
    'utf8',
  );

  for (const [label, source] of [
    ['AudioButton', audioSource],
    ['FeedbackAudioButton', feedbackSource],
  ]) {
    assert.match(source, /import \{ useEffect, useRef, useState \} from 'react';/);
    assert.match(source, /const playbackRunRef = useRef\(0\);/);
    assert.match(source, /const previousSpeechTextRef = useRef<string \| null>\(null\);/);
    assert.match(
      source,
      /const clearSpeakingForRun = \(runId: number\) => \{[\s\S]*playbackRunRef\.current === runId[\s\S]*setIsSpeaking\(false\);/,
      `${label} should ignore callbacks from stale runs`,
    );
    assert.match(
      source,
      /previousSpeechTextRef\.current = speechText;[\s\S]*playbackRunRef\.current \+= 1;[\s\S]*stopSpeech\(\);[\s\S]*setIsSpeaking\(false\);/,
      `${label} should invalidate playback when text changes`,
    );
    assert.match(
      source,
      /if \(!canPlayAudio && isSpeaking\) \{[\s\S]*playbackRunRef\.current \+= 1;[\s\S]*stopSpeech\(\);[\s\S]*setIsSpeaking\(false\);/,
      `${label} should invalidate playback when disabled or text disappears`,
    );
    assert.match(
      source,
      /if \(isSpeaking\) \{[\s\S]*playbackRunRef\.current \+= 1;[\s\S]*stopSpeech\(\);[\s\S]*setIsSpeaking\(false\);[\s\S]*return;/,
      `${label} should invalidate playback before manual stop`,
    );
    assert.match(
      source,
      /const runId = playbackRunRef\.current \+ 1;[\s\S]*playbackRunRef\.current = runId;[\s\S]*stopSpeech\(\);[\s\S]*setIsSpeaking\(true\);[\s\S]*speakSwedish\(speechText, \{[\s\S]*onDone: \(\) => clearSpeakingForRun\(runId\),[\s\S]*onError: \(\) => clearSpeakingForRun\(runId\),[\s\S]*onStopped: \(\) => clearSpeakingForRun\(runId\),/,
      `${label} should guard every speech lifecycle callback with the active run id`,
    );
    assert.match(
      source,
      /return \(\) => \{[\s\S]*playbackRunRef\.current \+= 1;[\s\S]*stopSpeech\(\);[\s\S]*\};[\s\S]*\}, \[\]\);/,
      `${label} should invalidate playback before unmount cleanup`,
    );
  }
});

test('question audio autoplay gate is opt-in and stop-aware', () => {
  moduleCache.clear();
  const { shouldAutoplayQuestionAudio } = loadTs('lib/audio/questionAudioAutoplay.ts');
  const base = {
    audioEnabled: true,
    listenFirstAudioEnabled: true,
    questionKey: 'practice:q001',
    speechText: 'Var ligger Sverige?',
  };

  assert.equal(shouldAutoplayQuestionAudio(base), true);
  assert.equal(shouldAutoplayQuestionAudio({ ...base, audioEnabled: false }), false);
  assert.equal(shouldAutoplayQuestionAudio({ ...base, listenFirstAudioEnabled: false }), false);
  assert.equal(shouldAutoplayQuestionAudio({ ...base, questionKey: null }), false);
  assert.equal(shouldAutoplayQuestionAudio({ ...base, speechText: '   ' }), false);
  assert.equal(shouldAutoplayQuestionAudio({ ...base, speechText: null }), false);
  assert.equal(shouldAutoplayQuestionAudio({ ...base, stopSignal: true }), false);
  assert.equal(shouldAutoplayQuestionAudio({ ...base, suppressAutoplay: true }), false);
});

test('practice and routed quiz screens honor the persisted audio setting', () => {
  const routeFiles = ['app/(tabs)/practice.tsx', 'app/quiz/[sessionId].tsx'];

  for (const routeFile of routeFiles) {
    const source = fs.readFileSync(path.join(repoRoot, routeFile), 'utf8');
    assert.match(source, /import\s+\{\s*AudioButton\s*\}\s+from ['"][^'"]+AudioButton['"]/);
    assert.match(
      source,
      /import\s+\{\s*useQuestionAudioAutoplay\s*\}\s+from ['"][^'"]+questionAudioAutoplay['"]/,
    );
    assert.match(
      source,
      /import\s+\{[^}]*buildQuestionSpeechText[^}]*\}\s+from ['"][^'"]+lib\/audio\/speak['"]/,
    );
    assert.match(
      source,
      /const audioEnabled = useSettingsStore\(\(state\) => state\.audioEnabled\);/,
    );
    assert.match(
      source,
      /<AudioButton[\s\S]*enabled=\{audioEnabled\}[\s\S]*language=\{language\}[\s\S]*rate=\{audioPlaybackRate\}[\s\S]*text=\{questionSpeechText\}[\s\S]*\/>/,
    );
    assert.match(source, /const audioPlaybackRate = useAccessibilityStore/);
    assert.match(source, /\(state\) => state\.listenFirstAudioEnabled\)?[,)]/);
    assert.match(source, /useQuestionAudioAutoplay\(\{/);
  }

  const practiceSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/practice.tsx'), 'utf8');
  assertPracticeAudioAutoplaySingleton(practiceSource);
});
