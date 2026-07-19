require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

async function listUsers() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await Admin.find().select('name email role');
  console.log('Users:');
  users.forEach(u => console.log(`- ${u.name} | ${u.email} | ${u.role}`));
  process.exit();
}
listUsers();