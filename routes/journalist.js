const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const PressRelease = require('../models/PressRelease');
const { upload, handleUploadErrors } = require('../middleware/upload');

// All routes require journalist role
router.use(protect, authorize('journalist'));

// Journalist dashboard with stats
router.get('/dashboard', async (req, res) => {
  try {
    const pressReleases = await PressRelease.find({ author: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('author', 'firstName lastName fullName email publication');

    const stats = {
      totalReleases: await PressRelease.countDocuments({ author: req.user._id }),
      publishedReleases: await PressRelease.countDocuments({ 
        author: req.user._id, 
        status: 'Published' 
      }),
      draftReleases: await PressRelease.countDocuments({ 
        author: req.user._id, 
        status: 'Draft' 
      }),
      underReviewReleases: await PressRelease.countDocuments({ 
        author: req.user._id, 
        status: 'Under Review' 
      })
    };

    res.json({
      success: true,
      message: 'Welcome to Journalist Dashboard',
      data: {
        user: req.user,
        pressReleases,
        stats
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

// Get journalist profile
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
});

// Update journalist profile
router.put('/profile', async (req, res) => {
  try {
    const { phoneNumber, bio, interests, position } = req.body;
    
    // Update the user document
    const updatedFields = {};
    if (phoneNumber !== undefined) updatedFields.phoneNumber = phoneNumber;
    if (bio !== undefined) updatedFields.bio = bio;
    if (position !== undefined) updatedFields.position = position;
    if (interests !== undefined) updatedFields.interests = Array.isArray(interests) ? interests : JSON.parse(interests || '[]');
    
    const updatedUser = await req.user.updateOne(updatedFields, { new: true, runValidators: true });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// Get all press releases for journalist
router.get('/press-releases', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const pressReleases = await PressRelease.find({ author: req.user._id })
      .populate('author', 'firstName lastName fullName email publication position')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await PressRelease.countDocuments({ author: req.user._id });

    res.json({
      success: true,
      data: {
        pressReleases,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Press releases fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching press releases'
    });
  }
});

// Create new press release with image upload
router.post('/press-releases', upload.fields([
  { name: 'featuredImage', maxCount: 1 },
  { name: 'attachments', maxCount: 5 }
]), handleUploadErrors, async (req, res) => {
  try {
    const { headline, summary, fullContent, tags, publicationDate, status } = req.body;

    const pressReleaseData = {
      headline,
      summary,
      fullContent,
      tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [],
      publicationDate: publicationDate || new Date(),
      status: status || 'Draft',
      author: req.user._id
    };

    // Handle featured image
    if (req.files?.featuredImage) {
      const featuredImage = req.files.featuredImage[0];
      pressReleaseData.featuredImage = {
        filename: featuredImage.filename,
        originalName: featuredImage.originalname,
        path: featuredImage.path,
        mimetype: featuredImage.mimetype,
        size: featuredImage.size,
        url: `/uploads/${featuredImage.filename}`
      };
    }

    // Handle attachments
    if (req.files?.attachments) {
      pressReleaseData.attachments = req.files.attachments.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`
      }));
    }

    const pressRelease = await PressRelease.create(pressReleaseData);
    await pressRelease.populate('author', 'firstName lastName fullName email publication position');

    res.status(201).json({
      success: true,
      message: 'Press release created successfully',
      data: pressRelease
    });
  } catch (error) {
    console.error('Press release creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating press release'
    });
  }
});

// Update press release
router.put('/press-releases/:id', upload.fields([
  { name: 'featuredImage', maxCount: 1 },
  { name: 'attachments', maxCount: 5 }
]), handleUploadErrors, async (req, res) => {
  try {
    const pressRelease = await PressRelease.findOne({ 
      _id: req.params.id, 
      author: req.user._id 
    });

    if (!pressRelease) {
      return res.status(404).json({
        success: false,
        message: 'Press release not found'
      });
    }

    const { headline, summary, fullContent, tags, publicationDate, status } = req.body;

    // Update basic fields
    if (headline) pressRelease.headline = headline;
    if (summary) pressRelease.summary = summary;
    if (fullContent) pressRelease.fullContent = fullContent;
    if (tags) pressRelease.tags = Array.isArray(tags) ? tags : JSON.parse(tags);
    if (publicationDate) pressRelease.publicationDate = publicationDate;
    if (status) pressRelease.status = status;

    // Handle featured image update
    if (req.files?.featuredImage) {
      const featuredImage = req.files.featuredImage[0];
      pressRelease.featuredImage = {
        filename: featuredImage.filename,
        originalName: featuredImage.originalname,
        path: featuredImage.path,
        mimetype: featuredImage.mimetype,
        size: featuredImage.size,
        url: `/uploads/${featuredImage.filename}`
      };
    }

    // Handle new attachments
    if (req.files?.attachments) {
      const newAttachments = req.files.attachments.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`
      }));
      pressRelease.attachments.push(...newAttachments);
    }

    await pressRelease.save();
    await pressRelease.populate('author', 'firstName lastName fullName email publication position');

    res.json({
      success: true,
      message: 'Press release updated successfully',
      data: pressRelease
    });
  } catch (error) {
    console.error('Press release update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating press release'
    });
  }
});

// Delete press release
router.delete('/press-releases/:id', async (req, res) => {
  try {
    const pressRelease = await PressRelease.findOneAndDelete({ 
      _id: req.params.id, 
      author: req.user._id 
    });

    if (!pressRelease) {
      return res.status(404).json({
        success: false,
        message: 'Press release not found'
      });
    }

    res.json({
      success: true,
      message: 'Press release deleted successfully'
    });
  } catch (error) {
    console.error('Press release delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting press release'
    });
  }
});

module.exports = router;