const Gallery = require('../models/Gallery');
const cloudinary = require('../config/cloudinary');

// Public gallery (no auth)
exports.getImages = async (req, res, next) => {
  try {
    const images = await Gallery.find().sort('-createdAt');
    res.json({ success: true, data: images });
  } catch (err) { next(err); }
};

// Admin gallery (with auth)
exports.getAdminImages = async (req, res, next) => {
  try {
    const images = await Gallery.find().sort('-createdAt');
    res.json({ success: true, data: images });
  } catch (err) { next(err); }
};

// Upload image to Cloudinary
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    // Upload buffer to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'dgw-gallery',
          transformation: [{ width: 1200, height: 800, crop: 'limit' }]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const image = await Gallery.create({
      title: req.body.title || 'Gallery Image',
      image: uploadResult.secure_url,
    });

    res.status(201).json({ success: true, data: image });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete image
exports.deleteImage = async (req, res, next) => {
  try {
    const image = await Gallery.findByIdAndDelete(req.params.id);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Gallery image not found' });
    }
    // Optional: delete from Cloudinary (extract public_id from URL)
    res.json({ success: true, data: {} });
  } catch (err) { next(err); }
};