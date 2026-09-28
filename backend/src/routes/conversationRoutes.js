const express = require("express");
const { auth } = require("../middleware/auth");
const {
  getConversations,
  getConversation,
  sendMessage,
  findOrCreateConversation,
  getAvailableUsers,
} = require("../controllers/conversationController");

const router = express.Router();

router.use(auth);

// GET /api/conversations - Get all conversations
router.get("/", getConversations);

// GET /api/conversations/available-users - Get users to chat with
router.get("/available-users", getAvailableUsers);

// POST /api/conversations/find-or-create - Get or create conversation
router.post("/find-or-create", findOrCreateConversation);

// GET /api/conversations/:id - Get conversation details
router.get("/:id", getConversation);

// POST /api/conversations/:id/messages - Send message
router.post("/:id/messages", sendMessage);

module.exports = router;
