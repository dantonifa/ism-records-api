const assert = require("node:assert/strict");
const { test } = require("node:test");
const { validateStudent } = require("../middleware/validateStudent");

const validBody = {
  studentId: "STU-2002",
  firstName: "Carlos",
  lastName: "Mendez",
  email: "carlos.mendez@example.com",
  gradeLevel: "11",
  section: "B",
  year: 2026,
};

test("accepts a valid create payload", () => {
  const result = validateStudent(validBody);
  assert.equal(result.error, undefined);
  assert.equal(result.data.studentId, "STU-2002");
});

test("rejects unexpected fields and invalid create payloads", () => {
  assert.match(
    validateStudent({ ...validBody, nickname: "C" }).error,
    /Unexpected field/,
  );
  assert.match(validateStudent({}).error, /required/i);
});

test("supports partial updates and blocks studentId changes", () => {
  const ok = validateStudent({ firstName: "Carla" }, { partial: true });
  assert.equal(ok.error, undefined);
  assert.equal(ok.data.firstName, "Carla");

  const blocked = validateStudent(
    { studentId: "STU-9999" },
    { partial: true },
  );
  assert.match(blocked.error, /cannot be changed/i);
});
