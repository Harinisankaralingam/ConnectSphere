'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const { auth, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Fixed-path routes MUST come before /:param routes
router.get('/suggested',        auth, ctrl.getSuggestedUsers);
router.get('/analytics',        auth, ctrl.getAnalytics);
router.get('/saved',            auth, ctrl.getSavedPosts);
router.put('/profile/update',   auth, ctrl.updateProfile);
router.post('/profile/avatar',  auth, upload.single('avatar'), ctrl.uploadAvatar);
router.post('/profile/cover',   auth, upload.single('cover'), ctrl.uploadCover);

// Param routes
router.get('/:username',              optionalAuth, ctrl.getProfile);
router.post('/:id/follow',            auth, ctrl.toggleFollow);
router.get('/:username/followers',    optionalAuth, ctrl.getFollowers);
router.get('/:username/following',    optionalAuth, ctrl.getFollowing);

module.exports = router;
