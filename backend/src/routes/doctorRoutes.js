'use strict';

const router = require('express').Router();
const {
  getAll, getMyProfile, getById, create, update, updateMyProfile, remove, getMyPatients,
} = require('../controllers/doctorController');
const { auth, authorize } = require('../middleware/auth');

// Doctor's own profile
router.get('/me',       auth, authorize('doctor'), getMyProfile);
router.put('/me',       auth, authorize('doctor'), updateMyProfile);
router.get('/patients', auth, authorize('doctor'), getMyPatients);

// All authenticated can list/view doctors
router.get('/',    auth, getAll);
router.get('/:id', auth, getById);

// Admin-only management
router.post('/',      auth, authorize('admin'), create);
router.put('/:id',    auth, authorize('admin'), update);
router.delete('/:id', auth, authorize('admin'), remove);

module.exports = router;