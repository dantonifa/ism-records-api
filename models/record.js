const mongoose = require("mongoose");

const recordSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    course: { type: String, required: true, trim: true },
    grades: {
      parcial1: { type: Number, required: true, min: 0, max: 100 },
      parcial2: { type: Number, required: true, min: 0, max: 100 },
      parcial3: { type: Number, required: true, min: 0, max: 100 },
      parcial4: { type: Number, required: true, min: 0, max: 100 },
    },
    grado: { type: String, required: true, trim: true },
    seccion: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
  },
  { versionKey: false, timestamps: true },
);

module.exports =
  mongoose.models.Record || mongoose.model("Record", recordSchema);
