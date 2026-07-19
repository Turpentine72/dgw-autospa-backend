require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

const NEW_PASSWORD = 'YourNewPasswordHere';   // ← change
const USER_EMAIL = 'admin@example.com';       // ← change

async function changePassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    const user = await Admin.findOne({ email: USER_EMAIL });
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }
    user.password = NEW_PASSWORD;
    await user.save();
    console.log(`Password updated for ${user.email}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

changePassword();