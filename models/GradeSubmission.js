const mongoose = require("mongoose");

const gradeSubmissionSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
  subjectId: { type: String, required: true },
  courseSection: { type: String, required: true },
  term: { type: String },
  year: { type: Number },
  status: {
    type: String,
    enum: ["PENDING_REVIEW", "APPROVED", "REJECTED"],
    default: "PENDING_REVIEW",
  },
  submittedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  reviewedAt: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rejectionReason: { type: String },
  grades: [
    {
      studentId: { type: String, required: true },
      operation: { type: String, enum: ["set", "remove"], default: "set" },
      score: {
        type: Number,
        required() { return this.operation !== "remove"; },
        min: 0,
        max: 100,
      },
      comments: { type: String },
      expectedScore: { type: Number, default: undefined },
      previousScore: { type: Number, default: undefined },
    },
  ],
});

module.exports =
  mongoose.models.GradeSubmission ||
  mongoose.model("GradeSubmission", gradeSubmissionSchema);
