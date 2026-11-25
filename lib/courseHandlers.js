import mongoose from "mongoose";
import Course from "../models/Course.js";
import { validateCourse } from "../middleware/validateCourse.js";
import { dbConnect } from "./db.js";

function failure(status, message) {
  return Response.json({ success: false, message }, { status });
}

async function readBody(request) {
  try {
    return { body: await request.json() };
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return { error: "Invalid JSON." };
  }
}

export function createCourseHandlers(authorize) {
  async function getId(context) {
    const { id } = await context.params;
    return mongoose.isObjectIdOrHexString(id) ? id : null;
  }

  return {
    async list() {
      try {
        const auth = await authorize(["admin", "staff", "teacher"]);
        if (auth.response) return auth.response;
        await dbConnect();
        const data = await Course.find({ status: "active" }).sort({ name: 1, _id: 1 }).lean();
        return Response.json({ success: true, data, canManage: auth.user.role === "admin" });
      } catch (error) {
        console.error("Unable to list courses:", error.name);
        return failure(500, "Unable to list courses.");
      }
    },

    async create(request) {
      try {
        const auth = await authorize(["admin"]);
        if (auth.response) return auth.response;
        const input = await readBody(request);
        if (input.error) return failure(400, input.error);
        const validated = validateCourse(input.body);
        if (validated.error) return failure(400, validated.error);
        await dbConnect();
        const data = await Course.create(validated.data);
        return Response.json({ success: true, data, message: "Course created." }, { status: 201 });
      } catch (error) {
        if (error.code === 11000) return failure(409, "A course with this code already exists.");
        console.error("Unable to create course:", error.name);
        return failure(500, "Unable to create course.");
      }
    },

    async get(request, context) {
      try {
        const auth = await authorize(["admin", "staff", "teacher"]);
        if (auth.response) return auth.response;
        const id = await getId(context);
        if (!id) return failure(400, "Invalid course ID.");
        await dbConnect();
        const data = await Course.findOne({ _id: id, status: "active" }).lean();
        if (!data) return failure(404, "Course not found.");
        return Response.json({ success: true, data, canManage: auth.user.role === "admin" });
      } catch (error) {
        console.error("Unable to fetch course:", error.name);
        return failure(500, "Unable to fetch course.");
      }
    },

    async update(request, context) {
      try {
        const auth = await authorize(["admin"]);
        if (auth.response) return auth.response;
        const id = await getId(context);
        if (!id) return failure(400, "Invalid course ID.");
        const input = await readBody(request);
        if (input.error) return failure(400, input.error);
        const validated = validateCourse(input.body, { partial: true });
        if (validated.error) return failure(400, validated.error);
        await dbConnect();
        const data = await Course.findOneAndUpdate(
          { _id: id, status: "active" },
          { $set: validated.data },
          { new: true, runValidators: true },
        );
        if (!data) return failure(404, "Course not found.");
        return Response.json({ success: true, data, message: "Course updated." });
      } catch (error) {
        console.error("Unable to update course:", error.name);
        return failure(500, "Unable to update course.");
      }
    },

    async archive(request, context) {
      try {
        const auth = await authorize(["admin"]);
        if (auth.response) return auth.response;
        const id = await getId(context);
        if (!id) return failure(400, "Invalid course ID.");
        await dbConnect();
        const data = await Course.findOneAndUpdate(
          { _id: id, status: "active" },
          { $set: { status: "archived" } },
          { new: true, runValidators: true },
        );
        if (!data) return failure(404, "Course not found.");
        return Response.json({ success: true, data, message: "Course archived." });
      } catch (error) {
        console.error("Unable to archive course:", error.name);
        return failure(500, "Unable to archive course.");
      }
    },
  };
}
