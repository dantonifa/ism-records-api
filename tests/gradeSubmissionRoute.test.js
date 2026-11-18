const assert = require("node:assert/strict");
const { test } = require("node:test");
const mongoose = require("mongoose");
const GradeSubmission = require("../models/GradeSubmission");

const payload = {
  teacherId: new mongoose.Types.ObjectId().toString(),
  subjectId: "math",
  courseSection: "A",
  term: "Q1",
  grades: [{ studentId: "student-1", score: 85 }],
};

function request(body) {
  return new Request("http://localhost/api/grades/submit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

test("validates grade submissions before saving and returns the saved data", async (t) => {
  const { POST } = await import("../app/api/grades/submit/route.js");
  const connect = t.mock.method(mongoose, "connect", async () => mongoose);
  const save = t.mock.method(GradeSubmission.prototype, "save", async function () {
    return this;
  });

  const invalidBodies = [
    "{",
    JSON.stringify(null),
    JSON.stringify({ ...payload, teacherId: "invalid" }),
    JSON.stringify({ ...payload, grades: [{ studentId: "student-1", score: 101 }] }),
    JSON.stringify({ ...payload, grades: {} }),
    JSON.stringify({ ...payload, status: "APPROVED" }),
    JSON.stringify({ ...payload, grades: [{ ...payload.grades[0], unexpected: true }] }),
  ];

  for (const body of invalidBodies) {
    const response = await POST(request(body));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).success, false);
  }
  assert.equal(connect.mock.callCount(), 0);
  assert.equal(save.mock.callCount(), 0);

  const response = await POST(request(JSON.stringify(payload)));
  const result = await response.json();
  assert.equal(response.status, 201);
  assert.equal(result.success, true);
  assert.equal(result.data.status, "PENDING_REVIEW");
  assert.equal(result.data.teacherId, payload.teacherId);
  assert.equal(result.data.grades[0].score, 85);
  assert.equal(connect.mock.callCount(), 1);
  assert.equal(save.mock.callCount(), 1);

  t.mock.method(console, "error", () => {});
  save.mock.mockImplementation(async () => {
    throw new Error("database unavailable");
  });
  const failedResponse = await POST(request(JSON.stringify(payload)));
  assert.equal(failedResponse.status, 500);
  assert.deepEqual(await failedResponse.json(), {
    success: false,
    error: "Failed to submit grades",
  });
});
