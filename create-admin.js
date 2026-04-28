require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  phone: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'oluwasegunobafemisamuel@gmail.com' });
    if (existingAdmin) {
      console.log('Admin already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      process.exit();
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    
    // Create admin
    const admin = new User({
      name: 'Oluwasegun Obafemi',
      email: 'oluwasegunobafemisamuel@gmail.com',
      password: hashedPassword,
      role: 'Super Admin',
      phone: '+234 702 588 7213'
    });
    
    await admin.save();
    console.log('✅ Super Admin created successfully!');
    console.log('Email: oluwasegunobafemisamuel@gmail.com');
    console.log('Password: Admin@123');
    console.log('Role: Super Admin');
    
    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createAdmin();
