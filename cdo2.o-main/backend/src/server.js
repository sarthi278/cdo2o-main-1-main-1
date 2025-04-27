const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // Import path module
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Correct path to look in parent directory

const app = express();

// Specific origin for the frontend
const FRONTEND_ORIGIN = 'https://8080-idx-cdo2o-main-1-main-1-1744961790817.cluster-zkm2jrwbnbd4awuedc2alqxrpk.cloudworkstations.dev';

// CORS configuration
const corsOptions = {
  origin: FRONTEND_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Added OPTIONS
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Allow credentials
};

// Handle preflight requests explicitly for all routes
app.options('*', cors(corsOptions));

// Use CORS middleware for actual requests
app.use(cors(corsOptions));

app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const billingRoutes = require('./routes/billing');
const productRoutes = require('./routes/products');

app.use('/api/auth', authRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/products', productRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

// Check if MONGODB_URI is loaded
if (!process.env.MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined. Make sure it is set in the .env file located at', path.resolve(__dirname, '../.env'));
  process.exit(1); // Exit if MongoDB URI is not found
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });
