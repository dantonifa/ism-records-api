const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const { test } = require("node:test");

const testUri = process.env.GRADE_REVIEW_MONGO_TEST_URI;

test("batch approval rolls back all writes on a real MongoDB transaction", { skip: !testUri }, async () => {
  const uri = new URL(testUri);
  assert.equal(uri.hostname, "127.0.0.1", "Integration tests require a local MongoDB instance");
  assert.equal(uri.username, "", "Integration tests require an isolated database without credentials");
  assert.equal(uri.password, "", "Integration tests require an isolated database without credentials");
  uri.pathname = `/ism_grade_review_test_${randomBytes(12).toString("hex")}`;
  process.env.MONGODB_URI = uri.toString();

  const mongoose = require("mongoose");
  const GradeSubmission = require("../models/GradeSubmission");
  const Record = require("../models/record");
  const { dbConnect } = await import("../lib/db.js");
  const { createBatchApprovalHandler } = await import("../lib/gradeReview.js");
  const approve = createBatchApprovalHandler(async () => true);
  const teacherId = new mongoose.Types.ObjectId();

  function request(ids) {
    return new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({ year: 2026, submissionIds: ids.map(String) }),
    });
  }

  function record(studentId) {
    return {
      studentId, name: "Synthetic Student", course: "math", seccion: "A", grado: "10",
      year: 2026, grades: { parcial1: 0, parcial2: 0, parcial3: 0, parcial4: 0 },
    };
  }

  try {
    await dbConnect();
    const firstRecord = await Record.create(record("test-student-a"));
    const submissions = await GradeSubmission.create([
      {
        teacherId, subjectId: "math", courseSection: "A", term: "Q1", year: 2026,
        grades: [{ studentId: "test-student-a", score: 85 }],
      },
      {
        teacherId, subjectId: "math", courseSection: "A", term: "Q1", year: 2026,
        grades: [{ studentId: "test-student-b", score: 90 }],
      },
    ]);
    const ids = submissions.map(({ _id }) => _id);

    assert.equal((await approve(request(ids))).status, 409);
    assert.equal((await Record.findById(firstRecord._id)).grades.parcial1, 0);
    assert.deepEqual(
      (await GradeSubmission.find({ _id: { $in: ids } }).sort({ _id: 1 })).map(({ status }) => status),
      ["PENDING_REVIEW", "PENDING_REVIEW"],
    );

    const secondRecord = await Record.create(record("test-student-b"));
    assert.equal((await approve(request(ids))).status, 200);
    assert.equal((await Record.findById(firstRecord._id)).grades.parcial1, 85);
    assert.equal((await Record.findById(secondRecord._id)).grades.parcial1, 90);
    assert.deepEqual(
      (await GradeSubmission.find({ _id: { $in: ids } }).sort({ _id: 1 })).map(({ status }) => status),
      ["APPROVED", "APPROVED"],
    );
  } finally {
    if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
