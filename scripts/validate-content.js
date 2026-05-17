#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const failures = [];
const moduleCache = new Map();
const QUESTION_TYPES = new Set(['single_choice', 'true_false', 'flashcard']);
const PUBLISHED_QUESTION_TYPES = new Set(['single_choice', 'true_false']);
const DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
const REVIEW_STATUSES = new Set(['draft', 'reviewed', 'published']);
const EXPECTED_UX_BENCHMARKS = 4;
const EXPECTED_SOURCE_QUESTIONS = 100;
const GENERATED_VARIANTS_PER_SOURCE = 4;
const SINGLE_CHOICE_OPTION_IDS = ['a', 'b', 'c', 'd'];
const TRUE_FALSE_OPTION_IDS = ['true', 'false'];
const GENERATED_VARIANT_CONVENTIONS = [
  { type: 'single_choice', tag: 'section-practice' },
  { type: 'true_false', tag: 'true-false' },
  { type: 'true_false', tag: 'false-statement' },
  { type: 'single_choice', tag: 'judgement' },
];
const UNKNOWN_OPTION = {
  id: 'unknown',
  textSv: 'Det går inte att avgöra av materialet',
  textEn: 'It cannot be determined from the material',
};
const SOMETIMES_OPTION = {
  id: 'sometimes',
  textSv: 'Endast ibland',
  textEn: 'Only sometimes',
};
const TRUE_FALSE_OPTIONS = [
  { id: 'true', textSv: 'Sant', textEn: 'True' },
  { id: 'false', textSv: 'Falskt', textEn: 'False' },
];
const EXPECTED_UHR_SOURCE = {
  titleKeyword: 'Sverige i fokus',
  publisher: 'Universitets- och högskolerådet (UHR)',
  url: 'https://www.uhr.se/globalassets/_uhr.se/medborgarskapsprovet/utbildningsmaterial/sverige-i-fokus.pdf',
};
const EXPECTED_UHR_EDUCATION_MATERIAL_URL =
  'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/';
const QUESTION_BANK_CSV_HEADER = [
  'id',
  'chapterId',
  'type',
  'questionSv',
  'questionEn',
  'correctOptionId',
  'uhrChapter',
  'uhrSection',
  'uhrPageApprox',
  'difficulty',
  'reviewStatus',
  'tags',
];
const EXPECTED_BADGE_IDS = ['first_practice', 'streak_3', 'level_2', 'mistake_reviewer'];
const EXPECTED_SPACED_REPETITION_SCHEDULE = [1, 3, 7, 15, 30];
const EXPECTED_STREAK_RULE_COUNT = 6;
const EXPECTED_XP_RULE_COUNT = 11;
const EXPECTED_MASTERY_RULE_COUNT = 7;
const EXPECTED_SUPPORTED_LANGUAGES = ['sv', 'en'];
const EXPECTED_LANGUAGE_LABELS = {
  sv: 'Swedish',
  en: 'English support',
};
const EXPECTED_DAILY_GOAL_OPTIONS = [5, 10, 20];
const EXPECTED_DAILY_GOAL_DEFAULT = 10;
const EXPECTED_DAILY_GOAL_MIN = 1;
const EXPECTED_DAILY_GOAL_MAX = 50;
const EXPECTED_PROGRESS_QUESTION_FIELDS = [
  'questionId',
  'seenCount',
  'correctCount',
  'wrongCount',
  'correctStreak',
  'lastAnsweredAt',
  'nextReviewAt',
  'bookmarked',
];
const EXPECTED_PROGRESS_OPTIONAL_FIELDS = new Set(['lastAnsweredAt', 'nextReviewAt', 'bookmarked']);
const EXPECTED_PROGRESS_QUESTION_FIELD_TYPES = {
  questionId: 'string',
  seenCount: 'number',
  correctCount: 'number',
  wrongCount: 'number',
  correctStreak: 'number',
  lastAnsweredAt: 'string',
  nextReviewAt: 'string',
  bookmarked: 'boolean',
};

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
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const mod = { exports: {} };
  moduleCache.set(filePath, mod.exports);

  function localRequire(request) {
    if (request === 'expo-speech') {
      return { speak() {}, stop() {} };
    }
    if (request.startsWith('.')) {
      const resolvedPath = resolveLocalModule(filePath, request);
      const relativeResolvedPath = path.relative(repoRoot, resolvedPath);
      return loadTs(relativeResolvedPath);
    }
    return require(request);
  }

  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  moduleCache.set(filePath, mod.exports);
  return exportName ? mod.exports[exportName] : mod.exports;
}

function fail(message) {
  failures.push(message);
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeOptionText(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function textIsTrimmedSingleSpaced(value) {
  return typeof value === 'string' && value === normalizeOptionText(value);
}

function normalizeComparableText(value) {
  return normalizeOptionText(value).toLocaleLowerCase('sv-SE');
}

function bilingualTextPairsAreDistinct(question) {
  return (
    normalizeComparableText(question.questionSv) !== normalizeComparableText(question.questionEn) &&
    normalizeComparableText(question.explanationSv) !==
      normalizeComparableText(question.explanationEn)
  );
}

function optionTextPairIsTranslatedOrInvariant(option) {
  const textSv = normalizeComparableText(option?.textSv);
  const textEn = normalizeComparableText(option?.textEn);
  if (!textSv || !textEn || textSv !== textEn) return true;

  const wordCount = normalizeOptionText(option.textSv).split(/\s+/).length;
  return wordCount <= 2;
}

function optionBilingualTextPairsAreValid(question) {
  if (!Array.isArray(question.options)) return false;
  return question.options.every(optionTextPairIsTranslatedOrInvariant);
}

function questionTextFieldsAreNormalized(question) {
  const fields = [
    question.questionSv,
    question.questionEn,
    question.explanationSv,
    question.explanationEn,
    question.uhrReference?.chapter,
    question.uhrReference?.section,
    ...(question.options || []).flatMap((option) => [option.textSv, option.textEn]),
  ];

  return fields.every(textIsTrimmedSingleSpaced);
}

function isSlugTag(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function isSnakeCaseId(value) {
  return /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(value);
}

function findDuplicateOptionTextLabels(question) {
  if (!Array.isArray(question.options)) return [];

  const duplicates = [];
  for (const field of ['textSv', 'textEn']) {
    const labels = new Set();
    question.options.forEach((option) => {
      const label = normalizeOptionText(option?.[field]);
      if (!label) return;
      if (labels.has(label)) duplicates.push({ field, label });
      labels.add(label);
    });
  }
  return duplicates;
}

function optionCountMatchesQuestionType(question) {
  if (!Array.isArray(question.options)) return false;
  if (question.type === 'single_choice') return question.options.length === 4;
  if (question.type === 'true_false') return question.options.length === 2;
  return [2, 4].includes(question.options.length);
}

function arrayEquals(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function jsonEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function expectedGeneratedTags(sourceQuestion, convention) {
  return [
    ...new Set([...sourceQuestion.tags, 'published-variant', convention?.tag].filter(Boolean)),
  ];
}

function answerLabel(option) {
  return `${option?.textSv ?? ''}`.replace(/[.!?]\s*$/, '');
}

function correctOption(question) {
  return (
    question.options?.find((option) => option.id === question.correctOptionId) ??
    question.options?.[0]
  );
}

function wrongOption(question) {
  return (
    question.options?.find((option) => option.id !== question.correctOptionId) ?? UNKNOWN_OPTION
  );
}

function expectedGeneratedPrompt(sourceQuestion, variantIndex) {
  if (variantIndex === 0) {
    return {
      questionSv: `Vilket svar stämmer bäst enligt UHR-avsnittet "${sourceQuestion.uhrReference?.section}"? ${sourceQuestion.questionSv}`,
      questionEn: `Which answer best matches the UHR section "${sourceQuestion.uhrReference?.section}"? ${sourceQuestion.questionEn}`,
    };
  }

  if (variantIndex === 1) {
    const option = correctOption(sourceQuestion);
    return {
      questionSv: `Sant eller falskt: Ett korrekt svar på frågan "${sourceQuestion.questionSv}" är "${answerLabel(option)}".`,
      questionEn: `True or false: A correct answer to "${sourceQuestion.questionEn}" is "${option?.textEn}".`,
    };
  }

  if (variantIndex === 2) {
    const option = wrongOption(sourceQuestion);
    return {
      questionSv: `Sant eller falskt: Ett korrekt svar på frågan "${sourceQuestion.questionSv}" är "${answerLabel(option)}".`,
      questionEn: `True or false: A correct answer to "${sourceQuestion.questionEn}" is "${option?.textEn}".`,
    };
  }

  return {
    questionSv: `Vilket alternativ motsvarar rätt bedömning av påståendet? ${sourceQuestion.questionSv}`,
    questionEn: `Which option gives the correct judgment of the statement? ${sourceQuestion.questionEn}`,
  };
}

function singleChoiceOptions(sourceQuestion) {
  if (sourceQuestion.options?.length === SINGLE_CHOICE_OPTION_IDS.length) {
    return sourceQuestion.options;
  }
  if (sourceQuestion.type === 'true_false') {
    return [...sourceQuestion.options, UNKNOWN_OPTION, SOMETIMES_OPTION];
  }
  return sourceQuestion.options || [];
}

function normalizeSingleChoiceOptions(options, correctOptionId) {
  if (options.length !== SINGLE_CHOICE_OPTION_IDS.length) {
    return { options, correctOptionId };
  }

  const correctIndex = options.findIndex((option) => option.id === correctOptionId);
  return {
    options: options.map((option, index) => ({
      ...option,
      id: SINGLE_CHOICE_OPTION_IDS[index],
    })),
    correctOptionId: correctIndex >= 0 ? SINGLE_CHOICE_OPTION_IDS[correctIndex] : correctOptionId,
  };
}

function expectedGeneratedAnswerShape(sourceQuestion, variantIndex) {
  if (variantIndex === 0) {
    return normalizeSingleChoiceOptions(
      singleChoiceOptions(sourceQuestion),
      sourceQuestion.correctOptionId,
    );
  }

  if (variantIndex === 1) {
    return {
      options: TRUE_FALSE_OPTIONS,
      correctOptionId: 'true',
    };
  }

  if (variantIndex === 2) {
    return {
      options: TRUE_FALSE_OPTIONS,
      correctOptionId: 'false',
    };
  }

  const correct = correctOption(sourceQuestion);
  const wrong = wrongOption(sourceQuestion);
  const isTrueFalseSource =
    sourceQuestion.options?.length === 2 &&
    ['true', 'false'].includes(sourceQuestion.correctOptionId);
  const options = isTrueFalseSource
    ? [...sourceQuestion.options, UNKNOWN_OPTION, SOMETIMES_OPTION]
    : [correct, wrong, UNKNOWN_OPTION, SOMETIMES_OPTION];

  return normalizeSingleChoiceOptions(options, correct.id);
}

function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function isHttpsUrl(value) {
  if (!hasText(value)) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function extractStringConstantFromTs(source, constantName) {
  const sourceFile = ts.createSourceFile('source.tsx', source, ts.ScriptTarget.Latest, true);
  let value;

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === constantName &&
      node.initializer &&
      ts.isStringLiteralLike(node.initializer)
    ) {
      value = node.initializer.text;
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return value;
}

function extractStringUnionTypeFromTs(source, typeName) {
  const sourceFile = ts.createSourceFile('source.ts', source, ts.ScriptTarget.Latest, true);
  let values;

  function visit(node) {
    if (
      ts.isTypeAliasDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === typeName &&
      ts.isUnionTypeNode(node.type)
    ) {
      values = node.type.types.map((typeNode) => {
        if (
          ts.isLiteralTypeNode(typeNode) &&
          typeNode.literal &&
          ts.isStringLiteralLike(typeNode.literal)
        ) {
          return typeNode.literal.text;
        }
        return undefined;
      });
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return values;
}

function propertyNameText(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return undefined;
}

function extractObjectTypePropertiesFromTs(source, declarationName) {
  const sourceFile = ts.createSourceFile('source.ts', source, ts.ScriptTarget.Latest, true);
  let properties;

  function readMembers(members) {
    return members
      .map((member) => {
        if (!ts.isPropertySignature(member)) return undefined;
        const name = propertyNameText(member.name);
        if (!name) return undefined;
        return {
          name,
          optional: Boolean(member.questionToken),
          type: member.type?.getText(sourceFile) ?? '',
        };
      })
      .filter(Boolean);
  }

  function visit(node) {
    if (
      ts.isInterfaceDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === declarationName
    ) {
      properties = readMembers(node.members);
      return;
    }
    if (
      ts.isTypeAliasDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === declarationName &&
      ts.isTypeLiteralNode(node.type)
    ) {
      properties = readMembers(node.type.members);
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return properties;
}

function extractCallStringArgumentsFromTs(source, functionName) {
  const sourceFile = ts.createSourceFile(
    'source.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const calls = [];

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === functionName
    ) {
      calls.push(
        node.arguments.map((argument) =>
          ts.isStringLiteralLike(argument) ? argument.text : undefined,
        ),
      );
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return calls;
}

function numericLiteralValue(node) {
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(node.operand)
  ) {
    return -Number(node.operand.text);
  }
  return undefined;
}

function extractMappedNumericArraysFromTs(source, parameterName) {
  const sourceFile = ts.createSourceFile(
    'source.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const arrays = [];

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'map' &&
      ts.isArrayLiteralExpression(node.expression.expression)
    ) {
      const callback = node.arguments[0];
      const callbackParameter = callback?.parameters?.[0]?.name;
      if (
        callbackParameter &&
        ts.isIdentifier(callbackParameter) &&
        callbackParameter.text === parameterName
      ) {
        arrays.push(
          node.expression.expression.elements.map((element) => numericLiteralValue(element)),
        );
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return arrays;
}

function parseCsvRows(csv) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];

    if (inQuotes) {
      if (character === '"') {
        if (csv[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += character;
      }
      continue;
    }

    if (character === '"') {
      if (cell.length) {
        throw new Error('unexpected quote inside unquoted cell');
      }
      inQuotes = true;
    } else if (character === ',') {
      row.push(cell);
      cell = '';
    } else if (character === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (character !== '\r') {
      cell += character;
    }
  }

  if (inQuotes) {
    throw new Error('unterminated quoted cell');
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function optionIdsMatchQuestionType(question) {
  if (!Array.isArray(question.options)) return false;
  const optionIds = question.options.map((option) => option?.id);
  if (question.type === 'single_choice') {
    return arrayEquals(optionIds, SINGLE_CHOICE_OPTION_IDS);
  }
  if (question.type === 'true_false') {
    return arrayEquals(optionIds, TRUE_FALSE_OPTION_IDS);
  }
  return optionIds.every(hasText);
}

function trueFalseOptionLabelsMatchConvention(question) {
  if (question.type !== 'true_false' || !Array.isArray(question.options)) return false;
  return jsonEqual(question.options, TRUE_FALSE_OPTIONS);
}

function validateChapterSchema(chapter, index, seenChapterIds, seenNamesSv, seenNamesEn) {
  const expectedId = `ch${String(index + 1).padStart(2, '0')}`;
  const label = hasText(chapter.id) ? chapter.id : `chapter[${index}]`;
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  if (chapter.id !== expectedId) reject(`expected chapter ${expectedId}, found ${chapter.id}`);
  if (hasText(chapter.id) && seenChapterIds.has(chapter.id)) {
    reject(`${label} has duplicate chapter id`);
  }
  if (hasText(chapter.id)) seenChapterIds.add(chapter.id);

  for (const field of ['nameSv', 'nameEn', 'descriptionSv', 'descriptionEn']) {
    if (!hasText(chapter[field])) reject(`${label} missing ${field}`);
    if (hasText(chapter[field]) && !textIsTrimmedSingleSpaced(chapter[field])) {
      reject(`${label} ${field} must be trimmed and single-spaced`);
    }
  }

  if (normalizeComparableText(chapter.nameSv) === normalizeComparableText(chapter.nameEn)) {
    reject(`${label} nameSv and nameEn must be distinct bilingual text`);
  }
  if (
    normalizeComparableText(chapter.descriptionSv) ===
    normalizeComparableText(chapter.descriptionEn)
  ) {
    reject(`${label} descriptionSv and descriptionEn must be distinct bilingual text`);
  }

  const normalizedNameSv = normalizeComparableText(chapter.nameSv);
  if (normalizedNameSv && seenNamesSv.has(normalizedNameSv)) {
    reject(`${label} duplicates Swedish chapter name`);
  }
  if (normalizedNameSv) seenNamesSv.add(normalizedNameSv);

  const normalizedNameEn = normalizeComparableText(chapter.nameEn);
  if (normalizedNameEn && seenNamesEn.has(normalizedNameEn)) {
    reject(`${label} duplicates English chapter name`);
  }
  if (normalizedNameEn) seenNamesEn.add(normalizedNameEn);

  if (!Number.isInteger(chapter.questionCount) || chapter.questionCount < 1) {
    reject(`${label} has invalid questionCount`);
  }

  return valid;
}

function chapterTextFieldsAreNormalized(chapter) {
  return ['id', 'nameSv', 'nameEn', 'descriptionSv', 'descriptionEn'].every((field) =>
    textIsTrimmedSingleSpaced(chapter[field]),
  );
}

function validateQuestionSchema(question, index) {
  const label = hasText(question.id) ? question.id : `question[${index}]`;
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  function requireText(field) {
    if (!hasText(question[field])) {
      reject(`${label} missing ${field}`);
    } else if (!textIsTrimmedSingleSpaced(question[field])) {
      reject(`${label} ${field} must be trimmed and single-spaced`);
    }
  }

  requireText('id');
  if (hasText(question.id) && !/^q\d{3,}$/.test(question.id)) {
    reject(`${label} id must use q### format`);
  }

  for (const field of [
    'questionSv',
    'questionEn',
    'explanationSv',
    'explanationEn',
    'correctOptionId',
    'chapterId',
  ]) {
    requireText(field);
  }

  if (!QUESTION_TYPES.has(question.type)) reject(`${label} has invalid type ${question.type}`);
  if (!DIFFICULTIES.has(question.difficulty)) {
    reject(`${label} has invalid difficulty ${question.difficulty}`);
  }
  if (!REVIEW_STATUSES.has(question.reviewStatus)) {
    reject(`${label} has invalid reviewStatus ${question.reviewStatus}`);
  }
  if (
    normalizeComparableText(question.questionSv) === normalizeComparableText(question.questionEn)
  ) {
    reject(`${label} questionSv and questionEn must be distinct bilingual text`);
  }
  if (
    normalizeComparableText(question.explanationSv) ===
    normalizeComparableText(question.explanationEn)
  ) {
    reject(`${label} explanationSv and explanationEn must be distinct bilingual text`);
  }

  if (!Array.isArray(question.options) || ![2, 4].includes(question.options.length)) {
    reject(`${label} must have 2 or 4 options`);
  } else {
    const optionIds = new Set();
    question.options.forEach((option, optionIndex) => {
      const optionLabel = `${label} option[${optionIndex}]`;
      if (!hasText(option.id)) reject(`${optionLabel} missing id`);
      if (hasText(option.id) && !textIsTrimmedSingleSpaced(option.id)) {
        reject(`${optionLabel} id must be trimmed and single-spaced`);
      }
      if (hasText(option.id) && optionIds.has(option.id)) {
        reject(`${label} has duplicate option id ${option.id}`);
      }
      optionIds.add(option.id);
      if (!hasText(option.textSv)) reject(`${optionLabel} missing textSv`);
      if (!hasText(option.textEn)) reject(`${optionLabel} missing textEn`);
      if (hasText(option.textSv) && !textIsTrimmedSingleSpaced(option.textSv)) {
        reject(`${optionLabel} textSv must be trimmed and single-spaced`);
      }
      if (hasText(option.textEn) && !textIsTrimmedSingleSpaced(option.textEn)) {
        reject(`${optionLabel} textEn must be trimmed and single-spaced`);
      }
      if (!optionTextPairIsTranslatedOrInvariant(option)) {
        reject(`${optionLabel} textSv and textEn must be translated or a short invariant label`);
      }
    });
    findDuplicateOptionTextLabels(question).forEach((duplicate) => {
      reject(`${label} has duplicate ${duplicate.field} option text "${duplicate.label}"`);
    });

    if (!optionIds.has(question.correctOptionId)) {
      reject(`${label} correctOptionId does not match an option`);
    }
    if (question.type === 'single_choice' && question.options.length !== 4) {
      reject(`${label} single_choice questions must have 4 options`);
    }
    if (question.type === 'single_choice' && !optionIdsMatchQuestionType(question)) {
      reject(`${label} single_choice options must use a/b/c/d option ids in order`);
    }
    if (
      question.type === 'true_false' &&
      (question.options.length !== 2 ||
        !optionIdsMatchQuestionType(question) ||
        !['true', 'false'].includes(question.correctOptionId) ||
        !trueFalseOptionLabelsMatchConvention(question))
    ) {
      reject(`${label} true_false questions must use true/false option ids and labels in order`);
    }
  }

  if (!Array.isArray(question.tags) || question.tags.length === 0) {
    reject(`${label} must have at least one tag`);
  } else {
    const tags = new Set();
    question.tags.forEach((tag, tagIndex) => {
      if (!hasText(tag)) reject(`${label} tag[${tagIndex}] is blank`);
      if (hasText(tag) && !isSlugTag(tag)) {
        reject(`${label} tag[${tagIndex}] must use lowercase kebab-case`);
      }
      if (hasText(tag) && tags.has(tag)) reject(`${label} has duplicate tag ${tag}`);
      tags.add(tag);
    });
  }

  if (question.uhrReference && typeof question.uhrReference === 'object') {
    for (const field of ['chapter', 'section']) {
      if (
        hasText(question.uhrReference[field]) &&
        !textIsTrimmedSingleSpaced(question.uhrReference[field])
      ) {
        reject(`${label} uhrReference.${field} must be trimmed and single-spaced`);
      }
    }
  }

  return valid;
}

const chapters = loadTs('data/chapters.ts', 'chapters');
const questionModule = loadTs('data/questions.ts');
const baseQuestions = questionModule.baseQuestions;
const questions = questionModule.questions;
const sourceQuestions = questionModule.sourceQuestions;
const generatedPublishedQuestions = questionModule.generatedPublishedQuestions;
const additionalQuestions = loadTs('data/additionalQuestions.ts', 'additionalQuestions');
const glossaryTerms = loadTs('data/glossary.ts', 'glossaryTerms');
const uxBenchmarks = loadTs('data/uxBenchmarks.ts', 'uxBenchmarks');
const defaultMockExamConfig = loadTs('data/mockExamConfig.ts', 'defaultMockExamConfig');
const supportedLanguages = loadTs('lib/localization/language.ts', 'supportedLanguages');
const localizationStrings = loadTs('lib/localization/strings.ts', 'strings');
const examGeneratorModule = loadTs('lib/quiz/examGenerator.ts');
const generateExam = examGeneratorModule.generateExam;
const buildExamReviewItems = examGeneratorModule.buildExamReviewItems;
const scoreExam = examGeneratorModule.scoreExam;
const buildExamChapterBreakdownItems = examGeneratorModule.buildExamChapterBreakdownItems;
const formatExamTime = examGeneratorModule.formatExamTime;
const shouldAutoSubmitExam = examGeneratorModule.shouldAutoSubmitExam;
const scoringModule = loadTs('lib/quiz/scoring.ts');
const scoreAnswers = scoringModule.scoreAnswers;
const answerValidationModule = loadTs('lib/quiz/answerValidation.ts');
const isCorrectAnswer = answerValidationModule.isCorrectAnswer;
const getAnswerOptionFeedback = answerValidationModule.getAnswerOptionFeedback;
const audioModule = loadTs('lib/audio/speak.ts');
const buildQuestionSpeechText = audioModule.buildQuestionSpeechText;
const practiceFlowModule = loadTs('lib/quiz/practiceFlow.ts');
const getChapterQuizSessionId = practiceFlowModule.getChapterQuizSessionId;
const badgeModule = loadTs('lib/learning/badges.ts');
const badgeCatalog = badgeModule.badgeCatalog;
const deriveBadges = badgeModule.deriveBadges;
const spacedRepetitionModule = loadTs('lib/learning/spacedRepetition.ts');
const spacedRepetitionSchedule = spacedRepetitionModule.spacedRepetitionSchedule;
const getNextReviewAt = spacedRepetitionModule.getNextReviewAt;
const streakModule = loadTs('lib/learning/streaks.ts');
const calculateStreak = streakModule.calculateStreak;
const xpModule = loadTs('lib/learning/xp.ts');
const calculateAnswerXp = xpModule.calculateAnswerXp;
const calculateQuizCompletionXp = xpModule.calculateQuizCompletionXp;
const calculateLevel = xpModule.calculateLevel;
const masteryModule = loadTs('lib/learning/mastery.ts');
const calculateMastery = masteryModule.calculateMastery;
const calculateChapterMastery = masteryModule.calculateChapterMastery;
const findWeakChapterIds = masteryModule.findWeakChapterIds;
const uhrSectionMap = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'content/uhr-section-map.json'), 'utf8'),
);
let chapterSchemasValidated = 0;
let chapterTextFieldsNormalizedValidated = 0;
let mockExamConfigValidated = false;
let mockExamRuntimeParityValidated = false;
let mockExamChapterBalanceParityValidated = false;
let mockExamTimerParityValidated = false;
let examReviewItemsValidated = 0;
let examReviewSourceParityValidated = false;
let examChapterBreakdownItemsValidated = 0;
let examChapterBreakdownParityValidated = false;
let glossaryTermsValidated = 0;
let uxBenchmarksValidated = 0;
let supportedLanguagesValidated = 0;
let localizationStringsValidated = 0;
let languageSettingsParityValidated = false;
let settingsDailyGoalOptionsValidated = 0;
let settingsDailyGoalParityValidated = false;
let progressQuestionFieldsValidated = 0;
let progressQuestionSchemaParityValidated = false;
let badgesValidated = 0;
let badgeMilestoneParityValidated = false;
let practiceScoringRulesValidated = 0;
let practiceScoringRulesParityValidated = false;
let answerFeedbackQuestionsValidated = 0;
let answerFeedbackOptionsValidated = 0;
let answerFeedbackRuntimeParityValidated = false;
let questionSpeechTextQuestionsValidated = 0;
let questionSpeechTextOptionsValidated = 0;
let questionSpeechTextParityValidated = false;
let chapterQuizSessionParityValidated = 0;
let spacedRepetitionIntervalsValidated = 0;
let spacedRepetitionRuntimeParityValidated = false;
let streakRulesValidated = 0;
let streakRulesParityValidated = false;
let xpRulesValidated = 0;
let xpRulesParityValidated = false;
let masteryRulesValidated = 0;
let masteryRulesParityValidated = false;
let uhrReferencesValidated = 0;
let questionSchemasValidated = 0;
let publishedQuestionTypesValidated = 0;
let questionIdSequencesValidated = 0;
let questionBilingualTextPairsValidated = 0;
let questionOptionBilingualTextPairsValidated = 0;
let questionTextFieldsNormalizedValidated = 0;
let questionPromptTextUniquenessValidated = 0;
let questionOptionTextLabelsValidated = 0;
let questionTypeOptionCountsValidated = 0;
let questionOptionIdConventionsValidated = 0;
let trueFalseQuestions = 0;
let trueFalseOptionLabelsValidated = 0;
let questionTagsValidated = 0;
let questionBankCsvRowsValidated = 0;
let uhrMapChaptersValidated = 0;
let uhrMapSectionsValidated = 0;
let uhrMapTextFieldsNormalizedValidated = 0;
let uhrMapPageRangesValidated = 0;
let uhrSourceMetadataValidated = false;
let uhrSourceMaterialLinkParityValidated = false;
let questionChapterReferenceParityValidated = 0;
let authoredSourceQuestionsValidated = 0;
let sourcePublicationParityValidated = 0;
let generationParityValidated = false;
let chapterGenerationParityValidated = 0;
let generatedSourceMetadataParityValidated = 0;
let generatedPromptTemplateParityValidated = 0;
let generatedAnswerTemplateParityValidated = 0;
let generatedTagTemplateParityValidated = 0;

if (!Array.isArray(chapters)) fail('chapters export is not an array');
if (!Array.isArray(baseQuestions)) fail('baseQuestions export is not an array');
if (!Array.isArray(additionalQuestions)) fail('additionalQuestions export is not an array');
if (!Array.isArray(glossaryTerms)) fail('glossaryTerms export is not an array');
if (!Array.isArray(questions)) fail('questions export is not an array');
if (!Array.isArray(sourceQuestions)) fail('sourceQuestions export is not an array');
if (!Array.isArray(generatedPublishedQuestions)) {
  fail('generatedPublishedQuestions export is not an array');
}
if (!Array.isArray(uxBenchmarks)) fail('uxBenchmarks export is not an array');
if (!Array.isArray(supportedLanguages)) fail('supportedLanguages export is not an array');
if (
  !localizationStrings ||
  typeof localizationStrings !== 'object' ||
  Array.isArray(localizationStrings)
) {
  fail('strings export is not an object');
}
if (typeof generateExam !== 'function') fail('generateExam export is not a function');
if (typeof buildExamReviewItems !== 'function') {
  fail('buildExamReviewItems export is not a function');
}
if (typeof scoreExam !== 'function') fail('scoreExam export is not a function');
if (typeof buildExamChapterBreakdownItems !== 'function') {
  fail('buildExamChapterBreakdownItems export is not a function');
}
if (typeof formatExamTime !== 'function') fail('formatExamTime export is not a function');
if (typeof shouldAutoSubmitExam !== 'function') {
  fail('shouldAutoSubmitExam export is not a function');
}
if (typeof scoreAnswers !== 'function') fail('scoreAnswers export is not a function');
if (typeof isCorrectAnswer !== 'function') fail('isCorrectAnswer export is not a function');
if (typeof getAnswerOptionFeedback !== 'function') {
  fail('getAnswerOptionFeedback export is not a function');
}
if (typeof buildQuestionSpeechText !== 'function') {
  fail('buildQuestionSpeechText export is not a function');
}
if (typeof getChapterQuizSessionId !== 'function') {
  fail('getChapterQuizSessionId export is not a function');
}
if (!badgeCatalog || typeof badgeCatalog !== 'object' || Array.isArray(badgeCatalog)) {
  fail('badgeCatalog export is not an object');
}
if (typeof deriveBadges !== 'function') fail('deriveBadges export is not a function');
if (!Array.isArray(spacedRepetitionSchedule)) {
  fail('spacedRepetitionSchedule export is not an array');
}
if (typeof getNextReviewAt !== 'function') fail('getNextReviewAt export is not a function');
if (typeof calculateStreak !== 'function') fail('calculateStreak export is not a function');
if (typeof calculateAnswerXp !== 'function') fail('calculateAnswerXp export is not a function');
if (typeof calculateQuizCompletionXp !== 'function') {
  fail('calculateQuizCompletionXp export is not a function');
}
if (typeof calculateLevel !== 'function') fail('calculateLevel export is not a function');
if (typeof calculateMastery !== 'function') fail('calculateMastery export is not a function');
if (typeof calculateChapterMastery !== 'function') {
  fail('calculateChapterMastery export is not a function');
}
if (typeof findWeakChapterIds !== 'function') fail('findWeakChapterIds export is not a function');

function validateMockExamConfig(config, publishedQuestionCount) {
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  if (!config || typeof config !== 'object') {
    reject('defaultMockExamConfig export is not an object');
  } else {
    if (!Number.isInteger(config.questionCount) || config.questionCount < 1) {
      reject('defaultMockExamConfig questionCount must be a positive integer');
    } else if (config.questionCount > publishedQuestionCount) {
      reject(
        `defaultMockExamConfig questionCount ${config.questionCount} exceeds ${publishedQuestionCount} published questions`,
      );
    }

    if (!Number.isInteger(config.durationMinutes) || config.durationMinutes < 1) {
      reject('defaultMockExamConfig durationMinutes must be a positive integer');
    }
    if (config.sourceScope !== 'uhr_based') {
      reject('defaultMockExamConfig sourceScope must be uhr_based');
    }
    if (config.showExplanationsDuringExam !== false) {
      reject('defaultMockExamConfig must not show explanations during the exam');
    }
    if (config.adsAllowedDuringExam !== false) {
      reject('defaultMockExamConfig must not allow ads during the exam');
    }
  }

  if (valid) mockExamConfigValidated = true;
}

function validateMockExamRuntimeParity(config) {
  if (!config || typeof config !== 'object' || !Array.isArray(questions)) return;
  if (typeof generateExam !== 'function') return;

  const examQuestions = generateExam(questions, { questionCount: config.questionCount });
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  if (!Array.isArray(examQuestions)) {
    reject('generateExam did not return an array for defaultMockExamConfig');
    return;
  }

  if (examQuestions.length !== config.questionCount) {
    reject(
      `default mock exam generated ${examQuestions.length} questions, expected ${config.questionCount}`,
    );
  }

  const examQuestionIds = new Set();
  const expectedChapterCoverage = Math.min(
    Array.isArray(chapters) ? chapters.length : 0,
    config.questionCount,
  );
  const coveredChapters = new Set();
  const chapterCounts = new Map();
  examQuestions.forEach((question, index) => {
    const label = question?.id || `mock exam question[${index}]`;

    if (!question || typeof question !== 'object') {
      reject(`mock exam question[${index}] is not an object`);
      return;
    }
    if (examQuestionIds.has(question.id)) {
      reject(`default mock exam repeats question ${question.id}`);
    }
    if (hasText(question.id)) examQuestionIds.add(question.id);
    if (question.reviewStatus !== 'published') {
      reject(`${label} mock exam reviewStatus is ${question.reviewStatus}, expected published`);
    }
    if (!question.uhrReference?.chapter || !question.uhrReference?.section) {
      reject(`${label} mock exam question is missing a UHR reference`);
    }
    if (hasText(question.chapterId)) {
      coveredChapters.add(question.chapterId);
      chapterCounts.set(question.chapterId, (chapterCounts.get(question.chapterId) || 0) + 1);
    }
  });

  if (expectedChapterCoverage > 0 && coveredChapters.size !== expectedChapterCoverage) {
    reject(
      `default mock exam covers ${coveredChapters.size} chapters, expected ${expectedChapterCoverage}`,
    );
  }

  const chapterCountValues = [...chapterCounts.values()];
  if (config.questionCount > 0 && chapterCountValues.length === 0) {
    reject('default mock exam did not count any chapter buckets');
  } else if (chapterCountValues.length > 0) {
    const minChapterCount = Math.min(...chapterCountValues);
    const maxChapterCount = Math.max(...chapterCountValues);
    const countedQuestions = chapterCountValues.reduce((sum, count) => sum + count, 0);

    if (countedQuestions !== examQuestions.length) {
      reject(
        `default mock exam counted ${countedQuestions} chapter assignments for ${examQuestions.length} questions`,
      );
    }
    if (maxChapterCount - minChapterCount > 1) {
      reject(
        `default mock exam chapter counts are unbalanced: ${JSON.stringify(Object.fromEntries(chapterCounts))}`,
      );
    }
  }

  if (valid) mockExamRuntimeParityValidated = true;
  if (valid) mockExamChapterBalanceParityValidated = true;
}

function expectedFormattedExamTime(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function validateMockExamTimerParity(config) {
  if (!config || typeof config !== 'object') return;
  if (typeof formatExamTime !== 'function' || typeof shouldAutoSubmitExam !== 'function') return;

  const totalSeconds = config.durationMinutes * 60;
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  if (!Number.isInteger(totalSeconds) || totalSeconds < 60) {
    reject('defaultMockExamConfig duration must convert to at least 60 whole seconds');
  }

  const formattedStartTime = formatExamTime(totalSeconds);
  const expectedStartTime = expectedFormattedExamTime(totalSeconds);
  if (formattedStartTime !== expectedStartTime) {
    reject(
      `formatExamTime default duration is ${formattedStartTime}, expected ${expectedStartTime}`,
    );
  }

  const liveExamState = {
    remainingSeconds: totalSeconds,
    submitted: false,
    questionCount: config.questionCount,
  };
  if (shouldAutoSubmitExam(liveExamState)) {
    reject('shouldAutoSubmitExam must not submit at the configured start time');
  }
  if (
    !shouldAutoSubmitExam({
      ...liveExamState,
      remainingSeconds: 0,
    })
  ) {
    reject('shouldAutoSubmitExam must submit a live exam when the timer reaches zero');
  }
  if (
    shouldAutoSubmitExam({
      ...liveExamState,
      remainingSeconds: 0,
      submitted: true,
    })
  ) {
    reject('shouldAutoSubmitExam must not resubmit an already submitted exam');
  }
  if (
    shouldAutoSubmitExam({
      ...liveExamState,
      remainingSeconds: 0,
      questionCount: 0,
    })
  ) {
    reject('shouldAutoSubmitExam must not submit an empty exam');
  }
  if (formatExamTime(-1) !== '00:00') {
    reject('formatExamTime must clamp negative remaining time to 00:00');
  }

  if (valid) mockExamTimerParityValidated = true;
}

function firstWrongOptionId(question) {
  return question.options?.find((option) => option.id !== question.correctOptionId)?.id;
}

function validateExamReviewSourceParity(config) {
  if (!config || typeof config !== 'object' || !Array.isArray(questions)) return;
  if (typeof generateExam !== 'function' || typeof buildExamReviewItems !== 'function') return;

  const examQuestions = generateExam(questions, { questionCount: config.questionCount });
  const answers = Object.fromEntries(
    examQuestions.map((question, index) => [
      question.id,
      index % 2 === 0 ? question.correctOptionId : firstWrongOptionId(question),
    ]),
  );
  const reviewItems = buildExamReviewItems(examQuestions, answers);
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  if (!Array.isArray(reviewItems)) {
    reject('buildExamReviewItems did not return an array for the default mock exam');
    return;
  }
  if (reviewItems.length !== examQuestions.length) {
    reject(
      `buildExamReviewItems returned ${reviewItems.length} items for ${examQuestions.length} default exam questions`,
    );
  }

  reviewItems.forEach((item, index) => {
    const question = examQuestions[index];
    const label = question?.id || `exam review item[${index}]`;
    let itemIsValid = true;

    function rejectItem(message) {
      itemIsValid = false;
      reject(message);
    }

    if (!question) {
      rejectItem(`${label} has no matching default exam question`);
      return;
    }

    const selectedOption = question.options.find((option) => option.id === answers[question.id]);
    const correctOption = question.options.find((option) => option.id === question.correctOptionId);

    if (item.questionId !== question.id) rejectItem(`${label} review questionId drifted`);
    if (item.questionSv !== question.questionSv)
      rejectItem(`${label} review question text drifted`);
    if (item.chapterId !== question.chapterId) rejectItem(`${label} review chapter drifted`);
    if (item.explanationSv !== question.explanationSv) {
      rejectItem(`${label} review explanation drifted`);
    }
    if (!jsonEqual(item.uhrReference, question.uhrReference)) {
      rejectItem(`${label} review UHR reference drifted`);
    }
    if (item.selectedOptionTextSv !== selectedOption?.textSv) {
      rejectItem(`${label} review selected answer text drifted`);
    }
    if (item.correctOptionTextSv !== correctOption?.textSv) {
      rejectItem(`${label} review correct answer text drifted`);
    }
    if (item.isCorrect !== (answers[question.id] === question.correctOptionId)) {
      rejectItem(`${label} review correctness drifted`);
    }
    if (item.selectedOptionTextSv === 'Not answered') {
      rejectItem(`${label} review did not resolve the selected answer`);
    }
    if (item.correctOptionTextSv === 'Correct answer missing') {
      rejectItem(`${label} review did not resolve the correct answer`);
    }

    if (itemIsValid) examReviewItemsValidated += 1;
  });

  if (
    valid &&
    examReviewItemsValidated === examQuestions.length &&
    reviewItems.some((item) => item.isCorrect) &&
    reviewItems.some((item) => !item.isCorrect)
  ) {
    examReviewSourceParityValidated = true;
  }
}

function buildAlternatingExamAnswers(examQuestions) {
  return Object.fromEntries(
    examQuestions.map((question, index) => [
      question.id,
      index % 2 === 0 ? question.correctOptionId : firstWrongOptionId(question),
    ]),
  );
}

function validateExamChapterBreakdownParity(config) {
  if (!config || typeof config !== 'object' || !Array.isArray(questions)) return;
  if (
    !Array.isArray(chapters) ||
    typeof generateExam !== 'function' ||
    typeof scoreExam !== 'function' ||
    typeof buildExamChapterBreakdownItems !== 'function'
  ) {
    return;
  }

  const examQuestions = generateExam(questions, { questionCount: config.questionCount });
  const answers = buildAlternatingExamAnswers(examQuestions);
  const result = scoreExam(examQuestions, answers);
  const breakdownItems = buildExamChapterBreakdownItems(result.chapterBreakdown, chapters);
  const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));
  const expectedByChapter = new Map();
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  examQuestions.forEach((question) => {
    const previous = expectedByChapter.get(question.chapterId) ?? {
      correctCount: 0,
      totalCount: 0,
    };
    expectedByChapter.set(question.chapterId, {
      correctCount:
        previous.correctCount + (answers[question.id] === question.correctOptionId ? 1 : 0),
      totalCount: previous.totalCount + 1,
    });
  });

  if (result.totalCount !== examQuestions.length) {
    reject(`scoreExam totalCount is ${result.totalCount}, expected ${examQuestions.length}`);
  }
  const expectedCorrectCount = [...expectedByChapter.values()].reduce(
    (sum, chapterResult) => sum + chapterResult.correctCount,
    0,
  );
  if (result.correctCount !== expectedCorrectCount) {
    reject(`scoreExam correctCount is ${result.correctCount}, expected ${expectedCorrectCount}`);
  }
  if (breakdownItems.length !== expectedByChapter.size) {
    reject(
      `exam chapter breakdown has ${breakdownItems.length} rows, expected ${expectedByChapter.size}`,
    );
  }

  breakdownItems.forEach((item) => {
    const chapter = chapterById.get(item.chapterId);
    const expected = expectedByChapter.get(item.chapterId);
    let itemIsValid = true;

    function rejectItem(message) {
      itemIsValid = false;
      reject(message);
    }

    if (!chapter) {
      rejectItem(`${item.chapterId} breakdown row references an unknown chapter`);
    } else {
      if (item.chapterNameSv !== chapter.nameSv) {
        rejectItem(`${item.chapterId} breakdown Swedish chapter name drifted`);
      }
      if (item.chapterNameEn !== chapter.nameEn) {
        rejectItem(`${item.chapterId} breakdown English chapter name drifted`);
      }
    }

    if (!expected) {
      rejectItem(`${item.chapterId} breakdown row is not present in the default exam`);
    } else {
      if (item.correctCount !== expected.correctCount) {
        rejectItem(`${item.chapterId} breakdown correctCount drifted`);
      }
      if (item.totalCount !== expected.totalCount) {
        rejectItem(`${item.chapterId} breakdown totalCount drifted`);
      }
    }

    if (itemIsValid) examChapterBreakdownItemsValidated += 1;
  });

  const countedTotal = breakdownItems.reduce((sum, item) => sum + item.totalCount, 0);
  if (countedTotal !== examQuestions.length) {
    reject(
      `exam chapter breakdown counted ${countedTotal} questions, expected ${examQuestions.length}`,
    );
  }

  if (
    valid &&
    examChapterBreakdownItemsValidated === breakdownItems.length &&
    breakdownItems.length === expectedByChapter.size
  ) {
    examChapterBreakdownParityValidated = true;
  }
}

function validateUxBenchmarks() {
  if (!Array.isArray(uxBenchmarks)) return;

  if (uxBenchmarks.length !== EXPECTED_UX_BENCHMARKS) {
    fail(`expected ${EXPECTED_UX_BENCHMARKS} UX benchmarks, found ${uxBenchmarks.length}`);
  }

  const seenProducts = new Set();
  const seenSources = new Set();

  uxBenchmarks.forEach((benchmark, index) => {
    const label = hasText(benchmark?.product) ? benchmark.product : `ux benchmark[${index}]`;
    let valid = true;

    function reject(message) {
      valid = false;
      fail(message);
    }

    if (!benchmark || typeof benchmark !== 'object') {
      reject(`ux benchmark[${index}] is not an object`);
    } else {
      for (const field of ['product', 'lesson', 'source']) {
        if (!hasText(benchmark[field])) {
          reject(`${label} missing ${field}`);
        } else if (!textIsTrimmedSingleSpaced(benchmark[field])) {
          reject(`${label} ${field} must be trimmed and single-spaced`);
        }
      }

      const normalizedProduct = normalizeComparableText(benchmark.product);
      if (normalizedProduct && seenProducts.has(normalizedProduct)) {
        reject(`${label} duplicates UX benchmark product`);
      }
      if (normalizedProduct) seenProducts.add(normalizedProduct);

      if (hasText(benchmark.source)) {
        if (!isHttpsUrl(benchmark.source)) {
          reject(`${label} source must be an HTTPS URL`);
        }
        if (seenSources.has(benchmark.source)) {
          reject(`${label} duplicates UX benchmark source`);
        }
        seenSources.add(benchmark.source);
      }
    }

    if (valid) uxBenchmarksValidated += 1;
  });
}

function validateLocalizationLanguageContract() {
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  if (!Array.isArray(supportedLanguages)) return;
  if (!arrayEquals(supportedLanguages, EXPECTED_SUPPORTED_LANGUAGES)) {
    reject(
      `supportedLanguages is ${JSON.stringify(supportedLanguages)}, expected ${JSON.stringify(
        EXPECTED_SUPPORTED_LANGUAGES,
      )}`,
    );
  }

  const seenLanguages = new Set();
  supportedLanguages.forEach((language, index) => {
    let languageIsValid = true;
    if (!/^[a-z]{2}$/.test(language)) {
      languageIsValid = false;
      reject(`supportedLanguages[${index}] must be a lowercase ISO language code`);
    }
    if (seenLanguages.has(language)) {
      languageIsValid = false;
      reject(`supportedLanguages has duplicate language ${language}`);
    }
    seenLanguages.add(language);
    if (!hasText(EXPECTED_LANGUAGE_LABELS[language])) {
      languageIsValid = false;
      reject(`supported language ${language} is missing a settings label`);
    }
    if (languageIsValid) supportedLanguagesValidated += 1;
  });

  if (
    !localizationStrings ||
    typeof localizationStrings !== 'object' ||
    Array.isArray(localizationStrings)
  ) {
    return;
  }

  Object.entries(localizationStrings).forEach(([key, value]) => {
    let entryIsValid = true;

    function rejectEntry(message) {
      entryIsValid = false;
      reject(message);
    }

    if (!isSlugTag(key)) rejectEntry(`strings.${key} key must use lowercase kebab-case`);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      rejectEntry(`strings.${key} must be a language map object`);
      return;
    }

    supportedLanguages.forEach((language) => {
      const text = value[language];
      if (!hasText(text)) {
        rejectEntry(`strings.${key}.${language} is missing`);
      } else if (!textIsTrimmedSingleSpaced(text)) {
        rejectEntry(`strings.${key}.${language} must be trimmed and single-spaced`);
      }
    });

    const extraLanguages = Object.keys(value).filter((language) => !seenLanguages.has(language));
    if (extraLanguages.length) {
      rejectEntry(`strings.${key} has unsupported languages ${extraLanguages.join(', ')}`);
    }

    if (entryIsValid) localizationStringsValidated += 1;
  });

  let settingsStore = '';
  let settingsRoute = '';
  try {
    settingsStore = fs.readFileSync(path.join(repoRoot, 'lib/storage/settingsStore.ts'), 'utf8');
    settingsRoute = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');
  } catch (error) {
    reject(`settings language parity source could not be read: ${error.message}`);
    return;
  }

  const appLanguageValues = extractStringUnionTypeFromTs(settingsStore, 'AppLanguage');
  if (!Array.isArray(appLanguageValues) || !arrayEquals(appLanguageValues, supportedLanguages)) {
    reject(
      `AppLanguage union is ${JSON.stringify(appLanguageValues)}, expected ${JSON.stringify(
        supportedLanguages,
      )}`,
    );
  }

  const languageButtonCalls = extractCallStringArgumentsFromTs(
    settingsRoute,
    'renderLanguageButton',
  );
  const routeLanguages = languageButtonCalls.map(([language]) => language);
  if (!arrayEquals(routeLanguages, supportedLanguages)) {
    reject(
      `app/settings.tsx language buttons are ${JSON.stringify(
        routeLanguages,
      )}, expected ${JSON.stringify(supportedLanguages)}`,
    );
  }

  const seenLabels = new Set();
  languageButtonCalls.forEach(([language, label], index) => {
    if (label !== EXPECTED_LANGUAGE_LABELS[language]) {
      reject(
        `app/settings.tsx language button[${index}] label is ${JSON.stringify(
          label,
        )}, expected ${JSON.stringify(EXPECTED_LANGUAGE_LABELS[language])}`,
      );
    }
    if (!textIsTrimmedSingleSpaced(label)) {
      reject(`app/settings.tsx language button[${index}] label must be trimmed and single-spaced`);
    }
    const normalizedLabel = normalizeComparableText(label);
    if (seenLabels.has(normalizedLabel)) {
      reject(`app/settings.tsx duplicates language label ${label}`);
    }
    if (normalizedLabel) seenLabels.add(normalizedLabel);
  });

  if (!settingsRoute.includes('Set question language to ${label}')) {
    reject('app/settings.tsx language buttons must expose label-derived accessibility text');
  }

  if (valid) languageSettingsParityValidated = true;
}

function validateSettingsDailyGoalParity() {
  let valid = true;
  let settingsStore = '';
  let settingsRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    settingsStore = fs.readFileSync(path.join(repoRoot, 'lib/storage/settingsStore.ts'), 'utf8');
    settingsRoute = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');
  } catch (error) {
    reject(`settings daily-goal parity source could not be read: ${error.message}`);
    return;
  }

  const dailyGoalKey = extractStringConstantFromTs(settingsStore, 'dailyGoalKey');
  if (dailyGoalKey !== 'dailyGoalAnswers') {
    reject(`dailyGoalKey is ${JSON.stringify(dailyGoalKey)}, expected "dailyGoalAnswers"`);
  }

  if (!settingsStore.includes(`: ${EXPECTED_DAILY_GOAL_DEFAULT};`)) {
    reject(`readDailyGoalAnswers must default to ${EXPECTED_DAILY_GOAL_DEFAULT} answers`);
  }

  const normalizedSettingsStore = settingsStore.replace(/\s+/g, ' ');
  const expectedClamp = `Math.max(${EXPECTED_DAILY_GOAL_MIN}, Math.min(${EXPECTED_DAILY_GOAL_MAX}, Math.round(dailyGoalAnswers)))`;
  if (!normalizedSettingsStore.includes(expectedClamp)) {
    reject(
      `setDailyGoalAnswers must clamp between ${EXPECTED_DAILY_GOAL_MIN} and ${EXPECTED_DAILY_GOAL_MAX}`,
    );
  }

  const goalOptionArrays = extractMappedNumericArraysFromTs(settingsRoute, 'goal');
  const goalOptions = goalOptionArrays[0] || [];
  if (!arrayEquals(goalOptions, EXPECTED_DAILY_GOAL_OPTIONS)) {
    reject(
      `app/settings.tsx daily goal options are ${JSON.stringify(
        goalOptionArrays,
      )}, expected ${JSON.stringify(EXPECTED_DAILY_GOAL_OPTIONS)}`,
    );
  }

  const seenGoals = new Set();
  goalOptions.forEach((goal, index) => {
    let optionIsValid = true;
    if (!Number.isInteger(goal)) {
      optionIsValid = false;
      reject(`daily goal option[${index}] must be an integer`);
    } else {
      if (goal < EXPECTED_DAILY_GOAL_MIN || goal > EXPECTED_DAILY_GOAL_MAX) {
        optionIsValid = false;
        reject(
          `daily goal option ${goal} must be between ${EXPECTED_DAILY_GOAL_MIN} and ${EXPECTED_DAILY_GOAL_MAX}`,
        );
      }
      if (seenGoals.has(goal)) {
        optionIsValid = false;
        reject(`daily goal option ${goal} is duplicated`);
      }
      seenGoals.add(goal);
    }

    if (optionIsValid) settingsDailyGoalOptionsValidated += 1;
  });

  if (!seenGoals.has(EXPECTED_DAILY_GOAL_DEFAULT)) {
    reject(`daily goal options must include the default ${EXPECTED_DAILY_GOAL_DEFAULT}`);
  }
  if (!settingsRoute.includes('Set daily goal to ${goal} answers')) {
    reject('app/settings.tsx daily goal buttons must expose goal-derived accessibility text');
  }
  if (!settingsRoute.includes('{dailyGoalAnswers} answers per day')) {
    reject('app/settings.tsx must render the persisted daily-goal count');
  }

  if (valid && settingsDailyGoalOptionsValidated === EXPECTED_DAILY_GOAL_OPTIONS.length) {
    settingsDailyGoalParityValidated = true;
  }
}

function validateProgressQuestionSchemaParity() {
  let valid = true;
  let progressTypesSource = '';
  let progressStoreSource = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    progressTypesSource = fs.readFileSync(path.join(repoRoot, 'types/progress.ts'), 'utf8');
    progressStoreSource = fs.readFileSync(
      path.join(repoRoot, 'lib/storage/progressStore.ts'),
      'utf8',
    );
  } catch (error) {
    reject(`progress schema parity source could not be read: ${error.message}`);
    return;
  }

  const publicFields = extractObjectTypePropertiesFromTs(
    progressTypesSource,
    'UserQuestionProgress',
  );
  const storeFields = extractObjectTypePropertiesFromTs(progressStoreSource, 'QuestionProgress');
  if (!Array.isArray(publicFields)) {
    reject('types/progress.ts UserQuestionProgress interface could not be read');
    return;
  }
  if (!Array.isArray(storeFields)) {
    reject('lib/storage/progressStore.ts QuestionProgress type could not be read');
    return;
  }

  const publicFieldsByName = new Map(publicFields.map((field) => [field.name, field]));
  const storeFieldsByName = new Map(storeFields.map((field) => [field.name, field]));
  const storeFieldNames = storeFields.map((field) => field.name);
  if (!arrayEquals(storeFieldNames, EXPECTED_PROGRESS_QUESTION_FIELDS)) {
    reject(
      `QuestionProgress fields are ${JSON.stringify(
        storeFieldNames,
      )}, expected ${JSON.stringify(EXPECTED_PROGRESS_QUESTION_FIELDS)}`,
    );
  }

  publicFields.forEach((field) => {
    if (!EXPECTED_PROGRESS_QUESTION_FIELDS.includes(field.name) && !field.optional) {
      reject(`UserQuestionProgress ${field.name} must be optional unless persisted by the store`);
    }
  });

  EXPECTED_PROGRESS_QUESTION_FIELDS.forEach((fieldName) => {
    let fieldIsValid = true;
    const expectedOptional = EXPECTED_PROGRESS_OPTIONAL_FIELDS.has(fieldName);
    const expectedType = EXPECTED_PROGRESS_QUESTION_FIELD_TYPES[fieldName];
    const publicField = publicFieldsByName.get(fieldName);
    const storeField = storeFieldsByName.get(fieldName);

    function rejectField(message) {
      fieldIsValid = false;
      reject(message);
    }

    if (!publicField) {
      rejectField(`UserQuestionProgress missing ${fieldName}`);
    } else {
      if (publicField.optional !== expectedOptional) {
        rejectField(
          `UserQuestionProgress ${fieldName} optional=${publicField.optional}, expected ${expectedOptional}`,
        );
      }
      if (publicField.type !== expectedType) {
        rejectField(
          `UserQuestionProgress ${fieldName} type is ${publicField.type}, expected ${expectedType}`,
        );
      }
    }

    if (!storeField) {
      rejectField(`QuestionProgress missing ${fieldName}`);
    } else {
      if (storeField.optional !== expectedOptional) {
        rejectField(
          `QuestionProgress ${fieldName} optional=${storeField.optional}, expected ${expectedOptional}`,
        );
      }
      if (storeField.type !== expectedType) {
        rejectField(
          `QuestionProgress ${fieldName} type is ${storeField.type}, expected ${expectedType}`,
        );
      }
    }

    if (fieldIsValid) progressQuestionFieldsValidated += 1;
  });

  if (valid && progressQuestionFieldsValidated === EXPECTED_PROGRESS_QUESTION_FIELDS.length) {
    progressQuestionSchemaParityValidated = true;
  }
}

function validateGlossaryTerms() {
  if (!Array.isArray(glossaryTerms)) return;

  const seenIds = new Set();
  const seenTermsSv = new Set();
  const seenTermsEn = new Set();
  const chapterIds = new Set(Array.isArray(chapters) ? chapters.map((chapter) => chapter.id) : []);

  glossaryTerms.forEach((term, index) => {
    const label = hasText(term?.id) ? term.id : `glossary term[${index}]`;
    let valid = true;

    function reject(message) {
      valid = false;
      fail(message);
    }

    if (!term || typeof term !== 'object') {
      reject(`glossary term[${index}] is not an object`);
    } else {
      for (const field of ['id', 'termSv', 'termEn', 'explanationSv', 'explanationEn']) {
        if (!hasText(term[field])) {
          reject(`${label} missing ${field}`);
        } else if (!textIsTrimmedSingleSpaced(term[field])) {
          reject(`${label} ${field} must be trimmed and single-spaced`);
        }
      }

      if (hasText(term.id) && !isSlugTag(term.id)) {
        reject(`${label} id must use lowercase kebab-case`);
      }
      if (hasText(term.id) && seenIds.has(term.id)) {
        reject(`${label} duplicates glossary term id`);
      }
      if (hasText(term.id)) seenIds.add(term.id);

      const normalizedTermSv = normalizeComparableText(term.termSv);
      if (normalizedTermSv && seenTermsSv.has(normalizedTermSv)) {
        reject(`${label} duplicates Swedish glossary term`);
      }
      if (normalizedTermSv) seenTermsSv.add(normalizedTermSv);

      const normalizedTermEn = normalizeComparableText(term.termEn);
      if (normalizedTermEn && seenTermsEn.has(normalizedTermEn)) {
        reject(`${label} duplicates English glossary term`);
      }
      if (normalizedTermEn) seenTermsEn.add(normalizedTermEn);

      if (!optionTextPairIsTranslatedOrInvariant({ textSv: term.termSv, textEn: term.termEn })) {
        reject(`${label} termSv and termEn must be translated or a short invariant term`);
      }
      if (
        normalizeComparableText(term.explanationSv) === normalizeComparableText(term.explanationEn)
      ) {
        reject(`${label} explanationSv and explanationEn must be distinct bilingual text`);
      }

      if (term.chapterId !== undefined) {
        if (!hasText(term.chapterId)) {
          reject(`${label} chapterId must be non-empty when present`);
        } else if (!textIsTrimmedSingleSpaced(term.chapterId)) {
          reject(`${label} chapterId must be trimmed and single-spaced`);
        } else if (chapterIds.size && !chapterIds.has(term.chapterId)) {
          reject(`${label} references unknown chapter ${term.chapterId}`);
        }
      }
    }

    if (valid) glossaryTermsValidated += 1;
  });
}

function validateBadgeCatalog() {
  if (!badgeCatalog || typeof badgeCatalog !== 'object' || Array.isArray(badgeCatalog)) return;

  const entries = Object.entries(badgeCatalog);
  const expectedIds = new Set(EXPECTED_BADGE_IDS);
  const catalogIds = entries.map(([key]) => key);
  if (!jsonEqual(catalogIds, EXPECTED_BADGE_IDS)) {
    fail(
      `badgeCatalog ids are ${JSON.stringify(catalogIds)}, expected ${JSON.stringify(
        EXPECTED_BADGE_IDS,
      )}`,
    );
  }

  const seenTitles = new Set();
  const seenDescriptions = new Set();

  entries.forEach(([key, badge], index) => {
    const label = hasText(badge?.id) ? badge.id : `badge[${index}]`;
    let valid = true;

    function reject(message) {
      valid = false;
      fail(message);
    }

    if (!badge || typeof badge !== 'object') {
      reject(`badgeCatalog.${key} is not an object`);
    } else {
      if (badge.id !== key) reject(`${label} id must match catalog key ${key}`);
      if (!expectedIds.has(badge.id)) reject(`${label} is not an expected badge id`);
      if (hasText(badge.id) && !isSnakeCaseId(badge.id)) {
        reject(`${label} id must use lowercase snake_case`);
      }

      for (const field of ['title', 'description']) {
        if (!hasText(badge[field])) {
          reject(`${label} missing ${field}`);
        } else if (!textIsTrimmedSingleSpaced(badge[field])) {
          reject(`${label} ${field} must be trimmed and single-spaced`);
        }
      }

      const normalizedTitle = normalizeComparableText(badge.title);
      if (normalizedTitle && seenTitles.has(normalizedTitle)) {
        reject(`${label} duplicates badge title`);
      }
      if (normalizedTitle) seenTitles.add(normalizedTitle);

      const normalizedDescription = normalizeComparableText(badge.description);
      if (normalizedDescription && seenDescriptions.has(normalizedDescription)) {
        reject(`${label} duplicates badge description`);
      }
      if (normalizedDescription) seenDescriptions.add(normalizedDescription);
    }

    if (valid) badgesValidated += 1;
  });

  if (typeof deriveBadges === 'function') {
    const noProgressBadgeIds = deriveBadges({
      completedQuestionCount: 0,
      currentStreak: 0,
      level: 1,
      wrongAnswerCount: 0,
    }).map((badge) => badge.id);
    const milestoneBadgeIds = deriveBadges({
      completedQuestionCount: 1,
      currentStreak: 3,
      level: 2,
      wrongAnswerCount: 1,
    }).map((badge) => badge.id);

    if (noProgressBadgeIds.length) {
      fail(`deriveBadges returned badges before milestones: ${noProgressBadgeIds.join(', ')}`);
    } else if (!jsonEqual(milestoneBadgeIds, EXPECTED_BADGE_IDS)) {
      fail(
        `deriveBadges milestone ids are ${JSON.stringify(
          milestoneBadgeIds,
        )}, expected ${JSON.stringify(EXPECTED_BADGE_IDS)}`,
      );
    } else {
      badgeMilestoneParityValidated = true;
    }
  }
}

function validatePracticeScoringRules() {
  if (typeof scoreAnswers !== 'function') return;

  const cases = [
    { label: 'default empty results', input: undefined, expected: { correct: 0, total: 0 } },
    { label: 'empty results', input: [], expected: { correct: 0, total: 0 } },
    { label: 'all wrong results', input: [false, false], expected: { correct: 0, total: 2 } },
    { label: 'mixed results', input: [true, false, true], expected: { correct: 2, total: 3 } },
    { label: 'all correct results', input: [true, true], expected: { correct: 2, total: 2 } },
  ];
  let rulesAreValid = true;

  cases.forEach(({ label, input, expected }) => {
    let actual;
    try {
      actual = input === undefined ? scoreAnswers() : scoreAnswers(input);
    } catch (error) {
      rulesAreValid = false;
      fail(`practice scoring rule ${label} threw ${error.message}`);
      return;
    }

    if (!jsonEqual(actual, expected)) {
      rulesAreValid = false;
      fail(
        `practice scoring rule ${label} returned ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
      );
    } else {
      practiceScoringRulesValidated += 1;
    }
  });

  if (rulesAreValid && practiceScoringRulesValidated === cases.length) {
    practiceScoringRulesParityValidated = true;
  }
}

function validateAnswerFeedbackParity() {
  if (
    !Array.isArray(questions) ||
    typeof isCorrectAnswer !== 'function' ||
    typeof getAnswerOptionFeedback !== 'function'
  ) {
    return;
  }

  let runtimeParityIsValid = true;

  questions.forEach((question) => {
    const correctOption = question.options?.find(
      (option) => option.id === question.correctOptionId,
    );
    let questionIsValid = true;

    function reject(message) {
      questionIsValid = false;
      runtimeParityIsValid = false;
      fail(message);
    }

    if (!correctOption) {
      reject(`${question.id} answer feedback cannot find the correct option`);
      return;
    }

    if (!isCorrectAnswer(question, correctOption.id)) {
      reject(`${question.id} isCorrectAnswer rejects the correct option`);
    }

    const selectedCorrectFeedback = getAnswerOptionFeedback(
      question,
      correctOption.id,
      correctOption.id,
    );
    if (
      selectedCorrectFeedback.resultLabel !== 'Rätt' ||
      selectedCorrectFeedback.tone !== 'correct'
    ) {
      reject(`${question.id} selected correct feedback drifted`);
    }

    question.options.forEach((option) => {
      const label = `${question.id} option ${option.id}`;
      const idleFeedback = getAnswerOptionFeedback(question, option.id, null);
      if (!jsonEqual(idleFeedback, { tone: 'idle' })) {
        reject(`${label} idle feedback drifted`);
      }

      if (option.id === question.correctOptionId) {
        answerFeedbackOptionsValidated += 1;
        return;
      }

      if (isCorrectAnswer(question, option.id)) {
        reject(`${label} isCorrectAnswer accepts a wrong option`);
      }

      const selectedWrongFeedback = getAnswerOptionFeedback(question, option.id, option.id);
      if (
        selectedWrongFeedback.resultLabel !== 'Fel' ||
        selectedWrongFeedback.tone !== 'incorrect'
      ) {
        reject(`${label} selected wrong feedback drifted`);
      }

      const revealedCorrectFeedback = getAnswerOptionFeedback(
        question,
        correctOption.id,
        option.id,
      );
      if (
        revealedCorrectFeedback.resultLabel !== 'Rätt svar' ||
        revealedCorrectFeedback.tone !== 'correct'
      ) {
        reject(`${label} correct-answer reveal feedback drifted`);
      }

      question.options
        .filter((otherOption) => ![option.id, correctOption.id].includes(otherOption.id))
        .forEach((otherOption) => {
          const otherFeedback = getAnswerOptionFeedback(question, otherOption.id, option.id);
          if (!jsonEqual(otherFeedback, { tone: 'idle' })) {
            reject(`${label} changed neutral feedback for ${otherOption.id}`);
          }
        });

      answerFeedbackOptionsValidated += 1;
    });

    if (questionIsValid) answerFeedbackQuestionsValidated += 1;
  });

  if (runtimeParityIsValid && answerFeedbackQuestionsValidated === questions.length) {
    answerFeedbackRuntimeParityValidated = true;
  }
}

function speechOptionLetter(index) {
  return String.fromCharCode('A'.charCodeAt(0) + index);
}

function expectedQuestionSpeechText(question) {
  const options = Array.isArray(question.options) ? question.options : [];
  const optionText = options
    .map((option, index) => `Alternativ ${speechOptionLetter(index)}. ${option.textSv}.`)
    .join(' ');

  return `${question.questionSv} ${optionText}`.trim();
}

function validateQuestionSpeechTextParity() {
  if (!Array.isArray(questions) || typeof buildQuestionSpeechText !== 'function') {
    return;
  }

  let runtimeParityIsValid = true;
  const expectedOptionCount = questions.reduce(
    (count, question) => count + (Array.isArray(question.options) ? question.options.length : 0),
    0,
  );

  questions.forEach((question, index) => {
    const label = question.id || `question[${index}]`;
    let questionIsValid = true;

    function reject(message) {
      questionIsValid = false;
      runtimeParityIsValid = false;
      fail(message);
    }

    if (!Array.isArray(question.options) || question.options.length === 0) {
      reject(`${label} speech text cannot be built without answer options`);
      return;
    }

    let speechText = '';
    try {
      speechText = buildQuestionSpeechText(question);
    } catch (error) {
      reject(`${label} buildQuestionSpeechText threw ${error.message}`);
      return;
    }

    const expectedSpeechText = expectedQuestionSpeechText(question);
    if (speechText !== expectedSpeechText) {
      reject(
        `${label} speech text is ${JSON.stringify(speechText)}, expected ${JSON.stringify(
          expectedSpeechText,
        )}`,
      );
    }

    if (!speechText.startsWith(question.questionSv)) {
      reject(`${label} speech text must start with the Swedish question prompt`);
    }

    question.options.forEach((option, optionIndex) => {
      const expectedFragment = `Alternativ ${speechOptionLetter(optionIndex)}. ${option.textSv}.`;
      if (!speechText.includes(expectedFragment)) {
        reject(`${label} speech text is missing option fragment ${expectedFragment}`);
      }
    });

    if (questionIsValid) {
      questionSpeechTextQuestionsValidated += 1;
      questionSpeechTextOptionsValidated += question.options.length;
    }
  });

  if (
    runtimeParityIsValid &&
    questionSpeechTextQuestionsValidated === questions.length &&
    questionSpeechTextOptionsValidated === expectedOptionCount
  ) {
    questionSpeechTextParityValidated = true;
  }
}

function validateChapterQuizSessionParity() {
  if (
    !Array.isArray(chapters) ||
    !Array.isArray(questions) ||
    typeof getChapterQuizSessionId !== 'function'
  ) {
    return;
  }

  chapters.forEach((chapter) => {
    const expectedQuestion = questions.find((question) => question.chapterId === chapter.id);
    const sessionId = getChapterQuizSessionId(questions, chapter.id);
    const sessionQuestion = questions.find((question) => question.id === sessionId);
    let valid = true;

    function reject(message) {
      valid = false;
      fail(message);
    }

    if (!expectedQuestion) {
      reject(`${chapter.id} has no question for chapter quiz session`);
    } else if (sessionId !== expectedQuestion.id) {
      reject(
        `${chapter.id} chapter quiz session resolves to ${sessionId}, expected ${expectedQuestion.id}`,
      );
    }

    if (!sessionQuestion) {
      reject(`${chapter.id} chapter quiz session id ${sessionId} does not match a question`);
    } else if (sessionQuestion.chapterId !== chapter.id) {
      reject(
        `${chapter.id} chapter quiz session id ${sessionId} belongs to ${sessionQuestion.chapterId}`,
      );
    } else if (sessionQuestion.reviewStatus !== 'published') {
      reject(`${chapter.id} chapter quiz session id ${sessionId} is not published`);
    }

    if (valid) chapterQuizSessionParityValidated += 1;
  });

  if (getChapterQuizSessionId(questions, 'missing-chapter') !== null) {
    fail('missing chapter quiz session should resolve to null');
  }
  if (getChapterQuizSessionId(questions, null) !== null) {
    fail('null chapter quiz session should resolve to null');
  }
}

function isoDaysAfter(baseIso, days) {
  const dayInMs = 24 * 60 * 60 * 1000;
  return new Date(new Date(baseIso).getTime() + days * dayInMs).toISOString();
}

function validateSpacedRepetitionSchedule() {
  if (!Array.isArray(spacedRepetitionSchedule)) return;

  if (!jsonEqual(spacedRepetitionSchedule, EXPECTED_SPACED_REPETITION_SCHEDULE)) {
    fail(
      `spacedRepetitionSchedule is ${JSON.stringify(
        spacedRepetitionSchedule,
      )}, expected ${JSON.stringify(EXPECTED_SPACED_REPETITION_SCHEDULE)}`,
    );
  }

  spacedRepetitionSchedule.forEach((days, index) => {
    let valid = true;

    if (!Number.isInteger(days) || days < 1) {
      valid = false;
      fail(`spacedRepetitionSchedule[${index}] must be a positive integer day interval`);
    }
    if (index > 0 && days <= spacedRepetitionSchedule[index - 1]) {
      valid = false;
      fail(`spacedRepetitionSchedule[${index}] must be greater than the previous interval`);
    }

    if (valid) spacedRepetitionIntervalsValidated += 1;
  });

  if (typeof getNextReviewAt !== 'function') return;

  const answeredAt = '2026-05-15T10:00:00.000Z';
  const cases = [
    {
      input: { isCorrect: false, correctStreak: 99, answeredAt },
      expectedDays: 1,
      label: 'wrong answer',
    },
    {
      input: { isCorrect: true, correctStreak: 0, answeredAt },
      expectedDays: EXPECTED_SPACED_REPETITION_SCHEDULE[0],
      label: 'correct streak 0',
    },
    {
      input: { isCorrect: true, correctStreak: 3, answeredAt },
      expectedDays: EXPECTED_SPACED_REPETITION_SCHEDULE[3],
      label: 'correct streak 3',
    },
    {
      input: { isCorrect: true, correctStreak: 50, answeredAt },
      expectedDays:
        EXPECTED_SPACED_REPETITION_SCHEDULE[EXPECTED_SPACED_REPETITION_SCHEDULE.length - 1],
      label: 'capped correct streak',
    },
  ];
  let runtimeParityIsValid = true;

  cases.forEach(({ input, expectedDays, label }) => {
    const actual = getNextReviewAt(input);
    const expected = isoDaysAfter(answeredAt, expectedDays);
    if (actual !== expected) {
      runtimeParityIsValid = false;
      fail(`getNextReviewAt ${label} returned ${actual}, expected ${expected}`);
    }
  });

  if (runtimeParityIsValid) spacedRepetitionRuntimeParityValidated = true;
}

function validateStreakRules() {
  if (typeof calculateStreak !== 'function') return;

  const today = '2026-05-15';
  const cases = [
    {
      label: 'empty answer history',
      actual: () => calculateStreak([], today),
      expected: 0,
    },
    {
      label: 'consecutive answer days through today',
      actual: () =>
        calculateStreak(['2026-05-13T09:00:00.000Z', '2026-05-14', '2026-05-15'], today),
      expected: 3,
    },
    {
      label: 'duplicate answer dates',
      actual: () =>
        calculateStreak(
          ['2026-05-14', '2026-05-15T08:00:00.000Z', '2026-05-15T20:00:00.000Z'],
          today,
        ),
      expected: 2,
    },
    {
      label: 'missed today but answered yesterday',
      actual: () => calculateStreak(['2026-05-13', '2026-05-14'], today),
      expected: 2,
    },
    {
      label: 'gap before today',
      actual: () => calculateStreak(['2026-05-12', '2026-05-13', '2026-05-15'], today),
      expected: 1,
    },
    {
      label: 'future-only answers',
      actual: () => calculateStreak(['2026-05-16'], today),
      expected: 0,
    },
  ];

  let rulesAreValid = true;

  cases.forEach(({ label, actual, expected }) => {
    let actualValue;
    try {
      actualValue = actual();
    } catch (error) {
      rulesAreValid = false;
      fail(`streak rule ${label} threw ${error.message}`);
      return;
    }

    if (actualValue !== expected) {
      rulesAreValid = false;
      fail(`streak rule ${label} returned ${actualValue}, expected ${expected}`);
    } else {
      streakRulesValidated += 1;
    }
  });

  if (rulesAreValid && streakRulesValidated === EXPECTED_STREAK_RULE_COUNT) {
    streakRulesParityValidated = true;
  }
}

function validateXpRules() {
  if (
    typeof calculateAnswerXp !== 'function' ||
    typeof calculateQuizCompletionXp !== 'function' ||
    typeof calculateLevel !== 'function'
  ) {
    return;
  }

  const cases = [
    {
      label: 'correct answer with explanation',
      actual: () => calculateAnswerXp({ isCorrect: true, explanationRead: true }),
      expected: 12,
    },
    {
      label: 'correct answer without explanation',
      actual: () => calculateAnswerXp({ isCorrect: true, explanationRead: false }),
      expected: 10,
    },
    {
      label: 'wrong answer with explanation',
      actual: () => calculateAnswerXp({ isCorrect: false, explanationRead: true }),
      expected: 4,
    },
    {
      label: 'wrong answer without explanation',
      actual: () => calculateAnswerXp({ isCorrect: false, explanationRead: false }),
      expected: 2,
    },
    {
      label: 'empty quiz completion',
      actual: () => calculateQuizCompletionXp({ answeredCount: 0, correctCount: 0 }),
      expected: 0,
    },
    {
      label: 'completed quiz without perfect bonus',
      actual: () => calculateQuizCompletionXp({ answeredCount: 10, correctCount: 9 }),
      expected: 20,
    },
    {
      label: 'perfect ten-question quiz',
      actual: () => calculateQuizCompletionXp({ answeredCount: 10, correctCount: 10 }),
      expected: 70,
    },
    { label: 'level at 0 XP', actual: () => calculateLevel(0), expected: 1 },
    { label: 'level below first threshold', actual: () => calculateLevel(99), expected: 1 },
    { label: 'level at 100 XP', actual: () => calculateLevel(100), expected: 2 },
    { label: 'level at 400 XP', actual: () => calculateLevel(400), expected: 3 },
  ];

  let rulesAreValid = true;

  cases.forEach(({ label, actual, expected }) => {
    let actualValue;
    try {
      actualValue = actual();
    } catch (error) {
      rulesAreValid = false;
      fail(`XP rule ${label} threw ${error.message}`);
      return;
    }

    if (actualValue !== expected) {
      rulesAreValid = false;
      fail(`XP rule ${label} returned ${actualValue}, expected ${expected}`);
    } else {
      xpRulesValidated += 1;
    }
  });

  if (rulesAreValid && xpRulesValidated === EXPECTED_XP_RULE_COUNT) {
    xpRulesParityValidated = true;
  }
}

function validateMasteryRules() {
  if (
    typeof calculateMastery !== 'function' ||
    typeof calculateChapterMastery !== 'function' ||
    typeof findWeakChapterIds !== 'function'
  ) {
    return;
  }

  const questions = [
    { id: 'q1', chapterId: 'ch01' },
    { id: 'q2', chapterId: 'ch01' },
    { id: 'q3', chapterId: 'ch02' },
  ];
  const progress = {
    q1: { correctCount: 0, seenCount: 2, wrongCount: 2 },
    q2: { correctCount: 1, seenCount: 1, wrongCount: 0 },
    q3: { correctCount: 3, seenCount: 3, wrongCount: 0 },
  };
  const cases = [
    {
      label: 'no progress mastery',
      actual: () =>
        calculateMastery({
          correctCount: 0,
          seenCount: 0,
          totalQuestions: 20,
          recent: false,
        }),
      expected: 0,
    },
    {
      label: 'weighted accuracy coverage and recency',
      actual: () =>
        calculateMastery({
          correctCount: 8,
          seenCount: 10,
          totalQuestions: 20,
          recent: true,
        }),
      expected: 0.75,
    },
    {
      label: 'mastery clamps oversampled counts',
      actual: () =>
        calculateMastery({
          correctCount: 20,
          seenCount: 10,
          totalQuestions: 5,
          recent: false,
        }),
      expected: 0.8,
    },
    {
      label: 'mastery without recency bonus',
      actual: () =>
        calculateMastery({
          correctCount: 5,
          seenCount: 10,
          totalQuestions: 20,
          recent: false,
        }),
      expected: 0.4,
    },
    {
      label: 'chapter mastery aggregate',
      actual: () => calculateChapterMastery('ch01', questions, progress),
      expected: 0.67,
    },
    {
      label: 'unknown chapter mastery',
      actual: () => calculateChapterMastery('ch99', questions, progress),
      expected: 0,
    },
    {
      label: 'weak chapter ids',
      actual: () => findWeakChapterIds(questions, progress, 0.7),
      expected: ['ch01'],
    },
  ];

  let rulesAreValid = true;

  cases.forEach(({ label, actual, expected }) => {
    let actualValue;
    try {
      actualValue = actual();
    } catch (error) {
      rulesAreValid = false;
      fail(`mastery rule ${label} threw ${error.message}`);
      return;
    }

    if (!jsonEqual(actualValue, expected)) {
      rulesAreValid = false;
      fail(
        `mastery rule ${label} returned ${JSON.stringify(actualValue)}, expected ${JSON.stringify(expected)}`,
      );
    } else {
      masteryRulesValidated += 1;
    }
  });

  if (rulesAreValid && masteryRulesValidated === EXPECTED_MASTERY_RULE_COUNT) {
    masteryRulesParityValidated = true;
  }
}

function validateQuestionBankCsvContract() {
  if (!Array.isArray(questions)) return;

  const csvPath = path.join(repoRoot, 'content/question-bank.csv');
  let rows = [];
  try {
    rows = parseCsvRows(fs.readFileSync(csvPath, 'utf8'));
  } catch (error) {
    fail(`content/question-bank.csv could not be parsed: ${error.message}`);
    return;
  }

  if (!rows.length) {
    fail('content/question-bank.csv is empty');
    return;
  }

  const [header, ...dataRows] = rows;
  if (!jsonEqual(header, QUESTION_BANK_CSV_HEADER)) {
    fail(
      `content/question-bank.csv header is ${JSON.stringify(header)}, expected ${JSON.stringify(
        QUESTION_BANK_CSV_HEADER,
      )}`,
    );
  }

  if (dataRows.length !== questions.length) {
    fail(
      `content/question-bank.csv has ${dataRows.length} data rows, expected ${questions.length}`,
    );
  }

  dataRows.forEach((row, index) => {
    const question = questions[index];
    const rowNumber = index + 2;
    const label = question?.id || `CSV row ${rowNumber}`;
    let rowIsValid = true;

    function reject(message) {
      rowIsValid = false;
      fail(message);
    }

    if (row.length !== QUESTION_BANK_CSV_HEADER.length) {
      reject(
        `content/question-bank.csv row ${rowNumber} has ${row.length} columns, expected ${QUESTION_BANK_CSV_HEADER.length}`,
      );
    }
    if (!question) {
      reject(`content/question-bank.csv row ${rowNumber} has no matching question`);
      return;
    }

    const expectedRow = [
      question.id,
      question.chapterId,
      question.type,
      question.questionSv,
      question.questionEn,
      question.correctOptionId,
      question.uhrReference?.chapter,
      question.uhrReference?.section,
      String(question.uhrReference?.pageApprox),
      question.difficulty,
      question.reviewStatus,
      Array.isArray(question.tags) ? question.tags.join('|') : '',
    ];

    QUESTION_BANK_CSV_HEADER.forEach((field, fieldIndex) => {
      if (row[fieldIndex] !== expectedRow[fieldIndex]) {
        reject(
          `content/question-bank.csv row ${rowNumber} ${label} ${field} is ${JSON.stringify(
            row[fieldIndex],
          )}, expected ${JSON.stringify(expectedRow[fieldIndex])}`,
        );
      }
    });

    if (rowIsValid) questionBankCsvRowsValidated += 1;
  });
}

const PUBLISHED_SOURCE_PARITY_FIELDS = [
  'id',
  'chapterId',
  'type',
  'questionSv',
  'questionEn',
  'options',
  'correctOptionId',
  'explanationSv',
  'explanationEn',
  'uhrReference',
  'difficulty',
  'tags',
];

function validateAuthoredSourceParity() {
  if (
    !Array.isArray(baseQuestions) ||
    !Array.isArray(additionalQuestions) ||
    !Array.isArray(sourceQuestions)
  ) {
    return;
  }

  const authoredQuestions = [...baseQuestions, ...additionalQuestions];
  if (authoredQuestions.length !== EXPECTED_SOURCE_QUESTIONS) {
    fail(
      `expected ${EXPECTED_SOURCE_QUESTIONS} authored source questions, found ${authoredQuestions.length}`,
    );
  }
  if (sourceQuestions.length !== authoredQuestions.length) {
    fail(
      `sourceQuestions has ${sourceQuestions.length} rows, expected ${authoredQuestions.length} authored questions`,
    );
  }

  const seenIds = new Set();
  authoredQuestions.forEach((question, index) => {
    const label = hasText(question.id) ? question.id : `authored question[${index}]`;
    const expectedId = `q${String(index + 1).padStart(3, '0')}`;
    let authoredQuestionIsValid = true;

    function reject(message) {
      authoredQuestionIsValid = false;
      fail(message);
    }

    if (question.id !== expectedId) {
      reject(`authored source index ${index} has id ${question.id}, expected ${expectedId}`);
    }
    if (seenIds.has(question.id)) reject(`duplicate authored source question id ${question.id}`);
    if (hasText(question.id)) seenIds.add(question.id);
    if (question.reviewStatus !== 'reviewed') {
      reject(
        `${label} authored source reviewStatus is ${question.reviewStatus}, expected reviewed`,
      );
    }

    if (validateQuestionSchema(question, index) && authoredQuestionIsValid) {
      authoredSourceQuestionsValidated += 1;
    }

    const publishedQuestion = sourceQuestions[index];
    if (!publishedQuestion) return;

    let publicationParityIsValid = true;
    if (publishedQuestion.reviewStatus !== 'published') {
      publicationParityIsValid = false;
      fail(`${label} published source reviewStatus is ${publishedQuestion.reviewStatus}`);
    }
    for (const field of PUBLISHED_SOURCE_PARITY_FIELDS) {
      if (JSON.stringify(publishedQuestion[field]) !== JSON.stringify(question[field])) {
        publicationParityIsValid = false;
        fail(`${label} published source ${field} does not match authored source`);
      }
    }
    if (publicationParityIsValid) sourcePublicationParityValidated += 1;
  });
}

validateAuthoredSourceParity();

function validateGenerationParity() {
  if (
    !Array.isArray(questions) ||
    !Array.isArray(sourceQuestions) ||
    !Array.isArray(generatedPublishedQuestions)
  ) {
    return;
  }

  const expectedGeneratedCount = sourceQuestions.length * GENERATED_VARIANTS_PER_SOURCE;
  if (sourceQuestions.length !== EXPECTED_SOURCE_QUESTIONS) {
    fail(`expected ${EXPECTED_SOURCE_QUESTIONS} source questions, found ${sourceQuestions.length}`);
  }
  if (generatedPublishedQuestions.length !== expectedGeneratedCount) {
    fail(
      `expected ${expectedGeneratedCount} generated published questions, found ${generatedPublishedQuestions.length}`,
    );
  }

  const expectedQuestionIds = [...sourceQuestions, ...generatedPublishedQuestions].map(
    (question) => question.id,
  );
  const actualQuestionIds = questions.map((question) => question.id);
  if (actualQuestionIds.length !== expectedQuestionIds.length) {
    fail(
      `questions export has ${actualQuestionIds.length} rows, expected ${expectedQuestionIds.length} from source + generated questions`,
    );
  }

  actualQuestionIds.forEach((id, index) => {
    const expectedSequentialId = `q${String(index + 1).padStart(3, '0')}`;
    if (id !== expectedSequentialId) {
      fail(`questions export index ${index} has id ${id}, expected ${expectedSequentialId}`);
    }
    if (id !== expectedQuestionIds[index]) {
      fail(`questions export index ${index} is ${id}, expected ${expectedQuestionIds[index]}`);
    }
  });

  if (failures.length === 0) generationParityValidated = true;
}

validateGenerationParity();

function countQuestionsByChapter(questionsToCount) {
  return questionsToCount.reduce((counts, question) => {
    counts.set(question.chapterId, (counts.get(question.chapterId) || 0) + 1);
    return counts;
  }, new Map());
}

function validateChapterGenerationParity() {
  if (
    !Array.isArray(chapters) ||
    !Array.isArray(sourceQuestions) ||
    !Array.isArray(generatedPublishedQuestions) ||
    !Array.isArray(questions)
  ) {
    return;
  }

  const sourceCounts = countQuestionsByChapter(sourceQuestions);
  const generatedCounts = countQuestionsByChapter(generatedPublishedQuestions);
  const publishedCounts = countQuestionsByChapter(questions);

  chapters.forEach((chapter) => {
    const sourceCount = sourceCounts.get(chapter.id) || 0;
    const generatedCount = generatedCounts.get(chapter.id) || 0;
    const publishedCount = publishedCounts.get(chapter.id) || 0;
    const expectedGeneratedCount = sourceCount * GENERATED_VARIANTS_PER_SOURCE;
    let valid = true;

    function reject(message) {
      valid = false;
      fail(message);
    }

    if (sourceCount < 1) {
      reject(`${chapter.id} has no authored source questions`);
    }
    if (generatedCount !== expectedGeneratedCount) {
      reject(
        `${chapter.id} has ${generatedCount} generated questions, expected ${expectedGeneratedCount} from ${sourceCount} source questions`,
      );
    }
    if (publishedCount !== sourceCount + generatedCount) {
      reject(
        `${chapter.id} has ${publishedCount} published questions, expected ${sourceCount + generatedCount} from source + generated questions`,
      );
    }
    if (chapter.questionCount !== publishedCount) {
      reject(
        `${chapter.id} questionCount is ${chapter.questionCount}, expected ${publishedCount} published questions`,
      );
    }

    if (valid) chapterGenerationParityValidated += 1;
  });
}

validateChapterGenerationParity();

function validateGeneratedSourceMetadataParity() {
  if (!Array.isArray(sourceQuestions) || !Array.isArray(generatedPublishedQuestions)) {
    return;
  }

  sourceQuestions.forEach((sourceQuestion, sourceIndex) => {
    const variants = generatedPublishedQuestions.slice(
      sourceIndex * GENERATED_VARIANTS_PER_SOURCE,
      (sourceIndex + 1) * GENERATED_VARIANTS_PER_SOURCE,
    );
    if (variants.length !== GENERATED_VARIANTS_PER_SOURCE) {
      fail(
        `${sourceQuestion.id} has ${variants.length} generated variants, expected ${GENERATED_VARIANTS_PER_SOURCE}`,
      );
    }

    variants.forEach((variant, variantIndex) => {
      if (!variant) return;
      let variantIsValid = true;
      const convention = GENERATED_VARIANT_CONVENTIONS[variantIndex];
      const expectedId = `q${String(
        EXPECTED_SOURCE_QUESTIONS + 1 + sourceIndex * GENERATED_VARIANTS_PER_SOURCE + variantIndex,
      ).padStart(3, '0')}`;
      const label = `${sourceQuestion.id} generated variant[${variantIndex}]`;

      function reject(message) {
        variantIsValid = false;
        fail(message);
      }

      if (variant.id !== expectedId)
        reject(`${label} has id ${variant.id}, expected ${expectedId}`);
      if (variant.reviewStatus !== 'published') {
        reject(`${label} reviewStatus is ${variant.reviewStatus}, expected published`);
      }
      if (convention && variant.type !== convention.type) {
        reject(`${label} type is ${variant.type}, expected ${convention.type}`);
      }

      for (const field of [
        'chapterId',
        'difficulty',
        'explanationSv',
        'explanationEn',
        'uhrReference',
      ]) {
        if (!jsonEqual(variant[field], sourceQuestion[field])) {
          reject(`${label} ${field} does not match source question`);
        }
      }

      if (!Array.isArray(variant.tags)) {
        reject(`${label} tags is not an array`);
      } else {
        const expectedTags = expectedGeneratedTags(sourceQuestion, convention);
        const variantTags = new Set(variant.tags);
        sourceQuestion.tags.forEach((tag) => {
          if (!variantTags.has(tag)) reject(`${label} is missing source tag ${tag}`);
        });
        if (!variantTags.has('published-variant')) {
          reject(`${label} is missing published-variant tag`);
        }
        if (convention && !variantTags.has(convention.tag)) {
          reject(`${label} is missing ${convention.tag} tag`);
        }
        if (!jsonEqual(variant.tags, expectedTags)) {
          reject(`${label} tags do not exactly match generated tag template`);
        } else {
          generatedTagTemplateParityValidated += 1;
        }
      }

      if (variantIsValid) generatedSourceMetadataParityValidated += 1;
    });
  });
}

validateGeneratedSourceMetadataParity();

function validateGeneratedPromptTemplateParity() {
  if (!Array.isArray(sourceQuestions) || !Array.isArray(generatedPublishedQuestions)) {
    return;
  }

  sourceQuestions.forEach((sourceQuestion, sourceIndex) => {
    const variants = generatedPublishedQuestions.slice(
      sourceIndex * GENERATED_VARIANTS_PER_SOURCE,
      (sourceIndex + 1) * GENERATED_VARIANTS_PER_SOURCE,
    );

    variants.forEach((variant, variantIndex) => {
      const label = `${sourceQuestion.id} generated variant[${variantIndex}]`;
      if (!variant) {
        fail(`${label} is missing`);
        return;
      }

      let variantIsValid = true;
      const expected = expectedGeneratedPrompt(sourceQuestion, variantIndex);

      if (variant.questionSv !== expected.questionSv) {
        variantIsValid = false;
        fail(`${label} questionSv does not match generated prompt template`);
      }
      if (variant.questionEn !== expected.questionEn) {
        variantIsValid = false;
        fail(`${label} questionEn does not match generated prompt template`);
      }

      if (variantIsValid) generatedPromptTemplateParityValidated += 1;
    });
  });
}

validateGeneratedPromptTemplateParity();

function validateGeneratedAnswerTemplateParity() {
  if (!Array.isArray(sourceQuestions) || !Array.isArray(generatedPublishedQuestions)) {
    return;
  }

  sourceQuestions.forEach((sourceQuestion, sourceIndex) => {
    const variants = generatedPublishedQuestions.slice(
      sourceIndex * GENERATED_VARIANTS_PER_SOURCE,
      (sourceIndex + 1) * GENERATED_VARIANTS_PER_SOURCE,
    );

    variants.forEach((variant, variantIndex) => {
      const label = `${sourceQuestion.id} generated variant[${variantIndex}]`;
      if (!variant) {
        fail(`${label} is missing`);
        return;
      }

      let variantIsValid = true;
      const expected = expectedGeneratedAnswerShape(sourceQuestion, variantIndex);

      if (!jsonEqual(variant.options, expected.options)) {
        variantIsValid = false;
        fail(`${label} options do not match generated answer template`);
      }
      if (variant.correctOptionId !== expected.correctOptionId) {
        variantIsValid = false;
        fail(`${label} correctOptionId does not match generated answer template`);
      }

      if (variantIsValid) generatedAnswerTemplateParityValidated += 1;
    });
  });
}

validateGeneratedAnswerTemplateParity();

function buildUhrReferenceChapters() {
  validateUhrSourceMetadata();
  if (!Array.isArray(uhrSectionMap?.chapters)) {
    fail('UHR section map chapters is not an array');
    return new Map();
  }

  if (Array.isArray(chapters) && uhrSectionMap.chapters.length !== chapters.length) {
    fail(
      `UHR section map expected ${chapters.length} chapters, found ${uhrSectionMap.chapters.length}`,
    );
  }

  const seenChapterIds = new Set();
  const seenChapterTitles = new Set();
  let previousStartPage = 0;

  const chapterEntries = uhrSectionMap.chapters.map((chapter, index) => {
    const label = chapter.id || `uhr-section-map chapter[${index}]`;
    const nextChapter = uhrSectionMap.chapters[index + 1];
    const nextStartPage = nextChapter?.startPage;
    let valid = true;
    let pageRangeIsValid = true;

    function reject(message) {
      valid = false;
      fail(message);
    }

    function rejectPageRange(message) {
      pageRangeIsValid = false;
      reject(message);
    }

    if (!hasText(chapter.id)) reject(`uhr-section-map chapter[${index}] missing id`);
    if (hasText(chapter.id) && seenChapterIds.has(chapter.id)) {
      reject(`${label} has duplicate chapter id`);
    }
    if (hasText(chapter.id)) {
      if (!textIsTrimmedSingleSpaced(chapter.id)) {
        reject(`${label} id must be trimmed and single-spaced`);
      } else {
        uhrMapTextFieldsNormalizedValidated += 1;
      }
    }
    if (hasText(chapter.id)) seenChapterIds.add(chapter.id);

    if (!hasText(chapter.chapter)) reject(`${label} missing chapter title`);
    if (hasText(chapter.chapter) && seenChapterTitles.has(chapter.chapter)) {
      reject(`${label} has duplicate chapter title`);
    }
    if (hasText(chapter.chapter)) {
      if (!textIsTrimmedSingleSpaced(chapter.chapter)) {
        reject(`${label} chapter title must be trimmed and single-spaced`);
      } else {
        uhrMapTextFieldsNormalizedValidated += 1;
      }
    }
    if (hasText(chapter.chapter)) seenChapterTitles.add(chapter.chapter);

    const chapterMetadata = Array.isArray(chapters) ? chapters[index] : undefined;
    if (chapterMetadata) {
      if (chapter.id !== chapterMetadata.id) {
        reject(`${label} id does not match data chapter id ${chapterMetadata.id}`);
      }
      if (chapter.chapter !== chapterMetadata.nameSv) {
        reject(`${label} title does not match data chapter name "${chapterMetadata.nameSv}"`);
      }
    }

    if (!Number.isInteger(chapter.startPage) || chapter.startPage < 1) {
      rejectPageRange(`${label} has invalid startPage`);
    } else if (chapter.startPage <= previousStartPage) {
      rejectPageRange(`${label} startPage must be greater than previous chapter startPage`);
    }
    if (!Array.isArray(chapter.sections) || chapter.sections.length === 0) {
      reject(`${label} missing sections`);
    } else {
      const sections = new Set();
      chapter.sections.forEach((section, sectionIndex) => {
        if (!hasText(section)) {
          reject(`${label} section[${sectionIndex}] is blank`);
        }
        if (hasText(section)) {
          if (!textIsTrimmedSingleSpaced(section)) {
            reject(`${label} section[${sectionIndex}] must be trimmed and single-spaced`);
          } else {
            uhrMapTextFieldsNormalizedValidated += 1;
          }
        }
        if (hasText(section) && sections.has(section)) {
          reject(`${label} has duplicate section "${section}"`);
        }
        if (hasText(section)) sections.add(section);
      });
    }

    if (chapter.endPage !== undefined) {
      if (!Number.isInteger(chapter.endPage) || chapter.endPage < chapter.startPage) {
        rejectPageRange(`${label} has invalid endPage`);
      } else if (Number.isInteger(nextStartPage) && chapter.endPage >= nextStartPage) {
        rejectPageRange(`${label} endPage must be before next chapter startPage`);
      }
    } else if (!nextChapter) {
      rejectPageRange(`${label} final chapter must define endPage`);
    } else if (!Number.isInteger(nextStartPage)) {
      rejectPageRange(`${label} cannot derive endPage from next chapter startPage`);
    } else if (Number.isInteger(chapter.startPage) && nextStartPage <= chapter.startPage) {
      rejectPageRange(`${label} next chapter startPage must be after startPage`);
    }

    if (pageRangeIsValid) uhrMapPageRangesValidated += 1;
    if (Number.isInteger(chapter.startPage)) previousStartPage = chapter.startPage;
    if (valid) {
      uhrMapChaptersValidated += 1;
      uhrMapSectionsValidated += chapter.sections.length;
    }

    return {
      ...chapter,
      endPage:
        chapter.endPage ??
        (Number.isInteger(nextStartPage) ? nextStartPage - 1 : Number.POSITIVE_INFINITY),
      sections: new Set(chapter.sections || []),
    };
  });

  return new Map(chapterEntries.map((chapter) => [chapter.chapter, chapter]));
}

function validateUhrSourceMetadata() {
  const source = uhrSectionMap?.source;
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  if (!source || typeof source !== 'object') {
    reject('UHR section map missing source metadata');
  } else {
    if (!hasText(source.title) || !source.title.includes(EXPECTED_UHR_SOURCE.titleKeyword)) {
      reject(`UHR section map source title must reference ${EXPECTED_UHR_SOURCE.titleKeyword}`);
    }
    if (source.publisher !== EXPECTED_UHR_SOURCE.publisher) {
      reject(`UHR section map source publisher must be ${EXPECTED_UHR_SOURCE.publisher}`);
    }
    if (source.url !== EXPECTED_UHR_SOURCE.url) {
      reject(`UHR section map source URL must be ${EXPECTED_UHR_SOURCE.url}`);
    }
    if (!isIsoDate(source.retrievedDate)) {
      reject('UHR section map source retrievedDate must use YYYY-MM-DD');
    }
    for (const field of ['title', 'publisher', 'url', 'retrievedDate']) {
      if (hasText(source[field])) {
        if (!textIsTrimmedSingleSpaced(source[field])) {
          reject(`UHR section map source ${field} must be trimmed and single-spaced`);
        } else {
          uhrMapTextFieldsNormalizedValidated += 1;
        }
      }
    }
  }

  if (valid) uhrSourceMetadataValidated = true;
}

function validateUhrSourceMaterialLinkParity() {
  let valid = true;
  let sourcesRoute = '';

  function reject(message) {
    valid = false;
    fail(message);
  }

  try {
    sourcesRoute = fs.readFileSync(path.join(repoRoot, 'app/sources.tsx'), 'utf8');
  } catch (error) {
    reject(`app/sources.tsx could not be read: ${error.message}`);
    return;
  }

  const routeMaterialUrl = extractStringConstantFromTs(sourcesRoute, 'UHR_EDUCATION_MATERIAL_URL');
  if (routeMaterialUrl !== EXPECTED_UHR_EDUCATION_MATERIAL_URL) {
    reject(
      `app/sources.tsx UHR_EDUCATION_MATERIAL_URL must be ${EXPECTED_UHR_EDUCATION_MATERIAL_URL}`,
    );
  }

  if (!isHttpsUrl(routeMaterialUrl)) {
    reject('app/sources.tsx UHR education material URL must be HTTPS');
  }

  const mapSourceUrl = uhrSectionMap?.source?.url;
  if (!isHttpsUrl(mapSourceUrl)) {
    reject('UHR section map source URL must be HTTPS');
  } else {
    const mapSource = new URL(mapSourceUrl);
    const expectedMaterialPath = new URL(EXPECTED_UHR_EDUCATION_MATERIAL_URL).pathname;
    if (mapSource.hostname !== 'www.uhr.se' || !mapSource.pathname.includes(expectedMaterialPath)) {
      reject('UHR section map source URL must be under the UHR education material path');
    }
  }

  if (!sourcesRoute.includes(EXPECTED_UHR_SOURCE.titleKeyword)) {
    reject(`app/sources.tsx must mention ${EXPECTED_UHR_SOURCE.titleKeyword}`);
  }
  if (!sourcesRoute.includes('content/uhr-section-map.json')) {
    reject('app/sources.tsx must mention content/uhr-section-map.json');
  }
  if (!sourcesRoute.includes('content/question-bank.csv')) {
    reject('app/sources.tsx must mention content/question-bank.csv');
  }
  if (!/<Link[\s\S]*href=\{UHR_EDUCATION_MATERIAL_URL\}/.test(sourcesRoute)) {
    reject('app/sources.tsx must render the UHR material URL through an Expo Link');
  }
  if (!sourcesRoute.includes('accessibilityLabel="Open UHR education material"')) {
    reject('app/sources.tsx UHR material link needs the expected accessibility label');
  }

  if (valid) uhrSourceMaterialLinkParityValidated = true;
}

const uhrReferenceChapters = buildUhrReferenceChapters();

if (Array.isArray(chapters)) {
  if (chapters.length !== 13) fail(`expected 13 chapters, found ${chapters.length}`);
  const seenChapterIds = new Set();
  const seenNamesSv = new Set();
  const seenNamesEn = new Set();
  chapters.forEach((chapter, index) => {
    if (validateChapterSchema(chapter, index, seenChapterIds, seenNamesSv, seenNamesEn)) {
      chapterSchemasValidated += 1;
      if (chapterTextFieldsAreNormalized(chapter)) {
        chapterTextFieldsNormalizedValidated += 1;
      }
    }
  });
}

if (Array.isArray(questions)) {
  if (questions.length !== 500) fail(`expected 500 questions, found ${questions.length}`);
  const chapterIds = new Set(Array.isArray(chapters) ? chapters.map((chapter) => chapter.id) : []);
  const promptTexts = {
    questionSv: new Map(),
    questionEn: new Map(),
  };
  const questionIds = new Set();
  const counts = questions.reduce((acc, question) => {
    acc[question.chapterId] = (acc[question.chapterId] || 0) + 1;
    return acc;
  }, {});

  for (const chapterId of chapterIds) {
    if (!counts[chapterId]) fail(`expected at least 1 question for ${chapterId}`);
  }
  if (Array.isArray(chapters)) {
    chapters.forEach((chapter) => {
      const actualCount = counts[chapter.id] || 0;
      if (chapter.questionCount !== actualCount) {
        fail(
          `${chapter.id} questionCount is ${chapter.questionCount}, expected ${actualCount} from questions`,
        );
      }
    });
  }
  if ((counts.ch01 || 0) < 10)
    fail(`expected at least 10 ch01 questions, found ${counts.ch01 || 0}`);
  if ((counts.ch02 || 0) < 10)
    fail(`expected at least 10 ch02 questions, found ${counts.ch02 || 0}`);

  questions.forEach((question, index) => {
    const label = question.id || `question[${index}]`;
    let questionIdSequenceIsValid = true;
    const expectedId = `q${String(index + 1).padStart(3, '0')}`;
    if (question.id !== expectedId) {
      questionIdSequenceIsValid = false;
      fail(`${label} expected sequential id ${expectedId}`);
    }
    if (questionIds.has(question.id)) {
      questionIdSequenceIsValid = false;
      fail(`duplicate question id ${question.id}`);
    }
    if (hasText(question.id)) questionIds.add(question.id);
    if (questionIdSequenceIsValid) questionIdSequencesValidated += 1;

    if (chapterIds.size && !chapterIds.has(question.chapterId)) {
      fail(`${label} references unknown chapter ${question.chapterId}`);
    }

    let promptTextIsUnique = true;
    for (const field of Object.keys(promptTexts)) {
      const text = normalizeOptionText(question[field]);
      if (!text) {
        promptTextIsUnique = false;
        continue;
      }
      const previousQuestionId = promptTexts[field].get(text);
      if (previousQuestionId) {
        promptTextIsUnique = false;
        fail(`${label} duplicates ${field} text from ${previousQuestionId}`);
      } else {
        promptTexts[field].set(text, label);
      }
    }

    const questionSchemaIsValid = validateQuestionSchema(question, index);
    if (questionSchemaIsValid) {
      questionSchemasValidated += 1;
      if (PUBLISHED_QUESTION_TYPES.has(question.type)) {
        publishedQuestionTypesValidated += 1;
      } else {
        fail(`${label} published question type ${question.type} is not quiz-answerable`);
      }
      if (promptTextIsUnique) {
        questionPromptTextUniquenessValidated += 1;
      }
      if (bilingualTextPairsAreDistinct(question)) {
        questionBilingualTextPairsValidated += 1;
      }
      if (optionBilingualTextPairsAreValid(question)) {
        questionOptionBilingualTextPairsValidated += 1;
      }
      if (questionTextFieldsAreNormalized(question)) {
        questionTextFieldsNormalizedValidated += 1;
      }
      if (findDuplicateOptionTextLabels(question).length === 0) {
        questionOptionTextLabelsValidated += 1;
      }
      if (optionCountMatchesQuestionType(question)) {
        questionTypeOptionCountsValidated += 1;
      }
      if (optionIdsMatchQuestionType(question)) {
        questionOptionIdConventionsValidated += 1;
      }
      if (question.type === 'true_false') {
        trueFalseQuestions += 1;
        if (trueFalseOptionLabelsMatchConvention(question)) {
          trueFalseOptionLabelsValidated += 1;
        }
      }
      if (question.tags.every(isSlugTag)) {
        questionTagsValidated += 1;
      }
    }

    if (
      !question.uhrReference?.chapter ||
      !question.uhrReference?.section ||
      !question.uhrReference?.pageApprox
    ) {
      fail(`${label} has incomplete UHR reference`);
    } else {
      const uhrChapter = uhrReferenceChapters.get(question.uhrReference.chapter);
      if (!uhrChapter) {
        fail(`${label} UHR chapter "${question.uhrReference.chapter}" is not in section map`);
      } else {
        let referenceIsValid = true;
        if (question.chapterId !== uhrChapter.id) {
          fail(
            `${label} chapterId ${question.chapterId} does not match UHR chapter "${question.uhrReference.chapter}" (${uhrChapter.id})`,
          );
        } else {
          questionChapterReferenceParityValidated += 1;
        }
        if (!uhrChapter.sections.has(question.uhrReference.section)) {
          fail(
            `${label} UHR section "${question.uhrReference.section}" is not listed for "${question.uhrReference.chapter}"`,
          );
          referenceIsValid = false;
        }
        if (
          !Number.isInteger(question.uhrReference.pageApprox) ||
          question.uhrReference.pageApprox < uhrChapter.startPage ||
          question.uhrReference.pageApprox > uhrChapter.endPage
        ) {
          referenceIsValid = false;
          const pageRange =
            uhrChapter.endPage === Number.POSITIVE_INFINITY
              ? `${uhrChapter.startPage}+`
              : `${uhrChapter.startPage}-${uhrChapter.endPage}`;
          fail(
            `${label} UHR page ${question.uhrReference.pageApprox} is outside "${question.uhrReference.chapter}" page range ${pageRange}`,
          );
        }
        if (referenceIsValid) uhrReferencesValidated += 1;
      }
    }
    if (question.reviewStatus !== 'published')
      fail(`${label} reviewStatus is ${question.reviewStatus}`);

    const text = [
      question.questionSv,
      question.questionEn,
      question.explanationSv,
      question.explanationEn,
      ...(question.options || []).flatMap((option) => [option.textSv, option.textEn]),
    ].join(' ');
    if (/official|officiell|real exam|riktiga provfrågor|guaranteed|garanterad/i.test(text)) {
      fail(`${label} appears to overclaim official status or exam certainty`);
    }
  });
}

validateMockExamConfig(
  defaultMockExamConfig,
  Array.isArray(questions)
    ? questions.filter((question) => question.reviewStatus === 'published').length
    : 0,
);
validateMockExamRuntimeParity(defaultMockExamConfig);
validateMockExamTimerParity(defaultMockExamConfig);
validateExamReviewSourceParity(defaultMockExamConfig);
validateExamChapterBreakdownParity(defaultMockExamConfig);
validateGlossaryTerms();
validateUxBenchmarks();
validateLocalizationLanguageContract();
validateSettingsDailyGoalParity();
validateProgressQuestionSchemaParity();
validateBadgeCatalog();
validatePracticeScoringRules();
validateAnswerFeedbackParity();
validateQuestionSpeechTextParity();
validateChapterQuizSessionParity();
validateSpacedRepetitionSchedule();
validateStreakRules();
validateXpRules();
validateMasteryRules();
validateQuestionBankCsvContract();
validateUhrSourceMaterialLinkParity();

const practiceScreen = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/practice.tsx'), 'utf8');
const disclaimer = fs.readFileSync(
  path.join(repoRoot, 'components/quiz/QuestionDisclaimer.tsx'),
  'utf8',
);
if (!practiceScreen.includes('<QuestionDisclaimer />'))
  fail('practice screen is missing QuestionDisclaimer');
if (!/not official/i.test(disclaimer) || !/not real exam questions/i.test(disclaimer)) {
  fail('QuestionDisclaimer missing required independent/not-real-exam wording');
}

if (failures.length) {
  console.error('Content validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const publishedQuestions = Array.isArray(questions)
  ? questions.filter((question) => question.reviewStatus === 'published').length
  : 0;

console.log('Content validation OK');
console.log(
  JSON.stringify(
    {
      chapters: chapters.length,
      chapterSchemasValidated,
      chapterTextFieldsNormalizedValidated,
      mockExamConfigValidated,
      mockExamRuntimeParityValidated,
      mockExamChapterBalanceParityValidated,
      mockExamTimerParityValidated,
      examReviewItemsValidated,
      examReviewSourceParityValidated,
      examChapterBreakdownItemsValidated,
      examChapterBreakdownParityValidated,
      glossaryTerms: Array.isArray(glossaryTerms) ? glossaryTerms.length : 0,
      glossaryTermsValidated,
      uxBenchmarksValidated,
      supportedLanguagesValidated,
      localizationStrings:
        localizationStrings &&
        typeof localizationStrings === 'object' &&
        !Array.isArray(localizationStrings)
          ? Object.keys(localizationStrings).length
          : 0,
      localizationStringsValidated,
      languageSettingsParityValidated,
      settingsDailyGoalOptionsValidated,
      settingsDailyGoalParityValidated,
      progressQuestionFieldsValidated,
      progressQuestionSchemaParityValidated,
      badgesValidated,
      badgeMilestoneParityValidated,
      practiceScoringRulesValidated,
      practiceScoringRulesParityValidated,
      answerFeedbackQuestionsValidated,
      answerFeedbackOptionsValidated,
      answerFeedbackRuntimeParityValidated,
      questionSpeechTextQuestionsValidated,
      questionSpeechTextOptionsValidated,
      questionSpeechTextParityValidated,
      chapterQuizSessionParityValidated,
      spacedRepetitionIntervalsValidated,
      spacedRepetitionRuntimeParityValidated,
      streakRulesValidated,
      streakRulesParityValidated,
      xpRulesValidated,
      xpRulesParityValidated,
      masteryRulesValidated,
      masteryRulesParityValidated,
      questions: questions.length,
      publishedQuestions,
      sourceQuestions: Array.isArray(sourceQuestions) ? sourceQuestions.length : 0,
      generatedPublishedQuestions: Array.isArray(generatedPublishedQuestions)
        ? generatedPublishedQuestions.length
        : 0,
      authoredSourceQuestionsValidated,
      sourcePublicationParityValidated,
      generationParityValidated,
      chapterGenerationParityValidated,
      generatedSourceMetadataParityValidated,
      generatedPromptTemplateParityValidated,
      generatedAnswerTemplateParityValidated,
      generatedTagTemplateParityValidated,
      questionSchemasValidated,
      publishedQuestionTypesValidated,
      questionIdSequencesValidated,
      questionBilingualTextPairsValidated,
      questionOptionBilingualTextPairsValidated,
      questionTextFieldsNormalizedValidated,
      questionPromptTextUniquenessValidated,
      questionOptionTextLabelsValidated,
      questionTypeOptionCountsValidated,
      questionOptionIdConventionsValidated,
      trueFalseQuestions,
      trueFalseOptionLabelsValidated,
      questionTagsValidated,
      questionBankCsvRowsValidated,
      uhrSourceMetadataValidated,
      uhrMapChaptersValidated,
      uhrMapSectionsValidated,
      uhrMapTextFieldsNormalizedValidated,
      uhrMapPageRangesValidated,
      uhrSourceMaterialLinkParityValidated,
      questionChapterReferenceParityValidated,
      uhrReferencesValidated,
    },
    null,
    2,
  ),
);
