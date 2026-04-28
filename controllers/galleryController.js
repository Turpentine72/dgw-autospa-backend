const Gallery = require('../models/Gallery');

exports.getImages = async (req, res, next) => {
  try {
    const images = await Gallery.find().sort('-createdAt');
    const data = images.map(img => ({
      ...img.toObject(),
      image: img.image ? `${req.protocol}://${req.get('host')}/${img.image}` : null
    }));
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getAdminImages = async (req, res, next) => {
  try {
    const images = await Gallery.find().sort('-createdAt');
    const data = images.map(img => ({
      ...img.toObject(),
      image: img.image ? `${req.protocol}://${req.get('host')}/${img.image}` : null
    }));
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }
    const imagePath = req.file.path.replace(/\\/g, '/');
    const image = await Gallery.create({
      title: req.body.title,
      image: imagePath,
    });
    const data = image.toObject();
    data.image = `${req.protocol}://${req.get('host')}/${data.image}`;
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.deleteImage = async (req, res, next) => {
  try {
    const image = await Gallery.findByIdAndDelete(req.params.id);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Gallery image not found' });
    }
    res.json({ success: true, data: {} });
  } catch (err) { next(err); }
};