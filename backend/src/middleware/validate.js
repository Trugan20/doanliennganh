const { sendError } = require("../utils/response");

/**
 * Joi validation middleware factory
 * @param {Object} schema - Joi schema with optional body/query/params
 */
const validate = (schema) => (req, res, next) => {
  const errors = [];

  if (schema.body) {
    const { error, value } = schema.body.validate(req.body, {
      abortEarly: false,
      convert: true,
      stripUnknown: false,
    });
    if (error) {
      console.error("[Validation Error] Body validation failed");
      console.error(
        "Details:",
        error.details.map((d) => ({ message: d.message, key: d.context.key })),
      );
      console.error("Received body:", req.body);
      errors.push(...error.details.map((d) => d.message));
    } else {
      // Use the validated value (with defaults applied)
      req.body = value;
    }
  }
  if (schema.query) {
    const { error } = schema.query.validate(req.query, {
      abortEarly: false,
      convert: true,
    });
    if (error) errors.push(...error.details.map((d) => d.message));
  }
  if (schema.params) {
    const { error } = schema.params.validate(req.params, {
      abortEarly: false,
      convert: true,
    });
    if (error) errors.push(...error.details.map((d) => d.message));
  }

  if (errors.length > 0) {
    return sendError(res, 422, "Validation failed", { errors });
  }

  next();
};

module.exports = validate;
