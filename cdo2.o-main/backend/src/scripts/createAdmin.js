const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path'); // Import path
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Correct path for .env

const createAdminUser = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Error: MONGODB_URI is not defined. Ensure .env file is in cdo2.o-main/backend/ and contains the variable.');
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'cdoayodhya@gmail.com' }); // Ensure case matches
    if (existingAdmin) {
      console.log('Admin user cdoayodhya@gmail.com already exists.');
      process.exit(0);
    }

    // Create new admin user
    const adminUser = new User({
      name: 'CDO Office',
      email: 'cdoayodhya@gmail.com', // Ensure case matches
      password: 'CDOOFFICE',
      role: 'admin',
      company: 'Ayodhya SHG Management',
      phone: 'N/A',
      address: {
        street: 'N/A',
        city: 'Ayodhya',
        state: 'Uttar Pradesh',
        zipCode: 'N/A',
        country: 'India'
      }
    });

    await adminUser.save();
    console.log('Admin user cdoayodhya@gmail.com created successfully.');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    // Disconnect Mongoose
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createAdminUser();