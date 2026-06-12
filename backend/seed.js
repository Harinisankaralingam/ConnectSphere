// seed.js — Run with: node seed.js
// Creates demo users, posts, follows, and comments

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const Follower = require('./models/Follower');
const Notification = require('./models/Notification');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/connectsphere';

const users = [
  {
    name: 'Demo User',
    username: 'demo',
    email: 'demo@connectsphere.app',
    password: 'demo123',
    bio: 'This is the demo account. Explore ConnectSphere! 🚀',
    isVerified: true,
  },
  {
    name: 'Alex Rivera',
    username: 'alexrivera',
    email: 'alex@example.com',
    password: 'password123',
    bio: 'Designer & creative thinker. Building beautiful products. ✨',
    isVerified: true,
  },
  {
    name: 'Sarah Chen',
    username: 'sarahchen',
    email: 'sarah@example.com',
    password: 'password123',
    bio: 'Full-stack developer | Open source contributor | Coffee addict ☕',
  },
  {
    name: 'Marcus Johnson',
    username: 'marcusj',
    email: 'marcus@example.com',
    password: 'password123',
    bio: 'Entrepreneur & startup founder. Building the future one line at a time.',
    isVerified: true,
  },
  {
    name: 'Priya Patel',
    username: 'priyap',
    email: 'priya@example.com',
    password: 'password123',
    bio: 'Product manager | UX enthusiast | Travel lover 🌍',
  },
];

const postContents = [
  'Just launched my new portfolio website! It took weeks of work but I\'m so proud of the result. Check it out and let me know what you think! #webdev #design #portfolio',
  'The best code is no code at all. Every line you write is a line that has to be maintained, a line that can have bugs, a line that other engineers have to understand. #programming #softwareengineering',
  'Morning coffee and code — the perfect combination. Started working on a new open-source project today and the excitement is real! #coding #opensource #developer',
  'Reminder: your worth is not measured by your productivity. Rest is part of the process. Take a break, recharge, and come back stronger. 💪 #mentalhealth #productivity',
  'Just got back from an amazing tech conference! The talks on AI and the future of work were mind-blowing. The future is coming faster than we think. #ai #tech #conference',
  'Design tip: White space is not empty space — it\'s breathing room for your user\'s eyes. Don\'t be afraid to use it generously. #ux #design #designtips',
  'Hot take: The best investment you can make is in your own skills. No stock market crash can take away what you know. #learning #growth #skills',
  'Working on a new startup idea. The problem space is huge and the timing feels right. More details soon... 👀 #startup #entrepreneur #building',
  'Grateful for this amazing community. You all push me to be better every day. Here\'s to connections that matter! 🙏 #gratitude #community #connectsphere',
  'TypeScript has completely changed how I write JavaScript. The type safety alone saves hours of debugging every week. Highly recommend making the switch! #typescript #javascript #webdev',
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clean up
    await Promise.all([
      User.deleteMany({}),
      Post.deleteMany({}),
      Comment.deleteMany({}),
      Follower.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log('🧹 Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const userData of users) {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`👤 Created user: @${user.username}`);
    }

    // Create follows (demo follows everyone, others follow demo)
    const demo = createdUsers[0];
    for (let i = 1; i < createdUsers.length; i++) {
      const other = createdUsers[i];
      await Follower.create({ follower: demo._id, following: other._id });
      await Follower.create({ follower: other._id, following: demo._id });
      await User.findByIdAndUpdate(demo._id, { $inc: { followersCount: 1, followingCount: 1 } });
      await User.findByIdAndUpdate(other._id, { $inc: { followersCount: 1, followingCount: 1 } });
    }
    // Also make other users follow each other
    await Follower.create({ follower: createdUsers[1]._id, following: createdUsers[2]._id });
    await User.findByIdAndUpdate(createdUsers[1]._id, { $inc: { followingCount: 1 } });
    await User.findByIdAndUpdate(createdUsers[2]._id, { $inc: { followersCount: 1 } });
    console.log('👥 Created follow relationships');

    // Create posts
    const createdPosts = [];
    for (let i = 0; i < postContents.length; i++) {
      const author = createdUsers[i % createdUsers.length];
      const post = await Post.create({
        author: author._id,
        content: postContents[i],
        visibility: 'public',
      });
      await User.findByIdAndUpdate(author._id, { $inc: { postsCount: 1 } });
      createdPosts.push(post);
    }
    console.log(`📝 Created ${createdPosts.length} posts`);

    // Add likes
    for (const post of createdPosts) {
      const likers = createdUsers.filter(u => u._id.toString() !== post.author.toString()).slice(0, 3);
      post.likes = likers.map(u => u._id);
      post.likesCount = likers.length;
      await post.save();
    }
    console.log('❤️  Added likes');

    // Add comments
    const commentTexts = [
      'This is amazing! 🔥',
      'Totally agree with this perspective.',
      'Great insight, thanks for sharing!',
      'This is exactly what I needed to read today.',
      'Bookmarked this for later, so valuable!',
      'Keep up the great work! 👏',
    ];

    for (const post of createdPosts.slice(0, 5)) {
      const commenter = createdUsers.find(u => u._id.toString() !== post.author.toString());
      if (commenter) {
        await Comment.create({
          post: post._id,
          author: commenter._id,
          content: commentTexts[Math.floor(Math.random() * commentTexts.length)],
        });
        await Post.findByIdAndUpdate(post._id, { $inc: { commentsCount: 1 } });
      }
    }
    console.log('💬 Added comments');

    // Add notifications for demo user
    await Notification.create({
      recipient: demo._id,
      sender: createdUsers[1]._id,
      type: 'follow',
      message: `${createdUsers[1].name} started following you`,
    });
    await Notification.create({
      recipient: demo._id,
      sender: createdUsers[2]._id,
      type: 'like',
      post: createdPosts[0]._id,
      message: `${createdUsers[2].name} liked your post`,
    });
    console.log('🔔 Added notifications');

    console.log('\n✅ Seed complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 Demo login credentials:');
    console.log('   Email:    demo@connectsphere.app');
    console.log('   Password: demo123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
