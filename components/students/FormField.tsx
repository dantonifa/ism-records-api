import type { ReactNode } from "react";

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export default function FormField({
  id,
  label,
  error,
  children,
  hint,
}: FormFieldProps) {
  return (
    <div className="student-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint ? <p className="student-hint">{hint}</p> : null}
      {error ? <p className="student-field-error">{error}</p> : null}
    </div>
  );
}
