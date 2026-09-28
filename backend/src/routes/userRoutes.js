"use strict";

const router = require("express").Router();
const {
  getAll,
  getById,
  create,
  update,
  changePassword,
  remove,
  toggleActive,
} = require("../controllers/userController");
const { auth, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");
const Joi = require("joi");

// All user management routes are admin-only
router.use(auth, authorize("admin"));

const createUserSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).default("Password@123"),
    role: Joi.string().valid("admin", "doctor", "patient").default("patient"),
    phone: Joi.string()
      .pattern(/^[0-9+\-\s()]{7,20}$/)
      .allow("", null)
      .optional(),
    specialization: Joi.string().allow("", null).optional(),
    dob: Joi.string().allow("", null).optional(),
    avatar: Joi.string().allow("", null).optional(),
  }).unknown(true),
};

const updateUserSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(100),
    phone: Joi.string()
      .pattern(/^[0-9+\-\s()]{7,20}$/)
      .allow("", null)
      .optional(),
    specialization: Joi.string().allow("", null).optional(),
    dob: Joi.string().allow("", null).optional(),
    avatar: Joi.string().allow("", null).optional(),
  })
    .min(1)
    .unknown(true),
};

const changePasswordSchema = {
  body: Joi.object({
    newPassword: Joi.string().min(6).required(),
  }),
};

router.get("/", getAll);
router.get("/:id", getById);
router.post("/", validate(createUserSchema), create);
router.put("/:id/password", validate(changePasswordSchema), changePassword);
router.put("/:id", validate(updateUserSchema), update);
router.delete("/:id", remove);
router.put("/:id/toggle-active", toggleActive);

module.exports = router;
