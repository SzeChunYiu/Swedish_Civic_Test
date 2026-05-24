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
  const filePath = path.join(repoRoot, relativePath);
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

const expectedRows = [
  {
    id: 'q061',
    chapterId: 'ch07',
    chapter: 'Mänskliga rättigheter',
    section: 'Arbetet mot diskriminering',
    page: 26,
    correct: [
      'a',
      'Att arbeta för allas lika rättigheter och se till att diskrimineringslagen följs',
      'To work for equal rights for everyone and make sure the Discrimination Act is followed',
    ],
    terms: ['Diskrimineringsombudsmannen', 'Equality Ombudsman', 'diskrimineringslagen', 'Discrimination Act'],
  },
  {
    id: 'q062',
    chapterId: 'ch08',
    chapter: 'Arbetsmarknad och privatekonomi',
    section: 'Så fungerar arbetsmarknaden',
    page: 27,
    correct: [
      'a',
      'Tjänster och verksamheter som staten, regionerna och kommunerna ansvarar för och finansierar med skatter',
      'Services and activities that the state, regions, and municipalities are responsible for and fund through taxes',
    ],
    terms: ['offentlig sektor', 'public sector', 'skatter', 'taxes'],
  },
  {
    id: 'q063',
    chapterId: 'ch08',
    chapter: 'Arbetsmarknad och privatekonomi',
    section: 'Så fungerar arbetsmarknaden',
    page: 27,
    correct: ['c', 'Cirka 70 procent', 'About 70 percent'],
    terms: ['Cirka 70 procent', 'About 70 percent', 'privat sektor', 'private sector'],
  },
  {
    id: 'q064',
    chapterId: 'ch08',
    chapter: 'Arbetsmarknad och privatekonomi',
    section: 'Arbetsmarknadens parter',
    page: 28,
    correct: [
      'a',
      'De företräder arbetstagare, förhandlar om löner och kan hjälpa medlemmar',
      'They represent employees, negotiate wages, and can help members',
    ],
    terms: ['Fackförbund', 'Trade unions', 'arbetsgivare', 'employers'],
  },
  {
    id: 'q065',
    chapterId: 'ch08',
    chapter: 'Arbetsmarknad och privatekonomi',
    section: 'Arbetsmarknadens parter',
    page: 28,
    correct: [
      'a',
      'Genom förhandlingar mellan arbetsmarknadens parter',
      'Through negotiations between labour-market parties',
    ],
    terms: ['kollektivavtal', 'collective agreements', 'arbetsmarknadens parter', 'labour-market parties'],
  },
  {
    id: 'q066',
    chapterId: 'ch08',
    chapter: 'Arbetsmarknad och privatekonomi',
    section: 'Lagar och regler på arbetsmarknaden',
    page: 29,
    correct: [
      'a',
      'För att skydda anställdas rättigheter och bidra till en trygg arbetsmiljö',
      'To protect employees’ rights and help create a safe work environment',
    ],
    terms: ['arbetstider', 'working hours', 'semester', 'vacation'],
  },
  {
    id: 'q067',
    chapterId: 'ch08',
    chapter: 'Arbetsmarknad och privatekonomi',
    section: 'A-kassan',
    page: 29,
    correct: [
      'a',
      'Den kan betala ut arbetslöshetsersättning till medlemmar',
      'It can pay unemployment benefits to members',
    ],
    terms: ['Arbetslöshetsförsäkringen', 'Unemployment insurance', 'aktivt arbetssökande', 'active job seeking'],
  },
  {
    id: 'q068',
    chapterId: 'ch08',
    chapter: 'Arbetsmarknad och privatekonomi',
    section: 'Privatekonomi i Sverige',
    page: 29,
    correct: [
      'a',
      'Den ser till att skulder blir betalda och kan hjälpa till med skuldsanering',
      'It makes sure debts are paid and can help with debt restructuring',
    ],
    terms: ['Kronofogdemyndigheten', 'Swedish Enforcement Authority', 'skuldsanering', 'debt restructuring'],
  },
  {
    id: 'q069',
    chapterId: 'ch09',
    chapter: 'Välfärdssamhället',
    section: 'Skatter för Sveriges välfärd',
    page: 30,
    correct: [
      'a',
      'De gör att många tjänster kan finansieras gemensamt',
      'They make it possible to finance many services collectively',
    ],
    terms: ['skola', 'schools', 'sjukvård', 'health care'],
  },
  {
    id: 'q070',
    chapterId: 'ch09',
    chapter: 'Välfärdssamhället',
    section: 'Skatter för Sveriges välfärd',
    page: 30,
    correct: [
      'a',
      'Både personer som arbetar och företag betalar skatt i Sverige',
      'Both people who work and companies pay tax in Sweden',
    ],
    terms: ['personer som arbetar', 'people who work', 'företag', 'companies'],
  },
];

test('CONTENT-VERIFY q061-q070 pins UHR-backed labour-market and welfare source facts', () => {
  const { questions, sourceQuestions } = loadTs('data/questions.ts');
  const byId = new Map(sourceQuestions.map((question) => [question.id, question]));
  const publishedById = new Map(questions.map((question) => [question.id, question]));

  for (const expected of expectedRows) {
    const question = byId.get(expected.id);
    const publishedQuestion = publishedById.get(expected.id);
    assert.ok(question, `${expected.id} should exist in sourceQuestions`);
    assert.ok(publishedQuestion, `${expected.id} should exist in published questions`);
    assert.equal(question.chapterId, expected.chapterId);
    assert.equal(question.type, 'single_choice');
    assert.equal(question.reviewStatus, 'published');
    assert.deepEqual(publishedQuestion.uhrReference, question.uhrReference);
    assert.equal(question.uhrReference.chapter, expected.chapter);
    assert.equal(question.uhrReference.section, expected.section);
    assert.equal(question.uhrReference.pageApprox, expected.page);
    assert.equal(question.correctOptionId, expected.correct[0]);

    const correctOption = question.options.find((option) => option.id === question.correctOptionId);
    assert.ok(correctOption, `${expected.id} should have a correct option`);
    assert.equal(correctOption.textSv, expected.correct[1]);
    assert.equal(correctOption.textEn, expected.correct[2]);

    const learnerText = [
      question.questionSv,
      question.questionEn,
      question.explanationSv,
      question.explanationEn,
      ...question.options.flatMap((option) => [option.textSv, option.textEn]),
    ].join('\n');

    assert.doesNotMatch(learnerText, /\b(?:Sant eller falskt|True or false|Enligt UHR|According to UHR)\b/);
    for (const term of expected.terms) {
      assert.match(learnerText, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
});
