const assert = require("node:assert/strict");
const { test } = require("node:test");
const mongoose = require("mongoose");

test("access requires an active account with a current allowed role", async () => {
  const { createAuthorization } = await import("../lib/accessPolicy.js");
  const id = new mongoose.Types.ObjectId().toString();
  let session = null;
  let account = { isActive: true, role: "staff" };
  let connections = 0;
  const authorize = createAuthorization(
    async () => session,
    async () => { connections += 1; },
    async () => account,
  );
  assert.equal((await authorize(["staff"])).response.status, 401);
  assert.equal(connections, 0);
  session = { user: { id, role: "admin" } };
  assert.equal((await authorize(["admin"])).response.status, 403);
  assert.equal((await authorize(["staff"])).user, account);
  account = { isActive: false, role: "staff" };
  assert.equal((await authorize(["staff"])).response.status, 403);
  account = null;
  assert.equal((await authorize(["staff"])).response.status, 403);
});
