const assert = require("node:assert/strict");
const { test } = require("node:test");
const mongoose = require("mongoose");
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
  const { PUT: approve } = await import(
    "../app/api/secretary/grades/[submissionId]/approve/route.js"
  );
  const { PUT: reject } = await import(
    "../app/api/secretary/grades/[submissionId]/reject/route.js"
  );
  const { createGradeReviewHandler } = await import("../lib/gradeReview.js");
  const connect = t.mock.method(mongoose, "connect");
  assert.equal((await approve(request({ year: 2026 }), context)).status, 503);
  assert.equal((await reject(request({ rejectionReason: "Check scores" }), context)).status, 503);
  const forbidden = createGradeReviewHandler("approve", async () => false);
  assert.equal((await forbidden(request({ year: 2026 }), context)).status, 403);
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

test("batch approval rejects duplicate IDs and aborts when a later roster fails", async (t) => {
  const { PUT } = await import("../app/api/secretary/grades/batch-approve/route.js");
  const { createBatchApprovalHandler } = await import("../lib/gradeReview.js");
  const approve = createBatchApprovalHandler(async () => true);
  const anotherId = new mongoose.Types.ObjectId().toString();
  const submittedIds = [submissionId, anotherId];
  const session = {};
  const submission = {
    status: "PENDING_REVIEW",
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
  const commits = t.mock.fn();
  const aborts = t.mock.fn();
  t.mock.method(mongoose, "connect", async () => mongoose);
  const transaction = t.mock.method(mongoose.connection, "transaction", async (callback) => {
    try {
      const result = await callback(session);
      commits();
      return result;
    } catch (error) {
      aborts();
      throw error;
    }
  });
  let finalRoster = null;
  t.mock.method(GradeSubmission, "findById", (id) => ({
    session: async () => (id === submissionId ? submission : finalRoster),
  }));
  t.mock.method(Record, "find", () => ({ session: async () => [record] }));

  assert.equal((await PUT(request({ year: 2026, submissionIds: submittedIds }))).status, 503);
  const duplicate = await approve(
    request({ year: 2026, submissionIds: [submissionId, submissionId.toUpperCase()] }),
  );
  assert.equal(duplicate.status, 400);
  assert.equal(transaction.mock.callCount(), 0);

  const failed = await approve(request({ year: 2026, submissionIds: submittedIds }));
  assert.equal(failed.status, 404);
  assert.match((await failed.json()).error, new RegExp(anotherId));
  assert.deepEqual(record.save.mock.calls[0].arguments, [{ session }]);
  assert.deepEqual(submission.save.mock.calls[0].arguments, [{ session }]);
  assert.equal(aborts.mock.callCount(), 1);
  assert.equal(commits.mock.callCount(), 0);

  submission.status = "PENDING_REVIEW";
  finalRoster = { ...submission };
  const overlap = await approve(request({ year: 2026, submissionIds: submittedIds }));
  assert.equal(overlap.status, 409);
  assert.equal(aborts.mock.callCount(), 2);
  assert.equal(commits.mock.callCount(), 0);

  submission.status = "PENDING_REVIEW";
  finalRoster = { ...submission, term: "Q2" };
  const success = await approve(request({ year: 2026, submissionIds: submittedIds }));
  assert.equal(success.status, 200);
  assert.deepEqual(await success.json(), {
    success: true,
    data: submittedIds.map((id) => ({ submissionId: id, status: "APPROVED" })),
  });
  assert.equal(commits.mock.callCount(), 1);
});

test("pending roster summaries combine teacher, subject, and term filters", async (t) => {
  const { GET } = await import("../app/api/secretary/grades/route.js");
  const { createPendingGradesHandler } = await import("../lib/gradeReview.js");
  const list = createPendingGradesHandler(async () => true);
  const teacherId = new mongoose.Types.ObjectId();
  const url = "http://localhost/api/secretary/grades";
  const filters = new URLSearchParams({
    teacherId: String(teacherId),
    subjectId: "math",
    term: "Q1",
  });
  const summaries = [{ submissionId, gradeCount: 1 }];
  t.mock.method(mongoose, "connect", async () => mongoose);
  const aggregate = t.mock.method(GradeSubmission, "aggregate", async (pipeline) => {
    assert.deepEqual(pipeline[0].$match, {
      status: "PENDING_REVIEW",
      teacherId,
      subjectId: "math",
      term: "Q1",
    });
    assert.deepEqual(pipeline[1].$sort, { submittedAt: -1, _id: -1 });
    assert.equal(pipeline[2].$project.grades, undefined);
    return summaries;
  });

  assert.equal((await GET(new Request(url))).status, 503);
  assert.equal((await list(new Request(`${url}?teacherId=invalid`))).status, 400);
  assert.equal(aggregate.mock.callCount(), 0);
  const response = await list(new Request(`${url}?${filters}`));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: summaries });
});
