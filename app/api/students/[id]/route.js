import { NextResponse } from "next/server";
import { dbConnect } from "../../../../lib/db";
import { authorize, assignedStudentFilter } from "../../../../lib/authorization.js";
import Student from "../../../../models/Student";
import {
  clientSafeValidationError,
  validateStudent,
} from "../../../../middleware/validateStudent";

export async function GET(request, { params }) {
  const auth = await authorize(["admin", "staff", "teacher"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    await dbConnect();
    const { id } = await params;
    const filter = auth.user.role === "teacher" ? await assignedStudentFilter(auth.user) : {};
    const student = await Student.findOne({ ...filter, studentId: id });

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student profile not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: student }, { status: 200 });
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { success: false, message: "Unable to fetch student." },
      { status: 500 },
    );
  }
}

export async function PATCH(request, { params }) {
  const auth = await authorize(["admin", "staff"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const validated = validateStudent(body, { partial: true });

    if (validated.error) {
      return NextResponse.json(
        { success: false, message: validated.error },
        { status: 400 },
      );
    }

    const student = await Student.findOneAndUpdate(
      { studentId: id },
      validated.data,
      { new: true, runValidators: true },
    );

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student profile not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Student profile updated successfully.",
        data: student,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      {
        success: false,
        message: clientSafeValidationError(error),
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request, { params }) {
  const auth = await authorize(["admin", "staff"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    await dbConnect();
    const { id } = await params;

    const student = await Student.findOneAndUpdate(
      { studentId: id, status: "active" },
      { status: "archived" },
      { new: true },
    );

    if (!student) {
      const existing = await Student.findOne({ studentId: id });
      if (!existing) {
        return NextResponse.json(
          { success: false, message: "Student profile not found." },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Student profile is already removed from normal use.",
          data: existing,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Student profile removed from normal use.",
        data: student,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error archiving student:", error);
    return NextResponse.json(
      { success: false, message: "Unable to remove student profile." },
      { status: 500 },
    );
  }
}
