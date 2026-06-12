const express = require('express');
const router = express.Router();
const { getComments, createComment, deleteComment, toggleLike } = require('../controllers/commentController');
const { auth, optionalAuth } = require('../middleware/auth');

// GET /api/comments/:postId
router.get('/:postId', optionalAuth, getComments);
// POST /api/comments/:postId
router.post('/:postId', auth, createComment);
// DELETE /api/comments/:id  (we need postId from body or just use comment id)
router.delete('/:id', auth, deleteComment);
// POST /api/comments/:id/like
router.post('/:id/like', auth, toggleLike);

module.exports = router;
