require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

const updateAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find the existing admin (by old email or any admin)
    const admin = await Admin.findOne({ role: 'Super Admin' });
    const hashedPassword = await bcrypt.hash('damzy72@', 10);
    
    if (admin) {
      admin.email = 'damzyitz6@gmail.com';
      admin.password = hashedPassword;
      await admin.save();
      console.log('✅ Admin updated successfully');
      console.log('Email: damzyitz6@gmail.com');
      console.log('Password: damzy72@');
    } else {
      // If no admin exists, create one
      await Admin.create({
        name: 'Super Admin',
        email: 'damzyitz6@gmail.com',
        password: hashedPassword,
        role: 'Super Admin'
      });
      console.log('✅ Admin created successfully');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

updateAdmin();