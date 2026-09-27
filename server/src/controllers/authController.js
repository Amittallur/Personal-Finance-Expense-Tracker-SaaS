const User = require('../models/User');
const { createDefaultCategories } = require('../utils/defaultCategories');
const { sendTokenResponse, clearTokenCookie } = require('../utils/tokenUtils');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      preferences: {
        currency: 'INR',
        theme: 'light',
        dateFormat: 'DD/MM/YYYY',
      },
    });

    // Populate default categories for this user
    await createDefaultCategories(user._id);

    sendTokenResponse(user, 201, res, 'Registration successful');
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    sendTokenResponse(user, 200, res, 'Logged in successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  clearTokenCookie(res);
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
};

// @desc    Update user profile & preferences
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, preferences } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (preferences) {
      user.preferences = {
        ...user.preferences,
        ...preferences,
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match.',
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Google SSO Login / Register
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token credential is required',
      });
    }

    const { OAuth2Client } = require('google-auth-library');
    const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    // Verify token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google authentication token payload',
      });
    }

    const { email, name, sub: googleId, picture } = payload;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      let isModified = false;
      if (!user.googleId) {
        user.googleId = googleId;
        isModified = true;
      }
      if (picture && (!user.avatar || user.avatar === '')) {
        user.avatar = picture;
        isModified = true;
      }
      if (isModified) {
        await user.save();
      }
      return sendTokenResponse(user, 200, res, 'Logged in with Google successfully');
    }

    // Otherwise create a new Google-authenticated user
    user = await User.create({
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      authProvider: 'google',
      googleId,
      avatar: picture || '',
      preferences: {
        currency: 'INR',
        theme: 'light',
        dateFormat: 'DD/MM/YYYY',
      },
    });

    // Initialize default categories for new user
    await createDefaultCategories(user._id);

    sendTokenResponse(user, 201, res, 'Welcome to Centra! Account created via Google');
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(401).json({
      success: false,
      message: 'Google authentication failed: ' + (err.message || 'Invalid token'),
    });
  }
};

module.exports = {
  register,
  login,
  googleAuth,
  logout,
  getMe,
  updateProfile,
  changePassword,
};

