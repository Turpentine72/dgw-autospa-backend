require('dotenv').config();
const cloudinary = require('./config/cloudinary');

console.log('Testing Cloudinary connectivity...');
console.log('Cloud name:', process.env.CLOUDINARY_CLOUD_NAME);

cloudinary.api.ping()
  .then(result => console.log('✅ Cloudinary reachable:', result))
  .catch(err => console.error('❌ Cloudinary unreachable:', err.message));
