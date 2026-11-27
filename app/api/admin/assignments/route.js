import mongoose from "mongoose";
import { z } from "zod";
import { authorize } from "../../../../lib/authorization.js";
import TeachingAssignment from "../../../../models/TeachingAssignment.js";
import Teacher from "../../../../models/teacher.js";
import Student from "../../../../models/Student.js";
import Course from "../../../../models/Course.js";
import Enrollment from "../../../../models/Enrollment.js";

const assignmentSchema = z.object({
  teacherId: z.string(),
  subjectId: z.string().trim().min(1).max(100),
  courseSection: z.string().trim().min(1).max(20),
  year: z.number().int().min(2000).max(2100),
  studentIds: z.array(z.string().trim().min(1).max(40)).min(1).max(200),
}).strict();

export async function GET() {
  try {
    const access = await authorize(["admin", "teacher"]);
    if (access.response) return access.response;
    if (access.user.role === "teacher" && !access.user.teacherId) {
      return Response.json({ success: true, data: [] });
    }
    const filter = access.user.role === "teacher" ? { teacherId: access.user.teacherId } : {};
    return Response.json({ success: true, data: await TeachingAssignment.find(filter).lean() });
  } catch (error) {
    console.error("Unable to list assignments:", error.name);
    return Response.json({ success: false, error: "Unable to list assignments" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const access = await authorize(["admin"]);
    if (access.response) return access.response;
    const parsed = assignmentSchema.safeParse(await request.json());
    if (!parsed.success || !mongoose.isObjectIdOrHexString(parsed.data.teacherId)) {
      return Response.json({ success: false, error: "Invalid assignment" }, { status: 400 });
    }
    const { teacherId, courseSection, year, studentIds } = parsed.data;
    const subjectId = parsed.data.subjectId.toUpperCase();
    if (new Set(studentIds).size !== studentIds.length) {
      return Response.json({ success: false, error: "Student IDs must be unique" }, { status: 400 });
    }
    if (!(await Teacher.exists({ _id: teacherId }))) {
      return Response.json({ success: false, error: "Teacher record not found" }, { status: 400 });
    }
    const students = await Student.find({
      studentId: { $in: studentIds }, section: courseSection, year, status: "active",
    }).lean();
    if (students.length !== studentIds.length) {
      return Response.json({ success: false, error: "All students must belong to this section and year" }, { status: 400 });
    }
    const course = await Course.findOne({ code: subjectId, status: "active" }).lean();
    if (!course || await Enrollment.countDocuments({
      student: { $in: students.map((student) => student._id) }, course: course._id, status: "active",
    }) !== students.length) {
      return Response.json({ success: false, error: "All students must be actively enrolled in this course code" }, { status: 400 });
    }
    const escapedCode = subjectId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existing = await TeachingAssignment.find({
      teacherId, subjectId: new RegExp(`^${escapedCode}$`, "i"), courseSection, year,
    }).limit(2).lean();
    if (existing.length > 1) {
      return Response.json({ success: false, error: "Duplicate assignments require administrator attention" }, { status: 409 });
    }
    const data = await TeachingAssignment.findOneAndUpdate(
      existing.length ? { _id: existing[0]._id } : { teacherId, subjectId, courseSection, year },
      { $set: { teacherId, subjectId, courseSection, year, studentIds } },
      { upsert: true, new: true, runValidators: true },
    );
    return Response.json({ success: true, data });
  } catch (error) {
    if (error.code === 11000) {
      return Response.json({ success: false, error: "Assignment already exists" }, { status: 409 });
    }
    if (error instanceof SyntaxError) {
      return Response.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }
    console.error("Unable to save assignment:", error.name);
    return Response.json({ success: false, error: "Unable to save assignment" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const access = await authorize(["admin"]);
    if (access.response) return access.response;
    const id = new URL(request.url).searchParams.get("id");
    if (!id || !mongoose.isObjectIdOrHexString(id)) {
      return Response.json({ success: false, error: "Invalid assignment ID" }, { status: 400 });
    }
    const deleted = await TeachingAssignment.findByIdAndDelete(id);
    if (!deleted) return Response.json({ success: false, error: "Assignment not found" }, { status: 404 });
    return Response.json({ success: true });
  } catch (error) {
    console.error("Unable to delete assignment:", error.name);
    return Response.json({ success: false, error: "Unable to delete assignment" }, { status: 500 });
  }
}
