import { dbConnect } from "../../../../lib/db.js";
import validateGradeSubmission from "../../../../middleware/validateGradeSubmission.js";
import gradeSubmissionController from "../../../../controllers/gradeSubmissionController.js";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return Response.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { submission, error } = validateGradeSubmission(body);
  if (error) {
    return Response.json({ success: false, error }, { status: 400 });
  }

  try {
    await dbConnect();
    const savedSubmission = await gradeSubmissionController.submitGradeSubmission(submission);
    return Response.json({ success: true, data: savedSubmission }, { status: 201 });
  } catch (error) {
    console.error("Error submitting grades:", error);
    return Response.json(
      { success: false, error: "Failed to submit grades" },
      { status: 500 },
    );
  }
}
