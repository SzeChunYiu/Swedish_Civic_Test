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

function isSlugTag(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
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

function validateQuestionSchema(question, index) {
  const label = hasText(question.id) ? question.id : `question[${index}]`;
  let valid = true;

  function reject(message) {
    valid = false;
    fail(message);
  }

  function requireText(field) {
    if (!hasText(question[field])) reject(`${label} missing ${field}`);
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

  if (!Array.isArray(question.options) || ![2, 4].includes(question.options.length)) {
    reject(`${label} must have 2 or 4 options`);
  } else {
    const optionIds = new Set();
    question.options.forEach((option, optionIndex) => {
      const optionLabel = `${label} option[${optionIndex}]`;
      if (!hasText(option.id)) reject(`${optionLabel} missing id`);
      if (hasText(option.id) && optionIds.has(option.id)) {
        reject(`${label} has duplicate option id ${option.id}`);
      }
      optionIds.add(option.id);
      if (!hasText(option.textSv)) reject(`${optionLabel} missing textSv`);
      if (!hasText(option.textEn)) reject(`${optionLabel} missing textEn`);
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
        !['true', 'false'].includes(question.correctOptionId))
    ) {
      reject(`${label} true_false questions must use true/false option ids in order`);
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

  return valid;
}

const chapters = loadTs('data/chapters.ts', 'chapters');
const questionModule = loadTs('data/questions.ts');
const baseQuestions = questionModule.baseQuestions;
const questions = questionModule.questions;
const sourceQuestions = questionModule.sourceQuestions;
const generatedPublishedQuestions = questionModule.generatedPublishedQuestions;
const additionalQuestions = loadTs('data/additionalQuestions.ts', 'additionalQuestions');
const uhrSectionMap = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'content/uhr-section-map.json'), 'utf8'),
);
let uhrReferencesValidated = 0;
let questionSchemasValidated = 0;
let questionPromptTextUniquenessValidated = 0;
let questionOptionTextLabelsValidated = 0;
let questionTypeOptionCountsValidated = 0;
let questionOptionIdConventionsValidated = 0;
let questionTagsValidated = 0;
let uhrMapChaptersValidated = 0;
let uhrMapSectionsValidated = 0;
let uhrSourceMetadataValidated = false;
let questionChapterReferenceParityValidated = 0;
let authoredSourceQuestionsValidated = 0;
let sourcePublicationParityValidated = 0;
let generationParityValidated = false;
let generatedSourceMetadataParityValidated = 0;
let generatedPromptTemplateParityValidated = 0;
let generatedAnswerTemplateParityValidated = 0;

if (!Array.isArray(chapters)) fail('chapters export is not an array');
if (!Array.isArray(baseQuestions)) fail('baseQuestions export is not an array');
if (!Array.isArray(additionalQuestions)) fail('additionalQuestions export is not an array');
if (!Array.isArray(questions)) fail('questions export is not an array');
if (!Array.isArray(sourceQuestions)) fail('sourceQuestions export is not an array');
if (!Array.isArray(generatedPublishedQuestions)) {
  fail('generatedPublishedQuestions export is not an array');
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
    let valid = true;

    function reject(message) {
      valid = false;
      fail(message);
    }

    if (!hasText(chapter.id)) reject(`uhr-section-map chapter[${index}] missing id`);
    if (hasText(chapter.id) && seenChapterIds.has(chapter.id)) {
      reject(`${label} has duplicate chapter id`);
    }
    if (hasText(chapter.id)) seenChapterIds.add(chapter.id);

    if (!hasText(chapter.chapter)) reject(`${label} missing chapter title`);
    if (hasText(chapter.chapter) && seenChapterTitles.has(chapter.chapter)) {
      reject(`${label} has duplicate chapter title`);
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
      reject(`${label} has invalid startPage`);
    } else if (chapter.startPage <= previousStartPage) {
      reject(`${label} startPage must be greater than previous chapter startPage`);
    }
    if (!Array.isArray(chapter.sections) || chapter.sections.length === 0) {
      reject(`${label} missing sections`);
    } else {
      const sections = new Set();
      chapter.sections.forEach((section, sectionIndex) => {
        if (!hasText(section)) {
          reject(`${label} section[${sectionIndex}] is blank`);
        }
        if (hasText(section) && sections.has(section)) {
          reject(`${label} has duplicate section "${section}"`);
        }
        if (hasText(section)) sections.add(section);
      });
    }

    const nextChapter = uhrSectionMap.chapters[index + 1];
    if (
      chapter.endPage !== undefined &&
      (!Number.isInteger(chapter.endPage) || chapter.endPage < chapter.startPage)
    ) {
      reject(`${label} has invalid endPage`);
    }

    if (Number.isInteger(chapter.startPage)) previousStartPage = chapter.startPage;
    if (valid) {
      uhrMapChaptersValidated += 1;
      uhrMapSectionsValidated += chapter.sections.length;
    }

    return {
      ...chapter,
      endPage:
        chapter.endPage ??
        (nextChapter?.startPage ? nextChapter.startPage - 1 : Number.POSITIVE_INFINITY),
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
  }

  if (valid) uhrSourceMetadataValidated = true;
}

const uhrReferenceChapters = buildUhrReferenceChapters();

if (Array.isArray(chapters)) {
  if (chapters.length !== 13) fail(`expected 13 chapters, found ${chapters.length}`);
  chapters.forEach((chapter, index) => {
    const expectedId = `ch${String(index + 1).padStart(2, '0')}`;
    if (chapter.id !== expectedId) fail(`expected chapter ${expectedId}, found ${chapter.id}`);
    for (const field of ['nameSv', 'nameEn', 'descriptionSv', 'descriptionEn']) {
      if (!chapter[field]) fail(`${chapter.id || expectedId} missing ${field}`);
    }
    if (!Number.isInteger(chapter.questionCount) || chapter.questionCount < 0) {
      fail(`${chapter.id || expectedId} has invalid questionCount`);
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

  const ids = new Set();
  questions.forEach((question, index) => {
    const label = question.id || `question[${index}]`;
    if (ids.has(question.id)) fail(`duplicate question id ${question.id}`);
    if (hasText(question.id)) ids.add(question.id);
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
      if (findDuplicateOptionTextLabels(question).length === 0) {
        questionOptionTextLabelsValidated += 1;
      }
      if (optionCountMatchesQuestionType(question)) {
        questionTypeOptionCountsValidated += 1;
      }
      if (optionIdsMatchQuestionType(question)) {
        questionOptionIdConventionsValidated += 1;
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
      questionSchemasValidated,
      questionPromptTextUniquenessValidated,
      questionOptionTextLabelsValidated,
      questionTypeOptionCountsValidated,
      questionOptionIdConventionsValidated,
      questionTagsValidated,
      uhrSourceMetadataValidated,
      uhrMapChaptersValidated,
      uhrMapSectionsValidated,
      questionChapterReferenceParityValidated,
      uhrReferencesValidated,
    },
    null,
    2,
  ),
);
