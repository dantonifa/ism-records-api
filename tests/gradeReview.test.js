const assert = require("node:assert/strict");
const { test } = require("node:test");
const mongoose = require("mongoose");
process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/ism-test";
const GradeSubmission = require("../models/GradeSubmission");
const Record = require("../models/record");

const submissionId = new mongoose.Types.ObjectId().toString();
const context = { params: Promise.resolve({ submissionId }) };

function request(body) {
  return new Request("http://localhost", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

test("grade review routes deny access before touching MongoDB", async (t) => {
  const { createGradeReviewHandler } = await import("../lib/gradeReview.js");
  const connect = t.mock.method(mongoose, "connect");
  const approve = createGradeReviewHandler("approve");
  assert.equal((await approve(request({ year: 2026 }), context)).status, 503);
  const forbidden = createGradeReviewHandler("approve", async () => false);
  assert.equal((await forbidden(request({ year: 2026 }), context)).status, 403);
  const unauthenticated = createGradeReviewHandler("reject", async () =>
    Response.json({ success: false }, { status: 401 }),
  );
  assert.equal((await unauthenticated(request({ rejectionReason: "Check scores" }), context)).status, 401);
  assert.equal(connect.mock.callCount(), 0);
});

test("approves or rejects pending rosters without changing unrelated grades", async (t) => {
  const { createGradeReviewHandler } = await import("../lib/gradeReview.js");
  const approve = createGradeReviewHandler("approve", async () => true);
  const reject = createGradeReviewHandler("reject", async () => true);
  const session = {};
  const submission = {
    status: "PENDING_REVIEW",
    subjectId: "math",
    courseSection: "A",
    term: "Q2",
    grades: [{ studentId: "student-1", score: 85 }],
    save: t.mock.fn(async () => {}),
  };
  const record = {
    studentId: "student-1",
    set: t.mock.fn(),
    save: t.mock.fn(async () => {}),
  };
  let matches = [];

  t.mock.method(mongoose, "connect", async () => mongoose);
  t.mock.method(mongoose.connection, "transaction", async (callback) => callback(session));
  t.mock.method(GradeSubmission, "findById", (id) => {
    assert.equal(id, submissionId);
    return { session: async () => submission };
  });
  const findRecords = t.mock.method(Record, "find", (filter) => {
    assert.deepEqual(filter, {
      studentId: { $in: ["student-1"] },
      course: "math",
      seccion: "A",
      year: 2026,
    });
    return { session: async () => matches };
  });

  assert.equal((await approve(request({ year: 2026 }), context)).status, 409);
  assert.equal(record.save.mock.callCount(), 0);
  assert.equal(submission.save.mock.callCount(), 0);

  matches = [record];
  submission.year = 2025;
  assert.equal((await approve(request({ year: 2026 }), context)).status, 409);
  submission.year = 2026;
  const approval = await approve(request({ year: 2026 }), context);
  assert.equal(approval.status, 200);
  assert.deepEqual(await approval.json(), {
    success: true,
    data: { submissionId, status: "APPROVED" },
  });
  assert.equal(submission.status, "APPROVED");
  assert.deepEqual(record.set.mock.calls[0].arguments, ["grades.parcial2", 85]);
  assert.deepEqual(record.save.mock.calls[0].arguments, [{ session }]);
  assert.deepEqual(submission.save.mock.calls[0].arguments, [{ session }]);
  assert.equal((await reject(request({ rejectionReason: "Check scores" }), context)).status, 409);

  submission.status = "PENDING_REVIEW";
  assert.equal((await reject(request({ rejectionReason: " " }), context)).status, 400);
  assert.equal((await reject(request({ rejectionReason: " Check scores " }), context)).status, 200);
  assert.equal(submission.status, "REJECTED");
  assert.equal(submission.rejectionReason, "Check scores");
  assert.equal(findRecords.mock.callCount(), 2);
});
