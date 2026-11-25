export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  busy = false,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="student-dialog-backdrop" role="presentation">
      <div
        className="student-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="student-dialog-title"
      >
        <h2 id="student-dialog-title">{title}</h2>
        <p>{message}</p>
        <div className="student-dialog-actions">
          <button type="button" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className="student-danger"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
