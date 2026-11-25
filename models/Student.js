const mongoose = require("mongoose");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, "Student identifier is required."],
      unique: true,
      trim: true,
      maxlength: [40, "Student identifier must be 40 characters or fewer."],
    },
    firstName: {
      type: String,
      required: [true, "First name is required."],
      trim: true,
      maxlength: [80, "First name must be 80 characters or fewer."],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required."],
      trim: true,
      maxlength: [80, "Last name must be 80 characters or fewer."],
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      trim: true,
      lowercase: true,
      maxlength: [120, "Email must be 120 characters or fewer."],
      validate: {
        validator(value) {
          return EMAIL_PATTERN.test(value);
        },
        message: "Email must be a valid email address.",
      },
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [30, "Phone must be 30 characters or fewer."],
    },
    gradeLevel: {
      type: String,
      required: [true, "Grade level is required."],
      trim: true,
      maxlength: [40, "Grade level must be 40 characters or fewer."],
    },
    section: {
      type: String,
      required: [true, "Section is required."],
      trim: true,
      maxlength: [20, "Section must be 20 characters or fewer."],
    },
    year: {
      type: Number,
      required: [true, "Year is required."],
      min: [2000, "Year must be 2000 or later."],
      max: [2100, "Year must be 2100 or earlier."],
    },
    status: {
      type: String,
      enum: {
        values: ["active", "archived"],
        message: "Status must be active or archived.",
      },
      default: "active",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

studentSchema.index({ firstName: 1, lastName: 1 });
studentSchema.index({ status: 1 });

module.exports =
  mongoose.models.Student || mongoose.model("Student", studentSchema);
