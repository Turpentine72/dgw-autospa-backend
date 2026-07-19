require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 60000  // 60 seconds timeout for the API call itself
});

console.log('Testing Cloudinary connectivity...');

// Upload a tiny 1x1 pixel image directly from a base64 string
cloudinary.uploader.upload(
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  { public_id: 'test_upload', timeout: 60000 },
  (err, result) => {
    if (err) {
      console.error('Upload failed:', err.message);
    } else {
      console.log('Success! URL:', result.secure_url);
    }
    process.exit();
  }
);