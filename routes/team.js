const express = require('express');
const router = express.Router();
const {
  getTeam,
  getAdminTeam,
  getTeamMember,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember
} = require('../controllers/teamController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', getTeam);

// Admin routes (protected)
router.get('/admin/all', protect, authorize('Super Admin', 'Manager'), getAdminTeam);
router.get('/:id', protect, authorize('Super Admin', 'Manager'), getTeamMember);
router.post('/', protect, authorize('Super Admin', 'Manager'), upload.single('image'), createTeamMember);
router.put('/:id', protect, authorize('Super Admin', 'Manager'), upload.single('image'), updateTeamMember);
router.delete('/:id', protect, authorize('Super Admin'), deleteTeamMember);

module.exports = router;