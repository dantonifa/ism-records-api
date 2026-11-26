const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Course code is required."],
      trim: true,
      uppercase: true,
      maxlength: [40, "Course code must be 40 characters or fewer."],
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Course name is required."],
      trim: true,
      maxlength: [120, "Course name must be 120 characters or fewer."],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description must be 2000 characters or fewer."],
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      required: true,
    },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.models.Course || mongoose.model("Course", courseSchema);
