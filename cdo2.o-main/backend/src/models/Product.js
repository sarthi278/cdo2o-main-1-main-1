const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Add indexes for faster searches
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });

// Drop any existing indexes before creating new ones
productSchema.pre('save', async function(next) {
  try {
    await this.constructor.collection.dropIndexes();
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Product', productSchema); 