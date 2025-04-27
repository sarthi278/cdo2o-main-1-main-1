const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  items: [{
    description: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  notes: String,
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'bank_transfer', 'check', 'cash']
  },
  paymentDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate total before saving
billingSchema.pre('save', function(next) {
  this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0);
  this.total = this.subtotal + this.tax;
  next();
});

module.exports = mongoose.model('Billing', billingSchema); 