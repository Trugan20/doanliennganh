'use strict';

const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Patient = require('../models/Patient');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { getPagination, buildSort } = require('../utils/pagination');

const ALLOWED_SORT = ['name', 'specialization', 'rating', 'createdAt'];

// GET /api/doctors  [all authenticated]
const getAll = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const sort = buildSort(req.query, ALLOWED_SORT);
    const filter = { isActive: true };

    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { specialization: { $regex: req.query.search, $options: 'i' } },
      ];
    }
    if (req.query.specialization) {
      filter.specialization = { $regex: req.query.specialization, $options: 'i' };
    }

    const [doctors, total] = await Promise.all([
      Doctor.find(filter)
        .populate('user', 'name email isActive lastLogin')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Doctor.countDocuments(filter),
    ]);

    return sendPaginated(res, doctors, total, page, limit);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// GET /api/doctors/me  [doctor]
const getMyProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id })
      .populate('user', 'name email role lastLogin');
    if (!doctor) return sendError(res, 404, 'Doctor profile not found.');
    return sendSuccess(res, 200, 'Doctor profile retrieved', doctor);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// GET /api/doctors/:id  [all authenticated]
const getById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('user', 'name email role');
    if (!doctor) return sendError(res, 404, 'Doctor not found.');
    return sendSuccess(res, 200, 'Doctor retrieved', doctor);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// POST /api/doctors  [admin]
const create = async (req, res) => {
  try {
    const { name, email, phone, specialization, password, licenseNumber, experience, bio } = req.body;

    // Create user account for doctor
    const existingUser = await User.findOne({ email });
    if (existingUser) return sendError(res, 409, 'Email already registered.');

    const user = await User.create({
      name, email, phone, role: 'doctor',
      password: password || 'Doctor@123',
      specialization,
    });

    const doctor = await Doctor.create({
      user: user._id, name, email, phone,
      specialization, licenseNumber, experience, bio,
    });

    return sendSuccess(res, 201, 'Doctor created', { doctor, user: user.toSafeObject() });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 409, 'Email already exists.');
    return sendError(res, 500, err.message);
  }
};

// PUT /api/doctors/:id  [admin]
const update = async (req, res) => {
  try {
    delete req.body.user;
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate('user', 'name email role');

    if (!doctor) return sendError(res, 404, 'Doctor not found.');
    return sendSuccess(res, 200, 'Doctor updated', doctor);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// PUT /api/doctors/me  [doctor – update own profile]
const updateMyProfile = async (req, res) => {
  try {
    const forbidden = ['user', 'isActive', 'rating', 'totalPatients'];
    forbidden.forEach(f => delete req.body[f]);

    const doctor = await Doctor.findOneAndUpdate(
      { user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'name email role');

    if (!doctor) return sendError(res, 404, 'Doctor profile not found.');
    return sendSuccess(res, 200, 'Profile updated', doctor);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// DELETE /api/doctors/:id  [admin]
const remove = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!doctor) return sendError(res, 404, 'Doctor not found.');
    // Deactivate user account too
    await User.findByIdAndUpdate(doctor.user, { isActive: false });
    return sendSuccess(res, 200, 'Doctor deactivated');
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// GET /api/doctors/patients  [doctor – list own patients]
const getMyPatients = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const [patients, total] = await Promise.all([
      Patient.find({ assignedDoctor: req.user._id })
        .populate('user', 'name email lastLogin')
        .skip(skip).limit(limit),
      Patient.countDocuments({ assignedDoctor: req.user._id }),
    ]);
    return sendPaginated(res, patients, total, page, limit);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

module.exports = { getAll, getMyProfile, getById, create, update, updateMyProfile, remove, getMyPatients };