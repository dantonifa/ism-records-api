import { NextResponse } from "next/server";
import { dbConnect } from "../../../lib/db";
import Record from "../../../models/record";
import { authorize, assignedRecordFilter } from "../../../lib/authorization.js";

// Método GET para consultar todos los registros académicos
export async function GET() {
  try {
    const access = await authorize(["admin", "staff", "teacher"]);
    if (access.response) return access.response;
    await dbConnect();
    const filter = access.user.role === "teacher" ? await assignedRecordFilter(access.user) : {};
    const records = filter.$or?.length === 0 ? [] : await Record.find(filter);

    return NextResponse.json(
      {
        success: true,
        count: records.length,
        data: records,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching records:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// Método POST para registrar un nuevo estudiante con sus notas
export async function POST(request) {
  try {
    const access = await authorize(["admin", "staff"]);
    if (access.response) return access.response;
    await dbConnect();
    const body = await request.json();

    const newRecord = await Record.create(body);

    return NextResponse.json(
      {
        success: true,
        message: "Academic record profile stored successfully.",
        data: newRecord,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating record:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 },
    );
  }
}
