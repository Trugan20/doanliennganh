'use strict';

const path = require('path');
const ImageAnalysis = require('../models/ImageAnalysis');
const { predictImage } = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/response');

// POST /api/predict/:imageId  [doctor, admin]
const predictById = async (req, res) => {
  try {
    const image = await ImageAnalysis.findById(req.params.imageId)
      .populate('patient', 'name email');

    if (!image || !image.isActive) return sendError(res, 404, 'Image not found.');

    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const subdir = image.type === 'xray' ? 'xrays' : image.type === 'scan' ? 'scans' : 'images';
    const filePath = path.join(uploadDir, subdir, image.filename);

    const result = await predictImage(filePath, image.type);
    image.aiAnalysis = result;
    await image.save();

    return sendSuccess(res, 200, 'AI prediction complete', {
      imageId: image._id,
      patient: image.patient,
      type: image.type,
      analysis: result,
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// POST /api/predict/batch  [doctor, admin – analyze multiple images]
const predictBatch = async (req, res) => {
  try {
    const { imageIds } = req.body;
    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return sendError(res, 400, 'imageIds array is required.');
    }
    if (imageIds.length > 10) {
      return sendError(res, 400, 'Maximum 10 images per batch.');
    }

    const results = await Promise.allSettled(
      imageIds.map(async (id) => {
        const image = await ImageAnalysis.findById(id);
        if (!image || !image.isActive) throw new Error(`Image ${id} not found`);

        const uploadDir = process.env.UPLOAD_DIR || 'uploads';
        const subdir = image.type === 'xray' ? 'xrays' : image.type === 'scan' ? 'scans' : 'images';
        const filePath = path.join(uploadDir, subdir, image.filename);

        const result = await predictImage(filePath, image.type);
        image.aiAnalysis = result;
        await image.save();
        return { imageId: id, status: 'success', analysis: result };
      })
    );

    const processed = results.map((r, i) =>
      r.status === 'fulfilled'
        ? r.value
        : { imageId: imageIds[i], status: 'failed', error: r.reason?.message }
    );

    return sendSuccess(res, 200, 'Batch prediction complete', { processed });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// GET /api/predict/results/:patientId  [doctor, admin]
const getResultsByPatient = async (req, res) => {
  try {
    const images = await ImageAnalysis.find({
      patient: req.params.patientId,
      'aiAnalysis.processed': true,
      isActive: true,
    })
      .populate('patient', 'name email')
      .sort({ 'aiAnalysis.processedAt': -1 });

    return sendSuccess(res, 200, 'Prediction results retrieved', images);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

module.exports = { predictById, predictBatch, getResultsByPatient };