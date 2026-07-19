const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

exports.getAdmins = async (req, res, next) => {
  try {
    const admins = await Admin.find().select('-password -refreshToken');
    res.json({ success: true, data: admins });
  } catch (err) { next(err); }
};

exports.createAdmin = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;
    if (role === 'Super Admin') {
      const existingSuper = await Admin.findOne({ role: 'Super Admin' });
      if (existingSuper) {
        return res.status(400).json({ success: false, message: 'A Super Admin already exists.' });
      }
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ name, email: email.toLowerCase(), phone, password: hashedPassword, role });
    const { password: _, ...adminData } = admin.toObject();
    res.status(201).json({ success: true, data: adminData });
  } catch (err) { next(err); }
};

exports.updateAdmin = async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.email) updates.email = req.body.email.toLowerCase();
    if (req.body.phone) updates.phone = req.body.phone;
    if (req.body.role) {
      if (req.body.role === 'Super Admin') {
        const admin = await Admin.findById(req.params.id);
        if (admin.role !== 'Super Admin') {
          const existingSuper = await Admin.findOne({ role: 'Super Admin', _id: { $ne: req.params.id } });
          if (existingSuper) {
            return res.status(400).json({ success: false, message: 'A Super Admin already exists.' });
          }
        }
      }
      updates.role = req.body.role;
    }
    if (req.body.password) {
      updates.password = await bcrypt.hash(req.body.password, 10);
    }
    const admin = await Admin.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password');
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.json({ success: true, data: admin });
  } catch (err) { next(err); }
};

exports.deleteAdmin = async (req, res, next) => {
  try {
    if (req.params.id === req.admin._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.json({ success: true, data: {} });
  } catch (err) { next(err); }
};

// --- NEW: Super Admin login as another admin ---
exports.loginAs = async (req, res, next) => {
  try {
    if (req.admin.role !== 'Super Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const targetAdmin = await Admin.findById(req.params.id);
    if (!targetAdmin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (targetAdmin._id.toString() === req.admin._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot impersonate yourself' });
    }

    const token = jwt.sign({ id: targetAdmin._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

    res.json({
      success: true,
      token,
      user: {
        _id: targetAdmin._id,
        name: targetAdmin.name,
        email: targetAdmin.email,
        phone: targetAdmin.phone,
        role: targetAdmin.role
      }
    });
  } catch (err) { next(err); }
};