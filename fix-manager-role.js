require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function fixRole() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const email = 'damilareadgboye87@gmail.com';
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User ${email} not found`);
      process.exit(1);
    }
    console.log(`Current role: ${user.role}`);
    if (user.role !== 'Manager') {
      user.role = 'Manager';
      await user.save();
      console.log(`✅ Role updated to Manager for ${email}`);
    } else {
      console.log(`Role is already Manager`);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fixRole();