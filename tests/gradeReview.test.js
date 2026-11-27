const assert = require("node:assert/strict");
const { test } = require("node:test");
const mongoose = require("mongoose");
process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/ism-test";
const GradeSubmission = require("../models/GradeSubmission");
const Record = require("../models/record");
const Student = require("../models/Student");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const reviewer = { _id: new mongoose.Types.ObjectId() };

function mockReferences(t) {
  const student = { _id: new mongoose.Types.ObjectId(), studentId: "student-1", firstName: "Test", lastName: "Student", gradeLevel: "10" };
  t.mock.method(Course, "findOne", () => ({ session: async () => ({ _id: new mongoose.Types.ObjectId() }) }));
  t.mock.method(Student, "find", () => ({ session: async () => [student] }));
  t.mock.method(Enrollment, "find", () => ({ session: async () => [{ student: student._id }] }));
}

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
  const approve = createGradeReviewHandler("approve", async () => reviewer);
  const reject = createGradeReviewHandler("reject", async () => reviewer);
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
  mockReferences(t);
  t.mock.method(Record, "exists", () => ({ session: async () => ({ _id: "archived" }) }));
  t.mock.method(GradeSubmission, "findById", (id) => {
    assert.equal(id, submissionId);
    return { session: async () => submission };
  });
  const findRecords = t.mock.method(Record, "find", (filter) => {
    assert.deepEqual(filter, {
      studentId: { $in: ["student-1"] },
      course: /^MATH$/i,
      seccion: "A",
      year: 2026,
      status: { $ne: "archived" },
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
  assert.equal(submission.reviewedBy, reviewer._id);
  assert.ok(submission.reviewedAt instanceof Date);
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

test("batch approval validates access and IDs before starting a transaction", async (t) => {
  const { createBatchApprovalHandler } = await import("../lib/gradeReview.js");
  const transaction = t.mock.method(mongoose.connection, "transaction", async (callback) => callback({}));
  const denied = createBatchApprovalHandler(async () =>
    Response.json({ success: false }, { status: 401 }),
  );
  assert.equal((await denied(request({ year: 2026, submissionIds: [submissionId] }))).status, 401);
  const approve = createBatchApprovalHandler(async () => reviewer);
  for (const ids of [[], [submissionId, submissionId.toUpperCase()], ["invalid"], Array.from({ length: 51 }, () => new mongoose.Types.ObjectId().toString())]) {
    assert.equal((await approve(request({ year: 2026, submissionIds: ids }))).status, 400);
  }
  assert.equal(transaction.mock.callCount(), 0);

  t.mock.method(mongoose, "connect", async () => mongoose);
  t.mock.method(GradeSubmission, "findById", () => ({ session: async () => null }));
  const ids = Array.from({ length: 50 }, () => new mongoose.Types.ObjectId().toString());
  assert.equal((await approve(request({ year: 2026, submissionIds: ids }))).status, 404);
  assert.equal(transaction.mock.callCount(), 1);
});

test("review rejects stale changes and audits removal of a zero grade", async (t) => {
  const { createGradeReviewHandler } = await import("../lib/gradeReview.js");
  const approve = createGradeReviewHandler("approve", async () => reviewer);
  const grade = { studentId: "student-1", operation: "remove", expectedScore: 20 };
  const submission = {
    status: "PENDING_REVIEW", subjectId: "MATH", courseSection: "A", term: "Q1", year: 2026,
    grades: [grade], save: t.mock.fn(async () => {}),
  };
  const record = {
    studentId: "student-1", grades: { parcial1: 0 },
    set: t.mock.fn(), save: t.mock.fn(async () => {}),
  };
  t.mock.method(mongoose, "connect", async () => mongoose);
  t.mock.method(mongoose.connection, "transaction", async (callback) => callback({}));
  mockReferences(t);
  t.mock.method(GradeSubmission, "findById", () => ({ session: async () => submission }));
  t.mock.method(Record, "find", () => ({ session: async () => [record] }));

  assert.equal((await approve(request({ year: 2026 }), context)).status, 409);
  assert.equal(record.save.mock.callCount(), 0);
  grade.expectedScore = 0;
  assert.equal((await approve(request({ year: 2026 }), context)).status, 200);
  assert.deepEqual(record.set.mock.calls[0].arguments, ["grades.parcial1", null]);
  assert.equal(grade.previousScore, 0);
  assert.equal(submission.reviewedBy, reviewer._id);
});

test("approval creates a record with other quarters ungraded", async (t) => {
  const { createGradeReviewHandler } = await import("../lib/gradeReview.js");
  const approve = createGradeReviewHandler("approve", async () => reviewer);
  const submission = {
    status: "PENDING_REVIEW", subjectId: "math", courseSection: "A", term: "Q1", year: 2026,
    grades: [{ studentId: "student-1", operation: "set", score: 0, expectedScore: null }],
    save: t.mock.fn(async () => {}),
  };
  t.mock.method(mongoose, "connect", async () => mongoose);
  t.mock.method(mongoose.connection, "transaction", async (callback) => callback({}));
  mockReferences(t);
  t.mock.method(GradeSubmission, "findById", () => ({ session: async () => submission }));
  t.mock.method(Record, "find", () => ({ session: async () => [] }));
  t.mock.method(Record, "exists", () => ({ session: async () => null }));
  let saved;
  t.mock.method(Record.prototype, "save", async function () { saved = this; return this; });
  assert.equal((await approve(request({ year: 2026 }), context)).status, 200);
  assert.equal(saved.grades.parcial1, 0);
  assert.equal(saved.grades.parcial2, null);
  assert.equal(saved.grades.parcial3, null);
  assert.equal(saved.grades.parcial4, null);
  assert.equal(submission.grades[0].previousScore, null);
});

test("batch approval aborts for a failed or overlapping roster", async (t) => {
  const { createBatchApprovalHandler } = await import("../lib/gradeReview.js");
  const approve = createBatchApprovalHandler(async () => reviewer);
  const anotherId = new mongoose.Types.ObjectId().toString();
  const session = {};
  const submission = {
    status: "PENDING_REVIEW",
    year: 2026,
    subjectId: "math",
    courseSection: "A",
    term: "Q1",
    grades: [{ studentId: "student-1", score: 85 }],
    save: t.mock.fn(async () => {}),
  };
  const record = {
    _id: new mongoose.Types.ObjectId(),
    studentId: "student-1",
    set: t.mock.fn(),
    save: t.mock.fn(async () => {}),
  };
  let finalRoster = null;
  const commits = t.mock.fn();
  const aborts = t.mock.fn();
  t.mock.method(mongoose, "connect", async () => mongoose);
  mockReferences(t);
  t.mock.method(mongoose.connection, "transaction", async (callback) => {
    try {
      const result = await callback(session);
      commits();
      return result;
    } catch (error) {
      aborts();
      throw error;
    }
  });
  t.mock.method(GradeSubmission, "findById", (id) => ({
    session: async () => id === submissionId ? submission : finalRoster,
  }));
  t.mock.method(Record, "find", () => ({ session: async () => [record] }));

  const payload = { year: 2026, submissionIds: [submissionId, anotherId] };
  assert.equal((await approve(request(payload))).status, 404);
  assert.deepEqual(record.save.mock.calls[0].arguments, [{ session }]);
  assert.deepEqual(submission.save.mock.calls[0].arguments, [{ session }]);
  assert.equal(aborts.mock.callCount(), 1);
  assert.equal(commits.mock.callCount(), 0);

  submission.status = "PENDING_REVIEW";
  finalRoster = { ...submission };
  assert.equal((await approve(request(payload))).status, 409);
  assert.equal(aborts.mock.callCount(), 2);
  assert.equal(commits.mock.callCount(), 0);

  submission.status = "PENDING_REVIEW";
  finalRoster = { ...submission, year: 2025 };
  assert.equal((await approve(request(payload))).status, 409);
  assert.equal(aborts.mock.callCount(), 3);
  assert.equal(commits.mock.callCount(), 0);

  submission.status = "PENDING_REVIEW";
  finalRoster = { ...submission, term: "Q2" };
  const response = await approve(request(payload));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data, payload.submissionIds.map((id) => ({ submissionId: id, status: "APPROVED" })));
  assert.equal(commits.mock.callCount(), 1);
});

test("pending submissions combine filters and retain the review data", async (t) => {
  const { createPendingGradesHandler } = await import("../lib/gradeReview.js");
  const denied = createPendingGradesHandler(async () => false);
  assert.equal((await denied(new Request("http://localhost/api/secretary/grades"))).status, 403);
  const list = createPendingGradesHandler(async () => reviewer);
  const teacherId = new mongoose.Types.ObjectId();
  const entries = [{ _id: submissionId, grades: [{ studentId: "student-1", score: 85 }] }];
  const find = t.mock.method(GradeSubmission, "find", (filter) => {
    assert.deepEqual(filter, {
      status: "PENDING_REVIEW", teacherId, subjectId: "math", term: "Q1",
    });
    return {
      sort(sort) {
        assert.deepEqual(sort, { submittedAt: -1, _id: -1 });
        return {
          limit(limit) {
            assert.equal(limit, 100);
            return { lean: async () => entries };
          },
        };
      },
    };
  });
  t.mock.method(mongoose, "connect", async () => mongoose);
  assert.equal((await list(new Request("http://localhost/api/secretary/grades?teacherId=invalid"))).status, 400);
  assert.equal(find.mock.callCount(), 0);
  const response = await list(new Request(`http://localhost/api/secretary/grades?teacherId=${teacherId}&subjectId=math&term=Q1`));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data, entries);
});
