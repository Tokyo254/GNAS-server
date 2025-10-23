const User = require('../models/User');
const { 
  generateJWT, 
  generateRefreshToken,
  verifyRefreshToken,
  generateEmailVerificationToken, 
  generatePasswordResetToken
} = require('../utils/helper');
const { 
  sendVerificationEmail, 
  sendPasswordResetEmail,
  sendJournalistApprovalEmail,
  sendApprovalNotificationEmail
} = require('../utils/emailService');
const { app, authLimiter } = require('../server');

// Helper function to sanitize user data for response
const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : { ...user };
  
  return {
    _id: userObj._id,
    firstName: userObj.firstName,
    surname: userObj.surname,
    lastName: userObj.lastName,
    fullName: `${userObj.firstName} ${userObj.surname} ${userObj.lastName}`.trim(),
    email: userObj.email,
    role: userObj.role,
    publication: userObj.publication,
    orgName: userObj.orgName,
    position: userObj.position,
    phoneNumber: userObj.phoneNumber,
    bio: userObj.bio,
    interests: userObj.interests,
    country: userObj.country,
    status: userObj.status,
    isEmailVerified: userObj.isEmailVerified,
    registrationMethod: userObj.registrationMethod,
    createdAt: userObj.createdAt,
    updatedAt: userObj.updatedAt
  };
};

// Register Journalist
exports.registerJournalist = async (req, res) => {
  try {
    const {
      firstName,
      surname,
      lastName,
      email,
      phoneNumber,
      country,
      publication,
      interests,
      password,
      confirmPassword
    } = req.body;

    console.log('Journalist registration request body:', req.body);
    console.log('Journalist interests received:', interests, 'Type:', typeof interests);

    // Validation
    if (!firstName || !surname || !lastName || !email || !publication) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Handle file upload
    let licenseFile = null;
    if (req.file) {
      licenseFile = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`
      };
    }

    // Handle interests for journalist
    let interestsArray = [];
    if (interests) {
      if (Array.isArray(interests)) {
        interestsArray = interests;
      } else if (typeof interests === 'string') {
        try {
          interestsArray = JSON.parse(interests);
        } catch (parseError) {
          console.log('Failed to parse journalist interests as JSON, treating as string');
          interestsArray = interests.split(',').map(item => item.trim()).filter(item => item);
        }
      }
    }

    console.log('Journalist final interests array:', interestsArray);

    // Create verification token
    const verificationToken = generateEmailVerificationToken();

    // Create user
    const user = new User({
      firstName,
      surname,
      lastName,
      email: email.toLowerCase(),
      phoneNumber,
      country,
      publication,
      interests: interestsArray,
      password,
      role: 'journalist',
      registrationMethod: 'email',
      licenseFile,
      emailVerificationToken: verificationToken.token,
      emailVerificationExpires: verificationToken.expires,
      status: 'pending', // Journalists need admin approval
      isEmailVerified: false
    });

    await user.save();

    // Send verification email
    await sendVerificationEmail(user, verificationToken.token);

    res.status(201).json({
      success: true,
      message: 'Journalist registered successfully! Please check your email for verification. Your account will be activated after admin approval.',
      data: {
        user: sanitizeUser(user)
      }
    });

  } catch (error) {
    console.error('Journalist registration error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// Register Communication Professional
exports.registerComms = async (req, res) => {
  try {
    const {
      firstName,
      surname,
      lastName,
      orgEmail,
      password,
      confirmPassword,
      orgName,
      position,
      bio,
      interests,
      country,
      phoneNumber
    } = req.body;

    console.log('Comms registration request body:', req.body);
    console.log('Interests received:', interests, 'Type:', typeof interests);

    // Validation
    if (!firstName || !surname || !lastName || !orgEmail || !orgName) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields'
      });
    }

    // Map orgEmail to email for database
    const email = orgEmail.toLowerCase();
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Handle interests - it should already be an array from frontend
    let interestsArray = [];
    if (interests) {
      if (Array.isArray(interests)) {
        // If it's already an array, use it directly
        interestsArray = interests;
      } else if (typeof interests === 'string') {
        // If it's a string, try to parse it as JSON first, then as comma-separated
        try {
          interestsArray = JSON.parse(interests);
        } catch (parseError) {
          console.log('Failed to parse interests as JSON, treating as comma-separated string');
          interestsArray = interests.split(',').map(item => item.trim()).filter(item => item);
        }
      }
    }

    console.log('Final interests array:', interestsArray);

    // Create verification token
    const verificationToken = generateEmailVerificationToken();

    // Create user
    const user = new User({
      firstName,
      surname,
      lastName,
      email: email,
      password,
      orgName,
      position,
      bio,
      interests: interestsArray,
      country,
      phoneNumber,
      role: 'comms',
      registrationMethod: 'email',
      emailVerificationToken: verificationToken.token,
      emailVerificationExpires: verificationToken.expires,
      status: 'active',
      isEmailVerified: false
    });

    await user.save();

    // Send verification email
    await sendVerificationEmail(user, verificationToken.token);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for verification.',
      data: {
        user: sanitizeUser(user)
      }
    });

  } catch (error) {
    console.error('Comms registration error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// Login with enhanced error handling
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +loginAttempts +lockUntil');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const lockTime = Math.ceil((user.lockUntil - Date.now()) / 60000); // minutes
      return res.status(401).json({
        success: false,
        message: `Account temporarily locked. Try again in ${lockTime} minutes.`
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incrementLoginAttempts();
      const attemptsLeft = 5 - (user.loginAttempts + 1);
      
      if (attemptsLeft <= 0) {
        return res.status(401).json({
          success: false,
          message: 'Account locked due to too many failed attempts. Try again later.'
        });
      }

      return res.status(401).json({
        success: false,
        message: `Invalid email or password. ${attemptsLeft} attempts left.`
      });
    }

    // Check email verification
    if (!user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in. Check your inbox for the verification link.'
      });
    }

// Check account status
if (user.status !== 'active') {
  let message = 'Your account is not active. ';
  
  if (user.role === 'journalist' && user.status === 'pending') {
    message += 'Your journalist account is pending admin approval. You have limited access.';
    // Allow login but with limited functionality
    // You can set a flag or handle this differently
  } else if (user.role === 'comms' && user.status === 'pending') {
    message += 'Your comms account is pending approval. Please contact support.';
    return res.status(401).json({ success: false, message });
  } else {
    message += 'Please contact support.';
    return res.status(401).json({ success: false, message });
  }
}

    // Reset login attempts and update last login
    await user.resetLoginAttempts();
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const token = generateJWT({ 
      userId: user._id.toString(), 
      role: user.role 
    });
    
    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      role: user.role
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        refreshToken,
        user: sanitizeUser(user)
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// Verify Email with better error handling
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find user by token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      // Check if token exists but is expired
      const expiredUser = await User.findOne({ emailVerificationToken: token });
      if (expiredUser) {
        // Generate new token
        const newToken = generateEmailVerificationToken();
        expiredUser.emailVerificationToken = newToken.token;
        expiredUser.emailVerificationExpires = newToken.expires;
        await expiredUser.save();
        
        await sendVerificationEmail(expiredUser, newToken.token);
        
        return res.status(400).json({
          success: false,
          message: 'Verification token expired. A new verification email has been sent.'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    // In verifyEmail function, update the status logic:
// Verify email
user.isEmailVerified = true;
user.emailVerificationToken = undefined;
user.emailVerificationExpires = undefined;

// Update status based on role
if (user.role === 'journalist') {
  // Journalists remain pending until admin approval
  user.status = 'pending';
  await sendJournalistApprovalEmail(user);
} else if (user.role === 'comms') {
  // Comms are active immediately after email verification
  user.status = 'active';
} else if (user.role === 'admin') {
  // Admins are always active
  user.status = 'active';
}

await user.save();

    let message = 'Email verified successfully! ';
    if (user.role === 'journalist') {
      message += 'Your journalist account is pending admin approval.';
    } else if (user.registrationMethod === 'endorsement') {
      message += 'Your account is pending admin approval.';
    } else {
      message += 'You can now login to your account.';
    }

    res.json({
      success: true,
      message,
      data: {
        user: sanitizeUser(user)
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification'
    });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Don't reveal if user exists or not for security
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, password reset instructions have been sent.'
      });
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken();
    user.passwordResetToken = resetToken.token;
    user.passwordResetExpires = resetToken.expires;
    await user.save();

    // Send reset email
    await sendPasswordResetEmail(user, resetToken.token);

    res.json({
      success: true,
      message: 'If an account with that email exists, password reset instructions have been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request'
    });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token, password, and confirmation are required'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password and clear reset token
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully! You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
};

// Get current user profile
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: sanitizeUser(user)
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user profile'
    });
  }
};

// Debug token endpoint (remove in production)
exports.debugToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    const emailUser = await User.findOne({ 
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });
    
    const passwordUser = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    });
    
    res.json({
      emailVerification: {
        valid: !!emailUser,
        user: emailUser ? { 
          email: emailUser.email, 
          expires: emailUser.emailVerificationExpires,
          isVerified: emailUser.isEmailVerified 
        } : null
      },
      passwordReset: {
        valid: !!passwordUser,
        user: passwordUser ? { 
          email: passwordUser.email, 
          expires: passwordUser.passwordResetExpires 
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const newToken = generateJWT({
      userId: user._id.toString(),
      role: user.role
    });

    res.json({
      success: true,
      data: {
        token: newToken
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
};

// Logout (optional - for token blacklisting in future)
exports.logout = async (req, res) => {
  try {
    // In a more secure implementation, you might want to blacklist the token
    // For now, we'll just return success as token management is client-side
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

// Placeholder functions for future implementation
exports.registerWithInvite = async (req, res) => {
  res.status(501).json({ 
    success: false, 
    message: 'Invite registration not implemented' 
  });
};

exports.registerWithEndorsement = async (req, res) => {
  res.status(501).json({ 
    success: false, 
    message: 'Endorsement registration not implemented' 
  });
};

exports.approveEndorsement = async (req, res) => {
  res.status(501).json({ 
    success: false, 
    message: 'Endorsement approval not implemented' 
  });
};

// Export the function instead of calling it
exports.createDefaultAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ email: process.env.DEFAULT_ADMIN_EMAIL, 
                                role: 'admin' 
                                });
    
    if (!existingAdmin) {
      const adminUser = new User({
        firstName: 'System',
        surname: 'Administrator',
        lastName: 'Admin',
        email: process.env.DEFAULT_ADMIN_EMAIL,
        password: process.env.DEFAULT_ADMIN_PASSWORD,
        role: 'admin',
        status: 'active',
        isEmailVerified: true,
        orgName: 'System Administration',
        position: 'System Administrator',
        registrationMethod: 'email'
      });

      await adminUser.save();
      console.log('✅Default admin user created successfully');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

