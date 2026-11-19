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

class ReviewError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function reviewSubmission(submissionId, approve, input, session, targets) {
  const submission = await GradeSubmission.findById(submissionId).session(session);
  if (!submission) throw new ReviewError(404, "Grade submission not found");
  if (submission.status !== "PENDING_REVIEW") {
    throw new ReviewError(409, "Grade submission has already been reviewed");
  }

  if (approve) {
    const partial = partialByTerm.get(submission.term?.trim().toUpperCase());
    if (!partial || !submission.grades.length) {
      throw new ReviewError(422, "Approval requires a term from Q1 to Q4 and at least one grade");
    }

    const studentIds = submission.grades.map(({ studentId }) => studentId);
    if (new Set(studentIds).size !== studentIds.length) {
      throw new ReviewError(422, "The roster contains duplicate student IDs");
    }

    const records = await Record.find({
      studentId: { $in: studentIds },
      course: submission.subjectId,
      seccion: submission.courseSection,
      year: input.year,
    }).session(session);
    const recordsByStudent = new Map(records.map((record) => [record.studentId, record]));
    if (records.length !== studentIds.length || recordsByStudent.size !== studentIds.length) {
      throw new ReviewError(
        409,
        "Each grade must match exactly one record for this course, section, and year",
      );
    }

    for (const { studentId, score } of submission.grades) {
      const record = recordsByStudent.get(studentId);
      if (targets) {
        const target = `${record._id}:${partial}`;
        if (targets.has(target)) {
          throw new ReviewError(409, "Two rosters update the same student record and quarter");
        }
        targets.add(target);
      }
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
  return { submissionId, status: submission.status };
}

// Supply the server-side role check from #10 when it is available.
function secretaryOnly(isSecretary, handler) {
  return async (request, context) => {
    try {
      if (!isSecretary) return failure(503, "Grade review access is not configured");
      if ((await isSecretary(request)) !== true) {
        return failure(403, "Secretary access required");
      }

      const data = await handler(request, context);
      return Response.json({ success: true, data });
    } catch (error) {
      if (error instanceof ReviewError) return failure(error.status, error.message);
      console.error("Grade review failed:", error.name);
      return failure(500, "Failed to review grade submissions");
    }
  };
}

async function readInput(request) {
  try {
    return await request.json();
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    throw new ReviewError(400, "Invalid JSON");
  }
}

function requireYear(input) {
  if (!Number.isSafeInteger(input?.year) || input.year < 1) {
    throw new ReviewError(400, "A valid school year is required");
  }
}

export function createGradeReviewHandler(action, isSecretary) {
  const approve = action === "approve";
  return secretaryOnly(isSecretary, async (request, { params }) => {
    const { submissionId } = await params;
    if (!mongoose.isObjectIdOrHexString(submissionId)) {
      throw new ReviewError(400, "Invalid grade submission ID");
    }
    let input = await readInput(request);
    if (approve) {
      requireYear(input);
    } else {
      const reason = input?.rejectionReason;
      if (typeof reason !== "string" || !reason.trim()) {
        throw new ReviewError(400, "A rejection reason is required");
      }
      input = { rejectionReason: reason.trim() };
    }

    await dbConnect();
    return mongoose.connection.transaction((session) =>
      reviewSubmission(submissionId, approve, input, session),
    );
  });
}

export function createBatchApprovalHandler(isSecretary) {
  return secretaryOnly(isSecretary, async (request) => {
    const input = await readInput(request);
    requireYear(input);
    const ids = input.submissionIds;
    if (
      !Array.isArray(ids) ||
      ids.length < 1 ||
      ids.length > 50 ||
      !ids.every((id) => typeof id === "string" && mongoose.isObjectIdOrHexString(id))
    ) {
      throw new ReviewError(400, "Supply between 1 and 50 valid submission IDs");
    }
    const submissionIds = ids.map((id) => id.toLowerCase());
    if (new Set(submissionIds).size !== submissionIds.length) {
      throw new ReviewError(400, "Submission IDs must be unique");
    }

    await dbConnect();
    return mongoose.connection.transaction(async (session) => {
      const targets = new Set();
      const approved = [];
      for (const id of submissionIds) {
        try {
          approved.push(await reviewSubmission(id, true, input, session, targets));
        } catch (error) {
          if (!(error instanceof ReviewError)) throw error;
          throw new ReviewError(error.status, `Submission ${id}: ${error.message}`);
        }
      }
      return approved;
    });
  });
}

export function createPendingGradesHandler(isSecretary) {
  return secretaryOnly(isSecretary, async (request) => {
    const params = new URL(request.url).searchParams;
    const filter = { status: "PENDING_REVIEW" };
    const teacherId = params.get("teacherId");
    if (teacherId !== null) {
      if (!mongoose.isObjectIdOrHexString(teacherId)) {
        throw new ReviewError(400, "Invalid teacher ID");
      }
      filter.teacherId = new mongoose.Types.ObjectId(teacherId);
    }
    for (const field of ["subjectId", "term"]) {
      const value = params.get(field)?.trim();
      if (value) filter[field] = value;
    }

    await dbConnect();
    return GradeSubmission.aggregate([
      { $match: filter },
      { $sort: { submittedAt: -1, _id: -1 } },
      {
        $project: {
          _id: 0,
          submissionId: "$_id",
          teacherId: 1,
          subjectId: 1,
          courseSection: 1,
          term: { $ifNull: ["$term", null] },
          status: 1,
          submittedAt: 1,
          gradeCount: { $size: { $ifNull: ["$grades", []] } },
        },
      },
    ]);
  });
}
