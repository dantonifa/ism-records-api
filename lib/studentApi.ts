import type { ApiResponse } from "../types/records";

export async function studentRequest<T = unknown>(path: string, options: RequestInit = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(path, {
    ...options,
    headers,
  });

  let payload: Partial<ApiResponse<T>>;
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
