const Service = require('../models/Service');

// Public: returns ALL services (homepage uses this)
exports.getServices = async (req, res, next) => {
  try {
    const services = await Service.find().sort('name');
    res.json({ success: true, data: services });
  } catch (err) { next(err); }
};

// Admin: same list (used in admin panel)
exports.getAdminServices = async (req, res, next) => {
  try {
    const services = await Service.find().sort('name');
    res.json({ success: true, data: services });
  } catch (err) { next(err); }
};

// Admin: create a new service
exports.createService = async (req, res, next) => {
  try {
    const { name, description, category } = req.body;
    const serviceData = { name, description, category };
    if (req.file) {
      // Store the path relative to the backend root, e.g. "uploads/1712345678.jpg"
      serviceData.image = req.file.path.replace(/\\/g, '/');
    }
    const service = await Service.create(serviceData);
    res.status(201).json({ success: true, data: service });
  } catch (err) { next(err); }
};

// Admin: update a service
exports.updateService = async (req, res, next) => {
  try {
    const { name, description, category } = req.body;
    const update = { name, description, category };
    if (req.file) {
      update.image = req.file.path.replace(/\\/g, '/');
    }
    const service = await Service.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, data: service });
  } catch (err) { next(err); }
};

// Admin: delete a service
exports.deleteService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, data: {} });
  } catch (err) { next(err); }
};