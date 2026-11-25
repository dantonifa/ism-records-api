"use client";

import { useState } from "react";
import FormField from "../students/FormField";
import { ErrorMessage } from "../students/Feedback";

export default function CourseForm({ initialCourse, onSubmit }) {
  const [values, setValues] = useState({
    code: initialCourse?.code || "",
    name: initialCourse?.name || "",
    description: initialCourse?.description || "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = { name: values.name.trim(), description: values.description.trim() };
      if (!initialCourse) data.code = values.code.trim();
      await onSubmit(data);
    } catch (submitError) {
      setError(submitError.message || "Unable to save course.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="student-form" onSubmit={submit}>
      <ErrorMessage message={error} />
      {initialCourse ? (
        <p>Course code: {initialCourse.code}</p>
      ) : (
        <FormField id="code" label="Course code">
          <input id="code" value={values.code} onChange={(event) => update("code", event.target.value)} maxLength={40} required />
        </FormField>
      )}
      <FormField id="name" label="Course name">
        <input id="name" value={values.name} onChange={(event) => update("name", event.target.value)} maxLength={120} required />
      </FormField>
      <FormField id="description" label="Description">
        <textarea id="description" value={values.description} onChange={(event) => update("description", event.target.value)} maxLength={2000} rows={4} />
      </FormField>
      <button type="submit" disabled={busy}>{busy ? "Saving..." : "Save course"}</button>
    </form>
  );
}
