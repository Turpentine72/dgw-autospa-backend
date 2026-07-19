const Legal = require('../models/Legal');

// Public: get legal content by type (terms or privacy)
exports.getLegal = async (req, res, next) => {
  try {
    const doc = await Legal.findOne({ type: req.params.type });
    if (!doc) {
      return res.json({ success: true, data: { content: '' } }); // empty if not set
    }
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

// Admin: update legal content (create if not exists)
exports.updateLegal = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const doc = await Legal.findOneAndUpdate(
      { type },
      { content, lastUpdated: new Date() },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};