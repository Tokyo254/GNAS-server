const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { 
  generateToken, 
  generateRefreshToken, 
  verifyToken, 
  verifyRefreshToken 
} = require('./jwt');

const generateRandomToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

const generateEmailVerificationToken = () => {
  const token = generateRandomToken(32);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  console.log('📧 Generated email verification token, expires:', expires);
  
  return { token, expires };
};

const generatePasswordResetToken = () => {
  const token = generateRandomToken(32);
  const expires = new Date(Date.now() + 60 * 60 * 1000);
  
  console.log('🔐 Generated password reset token, expires:', expires);
  
  return { token, expires };
};

const isTokenExpired = (expirationDate) => {
  return Date.now() > new Date(expirationDate).getTime();
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const generateInviteCode = (length = 8) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

const sanitizeUser = (user) => {
  if (!user) return null;
  
  const userObj = user.toObject ? user.toObject() : { ...user };
  
  // Remove sensitive fields
  const sensitiveFields = [
    'password',
    'emailVerificationToken',
    'emailVerificationExpires',
    'passwordResetToken',
    'passwordResetExpires',
    '__v',
    'loginAttempts',
    'lockUntil'
  ];
  
  sensitiveFields.forEach(field => delete userObj[field]);
  
  return userObj;
};

const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Password strength validation
const validatePasswordStrength = (password) => {
  const minLength = 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (password.length < minLength) {
    return { isValid: false, message: `Password must be at least ${minLength} characters` };
  }
  
  // Calculate strength score
  let strength = 0;
  if (password.length >= 8) strength++;
  if (hasUpperCase) strength++;
  if (hasLowerCase) strength++;
  if (hasNumbers) strength++;
  if (hasSpecialChar) strength++;
  
  return { 
    isValid: strength >= 3, 
    message: strength >= 3 ? 'Password is strong' : 'Password should include uppercase, lowercase, numbers, and special characters',
    strength 
  };
};

const generateJWT = (payload) => {
  return generateToken({
    userId: payload.userId,
    role: payload.role
  });
};

const verifyJWT = (token) => {
  return verifyToken(token);
};

// Re-export JWT functions
module.exports = {
  generateRandomToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  isTokenExpired,
  hashToken,
  isValidEmail,
  generateInviteCode,
  sanitizeUser,
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  generateJWT,
  verifyJWT,
  generateRefreshToken,
  verifyRefreshToken
};