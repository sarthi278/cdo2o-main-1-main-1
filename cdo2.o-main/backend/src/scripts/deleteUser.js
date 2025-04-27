const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

async function deleteUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/billing-portal');
    console.log('Connected to MongoDB');

    // Delete user
    await User.deleteOne({ email: 'its@ayodhya' });
    console.log('User deleted successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error deleting user:', error);
    process.exit(1);
  }
}

deleteUser(); 