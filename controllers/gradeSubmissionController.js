
const GradeSubmission = require("../models/GradeSubmission");

async function submitGradeSubmission(submission) {
  const record = new GradeSubmission(submission);
  return record.save();
}

module.exports = { submitGradeSubmission };
