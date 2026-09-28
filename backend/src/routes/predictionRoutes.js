'use strict';

const router = require('express').Router();
const { predictById, predictBatch, getResultsByPatient } = require('../controllers/predictionController');
const { auth, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const Joi = require('joi');

const batchSchema = {
  body: Joi.object({
    imageIds: Joi.array().items(Joi.string()).min(1).max(10).required(),
  }),
};

// Doctor & Admin only
router.use(auth, authorize('admin', 'doctor'));

router.post('/:imageId',             predictById);
router.post('/batch',                validate(batchSchema), predictBatch);
router.get('/results/:patientId',    getResultsByPatient);

module.exports = router;