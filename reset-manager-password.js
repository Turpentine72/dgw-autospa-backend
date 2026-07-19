require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function resetManager() {
  await mongoose.connect(process.env.MONGODB_URI);
  const email = 'damilareadegboye87@gmail.com';
  const user = await User.findOne({ email });
  if (!user) {
    console.log('User not found');
    process.exit(1);
  }
  const newPassword = 'Manager123!';
  user.password = newPassword;
  user.role = 'Manager';
  await user.save();
  console.log(`✅ Password for ${email} reset to "${newPassword}"`);
  console.log(`Role: ${user.role}`);
  process.exit();
}
resetManager();