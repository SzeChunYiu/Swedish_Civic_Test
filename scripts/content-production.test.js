const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

test('full content production validates 500 published UHR-referenced questions', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  const summary = JSON.parse(match[0]);
  assert.equal(summary.questions, 500);
  assert.equal(summary.publishedQuestions, 500);
  assert.equal(summary.chapterSchemasValidated, 13);
  assert.equal(summary.chapterTextFieldsNormalizedValidated, 13);
  assert.equal(summary.mockExamConfigValidated, true);
  assert.equal(summary.sourceQuestions, 100);
  assert.equal(summary.generatedPublishedQuestions, 400);
  assert.equal(summary.authoredSourceQuestionsValidated, 100);
  assert.equal(summary.sourcePublicationParityValidated, 100);
  assert.equal(summary.generationParityValidated, true);
  assert.equal(summary.generatedSourceMetadataParityValidated, 400);
  assert.equal(summary.generatedPromptTemplateParityValidated, 400);
  assert.equal(summary.generatedAnswerTemplateParityValidated, 400);
  assert.equal(summary.generatedTagTemplateParityValidated, 400);
  assert.equal(summary.questionSchemasValidated, 500);
  assert.equal(summary.questionIdSequencesValidated, 500);
  assert.equal(summary.questionBilingualTextPairsValidated, 500);
  assert.equal(summary.questionOptionBilingualTextPairsValidated, 500);
  assert.equal(summary.questionTextFieldsNormalizedValidated, 500);
  assert.equal(summary.questionPromptTextUniquenessValidated, 500);
  assert.equal(summary.questionOptionTextLabelsValidated, 500);
  assert.equal(summary.questionTypeOptionCountsValidated, 500);
  assert.equal(summary.questionOptionIdConventionsValidated, 500);
  assert.ok(summary.trueFalseQuestions > 0);
  assert.equal(summary.trueFalseOptionLabelsValidated, summary.trueFalseQuestions);
  assert.equal(summary.questionTagsValidated, 500);
  assert.equal(summary.uhrSourceMetadataValidated, true);
  assert.equal(summary.uhrMapChaptersValidated, 13);
  assert.equal(summary.uhrMapSectionsValidated, 110);
  assert.equal(summary.uhrMapTextFieldsNormalizedValidated, 140);
  assert.equal(summary.uhrMapPageRangesValidated, 13);
  assert.equal(summary.questionChapterReferenceParityValidated, 500);
  assert.equal(summary.uhrReferencesValidated, 500);
});
