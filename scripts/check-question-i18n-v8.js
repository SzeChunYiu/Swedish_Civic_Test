#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
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

const localeCodes = loadTs('lib/i18n/locales.ts', 'localeCodes');
const QUESTION_LOCALIZATION_PILOT_IDS = loadTs(
  'data/questionLocalizations.ts',
  'QUESTION_LOCALIZATION_PILOT_IDS',
);
const REQUIRED_LOCALES = [...localeCodes];

function checkLocalizedMap(map, path, errors) {
  for (const locale of REQUIRED_LOCALES) {
    if (!map || typeof map[locale] !== 'string' || map[locale].trim() === '') {
      errors.push(`${path}.${locale} missing`);
    }
  }
}

function checkQuestions(questions, ids = QUESTION_LOCALIZATION_PILOT_IDS) {
  const errors = [];
  const questionById = new Map(questions.map((question) => [question.id, question]));

  for (const id of ids) {
    const q = questionById.get(id);
    if (!q) {
      errors.push(`${id} missing`);
      continue;
    }

    checkLocalizedMap(
      Object.assign({ sv: q.questionSv, en: q.questionEn }, q.questionText || {}),
      `${q.id}.questionText`,
      errors,
    );
    checkLocalizedMap(
      Object.assign({ sv: q.explanationSv, en: q.explanationEn }, q.explanationText || {}),
      `${q.id}.explanationText`,
      errors,
    );

    const optionIds = new Set();
    for (const opt of q.options || []) {
      if (optionIds.has(opt.id)) errors.push(`${q.id}.options duplicate id ${opt.id}`);
      optionIds.add(opt.id);
      checkLocalizedMap(
        Object.assign({ sv: opt.textSv, en: opt.textEn }, opt.text || {}),
        `${q.id}.options.${opt.id}.text`,
        errors,
      );
    }
    if (!optionIds.has(q.correctOptionId)) errors.push(`${q.id}.correctOptionId not in options`);
  }

  return errors;
}

if (require.main === module) {
  const questions = loadTs('data/questions.ts', 'questions');
  const errors = checkQuestions(questions);
  if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  console.log(
    `Question i18n pilot OK (${QUESTION_LOCALIZATION_PILOT_IDS.length} questions, ${REQUIRED_LOCALES.length} locales)`,
  );
}

module.exports = { checkQuestions, REQUIRED_LOCALES };
