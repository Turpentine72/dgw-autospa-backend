const Team = require('../models/Team');
const cloudinary = require('../config/cloudinary');

// Public – get all team members (for frontend display)
exports.getTeam = async (req, res, next) => {
  try {
    const team = await Team.find().sort('order');
    res.json({ success: true, data: team });
  } catch (err) { next(err); }
};

// Admin – get all team members (same as public, but with auth)
exports.getAdminTeam = async (req, res, next) => {
  try {
    const team = await Team.find().sort('order');
    res.json({ success: true, data: team });
  } catch (err) { next(err); }
};

// Admin – get single team member
exports.getTeamMember = async (req, res, next) => {
  try {
    const member = await Team.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Team member not found' });
    res.json({ success: true, data: member });
  } catch (err) { next(err); }
};

// Admin – create team member with Cloudinary upload
exports.createTeamMember = async (req, res, next) => {
  try {
    let imageUrl = null;
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'dgw-team' },
          (error, result) => error ? reject(error) : resolve(result)
        );
        uploadStream.end(req.file.buffer);
      });
      imageUrl = uploadResult.secure_url;
    }

    const member = await Team.create({
      name: req.body.name,
      role: req.body.role,
      description: req.body.description,
      email: req.body.email,
      phone: req.body.phone,
      image: imageUrl,
      order: req.body.order || 0,
    });
    res.status(201).json({ success: true, data: member });
  } catch (err) { next(err); }
};

// Admin – update team member
exports.updateTeamMember = async (req, res, next) => {
  try {
    let imageUrl = undefined;
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'dgw-team' },
          (error, result) => error ? reject(error) : resolve(result)
        );
        uploadStream.end(req.file.buffer);
      });
      imageUrl = uploadResult.secure_url;
    }

    const updateData = {
      name: req.body.name,
      role: req.body.role,
      description: req.body.description,
      email: req.body.email,
      phone: req.body.phone,
      order: req.body.order,
    };
    if (imageUrl) updateData.image = imageUrl;

    const member = await Team.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!member) return res.status(404).json({ success: false, message: 'Team member not found' });
    res.json({ success: true, data: member });
  } catch (err) { next(err); }
};

// Admin – delete team member
exports.deleteTeamMember = async (req, res, next) => {
  try {
    const member = await Team.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Team member not found' });
    res.json({ success: true, data: {} });
  } catch (err) { next(err); }
};