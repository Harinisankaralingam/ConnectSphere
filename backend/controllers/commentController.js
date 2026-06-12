const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// Get comments for a post
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId, parentComment: null })
      .populate('author', 'name username avatar isVerified')
      .populate({ path: 'replies', populate: { path: 'author', select: 'name username avatar isVerified' } })
      .sort({ createdAt: -1 });

    res.json({ success: true, comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create comment
exports.createComment = async (req, res) => {
  try {
    const { content, parentComment } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Comment content is required' });

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = await Comment.create({
      post: req.params.postId,
      author: req.user._id,
      content,
      parentComment: parentComment || null
    });

    if (parentComment) {
      await Comment.findByIdAndUpdate(parentComment, { $push: { replies: comment._id } });
    }

    await Post.findByIdAndUpdate(req.params.postId, { $inc: { commentsCount: 1 } });

    // Notification
    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'comment',
        post: post._id,
        comment: comment._id,
        message: `${req.user.name} commented on your post`
      });
    }

    await comment.populate('author', 'name username avatar isVerified');
    res.status(201).json({ success: true, comment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const post = await Post.findById(comment.post);
    const isOwner = comment.author.toString() === req.user._id.toString();
    const isPostOwner = post && post.author.toString() === req.user._id.toString();

    if (!isOwner && !isPostOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Comment.deleteOne({ _id: comment._id });
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });

    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Like comment
exports.toggleLike = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const isLiked = comment.likes.some(id => id.toString() === req.user._id.toString());
    if (isLiked) {
      comment.likes.pull(req.user._id);
      comment.likesCount = Math.max(0, comment.likesCount - 1);
    } else {
      comment.likes.push(req.user._id);
      comment.likesCount += 1;
    }
    await comment.save();

    res.json({ success: true, isLiked: !isLiked, likesCount: comment.likesCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
