'use strict';

const Service = require('../models/Service');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { getPagination, buildSort } = require('../utils/pagination');

const ALLOWED_SORT = ['name', 'price', 'duration', 'category', 'sortOrder', 'createdAt'];

// GET /api/services  [all, public]
const getAll = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const sort = buildSort(req.query, ALLOWED_SORT);
    const filter = {};

    // Non-admins only see active services
    if (!req.user || req.user.role !== 'admin') filter.active = true;

    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [services, total] = await Promise.all([
      Service.find(filter).sort(sort).skip(skip).limit(limit),
      Service.countDocuments(filter),
    ]);

    return sendPaginated(res, services, total, page, limit);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// GET /api/services/:id  [all]
const getById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return sendError(res, 404, 'Service not found.');
    return sendSuccess(res, 200, 'Service retrieved', service);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// POST /api/services  [admin]
const create = async (req, res) => {
  try {
    const service = await Service.create(req.body);
    return sendSuccess(res, 201, 'Service created', service);
  } catch (err) {
    if (err.code === 11000) return sendError(res, 409, 'Service name already exists.');
    return sendError(res, 500, err.message);
  }
};

// PUT /api/services/:id  [admin]
const update = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!service) return sendError(res, 404, 'Service not found.');
    return sendSuccess(res, 200, 'Service updated', service);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// DELETE /api/services/:id  [admin]
const remove = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );
    if (!service) return sendError(res, 404, 'Service not found.');
    return sendSuccess(res, 200, 'Service deactivated');
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// DELETE /api/services/:id/permanent  [admin – hard delete]
const removePermanent = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return sendError(res, 404, 'Service not found.');
    return sendSuccess(res, 200, 'Service permanently deleted');
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// GET /api/services/categories  [all]
const getCategories = async (req, res) => {
  try {
    const categories = await Service.distinct('category', { active: true });
    return sendSuccess(res, 200, 'Categories retrieved', categories);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

module.exports = { getAll, getById, create, update, remove, removePermanent, getCategories };