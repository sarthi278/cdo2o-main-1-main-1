const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// Get all products
router.get('/', auth, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search products
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    const products = await Product.find({
      $or: [
        { productId: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ]
    });
    res.json(products);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single product
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new product
router.post('/', auth, async (req, res) => {
  try {
    const { productId, name, price, stock, category } = req.body;

    // Validate required fields
    if (!productId || !name || !price || !stock || !category) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if product ID already exists
    const existingProduct = await Product.findOne({ productId });
    if (existingProduct) {
      return res.status(400).json({ message: 'Product ID already exists' });
    }

    const product = new Product({
      productId,
      name,
      price: Number(price),
      stock: Number(stock),
      category
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a product
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, name, price, stock, category } = req.body;

    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // If productId is being changed, check if new ID already exists
    if (productId && productId !== product.productId) {
      const existingProduct = await Product.findOne({ productId });
      if (existingProduct) {
        return res.status(400).json({ message: 'Product ID already exists' });
      }
    }

    // Update fields
    if (productId) product.productId = productId;
    if (name) product.name = name;
    if (price) product.price = Number(price);
    if (stock) product.stock = Number(stock);
    if (category) product.category = category;

    await product.save();
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a product
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 