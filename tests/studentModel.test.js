const assert = require("node:assert/strict");
const { test } = require("node:test");
const Student = require("../models/Student");

function student(overrides = {}) {
  return new Student({
    studentId: "STU-1001",
    firstName: "Ana",
    lastName: "Lopez",
    email: "ana.lopez@example.com",
    phone: "504-555-0100",
    gradeLevel: "10",
    section: "A",
    year: 2026,
    ...overrides,
  });
}

test("accepts a complete student profile and defaults status to active", () => {
  const document = student();
  assert.equal(document.validateSync(), undefined);
  assert.equal(document.status, "active");
});

test("requires identity, contact, and placement fields", () => {
  const error = student({
    studentId: undefined,
    firstName: undefined,
    lastName: undefined,
    email: undefined,
    gradeLevel: undefined,
    section: undefined,
    year: undefined,
  }).validateSync();

  for (const path of [
    "studentId",
    "firstName",
    "lastName",
    "email",
    "gradeLevel",
    "section",
    "year",
  ]) {
    assert.ok(error.errors[path], `Expected validation error for ${path}`);
  }
});

test("rejects invalid email addresses and unsupported status values", () => {
  assert.ok(student({ email: "not-an-email" }).validateSync().errors.email);
  assert.ok(student({ status: "deleted" }).validateSync().errors.status);
});
