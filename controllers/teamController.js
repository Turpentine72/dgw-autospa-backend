const Team = require('../models/Team');

exports.getTeam = async (req, res, next) => {
  try {
    const members = await Team.find().sort('order');
    const data = members.map(m => ({
      ...m.toObject(),
      image: m.image ? `${req.protocol}://${req.get('host')}/${m.image}` : null
    }));
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getAdminTeam = async (req, res, next) => {
  try {
    const members = await Team.find().sort('order');
    const data = members.map(m => ({
      ...m.toObject(),
      image: m.image ? `${req.protocol}://${req.get('host')}/${m.image}` : null
    }));
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.createMember = async (req, res, next) => {
  try {
    const memberData = {
      name: req.body.name,
      role: req.body.role,
      description: req.body.description,
      email: req.body.email,
      phone: req.body.phone,
      order: req.body.order,
    };
    if (req.file) memberData.image = req.file.path.replace(/\\/g, '/');
    const member = await Team.create(memberData);
    const data = member.toObject();
    data.image = data.image ? `${req.protocol}://${req.get('host')}/${data.image}` : null;
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.updateMember = async (req, res, next) => {
  try {
    const update = {
      name: req.body.name,
      role: req.body.role,
      description: req.body.description,
      email: req.body.email,
      phone: req.body.phone,
      order: req.body.order,
    };
    if (req.file) update.image = req.file.path.replace(/\\/g, '/');
    const member = await Team.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }
    const data = member.toObject();
    data.image = data.image ? `${req.protocol}://${req.get('host')}/${data.image}` : null;
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.deleteMember = async (req, res, next) => {
  try {
    const member = await Team.findByIdAndDelete(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }
    res.json({ success: true, data: {} });
  } catch (err) { next(err); }
};