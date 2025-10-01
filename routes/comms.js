const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// All comms routes require comms role
router.use(protect, authorize('comms'));

// Comms dashboard
router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Communications Dashboard',
    data: {
      user: {
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        orgName: req.user.orgName,
        position: req.user.position
      },
      features: [
        'Manage PR campaigns',
        'Media relations',
        'Press releases',
        'Analytics dashboard'
      ],
      stats: {
        campaigns: 12,
        releases: 45,
        mediaContacts: 89
      }
    }
  });
});

// Get comms profile
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
});

module.exports = router;