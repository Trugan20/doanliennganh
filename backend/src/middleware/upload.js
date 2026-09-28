'use strict';

const multerConfig = require('../config/multer');
const { sendError }  = require('../utils/response');

/**
 * Wraps multer's single-file upload and converts multer errors
 * to the project's standard API error format.
 *
 * Usage:
 *   router.post('/upload', uploadSingle('image'), controller);
 *   router.post('/audio',  uploadSingle('audio', audioUpload), controller);
 */
const uploadSingle = (fieldName, customUpload) => (req, res, next) => {
  const handler = (customUpload || multerConfig).single(fieldName);

  handler(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 413, 'File too large. Maximum size is 10 MB.');
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return sendError(res, 400, `Unexpected field. Expected field name: "${fieldName}".`);
    }
    if (err.message && err.message.toLowerCase().includes('invalid file type')) {
      return sendError(res, 415, err.message);
    }
    if (err.message && err.message.toLowerCase().includes('invalid audio')) {
      return sendError(res, 415, err.message);
    }
    return sendError(res, 400, err.message || 'File upload error.');
  });
};

/**
 * Wraps multer's array upload.
 */
const uploadArray = (fieldName, maxCount = 5, customUpload) => (req, res, next) => {
  const handler = (customUpload || multerConfig).array(fieldName, maxCount);

  handler(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE')  return sendError(res, 413, 'One or more files are too large.');
    if (err.code === 'LIMIT_FILE_COUNT') return sendError(res, 400, `Max ${maxCount} files allowed.`);
    return sendError(res, 400, err.message || 'File upload error.');
  });
};

/**
 * Middleware that asserts a file was actually attached to the request.
 * Call after uploadSingle / uploadArray.
 */
const requireFile = (fieldName = 'file') => (req, res, next) => {
  if (!req.file && (!req.files || req.files.length === 0)) {
    return sendError(res, 400, `No file uploaded. Please attach a file to the "${fieldName}" field.`);
  }
  next();
};

module.exports = { uploadSingle, uploadArray, requireFile };