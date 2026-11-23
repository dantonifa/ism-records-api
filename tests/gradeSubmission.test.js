const assert = require("node:assert/strict");
const { test } = require("node:test");
const mongoose = require("mongoose");
const GradeSubmission = require("../models/GradeSubmission");

function submission(overrides = {}) {
  return new GradeSubmission({
    teacherId: new mongoose.Types.ObjectId(),
    subjectId: "math",
    courseSection: "A",
    term: "Q1",
    grades: [{ studentId: "student-1", score: 85 }],
    ...overrides,
  });
}

test("defaults a valid submission to pending review", () => {
  const before = Date.now();
  const document = submission();

  assert.equal(document.validateSync(), undefined);
  assert.equal(document.status, "PENDING_REVIEW");
  assert.ok(document.submittedAt instanceof Date);
  assert.ok(document.submittedAt.getTime() >= before);
  assert.ok(document.submittedAt.getTime() <= Date.now());
});

test("validates the required identifiers and grade fields", () => {
  const error = submission({
    teacherId: undefined,
    subjectId: undefined,
    courseSection: undefined,
    grades: [{}],
  }).validateSync();

  for (const path of [
    "teacherId",
    "subjectId",
    "courseSection",
    "grades.0.studentId",
    "grades.0.score",
  ]) {
    assert.ok(error.errors[path], `Expected validation error for ${path}`);
  }
});

test("accepts boundary scores and rejects scores outside 0-100", () => {
  for (const score of [0, 100]) {
    assert.equal(submission({ grades: [{ studentId: "student-1", score }] }).validateSync(), undefined);
  }

  for (const score of [-1, 101]) {
    const error = submission({ grades: [{ studentId: "student-1", score }] }).validateSync();
    assert.ok(error.errors["grades.0.score"]);
  }
});

test("validates status and accepts review outcomes", () => {
  for (const status of ["APPROVED", "REJECTED"]) {
    assert.equal(submission({ status }).validateSync(), undefined);
  }
  assert.ok(submission({ status: "UNKNOWN" }).validateSync().errors.status);
});
