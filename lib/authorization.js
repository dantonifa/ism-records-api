import { auth } from "../auth.js";
import User from "../models/User.js";
import TeachingAssignment from "../models/TeachingAssignment.js";
import { dbConnect } from "./db.js";
import { createAuthorization } from "./accessPolicy.js";

export const authorize = createAuthorization(auth, dbConnect, (id) => User.findById(id).lean());

export async function assignedStudentFilter(user) {
  if (!user.teacherId) return { _id: { $in: [] } };
  const assignments = await TeachingAssignment.find({ teacherId: user.teacherId }).lean();
  if (!assignments.length) return { _id: { $in: [] } };
  return {
    $or: assignments.map(({ courseSection, year, studentIds }) => ({
      section: courseSection,
      year,
      status: "active",
      studentId: { $in: studentIds },
    })),
  };
}

export async function assignedRecordFilter(user) {
  if (!user.teacherId) return { _id: { $in: [] } };
  const assignments = await TeachingAssignment.find({ teacherId: user.teacherId }).lean();
  return {
    $or: assignments.map(({ subjectId, courseSection, year, studentIds }) => ({
      course: subjectId,
      seccion: courseSection,
      year,
      studentId: { $in: studentIds },
    })),
  };
}
