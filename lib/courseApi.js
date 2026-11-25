export async function courseRequest(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    throw new Error("The server returned an unexpected response.");
  }
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Unable to complete the course request.");
  }
  return payload;
}
