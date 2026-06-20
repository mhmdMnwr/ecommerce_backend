const Notification = require('../models/notification.model');
const asyncWrapper = require('../middleware/asyncWrapper');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get current user's notifications (paginated)
const getMyNotifications = asyncWrapper(async (req, res) => {
    const userId = req.currentUser.id;
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total] = await Promise.all([
        Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip)
            .select('-__v'),
        Notification.countDocuments({ userId })
    ]);

    const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total
    };

    res.status(200).json(
        new ApiResponse(200, 'Notifications fetched successfully', notifications, pagination)
    );
});

// @desc    Get unread notification count
const getUnreadCount = asyncWrapper(async (req, res) => {
    const userId = req.currentUser.id;
    const count = await Notification.countDocuments({ userId, isRead: false });

    res.status(200).json(
        new ApiResponse(200, 'Unread count fetched', { count })
    );
});

// @desc    Mark a single notification as read
const markAsRead = asyncWrapper(async (req, res) => {
    const userId = req.currentUser.id;
    const { notificationId } = req.params;

    await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true }
    );

    res.status(200).json(
        new ApiResponse(200, 'Notification marked as read', null)
    );
});

// @desc    Mark all notifications as read
const markAllAsRead = asyncWrapper(async (req, res) => {
    const userId = req.currentUser.id;
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });

    res.status(200).json(
        new ApiResponse(200, 'All notifications marked as read', null)
    );
});

module.exports = {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
};
