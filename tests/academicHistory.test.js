const assert = require("node:assert/strict");
const { test } = require("node:test");
const mongoose = require("mongoose");
const Student = require("../models/Student");
const Enrollment = require("../models/Enrollment");
const Record = require("../models/record");
process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/ism-test";

test("academic history requires authorization and returns retained enrollments and grades", async (t) => {
  const { createAcademicHistoryHandler } = await import("../lib/academicHistory.js");
  const context = { params: Promise.resolve({ id: "student-1" }) };
  const request = new Request("http://localhost/api/students/student-1/history");
  const denied = createAcademicHistoryHandler(async () => ({ response: Response.json({}, { status: 403 }) }));
  assert.equal((await denied(request, context)).status, 403);

  const history = createAcademicHistoryHandler(async () => ({ user: { role: "staff" } }));
  t.mock.method(mongoose, "connect", async () => mongoose);
  const student = { _id: new mongoose.Types.ObjectId(), studentId: "student-1" };
  let found = null;
  t.mock.method(Student, "findOne", () => ({ lean: async () => found }));
  assert.equal((await history(request, context)).status, 404);
  found = student;
  t.mock.method(Enrollment, "find", () => ({
    populate: () => ({ lean: async () => [{ status: "archived", course: { code: "MATH" } }] }),
  }));
  t.mock.method(Record, "find", () => ({ lean: async () => [{ status: "archived", grades: { parcial1: 0, parcial2: null } }] }));
  const response = await history(request, context);
  assert.equal(response.status, 200);
  const { data } = await response.json();
  assert.equal(data.enrollments[0].status, "archived");
  assert.equal(data.records[0].grades.parcial1, 0);
  assert.equal(data.records[0].grades.parcial2, null);
});
