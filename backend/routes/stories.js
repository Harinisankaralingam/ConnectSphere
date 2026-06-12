const express = require('express');
const router = express.Router();
const { createStory, getStoriesFeed, viewStory, deleteStory } = require('../controllers/storyController');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/feed', auth, getStoriesFeed);
router.post('/', auth, upload.single('media'), createStory);
router.post('/:id/view', auth, viewStory);
router.delete('/:id', auth, deleteStory);

module.exports = router;
