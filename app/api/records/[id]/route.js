import { NextResponse } from "next/server";
import { dbConnect } from "../../../../lib/db";
import Record from "../../../../models/record";

// GET /api/records/[id] - Fetch a single student record by studentId
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const student = await Record.findOne({ studentId: id });
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
