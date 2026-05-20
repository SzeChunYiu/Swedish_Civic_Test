const VALID_QUESTION_PROVENANCE = ['uhr', 'derived', 'editorial'];

function questionLabel(question, index, collectionName = 'questions') {
  return question?.id || `${collectionName}[${index}]`;
}

function questionTags(question) {
  return Array.isArray(question?.tags) ? question.tags : [];
}

function countById(questions) {
  const ids = new Set();
  if (!Array.isArray(questions)) return ids;
  questions.forEach((question) => {
    if (typeof question?.id === 'string' && question.id.length > 0) {
      ids.add(question.id);
    }
  });
  return ids;
}

function createEmptyCounts() {
  return {
    total: 0,
    uhr: 0,
    derived: 0,
    editorial: 0,
  };
}

function countQuestionBankProvenance({
  questions,
  sourceQuestions,
  generatedPublishedQuestions,
  getQuestionProvenance,
}) {
  const failures = [];
  const counts = createEmptyCounts();
  const expectedCounts = createEmptyCounts();

  if (!Array.isArray(questions)) {
    failures.push('questions export is not an array');
  }
  if (!Array.isArray(sourceQuestions)) {
    failures.push('sourceQuestions export is not an array');
  }
  if (!Array.isArray(generatedPublishedQuestions)) {
    failures.push('generatedPublishedQuestions export is not an array');
  }
  if (typeof getQuestionProvenance !== 'function') {
    failures.push('getQuestionProvenance is not a function');
  }

  if (
    !Array.isArray(questions) ||
    !Array.isArray(sourceQuestions) ||
    !Array.isArray(generatedPublishedQuestions) ||
    typeof getQuestionProvenance !== 'function'
  ) {
    return { counts, expectedCounts, failures, isValid: false };
  }

  const sourceIds = countById(sourceQuestions);
  const generatedIds = countById(generatedPublishedQuestions);

  expectedCounts.total = questions.length;
  expectedCounts.uhr = sourceQuestions.length;
  expectedCounts.derived = generatedPublishedQuestions.length;
  expectedCounts.editorial = Math.max(
    0,
    questions.length - sourceQuestions.length - generatedPublishedQuestions.length,
  );

  questions.forEach((question, index) => {
    const label = questionLabel(question, index);
    const tags = questionTags(question);
    const hasPublishedVariantTag = tags.includes('published-variant');
    const hasEditorialTag = tags.includes('editorial');
    let provenance;

    try {
      provenance = getQuestionProvenance(question);
    } catch (error) {
      failures.push(`${label} provenance lookup threw ${error.message}`);
      return;
    }

    counts.total += 1;

    if (!VALID_QUESTION_PROVENANCE.includes(provenance)) {
      failures.push(
        `${label} provenance is ${JSON.stringify(provenance)}, expected one of ${VALID_QUESTION_PROVENANCE.join(', ')}`,
      );
      return;
    }

    counts[provenance] += 1;

    if (hasEditorialTag && provenance !== 'editorial') {
      failures.push(`${label} has editorial tag but provenance ${provenance}; expected editorial`);
    }
    if (hasPublishedVariantTag && provenance !== 'derived') {
      failures.push(
        `${label} has published-variant tag but provenance ${provenance}; expected derived`,
      );
    }
    if (!hasPublishedVariantTag && !hasEditorialTag && provenance !== 'uhr') {
      failures.push(`${label} has no provenance tag but provenance ${provenance}; expected uhr`);
    }
    if (sourceIds.has(question?.id) && provenance !== 'uhr') {
      failures.push(`${label} is in sourceQuestions but provenance ${provenance}; expected uhr`);
    }
    if (generatedIds.has(question?.id) && provenance !== 'derived') {
      failures.push(
        `${label} is in generatedPublishedQuestions but provenance ${provenance}; expected derived`,
      );
    }
  });

  for (const key of VALID_QUESTION_PROVENANCE) {
    if (counts[key] !== expectedCounts[key]) {
      failures.push(
        `question provenance ${key} count is ${counts[key]}, expected ${expectedCounts[key]}`,
      );
    }
  }
  if (counts.total !== expectedCounts.total) {
    failures.push(`question provenance total is ${counts.total}, expected ${expectedCounts.total}`);
  }

  return {
    counts,
    expectedCounts,
    failures,
    isValid: failures.length === 0,
  };
}

function assertQuestionBankProvenanceComposition(options) {
  const result = countQuestionBankProvenance(options);
  if (!result.isValid) {
    throw new Error(`question bank provenance composition failed:\n${result.failures.join('\n')}`);
  }
  return result;
}

module.exports = {
  VALID_QUESTION_PROVENANCE,
  countQuestionBankProvenance,
  assertQuestionBankProvenanceComposition,
};
