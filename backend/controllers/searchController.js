const User = require('../models/User');
const Post = require('../models/Post');

exports.search = async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;
    if (!q || q.trim().length < 1) {
      return res.status(400).json({ success: false, message: 'Search query required' });
    }

    const query = q.trim();
    const results = {};

    if (type === 'all' || type === 'users') {
      const users = await User.find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { name: { $regex: query, $options: 'i' } }
        ]
      })
        .select('name username avatar isVerified followersCount bio')
        .limit(10);

      results.users = users.map(u => ({ ...u.toJSON(), avatarUrl: u.avatarUrl }));
    }

    if (type === 'all' || type === 'posts') {
      const posts = await Post.find({
        $or: [
          { content: { $regex: query, $options: 'i' } },
          { hashtags: query.replace('#', '').toLowerCase() }
        ],
        visibility: 'public'
      })
        .populate('author', 'name username avatar isVerified')
        .sort({ likesCount: -1 })
        .limit(10);

      results.posts = posts;
    }

    if (type === 'all' || type === 'hashtags') {
      const hashtagResult = await Post.aggregate([
        { $unwind: '$hashtags' },
        { $match: { hashtags: { $regex: query.replace('#', ''), $options: 'i' } } },
        { $group: { _id: '$hashtags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
      results.hashtags = hashtagResult;
    }

    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
