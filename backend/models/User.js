'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_.]+$/, 'Username: letters, numbers, dots, underscores only'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Never return password in queries
  },
  name: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  bio: { type: String, maxlength: [160, 'Bio max 160 chars'], default: '' },
  avatar: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  website: { type: String, default: '' },
  location: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  followersCount: { type: Number, default: 0, min: 0 },
  followingCount: { type: Number, default: 0, min: 0 },
  postsCount: { type: Number, default: 0, min: 0 },
  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  skills: [{ type: String, maxlength: 30 }],
  socialLinks: {
    twitter: { type: String, default: '' },
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    instagram: { type: String, default: '' },
  },
  analytics: {
    profileViews: { type: Number, default: 0 },
  },
  notificationSettings: {
    likes: { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
    follows: { type: Boolean, default: true },
  },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// ── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ name: 'text', username: 'text', bio: 'text' });

// ── Virtuals ─────────────────────────────────────────────────────────────────
userSchema.virtual('avatarUrl').get(function () {
  if (this.avatar && this.avatar.length > 0) return this.avatar;
  const initials = encodeURIComponent(this.name || 'User');
  return `https://ui-avatars.com/api/?name=${initials}&background=4F46E5&color=fff&size=200&bold=true`;
});

// ── Pre-save: hash password ───────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ── Methods ───────────────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || !this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  obj.avatarUrl = this.avatarUrl;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
