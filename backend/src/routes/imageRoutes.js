"use strict";

const router = require("express").Router();
const {
  getAll,
  getMine,
  getById,
  upload,
  remove,
  analyze,
  updateNotes,
} = require("../controllers/imageController");
const { auth, authorize } = require("../middleware/auth");
const multerConfig = require("../config/multer");

// Patient: own images only
router.get("/me", auth, authorize("patient"), getMine);
router.post("/upload", auth, multerConfig.any(), upload);

// Doctor & Admin: all images
router.get("/", auth, authorize("admin", "doctor"), getAll);

// Shared: ownership enforced in controller
router.get("/:id", auth, getById);
router.delete("/:id", auth, remove);

// Doctor & Admin only: AI analysis + notes
router.post("/:id/analyze", auth, authorize("admin", "doctor"), analyze);
router.put("/:id/notes", auth, authorize("admin", "doctor"), updateNotes);

module.exports = router;
