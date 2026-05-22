const MOCK_EXAM_REVIEW_SECTION_PATTERN =
  /\{\s*filteredReviewItems\.map\s*\(\s*\(\s*item\s*\)\s*=>\s*\{/;
const MOCK_EXAM_ACTIVE_SECTION_PATTERN =
  /\{\s*examQuestions\.map\s*\(\s*\(\s*question\s*,\s*index\s*\)\s*=>\s*\{/;

function findMatchingBrace(source, openBraceIndex, label) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = openBraceIndex; index < source.length; index += 1) {
    const char = source[index];
    const nextChar = source[index + 1];

    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }

    if (blockComment) {
      if (char === '*' && nextChar === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '/' && nextChar === '/') {
      lineComment = true;
      index += 1;
      continue;
    }

    if (char === '/' && nextChar === '*') {
      blockComment = true;
      index += 1;
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  throw new Error(`${label} section has no matching closing brace`);
}

function findMockExamSourceSection(source, pattern, label) {
  const match = pattern.exec(source);
  if (!match) throw new Error(`${label} section should be present`);

  const startIndex = match.index;
  const endIndex = findMatchingBrace(source, startIndex, label);

  return {
    endIndex: endIndex + 1,
    source: source.slice(startIndex, endIndex + 1),
    startIndex,
  };
}

function getMockExamSourceCitationSections(source) {
  const review = findMockExamSourceSection(
    source,
    MOCK_EXAM_REVIEW_SECTION_PATTERN,
    'submitted review',
  );
  const activeQuestion = findMockExamSourceSection(
    source,
    MOCK_EXAM_ACTIVE_SECTION_PATTERN,
    'active question',
  );

  if (review.startIndex >= activeQuestion.startIndex) {
    throw new Error('submitted review section should stay separate from active questions');
  }

  return {
    activeQuestionSection: activeQuestion.source,
    reviewSection: review.source,
  };
}

module.exports = {
  getMockExamSourceCitationSections,
};
