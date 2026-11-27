const assert = require("node:assert/strict");
const { test } = require("node:test");
const mongoose = require("mongoose");
const Record = require("../models/record");
const Student = require("../models/Student");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/ism-test";

function request(method, body) {
  return new Request("http://localhost/api/records/student-1", {
    method, headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  });
}

test("only admins can list and restore archived records with active references", async (t) => {
    const { createAcademicRecordHandlers } = await import("../lib/academicRecords.js");
    const context = { params: Promise.resolve({ id: "student-1" }) };
    const staff = createAcademicRecordHandlers(async (roles) => roles.includes("staff")
      ? { user: { role: "staff" } }
      : { response: Response.json({}, { status: 403 }) }, async () => ({}));
    assert.equal((await staff.list(new Request("http://localhost/api/records?status=archived"))).status, 403);
    assert.equal((await staff.update(request("PATCH", { status: "active" }), context)).status, 403);

    const admin = createAcademicRecordHandlers(async () => ({ user: { role: "admin" } }), async () => ({}));
    const record = {
      _id: new mongoose.Types.ObjectId(), studentId: "student-1",
      course: "MATH", seccion: "A", year: 2026, status: "archived",
    };
    t.mock.method(mongoose, "connect", async () => mongoose);
    t.mock.method(Record, "find", (filter) => {
      assert.equal(filter.status, "archived");
      return { limit: async () => [record] };
    });
    let duplicate = false;
    t.mock.method(Record, "exists", async () => duplicate);
    t.mock.method(Student, "findOne", () => ({ lean: async () => ({ _id: "student" }) }));
    t.mock.method(Course, "findOne", () => ({ lean: async () => ({ _id: "course" }) }));
    let enrolled = false;
    t.mock.method(Enrollment, "exists", async () => enrolled);
    const update = t.mock.method(Record, "findOneAndUpdate", async () => ({ ...record, status: "active" }));

    assert.equal((await admin.update(request("PATCH", { status: "active" }), context)).status, 409);
    assert.equal(update.mock.callCount(), 0);
    enrolled = true;
    duplicate = true;
    assert.equal((await admin.update(request("PATCH", { status: "active" }), context)).status, 409);
    duplicate = false;
    assert.equal((await admin.update(request("PATCH", { status: "active" }), context)).status, 200);
    assert.deepEqual(update.mock.calls[0].arguments[0], { _id: record._id, status: "archived" });
});

test("record changes require admin and do not accept grade fields or invalid types", async (t) => {
  const { createAcademicRecordHandlers } = await import("../lib/academicRecords.js");
  const context = { params: Promise.resolve({ id: "student-1" }) };
  const staff = createAcademicRecordHandlers(async (roles) => roles.includes("staff")
    ? { user: { role: "staff" } }
    : { response: Response.json({}, { status: 403 }) }, async () => ({}));
  assert.equal((await staff.update(request("PATCH", { name: "Test" }), context)).status, 403);
  assert.equal((await staff.archive(new Request("http://localhost/api/records/student-1", { method: "DELETE" }), context)).status, 403);
  const admin = createAcademicRecordHandlers(async () => ({ user: { role: "admin" } }), async () => ({}));
  assert.equal((await admin.update(request("PATCH", { grades: { parcial1: 100 } }), context)).status, 400);
  assert.equal((await admin.create(request("POST", {
    studentId: "student-1", name: "Test", course: 123, grado: "10", seccion: "A", year: 2026,
  }))).status, 400);
  t.mock.method(mongoose, "connect", async () => mongoose);
  const find = t.mock.method(Record, "find", () => ({ limit: async () => [{}, {}] }));
  const result = await admin.get(new Request("http://localhost/api/records/student-1"), context);
  assert.equal(result.status, 409);
  assert.equal(find.mock.callCount(), 1);
});

test("record lookup preserves an empty teacher assignment filter when recordId is provided", async (t) => {
  const { createAcademicRecordHandlers } = await import("../lib/academicRecords.js");
  const teacher = createAcademicRecordHandlers(async () => ({ user: { role: "teacher" } }),
    async () => ({ _id: { $in: [] } }));
  t.mock.method(mongoose, "connect", async () => mongoose);
  const find = t.mock.method(Record, "find", () => ({ limit: async () => [] }));
  const recordId = new mongoose.Types.ObjectId().toString();
  const response = await teacher.get(
    new Request(`http://localhost/api/records/student-1?recordId=${recordId}`),
    { params: Promise.resolve({ id: "student-1" }) },
  );
  assert.equal(response.status, 404);
  assert.deepEqual(find.mock.calls[0].arguments[0].$and, [{ _id: { $in: [] } }]);
});
