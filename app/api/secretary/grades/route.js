import { authorize } from "../../../../lib/authorization.js";
import GradeSubmission from "../../../../models/GradeSubmission.js";

export async function GET() {
  try {
    const access = await authorize(["admin", "staff"]);
    if (access.response) return access.response;
    const data = await GradeSubmission.find({ status: "PENDING_REVIEW" }).sort({ submittedAt: -1 }).limit(100).lean();
    return Response.json({ success: true, data });
  } catch (error) {
    console.error("Unable to list pending grades:", error.name);
    return Response.json({ success: false, error: "Unable to list pending grades" }, { status: 500 });
  }
}
