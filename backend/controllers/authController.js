'use strict';
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'connectsphere_fallback_secret_key_2024';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

const generateToken = (userId) => {
  return jwt.sign({ id: userId.toString() }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

const formatUser = (user) => ({
  _id: user._id,
  id: user._id,
  username: user.username,
  email: user.email,
  name: user.name,
  avatar: user.avatar || '',
  avatarUrl: user.avatarUrl,
  bio: user.bio || '',
  website: user.website || '',
  location: user.location || '',
  isVerified: user.isVerified,
  isOnline: user.isOnline,
  followersCount: user.followersCount || 0,
  followingCount: user.followingCount || 0,
  postsCount: user.postsCount || 0,
  role: user.role,
  skills: user.skills || [],
  socialLinks: user.socialLinks || {},
  createdAt: user.createdAt,
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    // ── Validation ──
    const errors = [];
    if (!name || name.trim().length < 2) errors.push('Name must be at least 2 characters');
    if (!username || username.trim().length < 3) errors.push('Username must be at least 3 characters');
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.push('Valid email is required');
    if (!password || password.length < 6) errors.push('Password must be at least 6 characters');
    if (username && !/^[a-zA-Z0-9_.]+$/.test(username)) errors.push('Username: letters, numbers, . and _ only');

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // ── Check existing ──
    const existing = await User.findOne({
      $or: [{ email: cleanEmail }, { username: cleanUsername }],
    }).lean();

    if (existing) {
      const field = existing.email === cleanEmail ? 'email address' : 'username';
      return res.status(409).json({ success: false, message: `This ${field} is already registered` });
    }

    // ── Create user ──
    const user = new User({
      username: cleanUsername,
      email: cleanEmail,
      password,
      name: name.trim(),
    });

    await user.save();
    console.log(`✅ New user registered: @${user.username} (${user.email})`);

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to ConnectSphere!',
      token,
      user: formatUser(user),
    });
  } catch (err) {
    console.error('Register error:', err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(409).json({ success: false, message: `This ${field} is already taken` });
    }
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors)[0]?.message || 'Validation failed';
      return res.status(400).json({ success: false, message: msg });
    }
    return res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Must explicitly select password (it's select:false)
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'No account found with this email' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    // Update online status (don't await - non-critical)
    User.findByIdAndUpdate(user._id, { isOnline: true, lastSeen: new Date() }).exec();

    const token = generateToken(user._id);
    console.log(`✅ User logged in: @${user.username}`);

    return res.json({
      success: true,
      message: `Welcome back, ${user.name.split(' ')[0]}!`,
      token,
      user: formatUser(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, user: formatUser(user) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
exports.logout = async (req, res) => {
  try {
    User.findByIdAndUpdate(req.user._id, { isOnline: false, lastSeen: new Date() }).exec();
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/auth/change-password ───────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both fields are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
