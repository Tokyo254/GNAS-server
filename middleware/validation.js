const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

const validateRegistration = [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('orgEmail').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('orgName').notEmpty().withMessage('Organization name is required'),
  body('position').notEmpty().withMessage('Position is required'),
  body('bio').notEmpty().withMessage('Bio is required'),
  body('role').isIn(['journalist', 'comms', 'admin']).withMessage('Role must be journalist, comms, or admin'),
  handleValidationErrors
];

const validateLogin = [
  body('orgEmail').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

const validateEmail = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  handleValidationErrors
];

const validatePasswordReset = [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  }),
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateEmail,
  validatePasswordReset
};