export async function studentRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(path, {
    ...options,
    headers,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = {
      success: false,
      message: "The server returned an unexpected response.",
    };
  }

  return { response, payload };
}
