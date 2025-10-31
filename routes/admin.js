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

// Admin dashboard analytics - COMPREHENSIVE VERSION
router.get('/analytics', async (req, res) => {
  try {
    // Basic counts from database
    const totalUsers = await User.countDocuments();
    const activeComms = await User.countDocuments({ role: 'comms', status: 'active' });
    const totalReleases = await PressRelease.countDocuments();
    const activeJournalists = await User.countDocuments({ role: 'journalist', status: 'active' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const pendingJournalists = await User.countDocuments({ role: 'journalist', status: 'pending' });

    // Comprehensive analytics data with mock data for frontend
    const analyticsData = {
      // Basic counts (from database)
      totalUsers,
      activeComms,
      totalReleases,
      activeJournalists,
      pendingJournalists,
      totalAdmins,
      systemHealth: 98.5,

      // Additional fields frontend expects
      totalComments: 2345,
      totalReports: 67,
      pendingReports: 12,
      userGrowth: 12.5,
      releaseGrowth: 8.3,
      engagementRate: 67.8,
      avgReadTime: '3.2 min',
      dailyActiveUsers: 1247,
      weeklyActiveUsers: 8432,
      monthlyActiveUsers: 28765,

      // Mock data for visualization
      topCategories: [
        { name: 'Technology', count: 234 },
        { name: 'Business', count: 189 },
        { name: 'Politics', count: 156 },
        { name: 'Health', count: 134 },
        { name: 'Environment', count: 98 }
      ],
      trafficSources: [
        { source: 'Direct', percentage: 45 },
        { source: 'Social Media', percentage: 30 },
        { source: 'Search Engines', percentage: 15 },
        { source: 'Referral', percentage: 10 }
      ],
      userDemographics: [
        { _id: 'US', users: 456 },
        { _id: 'UK', users: 234 },
        { _id: 'Canada', users: 189 },
        { _id: 'Australia', users: 156 },
        { _id: 'Germany', users: 134 }
      ],
      topPerformingReleases: [
        {
          _id: '1',
          headline: 'Tech Company Launches Revolutionary AI Platform',
          summary: 'New AI platform set to transform industry standards with cutting-edge technology',
          author: 'John Smith',
          status: 'Published',
          publicationDate: new Date().toISOString(),
          categories: ['Technology', 'AI'],
          views: 15420,
          likes: 2345,
          shares: 567,
          readTime: '5 min read'
        },
        {
          _id: '2',
          headline: 'Global Corporation Announces Record Q4 Earnings',
          summary: 'Record-breaking quarterly results with significant growth across all segments',
          author: 'Sarah Johnson',
          status: 'Published',
          publicationDate: new Date().toISOString(),
          categories: ['Business', 'Finance'],
          views: 9876,
          likes: 1456,
          shares: 234,
          readTime: '4 min read'
        },
        {
          _id: '3',
          headline: 'New Sustainability Initiative Targets Carbon Neutrality',
          summary: 'Comprehensive environmental program aims for carbon neutrality by 2030',
          author: 'Michael Chen',
          status: 'Published',
          publicationDate: new Date().toISOString(),
          categories: ['Environment', 'Sustainability'],
          views: 7654,
          likes: 987,
          shares: 123,
          readTime: '6 min read'
        }
      ]
    };

    res.json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics data'
    });
  }
});

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
            status: 'active',
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

// Whistleblower messages endpoint
router.get('/whistleblower-messages', async (req, res) => {
  try {
    // This route remains admin-only due to the router-level middleware
    res.json({
      success: true,
      data: [],
      message: 'Whistleblower messages endpoint - admin access only'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching whistleblower messages'
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