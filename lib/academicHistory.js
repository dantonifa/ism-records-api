import Student from "../models/Student.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Record from "../models/record.js";
import { dbConnect } from "./db.js";

export function createAcademicHistoryHandler(authorize) {
  return async function GET(request, { params }) {
    try {
      const access = await authorize(["admin", "staff"]);
      if (access.response) return access.response;
      await dbConnect();
      const { id } = await params;
      const student = await Student.findOne({ studentId: id }).lean();
      if (!student) {
        return Response.json({ success: false, message: "Student profile not found." }, { status: 404 });
      }
      const [enrollments, records] = await Promise.all([
        Enrollment.find({ student: student._id }).populate({ path: "course", model: Course, select: "code name status" }).lean(),
        Record.find({ studentId: student.studentId }).lean(),
      ]);
      return Response.json({ success: true, data: { enrollments, records } });
    } catch (error) {
      console.error("Unable to load academic history:", error.name);
      return Response.json({ success: false, message: "Unable to load academic history." }, { status: 500 });
    }
  };
}
