const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const { checkQuestions, REQUIRED_LOCALES } = require('../scripts/check-question-i18n-v8');

function completeMap(value = 'x') {
  return Object.fromEntries(REQUIRED_LOCALES.map((locale) => [locale, value]));
}

test('question localization v8 pilot covers the current pilot ids in every picker locale', () => {
  const output = execFileSync(process.execPath, ['scripts/check-question-i18n-v8.js'], {
    encoding: 'utf8',
  });
  assert.match(output, /Question i18n pilot OK \(40 questions, 12 locales\)/);
});

test('question localization v8 pilot rejects missing target-language option text', () => {
  const optionText = completeMap('option');
  optionText.uk = '';
  const errors = checkQuestions(
    [
      {
        id: 'q001',
        questionSv: 'Fråga?',
        questionEn: 'Question?',
        questionText: completeMap('question'),
        explanationSv: 'Förklaring.',
        explanationEn: 'Explanation.',
        explanationText: completeMap('explanation'),
        options: [{ id: 'a', textSv: 'Svar', textEn: 'Answer', text: optionText }],
        correctOptionId: 'a',
      },
    ],
    ['q001'],
  );

  assert.ok(errors.includes('q001.options.a.text.uk missing'));
});
