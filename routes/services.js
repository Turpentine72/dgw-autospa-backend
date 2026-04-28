const express = require('express');
const router = express.Router();
const {
  getServices,
  getAdminServices,
  createService,
  updateService,
  deleteService
} = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');   // multer config

router.get('/', getServices);
router.get('/admin/all', protect, authorize('Super Admin', 'Manager'), getAdminServices);
router.post('/', protect, authorize('Super Admin', 'Manager'), upload.single('image'), createService);
router.put('/:id', protect, authorize('Super Admin', 'Manager'), upload.single('image'), updateService);
router.delete('/:id', protect, authorize('Super Admin', 'Manager'), deleteService);

module.exports = router;