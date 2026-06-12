const Story = require('../models/Story');
const Follower = require('../models/Follower');

// Create story
exports.createStory = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Media is required' });

    const story = await Story.create({
      author: req.user._id,
      media: `/uploads/stories/${req.file.filename}`,
      text: req.body.text || '',
      backgroundColor: req.body.backgroundColor || '#4F46E5'
    });

    await story.populate('author', 'name username avatar isVerified');
    res.status(201).json({ success: true, story });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get stories feed (followed users + own)
exports.getStoriesFeed = async (req, res) => {
  try {
    const following = await Follower.find({ follower: req.user._id }).select('following');
    const ids = [...following.map(f => f.following), req.user._id];

    const stories = await Story.find({
      author: { $in: ids },
      expiresAt: { $gt: new Date() }
    })
      .populate('author', 'name username avatar isVerified')
      .sort({ createdAt: -1 });

    // Group by author
    const grouped = {};
    stories.forEach(story => {
      const authorId = story.author._id.toString();
      if (!grouped[authorId]) {
        grouped[authorId] = { author: story.author, stories: [] };
      }
      grouped[authorId].stories.push({
        ...story.toObject(),
        isViewed: story.viewers.some(v => v.user.toString() === req.user._id.toString())
      });
    });

    res.json({ success: true, storyGroups: Object.values(grouped) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// View story
exports.viewStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });

    const alreadyViewed = story.viewers.some(v => v.user.toString() === req.user._id.toString());
    if (!alreadyViewed) {
      story.viewers.push({ user: req.user._id });
      await story.save();
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete story
exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });
    if (story.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Story.deleteOne({ _id: story._id });
    res.json({ success: true, message: 'Story deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
