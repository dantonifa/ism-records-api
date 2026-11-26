const assert = require("node:assert/strict");
const { test } = require("node:test");

test("API requests send options and return successful responses", async (t) => {
  const { apiRequest } = await import("../lib/apiRequest.js");
  const fetch = t.mock.method(globalThis, "fetch", async () =>
    new Response(JSON.stringify({ success: true, data: [{ id: "example" }] }), { status: 200 }),
  );

  const result = await apiRequest("/api/example", {
    method: "POST",
    headers: { "X-Example": "value" },
    body: "{}",
  });

  assert.deepEqual(result.data, [{ id: "example" }]);
  assert.equal(fetch.mock.calls[0].arguments[0], "/api/example");
  assert.deepEqual(fetch.mock.calls[0].arguments[1], {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Example": "value" },
    body: "{}",
  });
});

test("API requests surface server errors and invalid JSON", async (t) => {
  const { apiRequest } = await import("../lib/apiRequest.js");
  const fetch = t.mock.method(globalThis, "fetch", async () =>
    new Response(JSON.stringify({ success: false, error: "Not authorized" }), { status: 403 }),
  );
  await assert.rejects(apiRequest("/api/example"), { message: "Not authorized" });

  fetch.mock.mockImplementation(async () => new Response("not JSON", { status: 200 }));
  await assert.rejects(apiRequest("/api/example"), {
    message: "The server returned an unexpected response.",
  });
});
