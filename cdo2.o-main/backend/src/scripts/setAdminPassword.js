// cdo2.o-main/backend/src/scripts/setAdminPassword.js
const mongoose = require('mongoose');
const path = require('path');
const User = require('../models/User');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Ensure .env is loaded correctly

const TARGET_EMAIL = 'cdoayodhya@gmail.com';
const NEW_PASSWORD = 'CDOOFFICE';

async function setAdminPassword() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Error: MONGODB_URI is not defined in .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const adminUser = await User.findOne({ email: TARGET_EMAIL });

    if (adminUser) {
      console.log(`Found admin user: ${TARGET_EMAIL}`);
      adminUser.password = NEW_PASSWORD; // Set the new password (will be hashed by pre-save hook)
      await adminUser.save(); // Trigger the pre-save hook and save
      console.log(`Successfully updated password for ${TARGET_EMAIL}.`);
    } else {
      console.error(`Error: Admin user with email ${TARGET_EMAIL} not found.`);
      console.log(`You might need to create the admin user first using 'node src/scripts/createAdmin.js'`);
    }

  } catch (error) {
    console.error('Error updating admin password:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

setAdminPassword();
