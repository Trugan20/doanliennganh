'use strict';

const router = require('express').Router();
const { register, login, getMe, updateMe, changePassword } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const Joi = require('joi');

const registerSchema = {
  body: Joi.object({
    name:           Joi.string().min(2).max(100).required(),
    email:          Joi.string().email().required(),
    password:       Joi.string().min(6).required(),
    role:           Joi.string().valid('admin', 'doctor', 'patient').default('patient'),
    phone:          Joi.string().allow('', null),
    specialization: Joi.string().allow('', null),
    dob:            Joi.string().allow('', null),
  }),
};

const loginSchema = {
  body: Joi.object({
    email:    Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const changePasswordSchema = {
  body: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword:     Joi.string().min(6).required(),
  }),
};

// Public
router.post('/register', validate(registerSchema), register);
router.post('/login',    validate(loginSchema),    login);

// Protected
router.get('/me',              auth, getMe);
router.put('/me',              auth, updateMe);
router.put('/change-password', auth, validate(changePasswordSchema), changePassword);

module.exports = router;