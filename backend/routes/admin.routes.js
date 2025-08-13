const express = require('express');
const multer = require('multer');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin.model');
const Ad = require('../models/ad.model');
const upload = multer({ dest: 'uploads/' });

// Secret key for JWT (store this securely in production, e.g., in environment variables)
const JWT_SECRET = process.env.JWT_SECRET;

// Admin login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    // Sign and return JWT
    const token = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware to protect routes
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(400).json({ msg: 'Token is not valid' });
  }
};

// Create a new ad (protected route)
router.post('/ads', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, description, businessName, city } = req.body;
    if (!title || !businessName) {
      return res.status(400).json({ error: "Title and Business Name are required." });
    }
    
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    const newAd = new Ad({ title, description, imageUrl, businessName, createdBy: req.admin.id, city: city.toUpperCase() });
    const savedAd = await newAd.save();
    res.json(savedAd);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all ads created by the logged-in admin (protected route)
router.get('/ads', async (req, res) => {
  try {
    let { city } = req.query; // Extract city from request query

    const filter = city ? { city: city.toUpperCase() } : {}; // Convert to uppercase and apply filter

    const ads = await Ad.find(filter); // Fetch ads based on city
    res.json(ads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Update an ad by its ID (protected route)
router.put('/ads/:id', auth, async (req, res) => {
  try {
    const updatedAd = await Ad.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.admin.id },
      req.body,
      { new: true }
    );
    if (!updatedAd) {
      return res.status(404).json({ msg: 'Ad not found or not authorized' });
    }
    res.json(updatedAd);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an ad by its ID (protected route)
router.delete('/ads/:id', auth, async (req, res) => {
  try {
    const deletedAd = await Ad.findOneAndDelete({ _id: req.params.id, createdBy: req.admin.id });
    if (!deletedAd) {
      return res.status(404).json({ msg: 'Ad not found or not authorized' });
    }
    res.json({ msg: 'Ad deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
