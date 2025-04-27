const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function resetUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/billing-portal');
    console.log('Connected to MongoDB');

    // Delete all existing users
    await User.deleteMany({});
    console.log('Deleted all existing users');

    // Create new admin user
    const newUser = new User({
      name: 'Ayodhya SHG',
      email: 'ayodhyashg04@gmail.com',
      password: 'ayodhyashg',
      role: 'admin'
    });

    await newUser.save();
    console.log('\nCreated new user:');
    console.log('------------------');
    console.log(`Name: ${newUser.name}`);
    console.log(`Email: ${newUser.email}`);
    console.log(`Role: ${newUser.role}`);
    console.log('------------------');

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

resetUsers(); 