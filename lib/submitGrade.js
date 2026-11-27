import validateGradeSubmission from "../middleware/validateGradeSubmission.js";
import gradeSubmissionController from "../controllers/gradeSubmissionController.js";
import { dbConnect } from "./db.js";
import TeachingAssignment from "../models/TeachingAssignment.js";
import Student from "../models/Student.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Record from "../models/record.js";

const partialByTerm = { Q1: "parcial1", Q2: "parcial2", Q3: "parcial3", Q4: "parcial4" };

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
      const students = await Student.find({
        studentId: { $in: studentIds }, section: submission.courseSection,
        year: submission.year, status: "active",
      }).lean();
      if (students.length !== studentIds.length) {
        return Response.json({ success: false, error: "Students must belong to the assigned section and year" }, { status: 409 });
      }
      const courseCode = submission.subjectId.trim().toUpperCase();
      const course = await Course.findOne({ code: courseCode, status: "active" }).lean();
      if (!course) {
        return Response.json({ success: false, error: "The assignment must use an active course code" }, { status: 409 });
      }
      const enrollments = await Enrollment.find({
        course: course._id, student: { $in: students.map((student) => student._id) }, status: "active",
      }).lean();
      if (enrollments.length !== students.length) {
        return Response.json({ success: false, error: "All students must have an active enrollment in the course" }, { status: 409 });
      }
      const escapedCode = courseCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const records = await Record.find({
        studentId: { $in: studentIds }, course: new RegExp(`^${escapedCode}$`, "i"),
        seccion: submission.courseSection, year: submission.year, status: { $ne: "archived" },
      }).lean();
      const byStudent = new Map(records.map((record) => [record.studentId, record]));
      if (byStudent.size !== records.length) {
        return Response.json({ success: false, error: "Duplicate academic records require administrator review" }, { status: 409 });
      }
      const partial = partialByTerm[submission.term];
      for (const grade of submission.grades) {
        const score = byStudent.get(grade.studentId)?.grades?.[partial] ?? null;
        if (grade.operation === "remove" && score === null) {
          return Response.json({ success: false, error: "A grade must exist before removal can be requested" }, { status: 409 });
        }
        grade.expectedScore = score;
      }
      submission.subjectId = courseCode;
      const savedSubmission = await gradeSubmissionController.submitGradeSubmission(submission);
      return Response.json({ success: true, data: savedSubmission }, { status: 201 });
    } catch (error) {
      console.error("Error submitting grades:", error.name);
      return Response.json({ success: false, error: "Failed to submit grades" }, { status: 500 });
    }
  };
}
