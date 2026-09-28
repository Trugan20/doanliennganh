'use strict';

const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const DentalScore = require('../models/DentalScore');
const { generateToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role = 'patient', phone, specialization } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return sendError(res, 409, 'Email already registered.');

    const user = await User.create({ name, email, password, role, phone, specialization });

    // Create role-specific profile
    if (role === 'patient') {
      const patient = await Patient.create({ user: user._id, name, email, phone });
      // Initialize dental score
      await DentalScore.create({
        patient: user._id,
        patientName: name,
        overall: 70,
        gumHealth: 70,
        toothDecay: 70,
        alignment: 70,
        cleanliness: 70,
        history: [{ date: new Date().toISOString().split('T')[0], score: 70 }],
      });
    } else if (role === 'doctor') {
      await Doctor.create({ user: user._id, name, email, phone, specialization });
    }

    const token = generateToken(user);
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    return sendSuccess(res, 201, 'Registration successful', {
      token,
      role: user.role,
      user: user.toSafeObject(),
    });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 409, 'Email already registered.');
    return sendError(res, 500, err.message);
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) return sendError(res, 401, 'Invalid email or password.');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return sendError(res, 401, 'Invalid email or password.');

    if (!user.isActive) return sendError(res, 403, 'Account deactivated. Contact support.');

    const token = generateToken(user);
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    return sendSuccess(res, 200, 'Login successful', {
      token,
      role: user.role,
      user: user.toSafeObject(),
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return sendError(res, 404, 'User not found.');
    return sendSuccess(res, 200, 'User retrieved', user.toSafeObject());
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// PUT /api/auth/me
const updateMe = async (req, res) => {
  try {
    const forbidden = ['password', 'role', 'email'];
    forbidden.forEach(f => delete req.body[f]);

    const user = await User.findByIdAndUpdate(req.user._id, req.body, {
      new: true, runValidators: true,
    });
    return sendSuccess(res, 200, 'Profile updated', user.toSafeObject());
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return sendError(res, 400, 'Current password is incorrect.');

    user.password = newPassword;
    await user.save();

    const token = generateToken(user);
    return sendSuccess(res, 200, 'Password changed successfully', { token });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

module.exports = { register, login, getMe, updateMe, changePassword };