"use client";

import { useState, type FormEvent } from "react";
import FormField from "./FormField";
import { ErrorMessage, SuccessMessage } from "./Feedback";

interface StudentFormValues {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gradeLevel: string;
  section: string;
  year: string;
}

type StudentInput = Omit<StudentFormValues, "studentId" | "year"> & {
  studentId?: string;
  year: number;
};

interface StudentFormProps {
  mode?: "create" | "edit";
  initialValues?: Partial<StudentFormValues>;
  onSubmit: (payload: StudentInput) => Promise<{ ok: boolean; message?: string }>;
  submitLabel?: string;
}

const INITIAL: StudentFormValues = {
  studentId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  gradeLevel: "",
  section: "",
  year: String(new Date().getFullYear()),
};

function validateClient(values: StudentFormValues, { includeStudentId }: { includeStudentId: boolean }) {
  const errors: Partial<Record<keyof StudentFormValues, string>> = {};

  if (includeStudentId && !values.studentId.trim()) {
    errors.studentId = "Student ID is required.";
  }
  if (!values.firstName.trim()) {
    errors.firstName = "First name is required.";
  }
  if (!values.lastName.trim()) {
    errors.lastName = "Last name is required.";
  }
  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (!values.gradeLevel.trim()) {
    errors.gradeLevel = "Grade level is required.";
  }
  if (!values.section.trim()) {
    errors.section = "Section is required.";
  }
  if (!values.year.trim() || Number.isNaN(Number(values.year))) {
    errors.year = "Year must be a number.";
  }

  return errors;
}

export default function StudentForm({
  mode = "create",
  initialValues,
  onSubmit,
  submitLabel,
}: StudentFormProps) {
  const [values, setValues] = useState<StudentFormValues>({
    ...INITIAL,
    ...(initialValues || {}),
  });
  const [errors, setErrors] = useState<Partial<Record<keyof StudentFormValues, string>>>({});
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  function updateField(field: keyof StudentFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
    setSuccess("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateClient(values, {
      includeStudentId: mode === "create",
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormError("Fix the highlighted fields before saving.");
      return;
    }

    setBusy(true);
    setFormError("");
    setSuccess("");

    try {
      const payload: StudentInput = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        gradeLevel: values.gradeLevel.trim(),
        section: values.section.trim(),
        year: Number(values.year),
      };

      if (mode === "create") {
        payload.studentId = values.studentId.trim();
      }

      const result = await onSubmit(payload);
      if (!result.ok) {
        setFormError(result.message || "Unable to save student profile.");
        return;
      }

      setSuccess(result.message || "Student profile saved.");
      if (mode === "create") {
        setValues({ ...INITIAL, year: String(new Date().getFullYear()) });
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save student profile.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="student-form" onSubmit={handleSubmit} noValidate>
      <ErrorMessage message={formError} />
      <SuccessMessage message={success} />

      {mode === "create" ? (
        <FormField id="studentId" label="Student ID" error={errors.studentId}>
          <input
            id="studentId"
            value={values.studentId}
            onChange={(event) => updateField("studentId", event.target.value)}
            required
          />
        </FormField>
      ) : null}

      <div className="student-form-grid">
        <FormField id="firstName" label="First name" error={errors.firstName}>
          <input
            id="firstName"
            value={values.firstName}
            onChange={(event) => updateField("firstName", event.target.value)}
            required
          />
        </FormField>
        <FormField id="lastName" label="Last name" error={errors.lastName}>
          <input
            id="lastName"
            value={values.lastName}
            onChange={(event) => updateField("lastName", event.target.value)}
            required
          />
        </FormField>
      </div>

      <FormField id="email" label="Email" error={errors.email}>
        <input
          id="email"
          type="email"
          value={values.email}
          onChange={(event) => updateField("email", event.target.value)}
          required
        />
      </FormField>

      <FormField id="phone" label="Phone" error={errors.phone}>
        <input
          id="phone"
          value={values.phone}
          onChange={(event) => updateField("phone", event.target.value)}
        />
      </FormField>

      <div className="student-form-grid">
        <FormField
          id="gradeLevel"
          label="Grade level"
          error={errors.gradeLevel}
        >
          <input
            id="gradeLevel"
            value={values.gradeLevel}
            onChange={(event) => updateField("gradeLevel", event.target.value)}
            required
          />
        </FormField>
        <FormField id="section" label="Section" error={errors.section}>
          <input
            id="section"
            value={values.section}
            onChange={(event) => updateField("section", event.target.value)}
            required
          />
        </FormField>
        <FormField id="year" label="Year" error={errors.year}>
          <input
            id="year"
            type="number"
            value={values.year}
            onChange={(event) => updateField("year", event.target.value)}
            required
          />
        </FormField>
      </div>

      <button type="submit" disabled={busy}>
        {busy ? "Saving..." : submitLabel || "Save student"}
      </button>
    </form>
  );
}
