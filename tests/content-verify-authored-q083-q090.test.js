const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const moduleCache = new Map();
const uhrSectionMap = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'content/uhr-section-map.json'), 'utf8'),
);
const uhrSectionsByChapterId = new Map(
  uhrSectionMap.chapters.map((chapter) => [chapter.id, new Set(chapter.sections)]),
);

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
  const filePath = path.join(repoRoot, relativePath);
  if (moduleCache.has(filePath)) {
    const cached = moduleCache.get(filePath);
    return exportName ? cached[exportName] : cached;
  }

  const output = ts.transpileModule(fs.readFileSync(filePath, 'utf8'), {
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

function textForQuestion(question) {
  return [
    question.questionSv,
    question.questionEn,
    question.explanationSv,
    question.explanationEn,
    ...question.options.flatMap((option) => [option.textSv, option.textEn]),
  ].join('\n');
}

const expectedAudits = {
  q083: {
    chapterId: 'ch10',
    section: 'Sverige blir ett invandrarland',
    pageApprox: 36,
    correctOptionId: 'a',
    required: [
      /miljonprogrammets mål/i,
      /Million Programme/i,
      /en miljon bostäder på tio år/i,
      /one million homes in ten years/i,
      /brist på bostäder/i,
      /housing shortage/i,
    ],
  },
  q084: {
    chapterId: 'ch10',
    section: 'Digital revolution och globalisering',
    pageApprox: 38,
    correctOptionId: 'a',
    required: [
      /digitala revolutionen/i,
      /digital revolution/i,
      /arbetar, studerar, kommunicerar och tar del av information/i,
      /work, study, communicate, and access information/i,
      /internationellt samarbete/i,
      /international cooperation/i,
    ],
  },
  q085: {
    chapterId: 'ch11',
    section: 'Nordiskt samarbete',
    pageApprox: 39,
    correctOptionId: 'a',
    required: [
      /Nordiska rådet och Nordiska ministerrådet/i,
      /Nordic Council and the Nordic Council of Ministers/i,
      /Danmark, Finland, Island och Norge/i,
      /Denmark, Finland, Iceland, and Norway/i,
    ],
  },
  q086: {
    chapterId: 'ch11',
    section: 'EU och Europarådet',
    pageApprox: 39,
    correctOptionId: 'b',
    required: [/Sverige medlem i EU/i, /Sweden become a member of the EU/i, /1995/],
  },
  q087: {
    chapterId: 'ch11',
    section: 'EU och Europarådet',
    pageApprox: 39,
    correctOptionId: 'a',
    required: [
      /EU:s fyra friheter/i,
      /EU's four freedoms/i,
      /studera, flytta, arbeta och sälja varor/i,
      /study, move, work, and sell goods/i,
    ],
  },
  q088: {
    chapterId: 'ch11',
    section: 'EU och Europarådet',
    pageApprox: 39,
    correctOptionId: 'a',
    required: [
      /Europarådet/i,
      /Council of Europe/i,
      /mänskliga rättigheter, demokrati och rättsstatens principer/i,
      /human rights, democracy, and rule-of-law principles/i,
      /Europadomstolen/i,
      /European Court of Human Rights/i,
    ],
  },
  q089: {
    chapterId: 'ch11',
    section: 'Globalt samarbete',
    pageApprox: 39,
    correctOptionId: 'a',
    required: [
      /Sida/i,
      /minska fattigdom och förtryck/i,
      /reduce poverty and oppression/i,
      /demokrati, jämställdhet, ekonomi och hållbara samhällen/i,
      /democracy, gender equality, the economy, and sustainable societies/i,
    ],
  },
  q090: {
    chapterId: 'ch11',
    section: 'Efter kalla krigets slut',
    pageApprox: 40,
    correctOptionId: 'a',
    required: [
      /Rysslands attack mot Ukraina 2022/i,
      /Russia's attack on Ukraine in 2022/i,
      /ansöka om medlemskap i Nato/i,
      /apply for NATO membership/i,
      /Sverige blev medlem 2024/i,
      /Sweden became a member in 2024/i,
    ],
  },
};

test('CONTENT-VERIFY q083-q090 pins UHR locators, answer keys, and bilingual facts', () => {
  const { additionalQuestions } = loadTs('data/additionalQuestions.ts');
  const questionsById = new Map(additionalQuestions.map((question) => [question.id, question]));

  for (const [id, expected] of Object.entries(expectedAudits)) {
    const question = questionsById.get(id);
    assert.ok(question, `${id} should exist in additionalQuestions`);

    assert.equal(question.chapterId, expected.chapterId, `${id} chapterId`);
    assert.equal(question.reviewStatus, 'reviewed', `${id} reviewStatus`);
    assert.equal(question.type, 'single_choice', `${id} type`);
    assert.equal(question.options.length, 4, `${id} option count`);
    assert.equal(question.correctOptionId, expected.correctOptionId, `${id} correct answer`);
    assert.equal(question.supplementalSources, undefined, `${id} should stay UHR-only`);
    assert.deepEqual(
      question.uhrReference,
      {
        chapter:
          expected.chapterId === 'ch10' ? 'Sveriges moderna historia' : 'Sverige och omvärlden',
        section: expected.section,
        pageApprox: expected.pageApprox,
      },
      `${id} UHR reference`,
    );
    assert.ok(
      uhrSectionsByChapterId.get(expected.chapterId)?.has(expected.section),
      `${id} UHR section should exist in content/uhr-section-map.json`,
    );

    const correctOption = question.options.find((option) => option.id === question.correctOptionId);
    assert.ok(correctOption?.textSv, `${id} correct option has Swedish text`);
    assert.ok(correctOption?.textEn, `${id} correct option has English text`);

    const combinedText = textForQuestion(question);
    assert.doesNotMatch(
      combinedText,
      /\b(?:Sant eller falskt|True or false)\s*:/i,
      `${id} should not include redundant true/false UI prefixes`,
    );
    assert.doesNotMatch(
      combinedText,
      /\b(?:Enligt UHR-materialet|According to the UHR material)\b/i,
      `${id} should cite UHR through metadata, not source-authority stem phrasing`,
    );

    for (const pattern of expected.required) {
      assert.match(combinedText, pattern, `${id} preserves audited fact ${pattern}`);
    }
  }
});
