const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  register,
  login,
  googleAuth,
  logout,
  getMe,
  updateProfile,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validatorMiddleware');
const {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  changePasswordValidator,
} = require('../validators/authValidator');

const router = express.Router();

// Rate limiter for auth endpoints (prevent brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, validate(registerValidator), register);
router.post('/login', authLimiter, validate(loginValidator), login);
router.post('/google', authLimiter, googleAuth);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, validate(updateProfileValidator), updateProfile);
router.put('/change-password', protect, validate(changePasswordValidator), changePassword);

module.exports = router;
