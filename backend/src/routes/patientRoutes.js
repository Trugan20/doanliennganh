"use strict";

const router = require("express").Router();
const {
  getAll,
  getMyProfile,
  getById,
  updateMyProfile,
  update,
  remove,
} = require("../controllers/patientController");
const { auth, authorize } = require("../middleware/auth");

// Patient views/updates own profile
router.get("/me", auth, authorize("patient"), getMyProfile);
router.put("/me", auth, authorize("patient"), updateMyProfile);

// Admin & doctor can list/view patients
router.get("/", auth, authorize("admin", "doctor"), getAll);
router.get("/:id", auth, authorize("admin", "doctor", "patient"), getById);

// Patient can update own record, admin can update any
router.put("/:id", auth, authorize("admin", "patient"), update);
router.delete("/:id", auth, authorize("admin", "doctor"), remove);

module.exports = router;
