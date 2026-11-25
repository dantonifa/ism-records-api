import { z } from "zod";
import { authorize } from "../../../../lib/authorization.js";
import Teacher from "../../../../models/teacher.js";

const schema = z.object({
  teacherId: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(100),
  department: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional(),
}).strict();

export async function GET() {
  try {
    const access = await authorize(["admin"]);
    if (access.response) return access.response;
    return Response.json({ success: true, data: await Teacher.find().lean() });
  } catch (error) {
    console.error("Unable to list teachers:", error.name);
    return Response.json({ success: false, error: "Unable to list teachers" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const access = await authorize(["admin"]);
    if (access.response) return access.response;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ success: false, error: "Invalid teacher details" }, { status: 400 });
    const data = await Teacher.create(parsed.data);
    return Response.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    if (error.code === 11000) return Response.json({ success: false, error: "Teacher ID already exists" }, { status: 409 });
    console.error("Unable to create teacher:", error.name);
    return Response.json({ success: false, error: "Unable to create teacher" }, { status: 500 });
  }
}
