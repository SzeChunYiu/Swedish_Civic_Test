function questionNumber(question) {
  return Number(String(question.id).replace(/^q/, ''));
}

function generatedQuestionNumberRange(sourceQuestions, generatedPublishedQuestions) {
  const first = sourceQuestions.length + 1;
  return {
    first,
    last: first + generatedPublishedQuestions.length - 1,
  };
}

function generatedTrueFalseResidualQuestions(sourceQuestions, generatedPublishedQuestions) {
  const range = generatedQuestionNumberRange(sourceQuestions, generatedPublishedQuestions);

  return generatedPublishedQuestions.filter((question) => {
    const idNumber = questionNumber(question);
    return question.type === 'true_false' && idNumber >= range.first && idNumber <= range.last;
  });
}

module.exports = {
  generatedQuestionNumberRange,
  generatedTrueFalseResidualQuestions,
  questionNumber,
};
