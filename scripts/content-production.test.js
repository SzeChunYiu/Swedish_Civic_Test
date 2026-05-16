const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const {
  assertUniqueExportQuestionIds,
  QUESTION_BANK_CSV_HEADER,
  serializeQuestionOptions,
} = require('./export-question-bank.js');

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

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

test('full content production validates 500 published UHR-referenced questions', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  const summary = JSON.parse(match[0]);
  assert.equal(summary.questions, 500);
  assert.equal(summary.publishedQuestions, 500);
  assert.equal(summary.uhrSourceMetadataComplete, 500);
  assert.equal(summary.chapterTitleParityComplete, 500);
  assert.equal(summary.uhrPageRangeParityComplete, 500);
  assert.equal(summary.uhrSectionParityComplete, 500);
  assert.equal(summary.questionOptionIdUniquenessComplete, 500);
  assert.equal(summary.questionBankCsvRowCountParityComplete, 500);
  assert.equal(summary.questionBankCsvOrderParityComplete, 500);
  assert.equal(summary.questionBankCsvUhrReferenceParityComplete, 500);
  assert.equal(summary.questionBankCsvHeaderContractComplete, QUESTION_BANK_CSV_HEADER.length);
  assert.equal(summary.questionBankCsvOptionsJsonSchemaComplete, 500);
  assert.equal(summary.questionBankCsvOptionsParityComplete, 500);
  assert.equal(summary.questionBankCsvDifficultyTagSchemaComplete, 500);
  assert.equal(summary.questionBankCsvDifficultyTagParityComplete, 500);
  assert.equal(summary.questionBankCsvTypeSchemaComplete, 500);
  assert.equal(summary.questionBankCsvTypeParityComplete, 500);
  assert.equal(summary.questionBankCsvExamScopeSchemaComplete, 500);
  assert.equal(summary.questionBankCsvExamScopeParityComplete, 500);
  assert.equal(summary.questionBankCsvUhrSourceSchemaComplete, 500);
  assert.equal(summary.questionBankCsvUhrSourceParityComplete, 500);
  assert.equal(summary.questionBankCsvIdentitySchemaComplete, 500);
  assert.equal(summary.questionBankCsvIdentityParityComplete, 500);
  assert.equal(summary.questionBankCsvCorrectOptionSchemaComplete, 500);
  assert.equal(summary.questionBankCsvCorrectOptionParityComplete, 500);
  assert.equal(summary.questionBankCsvPromptSchemaComplete, 500);
  assert.equal(summary.questionBankCsvPromptParityComplete, 500);
});

test('published questions keep answer option IDs unique within each question', () => {
  const { questions } = loadTs('data/questions.ts');

  assert.equal(questions.length, 500);

  for (const question of questions) {
    const optionIds = question.options.map((option) => option.id);
    assert.equal(
      new Set(optionIds).size,
      optionIds.length,
      `${question.id} should not reuse answer option IDs`,
    );
    assert.ok(
      optionIds.includes(question.correctOptionId),
      `${question.id} correctOptionId should point at exactly one answer option`,
    );
  }
});

test('generated question variants preserve their source UHR references exactly', () => {
  const { sourceQuestions, generatedPublishedQuestions } = loadTs('data/questions.ts');
  const firstGeneratedId = 101;
  const variantsPerSource = 4;

  assert.ok(sourceQuestions.length > 0, 'source questions should be exported for parity checks');
  assert.ok(
    generatedPublishedQuestions.length > 0,
    'generated variants should be exported for UHR reference parity checks',
  );

  for (const question of generatedPublishedQuestions) {
    const numericId = Number(String(question.id).replace(/^q/, ''));
    const variantOffset = numericId - firstGeneratedId;
    const sourceIndex = Math.floor(variantOffset / variantsPerSource);
    const source = sourceQuestions[sourceIndex];

    assert.ok(
      Number.isInteger(numericId) && variantOffset >= 0,
      `${question.id} should use the generated q101+ id range`,
    );
    assert.ok(source, `${question.id} should map back to source question index ${sourceIndex}`);
    assert.equal(
      question.chapterId,
      source.chapterId,
      `${question.id} chapter should match source`,
    );
    assert.equal(
      question.examScope,
      source.examScope,
      `${question.id} exam scope should match source`,
    );
    assert.deepEqual(
      question.uhrReference,
      source.uhrReference,
      `${question.id} UHR reference should match ${source.id}`,
    );
    assert.equal(question.reviewStatus, 'published');
  }
});

test('question IDs are unique and exported in production order', () => {
  const { questions, generatedPublishedQuestions } = loadTs('data/questions.ts');
  const ids = questions.map((question) => question.id);
  const generatedIds = generatedPublishedQuestions.map((question) => question.id);
  const csvLines = fs.readFileSync('content/question-bank.csv', 'utf8').trim().split('\n');
  const header = parseCsvLine(csvLines[0]);
  const idIndex = header.indexOf('id');
  const csvIds = csvLines.slice(1).map((line) => parseCsvLine(line)[idIndex]);

  assert.equal(new Set(ids).size, ids.length, 'question IDs should be unique');
  assert.equal(new Set(generatedIds).size, generatedIds.length, 'generated IDs should be unique');
  assert.ok(idIndex > -1, 'CSV should include id');
  assert.deepEqual(csvIds, ids, 'CSV row IDs should match data/questions.ts order');

  generatedIds.forEach((id, index) => {
    const expectedId = `q${String(101 + index).padStart(3, '0')}`;
    assert.equal(id, expectedId, `generated ID ${id} should be ${expectedId}`);
  });
});

test('question bank export refuses duplicate question IDs before writing CSV rows', () => {
  assert.doesNotThrow(() => {
    assertUniqueExportQuestionIds([{ id: 'q001' }, { id: 'q002' }]);
  });
  assert.throws(
    () => assertUniqueExportQuestionIds([{ id: 'q001' }, { id: 'q001' }]),
    /Duplicate question id q001 would be exported to question-bank\.csv/,
  );
});

test('exported question bank header matches the export contract exactly', () => {
  const csvLines = fs.readFileSync('content/question-bank.csv', 'utf8').trim().split('\n');
  const header = parseCsvLine(csvLines[0]);

  assert.deepEqual(header, QUESTION_BANK_CSV_HEADER);
});

test('exported question bank preserves UHR reference metadata for each row', () => {
  const { questions } = loadTs('data/questions.ts');
  const lines = fs.readFileSync('content/question-bank.csv', 'utf8').trim().split('\n');
  const header = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map(parseCsvLine);
  const headerIndex = new Map(header.map((column, index) => [column, index]));
  const uhrColumns = [
    'uhrChapter',
    'uhrSection',
    'uhrPageApprox',
    'uhrDocumentTitle',
    'uhrSourceEdition',
    'uhrSourceUrl',
  ];

  for (const column of uhrColumns) {
    assert.ok(headerIndex.has(column), `CSV should include ${column}`);
  }

  questions.forEach((question, index) => {
    const row = rows[index];
    const expectedValues = {
      uhrChapter: question.uhrReference.chapter,
      uhrSection: question.uhrReference.section,
      uhrPageApprox: question.uhrReference.pageApprox,
      uhrDocumentTitle: question.uhrReference.documentTitle,
      uhrSourceEdition: question.uhrReference.sourceEdition,
      uhrSourceUrl: question.uhrReference.sourceUrl,
    };

    for (const [column, expectedValue] of Object.entries(expectedValues)) {
      assert.equal(
        row[headerIndex.get(column)],
        String(expectedValue),
        `${question.id} ${column} should match data/questions.ts`,
      );
    }
  });
});

test('exported question bank preserves serialized answer options for each row', () => {
  const { questions } = loadTs('data/questions.ts');
  const lines = fs.readFileSync('content/question-bank.csv', 'utf8').trim().split('\n');
  const header = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map(parseCsvLine);
  const optionsJsonIndex = header.indexOf('optionsJson');

  assert.ok(optionsJsonIndex > -1, 'CSV should include optionsJson');

  questions.forEach((question, index) => {
    const actualOptionsJson = rows[index][optionsJsonIndex];
    const expectedOptionsJson = serializeQuestionOptions(question);

    assert.equal(
      actualOptionsJson,
      expectedOptionsJson,
      `${question.id} optionsJson should match data/questions.ts`,
    );
    assert.deepEqual(JSON.parse(actualOptionsJson), question.options);
  });
});

test('content validator rejects invalid CSV optionsJson values', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'civic-question-bank-'));

  try {
    const lines = fs.readFileSync('content/question-bank.csv', 'utf8').trim().split('\n');
    const header = parseCsvLine(lines[0]);
    const optionsJsonIndex = header.indexOf('optionsJson');

    assert.ok(optionsJsonIndex > -1, 'CSV should include optionsJson');

    const invalidCases = [
      {
        name: 'malformed',
        value: '{not-json',
        expectedMessage: /row 2 optionsJson is not valid JSON for q001/,
      },
      {
        name: 'non-array',
        value: '{"id":"a"}',
        expectedMessage: /row 2 optionsJson must be a JSON array for q001/,
      },
      {
        name: 'missing-text',
        value: JSON.stringify([{ id: 'a', textSv: 'Ja' }]),
        expectedMessage: /row 2 optionsJson option 1 must include string textEn for q001/,
      },
      {
        name: 'option-text-trim',
        value: JSON.stringify([{ id: 'a', textSv: ' Ja', textEn: 'Yes' }]),
        expectedMessage:
          /row 2 optionsJson option 1 textSv must not start or end with whitespace for q001/,
      },
    ];

    for (const invalidCase of invalidCases) {
      const firstRow = parseCsvLine(lines[1]);
      const tempCsvPath = path.join(tempDir, `question-bank-${invalidCase.name}-options.csv`);
      firstRow[optionsJsonIndex] = invalidCase.value;
      const malformedLines = [...lines];
      malformedLines[1] = firstRow.map(csvCell).join(',');
      fs.writeFileSync(tempCsvPath, `${malformedLines.join('\n')}\n`);

      let validationError;
      try {
        execFileSync(process.execPath, ['scripts/validate-content.js'], {
          encoding: 'utf8',
          env: {
            ...process.env,
            QUESTION_BANK_CSV_PATH: tempCsvPath,
          },
        });
      } catch (error) {
        validationError = error;
      }

      assert.ok(validationError, `${invalidCase.name} optionsJson should fail content validation`);
      assert.match(
        `${validationError.stdout || ''}\n${validationError.stderr || ''}`,
        invalidCase.expectedMessage,
      );
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('content validator rejects invalid CSV difficulty and tags schema values', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'civic-question-bank-difficulty-tags-'));

  try {
    const lines = fs.readFileSync('content/question-bank.csv', 'utf8').trim().split('\n');
    const header = parseCsvLine(lines[0]);
    const difficultyIndex = header.indexOf('difficulty');
    const tagsIndex = header.indexOf('tags');

    assert.ok(difficultyIndex > -1, 'CSV should include difficulty');
    assert.ok(tagsIndex > -1, 'CSV should include tags');

    const invalidCases = [
      {
        name: 'difficulty-invalid',
        update: (row) => {
          row[difficultyIndex] = 'expert';
        },
        expectedMessage: /row 2 difficulty must be one of easy, medium, hard for q001/,
      },
      {
        name: 'tags-empty-entry',
        update: (row) => {
          row[tagsIndex] = 'citizenship\|\|sweden';
        },
        expectedMessage: /row 2 tags must not include empty tag values for q001/,
      },
    ];

    for (const invalidCase of invalidCases) {
      const firstRow = parseCsvLine(lines[1]);
      const tempCsvPath = path.join(tempDir, `question-bank-${invalidCase.name}.csv`);
      invalidCase.update(firstRow);
      const malformedLines = [...lines];
      malformedLines[1] = firstRow.map(csvCell).join(',');
      fs.writeFileSync(tempCsvPath, `${malformedLines.join('\n')}\n`);

      let validationError;
      try {
        execFileSync(process.execPath, ['scripts/validate-content.js'], {
          encoding: 'utf8',
          env: {
            ...process.env,
            QUESTION_BANK_CSV_PATH: tempCsvPath,
          },
        });
      } catch (error) {
        validationError = error;
      }

      assert.ok(
        validationError,
        `${invalidCase.name} difficulty/tags schema should fail content validation`,
      );
      assert.match(
        `${validationError.stdout || ''}\n${validationError.stderr || ''}`,
        invalidCase.expectedMessage,
      );
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('content validator rejects invalid CSV type schema values', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'civic-question-bank-type-'));

  try {
    const lines = fs.readFileSync('content/question-bank.csv', 'utf8').trim().split('\n');
    const header = parseCsvLine(lines[0]);
    const typeIndex = header.indexOf('type');

    assert.ok(typeIndex > -1, 'CSV should include type');

    const firstRow = parseCsvLine(lines[1]);
    const tempCsvPath = path.join(tempDir, 'question-bank-invalid-type.csv');
    firstRow[typeIndex] = 'multiple_choice';
    const malformedLines = [...lines];
    malformedLines[1] = firstRow.map(csvCell).join(',');
    fs.writeFileSync(tempCsvPath, `${malformedLines.join('\n')}\n`);

    let validationError;
    try {
      execFileSync(process.execPath, ['scripts/validate-content.js'], {
        encoding: 'utf8',
        env: {
          ...process.env,
          QUESTION_BANK_CSV_PATH: tempCsvPath,
        },
      });
    } catch (error) {
      validationError = error;
    }

    assert.ok(validationError, 'invalid type schema should fail content validation');
    assert.match(
      `${validationError.stdout || ''}\n${validationError.stderr || ''}`,
      /row 2 type must be one of single_choice, true_false, flashcard for q001/,
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('content validator rejects invalid CSV examScope schema values', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'civic-question-bank-exam-scope-'));

  try {
    const lines = fs.readFileSync('content/question-bank.csv', 'utf8').trim().split('\n');
    const header = parseCsvLine(lines[0]);
    const examScopeIndex = header.indexOf('examScope');

    assert.ok(examScopeIndex > -1, 'CSV should include examScope');

    const firstRow = parseCsvLine(lines[1]);
    const tempCsvPath = path.join(tempDir, 'question-bank-invalid-exam-scope.csv');
    firstRow[examScopeIndex] = 'full_exam';
    const malformedLines = [...lines];
    malformedLines[1] = firstRow.map(csvCell).join(',');
    fs.writeFileSync(tempCsvPath, `${malformedLines.join('\n')}\n`);

    let validationError;
    try {
      execFileSync(process.execPath, ['scripts/validate-content.js'], {
        encoding: 'utf8',
        env: {
          ...process.env,
          QUESTION_BANK_CSV_PATH: tempCsvPath,
        },
      });
    } catch (error) {
      validationError = error;
    }

    assert.ok(validationError, 'invalid examScope schema should fail content validation');
    assert.match(
      `${validationError.stdout || ''}\n${validationError.stderr || ''}`,
      /row 2 examScope must be one of uhr_based, official_context, vocabulary_support, background_learning for q001/,
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('content validator rejects invalid CSV UHR source metadata schema values', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'civic-question-bank-uhr-source-'));

  try {
    const lines = fs.readFileSync('content/question-bank.csv', 'utf8').trim().split('\n');
    const header = parseCsvLine(lines[0]);
    const sourceUrlIndex = header.indexOf('uhrSourceUrl');
    const documentTitleIndex = header.indexOf('uhrDocumentTitle');

    assert.ok(sourceUrlIndex > -1, 'CSV should include uhrSourceUrl');
    assert.ok(documentTitleIndex > -1, 'CSV should include uhrDocumentTitle');

    const invalidCases = [
      {
        name: 'invalid-source-url',
        update: (row) => {
          row[sourceUrlIndex] = 'not-a-url';
        },
        expectedMessage: /row 2 uhrSourceUrl must be a valid URL for q001/,
      },
      {
        name: 'empty-source-url',
        update: (row) => {
          row[sourceUrlIndex] = '';
        },
        expectedMessage: /row 2 uhrSourceUrl must be a non-empty string for q001/,
      },
      {
        name: 'non-http-source-url',
        update: (row) => {
          row[sourceUrlIndex] = 'ftp://example.com/source.pdf';
        },
        expectedMessage: /row 2 uhrSourceUrl must be an http\(s\) URL for q001/,
      },
      {
        name: 'empty-document-title',
        update: (row) => {
          row[documentTitleIndex] = '';
        },
        expectedMessage: /row 2 uhrDocumentTitle must be a non-empty string for q001/,
      },
      {
        name: 'source-edition-leading-space',
        update: (row) => {
          const sourceEditionIndex = header.indexOf('uhrSourceEdition');
          row[sourceEditionIndex] = ` ${row[sourceEditionIndex]}`;
        },
        expectedMessage: /row 2 uhrSourceEdition must not start or end with whitespace for q001/,
      },
      {
        name: 'empty-source-edition',
        update: (row) => {
          const sourceEditionIndex = header.indexOf('uhrSourceEdition');
          row[sourceEditionIndex] = '';
        },
        expectedMessage: /row 2 uhrSourceEdition must be a non-empty string for q001/,
      },
      {
        name: 'document-title-trailing-space',
        update: (row) => {
          row[documentTitleIndex] = `${row[documentTitleIndex]} `;
        },
        expectedMessage: /row 2 uhrDocumentTitle must not start or end with whitespace for q001/,
      },
    ];

    for (const invalidCase of invalidCases) {
      const firstRow = parseCsvLine(lines[1]);
      const tempCsvPath = path.join(tempDir, `question-bank-${invalidCase.name}.csv`);
      invalidCase.update(firstRow);
      const malformedLines = [...lines];
      malformedLines[1] = firstRow.map(csvCell).join(',');
      fs.writeFileSync(tempCsvPath, `${malformedLines.join('\n')}\n`);

      let validationError;
      try {
        execFileSync(process.execPath, ['scripts/validate-content.js'], {
          encoding: 'utf8',
          env: {
            ...process.env,
            QUESTION_BANK_CSV_PATH: tempCsvPath,
          },
        });
      } catch (error) {
        validationError = error;
      }

      assert.ok(validationError, `${invalidCase.name} should fail content validation`);
      assert.match(
        `${validationError.stdout || ''}\n${validationError.stderr || ''}`,
        invalidCase.expectedMessage,
      );
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('content validator rejects invalid CSV identity schema values', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'civic-question-bank-identity-'));

  try {
    const lines = fs.readFileSync('content/question-bank.csv', 'utf8').trim().split('\n');
    const header = parseCsvLine(lines[0]);
    const idIndex = header.indexOf('id');
    const chapterIdIndex = header.indexOf('chapterId');

    assert.ok(idIndex > -1, 'CSV should include id');
    assert.ok(chapterIdIndex > -1, 'CSV should include chapterId');

    const invalidCases = [
      {
        name: 'invalid-id-format',
        update: (row) => {
          row[idIndex] = 'q1';
        },
        expectedMessage: /row 2 id q1 does not match q001/,
      },
      {
        name: 'invalid-chapterid-format',
        update: (row) => {
          row[chapterIdIndex] = 'chapter01';
        },
        expectedMessage: /row 2 chapterId must match chNN format for q001/,
      },
      {
        name: 'empty-chapterid',
        update: (row) => {
          row[chapterIdIndex] = '';
        },
        expectedMessage: /row 2 chapterId must be a non-empty string for q001/,
      },
    ];

    for (const invalidCase of invalidCases) {
      const firstRow = parseCsvLine(lines[1]);
      const tempCsvPath = path.join(tempDir, `question-bank-${invalidCase.name}.csv`);
      invalidCase.update(firstRow);
      const malformedLines = [...lines];
      malformedLines[1] = firstRow.map(csvCell).join(',');
      fs.writeFileSync(tempCsvPath, `${malformedLines.join('\n')}\n`);

      let validationError;
      try {
        execFileSync(process.execPath, ['scripts/validate-content.js'], {
          encoding: 'utf8',
          env: {
            ...process.env,
            QUESTION_BANK_CSV_PATH: tempCsvPath,
          },
        });
      } catch (error) {
        validationError = error;
      }

      assert.ok(validationError, `${invalidCase.name} should fail content validation`);
      assert.match(
        `${validationError.stdout || ''}\n${validationError.stderr || ''}`,
        invalidCase.expectedMessage,
      );
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('content validator rejects invalid CSV correctOptionId schema values', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'civic-question-bank-correct-option-'));

  try {
    const lines = fs.readFileSync('content/question-bank.csv', 'utf8').trim().split('\n');
    const header = parseCsvLine(lines[0]);
    const correctOptionIdIndex = header.indexOf('correctOptionId');

    assert.ok(correctOptionIdIndex > -1, 'CSV should include correctOptionId');

    const invalidCases = [
      {
        name: 'missing-correct-option-id',
        value: '',
        expectedMessage: /row 2 correctOptionId must be a non-empty string for q001/,
      },
      {
        name: 'invalid-correct-option-id',
        value: 'z',
        expectedMessage: /row 2 correctOptionId must match one option id in optionsJson for q001/,
      },
    ];

    for (const invalidCase of invalidCases) {
      const firstRow = parseCsvLine(lines[1]);
      const tempCsvPath = path.join(tempDir, `question-bank-${invalidCase.name}.csv`);
      firstRow[correctOptionIdIndex] = invalidCase.value;
      const malformedLines = [...lines];
      malformedLines[1] = firstRow.map(csvCell).join(',');
      fs.writeFileSync(tempCsvPath, `${malformedLines.join('\n')}\n`);

      let validationError;
      try {
        execFileSync(process.execPath, ['scripts/validate-content.js'], {
          encoding: 'utf8',
          env: {
            ...process.env,
            QUESTION_BANK_CSV_PATH: tempCsvPath,
          },
        });
      } catch (error) {
        validationError = error;
      }

      assert.ok(validationError, `${invalidCase.name} should fail content validation`);
      assert.match(
        `${validationError.stdout || ''}\n${validationError.stderr || ''}`,
        invalidCase.expectedMessage,
      );
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('optionsJson schema failures do not cascade into correctOptionId errors', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'civic-question-bank-options-nocascade-'));

  try {
    const lines = fs.readFileSync('content/question-bank.csv', 'utf8').trim().split('\n');
    const header = parseCsvLine(lines[0]);
    const optionsJsonIndex = header.indexOf('optionsJson');

    assert.ok(optionsJsonIndex > -1, 'CSV should include optionsJson');

    const firstRow = parseCsvLine(lines[1]);
    const tempCsvPath = path.join(tempDir, 'question-bank-malformed-options-no-cascade.csv');
    firstRow[optionsJsonIndex] = '{not-json';
    const malformedLines = [...lines];
    malformedLines[1] = firstRow.map(csvCell).join(',');
    fs.writeFileSync(tempCsvPath, `${malformedLines.join('\n')}\n`);

    let validationError;
    try {
      execFileSync(process.execPath, ['scripts/validate-content.js'], {
        encoding: 'utf8',
        env: {
          ...process.env,
          QUESTION_BANK_CSV_PATH: tempCsvPath,
        },
      });
    } catch (error) {
      validationError = error;
    }

    assert.ok(validationError, 'malformed optionsJson should fail content validation');
    const output = `${validationError.stdout || ''}\n${validationError.stderr || ''}`;
    assert.match(output, /row 2 optionsJson is not valid JSON for q001/);
    assert.doesNotMatch(
      output,
      /row 2 correctOptionId cannot be validated because optionsJson is invalid for q001/,
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('content validator rejects CSV row count parity drift', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'civic-question-bank-row-count-'));

  try {
    const lines = fs.readFileSync('content/question-bank.csv', 'utf8').trim().split('\n');
    const tempCsvPath = path.join(tempDir, 'question-bank-missing-last-row.csv');
    const malformedLines = lines.slice(0, -1);
    fs.writeFileSync(tempCsvPath, `${malformedLines.join('\n')}\n`);

    let validationError;
    try {
      execFileSync(process.execPath, ['scripts/validate-content.js'], {
        encoding: 'utf8',
        env: {
          ...process.env,
          QUESTION_BANK_CSV_PATH: tempCsvPath,
        },
      });
    } catch (error) {
      validationError = error;
    }

    assert.ok(validationError, 'missing CSV row should fail content validation');
    assert.match(
      `${validationError.stdout || ''}\n${validationError.stderr || ''}`,
      /has 499 rows but questions export has 500/,
    );
    assert.doesNotMatch(
      `${validationError.stdout || ''}\n${validationError.stderr || ''}`,
      /row 501 .* does not match q449/,
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('content validator rejects CSV row order parity drift', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'civic-question-bank-row-order-'));

  try {
    const lines = fs.readFileSync('content/question-bank.csv', 'utf8').trim().split('\n');
    const tempCsvPath = path.join(tempDir, 'question-bank-swapped-rows.csv');
    const malformedLines = [...lines];
    [malformedLines[1], malformedLines[2]] = [malformedLines[2], malformedLines[1]];
    fs.writeFileSync(tempCsvPath, `${malformedLines.join('\n')}\n`);

    let validationError;
    try {
      execFileSync(process.execPath, ['scripts/validate-content.js'], {
        encoding: 'utf8',
        env: {
          ...process.env,
          QUESTION_BANK_CSV_PATH: tempCsvPath,
        },
      });
    } catch (error) {
      validationError = error;
    }

    assert.ok(validationError, 'swapped CSV rows should fail content validation');
    const output = `${validationError.stdout || ''}\n${validationError.stderr || ''}`;
    assert.match(output, /row 2 id q002 does not match q001/);
    assert.match(output, /row 3 id q001 does not match q002/);
    assert.equal(
      (output.match(/row 2 id q002 does not match q001/g) || []).length,
      1,
      'row 2 id mismatch should not be duplicated',
    );
    assert.equal(
      (output.match(/row 3 id q001 does not match q002/g) || []).length,
      1,
      'row 3 id mismatch should not be duplicated',
    );
    assert.doesNotMatch(
      output,
      /row 2 tags geography\|arctic-circle\|true-false does not match q001/,
    );
    assert.doesNotMatch(output, /row 2 type true_false does not match q001/);
    assert.doesNotMatch(output, /row 2 optionsJson does not match q001/);
    assert.doesNotMatch(output, /row 3 optionsJson does not match q002/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('content validator reports optionsJson parity drift when row identity is stable', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'civic-question-bank-options-parity-'));

  try {
    const { questions } = loadTs('data/questions.ts');
    const lines = fs.readFileSync('content/question-bank.csv', 'utf8').trim().split('\n');
    const header = parseCsvLine(lines[0]);
    const optionsJsonIndex = header.indexOf('optionsJson');

    assert.ok(optionsJsonIndex > -1, 'CSV should include optionsJson');

    const firstRow = parseCsvLine(lines[1]);
    const tempCsvPath = path.join(tempDir, 'question-bank-options-parity-drift.csv');
    firstRow[optionsJsonIndex] = serializeQuestionOptions(questions[1]);
    const malformedLines = [...lines];
    malformedLines[1] = firstRow.map(csvCell).join(',');
    fs.writeFileSync(tempCsvPath, `${malformedLines.join('\n')}\n`);

    let validationError;
    try {
      execFileSync(process.execPath, ['scripts/validate-content.js'], {
        encoding: 'utf8',
        env: {
          ...process.env,
          QUESTION_BANK_CSV_PATH: tempCsvPath,
        },
      });
    } catch (error) {
      validationError = error;
    }

    assert.ok(validationError, 'optionsJson parity drift should fail content validation');
    const output = `${validationError.stdout || ''}\n${validationError.stderr || ''}`;
    assert.match(output, /row 2 optionsJson does not match q001/);
    assert.doesNotMatch(output, /row 2 id .* does not match q001/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('content validator rejects invalid CSV prompt schema values', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'civic-question-bank-prompt-'));

  try {
    const lines = fs.readFileSync('content/question-bank.csv', 'utf8').trim().split('\n');
    const header = parseCsvLine(lines[0]);
    const questionEnIndex = header.indexOf('questionEn');

    assert.ok(questionEnIndex > -1, 'CSV should include questionEn');

    const firstRow = parseCsvLine(lines[1]);
    const tempCsvPath = path.join(tempDir, 'question-bank-invalid-question-en.csv');
    firstRow[questionEnIndex] = ' ';
    const malformedLines = [...lines];
    malformedLines[1] = firstRow.map(csvCell).join(',');
    fs.writeFileSync(tempCsvPath, `${malformedLines.join('\n')}\n`);

    let validationError;
    try {
      execFileSync(process.execPath, ['scripts/validate-content.js'], {
        encoding: 'utf8',
        env: {
          ...process.env,
          QUESTION_BANK_CSV_PATH: tempCsvPath,
        },
      });
    } catch (error) {
      validationError = error;
    }

    assert.ok(validationError, 'invalid prompt schema should fail content validation');
    assert.match(
      `${validationError.stdout || ''}\n${validationError.stderr || ''}`,
      /row 2 questionEn must be a non-empty string for q001/,
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('content validator rejects CSV prompt values with surrounding whitespace', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'civic-question-bank-prompt-trim-'));

  try {
    const lines = fs.readFileSync('content/question-bank.csv', 'utf8').trim().split('\n');
    const header = parseCsvLine(lines[0]);
    const questionSvIndex = header.indexOf('questionSv');

    assert.ok(questionSvIndex > -1, 'CSV should include questionSv');

    const firstRow = parseCsvLine(lines[1]);
    const tempCsvPath = path.join(tempDir, 'question-bank-question-sv-leading-space.csv');
    firstRow[questionSvIndex] = ` ${firstRow[questionSvIndex]}`;
    const malformedLines = [...lines];
    malformedLines[1] = firstRow.map(csvCell).join(',');
    fs.writeFileSync(tempCsvPath, `${malformedLines.join('\n')}\n`);

    let validationError;
    try {
      execFileSync(process.execPath, ['scripts/validate-content.js'], {
        encoding: 'utf8',
        env: {
          ...process.env,
          QUESTION_BANK_CSV_PATH: tempCsvPath,
        },
      });
    } catch (error) {
      validationError = error;
    }

    assert.ok(validationError, 'surrounding-whitespace prompt value should fail validation');
    assert.match(
      `${validationError.stdout || ''}\n${validationError.stderr || ''}`,
      /row 2 questionSv must not start or end with whitespace for q001/,
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('content validator rejects CSV prompt values with trailing whitespace', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'civic-question-bank-prompt-trim-tail-'));

  try {
    const lines = fs.readFileSync('content/question-bank.csv', 'utf8').trim().split('\n');
    const header = parseCsvLine(lines[0]);
    const questionEnIndex = header.indexOf('questionEn');

    assert.ok(questionEnIndex > -1, 'CSV should include questionEn');

    const firstRow = parseCsvLine(lines[1]);
    const tempCsvPath = path.join(tempDir, 'question-bank-question-en-trailing-space.csv');
    firstRow[questionEnIndex] = `${firstRow[questionEnIndex]} `;
    const malformedLines = [...lines];
    malformedLines[1] = firstRow.map(csvCell).join(',');
    fs.writeFileSync(tempCsvPath, `${malformedLines.join('\n')}\n`);

    let validationError;
    try {
      execFileSync(process.execPath, ['scripts/validate-content.js'], {
        encoding: 'utf8',
        env: {
          ...process.env,
          QUESTION_BANK_CSV_PATH: tempCsvPath,
        },
      });
    } catch (error) {
      validationError = error;
    }

    assert.ok(validationError, 'trailing-whitespace prompt value should fail validation');
    assert.match(
      `${validationError.stdout || ''}\n${validationError.stderr || ''}`,
      /row 2 questionEn must not start or end with whitespace for q001/,
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('exported question bank carries UHR chapter and section page ranges for each row', () => {
  const lines = fs.readFileSync('content/question-bank.csv', 'utf8').trim().split('\n');
  const header = parseCsvLine(lines[0]);
  const pageApproxIndex = header.indexOf('uhrPageApprox');
  const startPageIndex = header.indexOf('uhrChapterStartPage');
  const endPageIndex = header.indexOf('uhrChapterEndPage');
  const sectionStartPageIndex = header.indexOf('uhrSectionStartPage');
  const sectionEndPageIndex = header.indexOf('uhrSectionEndPage');

  assert.equal(lines.length, 501);
  assert.ok(pageApproxIndex > -1, 'CSV should include uhrPageApprox');
  assert.ok(startPageIndex > -1, 'CSV should include uhrChapterStartPage');
  assert.ok(endPageIndex > -1, 'CSV should include uhrChapterEndPage');
  assert.ok(sectionStartPageIndex > -1, 'CSV should include uhrSectionStartPage');
  assert.ok(sectionEndPageIndex > -1, 'CSV should include uhrSectionEndPage');

  for (const line of lines.slice(1)) {
    const row = parseCsvLine(line);
    const pageApprox = Number(row[pageApproxIndex]);
    const startPage = Number(row[startPageIndex]);
    const endPage = Number(row[endPageIndex]);
    const sectionStartPage = Number(row[sectionStartPageIndex]);
    const sectionEndPage = Number(row[sectionEndPageIndex]);

    assert.ok(Number.isInteger(startPage), `start page should be present for ${row[0]}`);
    assert.ok(Number.isInteger(endPage), `end page should be present for ${row[0]}`);
    assert.ok(
      Number.isInteger(sectionStartPage),
      `section start page should be present for ${row[0]}`,
    );
    assert.ok(Number.isInteger(sectionEndPage), `section end page should be present for ${row[0]}`);
    assert.ok(
      pageApprox >= startPage && pageApprox <= endPage,
      `${row[0]} page ${pageApprox} should be within ${startPage}-${endPage}`,
    );
    assert.ok(
      pageApprox >= sectionStartPage && pageApprox <= sectionEndPage,
      `${row[0]} page ${pageApprox} should be within section range ${sectionStartPage}-${sectionEndPage}`,
    );
  }
});
