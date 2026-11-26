interface MessageProps {
  message?: string;
}

export function LoadingState({ message = "Loading students..." }: MessageProps) {
  return <p className="student-loading" role="status">{message}</p>;
}

export function EmptyState({ message }: MessageProps) {
  return <p className="student-empty">{message}</p>;
}

export function ErrorMessage({ message }: MessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="student-error" role="alert">
      {message}
    </div>
  );
}

export function SuccessMessage({ message }: MessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="student-success" role="status">
      {message}
    </div>
  );
}
