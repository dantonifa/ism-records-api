export function LoadingState({ message = "Loading students..." }) {
  return <p className="student-loading" role="status">{message}</p>;
}

export function EmptyState({ message }) {
  return <p className="student-empty">{message}</p>;
}

export function ErrorMessage({ message }) {
  if (!message) {
    return null;
  }

  return (
    <div className="student-error" role="alert">
      {message}
    </div>
  );
}

export function SuccessMessage({ message }) {
  if (!message) {
    return null;
  }

  return (
    <div className="student-success" role="status">
      {message}
    </div>
  );
}
