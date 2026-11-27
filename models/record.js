const mongoose = require("mongoose");

const recordSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true },
    name: { type: String, required: true },
    course: { type: String, required: true },
    grades: {
      parcial1: { type: Number, min: 0, max: 100, default: null },
      parcial2: { type: Number, min: 0, max: 100, default: null },
      parcial3: { type: Number, min: 0, max: 100, default: null },
      parcial4: { type: Number, min: 0, max: 100, default: null },
    },
    grado: { type: String, required: true },
    seccion: { type: String, required: true },
    year: { type: Number, required: true },
    status: { type: String, enum: ["active", "archived"], default: "active" },
  },
  { versionKey: false },
); // 👈 disables __v

recordSchema.index({ studentId: 1, course: 1, seccion: 1, year: 1 }, { unique: true });

module.exports =
  mongoose.models.Record || mongoose.model("Record", recordSchema);
