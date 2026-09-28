'use strict';

const router = require('express').Router();
const {
  publicChatHandler,
  privateChatHandler,
  getHistory,
  getSessionMessages,
  deleteSession,
} = require('../controllers/chatController');
const { auth, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const Joi = require('joi');

const chatSchema = {
  body: Joi.object({
    message:   Joi.string().max(4000).required(),
    history:   Joi.array().items(Joi.object({
      role:    Joi.string().valid('user','assistant','system').required(),
      content: Joi.string().required(),
    })).max(50).default([]),
    sessionId: Joi.string().allow('', null),
  }),
};

// Public – no auth required
router.post('/public', validate(chatSchema), publicChatHandler);

// Private – auth required; patient or doctor
router.post('/private',
  auth,
  authorize('patient', 'doctor'),
  validate(chatSchema),
  privateChatHandler
);

// History – all authenticated; admin sees all
router.get('/history',              auth, getHistory);
router.get('/history/:sessionId',   auth, getSessionMessages);
router.delete('/history/:sessionId', auth, deleteSession);

module.exports = router;