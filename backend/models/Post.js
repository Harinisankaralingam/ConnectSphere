const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    maxlength: [2200, 'Post content cannot exceed 2200 characters'],
    default: ''
  },
  images: [{
    type: String
  }],
  hashtags: [{
    type: String,
    lowercase: true
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  sharesCount: {
    type: Number,
    default: 0
  },
  savedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  visibility: {
    type: String,
    enum: ['public', 'followers', 'private'],
    default: 'public'
  },
  location: {
    type: String,
    default: ''
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Extract hashtags from content before saving
postSchema.pre('save', function(next) {
  if (this.content) {
    const hashtags = this.content.match(/#[a-zA-Z0-9_]+/g);
    if (hashtags) {
      this.hashtags = [...new Set(hashtags.map(tag => tag.slice(1).toLowerCase()))];
    }
  }
  next();
});

// Indexes for performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
