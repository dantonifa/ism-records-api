const Student = require("../models/Student");

const createFields = new Set([
  "studentId",
  "firstName",
  "lastName",
  "email",
  "phone",
  "gradeLevel",
  "section",
  "year",
  "status",
]);

const updateFields = new Set([
  "firstName",
  "lastName",
  "email",
  "phone",
  "gradeLevel",
  "section",
  "year",
  "status",
]);

function clientSafeValidationError(error) {
  if (!error) {
    return "Student validation failed.";
  }

  if (error.code === 11000) {
    return "A student with this identifier already exists.";
  }

  if (error.name === "ValidationError" && error.errors) {
    const messages = Object.values(error.errors).map((item) => item.message);
    return messages.join(" ");
  }

  return error.message || "Student validation failed.";
}

function validateStudent(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be an object." };
  }

  if (partial && Object.prototype.hasOwnProperty.call(body, "studentId")) {
    return { error: "Student identifier cannot be changed." };
  }

  const allowedFields = partial ? updateFields : createFields;
  const unexpectedField = Object.keys(body).find(
    (field) => !allowedFields.has(field),
  );
  if (unexpectedField) {
    return { error: `Unexpected field: ${unexpectedField}` };
  }

  if (partial && Object.keys(body).length === 0) {
    return { error: "Provide at least one field to update." };
  }

  const payload = { ...body };
  if (Object.prototype.hasOwnProperty.call(payload, "year")) {
    if (typeof payload.year === "string" && payload.year.trim() !== "") {
      payload.year = Number(payload.year);
    }
    if (typeof payload.year !== "number" || !Number.isFinite(payload.year)) {
      return { error: "Year must be a valid number." };
    }
  }

  if (partial) {
    const document = new Student(payload);
    const error = document.validateSync(Object.keys(payload));
    if (error) {
      return { error: clientSafeValidationError(error) };
    }
    return { data: payload };
  }

  const document = new Student(payload);
  const error = document.validateSync();
  if (error) {
    return { error: clientSafeValidationError(error) };
  }

  return { data: payload, document };
}

module.exports = {
  validateStudent,
  clientSafeValidationError,
};
