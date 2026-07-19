const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/statsController');

// Public stats (no auth required)
router.get('/', getStats);

module.exports = router;