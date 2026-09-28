'use strict';

/**
 * Wraps an async route handler and forwards any errors to Express's next().
 * Eliminates repetitive try/catch in every controller action.
 *
 * Usage:
 *   router.get('/foo', asyncHandler(async (req, res) => {
 *     const data = await someAsyncOperation();
 *     res.json({ data });
 *   }));
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;