"use strict";

const router = require("express").Router();
const {
  getMine,
  getAll,
  getByPatient,
  updateScore,
  editScore,
  getEditHistory,
} = require("../controllers/scoreController");
const { auth, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");
const Joi = require("joi");

const updateScoreSchema = {
  body: Joi.object({
    overall: Joi.number().min(0).max(100),
    gumHealth: Joi.number().min(0).max(100),
    toothDecay: Joi.number().min(0).max(100),
    alignment: Joi.number().min(0).max(100),
    cleanliness: Joi.number().min(0).max(100),
    recommendations: Joi.array().items(Joi.string()),
    nextCheckupDate: Joi.string().allow("", null),
    historyNote: Joi.string().allow("", null),
  }),
};

const editScoreSchema = {
  body: Joi.object({
    overall: Joi.number().min(0).max(100),
    gumHealth: Joi.number().min(0).max(100),
    toothDecay: Joi.number().min(0).max(100),
    alignment: Joi.number().min(0).max(100),
    cleanliness: Joi.number().min(0).max(100),
    recommendations: Joi.array().items(Joi.string()),
    nextCheckupDate: Joi.string().allow("", null),
    reason: Joi.string().required().min(3).max(500),
  }).min(1),
};

// Patient views own score
router.get("/me", auth, authorize("patient"), getMine);

// Doctor & Admin: list all + view by patient
router.get("/", auth, authorize("admin", "doctor"), getAll);
router.get(
  "/patient/:patientId",
  auth,
  authorize("admin", "doctor"),
  getByPatient,
);

// Doctor & Admin: update score (with implicit audit)
router.put(
  "/patient/:patientId",
  auth,
  authorize("admin", "doctor"),
  validate(updateScoreSchema),
  updateScore,
);

// Doctor & Admin: dedicated edit endpoint (with explicit reason)
router.post(
  "/patient/:patientId/edit",
  auth,
  authorize("admin", "doctor"),
  validate(editScoreSchema),
  editScore,
);

// Doctor & Admin: get edit history
router.get(
  "/patient/:patientId/edit-history",
  auth,
  authorize("admin", "doctor"),
  getEditHistory,
);

module.exports = router;
