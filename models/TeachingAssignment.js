import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
  subjectId: { type: String, required: true, trim: true },
  courseSection: { type: String, required: true, trim: true },
  year: { type: Number, required: true },
  studentIds: [{ type: String, required: true, trim: true }],
});

assignmentSchema.index(
  { teacherId: 1, subjectId: 1, courseSection: 1, year: 1 },
  { unique: true },
);

export default mongoose.models.TeachingAssignment ||
  mongoose.model("TeachingAssignment", assignmentSchema);
