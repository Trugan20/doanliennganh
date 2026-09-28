const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const chatHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    sessionId: { type: String, required: true },
    type: {
      type: String,
      enum: ['public', 'private'],
      required: true,
    },
    messages: [messageSchema],
    context: {
      patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      medicalContext: { type: String },
    },
    isActive: { type: Boolean, default: true },
    totalTokens: { type: Number, default: 0 },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

chatHistorySchema.index({ user: 1, createdAt: -1 });
chatHistorySchema.index({ sessionId: 1 });
chatHistorySchema.index({ type: 1 });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);