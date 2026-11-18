async function submitGradeSubmission(submission) {
  return submission.save();
}

module.exports = { submitGradeSubmission };
