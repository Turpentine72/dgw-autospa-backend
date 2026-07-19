const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getContacts,
  addReply,
  deleteContact
} = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/auth');

// Public
router.post('/contact', sendMessage);

// Admin
router.get('/', protect, authorize('Super Admin', 'Manager'), getContacts);
router.put('/:id/reply', protect, authorize('Super Admin', 'Manager'), addReply);
router.delete('/:id', protect, authorize('Super Admin', 'Manager'), deleteContact);

module.exports = router;