const express = require('express');
const router = express.Router();
const {
  createPost, getFeed, getExplorePosts, getPost,
  getUserPosts, updatePost, deletePost,
  toggleLike, toggleSave, getTrendingHashtags
} = require('../controllers/postController');
const { auth, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/feed', auth, getFeed);
router.get('/explore', optionalAuth, getExplorePosts);
router.get('/trending', getTrendingHashtags);
router.get('/user/:username', optionalAuth, getUserPosts);
router.get('/:id', optionalAuth, getPost);
router.post('/', auth, upload.array('images', 5), createPost);
router.put('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);
router.post('/:id/like', auth, toggleLike);
router.post('/:id/save', auth, toggleSave);

module.exports = router;
