const mongoose = require('mongoose');
const path = require('path');
const User = require('../models/User');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Load .env from parent dir

const TARGET_EMAIL = 'ayodhyashg04@gmail.com';
const TARGET_PASSWORD = 'ayodhyashg';
const TARGET_ROLE = 'user';
const TARGET_NAME = 'User'; // Keep the original name or update if needed

async function addOrUpdateUser() {
  if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined. Check your .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let user = await User.findOne({ email: TARGET_EMAIL });

    if (user) {
      // User exists, update password and ensure role
      console.log(`User ${TARGET_EMAIL} found. Updating password and role...`);
      user.password = TARGET_PASSWORD; // Password will be hashed by pre-save hook
      user.role = TARGET_ROLE;
      // You could update the name here too if needed: user.name = TARGET_NAME;
      await user.save();
      console.log(`User ${TARGET_EMAIL} updated successfully.`);
    } else {
      // User does not exist, create new user
      console.log(`User ${TARGET_EMAIL} not found. Creating new user...`);
      const newUser = new User({
        name: TARGET_NAME,
        email: TARGET_EMAIL,
        password: TARGET_PASSWORD, // Password will be hashed by pre-save hook
        role: TARGET_ROLE
      });
      await newUser.save();
      console.log(`User ${TARGET_EMAIL} created successfully.`);
    }

  } catch (error) {
    console.error('Error during user update/creation:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

addOrUpdateUser();
