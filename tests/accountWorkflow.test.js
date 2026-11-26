const assert = require("node:assert/strict");
const { test } = require("node:test");
const mongoose = require("mongoose");
process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/ism-test";

test("registration creates an inactive account and rejects privileged fields", async (t) => {
  const { default: User } = await import("../models/User.js");
  const { POST } = await import("../app/api/register/route.js");
  t.mock.method(mongoose, "connect", async () => mongoose);
  t.mock.method(User, "findOne", () => ({ lean: async () => null }));
  const create = t.mock.method(User, "create", async (input) => new User(input));
  const payload = { name: "Example User", email: "example@example.invalid", password: "example-password" };
  function request(body) {
    return new Request("http://localhost/api/register", { method: "POST", body: JSON.stringify(body) });
  }
  assert.equal((await POST(request({ ...payload, role: "admin" }))).status, 400);
  assert.equal(create.mock.callCount(), 0);
  assert.equal((await POST(request(payload))).status, 201);
  assert.equal(create.mock.calls[0].arguments[0].isActive, false);
  assert.equal(new User(payload).isActive, false);
});
