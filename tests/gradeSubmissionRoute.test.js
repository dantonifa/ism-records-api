const assert = require("node:assert/strict");
const { test } = require("node:test");
const mongoose = require("mongoose");
process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/ism-test";
const GradeSubmission = require("../models/GradeSubmission");
const Student = require("../models/Student");

function request(body) {
  return new Request("http://localhost/api/grades/submit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("grade submission requires a teacher and an assigned roster", async (t) => {
  const { createGradeSubmissionHandler } = await import("../lib/submitGrade.js");
  const { default: TeachingAssignment } = await import("../models/TeachingAssignment.js");
  const teacherId = new mongoose.Types.ObjectId();
  const payload = {
    subjectId: "math", courseSection: "A", year: 2026, term: "Q1",
    grades: [{ studentId: "student-1", score: 85, comments: "Good work" }],
  };
  const unauthorized = createGradeSubmissionHandler(async () => ({
    response: Response.json({ success: false }, { status: 401 }),
  }));
  assert.equal((await unauthorized(request(payload))).status, 401);

  const submit = createGradeSubmissionHandler(async () => ({ user: { teacherId } }));
  assert.equal((await submit(request({ ...payload, teacherId: String(teacherId) }))).status, 400);
  t.mock.method(mongoose, "connect", async () => mongoose);
  let assigned = false;
  t.mock.method(TeachingAssignment, "findOne", () => ({
    lean: async () => assigned ? { studentIds: ["student-1"] } : null,
  }));
  t.mock.method(Student, "countDocuments", async () => 1);
  const save = t.mock.method(GradeSubmission.prototype, "save", async function () { return this; });

  assert.equal((await submit(request(payload))).status, 403);
  assert.equal(save.mock.callCount(), 0);
  assigned = true;
  const response = await submit(request(payload));
  assert.equal(response.status, 201);
  const result = await response.json();
  assert.equal(result.data.teacherId, String(teacherId));
  assert.equal(result.data.grades[0].comments, "Good work");
  assert.equal(result.data.status, "PENDING_REVIEW");
});
