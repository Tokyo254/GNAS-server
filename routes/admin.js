const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const { sendJournalistApprovalEmail } = require('../utils/emailService');
const path = require('path');

// All admin routes require admin role
router.use(protect, authorize('admin'));

// Serve uploaded files
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Admin dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      message: 'Welcome to Admin Dashboard',
      data: {
        user: req.user,
        stats: userStats,
        features: [
          'User management',
          'System settings',
          'Analytics',
          'Content moderation'
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

// Get pending journalists for approval
router.get('/journalists/pending', async (req, res) => {
  try {
    const pendingJournalists = await User.find({
      role: 'journalist',
      status: 'pending'
    }).select('-password');

    res.json({
      success: true,
      data: pendingJournalists
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending journalists'
    });
  }
});

// Approve journalist
router.put('/journalists/:id/approve', async (req, res) => {
  try {
    const journalist = await User.findById(req.params.id);
    
    if (!journalist || journalist.role !== 'journalist') {
      return res.status(404).json({
        success: false,
        message: 'Journalist not found'
      });
    }

    journalist.status = 'active';
    await journalist.save();

    // Send approval email
    await sendJournalistApprovalEmail(journalist);

    res.json({
      success: true,
      message: 'Journalist approved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving journalist'
    });
  }
});

// Reject journalist
router.put('/journalists/:id/reject', async (req, res) => {
  try {
    const journalist = await User.findById(req.params.id);
    
    if (!journalist || journalist.role !== 'journalist') {
      return res.status(404).json({
        success: false,
        message: 'Journalist not found'
      });
    }

    journalist.status = 'rejected';
    await journalist.save();

    res.json({
      success: true,
      message: 'Journalist rejected successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting journalist'
    });
  }
});

// Get pending endorsements
router.get('/endorsements/pending', async (req, res) => {
  try {
    const pendingEndorsements = await User.find({
      registrationMethod: 'endorsement',
      status: 'pending'
    }).select('-password');

    res.json({
      success: true,
      data: pendingEndorsements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending endorsements'
    });
  }
});

// Approve endorsement
router.put('/endorsements/:id/approve', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user || user.registrationMethod !== 'endorsement') {
      return res.status(404).json({
        success: false,
        message: 'Endorsement not found'
      });
    }

    user.status = 'active';
    await user.save();

    // Send approval email
    await sendJournalistApprovalEmail(user);

    res.json({
      success: true,
      message: 'Endorsement approved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving endorsement'
    });
  }
});

module.exports = router;