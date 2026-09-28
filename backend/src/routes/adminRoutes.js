'use strict';

const router = require('express').Router();
const {
  getDashboard,
  getUserStats,
  getAppointmentStats,
  getRecentActivity,
  getSystemInfo,
} = require('../controllers/adminController');
const { auth, authorize } = require('../middleware/auth');

// All admin routes — auth + admin role required
router.use(auth, authorize('admin'));

router.get('/dashboard',           getDashboard);
router.get('/users/stats',         getUserStats);
router.get('/appointments/stats',  getAppointmentStats);
router.get('/activity',            getRecentActivity);
router.get('/system',              getSystemInfo);

module.exports = router;