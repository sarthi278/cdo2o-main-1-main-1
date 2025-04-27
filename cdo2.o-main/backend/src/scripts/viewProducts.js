const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

async function viewProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/billing-portal');
    console.log('Connected to MongoDB');

    const products = await Product.find();
    console.log('\nProducts in database:');
    console.log('------------------');
    products.forEach(product => {
      console.log(`Product ID: ${product.productId}`);
      console.log(`Name: ${product.name}`);
      console.log(`Price: ₹${product.price}`);
      console.log(`Stock: ${product.stock}`);
      console.log(`Category: ${product.category}`);
      console.log('------------------');
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

viewProducts(); 