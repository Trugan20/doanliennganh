'use strict';

const logger = require('../utils/logger');

/**
 * Per-request structured logging middleware.
 * Logs method, URL, status, response time, and user identity on response finish.
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Attach a simple request ID for tracing
  req.requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  res.setHeader('X-Request-Id', req.requestId);

  // Log on response finish
  res.on('finish', () => {
    const ms = Date.now() - start;
    const userId = req.user ? req.user._id : 'anon';
    const role   = req.user ? req.user.role : '-';

    const level = res.statusCode >= 500 ? 'error'
                : res.statusCode >= 400 ? 'warn'
                : 'info';

    logger[level](
      `${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`,
      {
        requestId: req.requestId,
        userId,
        role,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
        contentLength: res.get('content-length') || 0,
      }
    );
  });

  next();
};

/**
 * Lightweight version that only logs errors (4xx/5xx).
 */
const errorRequestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (res.statusCode < 400) return;
    const ms = Date.now() - start;
    logger.warn(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`, {
      userId: req.user?._id || 'anon',
      body: res.statusCode >= 400 ? sanitizeBody(req.body) : undefined,
    });
  });
  next();
};

function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body;
  const safe = { ...body };
  ['password', 'currentPassword', 'newPassword', 'token', 'secret'].forEach(k => {
    if (safe[k]) safe[k] = '[REDACTED]';
  });
  return safe;
}

module.exports = { requestLogger, errorRequestLogger };