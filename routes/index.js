const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const journalistRoutes = require('./journalist');
const commsRoutes = require('./comms');

// Route modules
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/journalist', journalistRoutes);
router.use('/comms', commsRoutes);

// Root API endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'PR Portal API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      journalist: '/api/journalist',
      comms: '/api/comms'
    }
  });
});

module.exports = router;