"use strict";

const router = require("express").Router();
const {
  getAll,
  getById,
  create,
  update,
  remove,
  removePermanent,
  getCategories,
} = require("../controllers/serviceController");
const { auth, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  createServiceSchema,
  updateServiceSchema,
} = require("../utils/validator");

// GET /api/services         [all, public]
router.get("/", getAll);
// GET /api/services/categories  [all, public]
router.get("/categories", getCategories);
// GET /api/services/:id      [all, public]
router.get("/:id", getById);

// POST /api/services         [admin]
router.post(
  "/",
  auth,
  authorize("admin"),
  validate(createServiceSchema),
  create,
);
// PUT /api/services/:id      [admin]
router.put(
  "/:id",
  auth,
  authorize("admin"),
  validate(updateServiceSchema),
  update,
);
// DELETE /api/services/:id   [admin – soft delete]
router.delete("/:id", auth, authorize("admin"), remove);
// DELETE /api/services/:id/permanent [admin – hard delete]
router.delete("/:id/permanent", auth, authorize("admin"), removePermanent);

module.exports = router;
