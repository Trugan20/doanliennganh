"use strict";

const jwt = require("jsonwebtoken");
const User = require("../models/User");

let chatNamespace = null;

function setupChatSocket(io) {
  chatNamespace = io.of("/chat-events");

  chatNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id isActive");
      if (!user || !user.isActive) {
        return next(new Error("Invalid or inactive user"));
      }

      socket.data.userId = user._id.toString();
      next();
    } catch {
      next(new Error("Invalid authentication token"));
    }
  });

  chatNamespace.on("connection", (socket) => {
    socket.join(`user:${socket.data.userId}`);
  });
}

function notifyConversationMessage(conversation, senderId, message) {
  if (!chatNamespace) {
    console.warn("[ChatSocket] Namespace is not initialized; message event skipped");
    return;
  }

  conversation.participants.forEach((participant) => {
    const participantId = participant._id
      ? participant._id.toString()
      : participant.toString();

    if (participantId !== senderId.toString()) {
      chatNamespace.to(`user:${participantId}`).emit("conversation:new-message", {
        conversationId: conversation._id.toString(),
        message,
      });
    }
  });
}

module.exports = { setupChatSocket, notifyConversationMessage };
