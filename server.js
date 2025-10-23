require('dotenv').config({
   path: process.env.NODE_ENV === 'production' 
    ? '.env.production' 
    : '.env.local'
});
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const hpp = require('hpp');
const path = require('path');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const {createDefaultAdmin} = require('./controllers/authController');

const app = express();
exports.app = app;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "http://localhost:5000", "ws://localhost:*/"],
      mediaSrc: ["'self'", "data:", "https:", "blob:"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Compression middleware
app.use(compression());

// Rate limiting - make it more lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit in development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// More lenient auth rate limiting for development
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // Higher limit in development
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  }
});
exports.authLimiter = authLimiter;
app.use('/api/auth/login', authLimiter);

// File upload middleware
app.use(fileUpload({
  createParentPath: true,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  abortOnLimit: true,
  safeFileNames: true,
  preserveExtension: true,
  debug: process.env.NODE_ENV === 'development'
}));

// CORS configuration - UPDATED FOR RENDER
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [
          process.env.CLIENT_URL,
          'https://*.vercel.app',
          process.env.RENDER_EXTERNAL_URL
        ].filter(Boolean)
      : [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://127.0.0.1:5173'
        ];
    
    if (!origin || allowedOrigins.includes(origin) || 
        allowedOrigins.some(allowed => allowed.includes('*') && origin.includes(allowed.replace('*', '')))) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Body parsing middleware with increased limits for file uploads
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb',
  parameterLimit: 100000
}));

// Custom NoSQL injection protection (REPLACES express-mongo-sanitize)
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    Object.keys(obj).forEach(key => {
      // Remove MongoDB operators
      if (key.startsWith('$')) {
        console.warn(`🚨 NoSQL injection attempt blocked:`, { key, value: obj[key] });
        delete obj[key];
        return;
      }
      
      // Recursively sanitize nested objects and arrays
      if (obj[key] && typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    });
    return obj;
  };
  
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  
  next();
});

// Data sanitization against XSS
// Custom XSS protection (replaces problematic xss-clean)
app.use((req, res, next) => {
  // Skip XSS protection for login to avoid conflicts
  if (req.path === '/api/auth/login' || req.path === '/api/auth/register') {
    return next();
  }
  
  // Basic XSS protection for other routes
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .trim();
      }
    });
  }
  next();
});

// Prevent parameter pollution
app.use(hpp({
  whitelist: [
    'page',
    'limit',
    'sort',
    'fields',
    'populate',
    'search',
    'status',
    'role'
  ]
}));

// Ensure upload directory exists - ADDED FOR RENDER
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('✅ Uploads directory created');
}

// Static files - secure configuration
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
  setHeaders: (res, path) => {
    // Security headers for static files
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    
    // Only set strict transport security in production
    if (process.env.NODE_ENV === 'production') {
  // Production security enhancements
  app.set('trust proxy', 1);
  
  // Serve static files efficiently
  app.use(express.static('uploads', {
    maxAge: '1d',
    setHeaders: (res, path) => {
      res.set('Cache-Control', 'public, max-age=86400');
    }
  }));
}
  }
}));

// Enhanced health check endpoint for Render - UPDATED
app.get('/health', async (req, res) => {
  const healthCheck = {
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: 'unknown'
  };

  try {
    // Check database connection
    if (mongoose.connection.readyState === 1) {
      healthCheck.database = 'connected';
    } else {
      healthCheck.database = 'disconnected';
      healthCheck.success = false;
      healthCheck.message = 'Database connection issues';
    }
    
    res.status(healthCheck.success ? 200 : 503).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database connection with improved error handling for MongoDB Atlas
const connectDB = async () => {
  try {
    console.log(`🔗 Connecting to ${process.env.NODE_ENV} database...`);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 30000,
      bufferCommands: true,
      bufferTimeoutMS: 30000
    });

    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🏠 Host: ${conn.connection.host}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
    console.log('👨‍💼 Creating default admin user...');
    const adminResult = await createDefaultAdmin();
    if (adminResult.success) {
      console.log('✅ Admin user setup completed');
    } else {
      console.log('⚠️ Admin user setup had issues, but server continues');
    }

  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Server continues running - will retry connection');
    } else {
      console.log('💡 Development Tips:');
      console.log('1. For local MongoDB: run "mongod" or use Docker');
      console.log('2. For Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest');
      process.exit(1);
    }
  }
};

// Initialize database connection
connectDB();

// Import routes
const routes = require('./routes');

// API routes
app.use('/api', routes);

// Custom 404 handler for API routes - FIXED APPROACH
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: `API endpoint ${req.originalUrl} not found`
    });
  }
  next();
});

// Serve static files in production (for React/Vite build)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // Catch-all handler for client-side routing - FIXED
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
} else {
  // Development 404 handler for non-API routes
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found`
    });
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Global error handler:', err);

  // Log more details in development
if (process.env.NODE_ENV === 'development') {
  // Development-only middleware
  const morgan = require('morgan');
  app.use(morgan('dev'));
  
  // Enhanced error details
  app.use((err, req, res, next) => {
    console.error('Development Error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
      stack: err.stack
    });
  });
}

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
      field: field
    });
  }

  // File upload error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 10MB.'
    });
  }

  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy: Origin not allowed'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Default error
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('🚨 Unhandled Promise Rejection:', err);
  console.error('At promise:', promise);
  
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 Server running on port ${PORT}
📊 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Access URLs:
   Local: http://localhost:${PORT}
   Network: http://0.0.0.0:${PORT}
🔗 Health check: http://localhost:${PORT}/health
✅ CORS enabled for: ${process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : 'localhost'}
  `);
});

// Export for testing
module.exports = app;