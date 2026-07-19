// Utility script: list every admin account in the database, create a new
// one, or reset an existing one's password.
//
// Usage:
//   node check-and-reset-admin.js
//       -> lists every admin's name/email/role (no changes made)
//
//   node check-and-reset-admin.js create "Full Name" admin@example.com NewPassword123 "Super Admin"
//       -> creates a brand new admin account (role is optional, defaults to "Super Admin")
//
//   node check-and-reset-admin.js reset admin@example.com NewPassword123
//       -> resets an EXISTING admin's password to NewPassword123
//
// IMPORTANT: This connects using MONGODB_URI from backend/.env — make sure
// that's pointing at the SAME database your live site actually uses (e.g.
// your production MongoDB Atlas connection string), not your local
// database, or you'll be editing/checking the wrong data entirely.

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in backend/.env');
    process.exit(1);
  }

  console.log(`Connecting to: ${process.env.MONGODB_URI.replace(/:[^:@]+@/, ':****@')}`);
  await mongoose.connect(process.env.MONGODB_URI);

  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'create') {
    const [, name, email, password, role] = args;
    if (!name || !email || !password) {
      console.error('❌ Usage: node check-and-reset-admin.js create "Full Name" <email> <password> ["Role"]');
      process.exit(1);
    }
    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.error(`❌ An admin with email ${email} already exists. Use "reset" instead.`);
      process.exit(1);
    }
    const hashed = await bcrypt.hash(password, 10);
    const admin = await Admin.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      role: role || 'Super Admin',
    });
    console.log(`✅ Admin created: ${admin.email} (role: ${admin.role})`);
    console.log(`   Password: ${password}`);

  } else if (command === 'reset') {
    const [, emailArg, newPasswordArg] = args;
    if (!emailArg || !newPasswordArg) {
      console.error('❌ Usage: node check-and-reset-admin.js reset <email> <newPassword>');
      process.exit(1);
    }
    const admin = await Admin.findOne({ email: emailArg.toLowerCase() });
    if (!admin) {
      console.error(`❌ No admin found with email: ${emailArg}`);
      process.exit(1);
    }
    admin.password = await bcrypt.hash(newPasswordArg, 10);
    await admin.save();
    console.log(`✅ Password reset for ${admin.email} (role: ${admin.role})`);
    console.log(`   New password: ${newPasswordArg}`);

  } else {
    const admins = await Admin.find().select('name email role createdAt');
    if (admins.length === 0) {
      console.log('⚠️  No admin accounts exist in this database at all.');
      console.log('   Run: node check-and-reset-admin.js create "Your Name" you@example.com YourPassword123');
    } else {
      console.log(`Found ${admins.length} admin account(s):\n`);
      admins.forEach(a => {
        console.log(`- ${a.name} | ${a.email} | ${a.role} | created ${a.createdAt?.toISOString().slice(0,10)}`);
      });
      console.log('\nTo reset a password, run:');
      console.log('  node check-and-reset-admin.js reset <email> <newPassword>');
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
