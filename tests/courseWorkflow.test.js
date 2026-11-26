const assert = require("node:assert/strict");
const { test } = require("node:test");
const mongoose = require("mongoose");
const Course = require("../models/Course");
process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/ism-test";

const courseId = new mongoose.Types.ObjectId().toString();
const context = { params: Promise.resolve({ id: courseId }) };

function request(method, data) {
  return new Request("http://localhost/api/courses", {
    method,
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
}

test("course access permits approved readers but rejects non-administrator writes", async (t) => {
  const { createCourseHandlers } = await import("../lib/courseHandlers.js");
  const { createAuthorization } = await import("../lib/accessPolicy.js");
  let session = null;
  const connectAuth = t.mock.fn(async () => {});
  const auth = createAuthorization(
    async () => session,
    connectAuth,
    async () => ({ role: "staff", isActive: true }),
  );
  const handlers = createCourseHandlers(auth);
  assert.equal((await handlers.list()).status, 401);
  assert.equal(connectAuth.mock.callCount(), 0);

  session = { user: { id: new mongoose.Types.ObjectId().toString(), role: "admin" } };
  assert.equal((await handlers.create(request("POST", { code: "MATH", name: "Math" }))).status, 403);
  assert.equal((await handlers.update(request("PATCH", { name: "Updated" }), context)).status, 403);
  assert.equal((await handlers.archive(request("DELETE"), context)).status, 403);

  t.mock.method(mongoose, "connect", async () => mongoose);
  t.mock.method(Course, "find", (filter) => {
    assert.deepEqual(filter, { status: "active" });
    return { sort: () => ({ lean: async () => [{ code: "MATH", name: "Math" }] }) };
  });
  const result = await handlers.list();
  assert.equal(result.status, 200);
  assert.equal((await result.json()).canManage, false);
});

test("creating courses validates fields, normalizes codes, and reports duplicates", async (t) => {
  const { createCourseHandlers } = await import("../lib/courseHandlers.js");
  const handlers = createCourseHandlers(async () => ({ user: { role: "admin" } }));
  t.mock.method(mongoose, "connect", async () => mongoose);
  let duplicate = false;
  const create = t.mock.method(Course, "create", async (data) => {
    if (duplicate) throw Object.assign(new Error("duplicate"), { code: 11000 });
    return new Course(data);
  });
  for (const data of [{}, { code: "MATH", name: " " }, { code: "MATH", name: "Math", status: "archived" }, { code: {}, name: "Math" }]) {
    assert.equal((await handlers.create(request("POST", data))).status, 400);
  }
  assert.equal(create.mock.callCount(), 0);
  const response = await handlers.create(request("POST", { code: " math ", name: " Mathematics ", description: " Intro " }));
  assert.equal(response.status, 201);
  assert.deepEqual(create.mock.calls[0].arguments[0], { code: "MATH", name: "Mathematics", description: "Intro" });
  assert.equal((await response.json()).data.status, "active");
  duplicate = true;
  assert.equal((await handlers.create(request("POST", { code: "math", name: "Math" }))).status, 409);
});

test("course details, updates, and archive honor active status and immutable codes", async (t) => {
  const { createCourseHandlers } = await import("../lib/courseHandlers.js");
  const handlers = createCourseHandlers(async () => ({ user: { role: "admin" } }));
  let course = { _id: courseId, code: "MATH", name: "Math", description: "", status: "active" };
  t.mock.method(mongoose, "connect", async () => mongoose);
  t.mock.method(Course, "findOne", (query) => ({
    lean: async () => query._id === courseId && course.status === query.status ? { ...course } : null,
  }));
  t.mock.method(Course, "findOneAndUpdate", async (query, update, options) => {
    assert.deepEqual(options, { new: true, runValidators: true });
    if (query._id !== courseId || course.status !== query.status) return null;
    course = { ...course, ...update.$set };
    return course;
  });

  assert.equal((await handlers.get(request("GET"), { params: Promise.resolve({ id: "invalid" }) })).status, 400);
  assert.equal((await handlers.get(request("GET"), context)).status, 200);
  assert.equal((await handlers.update(request("PATCH", { code: "OTHER" }), context)).status, 400);
  assert.equal((await handlers.update(request("PATCH", { status: "archived" }), context)).status, 400);
  assert.equal((await handlers.update(request("PATCH", { name: " New name " }), context)).status, 200);
  assert.equal(course.name, "New name");
  assert.equal((await handlers.archive(request("DELETE"), context)).status, 200);
  assert.equal(course.status, "archived");
  assert.equal((await handlers.get(request("GET"), context)).status, 404);
  assert.equal((await handlers.update(request("PATCH", { name: "Another" }), context)).status, 404);
});
