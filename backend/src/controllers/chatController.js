'use strict';

const { v4: uuidv4 } = require('uuid');
const ChatHistory = require('../models/ChatHistory');
const DentalScore = require('../models/DentalScore');
const MedicalRecord = require('../models/MedicalRecord');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { getPagination } = require('../utils/pagination');
const { publicChat, privateChat } = require('../services/aiService');

// POST /api/chat/public  [no auth]
const publicChatHandler = async (req, res) => {
  try {
    const { message, history = [], sessionId } = req.body;

    if (!message || !message.trim()) {
      return sendError(res, 400, 'Message is required.');
    }

    const sid = sessionId || uuidv4();

    // Build conversation history for AI
    const conversationHistory = (history || []).map(m => ({
      role: m.role,
      content: m.content,
    }));

    const reply = await publicChat(message.trim(), conversationHistory);

    // Persist session to DB (anonymous)
    let session = await ChatHistory.findOne({ sessionId: sid, type: 'public' });
    if (!session) {
      session = new ChatHistory({ sessionId: sid, type: 'public', messages: [] });
    }

    session.messages.push(
      { role: 'user', content: message.trim(), timestamp: new Date() },
      { role: 'assistant', content: reply, timestamp: new Date() }
    );
    session.lastMessageAt = new Date();
    await session.save();

    return sendSuccess(res, 200, 'Chat response', { reply, sessionId: sid });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// POST /api/chat/private  [auth: patient, doctor]
const privateChatHandler = async (req, res) => {
  try {
    const { message, history = [], sessionId } = req.body;

    if (!message || !message.trim()) {
      return sendError(res, 400, 'Message is required.');
    }

    const sid = sessionId || uuidv4();

    // Build user context from database
    const userContext = { name: req.user.name, role: req.user.role };

    if (req.user.role === 'patient') {
      const [score, recentRecord] = await Promise.all([
        DentalScore.findOne({ patient: req.user._id }).select('overall gumHealth toothDecay alignment cleanliness'),
        MedicalRecord.findOne({ patient: req.user._id }).sort({ createdAt: -1 }).select('diagnosis treatment'),
      ]);
      if (score) userContext.dentalScore = score;
      if (recentRecord) userContext.recentDiagnosis = recentRecord.diagnosis;
    }

    const conversationHistory = (history || []).map(m => ({
      role: m.role,
      content: m.content,
    }));

    const reply = await privateChat(message.trim(), conversationHistory, userContext);

    // Persist session
    let session = await ChatHistory.findOne({
      sessionId: sid,
      type: 'private',
      user: req.user._id,
    });

    if (!session) {
      session = new ChatHistory({
        sessionId: sid,
        type: 'private',
        user: req.user._id,
        messages: [],
        context: { patientId: req.user.role === 'patient' ? req.user._id : undefined },
      });
    }

    session.messages.push(
      { role: 'user', content: message.trim(), timestamp: new Date() },
      { role: 'assistant', content: reply, timestamp: new Date() }
    );
    session.lastMessageAt = new Date();
    await session.save();

    return sendSuccess(res, 200, 'Chat response', { reply, sessionId: sid });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// GET /api/chat/history  [auth: patient/doctor gets own; admin gets all]
const getHistory = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};

    if (req.user.role === 'admin') {
      if (req.query.userId) filter.user = req.query.userId;
      if (req.query.type) filter.type = req.query.type;
    } else {
      filter.user = req.user._id;
      filter.type = 'private';
    }

    const [sessions, total] = await Promise.all([
      ChatHistory.find(filter)
        .populate('user', 'name email role')
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-messages'),
      ChatHistory.countDocuments(filter),
    ]);

    return sendPaginated(res, sessions, total, page, limit);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// GET /api/chat/history/:sessionId  [auth: owner or admin]
const getSessionMessages = async (req, res) => {
  try {
    const session = await ChatHistory.findOne({ sessionId: req.params.sessionId })
      .populate('user', 'name email role');

    if (!session) return sendError(res, 404, 'Chat session not found.');

    if (
      req.user.role !== 'admin' &&
      session.user &&
      session.user._id.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 403, 'Access denied.');
    }

    // Return messages in format usable by frontend
    const messages = session.messages.map((m, i) => ({
      id: `${session.sessionId}-${i}`,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    }));

    return sendSuccess(res, 200, 'Session messages retrieved', { session, messages });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// DELETE /api/chat/history/:sessionId  [auth: owner or admin]
const deleteSession = async (req, res) => {
  try {
    const session = await ChatHistory.findOne({ sessionId: req.params.sessionId });
    if (!session) return sendError(res, 404, 'Chat session not found.');

    if (
      req.user.role !== 'admin' &&
      session.user?.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 403, 'Access denied.');
    }

    await session.deleteOne();
    return sendSuccess(res, 200, 'Chat session deleted');
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

module.exports = {
  publicChatHandler,
  privateChatHandler,
  getHistory,
  getSessionMessages,
  deleteSession,
};