import mongoose from "mongoose";
import Record from "../models/record.js";
import TeachingAssignment from "../models/TeachingAssignment.js";
import { dbConnect } from "./db.js";
import { readBody } from "./requestBody.js";
import { createGradeSubmissionHandler } from "./submitGrade.js";

const terms = { Q1: "parcial1", Q2: "parcial2", Q3: "parcial3", Q4: "parcial4" };

function failure(status, error) {
  return Response.json({ success: false, error }, { status });
}

function gradeData(record, term) {
  return {
    id: `${record._id}:${term}`,
    studentId: record.studentId,
    course: record.course,
    section: record.seccion,
    year: record.year,
    term,
    score: record.grades?.[terms[term]],
  };
}

export function createGradeResourceHandlers(authorize, assignedRecordFilter) {
  const submit = createGradeSubmissionHandler(authorize);

  async function accessRecord(request, context, roles) {
    const access = await authorize(roles);
    if (access.response) return { error: access.response };
    const { id } = await context.params;
    const match = /^([a-f\d]{24}):(Q[1-4])$/i.exec(id);
    if (!match || !mongoose.isObjectIdOrHexString(match[1])) {
      return { error: failure(400, "Invalid grade ID") };
    }
    await dbConnect();
    const filter = access.user.role === "teacher" ? await assignedRecordFilter(access.user) : {};
    if (filter.$or?.length === 0) return { error: failure(404, "Grade not found") };
    const record = await Record.findOne({
      $and: [filter], _id: match[1], status: { $ne: "archived" },
    }).lean();
    const term = match[2].toUpperCase();
    if (!record || record.grades?.[terms[term]] == null) {
      return { error: failure(404, "Grade not found") };
    }
    return { access, record, term };
  }

  async function change(request, context, operation) {
    try {
      const result = await accessRecord(request, context, ["teacher"]);
      if (result.error) return result.error;
      const { access, record, term } = result;
      let body = {};
      if (operation === "set") {
        const input = await readBody(request);
        if (input.error) return failure(400, input.error);
        body = input.body;
        if (!body || typeof body !== "object" || Array.isArray(body) ||
            Object.keys(body).some((key) => !["score", "comments"].includes(key)) ||
            typeof body.score !== "number" || !Number.isFinite(body.score) ||
            body.score < 0 || body.score > 100 ||
            (body.comments !== undefined && typeof body.comments !== "string")) {
          return failure(400, "Provide a valid score and optional comments");
        }
      }
      const code = record.course.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const assignment = await TeachingAssignment.findOne({
        teacherId: access.user.teacherId, subjectId: new RegExp(`^${code}$`, "i"),
        courseSection: record.seccion, year: record.year, studentIds: record.studentId,
      }).lean();
      if (!assignment) return failure(403, "Grade is not assigned to this teacher");
      return submit(new Request(request.url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subjectId: assignment.subjectId, courseSection: record.seccion, year: record.year, term,
          grades: [{ studentId: record.studentId, operation, ...body }],
        }),
      }));
    } catch (error) {
      console.error("Unable to request grade change:", error.name);
      return failure(500, "Unable to request grade change");
    }
  }

  return {
    create: submit,
    async list() {
      try {
        const access = await authorize(["admin", "staff", "teacher"]);
        if (access.response) return access.response;
        await dbConnect();
        const filter = access.user.role === "teacher" ? await assignedRecordFilter(access.user) : {};
        const records = filter.$or?.length === 0 ? [] : await Record.find({
          ...filter, status: { $ne: "archived" },
        }).lean();
        const data = records.flatMap((record) => Object.keys(terms)
          .filter((term) => record.grades?.[terms[term]] != null)
          .map((term) => gradeData(record, term)));
        return Response.json({ success: true, data });
      } catch (error) {
        console.error("Unable to list grades:", error.name);
        return failure(500, "Unable to list grades");
      }
    },
    async get(request, context) {
      try {
        const result = await accessRecord(request, context, ["admin", "staff", "teacher"]);
        if (result.error) return result.error;
        return Response.json({ success: true, data: gradeData(result.record, result.term) });
      } catch (error) {
        console.error("Unable to fetch grade:", error.name);
        return failure(500, "Unable to fetch grade");
      }
    },
    update: (request, context) => change(request, context, "set"),
    remove: (request, context) => change(request, context, "remove"),
  };
}
