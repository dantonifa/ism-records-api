const assert = require("node:assert/strict");
const { test } = require("node:test");
const mongoose = require("mongoose");
process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/ism-test";

const userId = new mongoose.Types.ObjectId();
const account = { _id: userId, name: "Example User", email: "example@example.invalid", role: "staff", isActive: true };

function request(method, data) {
  return new Request("http://localhost/api/account", {
    method,
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
}

async function setup(session) {
  const { createAccountHandlers } = await import("../lib/accountHandlers.js");
  const { createAuthorization } = await import("../lib/accessPolicy.js");
  const auth = createAuthorization(async () => session, async () => {}, async () => account);
  return createAccountHandlers(auth);
}

test("account routes require a signed-in user", async () => {
  const handlers = await setup(null);
  assert.equal((await handlers.get()).status, 401);
  assert.equal((await handlers.updateProfile(request("PATCH", { name: "New Name" }))).status, 401);
  assert.equal((await handlers.changePassword(request("PUT", {}))).status, 401);
});

test("account details exclude the password and only the name can be updated", async (t) => {
  const { default: User } = await import("../models/User.js");
  const handlers = await setup({ user: { id: userId.toString() } });
  t.mock.method(mongoose, "connect", async () => mongoose);

  const details = await (await handlers.get()).json();
  assert.deepEqual(details.data, { id: userId.toString(), name: "Example User", email: "example@example.invalid", role: "staff" });

  const update = t.mock.method(User, "findByIdAndUpdate", (id, changes) => ({
    lean: async () => ({ ...account, ...changes }),
  }));
  assert.equal((await handlers.updateProfile(request("PATCH", { name: "New Name", role: "admin" }))).status, 400);
  assert.equal((await handlers.updateProfile(request("PATCH", { name: "A" }))).status, 400);
  assert.equal(update.mock.callCount(), 0);

  const response = await handlers.updateProfile(request("PATCH", { name: "  New Name  " }));
  assert.equal(response.status, 200);
  assert.deepEqual(update.mock.calls[0].arguments[1], { name: "New Name" });
  assert.equal((await response.json()).data.name, "New Name");
});

test("password changes require the current password", async (t) => {
  const { default: User } = await import("../models/User.js");
  const handlers = await setup({ user: { id: userId.toString() } });
  t.mock.method(mongoose, "connect", async () => mongoose);

  const stored = new User({ ...account, password: "current-password" });
  t.mock.method(stored, "comparePassword", async (candidate) => candidate === "current-password");
  const save = t.mock.method(stored, "save", async () => stored);
  t.mock.method(User, "findById", () => ({ select: async () => stored }));

  assert.equal((await handlers.changePassword(request("PUT", { currentPassword: "current-password", newPassword: "short" }))).status, 400);
  assert.equal((await handlers.changePassword(request("PUT", { currentPassword: "wrong-password", newPassword: "another-password" }))).status, 400);
  assert.equal(save.mock.callCount(), 0);

  const response = await handlers.changePassword(request("PUT", { currentPassword: "current-password", newPassword: "another-password" }));
  assert.equal(response.status, 200);
  assert.equal(save.mock.callCount(), 1);
  assert.equal(stored.password, "another-password");
});
