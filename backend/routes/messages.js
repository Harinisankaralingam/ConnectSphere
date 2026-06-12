'use strict';
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');

// Get conversations list
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Message.aggregate([
      { $match: { $or: [{ sender: userId }, { receiver: userId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$sender', userId] }, '$receiver', '$sender']
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$receiver', userId] }, { $eq: ['$isRead', false] }] }, 1, 0]
            }
          }
        }
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
      { $limit: 30 }
    ]);

    const populated = await User.populate(conversations, [
      { path: '_id', select: 'name username avatar isVerified isOnline lastSeen' }
    ]);

    res.json({ success: true, conversations: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get messages with user
router.get('/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id }
      ]
    })
      .populate('sender', 'name username avatar')
      .sort({ createdAt: 1 })
      .limit(100);

    // Mark as read
    await Message.updateMany(
      { sender: req.params.userId, receiver: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Send message
router.post('/:userId', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }
    const receiver = await User.findById(req.params.userId);
    if (!receiver) return res.status(404).json({ success: false, message: 'User not found' });

    const message = await Message.create({
      sender: req.user._id,
      receiver: req.params.userId,
      content: content.trim(),
    });
    await message.populate('sender', 'name username avatar');
    res.status(201).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
