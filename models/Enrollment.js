const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, immutable: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, immutable: true },
    status: { type: String, enum: ["active", "archived"], default: "active", required: true },
  },
  { timestamps: true, versionKey: false },
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.models.Enrollment || mongoose.model("Enrollment", enrollmentSchema);
