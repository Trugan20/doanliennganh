"use strict";

const path = require("path");
const fs = require("fs");
const ImageAnalysis = require("../models/ImageAnalysis");
const User = require("../models/User");
const { sendSuccess, sendError, sendPaginated } = require("../utils/response");
const { getPagination, buildSort } = require("../utils/pagination");
const { predictImage } = require("../services/aiService");

const ALLOWED_SORT = ["createdAt", "type", "uploadedAt"];

const buildImageUrl = (req, filename, subdir) => {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.get("host");
  return `${protocol}://${host}/uploads/${subdir}/${filename}`;
};
// Helper to fix old media URLs
const normalizeMediaUrls = (messages = []) => {
  return messages.map((msg) => {
    if (msg.audioUrl) {
      // Convert full URL to relative path if needed
      const match = msg.audioUrl.match(/\/uploads\/[^\s?#]*/);
      msg.audioUrl = match ? match[0] : msg.audioUrl;

      // Ensure it includes the /uploads/ prefix
      if (!msg.audioUrl.includes("/uploads/")) {
        const filename = msg.audioUrl.split("/").pop();
        msg.audioUrl = `/uploads/audio/${filename}`;
      }
    }
    if (msg.imageUrl) {
      // Convert full URL to relative path if needed
      const match = msg.imageUrl.match(/\/uploads\/[^\s?#]*/);
      msg.imageUrl = match ? match[0] : msg.imageUrl;

      // Ensure it includes the /uploads/ prefix
      if (!msg.imageUrl.includes("/uploads/")) {
        const filename = msg.imageUrl.split("/").pop();
        msg.imageUrl = `/uploads/images/${filename}`;
      }
    }
    return msg;
  });
};
// GET /api/images  [admin, doctor]
const getAll = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const sort = buildSort(req.query, ALLOWED_SORT);
    const filter = { isActive: true };

    if (req.query.patientId) filter.patient = req.query.patientId;
    if (req.query.type) filter.type = req.query.type;

    const [images, total] = await Promise.all([
      ImageAnalysis.find(filter)
        .populate("patient", "name email")
        .populate("uploadedBy", "name role")
        .populate("doctor", "name specialization")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      ImageAnalysis.countDocuments(filter),
    ]);

    return sendPaginated(res, images, total, page, limit);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// GET /api/images/me  [patient – own images only]
const getMine = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { patient: req.user._id, isActive: true };
    if (req.query.type) filter.type = req.query.type;

    const [images, total] = await Promise.all([
      ImageAnalysis.find(filter)
        .populate("doctor", "name specialization")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ImageAnalysis.countDocuments(filter),
    ]);

    return sendPaginated(res, images, total, page, limit);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// GET /api/images/:id  [admin, doctor, or patient-owner]
const getById = async (req, res) => {
  try {
    const image = await ImageAnalysis.findById(req.params.id)
      .populate("patient", "name email")
      .populate("uploadedBy", "name role")
      .populate("doctor", "name specialization");

    if (!image || !image.isActive)
      return sendError(res, 404, "Image not found.");

    if (
      req.user.role === "patient" &&
      image.patient._id.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 403, "Access denied. This is not your image.");
    }

    return sendSuccess(res, 200, "Image retrieved", image);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// POST /api/images/upload  [patient uploads own; doctor uploads for patient]
const upload = async (req, res) => {
  try {
    // Handle both .single() and .any() multer configs
    const req_file = req.file || (req.files && req.files[0]);
    if (!req_file) return sendError(res, 400, "No file uploaded.");

    const {
      type = "photo",
      description,
      patientId,
      toothNumber,
      appointmentId,
    } = req.body;

    // Determine patient
    let patientUserId = req.user._id;
    let patientName = req.user.name;

    if (req.user.role === "doctor" || req.user.role === "admin") {
      if (!patientId)
        return sendError(
          res,
          400,
          "patientId is required when uploading for a patient.",
        );

      // Try as Patient ID first, then as User ID
      const Patient = require("../models/Patient");
      let patientRecord = await Patient.findById(patientId);
      let userId = patientId;

      if (patientRecord) {
        // patientId is a Patient ID
        userId = patientRecord.user.toString();
        patientName = patientRecord.name;
      } else {
        // patientId might be a User ID - verify it's a patient
        const user = await User.findById(patientId);
        if (!user || user.role !== "patient") {
          return sendError(res, 404, "Patient not found.");
        }
        patientName = user.name;
        userId = patientId;
      }

      patientUserId = userId;
    }

    // Determine subdirectory from stored path
    const relPath = req_file.path.replace(/\\/g, "/");
    const subdir = relPath.includes("/xrays/")
      ? "xrays"
      : relPath.includes("/scans/")
        ? "scans"
        : relPath.includes("/audio/")
          ? "audio"
          : "images";
    const imageUrl = buildImageUrl(req, req_file.filename, subdir);

    console.log(`[UPLOAD] File uploaded:
      Filename: ${req_file.filename}
      Path: ${req_file.path}
      Subdir: ${subdir}
      URL: ${imageUrl}
    `);

    const image = await ImageAnalysis.create({
      patient: patientUserId,
      patientName,
      uploadedBy: req.user._id,
      doctor: req.user.role === "doctor" ? req.user._id : undefined,
      filename: req_file.filename,
      originalName: req_file.originalname,
      url: imageUrl,
      mimetype: req_file.mimetype,
      size: req_file.size,
      type,
      description,
      toothNumber: toothNumber ? Number(toothNumber) : undefined,
      appointment: appointmentId || undefined,
    });

    await image.populate([
      { path: "patient", select: "name email" },
      { path: "uploadedBy", select: "name role" },
    ]);

    return sendSuccess(res, 201, "Image uploaded successfully", image);
  } catch (err) {
    // Clean up uploaded file on error
    const file_to_delete = req.file || (req.files && req.files[0]);
    if (file_to_delete) {
      fs.unlink(file_to_delete.path, () => {});
    }
    return sendError(res, 500, err.message);
  }
};

// DELETE /api/images/:id  [admin, doctor, or patient-owner]
const remove = async (req, res) => {
  try {
    const image = await ImageAnalysis.findById(req.params.id);
    if (!image || !image.isActive)
      return sendError(res, 404, "Image not found.");

    // Ownership check for patient
    if (
      req.user.role === "patient" &&
      image.patient.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 403, "Access denied. This is not your image.");
    }

    // Soft delete
    image.isActive = false;
    await image.save();

    return sendSuccess(res, 200, "Image deleted");
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// POST /api/images/:id/analyze  [doctor, admin]
const analyze = async (req, res) => {
  try {
    const image = await ImageAnalysis.findById(req.params.id);
    if (!image || !image.isActive)
      return sendError(res, 404, "Image not found.");

    if (image.aiAnalysis && image.aiAnalysis.processed) {
      return sendSuccess(res, 200, "Image already analyzed", image);
    }

    // Build file path
    const uploadDir = process.env.UPLOAD_DIR || "uploads";
    const subdir =
      image.type === "xray"
        ? "xrays"
        : image.type === "scan"
          ? "scans"
          : "images";
    const filePath = path.join(uploadDir, subdir, image.filename);

    const result = await predictImage(filePath, image.type);
    image.aiAnalysis = result;
    await image.save();

    return sendSuccess(res, 200, "Image analysis complete", image);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// PUT /api/images/:id/notes  [doctor, admin]
const updateNotes = async (req, res) => {
  try {
    const image = await ImageAnalysis.findById(req.params.id);
    if (!image || !image.isActive)
      return sendError(res, 404, "Image not found.");

    image.notes = req.body.notes || "";
    image.description = req.body.description || image.description;
    await image.save();

    return sendSuccess(res, 200, "Image notes updated", image);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

module.exports = {
  getAll,
  getMine,
  getById,
  upload,
  remove,
  analyze,
  updateNotes,
};
