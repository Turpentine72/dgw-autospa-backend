require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const updateAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find the existing admin (by old email or any admin)
    const admin = await User.findOne({ role: 'Super Admin' });
    
    if (admin) {
      admin.email = 'damzyitz6@gmail.com';
      admin.password = 'damzy72@';   // will be hashed automatically by pre-save hook
      await admin.save();
      console.log('✅ Admin updated successfully');
      console.log('Email: damzyitz6@gmail.com');
      console.log('Password: damzy72@');
    } else {
      // If no admin exists, create one
      await User.create({
        name: 'Super Admin',
        email: 'damzyitz6@gmail.com',
        password: 'damzy72@',
        role: 'Super Admin',
        isActive: true
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