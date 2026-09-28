'use strict';

const rateLimit = require('express-rate-limit');

const errorResponse = (message) => ({
  success: false,
  message,
});

/** General API limiter – 200 req / 15 min */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json(errorResponse('Too many requests. Please try again later.')),
});

/** Auth endpoints – 20 req / 15 min */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json(errorResponse('Too many auth attempts. Please try again in 15 minutes.')),
});

/** Chat – 30 req / min */
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json(errorResponse('Chat rate limit reached. Please slow down.')),
});

/** File upload – 50 req / 15 min */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json(errorResponse('Upload rate limit reached. Try again later.')),
});

/** AI prediction – 20 req / 15 min */
const predictionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json(errorResponse('Prediction rate limit reached. Try again later.')),
});

module.exports = {
  globalLimiter,
  authLimiter,
  chatLimiter,
  uploadLimiter,
  predictionLimiter,
};