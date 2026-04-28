const express = require('express');
const router = express.Router();
const { getImages, getAdminImages, uploadImage, deleteImage } = require('../controllers/galleryController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getImages);
router.get('/admin/all', protect, authorize('Super Admin', 'Manager'), getAdminImages);
router.post('/', protect, authorize('Super Admin', 'Manager'), upload.single('image'), uploadImage);
router.delete('/:id', protect, authorize('Super Admin', 'Manager'), deleteImage);

module.exports = router;