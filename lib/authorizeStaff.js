import { NextResponse } from "next/server";

const ALLOWED_ROLES = new Set(["administrator", "teacher", "staff"]);

/**
 * Temporary server-side role gate until Auth.js/Clerk is integrated (#10).
 * Clients send the caller role with the `x-user-role` header.
 */
export function authorizeStaff(request) {
  const role = (request.headers.get("x-user-role") || "").trim().toLowerCase();

  if (!role) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          message:
            "Authentication required. Provide an authorized role via x-user-role until the shared auth module is ready.",
        },
        { status: 401 },
      ),
    };
  }

  if (!ALLOWED_ROLES.has(role)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          message: "You are not authorized to manage student records.",
        },
        { status: 403 },
      ),
    };
  }

  return { ok: true, role };
}
