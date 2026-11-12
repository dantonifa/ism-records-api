const GradeSubmission = require("../models/GradeSubmission");

const submissionFields = new Set([
  "teacherId",
  "subjectId",
  "courseSection",
  "term",
  "grades",
]);
const gradeFields = new Set(["studentId", "score", "comments"]);

function validateGradeSubmission(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be an object" };
  }

  const unexpectedField = Object.keys(body).find((field) => !submissionFields.has(field));
  if (unexpectedField) {
    return { error: `Unexpected field: ${unexpectedField}` };
  }

  if (body.grades !== undefined) {
    if (!Array.isArray(body.grades)) {
      return { error: "Grades must be an array" };
    }

    for (const grade of body.grades) {
      if (!grade || typeof grade !== "object" || Array.isArray(grade)) {
        return { error: "Each grade must be an object" };
      }
      const unexpectedGradeField = Object.keys(grade).find((field) => !gradeFields.has(field));
      if (unexpectedGradeField) {
        return { error: `Unexpected grade field: ${unexpectedGradeField}` };
      }
    }
  }

  const submission = new GradeSubmission(body);
  const error = submission.validateSync();
  if (error) {
    return { error: error.message };
  }
  return { submission };
}

module.exports = validateGradeSubmission;
