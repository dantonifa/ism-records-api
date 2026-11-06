import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Record from "@/models/record";

// Método GET para consultar todos los registros académicos
export async function GET(request) {
  try {
    await dbConnect();
    const records = await Record.find({});

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
    await dbConnect();
    const body = await request.json();

    const newRecord = await Record.create(body);

    return NextResponse.json(
      {
        success: true,
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
