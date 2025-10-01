const jwt = require('jsonwebtoken');

class JWTError extends Error {
  constructor(message) {
    super(message);
    this.name = 'JWTError';
  }
}

// Validate environment variables on startup
const validateJWTConfig = () => {
  if (!process.env.JWT_SECRET) {
    throw new JWTError('JWT_SECRET environment variable is required');
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new JWTError('JWT_REFRESH_SECRET environment variable is required');
  }
};

// Validate immediately when module loads
validateJWTConfig();

const generateToken = (payload, expiresIn = '1h') => {
  return jwt.sign({
    id: payload.userId || payload.id,  
    role: payload.role
  }, process.env.JWT_SECRET, { expiresIn });
};

const generateRefreshToken = (payload, expiresIn = '7d') => {
  return jwt.sign({
    id: payload.userId || payload.id,  
    role: payload.role
  }, process.env.JWT_REFRESH_SECRET, { expiresIn });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  JWTError,
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  decodeToken
};