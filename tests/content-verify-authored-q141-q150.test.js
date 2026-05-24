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

const { additionalQuestions } = loadTs('data/additionalQuestions.ts');

function byId(id) {
  const question = additionalQuestions.find((candidate) => candidate.id === id);
  assert.ok(question, `${id} should exist in additionalQuestions`);
  return question;
}

function textFor(question) {
  return [
    question.questionSv,
    question.questionEn,
    question.explanationSv,
    question.explanationEn,
    ...question.options.flatMap((option) => [option.textSv, option.textEn]),
  ].join('\n');
}

const expectedRows = [
  {
    answerEn: 'Special saffron Lucia buns',
    answerSv: 'Särskilda lussebullar med saffran',
    chapter: 'Traditioner och högtider',
    chapterId: 'ch13',
    id: 'q141',
    pageApprox: 47,
    required: [/Lucia Day/i, /13 December/i, /saffron Lucia buns/i, /Midsummer/i, /Easter/i],
    section: 'Lucia',
  },
  {
    answerEn: 'About 250,000',
    answerSv: 'Cirka 250 000',
    chapter: 'Landet Sverige',
    chapterId: 'ch01',
    id: 'q142',
    pageApprox: 6,
    required: [/250,000 islands/i, /more than any other country/i, /25 000/i],
    section: 'Skogar, sjöar och öar',
  },
  {
    answerEn: 'True',
    answerSv: 'Sant',
    chapter: 'Landet Sverige',
    chapterId: 'ch01',
    id: 'q143',
    pageApprox: 6,
    required: [/Götaland/i, /Svealand/i, /Norrland/i, /more than half/i],
    section: 'Sveriges indelning',
  },
  {
    answerEn: '25 historical provinces',
    answerSv: '25 landskap',
    chapter: 'Landet Sverige',
    chapterId: 'ch01',
    id: 'q144',
    pageApprox: 6,
    required: [/25 historical provinces/i, /own laws/i, /21 refers to counties/i, /290/i],
    section: 'Sveriges indelning',
  },
  {
    answerEn: 'No one has to reveal how they vote',
    answerSv: 'Att väljare inte behöver avslöja hur de röstar',
    chapter: 'Sveriges demokratiska system',
    chapterId: 'ch02',
    id: 'q145',
    pageApprox: 10,
    required: [
      /Secret elections/i,
      /reveal how they vote/i,
      /threats and coercion/i,
      /free elections/i,
    ],
    section: 'Demokrati betyder folkstyre',
  },
  {
    answerEn: 'To try to persuade others of their political ideas',
    answerSv: 'Att försöka övertyga andra om sina politiska idéer',
    chapter: 'Sveriges demokratiska system',
    chapterId: 'ch02',
    id: 'q146',
    pageApprox: 10,
    required: [/persuade others/i, /political ideas/i, /freedom of expression/i],
    section: 'Demokrati betyder folkstyre',
  },
  {
    answerEn: 'Many people voting, getting involved, and learning about social issues',
    answerSv: 'Att många röstar, engagerar sig och skaffar kunskap om samhällsfrågor',
    chapter: 'Sveriges demokratiska system',
    chapterId: 'ch02',
    id: 'q147',
    pageApprox: 10,
    required: [
      /Democracy becomes stronger/i,
      /vote/i,
      /get involved/i,
      /learn about social issues/i,
    ],
    section: 'En stark demokrati',
  },
  {
    answerEn: 'It can create conflicts and scare people away from democratic debate',
    answerSv: 'Det kan skapa konflikter och skrämma människor från demokratisk debatt',
    chapter: 'Sveriges demokratiska system',
    chapterId: 'ch02',
    id: 'q148',
    pageApprox: 11,
    required: [/False information and hate/i, /create conflicts/i, /politicians/i, /journalists/i],
    section: 'Hot mot demokratin',
  },
  {
    answerEn:
      'People with different backgrounds and economic situations living closer to one another and feeling included',
    answerSv:
      'Att människor med olika bakgrund och ekonomiska villkor lever närmare varandra och känner sig delaktiga',
    chapter: 'Sveriges demokratiska system',
    chapterId: 'ch02',
    id: 'q149',
    pageApprox: 11,
    required: [
      /Integration means/i,
      /different backgrounds/i,
      /economic situations/i,
      /segregation/i,
    ],
    section: 'Segregation och integration',
  },
  {
    answerEn: 'They sell advertising space or charge for a specific channel',
    answerSv: 'De säljer reklamplats eller tar betalt för en särskild kanal',
    chapter: 'Mediernas roll',
    chapterId: 'ch06',
    id: 'q150',
    pageApprox: 21,
    required: [/Commercial radio and TV/i, /advertising space/i, /specific TV channel/i],
    section: 'Olika slags medier',
  },
];

test('CONTENT-VERIFY q141-q150 pins UHR locators, answers, and key explanation facts', () => {
  for (const expected of expectedRows) {
    const question = byId(expected.id);
    const correctOption = question.options.find((option) => option.id === question.correctOptionId);
    const allText = textFor(question);

    assert.equal(question.reviewStatus, 'reviewed', `${expected.id} review status`);
    assert.equal(question.chapterId, expected.chapterId, `${expected.id} chapter id`);
    assert.equal(question.uhrReference.chapter, expected.chapter, `${expected.id} UHR chapter`);
    assert.equal(question.uhrReference.section, expected.section, `${expected.id} UHR section`);
    assert.equal(question.uhrReference.pageApprox, expected.pageApprox, `${expected.id} UHR page`);
    assert.equal(correctOption?.textSv, expected.answerSv, `${expected.id} correct Swedish answer`);
    assert.equal(correctOption?.textEn, expected.answerEn, `${expected.id} correct English answer`);
    assert.doesNotMatch(allText, /Sant eller falskt:|True or false:/i);
    assert.doesNotMatch(allText, /Enligt UHR|According to UHR/i);

    for (const pattern of expected.required) {
      assert.match(allText, pattern, `${expected.id} includes ${pattern}`);
    }
  }
});
