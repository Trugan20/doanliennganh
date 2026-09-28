const mongoose = require("mongoose");

const scoreEntrySchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    notes: { type: String },
  },
  { _id: false },
);

const editHistorySchema = new mongoose.Schema(
  {
    editedAt: { type: Date, default: Date.now },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    doctorName: { type: String },
    changes: {
      overall: { oldValue: Number, newValue: Number },
      gumHealth: { oldValue: Number, newValue: Number },
      toothDecay: { oldValue: Number, newValue: Number },
      alignment: { oldValue: Number, newValue: Number },
      cleanliness: { oldValue: Number, newValue: Number },
      recommendations: { oldValue: [String], newValue: [String] },
      nextCheckupDate: { oldValue: String, newValue: String },
    },
    reason: { type: String },
  },
  { _id: true },
);

const dentalScoreSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    patientName: { type: String, required: true },
    overall: { type: Number, min: 0, max: 100, default: 70 },
    gumHealth: { type: Number, min: 0, max: 100, default: 70 },
    toothDecay: { type: Number, min: 0, max: 100, default: 70 },
    alignment: { type: Number, min: 0, max: 100, default: 70 },
    cleanliness: { type: Number, min: 0, max: 100, default: 70 },
    history: [scoreEntrySchema],
    lastAssessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastAssessedAt: { type: Date },
    nextCheckupDate: { type: String },
    recommendations: [{ type: String }],
    editHistory: [editHistorySchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model("DentalScore", dentalScoreSchema);
