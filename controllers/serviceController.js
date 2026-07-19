const cloudinary = require('cloudinary').v2;
const Service = require('../models/Service');

const uploadToCloudinary = (buffer, originalName) => {
  console.log('🔍 Inside uploadToCloudinary');
  console.log('CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('API_KEY exists?', !!process.env.CLOUDINARY_API_KEY);
  console.log('API_SECRET exists?', !!process.env.CLOUDINARY_API_SECRET);

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'services',
        allowed_formats: ['jpg', 'png', 'webp', 'jpeg'],
        public_id: `${Date.now()}_${originalName.split('.')[0]}`,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error.message);
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );
    uploadStream.end(buffer);
  });
};

// Public – return all services
exports.getServices = async (req, res, next) => {
  try {
    const services = await Service.find().sort('name');
    res.json({ success: true, data: services });
  } catch (err) { next(err); }
};

// Admin – return all services (same as above, used for admin panel)
exports.getAdminServices = async (req, res, next) => {
  try {
    const services = await Service.find().sort('name');
    res.json({ success: true, data: services });
  } catch (err) { next(err); }
};

// Create service – now accepts isFeatured
exports.createService = async (req, res, next) => {
  try {
    const { name, description, category } = req.body;
    const isFeatured = req.body.isFeatured === 'true' || req.body.isFeatured === true;
    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    }
    const service = await Service.create({ name, description, category, image: imageUrl, isFeatured });
    res.status(201).json({ success: true, data: service });
  } catch (err) { next(err); }
};

// Update service – now accepts isFeatured
exports.updateService = async (req, res, next) => {
  try {
    const { name, description, category } = req.body;
    const isFeatured = req.body.isFeatured === 'true' || req.body.isFeatured === true;
    const update = { name, description, category, isFeatured };
    if (req.file) {
      update.image = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    }
    const service = await Service.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, data: service });
  } catch (err) { next(err); }
};

// Delete service
exports.deleteService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, data: {} });
  } catch (err) { next(err); }
};

// ✅ New: get single service by ID (public)
exports.getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, data: service });
  } catch (err) { next(err); }
};