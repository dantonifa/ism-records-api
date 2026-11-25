export default function FormField({
  id,
  label,
  error,
  children,
  hint,
}) {
  return (
    <div className="student-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint ? <p className="student-hint">{hint}</p> : null}
      {error ? <p className="student-field-error">{error}</p> : null}
    </div>
  );
}
