const Course = require("../models/Course");

const createFields = new Set(["code", "name", "description"]);
const updateFields = new Set(["name", "description"]);

function validateCourse(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be an object." };
  }
  const allowedFields = partial ? updateFields : createFields;
  const invalidField = Object.keys(body).find((field) => !allowedFields.has(field));
  if (invalidField) return { error: `Unexpected field: ${invalidField}` };
  if (partial && Object.keys(body).length === 0) {
    return { error: "Provide at least one field to update." };
  }
  for (const [field, value] of Object.entries(body)) {
    if (typeof value !== "string") return { error: `${field} must be a string.` };
  }

  const document = new Course(body);
  const error = partial ? document.validateSync(Object.keys(body)) : document.validateSync();
  if (error) {
    return { error: Object.values(error.errors).map((item) => item.message).join(" ") };
  }
  const data = {};
  for (const field of Object.keys(body)) data[field] = document[field];
  return { data };
}

module.exports = { validateCourse };
