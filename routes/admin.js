const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const PressRelease = require('../models/PressRelease');
const csv = require('csv-parser');
const stream = require('stream');
const { sendCommsApprovalEmail } = require('../utils/emailService');
const path = require('path');

// All admin routes require admin role
router.use(protect, authorize('admin'));

// Serve uploaded files securely
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Admin dashboard analytics
router.get('/analytics', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const pendingComms = await User.countDocuments({ role: 'comms', status: 'pending' });
    const totalReleases = await PressRelease.countDocuments();
    const activeJournalists = await User.countDocuments({ role: 'journalist', status: 'active' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    res.json({
      success: true,
      data: {
        totalUsers,
        pendingComms,
        totalReleases,
        activeJournalists,
        totalAdmins,
        systemHealth: 98.5 // Mock system health
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics data'
    });
  }
});

// Add these routes to your admin.js file:

// Get pending journalists for approval
router.get('/journalists/pending', async (req, res) => {
  try {
    const pendingJournalists = await User.find({
      role: 'journalist',
      status: 'pending'
    }).select('-password -emailVerificationToken -passwordResetToken')
     .sort({ createdAt: -1 });

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

    // Send approval email (you'll need to create this function)
    // await sendJournalistApprovalEmail(journalist);

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

// Get all users with pagination and filtering
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password -emailVerificationToken -passwordResetToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      success: true,
      data: users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// Get all press releases
router.get('/press-releases', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const pressReleases = await PressRelease.find()
      .populate('author', 'firstName lastName fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await PressRelease.countDocuments();

    res.json({
      success: true,
      data: pressReleases,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching press releases'
    });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
});

// Delete press release
router.delete('/press-releases/:id', async (req, res) => {
  try {
    const pressRelease = await PressRelease.findById(req.params.id);
    
    if (!pressRelease) {
      return res.status(404).json({
        success: false,
        message: 'Press release not found'
      });
    }

    await PressRelease.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Press release deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting press release'
    });
  }
});

// Bulk upload users
router.post('/bulk-upload/users', async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const file = req.files.file;
    
    // Validate file type
    if (!file.mimetype.includes('csv') && !file.name.endsWith('.csv')) {
      return res.status(400).json({
        success: false,
        message: 'Only CSV files are allowed'
      });
    }

    const results = [];
    const errors = [];
    let processed = 0;

    // Parse CSV
    const bufferStream = new stream.PassThrough();
    bufferStream.end(file.data);

    await new Promise((resolve, reject) => {
      bufferStream
        .pipe(csv())
        .on('data', (data) => {
          processed++;
          
          // Validate required fields
          if (!data.firstName || !data.surname || !data.lastName || !data.email || !data.orgName || !data.position) {
            errors.push(`Row ${processed}: Missing required fields`);
            return;
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(data.email)) {
            errors.push(`Row ${processed}: Invalid email format - ${data.email}`);
            return;
          }

          results.push({
            firstName: data.firstName.trim(),
            surname: data.surname.trim(),
            lastName: data.lastName.trim(),
            email: data.email.toLowerCase().trim(),
            orgName: data.orgName.trim(),
            position: data.position.trim(),
            phoneNumber: data.phoneNumber?.trim() || '',
            country: data.country?.trim() || '',
            interests: data.interests ? data.interests.split(',').map(i => i.trim()).filter(i => i) : [],
            role: 'comms',
            status: 'pending', // Comms require approval
            registrationMethod: 'bulk_upload'
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Insert users into database
    const successfulInserts = [];
    
    for (const userData of results) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          errors.push(`User already exists - ${userData.email}`);
          continue;
        }

        const user = new User(userData);
        await user.save();
        successfulInserts.push(user);
      } catch (error) {
        errors.push(`Error creating user ${userData.email}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      data: {
        processed,
        successful: successfulInserts.length,
        failed: errors.length,
        errors: errors.slice(0, 10) // Return first 10 errors
      },
      message: `Successfully processed ${processed} users, ${successfulInserts.length} created, ${errors.length} failed`
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing bulk upload'
    });
  }
});

// Bulk upload press releases
router.post('/bulk-upload/releases', async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const file = req.files.file;
    
    // Validate file type
    if (!file.mimetype.includes('csv') && !file.name.endsWith('.csv')) {
      return res.status(400).json({
        success: false,
        message: 'Only CSV files are allowed'
      });
    }

    const results = [];
    const errors = [];
    let processed = 0;

    // Parse CSV
    const bufferStream = new stream.PassThrough();
    bufferStream.end(file.data);

    await new Promise((resolve, reject) => {
      bufferStream
        .pipe(csv())
        .on('data', (data) => {
          processed++;
          
          // Validate required fields
          if (!data.headline || !data.summary || !data.fullContent) {
            errors.push(`Row ${processed}: Missing required fields`);
            return;
          }

          // Validate word count
          const wordCount = data.fullContent.trim().split(/\s+/).length;
          if (wordCount > 300) {
            errors.push(`Row ${processed}: Content exceeds 300 words (${wordCount})`);
            return;
          }

          results.push({
            headline: data.headline.trim(),
            summary: data.summary.trim(),
            fullContent: data.fullContent.trim(),
            categories: data.categories ? data.categories.split(',').map(c => c.trim()).filter(c => c) : [],
            publicationDate: data.publicationDate || new Date(),
            status: data.status || 'Under Review',
            author: req.user._id // Admin is the author for bulk uploads
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Insert press releases into database
    const successfulInserts = [];
    
    for (const releaseData of results) {
      try {
        const pressRelease = new PressRelease(releaseData);
        await pressRelease.save();
        successfulInserts.push(pressRelease);
      } catch (error) {
        errors.push(`Error creating press release "${releaseData.headline}": ${error.message}`);
      }
    }

    res.json({
      success: true,
      data: {
        processed,
        successful: successfulInserts.length,
        failed: errors.length,
        errors: errors.slice(0, 10) // Return first 10 errors
      },
      message: `Successfully processed ${processed} releases, ${successfulInserts.length} created, ${errors.length} failed`
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing bulk upload'
    });
  }
});

module.exports = router;