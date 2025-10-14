const { verifyJWT } = require('../utils/helper');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      const decoded = verifyJWT(token);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user is active based on role
      if (user.status !== 'active') {
        // Journalists can be pending but still access some routes
        if (user.role === 'journalist' && user.status === 'pending') {
          // Journalists in pending status can still access basic routes
          // but show a message that they need approval for full access
          req.user = user;
          req.user.isPendingApproval = true;
          return next();
        }
        
        // For all other roles and statuses, block access
        let message = 'Your account is not active. ';
        if (user.role === 'comms' && user.status === 'pending') {
          message += 'Your comms account is pending approval. Please contact support.';
        } else if (user.role === 'journalist') {
          message += 'Your journalist account requires activation. Please contact support.';
        } else {
          message += 'Please contact support.';
        }
        
        return res.status(401).json({
          success: false,
          message
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    // Allow pending journalists to access journalist routes but with limitations
    if (req.user.isPendingApproval && roles.includes('journalist')) {
      console.log('⚠️ Pending journalist accessing restricted routes');
      // You can add additional checks here for what pending journalists can access
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Enhanced security middleware
const requireActiveStatus = (req, res, next) => {
  if (req.user.status !== 'active' && !req.user.isPendingApproval) {
    return res.status(403).json({
      success: false,
      message: 'Account requires activation'
    });
  }
  next();
};

module.exports = {
  protect,
  authorize,
  requireActiveStatus
};