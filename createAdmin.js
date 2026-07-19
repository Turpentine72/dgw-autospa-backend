require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

const NAME = 'Admin Name';              // ← put the admin's name here
const EMAIL = 'admin@example.com';      // ← put the email you want
const PASSWORD = 'YourPassword123';     // ← put the password you want

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existing = await Admin.findOne({ email: EMAIL });
    if (existing) {
      console.log('Admin already exists. Updating password...');
      existing.password = PASSWORD;
      await existing.save();
      console.log('Password updated.');
    } else {
      // Create new admin – include 'name'
      await Admin.create({ name: NAME, email: EMAIL, password: PASSWORD });
      console.log('New admin created.');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();    