const assert = require("node:assert/strict");
const { test } = require("node:test");
const mongoose = require("mongoose");
const Enrollment = require("../models/Enrollment");
const Student = require("../models/Student");
const Course = require("../models/Course");
process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/ism-test";

const studentId = new mongoose.Types.ObjectId().toString();
const courseId = new mongoose.Types.ObjectId().toString();
const enrollmentId = new mongoose.Types.ObjectId().toString();
const context = { params: Promise.resolve({ id: enrollmentId }) };

function request(method, body) {
  return new Request("http://localhost/api/enrollments", {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

test("enrollment access is limited to active staff and administrators", async (t) => {
  const { createEnrollmentHandlers } = await import("../lib/enrollmentHandlers.js");
  const { createAuthorization } = await import("../lib/accessPolicy.js");
  let session = null;
  let role = "teacher";
  let isActive = true;
  const connectAuth = t.mock.fn(async () => {});
  const handlers = createEnrollmentHandlers(createAuthorization(
    async () => session,
    connectAuth,
    async () => ({ role, isActive }),
  ));
  assert.equal((await handlers.list()).status, 401);
  assert.equal(connectAuth.mock.callCount(), 0);
  session = { user: { id: studentId } };
  for (const response of [
    await handlers.list(),
    await handlers.create(request("POST", { studentId, courseId })),
    await handlers.get(request("GET"), context),
    await handlers.update(request("PATCH", { status: "active" }), context),
    await handlers.archive(request("DELETE"), context),
  ]) assert.equal(response.status, 403);

  role = "staff";
  isActive = false;
  assert.equal((await handlers.list()).status, 403);
  isActive = true;
  t.mock.method(mongoose, "connect", async () => mongoose);
  t.mock.method(Enrollment, "find", () => ({
    sort: () => ({ populate: () => ({ populate: () => ({ lean: async () => [] }) }) }),
  }));
  for (role of ["staff", "admin"]) assert.equal((await handlers.list()).status, 200);
});

test("creation validates active references and reports duplicate pairs", async (t) => {
  const { createEnrollmentHandlers } = await import("../lib/enrollmentHandlers.js");
  const handlers = createEnrollmentHandlers(async () => ({ user: { role: "staff" } }));
  t.mock.method(mongoose, "connect", async () => mongoose);
  let studentActive = true;
  let courseActive = true;
  let duplicate = false;
  t.mock.method(Student, "exists", async (query) => {
    assert.equal(query.status, "active");
    return studentActive;
  });
  t.mock.method(Course, "exists", async (query) => {
    assert.equal(query.status, "active");
    return courseActive;
  });
  const create = t.mock.method(Enrollment, "create", async (data) => {
    if (duplicate) throw Object.assign(new Error("duplicate"), { code: 11000 });
    return new Enrollment(data);
  });
  for (const body of [{}, { studentId: {}, courseId }, { studentId, courseId, status: "archived" }]) {
    assert.equal((await handlers.create(request("POST", body))).status, 400);
  }
  assert.equal((await handlers.create(new Request("http://localhost", { method: "POST", body: "{" }))).status, 400);
  studentActive = false;
  assert.equal((await handlers.create(request("POST", { studentId, courseId }))).status, 400);
  studentActive = true;
  courseActive = false;
  assert.equal((await handlers.create(request("POST", { studentId, courseId }))).status, 400);
  assert.equal(create.mock.callCount(), 0);
  courseActive = true;
  const created = await handlers.create(request("POST", { studentId, courseId }));
  assert.equal(created.status, 201);
  assert.equal((await created.json()).data.status, "active");
  assert.deepEqual(create.mock.calls[0].arguments[0], { student: studentId, course: courseId });
  duplicate = true;
  assert.equal((await handlers.create(request("POST", { studentId, courseId }))).status, 409);
  assert.ok(Enrollment.schema.indexes().some(([fields, options]) =>
    fields.student === 1 && fields.course === 1 && options.unique === true));
});

test("enrollment reads, archives, and restores with active reference validation", async (t) => {
  const { createEnrollmentHandlers } = await import("../lib/enrollmentHandlers.js");
  const handlers = createEnrollmentHandlers(async () => ({ user: { role: "staff" } }));
  t.mock.method(mongoose, "connect", async () => mongoose);
  let studentActive = true;
  let courseActive = true;
  let enrollment = { _id: enrollmentId, student: studentId, course: courseId, status: "active" };
  t.mock.method(Student, "exists", async () => studentActive);
  t.mock.method(Course, "exists", async () => courseActive);
  t.mock.method(Enrollment, "findById", (id) => {
    const lean = async () => id === enrollmentId ? { ...enrollment } : null;
    return { lean, populate: () => ({ populate: () => ({ lean }) }) };
  });
  t.mock.method(Enrollment, "findByIdAndUpdate", async (id, update, options) => {
    assert.deepEqual(options, { new: true, runValidators: true });
    if (id !== enrollmentId) return null;
    enrollment = { ...enrollment, ...update.$set };
    return enrollment;
  });
  assert.equal((await handlers.get(request("GET"), context)).status, 200);
  assert.equal((await handlers.update(request("PATCH", { student: studentId }), context)).status, 400);
  assert.equal((await handlers.archive(request("DELETE"), context)).status, 200);
  assert.equal(enrollment.status, "archived");
  studentActive = false;
  assert.equal((await handlers.update(request("PATCH", { status: "active" }), context)).status, 409);
  studentActive = true;
  courseActive = false;
  assert.equal((await handlers.update(request("PATCH", { status: "active" }), context)).status, 409);
  assert.equal(enrollment.status, "archived");
  courseActive = true;
  assert.equal((await handlers.update(request("PATCH", { status: "active" }), context)).status, 200);
  assert.equal(enrollment.status, "active");
  const missing = { params: Promise.resolve({ id: new mongoose.Types.ObjectId().toString() }) };
  assert.equal((await handlers.get(request("GET"), missing)).status, 404);
  assert.equal((await handlers.update(request("PATCH", { status: "active" }), missing)).status, 404);
  assert.equal((await handlers.archive(request("DELETE"), missing)).status, 404);
  assert.equal((await handlers.get(request("GET"), { params: Promise.resolve({ id: "invalid" }) })).status, 400);
});

test("listing returns enrollments with limited student and course details", async (t) => {
  const { createEnrollmentHandlers } = await import("../lib/enrollmentHandlers.js");
  const handlers = createEnrollmentHandlers(async () => ({ user: { role: "admin" } }));
  t.mock.method(mongoose, "connect", async () => mongoose);
  const populate = [];
  const query = {
    sort(value) { assert.deepEqual(value, { updatedAt: -1, _id: -1 }); return this; },
    populate(path, fields) { populate.push([path, fields]); return this; },
    async lean() { return [{ _id: enrollmentId, status: "archived" }]; },
  };
  t.mock.method(Enrollment, "find", () => query);
  const response = await handlers.list();
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data, [{ _id: enrollmentId, status: "archived" }]);
  assert.deepEqual(populate, [
    ["student", "studentId firstName lastName status"],
    ["course", "code name status"],
  ]);
});
