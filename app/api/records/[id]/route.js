import { NextResponse } from "next/server";
import { dbConnect } from "../../../../lib/db";
import Record from "../../../../models/record";
import { authorize, assignedRecordFilter } from "../../../../lib/authorization.js";

// GET /api/records/[id] - Fetch a single student record by studentId
export async function GET(request, { params }) {
  try {
    const access = await authorize(["admin", "staff", "teacher"]);
    if (access.response) return access.response;
    await dbConnect();
    const { id } = await params;

    const filter = access.user.role === "teacher" ? await assignedRecordFilter(access.user) : {};
    const student = filter.$or?.length === 0 ? null : await Record.findOne({ ...filter, studentId: id });
    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student profile not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: student,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching single record:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// PUT /api/records/[id] - Update an existing student record by studentId
export async function PUT(request, { params }) {
  try {
    const access = await authorize(["admin", "staff"]);
    if (access.response) return access.response;
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const updatedRecord = await Record.findOneAndUpdate(
      { studentId: id },
      body,
      { new: true, runValidators: true },
    );

    if (!updatedRecord) {
      return NextResponse.json(
        { success: false, message: "Student profile not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Target academic profile data modified successfully.",
        data: updatedRecord,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating record:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 },
    );
  }
}

// DELETE /api/records/[id] - Permanently delete a student record by studentId
export async function DELETE(request, { params }) {
  try {
    const access = await authorize(["admin", "staff"]);
    if (access.response) return access.response;
    await dbConnect();
    const { id } = await params;

    const deletedRecord = await Record.findOneAndDelete({ studentId: id });
    if (!deletedRecord) {
      return NextResponse.json(
        { success: false, message: "Student profile not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Targeted student record completely expunged from collection.",
        data: deletedRecord,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting record:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
