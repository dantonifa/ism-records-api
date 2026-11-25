import { NextResponse } from "next/server";
import { dbConnect } from "../../../lib/db";
import { authorizeStaff } from "../../../lib/authorizeStaff";
import Student from "../../../models/Student";
import {
  clientSafeValidationError,
  validateStudent,
} from "../../../middleware/validateStudent";

function buildStudentQuery(searchParams) {
  const query = {};
  const status = (searchParams.get("status") || "active").trim().toLowerCase();
  const studentId = (searchParams.get("studentId") || "").trim();
  const name = (searchParams.get("name") || "").trim();
  const q = (searchParams.get("q") || "").trim();

  if (status !== "all") {
    if (status !== "active" && status !== "archived") {
      return { error: "Status filter must be active, archived, or all." };
    }
    query.status = status;
  }

  if (studentId) {
    query.studentId = new RegExp(
      `^${studentId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
      "i",
    );
  }

  if (name) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { firstName: new RegExp(escaped, "i") },
      { lastName: new RegExp(escaped, "i") },
    ];
  }

  if (q) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(escaped, "i");
    query.$or = [
      { studentId: pattern },
      { firstName: pattern },
      { lastName: pattern },
      { email: pattern },
    ];
  }

  return { query };
}

export async function GET(request) {
  const auth = authorizeStaff(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const built = buildStudentQuery(searchParams);
    if (built.error) {
      return NextResponse.json(
        { success: false, message: built.error },
        { status: 400 },
      );
    }

    const students = await Student.find(built.query).sort({
      lastName: 1,
      firstName: 1,
    });

    return NextResponse.json(
      {
        success: true,
        count: students.length,
        data: students,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error listing students:", error);
    return NextResponse.json(
      { success: false, message: "Unable to list students." },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const auth = authorizeStaff(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    await dbConnect();
    const body = await request.json();
    const validated = validateStudent(body);
    if (validated.error) {
      return NextResponse.json(
        { success: false, message: validated.error },
        { status: 400 },
      );
    }

    const student = await Student.create(validated.data);

    return NextResponse.json(
      {
        success: true,
        message: "Student profile created successfully.",
        data: student,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating student:", error);
    const status = error.code === 11000 ? 400 : 500;
    return NextResponse.json(
      {
        success: false,
        message: clientSafeValidationError(error),
      },
      { status },
    );
  }
}
