import { z } from "zod";
import User from "../../../models/User.js";
import { dbConnect } from "../../../lib/db.js";

const registrationSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254),
    password: z.string().min(8).max(72),
  })
  .strict();

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: "Invalid JSON request body" },
      { status: 400 },
    );
  }

  const parsed = registrationSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      {
        success: false,
        error: "Invalid registration details",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { name, password } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  if (Buffer.byteLength(password, "utf8") > 72) {
    return Response.json(
      { success: false, error: "Password is too long" },
      { status: 400 },
    );
  }

  try {
    await dbConnect();

    const existingUser = await User.findOne({ email }).lean();

    if (existingUser) {
      return Response.json(
        {
          success: false,
          error: "An account with this email already exists",
        },
        { status: 409 },
      );
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    return Response.json(
      {
        success: true,
        message: "Account created successfully",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);

    if (error?.code === 11000) {
      return Response.json(
        {
          success: false,
          error: "An account with this email already exists",
        },
        { status: 409 },
      );
    }

    return Response.json(
      {
        success: false,
        error: "Unable to create account",
      },
      { status: 500 },
    );
  }
}