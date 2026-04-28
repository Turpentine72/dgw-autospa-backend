const express = require('express');
const router = express.Router();
const { getTeam, getAdminTeam, createMember, updateMember, deleteMember } = require('../controllers/teamController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getTeam);
router.get('/admin/all', protect, authorize('Super Admin'), getAdminTeam);
router.post('/', protect, authorize('Super Admin'), upload.single('image'), createMember);
router.put('/:id', protect, authorize('Super Admin'), upload.single('image'), updateMember);
router.delete('/:id', protect, authorize('Super Admin'), deleteMember);

module.exports = router;