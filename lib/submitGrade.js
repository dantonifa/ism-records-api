import validateGradeSubmission from "../middleware/validateGradeSubmission.js";
import gradeSubmissionController from "../controllers/gradeSubmissionController.js";
import { dbConnect } from "./db.js";
import TeachingAssignment from "../models/TeachingAssignment.js";
import Student from "../models/Student.js";

export function createGradeSubmissionHandler(checkAccess) {
  return async function POST(request) {
    let access;
    try {
      access = await checkAccess(["teacher"]);
    } catch (error) {
      console.error("Grade submission authorization failed:", error.name);
      return Response.json({ success: false, error: "Unable to authorize request" }, { status: 500 });
    }
    if (access.response) return access.response;

    let body;
    try {
      body = await request.json();
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      return Response.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body) || "teacherId" in body ||
        !Number.isSafeInteger(body.year) || body.year < 2000 || body.year > 2100) {
      return Response.json({ success: false, error: "A valid year is required; teacher identity is supplied by the session" }, { status: 400 });
    }
    if (!access.user.teacherId) {
      return Response.json({ success: false, error: "No teacher record is linked to this account" }, { status: 403 });
    }
    const { submission, error } = validateGradeSubmission({ ...body, teacherId: access.user.teacherId });
    if (error) return Response.json({ success: false, error }, { status: 400 });
    if (!["Q1", "Q2", "Q3", "Q4"].includes(submission.term)) {
      return Response.json({ success: false, error: "A term from Q1 to Q4 is required" }, { status: 400 });
    }

    try {
      await dbConnect();
      const assignment = await TeachingAssignment.findOne({
        teacherId: access.user.teacherId,
        subjectId: submission.subjectId,
        courseSection: submission.courseSection,
        year: submission.year,
      }).lean();
      const studentIds = submission.grades.map((grade) => grade.studentId);
      if (!assignment || new Set(studentIds).size !== studentIds.length ||
          studentIds.some((id) => !assignment.studentIds.includes(id))) {
        return Response.json({ success: false, error: "Grade roster is not assigned to this teacher" }, { status: 403 });
      }
      const count = await Student.countDocuments({
        studentId: { $in: studentIds }, section: submission.courseSection,
        year: submission.year, status: "active",
      });
      if (count !== studentIds.length) {
        return Response.json({ success: false, error: "Students must belong to the assigned section and year" }, { status: 409 });
      }
      const savedSubmission = await gradeSubmissionController.submitGradeSubmission(submission);
      return Response.json({ success: true, data: savedSubmission }, { status: 201 });
    } catch (error) {
      console.error("Error submitting grades:", error.name);
      return Response.json({ success: false, error: "Failed to submit grades" }, { status: 500 });
    }
  };
}
