'use strict';

/**
 * NoSQL injection & XSS sanitisation middleware.
 *
 * Strips MongoDB operator keys (e.g. $where, $gt) from req.body, req.query,
 * and req.params to prevent injection attacks.
 * Also strips basic HTML tags from string values to mitigate XSS.
 */

const MONGO_OPERATORS = /^\$/;
const HTML_TAGS = /<[^>]*>/g;

function sanitizeValue(value) {
  if (typeof value === 'string') {
    return value.replace(HTML_TAGS, '').trim();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    return sanitizeObject(value);
  }
  return value;
}

function sanitizeObject(obj) {
  const result = {};
  for (const key of Object.keys(obj)) {
    if (MONGO_OPERATORS.test(key)) {
      // Drop dangerous operator key entirely
      continue;
    }
    result[key] = sanitizeValue(obj[key]);
  }
  return result;
}

const sanitize = (req, res, next) => {
  if (req.body   && typeof req.body   === 'object') req.body   = sanitizeObject(req.body);
  if (req.query  && typeof req.query  === 'object') req.query  = sanitizeObject(req.query);
  if (req.params && typeof req.params === 'object') req.params = sanitizeObject(req.params);
  next();
};

module.exports = sanitize;