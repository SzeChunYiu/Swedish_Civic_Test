#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const failures = [];
const moduleCache = new Map();
const QUESTION_TYPES = new Set(['single_choice', 'true_false', 'flashcard']);
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
const examGeneratorModule = loadTs('lib/quiz/examGenerator.ts');
const generateExam = examGeneratorModule.generateExam;
const badgeModule = loadTs('lib/learning/badges.ts');
const badgeCatalog = badgeModule.badgeCatalog;
const deriveBadges = badgeModule.deriveBadges;
const spacedRepetitionModule = loadTs('lib/learning/spacedRepetition.ts');
const spacedRepetitionSchedule = spacedRepetitionModule.spacedRepetitionSchedule;
const getNextReviewAt = spacedRepetitionModule.getNextReviewAt;
const uhrSectionMap = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'content/uhr-section-map.json'), 'utf8'),
);
let chapterSchemasValidated = 0;
let chapterTextFieldsNormalizedValidated = 0;
let mockExamConfigValidated = false;
let mockExamRuntimeParityValidated = false;
let glossaryTermsValidated = 0;
let uxBenchmarksValidated = 0;
let badgesValidated = 0;
let badgeMilestoneParityValidated = false;
let spacedRepetitionIntervalsValidated = 0;
let spacedRepetitionRuntimeParityValidated = false;
let uhrReferencesValidated = 0;
let questionSchemasValidated = 0;
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
let questionChapterReferenceParityValidated = 0;
let authoredSourceQuestionsValidated = 0;
let sourcePublicationParityValidated = 0;
let generationParityValidated = false;
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
if (typeof generateExam !== 'function') fail('generateExam export is not a function');
if (!badgeCatalog || typeof badgeCatalog !== 'object' || Array.isArray(badgeCatalog)) {
  fail('badgeCatalog export is not an object');
}
if (typeof deriveBadges !== 'function') fail('deriveBadges export is not a function');
if (!Array.isArray(spacedRepetitionSchedule)) {
  fail('spacedRepetitionSchedule export is not an array');
}
if (typeof getNextReviewAt !== 'function') fail('getNextReviewAt export is not a function');

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
    if (hasText(question.chapterId)) coveredChapters.add(question.chapterId);
  });

  if (expectedChapterCoverage > 0 && coveredChapters.size !== expectedChapterCoverage) {
    reject(
      `default mock exam covers ${coveredChapters.size} chapters, expected ${expectedChapterCoverage}`,
    );
  }

  if (valid) mockExamRuntimeParityValidated = true;
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
validateGlossaryTerms();
validateUxBenchmarks();
validateBadgeCatalog();
validateSpacedRepetitionSchedule();
validateQuestionBankCsvContract();

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
      glossaryTerms: Array.isArray(glossaryTerms) ? glossaryTerms.length : 0,
      glossaryTermsValidated,
      uxBenchmarksValidated,
      badgesValidated,
      badgeMilestoneParityValidated,
      spacedRepetitionIntervalsValidated,
      spacedRepetitionRuntimeParityValidated,
      questions: questions.length,
      publishedQuestions,
      sourceQuestions: Array.isArray(sourceQuestions) ? sourceQuestions.length : 0,
      generatedPublishedQuestions: Array.isArray(generatedPublishedQuestions)
        ? generatedPublishedQuestions.length
        : 0,
      authoredSourceQuestionsValidated,
      sourcePublicationParityValidated,
      generationParityValidated,
      generatedSourceMetadataParityValidated,
      generatedPromptTemplateParityValidated,
      generatedAnswerTemplateParityValidated,
      generatedTagTemplateParityValidated,
      questionSchemasValidated,
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
      questionChapterReferenceParityValidated,
      uhrReferencesValidated,
    },
    null,
    2,
  ),
);
