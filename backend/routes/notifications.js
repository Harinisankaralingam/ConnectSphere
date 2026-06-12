const express = require('express');
const router = express.Router();
const { getNotifications, markAllRead, markRead, getUnreadCount } = require('../controllers/notificationController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getNotifications);
router.get('/unread-count', auth, getUnreadCount);
router.put('/mark-all-read', auth, markAllRead);
router.put('/:id/read', auth, markRead);

module.exports = router;
