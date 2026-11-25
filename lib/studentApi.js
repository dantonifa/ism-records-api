const STAFF_ROLE_KEY = "ism-staff-role";

export function getStaffRole() {
  if (typeof window === "undefined") {
    return "staff";
  }

  return window.localStorage.getItem(STAFF_ROLE_KEY) || "staff";
}

export function setStaffRole(role) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STAFF_ROLE_KEY, role);
}

export async function studentRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    "x-user-role": getStaffRole(),
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
