const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Billing = require('../models/Billing');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// Invoice routes should come before generic routes to prevent path conflicts
// Get all invoices
router.get('/invoices', [auth, admin], async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .sort({ date: -1 })
      .populate('createdBy', 'name email')
      .populate('items.productId', 'name price');
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent invoices
router.get('/invoices/recent', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const invoices = await Invoice.find()
      .sort({ date: -1 })
      .limit(limit)
      .populate('createdBy', 'name email')
      .populate('items.productId', 'name price');
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching recent invoices:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get invoice by ID
router.get('/invoices/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid invoice ID format' });
    }
    
    const invoice = await Invoice.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('items.productId', 'name price');
      
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new invoice
router.post('/invoices', auth, async (req, res) => {
  try {
    const { amount, items, status, dueDate } = req.body;
    
    // Validate required fields
    if (!amount || !items || !items.length) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['amount', 'items']
      });
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;

    // Create invoice with all required fields
    const invoice = new Invoice({
      invoiceNumber,
      customer: req.user.userId, // Use current user as customer
      amount,
      items,
      date: new Date(),
      time: new Date().toLocaleTimeString(),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: status || 'paid',
      createdBy: req.user.userId
    });

    // Update product stock
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ 
          message: `Product not found: ${item.productId}` 
        });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for product: ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
        });
      }
      
      product.stock -= item.quantity;
      await product.save();
    }

    await invoice.save();
    
    // Populate the response
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('createdBy', 'name email')
      .populate('items.productId', 'name price');
      
    res.status(201).json(populatedInvoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update invoice status
router.patch('/invoices/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'paid', 'cancelled'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status',
        validStatuses: ['pending', 'paid', 'cancelled']
      });
    }

    const updateData = {
      status,
      ...(status === 'paid' ? {
        paymentDate: new Date(),
        paymentTime: new Date().toLocaleTimeString()
      } : {})
    };

    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('createdBy', 'name email')
     .populate('items.productId', 'name price');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Billing routes
router.get('/', auth, async (req, res) => {
  try {
    const bills = await Billing.find({ user: req.user.userId })
      .sort({ date: -1 });
    res.json(bills);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single bill
router.get('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid bill ID format' });
    }

    const bill = await Billing.findOne({
      _id: req.params.id,
      user: req.user.userId
    });
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    res.json(bill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new bill
router.post('/',
  auth,
  [
    body('items').isArray().withMessage('Items are required'),
    body('items.*.description').notEmpty().withMessage('Item description is required'),
    body('items.*.quantity').isNumeric().withMessage('Quantity must be a number'),
    body('items.*.unitPrice').isNumeric().withMessage('Unit price must be a number'),
    body('dueDate').isISO8601().withMessage('Due date is required'),
    body('tax').isNumeric().withMessage('Tax must be a number'),
    body('notes').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { items, dueDate, tax, notes } = req.body;

      // Generate invoice number (you might want to implement a more sophisticated system)
      const invoiceNumber = `INV-${Date.now()}`;

      const bill = new Billing({
        user: req.user.userId,
        invoiceNumber,
        items,
        dueDate,
        tax,
        notes
      });

      await bill.save();
      res.status(201).json(bill);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update a bill
router.put('/:id', auth, async (req, res) => {
  try {
    const bill = await Billing.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    const { items, dueDate, tax, notes, status, paymentMethod, paymentDate } = req.body;

    if (items) bill.items = items;
    if (dueDate) bill.dueDate = dueDate;
    if (tax) bill.tax = tax;
    if (notes) bill.notes = notes;
    if (status) bill.status = status;
    if (paymentMethod) bill.paymentMethod = paymentMethod;
    if (paymentDate) bill.paymentDate = paymentDate;

    await bill.save();
    res.json(bill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a bill
router.delete('/:id', auth, async (req, res) => {
  try {
    const bill = await Billing.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete invoice
router.delete('/invoices/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check if user is admin or the creator of the invoice
    if (req.user.role !== 'admin' && invoice.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this invoice' });
    }

    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 