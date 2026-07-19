require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  try {
    console.log(`Connecting to: ${process.env.MONGODB_URI}`);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connection successful');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections found:', collections.map(c => c.name));
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  } finally {
    await mongoose.disconnect();
  }
})();
