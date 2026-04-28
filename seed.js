require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if super admin already exists
    const existing = await Admin.findOne({ email: process.env.SUPER_ADMIN_EMAIL });
    if (existing) {
      console.log('Super Admin already exists. Updating password...');
      existing.password = await bcrypt.hash('12345678', 10);
      await existing.save();
      console.log('Password updated to: 12345678');
    } else {
      const hashedPassword = await bcrypt.hash('12345678', 10);
      await Admin.create({
        name: 'Oluwasegun Obafemi',
        email: process.env.SUPER_ADMIN_EMAIL,
        password: hashedPassword,
        phone: '+234 702 588 7213',
        role: 'Super Admin',
      });
      console.log('Super Admin created with email:', process.env.SUPER_ADMIN_EMAIL);
      console.log('Password: 12345678');
    }
    process.exit();
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedSuperAdmin();