import mongoose from "mongoose";
import GradeSubmission from "../models/GradeSubmission.js";
import Record from "../models/record.js";
import Student from "../models/Student.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
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

async function reviewSubmission(submissionId, approve, input, session, reviewer, targets) {
  const submission = await GradeSubmission.findById(submissionId).session(session);
  if (!submission) throw new ReviewError(404, "Grade submission not found");
  if (submission.status !== "PENDING_REVIEW") {
    throw new ReviewError(409, "Grade submission has already been reviewed");
  }

  if (approve) {
    if (submission.year != null && submission.year !== input.year) {
      throw new ReviewError(409, "School year does not match the submission");
    }
    const partial = partialByTerm.get(submission.term?.trim().toUpperCase());
    if (!partial || !submission.grades.length) {
      throw new ReviewError(422, "Approval requires a term from Q1 to Q4 and at least one grade");
    }

    const studentIds = submission.grades.map(({ studentId }) => studentId);
    if (new Set(studentIds).size !== studentIds.length) {
      throw new ReviewError(422, "The roster contains duplicate student IDs");
    }

    const courseCode = submission.subjectId.trim().toUpperCase();
    const course = await Course.findOne({ code: courseCode, status: "active" }).session(session);
    const students = await Student.find({
      studentId: { $in: studentIds },
      section: submission.courseSection,
      year: input.year,
      status: "active",
    }).session(session);
    if (!course || students.length !== studentIds.length) {
      throw new ReviewError(409, "The active course and students must match the submission");
    }
    const enrollments = await Enrollment.find({
      student: { $in: students.map((student) => student._id) },
      course: course._id,
      status: "active",
    }).session(session);
    if (enrollments.length !== students.length) {
      throw new ReviewError(409, "Each student must have an active enrollment in the course");
    }
    const escapedCode = courseCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const records = await Record.find({
      studentId: { $in: studentIds },
      course: new RegExp(`^${escapedCode}$`, "i"),
      seccion: submission.courseSection,
      year: input.year,
      status: { $ne: "archived" },
    }).session(session);
    const recordsByStudent = new Map(records.map((record) => [record.studentId, record]));
    if (recordsByStudent.size !== records.length) {
      throw new ReviewError(409, "Duplicate academic records require administrator review");
    }

    const studentsById = new Map(students.map((student) => [student.studentId, student]));
    for (const grade of submission.grades) {
      let record = recordsByStudent.get(grade.studentId);
      if (!record) {
        const archived = await Record.exists({
          studentId: grade.studentId, course: new RegExp(`^${escapedCode}$`, "i"),
          seccion: submission.courseSection, year: input.year, status: "archived",
        }).session(session);
        if (archived) throw new ReviewError(409, "An archived academic record requires administrator attention");
        if (grade.operation === "remove") throw new ReviewError(409, "No grade exists to remove");
        const student = studentsById.get(grade.studentId);
        record = new Record({
          studentId: student.studentId,
          name: `${student.firstName} ${student.lastName}`,
          course: courseCode,
          grado: student.gradeLevel,
          seccion: submission.courseSection,
          year: input.year,
        });
        recordsByStudent.set(grade.studentId, record);
      }
      const previousScore = record.grades?.[partial] ?? null;
      if (grade.expectedScore === undefined && previousScore !== null) {
        throw new ReviewError(409, "A legacy request cannot overwrite an existing grade; submit a new request");
      }
      if (grade.expectedScore !== undefined && grade.expectedScore !== previousScore) {
        throw new ReviewError(409, "The grade changed after this request was submitted");
      }
      if (grade.operation === "remove" && previousScore === null) {
        throw new ReviewError(409, "No grade exists to remove");
      }
      if (targets) {
        const target = `${grade.studentId}:${courseCode}:${submission.courseSection}:${input.year}:${partial}`;
        if (targets.has(target)) {
          throw new ReviewError(409, "Two rosters update the same student record and quarter");
        }
        targets.add(target);
      }
      grade.previousScore = previousScore;
      record.set(`grades.${partial}`, grade.operation === "remove" ? null : grade.score);
      await record.save({ session });
    }

    submission.status = "APPROVED";
    submission.approvedAt = new Date();
  } else {
    submission.status = "REJECTED";
    submission.rejectionReason = input.rejectionReason;
  }

  submission.reviewedAt = new Date();
  submission.reviewedBy = reviewer._id;
  await submission.save({ session });
  return { submissionId, status: submission.status };
}

function secretaryOnly(isSecretary, handler) {
  return async (request, context) => {
    try {
      if (!isSecretary) return failure(503, "Grade review access is not configured");
      const access = await isSecretary(request);
      if (access instanceof Response) return access;
      if (!access?._id) return failure(403, "Secretary access required");
      const data = await handler(request, context, access);
      return Response.json({ success: true, data });
    } catch (error) {
      if (error instanceof ReviewError) return failure(error.status, error.message);
      if (error.code === 11000) return failure(409, "An academic record already exists for this student and course");
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
  return secretaryOnly(isSecretary, async (request, { params }, reviewer) => {
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
      reviewSubmission(submissionId, approve, input, session, reviewer),
    );
  });
}

export function createBatchApprovalHandler(isSecretary) {
  return secretaryOnly(isSecretary, async (request, context, reviewer) => {
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
          approved.push(await reviewSubmission(id, true, input, session, reviewer, targets));
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
    return GradeSubmission.find(filter).sort({ submittedAt: -1, _id: -1 }).limit(100).lean();
  });
}
