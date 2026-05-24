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

const expectedQuestions = {
  q041: {
    chapterId: 'ch05',
    type: 'single_choice',
    section: 'Rättssäkerhet',
    pageApprox: 17,
    correctOptionId: 'a',
    answerSv: 'Domstolarna är oberoende',
    answerEn: 'Courts are independent',
    explanationTerms: ['lika inför lagen', 'fair trial', 'appeal a judgment'],
  },
  q042: {
    chapterId: 'ch05',
    type: 'single_choice',
    section: 'Domstolar',
    pageApprox: 18,
    correctOptionId: 'a',
    answerSv: 'oskyldig tills personen har dömts',
    answerEn: 'innocent until the person has been convicted',
    explanationTerms: ['överklagas till en högre domstol', 'appealed to a higher court'],
  },
  q043: {
    chapterId: 'ch05',
    type: 'single_choice',
    section: 'Polisen',
    pageApprox: 18,
    correctOptionId: 'a',
    answerSv: 'upprätthålla lag och ordning',
    answerEn: 'maintain law and order',
    explanationTerms: ['förebygga och utreda brott', 'prevent and investigate crimes'],
  },
  q044: {
    chapterId: 'ch05',
    type: 'single_choice',
    section: 'Straffmyndighet och belastningsregister',
    pageApprox: 19,
    correctOptionId: 'b',
    answerSv: '15 år',
    answerEn: '15 years',
    explanationTerms: ['1 kap. 6 § brottsbalken', 'Proposition 2025/26:246', '2 August 2026'],
    supplementalSources: [
      'Brottsbalk (1962:700), 1 kap. 6 §',
      'Prop. 2025/26:246 Skärpta regler för unga lagöverträdare',
    ],
  },
  q045: {
    chapterId: 'ch06',
    type: 'single_choice',
    section: 'Fria medier',
    pageApprox: 20,
    correctOptionId: 'a',
    answerSv: 'informera, möjliggöra samhällsdebatt',
    answerEn: 'inform, enable public debate',
    explanationTerms: ['granska politiker', 'scrutinize politicians'],
  },
  q046: {
    chapterId: 'ch06',
    type: 'single_choice',
    section: 'Fria medier',
    pageApprox: 20,
    correctOptionId: 'a',
    answerSv: 'allmänna handlingar kan begäras ut',
    answerEn: 'public documents to be requested',
    explanationTerms: ['Offentlighetsprincipen', 'public documents held by authorities'],
  },
  q047: {
    chapterId: 'ch06',
    type: 'true_false',
    section: 'Fria medier',
    pageApprox: 20,
    correctOptionId: 'true',
    answerSv: 'Sant',
    answerEn: 'True',
    explanationTerms: ['rätt att vara anonym', 'right to remain anonymous'],
  },
  q048: {
    chapterId: 'ch06',
    type: 'single_choice',
    section: 'Public service',
    pageApprox: 21,
    correctOptionId: 'a',
    answerSv: 'Sveriges Radio (SR), Sveriges Television (SVT) och Utbildningsradion (UR)',
    answerEn:
      'Swedish Radio (SR), Swedish Television (SVT), and Swedish Educational Broadcasting Company (UR)',
    explanationTerms: ['finansieras genom en avgift', 'fee collected through the tax system'],
  },
  q049: {
    chapterId: 'ch06',
    type: 'true_false',
    section: 'Public service',
    pageApprox: 21,
    correctOptionId: 'true',
    answerSv: 'Sant',
    answerEn: 'True',
    explanationTerms: ['oberoende av politiska och andra intressen', 'without taking sides'],
  },
  q050: {
    chapterId: 'ch06',
    type: 'single_choice',
    section: 'Källkritik',
    pageApprox: 21,
    correctOptionId: 'a',
    answerSv: 'ifrågasätta och kontrollera',
    answerEn: 'Questioning and checking',
    explanationTerms: [
      'falska uppgifter kan spridas snabbt',
      'false information can spread quickly',
    ],
  },
};

test('CONTENT-VERIFY q041-q050 keeps audited UHR-backed facts, answers, and sources', () => {
  const { additionalQuestions } = loadTs('data/additionalQuestions.ts');
  const byId = new Map(additionalQuestions.map((question) => [question.id, question]));

  for (const [id, expected] of Object.entries(expectedQuestions)) {
    const question = byId.get(id);
    assert.ok(question, `${id} should exist in authored source questions`);
    assert.equal(question.chapterId, expected.chapterId, `${id} chapterId drifted`);
    assert.equal(question.type, expected.type, `${id} type drifted`);
    assert.equal(question.reviewStatus, 'reviewed', `${id} reviewStatus drifted`);
    assert.equal(
      question.uhrReference.chapter,
      expected.chapterId === 'ch05' ? 'Lag och rätt' : 'Mediernas roll',
    );
    assert.equal(question.uhrReference.section, expected.section, `${id} UHR section drifted`);
    assert.equal(question.uhrReference.pageApprox, expected.pageApprox, `${id} UHR page drifted`);
    assert.equal(question.correctOptionId, expected.correctOptionId, `${id} answer key drifted`);

    assert.doesNotMatch(
      question.questionSv,
      /^Sant eller falskt:/i,
      `${id} has UI prefix in Swedish stem`,
    );
    assert.doesNotMatch(
      question.questionEn,
      /^True or false:/i,
      `${id} has UI prefix in English stem`,
    );
    assert.doesNotMatch(
      question.questionSv,
      /Enligt UHR-materialet/i,
      `${id} has source-authority Swedish stem`,
    );
    assert.doesNotMatch(
      question.questionEn,
      /According to the UHR material/i,
      `${id} has source-authority English stem`,
    );

    const correctOption = question.options.find((option) => option.id === question.correctOptionId);
    assert.ok(correctOption, `${id} correct option should exist`);
    assert.match(
      correctOption.textSv,
      new RegExp(escapeRegExp(expected.answerSv)),
      `${id} Swedish correct answer drifted`,
    );
    assert.match(
      correctOption.textEn,
      new RegExp(escapeRegExp(expected.answerEn)),
      `${id} English correct answer drifted`,
    );

    const searchableText = `${question.questionSv}\n${question.questionEn}\n${question.explanationSv}\n${question.explanationEn}`;
    for (const term of expected.explanationTerms) {
      assert.match(
        searchableText,
        new RegExp(escapeRegExp(term)),
        `${id} missing audited term: ${term}`,
      );
    }

    if (expected.supplementalSources) {
      const titles = question.supplementalSources?.map((source) => source.title) ?? [];
      assert.deepEqual(
        titles,
        expected.supplementalSources,
        `${id} supplemental official sources drifted`,
      );
      for (const source of question.supplementalSources ?? []) {
        assert.match(
          source.url,
          /^https:\/\/(www\.)?(riksdagen|regeringen)\.se\//,
          `${id} supplemental source URL should be official`,
        );
        assert.match(
          source.retrievedDate,
          /^\d{4}-\d{2}-\d{2}$/,
          `${id} supplemental source retrievedDate should be explicit`,
        );
      }
    }
  }
});

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
