const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  date: {
    type: Date,
    default: Date.now
  },
  time: {
    type: String,
    required: true,
    default: () => new Date().toLocaleTimeString()
  },
  dueDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'paid'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  paymentDate: {
    type: Date
  },
  paymentTime: {
    type: String
  }
});

module.exports = mongoose.model('Invoice', invoiceSchema); 