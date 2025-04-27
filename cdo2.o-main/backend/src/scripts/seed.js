const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/billing-portal');
    console.log('Connected to MongoDB');

    // Create default admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'yadavanubhav848@gmail.com',
      password: 'anubhav040806',
      role: 'admin',
      company: 'Scanify',
      phone: '1234567890',
      address: {
        street: '123 Admin St',
        city: 'Admin City',
        state: 'AS',
        zipCode: '12345',
        country: 'Admin Country'
      }
    });

    // Create default regular user
    const regularUser = new User({
      name: 'Regular User',
      email: 'user@scanify.com',
      password: 'user123',
      role: 'user',
      company: 'Scanify',
      phone: '0987654321',
      address: {
        street: '456 User St',
        city: 'User City',
        state: 'US',
        zipCode: '54321',
        country: 'User Country'
      }
    });

    // Delete existing users to ensure clean state
    await User.deleteMany({});
    console.log('Existing users deleted');

    // Create new users
    await adminUser.save();
    console.log('Admin user created successfully');

    await regularUser.save();
    console.log('Regular user created successfully');

    console.log('Database seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase(); 
 