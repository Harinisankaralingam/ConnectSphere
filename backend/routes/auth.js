'use strict';
const express = require('express');
const router = express.Router();
const { register, login, getMe, logout, changePassword } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);
router.post('/logout', auth, logout);
router.put('/change-password', auth, changePassword);

// Test route (dev only)
if (process.env.NODE_ENV !== 'production') {
  router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Auth routes working', timestamp: new Date() });
  });
}

module.exports = router;
