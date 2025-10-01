const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
//const userRoutes = require('./users');
const adminRoutes = require('./admin');
const journalistRoutes = require('./journalist');
const commsRoutes = require('./comms');

// API routes
router.use('/auth', authRoutes);
//router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/journalist', journalistRoutes);
router.use('/comms', commsRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;

