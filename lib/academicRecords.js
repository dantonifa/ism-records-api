import mongoose from "mongoose";
import Record from "../models/record.js";
import Student from "../models/Student.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import { dbConnect } from "./db.js";
import { readBody } from "./requestBody.js";

const createFields = new Set(["studentId", "name", "course", "grado", "seccion", "year"]);
const updateFields = new Set(["name", "grado"]);

function failure(status, message) {
  return Response.json({ success: false, message }, { status });
}

function validateInput(body, fields, partial = false) {
  if (!body || typeof body !== "object" || Array.isArray(body) || !Object.keys(body).length) {
    return { error: "Provide academic record details." };
  }
  if (Object.keys(body).some((key) => !fields.has(key))) {
    return { error: "Only permitted non-grade record fields can be changed." };
  }
  for (const [key, value] of Object.entries(body)) {
    if (key === "year") {
      if (!Number.isSafeInteger(value) || value < 2000 || value > 2100) {
        return { error: "Enter a valid academic year." };
      }
    } else if (typeof value !== "string" || !value.trim()) {
      return { error: "Academic record fields must contain text." };
    }
  }
  const record = new Record(body);
  const error = partial ? record.validateSync(Object.keys(body)) : record.validateSync();
  if (error) return { error: "Invalid academic record details." };
  return { data: Object.fromEntries(Object.keys(body).map((key) => [key, typeof body[key] === "string" ? body[key].trim() : body[key]])) };
}

export function createAcademicRecordHandlers(authorize, assignedRecordFilter) {
  async function findRecord(request, context, access, status = "active") {
    const { id } = await context.params;
    const recordId = new URL(request.url).searchParams.get("recordId");
    if (recordId && !mongoose.isObjectIdOrHexString(recordId)) {
      return { error: failure(400, "Invalid academic record ID.") };
    }
    const filter = access.user.role === "teacher" ? await assignedRecordFilter(access.user) : {};
    if (filter.$or?.length === 0) return { error: failure(404, "Academic record not found.") };
    const records = await Record.find({
      $and: [filter],
      studentId: id,
      status: status === "archived" ? "archived" : { $ne: "archived" },
      ...(recordId ? { _id: recordId } : {}),
    }).limit(2);
    if (!records.length) return { error: failure(404, "Academic record not found.") };
    if (records.length > 1) {
      return { error: failure(409, "Select a specific academic record for this student.") };
    }
    return { record: records[0] };
  }

  return {
    async list(request) {
      try {
        const access = await authorize(["admin", "staff", "teacher"]);
        if (access.response) return access.response;
        const status = new URL(request.url).searchParams.get("status");
        if (status && status !== "archived") return failure(400, "Invalid record status.");
        if (status === "archived" && access.user.role !== "admin") {
          return failure(403, "Administrator access required.");
        }
        await dbConnect();
        const filter = access.user.role === "teacher" ? await assignedRecordFilter(access.user) : {};
        const studentId = new URL(request.url).searchParams.get("studentId");
        const records = filter.$or?.length === 0 ? [] : await Record.find({
          ...filter,
          status: status === "archived" ? "archived" : { $ne: "archived" },
          ...(studentId ? { studentId } : {}),
        });
        return Response.json({
          success: true,
          count: records.length,
          data: records,
          canManage: access.user.role === "admin",
          canCreate: access.user.role === "admin" || access.user.role === "staff",
        });
      } catch (error) {
        console.error("Unable to list academic records:", error.name);
        return failure(500, "Unable to list academic records.");
      }
    },

    async create(request) {
      try {
        const access = await authorize(["admin", "staff"]);
        if (access.response) return access.response;
        const input = await readBody(request);
        if (input.error) return failure(400, input.error);
        const validated = validateInput(input.body, createFields);
        if (validated.error) return failure(400, validated.error);
        await dbConnect();
        const data = validated.data;
        const courseCode = data.course.trim().toUpperCase();
        const [student, course] = await Promise.all([
          Student.findOne({ studentId: data.studentId, status: "active", section: data.seccion, year: data.year }).lean(),
          Course.findOne({ code: courseCode, status: "active" }).lean(),
        ]);
        if (!student || !course || !(await Enrollment.exists({
          student: student._id, course: course._id, status: "active",
        }))) {
          return failure(400, "Select an active student enrolled in the course for this section and year.");
        }
        const escapedCode = courseCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if (await Record.exists({
          studentId: data.studentId, course: new RegExp(`^${escapedCode}$`, "i"),
          seccion: data.seccion, year: data.year,
        })) {
          return failure(409, "This academic record already exists.");
        }
        const record = await Record.create({ ...data, course: courseCode });
        return Response.json({ success: true, message: "Academic record created.", data: record }, { status: 201 });
      } catch (error) {
        if (error.code === 11000) return failure(409, "This academic record already exists.");
        console.error("Unable to create academic record:", error.name);
        return failure(500, "Unable to create academic record.");
      }
    },

    async get(request, context) {
      try {
        const access = await authorize(["admin", "staff", "teacher"]);
        if (access.response) return access.response;
        await dbConnect();
        const result = await findRecord(request, context, access);
        if (result.error) return result.error;
        return Response.json({ success: true, data: result.record, canManage: access.user.role === "admin" });
      } catch (error) {
        console.error("Unable to fetch academic record:", error.name);
        return failure(500, "Unable to fetch academic record.");
      }
    },

    async update(request, context) {
      try {
        const access = await authorize(["admin"]);
        if (access.response) return access.response;
        const input = await readBody(request);
        if (input.error) return failure(400, input.error);
        if (input.body?.status === "active" && Object.keys(input.body).length === 1) {
          await dbConnect();
          const result = await findRecord(request, context, access, "archived");
          if (result.error) return result.error;
          const record = result.record;
          const code = record.course.trim().toUpperCase();
          const escapedCode = code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const [student, course, duplicate] = await Promise.all([
            Student.findOne({ studentId: record.studentId, status: "active" }).lean(),
            Course.findOne({ code, status: "active" }).lean(),
            Record.exists({
              _id: { $ne: record._id }, studentId: record.studentId,
              course: new RegExp(`^${escapedCode}$`, "i"), seccion: record.seccion, year: record.year,
            }),
          ]);
          if (duplicate) return failure(409, "Duplicate academic records require administrator review.");
          if (!student || !course || !(await Enrollment.exists({
            student: student._id, course: course._id, status: "active",
          }))) {
            return failure(409, "An active student, course, and enrollment are required to restore this record.");
          }
          const restored = await Record.findOneAndUpdate(
            { _id: record._id, status: "archived" }, { $set: { status: "active" } },
            { new: true, runValidators: true },
          );
          if (!restored) return failure(409, "The academic record has changed; reload and try again.");
          return Response.json({ success: true, message: "Academic record restored.", data: restored });
        }
        const validated = validateInput(input.body, updateFields, true);
        if (validated.error) return failure(400, validated.error);
        await dbConnect();
        const result = await findRecord(request, context, access);
        if (result.error) return result.error;
        result.record.set(validated.data);
        await result.record.save();
        return Response.json({ success: true, message: "Academic record updated.", data: result.record });
      } catch (error) {
        console.error("Unable to update academic record:", error.name);
        return failure(500, "Unable to update academic record.");
      }
    },

    async archive(request, context) {
      try {
        const access = await authorize(["admin"]);
        if (access.response) return access.response;
        await dbConnect();
        const result = await findRecord(request, context, access);
        if (result.error) return result.error;
        result.record.status = "archived";
        await result.record.save();
        return Response.json({ success: true, message: "Academic record archived.", data: result.record });
      } catch (error) {
        console.error("Unable to archive academic record:", error.name);
        return failure(500, "Unable to archive academic record.");
      }
    },
  };
}
