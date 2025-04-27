const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

async function createUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/billing-portal');
    console.log('Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'its@ayodhya' });
    if (existingUser) {
      console.log('User already exists');
      process.exit(0);
    }

    // Create user
    const user = new User({
      name: 'Ayodhya User',
      email: 'Its@ayodhya',
      password: 'Jayshreeram',
      role: 'user',
      company: 'Ayodhya SHG',
      phone: '1234567890',
      address: {
        street: '123 User St',
        city: 'Ayodhya',
        state: 'UP',
        zipCode: '224001',
        country: 'India'
      }
    });

    await user.save();
    console.log('User created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating user:', error);
    process.exit(1);
  }
}

createUser(); 