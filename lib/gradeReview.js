import mongoose from "mongoose";
import GradeSubmission from "../models/GradeSubmission.js";
import Record from "../models/record.js";
import { dbConnect } from "./db.js";

const partialByTerm = new Map([
  ["Q1", "parcial1"],
  ["Q2", "parcial2"],
  ["Q3", "parcial3"],
  ["Q4", "parcial4"],
]);

function failure(status, error) {
  return Response.json({ success: false, error }, { status });
}

async function reviewSubmission(submissionId, approve, input, session) {
  const submission = await GradeSubmission.findById(submissionId).session(session);
  if (!submission) return failure(404, "Grade submission not found");
  if (submission.status !== "PENDING_REVIEW") {
    return failure(409, "Grade submission has already been reviewed");
  }

  if (approve) {
    const partial = partialByTerm.get(submission.term?.trim().toUpperCase());
    if (!partial || !submission.grades.length) {
      return failure(422, "Approval requires a term from Q1 to Q4 and at least one grade");
    }

    const studentIds = submission.grades.map(({ studentId }) => studentId);
    if (new Set(studentIds).size !== studentIds.length) {
      return failure(422, "The roster contains duplicate student IDs");
    }

    const records = await Record.find({
      studentId: { $in: studentIds },
      course: submission.subjectId,
      seccion: submission.courseSection,
      year: input.year,
    }).session(session);
    const recordsByStudent = new Map(records.map((record) => [record.studentId, record]));
    if (records.length !== studentIds.length || recordsByStudent.size !== studentIds.length) {
      return failure(
        409,
        "Each grade must match exactly one record for this course, section, and year",
      );
    }

    for (const { studentId, score } of submission.grades) {
      const record = recordsByStudent.get(studentId);
      record.set(`grades.${partial}`, score);
      await record.save({ session });
    }

    submission.status = "APPROVED";
    submission.approvedAt = new Date();
  } else {
    submission.status = "REJECTED";
    submission.rejectionReason = input.rejectionReason;
  }

  await submission.save({ session });
  return Response.json({ success: true, data: { submissionId, status: submission.status } });
}

// Only pass a server-side session check here once the role from #10 is available.
export function createGradeReviewHandler(action, isSecretary) {
  const approve = action === "approve";
  return async function PUT(request, { params }) {
    try {
      if (!isSecretary) return failure(503, "Grade review access is not configured");
      if ((await isSecretary(request)) !== true) {
        return failure(403, "Secretary access required");
      }

      const { submissionId } = await params;
      if (!mongoose.isObjectIdOrHexString(submissionId)) {
        return failure(400, "Invalid grade submission ID");
      }

      let input;
      try {
        input = await request.json();
      } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
        return failure(400, "Invalid JSON");
      }

      if (approve) {
        if (!Number.isSafeInteger(input?.year) || input.year < 1) {
          return failure(400, "A valid school year is required");
        }
      } else {
        const reason = input?.rejectionReason;
        if (typeof reason !== "string" || !reason.trim()) {
          return failure(400, "A rejection reason is required");
        }
        input = { rejectionReason: reason.trim() };
      }

      await dbConnect();
      return await mongoose.connection.transaction((session) =>
        reviewSubmission(submissionId, approve, input, session),
      );
    } catch (error) {
      console.error("Grade review failed:", error.name);
      return failure(500, "Failed to review grade submission");
    }
  };
}
