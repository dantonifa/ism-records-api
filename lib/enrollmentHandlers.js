import mongoose from "mongoose";
import Enrollment from "../models/Enrollment.js";
import Student from "../models/Student.js";
import Course from "../models/Course.js";
import { dbConnect } from "./db.js";
import { readBody } from "./requestBody.js";

function failure(status, message) {
  return Response.json({ success: false, message }, { status });
}

function isId(value) {
  return typeof value === "string" && mongoose.isObjectIdOrHexString(value);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function activeReferences(studentId, courseId) {
  const [student, course] = await Promise.all([
    Student.exists({ _id: studentId, status: "active" }),
    Course.exists({ _id: courseId, status: "active" }),
  ]);
  return Boolean(student && course);
}

export function createEnrollmentHandlers(authorize) {
  async function getId(context) {
    const { id } = await context.params;
    return isId(id) ? id : null;
  }

  return {
    async list() {
      try {
        const access = await authorize(["admin", "staff"]);
        if (access.response) return access.response;
        await dbConnect();
        const data = await Enrollment.find()
          .sort({ updatedAt: -1, _id: -1 })
          .populate("student", "studentId firstName lastName status")
          .populate("course", "code name status")
          .lean();
        return Response.json({ success: true, data, canManage: access.user.role === "admin" });
      } catch (error) {
        console.error("Unable to list enrollments:", error.name);
        return failure(500, "Unable to list enrollments.");
      }
    },

    async create(request) {
      try {
        const access = await authorize(["admin", "staff"]);
        if (access.response) return access.response;
        const input = await readBody(request);
        if (input.error) return failure(400, input.error);
        const body = input.body;
        if (!isObject(body) || Object.keys(body).some((key) => !["studentId", "courseId"].includes(key)) ||
            !isId(body.studentId) || !isId(body.courseId)) {
          return failure(400, "Provide valid student and course IDs.");
        }
        await dbConnect();
        if (!(await activeReferences(body.studentId, body.courseId))) {
          return failure(400, "Select an active student and course.");
        }
        const data = await Enrollment.create({ student: body.studentId, course: body.courseId });
        return Response.json({ success: true, data, message: "Enrollment created." }, { status: 201 });
      } catch (error) {
        if (error.code === 11000) return failure(409, "This enrollment already exists. Restore it if it is archived.");
        console.error("Unable to create enrollment:", error.name);
        return failure(500, "Unable to create enrollment.");
      }
    },

    async get(request, context) {
      try {
        const access = await authorize(["admin", "staff"]);
        if (access.response) return access.response;
        const id = await getId(context);
        if (!id) return failure(400, "Invalid enrollment ID.");
        await dbConnect();
        const data = await Enrollment.findById(id)
          .populate("student", "studentId firstName lastName status")
          .populate("course", "code name status")
          .lean();
        if (!data) return failure(404, "Enrollment not found.");
        return Response.json({ success: true, data });
      } catch (error) {
        console.error("Unable to fetch enrollment:", error.name);
        return failure(500, "Unable to fetch enrollment.");
      }
    },

    async update(request, context) {
      try {
        const access = await authorize(["admin"]);
        if (access.response) return access.response;
        const id = await getId(context);
        if (!id) return failure(400, "Invalid enrollment ID.");
        const input = await readBody(request);
        if (input.error) return failure(400, input.error);
        const body = input.body;
        if (!isObject(body) || Object.keys(body).length !== 1 || !["active", "archived"].includes(body.status)) {
          return failure(400, "Provide a valid enrollment status.");
        }
        await dbConnect();
        if (body.status === "active") {
          const current = await Enrollment.findById(id).lean();
          if (!current) return failure(404, "Enrollment not found.");
          if (!(await activeReferences(current.student, current.course))) {
            return failure(409, "The student and course must be active before restoring enrollment.");
          }
        }
        const data = await Enrollment.findByIdAndUpdate(
          id, { $set: { status: body.status } }, { new: true, runValidators: true },
        );
        if (!data) return failure(404, "Enrollment not found.");
        return Response.json({ success: true, data, message: "Enrollment updated." });
      } catch (error) {
        console.error("Unable to update enrollment:", error.name);
        return failure(500, "Unable to update enrollment.");
      }
    },

    async archive(request, context) {
      try {
        const access = await authorize(["admin"]);
        if (access.response) return access.response;
        const id = await getId(context);
        if (!id) return failure(400, "Invalid enrollment ID.");
        await dbConnect();
        const data = await Enrollment.findByIdAndUpdate(
          id, { $set: { status: "archived" } }, { new: true, runValidators: true },
        );
        if (!data) return failure(404, "Enrollment not found.");
        return Response.json({ success: true, data, message: "Enrollment archived." });
      } catch (error) {
        console.error("Unable to archive enrollment:", error.name);
        return failure(500, "Unable to archive enrollment.");
      }
    },
  };
}
