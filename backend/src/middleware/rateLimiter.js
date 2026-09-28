'use strict';

/**
 * Re-exports all rate limiters as named middleware, making them easy to
 * attach to individual routes without importing the full config object.
 *
 * Usage:
 *   const { authLimiter } = require('../middleware/rateLimiter');
 *   router.post('/login', authLimiter, loginController);
 */
const {
  globalLimiter,
  authLimiter,
  chatLimiter,
  uploadLimiter,
  predictionLimiter,
} = require('../config/rateLimit');

module.exports = {
  globalLimiter,
  authLimiter,
  chatLimiter,
  uploadLimiter,
  predictionLimiter,
};