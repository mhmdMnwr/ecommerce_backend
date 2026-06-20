const express = require('express');
const notificationController = require('../controllers/notification.controller');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);

router.route('/')
    .get(notificationController.getMyNotifications);

router.route('/unread-count')
    .get(notificationController.getUnreadCount);

router.route('/read/:notificationId')
    .patch(notificationController.markAsRead);

router.route('/read-all')
    .patch(notificationController.markAllAsRead);

module.exports = router;
