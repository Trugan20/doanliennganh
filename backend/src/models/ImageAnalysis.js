const mongoose = require('mongoose');

const imageAnalysisSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    patientName: { type: String, required: true },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    url: { type: String, required: true },
    mimetype: { type: String },
    size: { type: Number },
    type: {
      type: String,
      enum: ['xray', 'photo', 'scan', 'other'],
      default: 'photo',
    },
    toothNumber: { type: Number },
    description: { type: String, trim: true },
    aiAnalysis: {
      processed: { type: Boolean, default: false },
      findings: [{ type: String }],
      confidence: { type: Number, min: 0, max: 1 },
      processedAt: { type: Date },
      rawResult: { type: mongoose.Schema.Types.Mixed },
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

imageAnalysisSchema.index({ patient: 1, createdAt: -1 });
imageAnalysisSchema.index({ uploadedBy: 1 });
imageAnalysisSchema.index({ type: 1 });

module.exports = mongoose.model('ImageAnalysis', imageAnalysisSchema);