'use strict';

/**
 * Ownership guard middleware factory.
 *
 * Ensures a patient can only access their own resources.
 * For doctors and admins, access is always granted.
 *
 * Usage:
 *   const ownershipGuard = require('../middleware/ownershipGuard');
 *
 *   // Guard by query param field matching req.user._id
 *   router.get('/:id', auth, ownershipGuard('patient'), getById);
 *
 *   // Guard using a custom resolver (async function that returns the owner ID)
 *   router.get('/:id', auth, ownershipGuard(async (req) => {
 *     const record = await MedicalRecord.findById(req.params.id);
 *     return record?.patient?.toString();
 *   }), getById);
 */

const { sendError } = require('../utils/response');

/**
 * @param {string|Function} ownerField
 *   - string: name of a field on req.params/req.query that holds the owner user ID
 *   - async function: receives req, returns the owner user ID string (or null)
 */
const ownershipGuard = (ownerField = 'patientId') => async (req, res, next) => {
  // Admins and doctors bypass the guard
  if (req.user.role === 'admin' || req.user.role === 'doctor') {
    return next();
  }

  try {
    let ownerId;

    if (typeof ownerField === 'function') {
      ownerId = await ownerField(req);
    } else {
      ownerId =
        req.params[ownerField] ||
        req.query[ownerField] ||
        req.body[ownerField];
    }

    if (!ownerId) {
      // If we can't determine the owner from params, pass through
      // (controller is responsible for enforcing its own ownership logic)
      return next();
    }

    if (ownerId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Access denied. You can only access your own data.');
    }

    next();
  } catch (err) {
    return sendError(res, 500, 'Ownership check failed: ' + err.message);
  }
};

/**
 * Strict version — always requires the patient to match.
 * Throws 403 if ownerField is missing from the request.
 */
const strictOwnershipGuard = (ownerField) => async (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'doctor') return next();

  try {
    let ownerId;
    if (typeof ownerField === 'function') {
      ownerId = await ownerField(req);
    } else {
      ownerId = req.params[ownerField] || req.query[ownerField] || req.body[ownerField];
    }

    if (!ownerId) {
      return sendError(res, 403, 'Access denied. Owner ID is required.');
    }

    if (ownerId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Access denied. You can only access your own data.');
    }

    next();
  } catch (err) {
    return sendError(res, 500, 'Ownership check failed: ' + err.message);
  }
};

module.exports = ownershipGuard;
module.exports.strict = strictOwnershipGuard;