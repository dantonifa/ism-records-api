const assert = require("node:assert/strict");
const { test } = require("node:test");
const mongoose = require("mongoose");
const Record = require("../models/record");
const Student = require("../models/Student");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const GradeSubmission = require("../models/GradeSubmission");
process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/ism-test";

test("grade resources enforce access and send changes for review", async (t) => {
  const { createGradeResourceHandlers } = await import("../lib/gradeResources.js");
  const { default: TeachingAssignment } = await import("../models/TeachingAssignment.js");
  const teacherId = new mongoose.Types.ObjectId();
  const record = {
    _id: new mongoose.Types.ObjectId(), studentId: "synthetic-1", course: "MATH",
    seccion: "A", year: 2026, grades: { parcial1: 0, parcial2: null },
  };
  const context = { params: Promise.resolve({ id: `${record._id}:Q1` }) };
  const url = `http://localhost/api/grades/${record._id}:Q1`;
  const teacher = createGradeResourceHandlers(async (roles) => roles.includes("teacher")
    ? { user: { role: "teacher", teacherId } }
    : { response: Response.json({}, { status: 403 }) }, async () => ({ studentId: "synthetic-1" }));
  const denied = createGradeResourceHandlers(async () => ({
    response: Response.json({}, { status: 403 }),
  }), async () => ({}));
  assert.equal((await denied.list()).status, 403);
  assert.equal((await denied.update(new Request(url, { method: "PATCH" }), context)).status, 403);
  t.mock.method(mongoose, "connect", async () => mongoose);
  t.mock.method(Record, "find", () => ({ lean: async () => [record] }));
  const recordLookup = t.mock.method(Record, "findOne", () => ({ lean: async () => record }));
  const listing = await (await teacher.list()).json();
  assert.equal(listing.data.length, 1);
  assert.equal(listing.data[0].score, 0);
  assert.equal((await teacher.get(new Request(url), context)).status, 200);
  assert.deepEqual(recordLookup.mock.calls[0].arguments[0].$and, [{ studentId: "synthetic-1" }]);
  const noTeacher = createGradeResourceHandlers(async () => ({ user: { role: "teacher" } }),
    async () => ({ _id: { $in: [] } }));
  await noTeacher.get(new Request(url), context);
  assert.deepEqual(recordLookup.mock.calls[1].arguments[0].$and, [{ _id: { $in: [] } }]);
  assert.equal((await teacher.get(new Request(url), { params: Promise.resolve({ id: "bad" }) })).status, 400);
  const unassigned = createGradeResourceHandlers(async () => ({ user: { role: "teacher", teacherId } }),
    async () => ({ $or: [] }));
  assert.equal((await unassigned.get(new Request(url), context)).status, 404);
  assert.equal((await teacher.update(new Request(url, {
    method: "PATCH", body: JSON.stringify({ score: 101 }),
  }), context)).status, 400);

  t.mock.method(TeachingAssignment, "findOne", () => ({
    lean: async () => ({ subjectId: "MATH", studentIds: ["synthetic-1"] }),
  }));
  t.mock.method(Student, "find", () => ({ lean: async () => [{ _id: "student" }] }));
  t.mock.method(Course, "findOne", () => ({ lean: async () => ({ _id: "course" }) }));
  t.mock.method(Enrollment, "find", () => ({ lean: async () => [{}] }));
  const save = t.mock.method(GradeSubmission.prototype, "save", async function () { return this; });
  const corrected = await teacher.update(new Request(url, {
    method: "PATCH", body: JSON.stringify({ score: 85 }),
  }), context);
  assert.equal(corrected.status, 201);
  const result = await corrected.json();
  assert.equal(result.data.status, "PENDING_REVIEW");
  assert.equal(result.data.grades[0].expectedScore, 0);
  assert.equal((await teacher.remove(new Request(url, { method: "DELETE" }), context)).status, 201);
  assert.equal(save.mock.calls[1].this.grades[0].operation, "remove");
});
