"use strict";

const DentalScore = require("../models/DentalScore");
const User = require("../models/User");
const Patient = require("../models/Patient");
const { sendSuccess, sendError, sendPaginated } = require("../utils/response");
const { getPagination } = require("../utils/pagination");

// Helper to resolve User ID from either User ID or Patient ID
const resolveUserId = async (patientIdOrUserId) => {
  // Try to find as User first
  let user = await User.findById(patientIdOrUserId);
  if (user) return user;

  // Try to find as Patient
  const patient = await Patient.findById(patientIdOrUserId);
  if (patient) {
    return await User.findById(patient.user);
  }
  return null;
};

// GET /api/scores/me  [patient]
const getMine = async (req, res) => {
  try {
    let score = await DentalScore.findOne({ patient: req.user._id }).populate(
      "lastAssessedBy",
      "name specialization",
    );

    if (!score) {
      // Auto-create if missing
      score = await DentalScore.create({
        patient: req.user._id,
        patientName: req.user.name,
        overall: 70,
        gumHealth: 70,
        toothDecay: 70,
        alignment: 70,
        cleanliness: 70,
        history: [{ date: new Date().toISOString().split("T")[0], score: 70 }],
      });
    }

    return sendSuccess(res, 200, "Dental score retrieved", score);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// GET /api/scores  [admin, doctor]
const getAll = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.patientId) filter.patient = req.query.patientId;

    const [scores, total] = await Promise.all([
      DentalScore.find(filter)
        .populate("patient", "name email")
        .populate("lastAssessedBy", "name specialization")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      DentalScore.countDocuments(filter),
    ]);

    return sendPaginated(res, scores, total, page, limit);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// GET /api/scores/patient/:patientId  [doctor, admin]
const getByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const user = await resolveUserId(patientId);
    if (!user) {
      return sendError(res, 404, "Patient not found.");
    }

    let score = await DentalScore.findOne({ patient: user._id })
      .populate("patient", "name email")
      .populate("lastAssessedBy", "name specialization");

    if (!score) {
      // Auto-create a default score of 70
      score = await DentalScore.create({
        patient: user._id,
        patientName: user.name,
        overall: 70,
        gumHealth: 70,
        toothDecay: 70,
        alignment: 70,
        cleanliness: 70,
        history: [{ date: new Date().toISOString().split("T")[0], score: 70 }],
      });

      // Populate relationships
      await score.populate([
        { path: "patient", select: "name email" }
      ]);
    }

    return sendSuccess(res, 200, "Dental score retrieved", score);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// PUT /api/scores/patient/:patientId  [doctor, admin – update score with audit trail]
const updateScore = async (req, res) => {
  try {
    const { patientId } = req.params;
    const {
      overall,
      gumHealth,
      toothDecay,
      alignment,
      cleanliness,
      recommendations,
      nextCheckupDate,
      historyNote,
      reason,
    } = req.body;

    const patient = await resolveUserId(patientId);
    if (!patient || patient.role !== "patient") {
      return sendError(res, 404, "Patient not found.");
    }

    let score = await DentalScore.findOne({ patient: patient._id });

    if (!score) {
      score = new DentalScore({
        patient: patient._id,
        patientName: patient.name,
      });
    }

    // Track changes for audit trail
    const changes = {};
    if (overall !== undefined && overall !== score.overall) {
      changes.overall = { oldValue: score.overall, newValue: overall };
    }
    if (gumHealth !== undefined && gumHealth !== score.gumHealth) {
      changes.gumHealth = { oldValue: score.gumHealth, newValue: gumHealth };
    }
    if (toothDecay !== undefined && toothDecay !== score.toothDecay) {
      changes.toothDecay = { oldValue: score.toothDecay, newValue: toothDecay };
    }
    if (alignment !== undefined && alignment !== score.alignment) {
      changes.alignment = { oldValue: score.alignment, newValue: alignment };
    }
    if (cleanliness !== undefined && cleanliness !== score.cleanliness) {
      changes.cleanliness = {
        oldValue: score.cleanliness,
        newValue: cleanliness,
      };
    }
    if (
      recommendations &&
      JSON.stringify(recommendations) !== JSON.stringify(score.recommendations)
    ) {
      changes.recommendations = {
        oldValue: score.recommendations,
        newValue: recommendations,
      };
    }
    if (
      nextCheckupDate !== undefined &&
      nextCheckupDate !== score.nextCheckupDate
    ) {
      changes.nextCheckupDate = {
        oldValue: score.nextCheckupDate,
        newValue: nextCheckupDate,
      };
    }

    // Update metrics
    if (overall !== undefined) score.overall = overall;
    if (gumHealth !== undefined) score.gumHealth = gumHealth;
    if (toothDecay !== undefined) score.toothDecay = toothDecay;
    if (alignment !== undefined) score.alignment = alignment;
    if (cleanliness !== undefined) score.cleanliness = cleanliness;
    if (recommendations) score.recommendations = recommendations;
    if (nextCheckupDate) score.nextCheckupDate = nextCheckupDate;

    score.lastAssessedBy = req.user._id;
    score.lastAssessedAt = new Date();

    // Add to edit history if there are changes
    if (Object.keys(changes).length > 0) {
      if (!score.editHistory) score.editHistory = [];
      score.editHistory.push({
        editedAt: new Date(),
        editedBy: req.user._id,
        doctorName: req.user.name,
        changes,
        reason: reason || historyNote || "",
      });
    }

    // Append to history
    const today = new Date().toISOString().split("T")[0];
    const alreadyToday = score.history.some((h) => h.date === today);
    if (!alreadyToday && overall !== undefined) {
      score.history.push({
        date: today,
        score: overall,
        notes: req.body.historyNote,
      });
    }

    await score.save();

    await score.populate([
      { path: "patient", select: "name email" },
      { path: "lastAssessedBy", select: "name specialization" },
      { path: "editHistory.editedBy", select: "name specialization" },
    ]);

    return sendSuccess(res, 200, "Dental score updated", score);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// POST /api/scores/patient/:patientId/edit  [doctor, admin – dedicated edit endpoint]
const editScore = async (req, res) => {
  try {
    const { patientId } = req.params;
    const {
      overall,
      gumHealth,
      toothDecay,
      alignment,
      cleanliness,
      recommendations,
      nextCheckupDate,
      reason,
    } = req.body;

    const patient = await resolveUserId(patientId);
    if (!patient || patient.role !== "patient") {
      return sendError(res, 404, "Patient not found.");
    }

    let score = await DentalScore.findOne({ patient: patient._id });

    if (!score) {
      score = new DentalScore({
        patient: patient._id,
        patientName: patient.name,
      });
    }

    // Track changes for audit trail
    const changes = {};
    if (overall !== undefined && overall !== score.overall) {
      changes.overall = { oldValue: score.overall, newValue: overall };
    }
    if (gumHealth !== undefined && gumHealth !== score.gumHealth) {
      changes.gumHealth = { oldValue: score.gumHealth, newValue: gumHealth };
    }
    if (toothDecay !== undefined && toothDecay !== score.toothDecay) {
      changes.toothDecay = { oldValue: score.toothDecay, newValue: toothDecay };
    }
    if (alignment !== undefined && alignment !== score.alignment) {
      changes.alignment = { oldValue: score.alignment, newValue: alignment };
    }
    if (cleanliness !== undefined && cleanliness !== score.cleanliness) {
      changes.cleanliness = {
        oldValue: score.cleanliness,
        newValue: cleanliness,
      };
    }
    if (
      recommendations &&
      JSON.stringify(recommendations) !== JSON.stringify(score.recommendations)
    ) {
      changes.recommendations = {
        oldValue: score.recommendations,
        newValue: recommendations,
      };
    }
    if (
      nextCheckupDate !== undefined &&
      nextCheckupDate !== score.nextCheckupDate
    ) {
      changes.nextCheckupDate = {
        oldValue: score.nextCheckupDate,
        newValue: nextCheckupDate,
      };
    }

    // Update metrics
    if (overall !== undefined) score.overall = overall;
    if (gumHealth !== undefined) score.gumHealth = gumHealth;
    if (toothDecay !== undefined) score.toothDecay = toothDecay;
    if (alignment !== undefined) score.alignment = alignment;
    if (cleanliness !== undefined) score.cleanliness = cleanliness;
    if (recommendations) score.recommendations = recommendations;
    if (nextCheckupDate) score.nextCheckupDate = nextCheckupDate;

    score.lastAssessedBy = req.user._id;
    score.lastAssessedAt = new Date();

    // Record in edit history
    if (!score.editHistory) score.editHistory = [];
    score.editHistory.push({
      editedAt: new Date(),
      editedBy: req.user._id,
      doctorName: req.user.name,
      changes,
      reason: reason || "No reason provided",
    });

    // Append to score history
    const today = new Date().toISOString().split("T")[0];
    const alreadyToday = score.history.some((h) => h.date === today);
    if (!alreadyToday && overall !== undefined) {
      score.history.push({ date: today, score: overall, notes: reason });
    }

    await score.save();

    await score.populate([
      { path: "patient", select: "name email" },
      { path: "lastAssessedBy", select: "name specialization" },
      { path: "editHistory.editedBy", select: "name specialization" },
    ]);

    return sendSuccess(
      res,
      200,
      "Dental score edited successfully with audit trail",
      score,
    );
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// GET /api/scores/patient/:patientId/edit-history  [doctor, admin – get edit history]
const getEditHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await resolveUserId(patientId);
    if (!patient) {
      return sendError(res, 404, "Patient not found.");
    }

    const score = await DentalScore.findOne({ patient: patient._id }).populate(
      "editHistory.editedBy",
      "name specialization",
    );

    if (!score) {
      return sendError(res, 404, "Dental score not found for this patient.");
    }

    const editHistory = score.editHistory || [];
    return sendSuccess(res, 200, "Edit history retrieved", {
      patient: patient._id,
      patientName: score.patientName,
      editHistory: editHistory.sort((a, b) => b.editedAt - a.editedAt),
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

module.exports = {
  getMine,
  getAll,
  getByPatient,
  updateScore,
  editScore,
  getEditHistory,
};
