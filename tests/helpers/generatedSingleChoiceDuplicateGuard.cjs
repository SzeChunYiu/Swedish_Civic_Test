'use strict';

const GENERATED_VARIANTS_PER_SOURCE = 4;
const SINGLE_CHOICE_VARIANT_OFFSETS = new Set([0, 3]);

function questionNumber(question) {
  const match = String(question.id || '').match(/^q(\d+)$/);
  return match ? Number(match[1]) : NaN;
}

function questionTags(question) {
  if (Array.isArray(question.tags)) return question.tags;
  return String(question.tags || '')
    .split('|')
    .filter(Boolean);
}

function firstGeneratedQuestionNumber(questions) {
  const generatedNumbers = questions
    .filter((question) => questionTags(question).includes('published-variant'))
    .map(questionNumber)
    .filter(Number.isInteger);

  return generatedNumbers.length ? Math.min(...generatedNumbers) : null;
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('sv-SE');
}

function normalizedOptionSignature(option) {
  return JSON.stringify([normalizeText(option?.sv), normalizeText(option?.en)]);
}

function generatedSingleChoiceSignature(question) {
  const optionBank = (question.options || []).map(normalizedOptionSignature).sort();

  return JSON.stringify([
    normalizeText(question.questionSv),
    normalizeText(question.questionEn),
    optionBank,
  ]);
}

function findGeneratedSingleChoiceDuplicateStemOptions(questions, options = {}) {
  const artifactLabel = options.artifactLabel || 'question bank';
  const firstGenerated =
    options.firstGeneratedQuestionNumber ?? firstGeneratedQuestionNumber(questions);
  if (!Number.isInteger(firstGenerated)) return [];

  const seenBySource = new Map();
  const findings = [];

  for (const question of questions) {
    const idNumber = questionNumber(question);
    const generatedOffset = idNumber - firstGenerated;
    const variantOffset = generatedOffset % GENERATED_VARIANTS_PER_SOURCE;
    const tags = questionTags(question);

    if (
      question.type !== 'single_choice' ||
      generatedOffset < 0 ||
      !SINGLE_CHOICE_VARIANT_OFFSETS.has(variantOffset) ||
      !tags.includes('published-variant')
    ) {
      continue;
    }

    const sourceIndex = Math.floor(generatedOffset / GENERATED_VARIANTS_PER_SOURCE);
    const signature = generatedSingleChoiceSignature(question);
    const seenForSource = seenBySource.get(sourceIndex) || new Map();
    const previous = seenForSource.get(signature);

    if (previous) {
      findings.push(
        `${artifactLabel}: ${question.id} duplicates ${previous.id} for generated source ` +
          `#${sourceIndex + 1} with the same stem and option bank`,
      );
      continue;
    }

    seenForSource.set(signature, question);
    seenBySource.set(sourceIndex, seenForSource);
  }

  return findings;
}

module.exports = {
  findGeneratedSingleChoiceDuplicateStemOptions,
};
