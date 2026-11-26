import mongoose from "mongoose";
import { z } from "zod";
import { authorize } from "../../../../lib/authorization.js";
import User from "../../../../models/User.js";
import Teacher from "../../../../models/teacher.js";

const updateSchema = z.object({
  userId: z.string(),
  role: z.enum(["admin", "staff", "teacher"]),
  isActive: z.boolean(),
  teacherId: z.string().optional(),
}).strict();

export async function GET() {
  try {
    const access = await authorize(["admin"]);
    if (access.response) return access.response;
    const users = await User.find({}, "name email role isActive teacherId").lean();
    return Response.json({ success: true, data: users });
  } catch (error) {
    console.error("Unable to list users:", error.name);
    return Response.json({ success: false, error: "Unable to list users" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const access = await authorize(["admin"]);
    if (access.response) return access.response;
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success || !mongoose.isObjectIdOrHexString(parsed.data.userId)) {
      return Response.json({ success: false, error: "Invalid account update" }, { status: 400 });
    }
    const { userId, role, isActive, teacherId } = parsed.data;
    if (String(access.user._id) === userId.toLowerCase() && (role !== "admin" || !isActive)) {
      return Response.json({ success: false, error: "You cannot revoke your own administrator access" }, { status: 400 });
    }
    if (role === "teacher") {
      if (!teacherId || !mongoose.isObjectIdOrHexString(teacherId) || !(await Teacher.exists({ _id: teacherId }))) {
        return Response.json({ success: false, error: "A valid teacher record is required" }, { status: 400 });
      }
    }
    const user = await User.findByIdAndUpdate(
      userId,
      role === "teacher" ? { $set: { role, isActive, teacherId } } : { $set: { role, isActive }, $unset: { teacherId: 1 } },
      { new: true, runValidators: true, projection: "name email role isActive teacherId" },
    );
    if (!user) return Response.json({ success: false, error: "Account not found" }, { status: 404 });
    return Response.json({ success: true, data: user });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }
    console.error("Unable to update user:", error.name);
    return Response.json({ success: false, error: "Unable to update user" }, { status: 500 });
  }
}
