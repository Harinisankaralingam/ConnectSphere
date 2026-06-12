const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Follower = require('../models/Follower');

// Create post
exports.createPost = async (req, res) => {
  try {
    const { content, visibility, location } = req.body;
    const images = req.files ? req.files.map(f => `/uploads/posts/${f.filename}`) : [];

    if (!content && images.length === 0) {
      return res.status(400).json({ success: false, message: 'Post must have content or an image' });
    }

    const post = await Post.create({
      author: req.user._id,
      content: content || '',
      images,
      visibility: visibility || 'public',
      location: location || ''
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: 1 } });

    await post.populate('author', 'name username avatar isVerified');

    res.status(201).json({ success: true, message: 'Post created', post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get feed
exports.getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let authorIds = [req.user._id];
    if (req.user) {
      const following = await Follower.find({ follower: req.user._id }).select('following');
      authorIds = [...authorIds, ...following.map(f => f.following)];
    }

    const posts = await Post.find({ author: { $in: authorIds }, visibility: { $ne: 'private' } })
      .populate('author', 'name username avatar isVerified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ author: { $in: authorIds } });

    // Add isLiked flag
    const postsWithFlags = posts.map(p => ({
      ...p.toObject(),
      isLiked: p.likes.some(id => id.toString() === req.user._id.toString()),
      isSaved: false
    }));

    res.json({ success: true, posts: postsWithFlags, hasMore: skip + posts.length < total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get explore/public posts
exports.getExplorePosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ visibility: 'public' })
      .populate('author', 'name username avatar isVerified')
      .sort({ likesCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ success: true, posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get single post
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'name username avatar isVerified');
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const isLiked = req.user ? post.likes.some(id => id.toString() === req.user._id.toString()) : false;
    res.json({ success: true, post: { ...post.toObject(), isLiked } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get user posts
exports.getUserPosts = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const query = { author: user._id };
    if (!req.user || req.user._id.toString() !== user._id.toString()) {
      query.visibility = 'public';
    }

    const posts = await Post.find(query)
      .populate('author', 'name username avatar isVerified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(query);
    res.json({ success: true, posts, hasMore: skip + posts.length < total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update post
exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { content, visibility } = req.body;
    if (content !== undefined) post.content = content;
    if (visibility !== undefined) post.visibility = visibility;
    post.isEdited = true;
    await post.save();

    await post.populate('author', 'name username avatar isVerified');
    res.json({ success: true, message: 'Post updated', post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Post.deleteOne({ _id: post._id });
    await Comment.deleteMany({ post: post._id });
    await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: -1 } });
    await User.updateMany({ savedPosts: post._id }, { $pull: { savedPosts: post._id } });

    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Like / Unlike
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const isLiked = post.likes.some(id => id.toString() === req.user._id.toString());

    if (isLiked) {
      post.likes.pull(req.user._id);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      post.likes.push(req.user._id);
      post.likesCount += 1;

      // Notification
      if (post.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: post.author,
          sender: req.user._id,
          type: 'like',
          post: post._id,
          message: `${req.user.name} liked your post`
        });
      }
    }

    await post.save();
    res.json({ success: true, isLiked: !isLiked, likesCount: post.likesCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Save / Unsave post
exports.toggleSave = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const user = await User.findById(req.user._id);
    const isSaved = user.savedPosts.some(id => id.toString() === req.params.id);

    if (isSaved) {
      await User.findByIdAndUpdate(req.user._id, { $pull: { savedPosts: req.params.id } });
      await Post.findByIdAndUpdate(req.params.id, { $pull: { savedBy: req.user._id } });
    } else {
      await User.findByIdAndUpdate(req.user._id, { $push: { savedPosts: req.params.id } });
      await Post.findByIdAndUpdate(req.params.id, { $push: { savedBy: req.user._id } });
    }

    res.json({ success: true, isSaved: !isSaved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Trending hashtags
exports.getTrendingHashtags = async (req, res) => {
  try {
    const result = await Post.aggregate([
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({ success: true, hashtags: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
