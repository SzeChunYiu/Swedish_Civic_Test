#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { QUESTION_BANK_CSV_HEADER, serializeQuestionOptions } = require('./export-question-bank.js');

const repoRoot = path.resolve(__dirname, '..');
const questionBankCsvPath = process.env.QUESTION_BANK_CSV_PATH
  ? path.resolve(repoRoot, process.env.QUESTION_BANK_CSV_PATH)
  : path.join(repoRoot, 'content/question-bank.csv');
const questionBankCsvDisplayPath =
  path.relative(repoRoot, questionBankCsvPath) || path.basename(questionBankCsvPath);
const failures = [];
const moduleCache = new Map();
const expectedUhrSourceMetadata = {
  documentTitle: 'Sverige i fokus: Utbildningsmaterial till medborgarskapsprov',
  sourceEdition: '2026, 1:a upplagan',
  sourceUrl:
    'https://www.uhr.se/globalassets/_uhr.se/medborgarskapsprovet/utbildningsmaterial/sverige-i-fokus.pdf',
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

function parseCsvLine(line) {
  const cells = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      cells.push(cell);
      cell = '';
    } else {
      cell += char;
    }
  }

  cells.push(cell);
  return cells;
}

function questionBankCsvRows() {
  const csvPath = questionBankCsvPath;
  if (!fs.existsSync(csvPath)) return null;
  const csvLines = fs.readFileSync(csvPath, 'utf8').trim().split('\n');
  return {
    header: parseCsvLine(csvLines[0] || ''),
    rows: csvLines.slice(1).map((line) => parseCsvLine(line)),
  };
}

function questionBankCsvUhrFields(question) {
  return {
    uhrChapter: question.uhrReference?.chapter,
    uhrSection: question.uhrReference?.section,
    uhrPageApprox: question.uhrReference?.pageApprox,
    uhrDocumentTitle: question.uhrReference?.documentTitle,
    uhrSourceEdition: question.uhrReference?.sourceEdition,
    uhrSourceUrl: question.uhrReference?.sourceUrl,
  };
}

function questionBankCsvOptionFields(question) {
  return {
    optionsJson: serializeQuestionOptions(question),
  };
}

function questionBankCsvDifficultyTagFields(question) {
  return {
    difficulty: question.difficulty,
    tags: Array.isArray(question.tags) ? question.tags.join('|') : '',
  };
}

function questionBankCsvTypeField(question) {
  return {
    type: question.type,
  };
}

function questionBankCsvExamScopeField(question) {
  return {
    examScope: question.examScope,
  };
}

function questionBankCsvUhrSourceFields(question) {
  return {
    uhrDocumentTitle: question.uhrReference?.documentTitle,
    uhrSourceEdition: question.uhrReference?.sourceEdition,
    uhrSourceUrl: question.uhrReference?.sourceUrl,
  };
}

function questionBankCsvIdentityFields(question) {
  return {
    id: question.id,
    chapterId: question.chapterId,
  };
}

function questionBankCsvCorrectOptionField(question) {
  return {
    correctOptionId: question.correctOptionId,
  };
}

function questionBankCsvPromptFields(question) {
  return {
    questionSv: question.questionSv,
    questionEn: question.questionEn,
  };
}

function getQuestionBankOptionsJsonSchemaError(value) {
  let parsedOptions;
  try {
    parsedOptions = JSON.parse(value);
  } catch {
    return 'is not valid JSON';
  }

  if (!Array.isArray(parsedOptions)) {
    return 'must be a JSON array';
  }

  for (const [index, option] of parsedOptions.entries()) {
    if (!option || typeof option !== 'object' || Array.isArray(option)) {
      return `option ${index + 1} must be an object`;
    }
    for (const field of ['id', 'textSv', 'textEn']) {
      if (typeof option[field] !== 'string' || !option[field]) {
        return `option ${index + 1} must include string ${field}`;
      }
      if (option[field] !== option[field].trim()) {
        return `option ${index + 1} ${field} must not start or end with whitespace`;
      }
    }
  }

  return null;
}

function getQuestionBankDifficultySchemaError(value) {
  if (value !== 'easy' && value !== 'medium' && value !== 'hard') {
    return 'must be one of easy, medium, hard';
  }
  return null;
}

function getQuestionBankTagsSchemaError(value) {
  if (!value) return null;
  const tags = value.split('|');
  if (tags.some((tag) => !tag)) return 'must not include empty tag values';
  return null;
}

function getQuestionBankTypeSchemaError(value) {
  if (!['single_choice', 'true_false', 'flashcard'].includes(value)) {
    return 'must be one of single_choice, true_false, flashcard';
  }
  return null;
}

function getQuestionBankExamScopeSchemaError(value) {
  if (
    !['uhr_based', 'official_context', 'vocabulary_support', 'background_learning'].includes(value)
  ) {
    return 'must be one of uhr_based, official_context, vocabulary_support, background_learning';
  }
  return null;
}

function getQuestionBankUhrSourceSchemaError(column, value) {
  if (typeof value !== 'string' || !value.trim()) return 'must be a non-empty string';
  if (value !== value.trim()) return 'must not start or end with whitespace';
  if (column === 'uhrSourceUrl') {
    try {
      const parsed = new URL(value);
      if (!['http:', 'https:'].includes(parsed.protocol)) return 'must be an http(s) URL';
    } catch {
      return 'must be a valid URL';
    }
  }
  return null;
}

function getQuestionBankIdentitySchemaError(column, value) {
  if (typeof value !== 'string' || !value.trim()) return 'must be a non-empty string';
  if (column === 'id' && !/^q\d{3}$/.test(value)) return 'must match qNNN format';
  if (column === 'chapterId' && !/^ch\d{2}$/.test(value)) return 'must match chNN format';
  return null;
}

function getQuestionBankCorrectOptionSchemaError(value, optionsJsonValue) {
  if (typeof value !== 'string' || !value.trim()) return 'must be a non-empty string';
  try {
    const parsedOptions = JSON.parse(optionsJsonValue);
    if (!Array.isArray(parsedOptions))
      return 'cannot be validated because optionsJson is not an array';
    const optionIds = parsedOptions.map((option) => option?.id).filter(Boolean);
    if (!optionIds.includes(value)) return 'must match one option id in optionsJson';
  } catch {
    return 'cannot be validated because optionsJson is invalid';
  }
  return null;
}

function getQuestionBankPromptSchemaError(value) {
  if (typeof value !== 'string' || !value.trim()) return 'must be a non-empty string';
  if (value !== value.trim()) return 'must not start or end with whitespace';
  return null;
}

const chapters = loadTs('data/chapters.ts', 'chapters');
const questions = loadTs('data/questions.ts', 'questions');
const {
  uhrChapterPageRanges,
  findUhrChapterPageRange,
  findUhrSectionReference,
  isPageInsideUhrRange,
} = loadTs('data/uhrReferenceMap.ts');

if (!Array.isArray(chapters)) fail('chapters export is not an array');
if (!Array.isArray(questions)) fail('questions export is not an array');

if (Array.isArray(chapters)) {
  if (chapters.length !== 13) fail(`expected 13 chapters, found ${chapters.length}`);
  chapters.forEach((chapter, index) => {
    const expectedId = `ch${String(index + 1).padStart(2, '0')}`;
    if (chapter.id !== expectedId) fail(`expected chapter ${expectedId}, found ${chapter.id}`);
    for (const field of ['nameSv', 'nameEn', 'descriptionSv', 'descriptionEn']) {
      if (!chapter[field]) fail(`${chapter.id || expectedId} missing ${field}`);
    }
  });
}

if (Array.isArray(questions)) {
  if (questions.length !== 500) fail(`expected 500 questions, found ${questions.length}`);
  const chapterIds = new Set(Array.isArray(chapters) ? chapters.map((chapter) => chapter.id) : []);
  const chapterById = new Map(
    Array.isArray(chapters) ? chapters.map((chapter) => [chapter.id, chapter]) : [],
  );
  const counts = questions.reduce((acc, question) => {
    acc[question.chapterId] = (acc[question.chapterId] || 0) + 1;
    return acc;
  }, {});

  for (const chapterId of chapterIds) {
    if (!counts[chapterId]) fail(`expected at least 1 question for ${chapterId}`);
  }
  if ((counts.ch01 || 0) < 10)
    fail(`expected at least 10 ch01 questions, found ${counts.ch01 || 0}`);
  if ((counts.ch02 || 0) < 10)
    fail(`expected at least 10 ch02 questions, found ${counts.ch02 || 0}`);

  const ids = new Set();
  questions.forEach((question, index) => {
    const label = question.id || `question[${index}]`;
    if (!question.id) fail(`question[${index}] missing id`);
    if (ids.has(question.id)) fail(`duplicate question id ${question.id}`);
    ids.add(question.id);
    if (chapterIds.size && !chapterIds.has(question.chapterId)) {
      fail(`${label} references unknown chapter ${question.chapterId}`);
    }
    const chapter = chapterById.get(question.chapterId);
    if (chapter && question.uhrReference?.chapter !== chapter.nameSv) {
      fail(
        `${label} UHR reference chapter ${question.uhrReference?.chapter || 'missing'} does not match ${question.chapterId} (${chapter.nameSv})`,
      );
    }
    const pageRange = findUhrChapterPageRange(question.chapterId);
    if (!pageRange) {
      fail(`${label} missing UHR page range map entry for ${question.chapterId}`);
    } else if (chapter && pageRange.chapterNameSv !== chapter.nameSv) {
      fail(
        `${label} UHR page range map chapter name ${pageRange.chapterNameSv} does not match ${chapter.nameSv}`,
      );
    } else if (!isPageInsideUhrRange(question.uhrReference?.pageApprox, pageRange)) {
      fail(
        `${label} UHR page ${question.uhrReference?.pageApprox || 'missing'} is outside ${question.chapterId} range ${pageRange.startPage}-${pageRange.endPage}`,
      );
    } else {
      const section = findUhrSectionReference(question.chapterId, question.uhrReference?.section);
      if (!section) {
        fail(
          `${label} UHR section ${question.uhrReference?.section || 'missing'} is not mapped for ${question.chapterId}`,
        );
      } else if (!isPageInsideUhrRange(question.uhrReference?.pageApprox, section)) {
        fail(
          `${label} UHR page ${question.uhrReference?.pageApprox || 'missing'} is outside section "${section.title}" range ${section.startPage}-${section.endPage}`,
        );
      }
    }

    for (const field of [
      'questionSv',
      'questionEn',
      'explanationSv',
      'explanationEn',
      'correctOptionId',
      'chapterId',
    ]) {
      if (!question[field]) fail(`${label} missing ${field}`);
    }
    if (!Array.isArray(question.options) || ![2, 4].includes(question.options.length)) {
      fail(`${label} must have 2 or 4 options`);
    } else {
      const optionIds = question.options.map((option) => option.id);
      const duplicateOptionIds = optionIds.filter((id, optionIndex) => {
        return optionIds.indexOf(id) !== optionIndex;
      });
      if (duplicateOptionIds.length) {
        fail(`${label} has duplicate option id(s): ${[...new Set(duplicateOptionIds)].join(', ')}`);
      }
      if (!question.options.some((option) => option.id === question.correctOptionId)) {
        fail(`${label} correctOptionId does not match an option`);
      }
    }
    if (
      !question.uhrReference?.chapter ||
      !question.uhrReference?.section ||
      !question.uhrReference?.pageApprox
    ) {
      fail(`${label} has incomplete UHR reference`);
    }
    for (const [field, expectedValue] of Object.entries(expectedUhrSourceMetadata)) {
      if (question.uhrReference?.[field] !== expectedValue) {
        fail(`${label} UHR reference ${field} must be ${expectedValue}`);
      }
    }
    if (question.examScope !== 'uhr_based') {
      fail(
        `${label} examScope is ${question.examScope || 'missing'}; published bank must be uhr_based`,
      );
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

  const questionBankCsv = questionBankCsvRows();
  if (!questionBankCsv) {
    fail('content/question-bank.csv is missing');
  } else {
    const { header, rows } = questionBankCsv;
    const headerIndex = new Map(header.map((column, index) => [column, index]));
    const idIndex = headerIndex.get('id');
    const uhrColumns = Object.keys(questionBankCsvUhrFields({}));
    const optionColumns = Object.keys(questionBankCsvOptionFields({ options: [] }));
    const difficultyTagColumns = Object.keys(questionBankCsvDifficultyTagFields({}));
    const typeColumns = Object.keys(questionBankCsvTypeField({}));
    const examScopeColumns = Object.keys(questionBankCsvExamScopeField({}));
    const uhrSourceColumns = Object.keys(questionBankCsvUhrSourceFields({ uhrReference: {} }));
    const identityColumns = Object.keys(questionBankCsvIdentityFields({}));
    const correctOptionColumns = Object.keys(questionBankCsvCorrectOptionField({}));
    const promptColumns = Object.keys(questionBankCsvPromptFields({}));
    const idOrderMismatch = new Set();
    const headerMatchesExportContract =
      header.length === QUESTION_BANK_CSV_HEADER.length &&
      QUESTION_BANK_CSV_HEADER.every((column, index) => header[index] === column);

    if (!headerMatchesExportContract) {
      fail(
        `content/question-bank.csv header does not match export contract: expected ${QUESTION_BANK_CSV_HEADER.join(',')}`,
      );
    }

    if (idIndex === undefined) {
      fail('content/question-bank.csv is missing id column');
    } else {
      const csvIds = rows.map((row) => row[idIndex]);
      const rowCountMatches = csvIds.length === questions.length;
      if (csvIds.length !== questions.length) {
        fail(
          `content/question-bank.csv has ${csvIds.length} rows but questions export has ${questions.length}`,
        );
      }
      if (rowCountMatches) {
        questions.forEach((question, index) => {
          if (csvIds[index] !== question.id) {
            idOrderMismatch.add(index);
            fail(
              `content/question-bank.csv row ${index + 2} id ${csvIds[index] || 'missing'} does not match ${question.id}`,
            );
          }
        });
      }
    }

    for (const column of uhrColumns) {
      if (!headerIndex.has(column)) fail(`content/question-bank.csv is missing ${column} column`);
    }
    for (const column of optionColumns) {
      if (!headerIndex.has(column)) fail(`content/question-bank.csv is missing ${column} column`);
    }
    for (const column of difficultyTagColumns) {
      if (!headerIndex.has(column)) fail(`content/question-bank.csv is missing ${column} column`);
    }
    for (const column of typeColumns) {
      if (!headerIndex.has(column)) fail(`content/question-bank.csv is missing ${column} column`);
    }
    for (const column of examScopeColumns) {
      if (!headerIndex.has(column)) fail(`content/question-bank.csv is missing ${column} column`);
    }
    for (const column of uhrSourceColumns) {
      if (!headerIndex.has(column)) fail(`content/question-bank.csv is missing ${column} column`);
    }
    for (const column of identityColumns) {
      if (!headerIndex.has(column)) fail(`content/question-bank.csv is missing ${column} column`);
    }
    for (const column of correctOptionColumns) {
      if (!headerIndex.has(column)) fail(`content/question-bank.csv is missing ${column} column`);
    }
    for (const column of promptColumns) {
      if (!headerIndex.has(column)) fail(`content/question-bank.csv is missing ${column} column`);
    }

    const rowCountMatches = rows.length === questions.length;

    if (uhrColumns.every((column) => headerIndex.has(column)) && rowCountMatches) {
      questions.forEach((question, index) => {
        if (idOrderMismatch.has(index)) return;
        const row = rows[index] || [];
        for (const [column, expectedValue] of Object.entries(questionBankCsvUhrFields(question))) {
          const actualValue = row[headerIndex.get(column)];
          if (actualValue !== String(expectedValue ?? '')) {
            fail(
              `content/question-bank.csv row ${index + 2} ${column} ${
                actualValue || 'missing'
              } does not match ${question.id}`,
            );
          }
        }
      });
    }

    if (optionColumns.every((column) => headerIndex.has(column)) && rowCountMatches) {
      questions.forEach((question, index) => {
        if (idOrderMismatch.has(index)) return;
        const row = rows[index] || [];
        for (const [column, expectedValue] of Object.entries(
          questionBankCsvOptionFields(question),
        )) {
          const actualValue = row[headerIndex.get(column)];
          const schemaError = getQuestionBankOptionsJsonSchemaError(actualValue);
          if (schemaError) {
            fail(
              `${questionBankCsvDisplayPath} row ${index + 2} ${column} ${schemaError} for ${question.id}`,
            );
            continue;
          }
          if (actualValue !== expectedValue) {
            fail(
              `content/question-bank.csv row ${index + 2} ${column} does not match ${question.id}`,
            );
          }
        }
      });
    }

    if (difficultyTagColumns.every((column) => headerIndex.has(column)) && rowCountMatches) {
      questions.forEach((question, index) => {
        if (idOrderMismatch.has(index)) return;
        const row = rows[index] || [];
        for (const [column, expectedValue] of Object.entries(
          questionBankCsvDifficultyTagFields(question),
        )) {
          const actualValue = row[headerIndex.get(column)];
          if (column === 'difficulty') {
            const schemaError = getQuestionBankDifficultySchemaError(actualValue);
            if (schemaError) {
              fail(
                `${questionBankCsvDisplayPath} row ${index + 2} ${column} ${schemaError} for ${question.id}`,
              );
              continue;
            }
          }
          if (column === 'tags') {
            const schemaError = getQuestionBankTagsSchemaError(actualValue);
            if (schemaError) {
              fail(
                `${questionBankCsvDisplayPath} row ${index + 2} ${column} ${schemaError} for ${question.id}`,
              );
              continue;
            }
          }
          if (actualValue !== String(expectedValue ?? '')) {
            fail(
              `content/question-bank.csv row ${index + 2} ${column} ${
                actualValue || 'missing'
              } does not match ${question.id}`,
            );
          }
        }
      });
    }

    if (typeColumns.every((column) => headerIndex.has(column)) && rowCountMatches) {
      questions.forEach((question, index) => {
        if (idOrderMismatch.has(index)) return;
        const row = rows[index] || [];
        for (const [column, expectedValue] of Object.entries(questionBankCsvTypeField(question))) {
          const actualValue = row[headerIndex.get(column)];
          const schemaError = getQuestionBankTypeSchemaError(actualValue);
          if (schemaError) {
            fail(
              `${questionBankCsvDisplayPath} row ${index + 2} ${column} ${schemaError} for ${question.id}`,
            );
            continue;
          }
          if (actualValue !== String(expectedValue ?? '')) {
            fail(
              `content/question-bank.csv row ${index + 2} ${column} ${
                actualValue || 'missing'
              } does not match ${question.id}`,
            );
          }
        }
      });
    }

    if (examScopeColumns.every((column) => headerIndex.has(column)) && rowCountMatches) {
      questions.forEach((question, index) => {
        if (idOrderMismatch.has(index)) return;
        const row = rows[index] || [];
        for (const [column, expectedValue] of Object.entries(
          questionBankCsvExamScopeField(question),
        )) {
          const actualValue = row[headerIndex.get(column)];
          const schemaError = getQuestionBankExamScopeSchemaError(actualValue);
          if (schemaError) {
            fail(
              `${questionBankCsvDisplayPath} row ${index + 2} ${column} ${schemaError} for ${question.id}`,
            );
            continue;
          }
          if (actualValue !== String(expectedValue ?? '')) {
            fail(
              `content/question-bank.csv row ${index + 2} ${column} ${
                actualValue || 'missing'
              } does not match ${question.id}`,
            );
          }
        }
      });
    }

    if (uhrSourceColumns.every((column) => headerIndex.has(column)) && rowCountMatches) {
      questions.forEach((question, index) => {
        if (idOrderMismatch.has(index)) return;
        const row = rows[index] || [];
        for (const [column, expectedValue] of Object.entries(
          questionBankCsvUhrSourceFields(question),
        )) {
          const actualValue = row[headerIndex.get(column)];
          const schemaError = getQuestionBankUhrSourceSchemaError(column, actualValue);
          if (schemaError) {
            fail(
              `${questionBankCsvDisplayPath} row ${index + 2} ${column} ${schemaError} for ${question.id}`,
            );
            continue;
          }
          if (actualValue !== String(expectedValue ?? '')) {
            fail(
              `content/question-bank.csv row ${index + 2} ${column} ${
                actualValue || 'missing'
              } does not match ${question.id}`,
            );
          }
        }
      });
    }

    if (identityColumns.every((column) => headerIndex.has(column)) && rowCountMatches) {
      questions.forEach((question, index) => {
        if (idOrderMismatch.has(index)) return;
        const row = rows[index] || [];
        for (const [column, expectedValue] of Object.entries(
          questionBankCsvIdentityFields(question),
        )) {
          const actualValue = row[headerIndex.get(column)];
          const schemaError = getQuestionBankIdentitySchemaError(column, actualValue);
          if (schemaError) {
            fail(
              `${questionBankCsvDisplayPath} row ${index + 2} ${column} ${schemaError} for ${question.id}`,
            );
            continue;
          }
          if (actualValue !== String(expectedValue ?? '')) {
            fail(
              `content/question-bank.csv row ${index + 2} ${column} ${
                actualValue || 'missing'
              } does not match ${question.id}`,
            );
          }
        }
      });
    }

    if (
      correctOptionColumns.every((column) => headerIndex.has(column)) &&
      optionColumns.every((column) => headerIndex.has(column)) &&
      rowCountMatches
    ) {
      const optionsJsonIndex = headerIndex.get('optionsJson');
      questions.forEach((question, index) => {
        if (idOrderMismatch.has(index)) return;
        const row = rows[index] || [];
        const optionsJsonValue = row[optionsJsonIndex];
        const optionsJsonSchemaError = getQuestionBankOptionsJsonSchemaError(optionsJsonValue);
        for (const [column, expectedValue] of Object.entries(
          questionBankCsvCorrectOptionField(question),
        )) {
          const actualValue = row[headerIndex.get(column)];
          if (optionsJsonSchemaError) {
            continue;
          }
          const schemaError = getQuestionBankCorrectOptionSchemaError(
            actualValue,
            optionsJsonValue,
          );
          if (schemaError) {
            fail(
              `${questionBankCsvDisplayPath} row ${index + 2} ${column} ${schemaError} for ${question.id}`,
            );
            continue;
          }
          if (actualValue !== String(expectedValue ?? '')) {
            fail(
              `content/question-bank.csv row ${index + 2} ${column} ${
                actualValue || 'missing'
              } does not match ${question.id}`,
            );
          }
        }
      });
    }

    if (promptColumns.every((column) => headerIndex.has(column)) && rowCountMatches) {
      questions.forEach((question, index) => {
        if (idOrderMismatch.has(index)) return;
        const row = rows[index] || [];
        for (const [column, expectedValue] of Object.entries(
          questionBankCsvPromptFields(question),
        )) {
          const actualValue = row[headerIndex.get(column)];
          const schemaError = getQuestionBankPromptSchemaError(actualValue);
          if (schemaError) {
            fail(
              `${questionBankCsvDisplayPath} row ${index + 2} ${column} ${schemaError} for ${question.id}`,
            );
            continue;
          }
          if (actualValue !== String(expectedValue ?? '')) {
            fail(
              `content/question-bank.csv row ${index + 2} ${column} ${
                actualValue || 'missing'
              } does not match ${question.id}`,
            );
          }
        }
      });
    }
  }
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
const uhrSourceMetadataComplete = Array.isArray(questions)
  ? questions.filter((question) =>
      Object.entries(expectedUhrSourceMetadata).every(
        ([field, expectedValue]) => question.uhrReference?.[field] === expectedValue,
      ),
    ).length
  : 0;
const chapterTitleParityComplete =
  Array.isArray(questions) && Array.isArray(chapters)
    ? questions.filter((question) => {
        const chapter = chapters.find((entry) => entry.id === question.chapterId);
        return chapter && question.uhrReference?.chapter === chapter.nameSv;
      }).length
    : 0;
const uhrPageRangeParityComplete =
  Array.isArray(questions) && Array.isArray(uhrChapterPageRanges)
    ? questions.filter((question) => {
        const pageRange = findUhrChapterPageRange(question.chapterId);
        return isPageInsideUhrRange(question.uhrReference?.pageApprox, pageRange);
      }).length
    : 0;
const uhrSectionParityComplete =
  Array.isArray(questions) && Array.isArray(uhrChapterPageRanges)
    ? questions.filter((question) => {
        const section = findUhrSectionReference(question.chapterId, question.uhrReference?.section);
        return isPageInsideUhrRange(question.uhrReference?.pageApprox, section);
      }).length
    : 0;
const questionOptionIdUniquenessComplete = Array.isArray(questions)
  ? questions.filter((question) => {
      if (!Array.isArray(question.options)) return false;
      const optionIds = question.options.map((option) => option.id);
      return optionIds.length === new Set(optionIds).size;
    }).length
  : 0;
const questionBankCsvOrderParityComplete = (() => {
  if (!Array.isArray(questions)) return 0;
  const questionBankCsv = questionBankCsvRows();
  if (!questionBankCsv) return 0;
  const idIndex = questionBankCsv.header.indexOf('id');
  if (idIndex === -1) return 0;
  const csvIds = questionBankCsv.rows.map((row) => row[idIndex]);
  return questions.filter((question, index) => csvIds[index] === question.id).length;
})();
const questionBankCsvRowCountParityComplete = (() => {
  if (!Array.isArray(questions)) return 0;
  const questionBankCsv = questionBankCsvRows();
  if (!questionBankCsv) return 0;
  return questionBankCsv.rows.length === questions.length ? questions.length : 0;
})();
const questionBankCsvUhrReferenceParityComplete = (() => {
  if (!Array.isArray(questions)) return 0;
  const questionBankCsv = questionBankCsvRows();
  if (!questionBankCsv) return 0;
  const headerIndex = new Map(questionBankCsv.header.map((column, index) => [column, index]));
  const uhrColumns = Object.keys(questionBankCsvUhrFields({}));
  if (!uhrColumns.every((column) => headerIndex.has(column))) return 0;
  return questions.filter((question, index) => {
    const row = questionBankCsv.rows[index] || [];
    return Object.entries(questionBankCsvUhrFields(question)).every(
      ([column, expectedValue]) => row[headerIndex.get(column)] === String(expectedValue ?? ''),
    );
  }).length;
})();
const questionBankCsvHeaderContractComplete = (() => {
  const questionBankCsv = questionBankCsvRows();
  if (!questionBankCsv) return 0;
  const header = questionBankCsv.header;
  const headerMatchesExportContract =
    header.length === QUESTION_BANK_CSV_HEADER.length &&
    QUESTION_BANK_CSV_HEADER.every((column, index) => header[index] === column);
  return headerMatchesExportContract ? QUESTION_BANK_CSV_HEADER.length : 0;
})();
const questionBankCsvOptionsParityComplete = (() => {
  if (!Array.isArray(questions)) return 0;
  const questionBankCsv = questionBankCsvRows();
  if (!questionBankCsv) return 0;
  const headerIndex = new Map(questionBankCsv.header.map((column, index) => [column, index]));
  const optionColumns = Object.keys(questionBankCsvOptionFields({ options: [] }));
  if (!optionColumns.every((column) => headerIndex.has(column))) return 0;
  return questions.filter((question, index) => {
    const row = questionBankCsv.rows[index] || [];
    return Object.entries(questionBankCsvOptionFields(question)).every(
      ([column, expectedValue]) => row[headerIndex.get(column)] === expectedValue,
    );
  }).length;
})();
const questionBankCsvOptionsJsonSchemaComplete = (() => {
  if (!Array.isArray(questions)) return 0;
  const questionBankCsv = questionBankCsvRows();
  if (!questionBankCsv) return 0;
  const headerIndex = new Map(questionBankCsv.header.map((column, index) => [column, index]));
  const optionsJsonIndex = headerIndex.get('optionsJson');
  if (optionsJsonIndex === undefined) return 0;
  return questions.filter((question, index) => {
    const row = questionBankCsv.rows[index] || [];
    return !getQuestionBankOptionsJsonSchemaError(row[optionsJsonIndex]);
  }).length;
})();
const questionBankCsvDifficultyTagSchemaComplete = (() => {
  if (!Array.isArray(questions)) return 0;
  const questionBankCsv = questionBankCsvRows();
  if (!questionBankCsv) return 0;
  const headerIndex = new Map(questionBankCsv.header.map((column, index) => [column, index]));
  const difficultyIndex = headerIndex.get('difficulty');
  const tagsIndex = headerIndex.get('tags');
  if (difficultyIndex === undefined || tagsIndex === undefined) return 0;
  return questions.filter((question, index) => {
    const row = questionBankCsv.rows[index] || [];
    const difficultyValue = row[difficultyIndex];
    const tagsValue = row[tagsIndex];
    return (
      !getQuestionBankDifficultySchemaError(difficultyValue) &&
      !getQuestionBankTagsSchemaError(tagsValue)
    );
  }).length;
})();
const questionBankCsvDifficultyTagParityComplete = (() => {
  if (!Array.isArray(questions)) return 0;
  const questionBankCsv = questionBankCsvRows();
  if (!questionBankCsv) return 0;
  const headerIndex = new Map(questionBankCsv.header.map((column, index) => [column, index]));
  const columns = Object.keys(questionBankCsvDifficultyTagFields({}));
  if (!columns.every((column) => headerIndex.has(column))) return 0;
  return questions.filter((question, index) => {
    const row = questionBankCsv.rows[index] || [];
    return Object.entries(questionBankCsvDifficultyTagFields(question)).every(
      ([column, expectedValue]) => row[headerIndex.get(column)] === String(expectedValue ?? ''),
    );
  }).length;
})();
const questionBankCsvTypeSchemaComplete = (() => {
  if (!Array.isArray(questions)) return 0;
  const questionBankCsv = questionBankCsvRows();
  if (!questionBankCsv) return 0;
  const headerIndex = new Map(questionBankCsv.header.map((column, index) => [column, index]));
  const typeIndex = headerIndex.get('type');
  if (typeIndex === undefined) return 0;
  return questions.filter((question, index) => {
    const row = questionBankCsv.rows[index] || [];
    return !getQuestionBankTypeSchemaError(row[typeIndex]);
  }).length;
})();
const questionBankCsvTypeParityComplete = (() => {
  if (!Array.isArray(questions)) return 0;
  const questionBankCsv = questionBankCsvRows();
  if (!questionBankCsv) return 0;
  const headerIndex = new Map(questionBankCsv.header.map((column, index) => [column, index]));
  const columns = Object.keys(questionBankCsvTypeField({}));
  if (!columns.every((column) => headerIndex.has(column))) return 0;
  return questions.filter((question, index) => {
    const row = questionBankCsv.rows[index] || [];
    return Object.entries(questionBankCsvTypeField(question)).every(
      ([column, expectedValue]) => row[headerIndex.get(column)] === String(expectedValue ?? ''),
    );
  }).length;
})();
const questionBankCsvExamScopeSchemaComplete = (() => {
  if (!Array.isArray(questions)) return 0;
  const questionBankCsv = questionBankCsvRows();
  if (!questionBankCsv) return 0;
  const headerIndex = new Map(questionBankCsv.header.map((column, index) => [column, index]));
  const examScopeIndex = headerIndex.get('examScope');
  if (examScopeIndex === undefined) return 0;
  return questions.filter((question, index) => {
    const row = questionBankCsv.rows[index] || [];
    return !getQuestionBankExamScopeSchemaError(row[examScopeIndex]);
  }).length;
})();
const questionBankCsvExamScopeParityComplete = (() => {
  if (!Array.isArray(questions)) return 0;
  const questionBankCsv = questionBankCsvRows();
  if (!questionBankCsv) return 0;
  const headerIndex = new Map(questionBankCsv.header.map((column, index) => [column, index]));
  const columns = Object.keys(questionBankCsvExamScopeField({}));
  if (!columns.every((column) => headerIndex.has(column))) return 0;
  return questions.filter((question, index) => {
    const row = questionBankCsv.rows[index] || [];
    return Object.entries(questionBankCsvExamScopeField(question)).every(
      ([column, expectedValue]) => row[headerIndex.get(column)] === String(expectedValue ?? ''),
    );
  }).length;
})();
const questionBankCsvUhrSourceSchemaComplete = (() => {
  if (!Array.isArray(questions)) return 0;
  const questionBankCsv = questionBankCsvRows();
  if (!questionBankCsv) return 0;
  const headerIndex = new Map(questionBankCsv.header.map((column, index) => [column, index]));
  const columns = Object.keys(questionBankCsvUhrSourceFields({ uhrReference: {} }));
  if (!columns.every((column) => headerIndex.has(column))) return 0;
  return questions.filter((question, index) => {
    const row = questionBankCsv.rows[index] || [];
    return columns.every(
      (column) => !getQuestionBankUhrSourceSchemaError(column, row[headerIndex.get(column)]),
    );
  }).length;
})();
const questionBankCsvUhrSourceParityComplete = (() => {
  if (!Array.isArray(questions)) return 0;
  const questionBankCsv = questionBankCsvRows();
  if (!questionBankCsv) return 0;
  const headerIndex = new Map(questionBankCsv.header.map((column, index) => [column, index]));
  const columns = Object.keys(questionBankCsvUhrSourceFields({ uhrReference: {} }));
  if (!columns.every((column) => headerIndex.has(column))) return 0;
  return questions.filter((question, index) => {
    const row = questionBankCsv.rows[index] || [];
    return Object.entries(questionBankCsvUhrSourceFields(question)).every(
      ([column, expectedValue]) => row[headerIndex.get(column)] === String(expectedValue ?? ''),
    );
  }).length;
})();
const questionBankCsvIdentitySchemaComplete = (() => {
  if (!Array.isArray(questions)) return 0;
  const questionBankCsv = questionBankCsvRows();
  if (!questionBankCsv) return 0;
  const headerIndex = new Map(questionBankCsv.header.map((column, index) => [column, index]));
  const columns = Object.keys(questionBankCsvIdentityFields({}));
  if (!columns.every((column) => headerIndex.has(column))) return 0;
  return questions.filter((question, index) => {
    const row = questionBankCsv.rows[index] || [];
    return columns.every(
      (column) => !getQuestionBankIdentitySchemaError(column, row[headerIndex.get(column)]),
    );
  }).length;
})();
const questionBankCsvIdentityParityComplete = (() => {
  if (!Array.isArray(questions)) return 0;
  const questionBankCsv = questionBankCsvRows();
  if (!questionBankCsv) return 0;
  const headerIndex = new Map(questionBankCsv.header.map((column, index) => [column, index]));
  const columns = Object.keys(questionBankCsvIdentityFields({}));
  if (!columns.every((column) => headerIndex.has(column))) return 0;
  return questions.filter((question, index) => {
    const row = questionBankCsv.rows[index] || [];
    return Object.entries(questionBankCsvIdentityFields(question)).every(
      ([column, expectedValue]) => row[headerIndex.get(column)] === String(expectedValue ?? ''),
    );
  }).length;
})();
const questionBankCsvCorrectOptionSchemaComplete = (() => {
  if (!Array.isArray(questions)) return 0;
  const questionBankCsv = questionBankCsvRows();
  if (!questionBankCsv) return 0;
  const headerIndex = new Map(questionBankCsv.header.map((column, index) => [column, index]));
  const correctOptionIndex = headerIndex.get('correctOptionId');
  const optionsJsonIndex = headerIndex.get('optionsJson');
  if (correctOptionIndex === undefined || optionsJsonIndex === undefined) return 0;
  return questions.filter((question, index) => {
    const row = questionBankCsv.rows[index] || [];
    const optionsJsonValue = row[optionsJsonIndex];
    if (getQuestionBankOptionsJsonSchemaError(optionsJsonValue)) return false;
    return !getQuestionBankCorrectOptionSchemaError(row[correctOptionIndex], optionsJsonValue);
  }).length;
})();
const questionBankCsvCorrectOptionParityComplete = (() => {
  if (!Array.isArray(questions)) return 0;
  const questionBankCsv = questionBankCsvRows();
  if (!questionBankCsv) return 0;
  const headerIndex = new Map(questionBankCsv.header.map((column, index) => [column, index]));
  const columns = Object.keys(questionBankCsvCorrectOptionField({}));
  if (!columns.every((column) => headerIndex.has(column))) return 0;
  return questions.filter((question, index) => {
    const row = questionBankCsv.rows[index] || [];
    return Object.entries(questionBankCsvCorrectOptionField(question)).every(
      ([column, expectedValue]) => row[headerIndex.get(column)] === String(expectedValue ?? ''),
    );
  }).length;
})();
const questionBankCsvPromptSchemaComplete = (() => {
  if (!Array.isArray(questions)) return 0;
  const questionBankCsv = questionBankCsvRows();
  if (!questionBankCsv) return 0;
  const headerIndex = new Map(questionBankCsv.header.map((column, index) => [column, index]));
  const columns = Object.keys(questionBankCsvPromptFields({}));
  if (!columns.every((column) => headerIndex.has(column))) return 0;
  return questions.filter((question, index) => {
    const row = questionBankCsv.rows[index] || [];
    return columns.every(
      (column) => !getQuestionBankPromptSchemaError(row[headerIndex.get(column)]),
    );
  }).length;
})();
const questionBankCsvPromptParityComplete = (() => {
  if (!Array.isArray(questions)) return 0;
  const questionBankCsv = questionBankCsvRows();
  if (!questionBankCsv) return 0;
  const headerIndex = new Map(questionBankCsv.header.map((column, index) => [column, index]));
  const columns = Object.keys(questionBankCsvPromptFields({}));
  if (!columns.every((column) => headerIndex.has(column))) return 0;
  return questions.filter((question, index) => {
    const row = questionBankCsv.rows[index] || [];
    return Object.entries(questionBankCsvPromptFields(question)).every(
      ([column, expectedValue]) => row[headerIndex.get(column)] === String(expectedValue ?? ''),
    );
  }).length;
})();

console.log('Content validation OK');
console.log(
  JSON.stringify(
    {
      chapters: chapters.length,
      questions: questions.length,
      publishedQuestions,
      uhrSourceMetadataComplete,
      chapterTitleParityComplete,
      uhrPageRangeParityComplete,
      uhrSectionParityComplete,
      questionOptionIdUniquenessComplete,
      questionBankCsvRowCountParityComplete,
      questionBankCsvOrderParityComplete,
      questionBankCsvUhrReferenceParityComplete,
      questionBankCsvHeaderContractComplete,
      questionBankCsvOptionsJsonSchemaComplete,
      questionBankCsvOptionsParityComplete,
      questionBankCsvDifficultyTagSchemaComplete,
      questionBankCsvDifficultyTagParityComplete,
      questionBankCsvTypeSchemaComplete,
      questionBankCsvTypeParityComplete,
      questionBankCsvExamScopeSchemaComplete,
      questionBankCsvExamScopeParityComplete,
      questionBankCsvUhrSourceSchemaComplete,
      questionBankCsvUhrSourceParityComplete,
      questionBankCsvIdentitySchemaComplete,
      questionBankCsvIdentityParityComplete,
      questionBankCsvCorrectOptionSchemaComplete,
      questionBankCsvCorrectOptionParityComplete,
      questionBankCsvPromptSchemaComplete,
      questionBankCsvPromptParityComplete,
    },
    null,
    2,
  ),
);
