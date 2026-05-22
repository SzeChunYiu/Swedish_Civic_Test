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
    getQuestionPrimarySourceCitation,
    getQuestionSourceCitation,
    getQuestionSupplementalSourceCitations,
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
    supplementalSources: [
      {
        title: 'Rösträtten i svenska val',
        publisher: 'Valmyndigheten',
        url: 'https://www.val.se/det-svenska-valsystemet/sa-funkar-rostning-i-svenska-val/rostratten-i-svenska-val',
        publishedDate: '2025-11-21',
        retrievedDate: '2026-05-22',
      },
    ],
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
    'Källa: Sverige i fokus, Landet Sverige, Geografi, klimat och natur, s. 5; Kompletterande källa: Rösträtten i svenska val, Valmyndigheten, publicerad 2025-11-21, hämtad 2026-05-22, https://www.val.se/det-svenska-valsystemet/sa-funkar-rostning-i-svenska-val/rostratten-i-svenska-val',
  );
  assert.equal(
    getQuestionSourceCitation(question, 'en'),
    'Source: Sverige i fokus, Landet Sverige, Geografi, klimat och natur, p. 5; Additional source: Rösträtten i svenska val, Valmyndigheten, published 2025-11-21, retrieved 2026-05-22, https://www.val.se/det-svenska-valsystemet/sa-funkar-rostning-i-svenska-val/rostratten-i-svenska-val',
  );
  assert.equal(
    getQuestionPrimarySourceCitation(question, 'en'),
    'Source: Sverige i fokus, Landet Sverige, Geografi, klimat och natur, p. 5',
  );
  assert.deepEqual(getQuestionSupplementalSourceCitations(question, 'en'), [
    {
      accessibilityLabel:
        'Additional source, Rösträtten i svenska val, Valmyndigheten, published 2025-11-21, retrieved 2026-05-22, https://www.val.se/det-svenska-valsystemet/sa-funkar-rostning-i-svenska-val/rostratten-i-svenska-val',
      label: 'Additional source',
      meta: 'Valmyndigheten, published 2025-11-21, retrieved 2026-05-22',
      publisher: 'Valmyndigheten',
      title: 'Rösträtten i svenska val',
      url: 'https://www.val.se/det-svenska-valsystemet/sa-funkar-rostning-i-svenska-val/rostratten-i-svenska-val',
    },
  ]);
  assert.equal(getQuestionSourceCitation(undefined, 'sv'), 'Källhänvisning saknas');
  assert.equal(getQuestionSourceCitation(undefined, 'en'), 'Source citation unavailable');
});

test('question text helper prefers locale maps and falls back through configured languages', () => {
  const {
    getQuestionDisplayText,
    getQuestionExplanationText,
    getQuestionOptionText,
    getQuestionTranslationText,
  } = loadTs('lib/quiz/questionText.ts');
  const question = {
    questionSv: 'Legacy svensk fråga?',
    questionEn: 'Legacy English question?',
    questionText: {
      sv: 'Ny svensk fråga?',
      en: 'New English question?',
      ar: 'سؤال عربي؟',
    },
    explanationSv: 'Gammal svensk förklaring.',
    explanationEn: 'Old English explanation.',
    explanationText: {
      sv: 'Ny svensk förklaring.',
      en: 'New English explanation.',
      ar: 'شرح عربي.',
    },
  };
  const option = {
    id: 'a',
    textSv: 'Gammalt svenskt svar',
    textEn: 'Old English answer',
    text: {
      sv: 'Nytt svenskt svar',
      en: 'New English answer',
      ar: 'إجابة عربية',
    },
  };

  assert.equal(getQuestionDisplayText(question, 'sv'), 'Ny svensk fråga?');
  assert.equal(getQuestionDisplayText(question, 'en'), 'New English question?');
  assert.equal(getQuestionDisplayText(question, 'ar'), 'سؤال عربي؟');
  assert.equal(getQuestionDisplayText(question, 'zh-Hans'), 'New English question?');
  assert.equal(getQuestionTranslationText(question, 'sv'), 'New English question?');
  assert.equal(getQuestionTranslationText(question, 'en'), 'Ny svensk fråga?');
  assert.equal(getQuestionExplanationText(question, 'ar', 'fallback'), 'شرح عربي.');
  assert.equal(
    getQuestionExplanationText(question, 'zh-Hant', 'fallback'),
    'New English explanation.',
  );
  assert.equal(getQuestionOptionText(option, 'sv'), 'Nytt svenskt svar');
  assert.equal(getQuestionOptionText(option, 'ar'), 'إجابة عربية');
  assert.equal(getQuestionOptionText(option, 'fa'), 'New English answer');
});
