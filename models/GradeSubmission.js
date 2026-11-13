const mongoose = require("mongoose");

const gradeSubmissionSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
  subjectId: { type: String, required: true },
  courseSection: { type: String, required: true },
  term: { type: String },
  status: {
    type: String,
    enum: ["PENDING_REVIEW", "APPROVED", "REJECTED"],
    default: "PENDING_REVIEW",
  },
  submittedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  grades: [
    {
      studentId: { type: String, required: true },
      score: { type: Number, required: true, min: 0, max: 100 },
      comments: { type: String },
    },
  ],
});

module.exports =
  mongoose.models.GradeSubmission ||
  mongoose.model("GradeSubmission", gradeSubmissionSchema);
