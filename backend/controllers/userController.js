'use strict';
const User = require('../models/User');
const Post = require('../models/Post');
const Follower = require('../models/Follower');
const Notification = require('../models/Notification');

const formatUser = (user, extras = {}) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  obj.avatarUrl = user.avatarUrl || (user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4F46E5&color=fff&size=200&bold=true`);
  return { ...obj, ...extras };
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    User.findByIdAndUpdate(user._id, { $inc: { 'analytics.profileViews': 1 } }).exec();

    let isFollowing = false;
    if (req.user) {
      isFollowing = !!(await Follower.findOne({ follower: req.user._id, following: user._id }));
    }

    return res.json({
      success: true,
      user: formatUser(user, {
        isFollowing,
        isOwnProfile: req.user ? req.user._id.toString() === user._id.toString() : false,
      }),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, website, location, skills, socialLinks } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (bio !== undefined) updates.bio = bio;
    if (website !== undefined) updates.website = website;
    if (location !== undefined) updates.location = location;
    if (skills !== undefined) updates.skills = Array.isArray(skills) ? skills : [];
    if (socialLinks !== undefined) updates.socialLinks = socialLinks;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    return res.json({ success: true, message: 'Profile updated!', user: formatUser(user) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file received' });
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: avatarPath }, { new: true });
    return res.json({ success: true, message: 'Profile photo updated!', avatar: avatarPath, user: formatUser(user) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.uploadCover = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file received' });
    const coverPath = `/uploads/covers/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user._id, { coverImage: coverPath });
    return res.json({ success: true, message: 'Cover photo updated!', coverImage: coverPath });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleFollow = async (req, res) => {
  try {
    const targetId = req.params.id;
    if (req.user._id.toString() === targetId) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }
    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });

    const existing = await Follower.findOne({ follower: req.user._id, following: targetId });
    if (existing) {
      await Follower.deleteOne({ _id: existing._id });
      await User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: -1 } });
      await User.findByIdAndUpdate(targetId, { $inc: { followersCount: -1 } });
      return res.json({ success: true, isFollowing: false, message: `Unfollowed @${target.username}` });
    } else {
      await Follower.create({ follower: req.user._id, following: targetId });
      await User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: 1 } });
      await User.findByIdAndUpdate(targetId, { $inc: { followersCount: 1 } });
      Notification.create({
        recipient: targetId,
        sender: req.user._id,
        type: 'follow',
        message: `${req.user.name} started following you`,
      }).catch(() => {});
      return res.json({ success: true, isFollowing: true, message: `Following @${target.username}` });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const rows = await Follower.find({ following: user._id })
      .populate('follower', 'name username avatar isVerified followersCount')
      .sort({ createdAt: -1 }).limit(100);
    return res.json({ success: true, followers: rows.map(r => formatUser(r.follower)) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const rows = await Follower.find({ follower: user._id })
      .populate('following', 'name username avatar isVerified followersCount')
      .sort({ createdAt: -1 }).limit(100);
    return res.json({ success: true, following: rows.map(r => formatUser(r.following)) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSuggestedUsers = async (req, res) => {
  try {
    const following = await Follower.find({ follower: req.user._id }).select('following').lean();
    const excludeIds = [...following.map(f => f.following), req.user._id];
    const users = await User.find({ _id: { $nin: excludeIds } })
      .select('name username avatar isVerified followersCount bio')
      .sort({ followersCount: -1 })
      .limit(6);
    return res.json({ success: true, users: users.map(u => formatUser(u)) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const posts = await Post.find({ author: req.user._id }).lean();
    const totalLikes = posts.reduce((s, p) => s + (p.likesCount || 0), 0);
    const totalComments = posts.reduce((s, p) => s + (p.commentsCount || 0), 0);
    return res.json({
      success: true,
      analytics: {
        profileViews: user.analytics?.profileViews || 0,
        totalLikes,
        totalComments,
        postsCount: user.postsCount || 0,
        followersCount: user.followersCount || 0,
        followingCount: user.followingCount || 0,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSavedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedPosts',
      populate: { path: 'author', select: 'name username avatar isVerified' },
      options: { sort: { createdAt: -1 } },
    });
    return res.json({ success: true, posts: user.savedPosts || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, users: [] });
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
      ],
    }).select('name username avatar isVerified followersCount').limit(10);
    return res.json({ success: true, users: users.map(u => formatUser(u)) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
