// scripts/initAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

class SecureAdminInitializer {
  constructor() {
    this.initialized = false;
    this.initializing = false;
    this.maxRetries = 3;
  }

  async initialize() {
    if (this.initialized || this.initializing) {
      console.log('🔄 Admin initialization already in progress or completed');
      return { success: true, created: false };
    }

    this.initializing = true;

    try {
      // Validate environment variables
      if (!this.hasRequiredCredentials()) {
        console.warn('⚠️ Default admin credentials not configured');
        return { success: true, created: false, reason: 'Missing credentials' };
      }

      // Verify database connection
      if (mongoose.connection.readyState !== 1) {
        console.warn('⏳ Database not ready, admin initialization will retry');
        return { success: true, created: false, reason: 'Database not ready' };
      }

      console.log('🔍 Checking for existing admin user...');

      // Check if admin already exists
      const existingAdmin = await User.findOne({ 
        email: process.env.DEFAULT_ADMIN_EMAIL.toLowerCase(),
        role: 'admin' 
      });

      if (existingAdmin) {
        console.log('✅ Admin user already exists');
        this.initialized = true;
        return { success: true, created: false, user: this.sanitizeAdmin(existingAdmin) };
      }

      console.log('👨‍💼 Creating secure default admin user...');

      // Hash password before saving
      const hashedPassword = await bcrypt.hash(
        process.env.DEFAULT_ADMIN_PASSWORD, 
        12 // Salt rounds
      );

      // Create admin user with hashed password
      const adminUser = new User({
        firstName: process.env.DEFAULT_ADMIN_FIRSTNAME || 'System',
        surname: process.env.DEFAULT_ADMIN_SURNAME || 'Administrator',
        lastName: process.env.DEFAULT_ADMIN_LASTNAME || 'Admin',
        email: process.env.DEFAULT_ADMIN_EMAIL.toLowerCase(),
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        isEmailVerified: true,
        orgName: process.env.DEFAULT_ADMIN_ORG || 'System Administration',
        position: process.env.DEFAULT_ADMIN_POSITION || 'System Administrator',
        registrationMethod: 'system',
        createdBy: 'system'
      });

      await adminUser.save();
      
      console.log('✅ Secure default admin user created successfully');
      this.initialized = true;
      
      return { 
        success: true, 
        created: true, 
        user: this.sanitizeAdmin(adminUser)
      };

    } catch (error) {
      console.error('❌ Admin initialization error:', error.message);
      
      this.initializing = false;
      
      return { 
        success: false, 
        created: false, 
        error: error.message,
        retryable: this.isRetryableError(error)
      };
    } finally {
      this.initializing = false;
    }
  }

  hasRequiredCredentials() {
    const hasEmail = process.env.DEFAULT_ADMIN_EMAIL?.length > 0;
    const hasPassword = process.env.DEFAULT_ADMIN_PASSWORD?.length >= 8;
    
    if (!hasEmail) {
      console.warn('❌ DEFAULT_ADMIN_EMAIL is required');
      return false;
    }
    
    if (!hasPassword) {
      console.warn('❌ DEFAULT_ADMIN_PASSWORD must be at least 8 characters');
      return false;
    }
    
    return true;
  }

  sanitizeAdmin(user) {
    if (!user) return null;
    
    return {
      id: user._id?.toString(),
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
      role: user.role,
      status: user.status,
      createdAt: user.createdAt
    };
  }

  isRetryableError(error) {
    const retryableErrors = [
      'MongoNetworkError',
      'MongoTimeoutError',
      'MongoServerSelectionError'
    ];
    
    return retryableErrors.some(errType => error.name === errType);
  }

  // Secure manual retry with authentication
  async secureRetry(authKey = null) {
    if (this.initialized) {
      return { success: true, created: false, reason: 'Already initialized' };
    }

    // Validate authentication for manual retry
    if (!this.isAuthorized(authKey)) {
      return { 
        success: false, 
        created: false, 
        error: 'Unauthorized',
        reason: 'Invalid or missing authentication key'
      };
    }
    
    console.log('🔄 Secure retry of admin initialization...');
    return await this.initialize();
  }

  isAuthorized(authKey) {
    // In development, allow without key
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    // In production, require valid secret key
    const validKey = process.env.ADMIN_INIT_SECRET;
    return validKey && authKey === validKey;
  }

  getStatus() {
    return {
      initialized: this.initialized,
      initializing: this.initializing,
      hasCredentials: this.hasRequiredCredentials(),
      environment: process.env.NODE_ENV,
      requiresAuth: process.env.NODE_ENV === 'production'
    };
  }
}

// Create singleton instance
const secureAdminInitializer = new SecureAdminInitializer();

module.exports = secureAdminInitializer;